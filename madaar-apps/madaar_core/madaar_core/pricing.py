"""Group-aware pricing hooks for Sales Invoice / Sales Order / Quotation.

When a sales document is being saved, walk its child items. For each row whose
parent customer has a `madaar_customer_group` set (custom field), look up
`Madaar Price List` for (item × group). If a match exists, override the row's
`rate` (and `price_list_rate`) so the order total reflects group pricing.

The hook is wired in `madaar_core/hooks.py::doc_events`.
"""

from __future__ import annotations

from typing import Any

import frappe


def _customer_group(customer: str | None) -> str | None:
    """Resolve the Madaar Customer Group for a customer via custom field."""
    if not customer:
        return None
    try:
        return frappe.db.get_value("Customer", customer, "madaar_customer_group")
    except Exception:
        return None


def apply_group_pricing(doc: Any, method: str | None = None) -> None:  # noqa: ARG001
    """`before_save` handler for Sales Invoice / Sales Order / Quotation."""
    customer = getattr(doc, "customer", None)
    group = _customer_group(customer)
    if not group:
        return  # Customer has no group — keep the item's standard rate.

    from madaar_core.madaar_core.doctype.madaar_price_list.madaar_price_list import MadaarPriceList

    for row in (doc.get("items") or []):
        item = getattr(row, "item_code", None)
        if not item:
            continue
        price = MadaarPriceList.get_price(product=item, customer_group=group)
        if price is None:
            continue
        # Override both rate and price_list_rate so downstream calcs (taxes,
        # discounts, accounting) all see the group-specific number.
        try:
            row.price_list_rate = price
            row.rate = price
        except Exception:
            # Defensive: child-doctype shape can vary between Sales Invoice / Order / Quotation.
            try:
                row.set("rate", price)
            except Exception:
                pass
