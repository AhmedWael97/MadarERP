# Madaar ERP — SaaS on Frappe/ERPNext + React

Replicates the scanned "مدار ERP" (Delta Enterprise) Laravel dashboard, with
**Frappe + ERPNext + custom Frappe apps** as the backend and **React + Vite**
as the SPA. Every customer is a separate Frappe **site** on its own subdomain.

- **New contributor or AI agent?** Read [ONBOARDING.md](./ONBOARDING.md) first — fast path, ~10 minutes.
- **Full design rationale**: [plan.md](./plan.md).

## Quick start

```bash
cp .env.example .env

# Bring up MariaDB, Redis, Frappe (with ERPNext + madaar_core), and the React dev server.
docker compose up --build

# First boot creates three sites: dev.localhost, t1.localhost, admin.localhost
# Each gets erpnext + madaar_core installed. Default admin password is "admin".
```

Add the dev hostnames to your hosts file (or use `nip.io`):

```text
127.0.0.1   dev.localhost t1.localhost admin.localhost
```

Then open:

- **Frontend (React)**: <http://dev.localhost:5173>
- **Frappe Desk (legacy admin UI)**: <http://dev.localhost:8000/app>

## Layout

```
.
├─ docker/                  # Dockerfiles + backend entrypoint
├─ docker-compose.yml       # db + redis + backend + frontend
├─ erpnext/                 # vendored ERPNext source (reference)
├─ frontend/                # React + Vite SPA (talks to Frappe REST)
│  ├─ scripts/              # token + page generators
│  └─ src/
├─ madaar-apps/             # our Frappe apps
│  └─ madaar_core/          # required on every tenant site
├─ scan_output/             # the original Laravel scan (drives the generators)
└─ plan.md                  # full implementation plan
```

## Useful commands

```bash
# Run the page scaffolder against scan_output/data/pages.json
docker compose exec frontend pnpm gen

# Generate Tailwind tokens from the scan
docker compose exec frontend pnpm gen:tokens

# Open a bench shell inside the backend container
docker compose exec backend bash
# then inside the container:
bench --site dev.localhost console
```
