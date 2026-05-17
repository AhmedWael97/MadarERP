app_name = "madaar_events"
app_title = "Madaar Events"
app_publisher = "Madaar Software"
app_description = "Culture Wheel — 12-stage event lifecycle (intake, scheduling, contracting, marketing, ops, execution, closure)."
app_license = "MIT"
app_version = "0.0.1"

# -----------------------------------------------------------------------------
# Lifecycle guards. Each guard enforces one of the four hard business gates
# called out in new_module.md:
#   1. no contract  -> no confirmation
#   2. no HR avail  -> no contract
#   3. no free slot -> no event creation
#   4. no website   -> no marketing
# See madaar_events/rules.py for the implementation. Tenant feature limits are
# enforced globally by madaar_core's "*" doc_events — we don't duplicate that
# wiring here; we only add per-doctype business rules.
# -----------------------------------------------------------------------------
doc_events = {
    "Madaar Event Schedule": {
        "validate": "madaar_events.rules.schedule_must_be_conflict_free",
    },
    "Madaar Event Contract": {
        "validate": "madaar_events.rules.contract_requires_hr_availability",
        "on_update": "madaar_events.rules.contract_advance_request_state",
    },
    "Madaar Event Publication": {
        "validate": "madaar_events.rules.publication_requires_contract_signed",
        "on_update": "madaar_events.rules.publication_advance_request_state",
    },
    "Madaar Event Marketing Campaign": {
        "validate": "madaar_events.rules.marketing_requires_publication",
        "on_update": "madaar_events.rules.marketing_advance_request_state",
    },
    "Madaar Event Request": {
        "before_save": "madaar_events.rules.request_recompute_intake_state",
    },
    "Madaar Event Day Checklist": {
        "validate": "madaar_events.rules.day_checklist_requires_all_gates",
    },
    "Madaar Event Closure": {
        "on_update": "madaar_events.rules.closure_finalize_request",
    },
}

# Scheduled jobs — SLA timers, daily ops reminders, post-event archival.
scheduler_events = {
    "hourly": [
        "madaar_events.automations.send_stage_reminders",
    ],
    "daily": [
        "madaar_events.automations.sla_sweep",
        "madaar_events.automations.archive_closed_events",
    ],
}

# Whitelisted REST endpoints surfaced to the SPA — see madaar_events/api.py.
override_whitelisted_methods = {}

# Fixtures shipped with the app: roles, event types, venues, workflows.
# Filters are used by `bench export-fixtures` to round-trip back to disk — keep
# them aligned with the fixture JSON files in madaar_events/fixtures/.
fixtures = [
    {"dt": "Role", "filters": [["role_name", "in", [
        "Event Coordinator",
        "Event Dept Head",
        "Event Marketing",
        "Event Operations",
        "Event Finance",
        "Event Legal",
        "Event HR",
    ]]]},
    {"dt": "Madaar Event Type"},
    {"dt": "Madaar Event Venue"},
    {"dt": "Workflow", "filters": [["name", "in", [
        "Madaar Event Request Workflow",
        "Madaar Event Contract Workflow",
    ]]]},
    # State + action names are shared with built-in Frappe states ("Draft",
    # "Rejected") and not prefixed; the export filter scopes to the new ones we
    # add so we don't accidentally clobber Frappe's seeded rows on re-export.
    {"dt": "Workflow State", "filters": [["workflow_state_name", "in", [
        "Awaiting Coordinator", "Under Validation", "Incomplete", "Communicated",
        "Scheduled", "Resource Planned", "Contracted", "Finance Cleared",
        "Published", "Marketing Active", "Operations Notified", "Event Day", "Closed",
        "HR Pending", "Legal Review", "Awaiting Signature", "Signed", "Cancelled",
    ]]]},
    {"dt": "Workflow Action Master", "filters": [["workflow_action_name", "like", "Event %"]]},
]
