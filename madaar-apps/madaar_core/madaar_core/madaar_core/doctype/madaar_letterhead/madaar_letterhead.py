import frappe
from frappe.model.document import Document
from frappe.utils import getdate, today


class MadaarLetterhead(Document):
    """License-contract / letterhead between Madaar and a tenant."""

    def validate(self) -> None:
        if self.expiry_date and self.issue_date:
            if getdate(self.expiry_date) < getdate(self.issue_date):
                frappe.throw("Expiry date cannot be before the issue date.")
        if self.status == "signed" and not self.signed_at:
            from frappe.utils import now
            self.signed_at = now()
