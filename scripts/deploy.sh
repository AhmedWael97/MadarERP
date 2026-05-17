#!/usr/bin/env bash
# Madaar ERP — server deploy script.
#
# Run this on the production / staging host AFTER `git push` lands on `main`.
# Assumes:
#   - bench is installed and the site exists at the path below
#   - the working tree is /opt/madaar (adjust `REPO_ROOT` if you put it elsewhere)
#   - the React frontend builds with pnpm
#
# Usage:  bash scripts/deploy.sh [site-name]
#         (defaults to MADAAR_SITE env var or "site1.local")

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/opt/madaar}"
SITE="${1:-${MADAAR_SITE:-site1.local}}"
BENCH_PATH="${BENCH_PATH:-/home/frappe/frappe-bench}"

echo "▸ Pulling latest from main"
cd "$REPO_ROOT"
git fetch --all --prune
git checkout main
git pull --ff-only

echo "▸ Installing / refreshing Madaar apps inside bench"
cd "$BENCH_PATH"
for app in madaar_core madaar_construction madaar_ecommerce madaar_egov_tax \
           madaar_events madaar_fleet madaar_logistics madaar_restaurant \
           madaar_workshop ; do
    if [ ! -d "apps/$app" ]; then
        bench get-app "file://$REPO_ROOT/madaar-apps/$app" || true
        bench --site "$SITE" install-app "$app" || true
    fi
done

echo "▸ Running migrations (this picks up the new super-admin / LMS / category doctypes + custom-field patch)"
bench --site "$SITE" migrate

echo "▸ Clearing cache + restarting workers"
bench --site "$SITE" clear-cache
bench --site "$SITE" clear-website-cache
bench restart || sudo supervisorctl restart all || true

echo "▸ Building the React frontend"
cd "$REPO_ROOT/frontend"
pnpm install --frozen-lockfile || pnpm install
pnpm run gen   # regenerates _generated/pages from scan_output if needed
pnpm run build

# If the frontend is served from nginx static files, copy the dist over.
if [ -d "/var/www/madaar-spa" ]; then
    rsync -av --delete "$REPO_ROOT/frontend/dist/" /var/www/madaar-spa/
    sudo systemctl reload nginx || true
fi

echo "✓ Deploy complete on site=$SITE"
