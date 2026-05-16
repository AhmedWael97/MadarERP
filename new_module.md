## Plan: Events Module (Madaar App)

Build a new standalone Frappe app for Events, with full 12-stage event lifecycle and internal-initiative flow delivered first, while keeping external-request flow ready in the same data model and workflows. Reuse existing Madaar app conventions (hooks, DocType scaffold pattern, feature limits, and frontend generated pages wiring).

**Steps**
1. Phase 0 — Domain Blueprint and naming contracts: define canonical DocType and workflow names, status models, and ownership matrix for all 12 stages; lock Arabic/English labels and module slug. This blocks all later backend/frontend work.
2. Phase 1 — App scaffold and registration (*depends on 1*): create new app `madaar_events` with the same structure used by existing apps and register core metadata in `hooks.py`, README, and module descriptors.
3. Phase 2 — Core data model (*depends on 2*): implement foundational DocTypes covering entry sources, request intake, scheduling, resource planning, contracts, finance/legal, web publication, marketing activation, operations notifications, event-day checklist, and post-event closure.
4. Phase 3 — Rule engine and lifecycle guards (*depends on 3*): enforce business gates in server-side validations/workflow transitions: no contract = no confirmation; no HR availability = no contract; no available slot = no event creation; no website publication = no marketing start.
5. Phase 4 — Internal initiative flow first (*depends on 4*): implement default creation wizard/action path for internal initiatives and coordinator assignment, then expose equivalent path for external requests without changing core entities.
6. Phase 5 — Cross-module integrations (*parallel with 6 after 4*): wire HR availability checks, calendar/venue conflicts, finance/legal handoff, and website publishing payloads through whitelisted APIs/jobs.
7. Phase 6 — Permissions and feature limits (*parallel with 5 after 4*): define Events roles (Coordinator, Dept Head, Marketing, Operations, Finance, Legal, HR) with DocType/action permissions and optional package limit keys via `madaar_core.limits.DOCTYPE_TO_FEATURE`.
8. Phase 7 — Frontend routing and generated pages (*depends on 3, can iterate with 5/6*): add route/doctype mapping for new pages, generate list/form pages from the existing page-generation pipeline, and handcraft overrides for complex workflow/checklist screens.
9. Phase 8 — Automations and notifications (*depends on 5*): add assignment, reminder, SLA timers, and stage transition notifications for each responsible team.
10. Phase 9 — Data migration + fixtures (*depends on 3*): seed statuses, templates, checklists, and ticketing/event-type options as fixtures; add migration-safe patches for future schema changes.
11. Phase 10 — Verification and rollout readiness (*depends on 7,8,9*): run integration tests for all 12 stages, role-based tests, and regression checks with tenant bootstrap/package constraints.

**Relevant files**
- `h:/coupons/erp_mr_adham/madaar-apps/scripts/scaffold-doctypes.mjs` — reuse APPS spec pattern as template for new app DocType generation decisions.
- `h:/coupons/erp_mr_adham/madaar-apps/madaar_core/madaar_core/hooks.py` — reuse hook conventions and scheduler/doc_events integration style.
- `h:/coupons/erp_mr_adham/madaar-apps/madaar_core/madaar_core/limits.py` — extend `DOCTYPE_TO_FEATURE` for package-gated Events entities when needed.
- `h:/coupons/erp_mr_adham/madaar-apps/madaar_core/madaar_core/api.py` — reference whitelisted API style and bootstrap payload extensions.
- `h:/coupons/erp_mr_adham/madaar-apps/madaar_events/` — new app root (to be created) for DocTypes, workflows, fixtures, and APIs.
- `h:/coupons/erp_mr_adham/frontend/scripts/url-to-doctype.map.mjs` — add Events URL-to-DocType mapping for generated pages.
- `h:/coupons/erp_mr_adham/frontend/src/_generated/pages.manifest.ts` — consume generated Events routes.
- `h:/coupons/erp_mr_adham/frontend/src/components/erp/FormShell.tsx` — reuse generic form shell behavior for DocType-driven forms.
- `h:/coupons/erp_mr_adham/frontend/src/app/router.tsx` — add/verify non-generated override routes for complex workflow views.
- `h:/coupons/erp_mr_adham/new_module.md` — source business process and rule definitions.

**Verification**
1. Backend integrity: run `bench --site <tenant> migrate` and create one record through each stage; verify all four business gates are hard-blocked server-side when prerequisites are missing.
2. Workflow path tests: execute internal-initiative end-to-end first, then external-request path; both must converge to the same event confirmation and post-event closure flow.
3. Integration tests: validate HR availability check, calendar conflict prevention, finance/legal handoff creation, and website publication precondition before marketing activation.
4. Permission tests: each role can access only its assigned stages/actions; unauthorized transitions must fail with permission errors.
5. Frontend regression: generated pages render for all Events DocTypes; custom checklist/event-day views load with correct translations and status badges.
6. SaaS/package behavior: if limits are enabled, hitting limit blocks insert and surfaces consistent UI/API error.

**Decisions**
- Module location: new standalone app under `madaar-apps`.
- Delivery scope: full 12-stage workflow.
- Priority: internal initiative flow implemented first, external request path second but on same core model.
- Included scope: backend data/workflow rules, integrations, permissions, frontend routes/pages, verification.
- Excluded (phase-1): advanced analytics dashboards, AI scoring/ranking, third-party marketing platform sync beyond basic handoff payloads.

**Further Considerations**
1. Event granularity recommendation: use a single `Culture Event` aggregate with child tables per phase to avoid cross-DocType fragmentation unless audit/legal requires strict document separation.
2. Calendar model recommendation: reserve using a dedicated booking DocType linked to venue resources instead of writing directly into generic Event for conflict-safe locking.
3. Contracting recommendation: separate draft agreement vs signed contract DocTypes if legal versioning/signature traceability is mandatory.