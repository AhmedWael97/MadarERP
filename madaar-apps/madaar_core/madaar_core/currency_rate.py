"""
Resolve currency exchange rate at a specific date using Madaar Currency Rate
Period rows (effective_from / effective_to windows).

Used by hooks on Sales Invoice / Purchase Invoice / Payment Entry to override
ERPNext's default `conversion_rate` lookup, so transactions on date X always
use the rate that was in effect on date X — even if the user edits the rate
schedule later.
"""
from __future__ import annotations

import frappe
from frappe.utils import getdate


@frappe.whitelist()
def resolve_rate(from_currency: str, to_currency: str, on_date: str | None = None) -> dict:
    """Return ``{rate, source}`` for the currency pair at the given date.

    Falls back to ``{rate: 1, source: 'identity'}`` for same-currency pairs and
    ``{rate: None, source: 'no-rate'}`` when no Madaar Currency Rate Period
    matches.
    """
    if not from_currency or not to_currency:
        return {"rate": None, "source": "missing-pair"}
    if from_currency == to_currency:
        return {"rate": 1.0, "source": "identity"}
    on_date = on_date or frappe.utils.nowdate()
    d = getdate(on_date)

    rows = frappe.get_all(
        "Madaar Currency Rate Period",
        filters={
            "from_currency": from_currency,
            "to_currency": to_currency,
            "effective_from": ["<=", d],
        },
        fields=["name", "rate", "effective_from", "effective_to"],
        order_by="effective_from desc",
        limit=20,
    )
    for r in rows:
        if r.effective_to and getdate(r.effective_to) < d:
            continue
        return {"rate": float(r.rate), "source": r.name}
    return {"rate": None, "source": "no-rate"}
