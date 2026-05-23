from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class MadaarCommissionPolicy(Document):
    def validate(self) -> None:
        self._normalize_tiers()
        self._validate_tiers()
        self._validate_single_active_policy()

    def _normalize_tiers(self) -> None:
        self.tiers = sorted(
            self.tiers or [],
            key=lambda r: (flt(r.from_amount), flt(r.to_amount)),
        )

    def _validate_tiers(self) -> None:
        if not self.tiers:
            frappe.throw(_("Commission policy must include at least one tier."))

        previous_to = None
        for idx, row in enumerate(self.tiers, start=1):
            from_amount = flt(row.from_amount)
            to_amount = flt(row.to_amount)
            pct = flt(row.commission_percentage)

            if from_amount < 0 or to_amount < 0:
                frappe.throw(_("Tier #{0}: amount values cannot be negative.").format(idx))
            if to_amount < from_amount:
                frappe.throw(_("Tier #{0}: 'To Amount' must be greater than or equal to 'From Amount'.").format(idx))
            if pct < 0:
                frappe.throw(_("Tier #{0}: commission percentage cannot be negative.").format(idx))
            if previous_to is not None and from_amount <= previous_to:
                frappe.throw(
                    _("Tier #{0}: range overlaps with the previous tier. Each new tier must start above {1}.").format(
                        idx, previous_to
                    )
                )
            previous_to = to_amount

    def _validate_single_active_policy(self) -> None:
        if not int(self.is_active or 0):
            return

        sales_person = (self.sales_person or "").strip()
        rows = frappe.db.sql(
            """
            SELECT name
            FROM `tabMadaar Commission Policy`
            WHERE company = %s
              AND COALESCE(sales_person, '') = %s
              AND is_active = 1
              AND name != %s
            LIMIT 1
            """,
            (self.company, sales_person, self.name or ""),
        )
        if rows:
            target = sales_person or _("default policy")
            frappe.throw(_("There is already an active commission policy for {0} in company {1}.").format(target, self.company))
