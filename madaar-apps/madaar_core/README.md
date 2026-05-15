# Madaar Core

Required Frappe app installed on every Madaar ERP tenant site.

Provides:

- Egyptian regional custom fields (tax IDs, e-invoice slots) — registered via fixtures.
- Feature-gating engine (`madaar_core.limits.enforce`) called on every DocType `before_insert`.
- Tenant identity singleton (`Madaar Settings`) holding the package + feature limits pushed by the SaaS control plane.
- Custom DocTypes: `Madaar Treasury`, `Madaar Cheque`, `Asset Accident Log`.
- Bootstrap routine (`madaar_core.setup.bootstrap_tenant`) called by the control plane's provisioning job after `bench new-site` to seed COA, fiscal year, naming series, default warehouse, VAT and create the owner user.

See [plan.md](../../plan.md) for the full design.
