from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document


VALID_TRANSITIONS = {
    "Pending": {"Deposited", "Cancelled"},
    "Deposited": {"Cleared", "Bounced"},
    "Cleared": set(),
    "Bounced": {"Pending"},  # allow re-presentment
    "Cancelled": set(),
}


class MadaarCheque(Document):
    """Issued or received cheque with a 4-state workflow.

    The state machine is enforced on save:
        Pending → Deposited → Cleared
                         └─→ Bounced → Pending
        Pending → Cancelled
    """

    def validate(self):
        previous = self.get_doc_before_save() if not self.is_new() else None
        if previous and previous.status != self.status:
            allowed = VALID_TRANSITIONS.get(previous.status, set())
            if self.status not in allowed:
                frappe.throw(
                    _("Cannot move cheque from {0} to {1}").format(previous.status, self.status)
                )
