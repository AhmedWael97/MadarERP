#!/usr/bin/env bash
# Madaar ERP backend entrypoint.
#
# Deliberately NOT using `set -e`. Frappe / bench commands can fail in non-fatal
# ways (e.g. `bench migrate` on a partially-installed site, `install-app` on an
# already-installed app) — letting those fail the whole script just leaves the
# container dead with no UI to debug from. Instead we keep `set -o pipefail` for
# pipeline integrity and explicitly handle every command's success/failure.
set -o pipefail

# Every numbered step prints a banner so the logs are scannable end-to-end.
banner() {
  echo
  echo "================================================================"
  echo " >>> $*"
  echo "================================================================"
}
warn() { echo "    [WARN] $*" >&2; }
ok()   { echo "    [OK]   $*"; }
fail() { echo "    [FAIL] $*" >&2; }

cd /home/frappe/frappe-bench

SITES="${SITES:-dev.localhost}"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
REDIS_CACHE="${REDIS_CACHE:-redis-cache:6379}"
REDIS_QUEUE="${REDIS_QUEUE:-redis-queue:6379}"
REDIS_SOCKETIO="${REDIS_SOCKETIO:-redis-queue:6379}"

wait_for_port() {
  # Probes <host>:<port> with bash's built-in `/dev/tcp` — no need to apt-install
  # netcat. The redirect opens a TCP connection; failure to connect makes the
  # subshell return non-zero, which the `until` loop catches.
  local host="$1" port="$2" name="$3"
  local timeout_secs=120 elapsed=0
  until (echo > "/dev/tcp/${host}/${port}") >/dev/null 2>&1; do
    if [ "$elapsed" -ge "$timeout_secs" ]; then
      fail "${name} at ${host}:${port} never became reachable after ${timeout_secs}s — aborting"
      exit 1
    fi
    echo "Waiting for ${name} at ${host}:${port}..."
    sleep 2
    elapsed=$((elapsed + 2))
  done
}

banner "STEP 1: Waiting for dependent services"
wait_for_port "$DB_HOST" "$DB_PORT" "MariaDB"
wait_for_port "${REDIS_CACHE%%:*}" "${REDIS_CACHE##*:}" "Redis cache"
wait_for_port "${REDIS_QUEUE%%:*}" "${REDIS_QUEUE##*:}" "Redis queue"
ok "all dependent services reachable"

banner "STEP 2: Writing bench global config (DB + Redis URLs)"
bench set-config -g db_host "$DB_HOST"            || warn "set-config db_host failed"
bench set-config -g db_port "$DB_PORT"            || warn "set-config db_port failed"
bench set-config -g redis_cache "redis://${REDIS_CACHE}"        || warn "set-config redis_cache failed"
bench set-config -g redis_queue "redis://${REDIS_QUEUE}"        || warn "set-config redis_queue failed"
bench set-config -g redis_socketio "redis://${REDIS_SOCKETIO}"  || warn "set-config redis_socketio failed"

banner "STEP 3: Discovering bind-mounted madaar_* apps"
MADAAR_APPS_CANDIDATES=(
  madaar_core
  madaar_construction
  madaar_fleet
  madaar_workshop
  madaar_restaurant
  madaar_logistics
  madaar_ecommerce
  madaar_egov_tax
  madaar_events
)
MADAAR_APPS=()
for app in "${MADAAR_APPS_CANDIDATES[@]}"; do
  if [ -d "apps/${app}" ] && [ -f "apps/${app}/pyproject.toml" ]; then
    MADAAR_APPS+=("$app")
    ok "found apps/${app}"
  else
    warn "missing apps/${app} (not bind-mounted into the container) — will be skipped"
  fi
done

banner "STEP 4: pip-installing madaar_* apps into the bench virtualenv"
INSTALLED_MADAAR_APPS=()
for app in "${MADAAR_APPS[@]+"${MADAAR_APPS[@]}"}"; do
  if ./env/bin/pip install --quiet -e "apps/${app}"; then
    # Verify the package is actually importable from the venv — pip install can
    # "succeed" yet leave a package that fails on first import (rare, but possible
    # with editable installs and weird path configs).
    if ./env/bin/python -c "import ${app}" 2>/dev/null; then
      INSTALLED_MADAAR_APPS+=("$app")
      ok "${app}: pip install OK, import OK"
    else
      fail "${app}: pip install OK but 'import ${app}' fails — package layout is broken"
      ./env/bin/python -c "import ${app}" 2>&1 | sed 's/^/        /' >&2 || true
    fi
  else
    fail "${app}: pip install failed — see above for the pip error"
  fi
done

banner "STEP 5: Rewriting sites/apps.txt"
# Self-heal: keep every non-madaar entry that's already there (frappe, erpnext, etc.),
# then add only the madaar apps that survived BOTH pip install AND a smoke-test import.
python3 - "${INSTALLED_MADAAR_APPS[@]+"${INSTALLED_MADAAR_APPS[@]}"}" <<'PY'
import pathlib, sys
ok_madaar = sys.argv[1:]
p = pathlib.Path("sites/apps.txt")
existing = [ln.strip() for ln in p.read_text().splitlines() if ln.strip()]
keep = [ln for ln in existing if not ln.startswith("madaar_")]
for app in ok_madaar:
    if app not in keep:
        keep.append(app)
