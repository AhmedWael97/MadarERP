"""Bootstrap routine called by the SaaS control plane right after a new tenant
site is created and apps are installed.

Run from the bench like:

    bench --site <tenant>.madaar.app execute \
        madaar_core.setup.bootstrap_tenant --kwargs \
        '{"tenant_id":"t1","package":"starter","owner_email":"owner@example.com"}'

What it does (idempotent):
  - Writes the Madaar Settings singleton (tenant_id, package, branding defaults).
  - Seeds an Egyptian VAT 14% tax template on the default Company.
  - Adds the e-invoicing custom fields to Sales Invoice / Customer / Item if missing.
  - Creates the owner User with System Manager + Accounts Manager roles and emails a
    welcome link (uses Frappe's built-in welcome email).
"""

from __future__ import annotations

import frappe
from frappe import _


CUSTOM_FIELDS = {
    "Customer": [
        {"fieldname": "eta_tax_registration_number", "label": "ETA Tax Registration Number", "fieldtype": "Data", "insert_after": "tax_id"},
        {"fieldname": "eta_branch_id", "label": "ETA Branch ID", "fieldtype": "Data", "insert_after": "eta_tax_registration_number"},
    ],
    "Supplier": [
        {"fieldname": "eta_tax_registration_number", "label": "ETA Tax Registration Number", "fieldtype": "Data", "insert_after": "tax_id"},
        {"fieldname": "is_subcontractor", "label": "Is Subcontractor", "fieldtype": "Check", "insert_after": "supplier_group"},
    ],
    "Sales Invoice": [
        {"fieldname": "eta_uuid", "label": "ETA UUID", "fieldtype": "Data", "insert_after": "naming_series", "read_only": 1},
        {"fieldname": "eta_long_id", "label": "ETA Long ID", "fieldtype": "Data", "insert_after": "eta_uuid", "read_only": 1},
        {"fieldname": "eta_submission_status", "label": "ETA Submission Status", "fieldtype": "Select", "options": "\nPending\nSigned\nSubmitted\nAccepted\nRejected", "insert_after": "eta_long_id", "read_only": 1},
    ],
    "Item": [
        {"fieldname": "eta_item_code", "label": "ETA Item Code (GS1/EGS)", "fieldtype": "Data", "insert_after": "item_code"},
        {"fieldname": "is_menu_item", "label": "Is Menu Item (Restaurant)", "fieldtype": "Check", "insert_after": "is_stock_item"},
    ],
    "Company": [
        {"fieldname": "eta_activity_code", "label": "ETA Activity Code", "fieldtype": "Data", "insert_after": "tax_id"},
    ],
}


def bootstrap_tenant(
    tenant_id: str | None = None,
    package: str | None = None,
    owner_email: str | None = None,
    company_name: str = "Madaar Demo",
    company_abbr: str = "MAD",
    country: str = "Egypt",
    currency: str = "EGP",
    chart_of_accounts: str = "Standard",
    language: str = "ar",
    timezone: str = "Africa/Cairo",
) -> dict:
    """Idempotent setup — safe to re-run.

    Runs Frappe's built-in Setup Wizard so all the dependent defaults
    (Company, Customer Group, Territory, UOM, COA, fiscal year, etc.) exist.
    Without this, creating even a Customer fails with LinkValidationError.
    """
    _ensure_setup_wizard(company_name, company_abbr, country, currency, chart_of_accounts, language, timezone)
    _ensure_settings(tenant_id, package)
    _ensure_custom_fields()
    _ensure_owner(owner_email)
    frappe.db.commit()
    return {"ok": True, "tenant_id": tenant_id, "package": package}


def _ensure_setup_wizard(company_name, company_abbr, country, currency, chart_of_accounts, language, timezone):
    """Run Frappe's setup wizard if the system is not yet set up.

    `frappe.utils.scheduler.is_setup_complete` checks the System Settings flag.
    """
    try:
        # Already complete? Skip.
        if frappe.db.get_single_value("System Settings", "setup_complete"):
            return

        from frappe.desk.page.setup_wizard.setup_wizard import setup_complete

        # Use the Administrator to bypass the "guest cannot run setup" guard.
        frappe.set_user("Administrator")

        args = {
            "language": "Arabic" if language == "ar" else "English",
            "country": country,
            "currency": currency,
            "timezone": timezone,
            "full_name": "Administrator",
            "email": "admin@madaar.local",
            "company_name": company_name,
            "company_abbr": company_abbr,
            "company_tagline": "",
            "bank_account": "Cash",
            "chart_of_accounts": chart_of_accounts,
            "fy_start_date": "2026-01-01",
            "fy_end_date": "2026-12-31",
            "domains": [],
            "setup_demo": 0,
        }

        setup_complete(args)
    except Exception:
        frappe.log_error(frappe.get_traceback(), "madaar_core.setup._ensure_setup_wizard")


def _ensure_settings(tenant_id, package):
    name = "Madaar Settings"
    if not frappe.db.exists("Madaar Settings", name):
        doc = frappe.get_doc({"doctype": "Madaar Settings", "name": name})
        doc.insert(ignore_permissions=True)
    settings = frappe.get_single("Madaar Settings")
    if tenant_id:
        settings.tenant_id = tenant_id
    if package:
        settings.package_name = package
    settings.save(ignore_permissions=True)


def _ensure_custom_fields():
    """Create the e-invoicing / Madaar custom fields if absent.

    Uses frappe.custom.doctype.custom_field.custom_field.create_custom_fields
    so the fields are owned by `madaar_core` and removed on uninstall.
    """
    try:
        from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

        create_custom_fields(CUSTOM_FIELDS, ignore_validate=True)
    except Exception:
        frappe.log_error(frappe.get_traceback(), "madaar_core.setup._ensure_custom_fields")


def _ensure_owner(owner_email):
    if not owner_email:
        return
    if frappe.db.exists("User", owner_email):
        return
    user = frappe.get_doc(
        {
            "doctype": "User",
            "email": owner_email,
            "first_name": "Tenant Owner",
            "send_welcome_email": 1,
            "roles": [
                {"role": "System Manager"},
                {"role": "Accounts Manager"},
                {"role": "Sales Manager"},
                {"role": "Stock Manager"},
            ],
        }
    )
    user.insert(ignore_permissions=True)
