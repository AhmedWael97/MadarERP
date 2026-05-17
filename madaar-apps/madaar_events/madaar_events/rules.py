"""Lifecycle guards for the Culture Wheel.

Four hard business gates are enforced server-side (see new_module.md):

    Gate A — no available slot   -> no event creation       (schedule_must_be_conflict_free)
    Gate B — no HR availability  -> no contract             (contract_requires_hr_availability)
    Gate C — no signed contract  -> no event confirmation   (publication_requires_contract_signed)
    Gate D — no website pub      -> no marketing activation (marketing_requires_publication)

The guards also keep `Madaar Event Request.workflow_state` in sync so that the
Request acts as the single source of truth for what stage a request is at — UI
list views, dashboards, and SLA timers all read from that one field.
"""
from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import now_datetime


# ---------------------------------------------------------------------------
# Stage 2/3 — intake validation
# ---------------------------------------------------------------------------
def request_recompute_intake_state(doc, method=None):
    """Derive `intake_validation_state` from the validation checklist.

    Coordinator marks each checklist row complete; once all are complete we flip
    state to Complete so downstream stages unblock. If state was explicitly set
    to Rejected we don't override it.
    """
    if doc.intake_validation_state == "Rejected":
        return

    items = doc.get("validation_items") or []
    if not items:
        # No checklist authored yet — leave whatever the user set.
        return

    all_done = all(bool(row.is_complete) for row in items)
    doc.intake_validation_state = "Complete" if all_done else "Incomplete"

    # Sync the request's workflow_state when intake clears.
    if all_done and doc.workflow_state in ("Draft", "Awaiting Coordinator", "Under Validation", "Incomplete"):
        if doc.initial_contact_sent:
            doc.workflow_state = "Communicated"
        else:
            doc.workflow_state = "Under Validation"


# ---------------------------------------------------------------------------
# Gate A — calendar conflicts (Stage 4)
# ---------------------------------------------------------------------------
def schedule_must_be_conflict_free(doc, method=None):
    """Block a Madaar Event Schedule that overlaps any existing confirmed booking
    in the same venue. Tentative-vs-tentative is allowed (a coordinator may
    pencil in two options for the same slot), but tentative cannot conflict
    with a confirmed booking, and two confirmed bookings can never overlap.
    """
    if not (doc.start_datetime and doc.end_datetime and doc.venue):
        return  # let Frappe's reqd flagging surface the missing field instead

    if doc.start_datetime >= doc.end_datetime:
        frappe.throw(_("Schedule end must be after start."), frappe.ValidationError)

    overlaps = frappe.db.sql(
        """
        SELECT name, booking_status, start_datetime, end_datetime
          FROM `tabMadaar Event Schedule`
         WHERE venue = %(venue)s
           AND name != %(self_name)s
           AND booking_status != 'Cancelled'
           AND start_datetime < %(end)s
           AND end_datetime   > %(start)s
        """,
        {
            "venue": doc.venue,
            "self_name": doc.name or "",
            "start": doc.start_datetime,
            "end": doc.end_datetime,
        },
        as_dict=True,
    )

    for row in overlaps:
        # Allow tentative-vs-tentative; block anything else.
        if doc.booking_status == "Confirmed" or row["booking_status"] == "Confirmed":
            frappe.throw(
                _("Venue {0} is already booked ({1}) from {2} to {3} by {4}.").format(
                    doc.venue, row["booking_status"], row["start_datetime"], row["end_datetime"], row["name"]
                ),
                frappe.ValidationError,
            )

    doc.conflict_checked = 1

    # Reflect scheduling back onto the request.
    if doc.event_request:
        _bump_request(doc.event_request, target_state="Scheduled", only_if_in=("Communicated", "Under Validation", "Draft", "Awaiting Coordinator"))


# ---------------------------------------------------------------------------
# Gate B — HR availability before signing (Stage 6)
# ---------------------------------------------------------------------------
def contract_requires_hr_availability(doc, method=None):
    """A contract cannot move past 'Awaiting Signature' without HR ticking the
    `hr_availability_confirmed` checkbox. Legal review is a softer gate but is
    required before 'Signed'.
    """
    if doc.workflow_state in ("Awaiting Signature", "Signed"):
        if not doc.hr_availability_confirmed:
            frappe.throw(
                _("HR must confirm staff availability before this contract can be sent for signature."),
                frappe.ValidationError,
            )
        if doc.workflow_state == "Signed" and not doc.legal_reviewed:
            frappe.throw(
                _("Legal review must be completed before a contract is marked Signed."),
                frappe.ValidationError,
            )

    if doc.workflow_state == "Signed" and not doc.signed_date:
        doc.signed_date = frappe.utils.nowdate()

    # Stamp the confirmation timestamps when a flag flips true.
    prev = doc.get_doc_before_save() if not doc.is_new() else None
    if doc.hr_availability_confirmed and (not prev or not prev.hr_availability_confirmed):
        doc.hr_confirmed_on = now_datetime()
    if doc.legal_reviewed and (not prev or not prev.legal_reviewed):
        doc.legal_reviewed_on = now_datetime()


