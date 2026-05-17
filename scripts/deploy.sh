#!/usr/bin/env bash
# Madaar ERP — deploy script.
#
# Works in two modes:
#
#   1. Server mode (Linux host with `bench` installed)
#      Runs: git pull → install madaar apps → bench migrate → rebuild SPA →
#            restart workers → copy dist to /var/www/madaar-spa.
#      Usage:  bash scripts/deploy.sh [site-name]
#              (defaults to MADAAR_SITE env var or "site1.local")
#
#   2. Local mode (Windows / dev machine — no `bench`)
#      Runs: git pull → install pnpm deps → regen pages → build the SPA.
#      `bench`-only steps are skipped automatically.
#
# Env overrides:
#   REPO_ROOT   — repo path (default: directory containing this script's parent)
#   BENCH_PATH  — frappe-bench path (default: /home/frappe/frappe-bench)
#   MADAAR_SITE — bench site name   (default: site1.local)

set -euo pipefail

# ── Auto-detect the repo root from the script's own location ─────────────────
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="${REPO_ROOT:-$( cd "$SCRIPT_DIR/.." && pwd )}"
SITE="${1:-${MADAAR_SITE:-site1.local}}"
BENCH_PATH="${BENCH_PATH:-/home/frappe/frappe-bench}"

echo "▸ Repo root: $REPO_ROOT"
cd "$REPO_ROOT"

# ── 1. Pull latest ───────────────────────────────────────────────────────────
echo "▸ Pulling latest from main"
git fetch --all --prune
git checkout main
git pull --ff-only || echo "  (pull skipped — already up to date or local changes present)"

# ── 2. Backend (server mode only) ────────────────────────────────────────────
HAS_BENCH=0
if command -v bench >/dev/null 2>&1 && [ -d "$BENCH_PATH" ]; then
    HAS_BENCH=1
fi

if [ "$HAS_BENCH" = "1" ]; then
    echo "▸ Installing / refreshing Madaar apps inside bench at $BENCH_PATH"
    cd "$BENCH_PATH"
    for app in madaar_core madaar_construction madaar_ecommerce madaar_egov_tax \
               madaar_events madaar_fleet madaar_logistics madaar_restaurant \
               madaar_workshop ; do
        if [ ! -d "apps/$app" ]; then
            bench get-app "file://$REPO_ROOT/madaar-apps/$app" || true
            bench --site "$SITE" install-app "$app" || true
        fi
    done

    echo "▸ Running migrations (super-admin / LMS / categories / custom-field patch)"
    bench --site "$SITE" migrate

    echo "▸ Clearing cache + restarting workers"
    bench --site "$SITE" clear-cache
    bench --site "$SITE" clear-website-cache
    bench restart || sudo supervisorctl restart all || true
    cd "$REPO_ROOT"
else
    echo "▸ Skipping bench steps — 'bench' not found or BENCH_PATH ($BENCH_PATH) missing."
    echo "  (Local dev machine? That's fine. Run this script on the Frappe host to migrate the DB.)"
fi

# ── 3. Frontend build (always run) ───────────────────────────────────────────
echo "▸ Building the React frontend"
cd "$REPO_ROOT/frontend"

if command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile || pnpm install
    pnpm run gen   || echo "  (gen script failed — continuing)"
    pnpm run build
elif command -v npm >/dev/null 2>&1; then
    npm install
    npm run gen   || echo "  (gen script failed — continuing)"
    npm run build
else
    echo "  ✗ Neither pnpm nor npm found — cannot build the frontend."
    exit 1
fi

# ── 4. Copy dist over (server-mode optional) ─────────────────────────────────
if [ "$HAS_BENCH" = "1" ] && [ -d "/var/www/madaar-spa" ]; then
    echo "▸ Publishing SPA bundle to /var/www/madaar-spa"
    rsync -av --delete "$REPO_ROOT/frontend/dist/" /var/www/madaar-spa/
    sudo systemctl reload nginx || true
fi

echo "✓ Deploy complete (site=$SITE, mode=$([ "$HAS_BENCH" = "1" ] && echo server || echo local))"