p.write_text("\n".join(keep) + "\n")
print(f"    [OK]   apps.txt → {keep}")
PY

banner "STEP 6: Per-site create/migrate + install-app loop"
first_site=""
for site in $SITES; do
  if [ -z "$first_site" ]; then
    first_site="$site"
  fi
  echo
  echo "  --- site: ${site} ---"
  if [ ! -f "sites/${site}/site_config.json" ]; then
    echo "    creating new site"
    if bench new-site "$site" \
        --mariadb-root-username root \
        --mariadb-root-password "$DB_ROOT_PASSWORD" \
        --admin-password "$ADMIN_PASSWORD" \
        --no-mariadb-socket \
        --install-app erpnext \
        --install-app madaar_core; then
      ok "site ${site} created with erpnext + madaar_core"
    else
      fail "bench new-site ${site} failed — backend will start anyway so you can inspect"
      continue
    fi
    echo "    running Frappe setup wizard via madaar_core.api.complete_setup"
    bench --site "$site" execute madaar_core.api.complete_setup \
      || warn "complete_setup failed; you can run it from the dashboard later"
  else
    echo "    existing site → running migrate"
    if bench --site "$site" migrate; then
      ok "migrate succeeded"
    else
      fail "migrate FAILED — site state is stale (likely from a previous broken boot)"
      warn "to recover, run:  docker compose down -v  &&  docker compose up --build"
      warn "(continuing anyway; the backend will start so you can investigate)"
    fi
    bench --site "$site" execute madaar_core.api.complete_setup >/dev/null 2>&1 || true
  fi

  # Install every importable madaar_* app that isn't yet on this site.
  for app in "${INSTALLED_MADAAR_APPS[@]+"${INSTALLED_MADAAR_APPS[@]}"}"; do
    if bench --site "$site" list-apps 2>/dev/null | grep -qx "$app"; then
      continue
    fi
    echo "    installing ${app}"
    if bench --site "$site" install-app "$app"; then
      ok "${app} installed on ${site}"
    else
      warn "install-app ${app} failed on ${site} — site can still boot, but ${app}'s DocTypes won't exist"
    fi
  done
done

if [ -n "$first_site" ]; then
  bench use "$first_site"                                  || warn "bench use ${first_site} failed"
  bench set-config -g default_site "$first_site"           || warn "set-config default_site failed"
fi
bench set-config -g developer_mode 1                       || warn "set-config developer_mode failed"
bench set-config -g serve_default_site true                || warn "set-config serve_default_site failed"

banner "STEP 7: Patching frappe.auth.get_logged_user for guest access"
# frappe-react-sdk calls /api/method/frappe.auth.get_logged_user on page load to
# check whether a session cookie is still valid. In Frappe v15 the function is
# whitelisted but lacks allow_guest=True, so any unauthenticated call returns 403.
# That causes the SDK's SWR to error-out and the auth state to get stuck.
# We patch the decorator in-place (safe: only touches the dev container, never
# the original image layer).
python3 - <<'PY'
import pathlib, sys
f = pathlib.Path("apps/frappe/frappe/auth.py")
txt = f.read_text()
old = "@frappe.whitelist()\ndef get_logged_user"
new = "@frappe.whitelist(allow_guest=True)\ndef get_logged_user"
if old in txt:
    f.write_text(txt.replace(old, new, 1))
    print("    [OK]   patched frappe.auth.get_logged_user → allow_guest=True")
else:
    print("    [WARN] patch target not found — already patched or Frappe API changed", file=sys.stderr)
PY

banner "STEP 8: Writing dev Procfile"
# frappe/erpnext:v15 ships a prod (gunicorn+supervisord) image; we need an explicit
# Procfile for `bench start` to drive honcho. We skip the local redis_* processes
# — those run as separate containers in compose.
# --no-reload: Werkzeug's stat-based reloader fires constantly on Windows
# bind-mounted volumes (inode/mtime noise), causing brief ECONNREFUSED windows
# every few seconds. Disable it — restart the container to pick up Python changes.
cat > Procfile <<'PROCFILE'
web: bench serve --port 8000 --noreload
socketio: node apps/frappe/socketio.js
schedule: bench schedule
worker_short: bench worker --queue short,default
worker_long: bench worker --queue long
PROCFILE
ok "Procfile written"

banner "STEP 8: Madaar ERP backend ready — starting bench"
echo "  sites:        ${SITES}"
echo "  HTTP:         http://localhost:8000 (Host header must match a site)"
echo "  socket.io:    http://localhost:9000"
echo "  madaar apps:  ${INSTALLED_MADAAR_APPS[@]+"${INSTALLED_MADAAR_APPS[@]}"}"
echo

exec bench start
