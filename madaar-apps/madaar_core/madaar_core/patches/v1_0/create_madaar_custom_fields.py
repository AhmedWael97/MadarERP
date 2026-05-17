"""Add the custom fields that back the Madaar-style create/edit forms.

These mirror the field set found in the reference Laravel Madaar ERP forms
(`H:/coupons/Madaar ERP/Madaar ERP/resources/views/<module>/form.blade.php`).
Each entry below pairs an ERPNext doctype with a `madaar_*` field that the
React form (`frontend/src/modules/<module>/CustomerForm.tsx` and friends)
reads and writes.

Idempotent — runs on every `bench migrate` but only creates each Custom Field
once. Supports the full `create_custom_field` payload (`default`, `reqd`,
`unique`, `precision`, `description`, …) by passing every key except `dt`.
"""

from __future__ import annotations

from typing import Any

import frappe


# Each entry is the literal `Custom Field` payload, plus `dt` (the target
# DocType). Anything else is forwarded as-is to `create_custom_field`.
CUSTOM_FIELDS: list[dict[str, Any]] = [
    # ── Customer (category + group already present; the rest below back the
    # 6-tab reference form) ─────────────────────────────────────────────────
    {"dt": "Customer", "fieldname": "madaar_customer_category", "label": "Madaar Customer Category",
     "fieldtype": "Link", "options": "Madaar Customer Category", "insert_after": "customer_group"},
    {"dt": "Customer", "fieldname": "madaar_customer_group", "label": "Madaar Customer Group",
     "fieldtype": "Link", "options": "Madaar Customer Group", "insert_after": "madaar_customer_category"},

    # General tab (البيانات العامة)
    {"dt": "Customer", "fieldname": "madaar_customer_code", "label": "Madaar Customer Code",
     "fieldtype": "Data", "unique": 1, "insert_after": "madaar_customer_group"},
    {"dt": "Customer", "fieldname": "madaar_name_ar", "label": "Arabic Name",
     "fieldtype": "Data", "insert_after": "madaar_customer_code"},
    {"dt": "Customer", "fieldname": "madaar_name_en", "label": "English Name",
     "fieldtype": "Data", "insert_after": "madaar_name_ar"},
    {"dt": "Customer", "fieldname": "madaar_city", "label": "City",
     "fieldtype": "Data", "insert_after": "madaar_name_en"},
    {"dt": "Customer", "fieldname": "madaar_country", "label": "Country",
     "fieldtype": "Data", "default": "مصر", "insert_after": "madaar_city"},
    {"dt": "Customer", "fieldname": "madaar_is_taxable", "label": "Is Taxable",
     "fieldtype": "Check", "default": "1", "insert_after": "madaar_country"},
    {"dt": "Customer", "fieldname": "madaar_add_as_supplier", "label": "Add as Supplier",
     "fieldtype": "Check", "default": "0", "insert_after": "madaar_is_taxable"},
    {"dt": "Customer", "fieldname": "madaar_default_receivable_account", "label": "Madaar Default Receivable Account",
     "fieldtype": "Link", "options": "Account", "insert_after": "madaar_add_as_supplier"},
    {"dt": "Customer", "fieldname": "madaar_discount_percentage", "label": "Default Discount %",
     "fieldtype": "Float", "default": "0", "insert_after": "madaar_default_receivable_account"},

    # Marketing tab (بيانات تسويقية)
    {"dt": "Customer", "fieldname": "madaar_sales_person", "label": "Madaar Sales Person",
     "fieldtype": "Link", "options": "Sales Person", "insert_after": "madaar_discount_percentage"},
    {"dt": "Customer", "fieldname": "madaar_notes", "label": "Madaar Notes",
     "fieldtype": "Small Text", "insert_after": "madaar_sales_person"},

    # Contact tab (وسائل الإتصال) — kept on Customer for parity with the
    # reference. ERPNext also has Contact/Address doctypes, but the reference
    # treats these as scalar fields, so we mirror that.
    {"dt": "Customer", "fieldname": "madaar_address", "label": "Madaar Address",
     "fieldtype": "Data", "insert_after": "madaar_notes"},
    {"dt": "Customer", "fieldname": "madaar_phone", "label": "Phone",
     "fieldtype": "Data", "insert_after": "madaar_address"},
    {"dt": "Customer", "fieldname": "madaar_mobile", "label": "Mobile",
     "fieldtype": "Data", "insert_after": "madaar_phone"},
    {"dt": "Customer", "fieldname": "madaar_email", "label": "Madaar Email",
     "fieldtype": "Data", "options": "Email", "insert_after": "madaar_mobile"},
    {"dt": "Customer", "fieldname": "madaar_postal_code", "label": "Postal Code",
     "fieldtype": "Data", "insert_after": "madaar_email"},

    # Government tab (بيانات حكومية) — tax_id is native ERPNext; CR is new.
    {"dt": "Customer", "fieldname": "madaar_commercial_register", "label": "Commercial Register",
     "fieldtype": "Data", "insert_after": "tax_id"},

    # Credit / Financial tabs
    {"dt": "Customer", "fieldname": "madaar_credit_limit", "label": "Madaar Credit Limit",
     "fieldtype": "Currency", "insert_after": "madaar_commercial_register"},
    {"dt": "Customer", "fieldname": "madaar_opening_balance", "label": "Opening Balance",
     "fieldtype": "Currency", "default": "0", "insert_after": "madaar_credit_limit"},

    # ── Supplier ────────────────────────────────────────────────────────────
    {"dt": "Supplier", "fieldname": "madaar_supplier_category", "label": "Madaar Supplier Category",
     "fieldtype": "Link", "options": "Madaar Supplier Category", "insert_after": "supplier_group"},
    {"dt": "Supplier", "fieldname": "madaar_supplier_group", "label": "Madaar Supplier Group",
     "fieldtype": "Link", "options": "Madaar Supplier Group", "insert_after": "madaar_supplier_category"},

    # General tab (البيانات العامة)
    {"dt": "Supplier", "fieldname": "madaar_supplier_code", "label": "Madaar Supplier Code",
     "fieldtype": "Data", "unique": 1, "insert_after": "madaar_supplier_group"},
    {"dt": "Supplier", "fieldname": "madaar_name_ar", "label": "Arabic Name",
     "fieldtype": "Data", "insert_after": "madaar_supplier_code"},
    {"dt": "Supplier", "fieldname": "madaar_name_en", "label": "English Name",
     "fieldtype": "Data", "insert_after": "madaar_name_ar"},
    {"dt": "Supplier", "fieldname": "madaar_is_taxable", "label": "Is Taxable",
     "fieldtype": "Check", "default": "1", "insert_after": "madaar_name_en"},
    {"dt": "Supplier", "fieldname": "madaar_add_as_customer", "label": "Add as Customer",
     "fieldtype": "Check", "default": "0", "insert_after": "madaar_is_taxable"},
    {"dt": "Supplier", "fieldname": "madaar_default_payable_account", "label": "Madaar Default Payable Account",
     "fieldtype": "Link", "options": "Account", "insert_after": "madaar_add_as_customer"},

    # Marketing tab (بيانات تسويقية) — only notes for Supplier
    {"dt": "Supplier", "fieldname": "madaar_notes", "label": "Madaar Notes",
     "fieldtype": "Small Text", "insert_after": "madaar_default_payable_account"},

    # Contact tab (وسائل الإتصال)
    {"dt": "Supplier", "fieldname": "madaar_address", "label": "Madaar Address",
     "fieldtype": "Data", "insert_after": "madaar_notes"},
    {"dt": "Supplier", "fieldname": "madaar_phone", "label": "Phone",
     "fieldtype": "Data", "insert_after": "madaar_address"},
    {"dt": "Supplier", "fieldname": "madaar_mobile", "label": "Mobile",
     "fieldtype": "Data", "insert_after": "madaar_phone"},
    {"dt": "Supplier", "fieldname": "madaar_email", "label": "Madaar Email",
     "fieldtype": "Data", "options": "Email", "insert_after": "madaar_mobile"},
    {"dt": "Supplier", "fieldname": "madaar_city", "label": "City",
     "fieldtype": "Data", "insert_after": "madaar_email"},
    {"dt": "Supplier", "fieldname": "madaar_country", "label": "Country",
     "fieldtype": "Data", "default": "مصر", "insert_after": "madaar_city"},
    {"dt": "Supplier", "fieldname": "madaar_postal_code", "label": "Postal Code",
     "fieldtype": "Data", "insert_after": "madaar_country"},

    # Government tab (بيانات حكومية) — tax_id is native ERPNext
    {"dt": "Supplier", "fieldname": "madaar_commercial_register", "label": "Commercial Register",
     "fieldtype": "Data", "insert_after": "tax_id"},

    # Financial tab — opening balance + bank fields (the reference puts these
    # together; ERPNext usually splits Bank into a separate doctype, but the
    # reference keeps them as scalars on the Supplier, so we mirror that)
    {"dt": "Supplier", "fieldname": "madaar_opening_balance", "label": "Opening Balance",
     "fieldtype": "Currency", "default": "0", "insert_after": "madaar_commercial_register"},
    {"dt": "Supplier", "fieldname": "madaar_bank_name", "label": "Bank Name",
     "fieldtype": "Data", "insert_after": "madaar_opening_balance"},
    {"dt": "Supplier", "fieldname": "madaar_bank_account_number", "label": "Bank Account Number",
     "fieldtype": "Data", "insert_after": "madaar_bank_name"},
    {"dt": "Supplier", "fieldname": "madaar_bank_iban", "label": "IBAN",
     "fieldtype": "Data", "insert_after": "madaar_bank_account_number"},

    # ── Item ────────────────────────────────────────────────────────────────
    {"dt": "Item", "fieldname": "madaar_product_category", "label": "Madaar Product Category",
     "fieldtype": "Link", "options": "Madaar Product Category", "insert_after": "item_group"},
    {"dt": "Item", "fieldname": "madaar_product_group", "label": "Madaar Product Group",
     "fieldtype": "Link", "options": "Madaar Product Group", "insert_after": "madaar_product_category"},
    {"dt": "Item", "fieldname": "madaar_name_en", "label": "English Name",
     "fieldtype": "Data", "insert_after": "madaar_product_group"},
    {"dt": "Item", "fieldname": "madaar_barcode", "label": "Madaar Barcode",
     "fieldtype": "Data", "insert_after": "madaar_name_en"},
    {"dt": "Item", "fieldname": "madaar_product_type", "label": "Madaar Product Type",
     "fieldtype": "Select", "options": "product\nservice\nconsumable", "default": "product", "insert_after": "madaar_barcode"},
    {"dt": "Item", "fieldname": "madaar_purchase_price", "label": "Madaar Purchase Price",
     "fieldtype": "Currency", "insert_after": "madaar_product_type"},
    {"dt": "Item", "fieldname": "madaar_default_warehouse", "label": "Madaar Default Warehouse",
     "fieldtype": "Link", "options": "Warehouse", "insert_after": "madaar_purchase_price"},

    # ── Warehouse — bilingual names + address (reference adds these on top of ERPNext) ──
    {"dt": "Warehouse", "fieldname": "madaar_warehouse_code", "label": "Madaar Warehouse Code",
     "fieldtype": "Data", "unique": 1, "insert_after": "warehouse_name"},
    {"dt": "Warehouse", "fieldname": "madaar_name_en", "label": "English Name",
     "fieldtype": "Data", "insert_after": "madaar_warehouse_code"},
    {"dt": "Warehouse", "fieldname": "madaar_address", "label": "Address",
     "fieldtype": "Data", "insert_after": "madaar_name_en"},

    # ── Employee — reference adds national_id, bilingual name, and basic salary ──
    {"dt": "Employee", "fieldname": "madaar_name_en", "label": "English Name",
     "fieldtype": "Data", "insert_after": "employee_name"},
    {"dt": "Employee", "fieldname": "madaar_national_id", "label": "National ID",
     "fieldtype": "Data", "insert_after": "madaar_name_en"},
    {"dt": "Employee", "fieldname": "madaar_basic_salary", "label": "Basic Salary",
     "fieldtype": "Currency", "insert_after": "madaar_national_id"},

    # ── Account (Chart of Accounts) — extra fields the reference COA form expects
    {"dt": "Account", "fieldname": "madaar_name_en", "label": "English Name",
     "fieldtype": "Data", "insert_after": "account_name"},
    {"dt": "Account", "fieldname": "madaar_nature", "label": "Account Nature",
     "fieldtype": "Select", "options": "debit\ncredit", "default": "debit", "insert_after": "madaar_name_en"},
    {"dt": "Account", "fieldname": "madaar_description", "label": "Description",
     "fieldtype": "Small Text", "insert_after": "madaar_nature"},
    {"dt": "Account", "fieldname": "madaar_opening_balance", "label": "Opening Balance (Madaar)",
     "fieldtype": "Currency", "default": "0", "insert_after": "madaar_description"},

    # ── Cost Center — reference adds code + bilingual names + type
    {"dt": "Cost Center", "fieldname": "madaar_cost_center_code", "label": "Madaar Cost Center Code",
     "fieldtype": "Data", "unique": 1, "insert_after": "cost_center_name"},
    {"dt": "Cost Center", "fieldname": "madaar_name_en", "label": "English Name",
     "fieldtype": "Data", "insert_after": "madaar_cost_center_code"},
    {"dt": "Cost Center", "fieldname": "madaar_type", "label": "Center Type",
     "fieldtype": "Select", "options": "branch\ndepartment\nproject\nother", "default": "branch", "insert_after": "madaar_name_en"},
    {"dt": "Cost Center", "fieldname": "madaar_description", "label": "Description",
     "fieldtype": "Small Text", "insert_after": "madaar_type"},
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
        # Forward every key except `dt` so newly-added attributes like
        # `default`, `unique`, and `reqd` flow through without further edits.
        payload = {k: v for k, v in cf.items() if k != "dt"}
        try:
            create_custom_field(cf["dt"], payload)
        except Exception:
            frappe.log_error(frappe.get_traceback(), f"create_madaar_custom_fields: {name}")
    frappe.db.commit()
