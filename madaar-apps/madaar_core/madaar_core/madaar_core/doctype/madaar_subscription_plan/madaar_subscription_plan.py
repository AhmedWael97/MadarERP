# Copyright (c) 2026, Madaar
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class MadaarSubscriptionPlan(Document):
    """Master record for tenant subscription plans (starter / pro / enterprise / …).

    Each tenant company (`Madaar Tenant Subscription`) links to one plan. The
    plan controls hard limits (max users, max companies, …), the trial window,
    pricing, and the comma-separated list of enabled module keys.
    """

    def validate(self) -> None:
        if self.modules:
            cleaned = ",".join(
                sorted({m.strip() for m in self.modules.split(",") if m.strip()})
            )
            self.modules = cleaned

    def has_module(self, key: str) -> bool:
        if not self.modules:
            return False
        return key in {m.strip() for m in self.modules.split(",") if m.strip()}
