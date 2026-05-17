import frappe
from frappe.model.document import Document
from frappe.utils import getdate, today


class MadaarPriceList(Document):
    """Per-customer-group product pricing.

    Lookup contract:
        MadaarPriceList.get_price(product=item_code, customer_group=group_code)
        → returns the unit price (float) or None if no rule applies.
    The Sales Invoice `before_save` hook (see madaar_core/hooks.py) uses this
    to override `rate` whenever the customer has a matching group.
    """

    def validate(self) -> None:
        if self.valid_from and self.valid_to:
            if getdate(self.valid_to) < getdate(self.valid_from):
                frappe.throw("Valid-to date cannot be before valid-from.")

    @staticmethod
    def get_price(product: str, customer_group: str) -> float | None:
        """Return the active price for (product × customer_group) or None.

        Filters by:
          - is_active = 1
          - valid_from <= today() <= valid_to (both inclusive, nullable)
        Picks the most recently modified row if there are duplicates.
        """
        if not product or not customer_group:
            return None
        t = today()
        rows = frappe.db.sql(
            """
            SELECT price
            FROM `tabMadaar Price List`
            WHERE product = %s
              AND customer_group = %s
              AND is_active = 1
              AND (valid_from IS NULL OR valid_from <= %s)
              AND (valid_to   IS NULL OR valid_to   >= %s)
            ORDER BY modified DESC
            LIMIT 1
            """,
            (product, customer_group, t, t),
        )
        if not rows:
            return None
        try:
            return float(rows[0][0])
        except (TypeError, ValueError):
            return None
