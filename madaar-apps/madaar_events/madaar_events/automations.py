"""Scheduled background jobs for the Culture Wheel.

Hooked from ``hooks.py::scheduler_events``:

    hourly:  send_stage_reminders   — nudge owners of requests stuck > N hours in
                                       a non-terminal workflow state.
    daily:   sla_sweep              — promote requests past their SLA into a
                                       flagged state and emit a notification.
    daily:   archive_closed_events  — mark closures older than the retention
                                       window as Archived so list views stay light.

Each job is idempotent and resilient: it logs and continues on per-record
failures instead of aborting the whole sweep, because a scheduled job that
crashes leaves nothing visible to the user.
"""
from __future__ import annotations

import frappe
from frappe.utils import add_days, add_to_date, now_datetime


# ---------------------------------------------------------------------------
# Tuning constants. Conservative defaults that can later be moved into a
# Madaar Events Settings single if the business needs per-tenant tuning.
# ---------------------------------------------------------------------------
# How long a request can sit in a workflow state before we nudge the coordinator.
STAGE_REMINDER_HOURS = 24
# SLA budget — once exceeded, the request is flagged Incomplete and surfaced.
SLA_HOURS_BY_STATE: dict[str, int] = {
    "Draft": 48,
    "Awaiting Coordinator": 24,
    "Under Validation": 72,
    "Incomplete": 168,
    "Communicated": 168,
    "Scheduled": 240,
    "Resource Planned": 168,
    "Contracted": 240,
    "Finance Cleared": 168,
    "Published": 720,
    "Marketing Active": 720,
    "Operations Notified": 168,
}
# Closures older than this are moved to Archived to keep list pages snappy.
CLOSURE_ARCHIVE_AFTER_DAYS = 60

# Terminal states — never reminded, never SLA-swept.
_TERMINAL = {"Closed", "Rejected"}


# ---------------------------------------------------------------------------
# hourly: ping the coordinator on stale requests
# ---------------------------------------------------------------------------
def send_stage_reminders() -> None:
    """Notify the coordinator of every Madaar Event Request that hasn't moved
    state in ``STAGE_REMINDER_HOURS``.

    Uses Frappe's ToDo so the reminder shows up in /app/todo and the email
    digest without us re-implementing email plumbing.
    """
    cutoff = add_to_date(now_datetime(), hours=-STAGE_REMINDER_HOURS)
    stale = frappe.get_all(
        "Madaar Event Request",
        filters={
            "modified": ("<", cutoff),
            "workflow_state": ("not in", list(_TERMINAL)),
        },
        fields=["name", "workflow_state", "coordinator", "event_title"],
        limit_page_length=200,
    )

    for row in stale:
        if not row.get("coordinator"):
            continue
        try:
            # `ToDo.assigned_by` defaults to Administrator for system jobs.
            existing = frappe.db.exists(
                "ToDo",
                {
                    "reference_type": "Madaar Event Request",
                    "reference_name": row["name"],
                    "status": "Open",
                    "description": ("like", "%stage reminder%"),
                },
            )
            if existing:
                continue
            frappe.get_doc({
                "doctype": "ToDo",
                "owner": _coordinator_user(row["coordinator"]),
                "reference_type": "Madaar Event Request",
                "reference_name": row["name"],
                "description": f"Event stage reminder: {row['event_title']} stuck in {row['workflow_state']} > {STAGE_REMINDER_HOURS}h",
                "priority": "Medium",
                "status": "Open",
            }).insert(ignore_permissions=True)
        except Exception:
            frappe.log_error(
                title="madaar_events.send_stage_reminders",
                message=frappe.get_traceback(),
            )

    frappe.db.commit()


# ---------------------------------------------------------------------------
# daily: SLA sweep
# ---------------------------------------------------------------------------
def sla_sweep() -> None:
    """Flag requests that have blown past their SLA budget for the current state.

    We bump them into ``Incomplete`` (an existing intake state, so no fixture
    migration needed) and write an audit comment that names the previous state,
    so the coordinator can see at a glance that the SLA fired automatically.
    """
    now = now_datetime()
    for state, hours in SLA_HOURS_BY_STATE.items():
        cutoff = add_to_date(now, hours=-hours)
        breached = frappe.get_all(
            "Madaar Event Request",
            filters={
                "workflow_state": state,
                "modified": ("<", cutoff),
            },
            fields=["name"],
            limit_page_length=500,
        )
        for row in breached:
            try:
                frappe.db.set_value("Madaar Event Request", row["name"], "workflow_state", "Incomplete")
                frappe.get_doc({
                    "doctype": "Comment",
                    "comment_type": "Info",
                    "reference_doctype": "Madaar Event Request",
                    "reference_name": row["name"],
                    "content": f"[SLA] Auto-flagged Incomplete after {hours}h in '{state}'.",
                }).insert(ignore_permissions=True)
            except Exception:
                frappe.log_error(
                    title="madaar_events.sla_sweep",
                    message=frappe.get_traceback(),
                )

    frappe.db.commit()


# ---------------------------------------------------------------------------
# daily: archive closed events
# ---------------------------------------------------------------------------
def archive_closed_events() -> None:
    """Stamp closures older than ``CLOSURE_ARCHIVE_AFTER_DAYS`` with an Archived
    closure_status. The status uses an existing select option pattern — if the
    DocType's `closure_status` field doesn't include ``Archived``, we
    short-circuit so the job never trips a validation error.
    """
    # Defensive guard: ensure the option exists before writing.
    meta = frappe.get_meta("Madaar Event Closure")
    field = meta.get_field("closure_status")
    options = (field.options or "").split("\n") if field else []
    if "Archived" not in options:
        # Field doesn't carry an Archived option yet — skip silently rather than
        # raise. We don't want the daily scheduler to fail on a missing option.
        return

    cutoff = add_days(now_datetime(), -CLOSURE_ARCHIVE_AFTER_DAYS)
    aged = frappe.get_all(
        "Madaar Event Closure",
        filters={
            "closure_status": "Closed",
            "closed_date": ("<", cutoff),
        },
        fields=["name"],
        limit_page_length=500,
    )
    for row in aged:
        try:
            frappe.db.set_value("Madaar Event Closure", row["name"], "closure_status", "Archived")
        except Exception:
            frappe.log_error(
                title="madaar_events.archive_closed_events",
                message=frappe.get_traceback(),
            )

    frappe.db.commit()


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _coordinator_user(employee_name: str) -> str:
    """Resolve a Coordinator (Employee) → User. Falls back to Administrator so
    the ToDo always gets an owner even when the Employee record has no linked
    user account.
    """
    user = frappe.db.get_value("Employee", employee_name, "user_id")
    return user or "Administrator"
