"""Scheduled jobs run by the Frappe scheduler. Wired in hooks.py."""

from __future__ import annotations

import datetime

import frappe


def refresh_tenant_usage_counters() -> None:
    """Update `Madaar Tenant Subscription` usage snapshot fields.

    Runs daily. Counts current users / branches / warehouses / this-month
    invoices per tenant so the super-admin dashboard shows live numbers
    without needing to compute them on every page load.
    """
    if not frappe.db.exists("DocType", "Madaar Tenant Subscription"):
        return

    today = datetime.date.today()
    first_of_month = today.replace(day=1).isoformat()

    for sub_name in frappe.get_all("Madaar Tenant Subscription", pluck="name"):
        try:
            sub = frappe.get_doc("Madaar Tenant Subscription", sub_name)
            tc = sub.tenant_company
            sub.current_users = frappe.db.count("User", {"enabled": 1, "name": ["!=", "Administrator"]})
            sub.current_branches = frappe.db.count("Branch", {}) if frappe.db.exists("DocType", "Branch") else 0
            sub.current_warehouses = frappe.db.count("Warehouse", {"company": tc}) if frappe.db.exists("DocType", "Warehouse") else 0
            sub.current_invoices_this_month = frappe.db.count(
                "Sales Invoice",
                {"company": tc, "posting_date": [">=", first_of_month], "docstatus": 1},
            ) if frappe.db.exists("DocType", "Sales Invoice") else 0
            sub.save(ignore_permissions=True)
        except Exception:
            frappe.log_error(frappe.get_traceback(), f"refresh_tenant_usage_counters: {sub_name}")