def contract_advance_request_state(doc, method=None):
    """Push the parent request forward once the contract is signed."""
    if doc.workflow_state == "Signed" and doc.event_request:
        _bump_request(doc.event_request, target_state="Contracted")


# ---------------------------------------------------------------------------
# Gate C — contract signed before publication (Stage 8)
# ---------------------------------------------------------------------------
def publication_requires_contract_signed(doc, method=None):
    """Block publication unless there is at least one Signed contract for this
    request. Drafts can be authored freely; only flipping `publication_state`
    to Published is gated.
    """
    if doc.publication_state != "Published":
        return

    if not doc.event_request:
        frappe.throw(_("Publication must be linked to an event request."), frappe.ValidationError)

    signed = frappe.db.exists(
        "Madaar Event Contract",
        {"event_request": doc.event_request, "workflow_state": "Signed"},
    )
    if not signed:
        frappe.throw(
            _("A signed contract is required before publishing this event."),
            frappe.ValidationError,
        )

    if not doc.published_on:
        doc.published_on = now_datetime()


def publication_advance_request_state(doc, method=None):
    if doc.publication_state == "Published" and doc.event_request:
        _bump_request(doc.event_request, target_state="Published")


# ---------------------------------------------------------------------------
# Gate D — publication before marketing (Stage 9)
# ---------------------------------------------------------------------------
def marketing_requires_publication(doc, method=None):
    """A campaign cannot move from Draft to Active unless its linked
    publication is in Published state.
    """
    if doc.campaign_status != "Active":
        return

    if not doc.publication:
        frappe.throw(_("Campaign must be linked to a publication before activation."), frappe.ValidationError)

    state = frappe.db.get_value("Madaar Event Publication", doc.publication, "publication_state")
    if state != "Published":
        frappe.throw(
            _("Linked publication must be Published before activating this marketing campaign."),
            frappe.ValidationError,
        )


def marketing_advance_request_state(doc, method=None):
    if doc.campaign_status == "Active" and doc.event_request:
        _bump_request(doc.event_request, target_state="Marketing Active")


# ---------------------------------------------------------------------------
# Stage 11 — event-day gates
# ---------------------------------------------------------------------------
def day_checklist_requires_all_gates(doc, method=None):
    """An event-day checklist cannot be marked 'Smooth' unless all six core
    gates are ticked. Marking 'Issues' is always allowed (that's the whole
    point of recording incidents).
    """
    if doc.execution_status != "Smooth":
        return

    missing = [
        label for label, ok in [
            (_("Coordinator Onsite"), doc.coordinator_onsite),
            (_("Team Attendance"), doc.team_attendance),
            (_("Technical Setup"), doc.technical_setup_ready),
            (_("Rehearsals"), doc.rehearsals_completed),
            (_("Doors & Ticketing"), doc.doors_ticketing_ready),
            (_("Safety Plan"), doc.safety_plan_verified),
        ] if not ok
    ]
    if missing:
        frappe.throw(
            _("Cannot mark execution as Smooth — missing: {0}").format(", ".join(missing)),
            frappe.ValidationError,
        )

    if doc.event_request:
        _bump_request(doc.event_request, target_state="Event Day")


# ---------------------------------------------------------------------------
# Stage 12 — closure
# ---------------------------------------------------------------------------
def closure_finalize_request(doc, method=None):
    if doc.closure_status == "Closed" and doc.event_request:
        _bump_request(doc.event_request, target_state="Closed", force=True)


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
# The state machine is forward-only: a stage can only advance the request, not
# reverse it. `_REQUEST_ORDER` defines that order; `_bump_request` skips
# updates that would move the request backwards.
_REQUEST_ORDER = [
    "Draft",
    "Awaiting Coordinator",
    "Under Validation",
    "Incomplete",
    "Communicated",
    "Scheduled",
    "Resource Planned",
    "Contracted",
    "Finance Cleared",
    "Published",
    "Marketing Active",
    "Operations Notified",
    "Event Day",
    "Closed",
    "Rejected",
]


def _bump_request(request_name: str, target_state: str, only_if_in: tuple[str, ...] | None = None, force: bool = False):
    """Forward-only state transition on Madaar Event Request.

    `only_if_in` lets a caller scope the bump to specific upstream states (e.g.
    Scheduling only progresses from Communicated). `force` overrides the
    monotonic order check — used by closure to land at Closed regardless of
    intermediate state.
    """
    try:
        current = frappe.db.get_value("Madaar Event Request", request_name, "workflow_state")
    except Exception:
        return
    if not current:
        return
    if only_if_in and current not in only_if_in:
        return
    if not force:
        try:
            if _REQUEST_ORDER.index(target_state) <= _REQUEST_ORDER.index(current):
                return
        except ValueError:
            return
    frappe.db.set_value("Madaar Event Request", request_name, "workflow_state", target_state)
