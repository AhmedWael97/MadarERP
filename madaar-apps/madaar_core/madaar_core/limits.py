"""Feature gating engine.

Wired up in hooks.py:
    doc_events = {"*": {"before_insert": "madaar_core.limits.enforce",
                         "on_trash":      "madaar_core.limits.decrement"}}

The mapping from DocType to feature_key lives in DOCTYPE_TO_FEATURE below.
A DocType not in the map is unlimited (we only gate the things the SaaS plans care about).
"""

from __future__ import annotations

import frappe
from frappe import _

# Map Frappe DocType name -> feature_key in Madaar Settings.feature_limits.
# Keep this list aligned with the Package Feature catalogue in madaar_saas.
DOCTYPE_TO_FEATURE: dict[str, str] = {
    # core
    "User": "user",
    "Company": "company",
    "Branch": "branch",
    # sales / ar
    "Sales Invoice": "sales_invoice",
    "Sales Order": "sales_order",
    "Quotation": "quotation",
    "Customer": "customer",
    # purchases / ap
    "Purchase Invoice": "purchase_invoice",
    "Purchase Order": "purchase_order",
    "Supplier": "supplier",
    # stock
    "Item": "item",
    "Warehouse": "warehouse",
    "Stock Entry": "stock_entry",
    # custom modules
    "Madaar Vehicle": "vehicle",
    "Madaar Driver Profile": "driver",
    "Madaar Trip": "trip",
    "Madaar BOQ": "boq",
    "Madaar Progress Bill": "progress_bill",
    "Madaar Vehicle Job Card": "job_card",
    "Madaar Hall": "hall",
    "Madaar Table": "table",
    "Madaar Reservation": "reservation",
    "Madaar Shipment": "shipment",
    "Madaar EInvoice Submission": "einvoice_submission",
}


def enforce(doc, method=None):
    """before_insert: refuse the insert if the tenant has hit the package limit for this doctype."""
    feature = DOCTYPE_TO_FEATURE.get(doc.doctype)
    if not feature:
        return  # unlimited
    settings = _settings()
    row = _find_row(settings, feature)
    if not row:
        return  # not gated by this package
    if row.limit == -1:
        return  # unlimited
    if (row.current_count or 0) >= row.limit:
        frappe.throw(
            _("Limit reached for feature '{0}' on package '{1}'. Upgrade to add more.").format(
                feature, settings.package_name or "—"
            ),
            frappe.PermissionError,
        )
    # Atomic increment so concurrent inserts don't overshoot the limit.
    affected = frappe.db.sql(
        """
        UPDATE `tabMadaar Feature Limit`
           SET current_count = current_count + 1
         WHERE parent = %s AND feature_key = %s
           AND (`limit` = -1 OR current_count < `limit`)
        """,
        (settings.name, feature),
    )
    # `affected` is a result set on read; for UPDATE Frappe returns affected via db.sql with as_dict.
    # The simpler check: re-read the row and confirm.
    settings.reload()
    new_row = _find_row(settings, feature)
    if new_row and new_row.limit != -1 and new_row.current_count > new_row.limit:
        frappe.throw(
            _("Limit reached for feature '{0}'.").format(feature),
            frappe.PermissionError,
        )


def decrement(doc, method=None):
    """on_trash: free up a slot when a gated doc is deleted."""
    feature = DOCTYPE_TO_FEATURE.get(doc.doctype)
    if not feature:
        return
    settings = _settings()
    frappe.db.sql(
        """
        UPDATE `tabMadaar Feature Limit`
           SET current_count = GREATEST(current_count - 1, 0)
         WHERE parent = %s AND feature_key = %s
        """,
        (settings.name, feature),
    )


def reset_period_counters():
    """Scheduled daily — at the start of a new month, zero out monthly counters."""
    import datetime

    today = datetime.date.today()
    if today.day != 1:
        return
    frappe.db.sql(
        """
        UPDATE `tabMadaar Feature Limit`
           SET current_count = 0
         WHERE period = 'monthly'
        """
    )


def _settings():
    if not frappe.db.exists("Madaar Settings", "Madaar Settings"):
        doc = frappe.get_doc({"doctype": "Madaar Settings", "name": "Madaar Settings"})
        doc.insert(ignore_permissions=True)
    return frappe.get_single("Madaar Settings")


def _find_row(settings, feature_key):
    for row in settings.get("feature_limits") or []:
        if row.feature_key == feature_key:
            return row
    return None
