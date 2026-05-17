# Copyright (c) 2026, Madaar
# For license information, please see license.txt

from __future__ import annotations

import datetime

import frappe
from frappe.model.document import Document
from frappe.utils import getdate, today


class MadaarTenantSubscription(Document):
    """Joins a Frappe Company to a `Madaar Subscription Plan` with status,
    billing period, dates, and a per-tenant module-toggle override table.

    Status transitions are non-destructive: a suspended tenant keeps all data;
    the React UI just hides modules and disables submit-class actions.
    """

    def autoname(self) -> None:
        # autoname is `field:tenant_company` from the JSON but Frappe still
        # calls this hook — keep it explicit so renaming is intentional.
        if self.tenant_company:
            self.name = self.tenant_company

    def validate(self) -> None:
        if self.subscription_status == "trial" and not self.trial_ends_at:
            plan = (
                frappe.get_cached_doc("Madaar Subscription Plan", self.subscription_plan)
                if self.subscription_plan
                else None
            )
            trial_days = int(plan.trial_days) if plan and plan.trial_days else 14
            self.trial_ends_at = getdate(today()) + datetime.timedelta(days=trial_days)

        if self.subscription_status in {"active", "trial"} and not self.subscription_start_date:
            self.subscription_start_date = today()

        if self.subscription_end_date and self.subscription_start_date:
            if getdate(self.subscription_end_date) < getdate(self.subscription_start_date):
                frappe.throw("Subscription end date cannot be before the start date.")

    def is_expired(self) -> bool:
        if not self.subscription_end_date:
            return False
        return getdate(self.subscription_end_date) < getdate(today())

    def get_active_modules(self) -> list[str]:
        """Effective module list = plan modules ∩ (overrides ∪ everything if no overrides)."""
        plan_modules: set[str] = set()
        if self.subscription_plan:
            plan = frappe.get_cached_doc("Madaar Subscription Plan", self.subscription_plan)
            if plan.modules:
                plan_modules = {m.strip() for m in plan.modules.split(",") if m.strip()}

        overrides = [row for row in (self.module_toggles or []) if row.module_key]
        if not overrides:
            return sorted(plan_modules)

        # Tenant overrides win: if a row exists with enabled=0 it's removed, enabled=1 keeps it.
        result = set(plan_modules)
        for row in overrides:
            key = row.module_key.strip()
            if row.enabled:
                result.add(key)
            else:
                result.discard(key)
        return sorted(result)
