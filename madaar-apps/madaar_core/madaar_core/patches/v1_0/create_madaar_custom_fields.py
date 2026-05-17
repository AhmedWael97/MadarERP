"""Add Customer / Supplier / Item custom fields that link to Madaar Category
and Madaar Group doctypes. Idempotent — runs on every migrate but only
creates each Custom Field once.
"""

from __future__ import annotations

import frappe


CUSTOM_FIELDS: list[dict[str, str]] = [
    # ── Customer ────────────────────────────────────────────────────────────
    {"dt": "Customer", "fieldname": "madaar_customer_category", "label": "Madaar Customer Category",
     "fieldtype": "Link", "options": "Madaar Customer Category", "insert_after": "customer_group"},
    {"dt": "Customer", "fieldname": "madaar_customer_group", "label": "Madaar Customer Group",
     "fieldtype": "Link", "options": "Madaar Customer Group", "insert_after": "madaar_customer_category"},
    # ── Supplier ────────────────────────────────────────────────────────────
    {"dt": "Supplier", "fieldname": "madaar_supplier_category", "label": "Madaar Supplier Category",
     "fieldtype": "Link", "options": "Madaar Supplier Category", "insert_after": "supplier_group"},
    {"dt": "Supplier", "fieldname": "madaar_supplier_group", "label": "Madaar Supplier Group",
     "fieldtype": "Link", "options": "Madaar Supplier Group", "insert_after": "madaar_supplier_category"},
    # ── Item ────────────────────────────────────────────────────────────────
    {"dt": "Item", "fieldname": "madaar_product_category", "label": "Madaar Product Category",
     "fieldtype": "Link", "options": "Madaar Product Category", "insert_after": "item_group"},
    {"dt": "Item", "fieldname": "madaar_product_group", "label": "Madaar Product Group",
     "fieldtype": "Link", "options": "Madaar Product Group", "insert_after": "madaar_product_category"},
]


def execute() -> None:
    """Run by Frappe's patches infrastructure during `bench migrate`."""
    try:
        from frappe.custom.doctype.custom_field.custom_field import create_custom_field
    except Exception:
        frappe.log_error("create_madaar_custom_fields: cannot import create_custom_field")
        return

    for cf in CUSTOM_FIELDS:
        name = f"{cf['dt']}-{cf['fieldname']}"
        if frappe.db.exists("Custom Field", name):
            continue
        # Skip if target doctype doesn't exist (e.g. erpnext not installed yet).
        if not frappe.db.exists("DocType", cf["dt"]):
            continue
        try:
            create_custom_field(cf["dt"], {
                "fieldname": cf["fieldname"],
                "label": cf["label"],
                "fieldtype": cf["fieldtype"],
                "options": cf["options"],
                "insert_after": cf["insert_after"],
            })
        except Exception:
            frappe.log_error(frappe.get_traceback(), f"create_madaar_custom_fields: {name}")
    frappe.db.commit()
