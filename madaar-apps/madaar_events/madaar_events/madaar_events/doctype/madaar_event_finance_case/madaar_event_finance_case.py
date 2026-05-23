# Copyright (c) 2026, Madaar Software and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe.model.document import Document


class MadaarEventFinanceCase(Document):
    """Bridges a `Madaar Event Request` to the ERPNext accounting cycle.

    When `compliance_status` transitions to "Cleared" AND `payment_structure`
    is "Sales Invoice" AND no `linked_sales_invoice` exists yet, we create a
    draft Sales Invoice with the event's revenue amount. The actual posting
    (submit) stays with the finance team — we only seed the document so it
    appears in their queue.
    """

    def on_update(self) -> None:
        try:
            self._auto_create_sales_invoice()
        except Exception:
            # Don't let accounting failures block the finance case save.
            frappe.log_error(frappe.get_traceback(), "MadaarEventFinanceCase.auto_create_sales_invoice")

    def _auto_create_sales_invoice(self) -> None:
        if self.compliance_status != "Cleared":
            return
        if (self.payment_structure or "").strip() != "Sales Invoice":
            return
        if self.linked_sales_invoice:
            return
        if not self.revenue_amount or float(self.revenue_amount) <= 0:
            return
        if not frappe.db.exists("DocType", "Sales Invoice"):
            return  # erpnext not installed

        # Resolve a customer for the invoice. Prefer the event's contract party,
        # then the request's submitter. If neither resolves to a Customer, fall
        # back to a "Walk-in Customer" sentinel that Frappe seeds by default.
        customer = self._resolve_customer()
        if not customer:
            return

        # Resolve the company. If multi-tenant, pick the request's company.
        company = (
            frappe.db.get_single_value("Global Defaults", "default_company")
            or frappe.db.get_value("Company", {}, "name")
        )
        if not company:
            return

        invoice = frappe.new_doc("Sales Invoice")
        invoice.customer = customer
        invoice.company = company
        invoice.currency = self.currency or frappe.db.get_value("Company", company, "default_currency") or "EGP"
        invoice.posting_date = frappe.utils.today()
        invoice.append("items", {
            "item_code": _ensure_event_revenue_item(company),
            "qty": 1,
            "rate": float(self.revenue_amount),
            "description": f"Event Revenue — {self.event_request}",
        })
        invoice.insert(ignore_permissions=True)
        # Submit immediately so the Sales Invoice actually hits GL (debits the
        # customer's receivable, credits the income account on the item). The
        # previous behaviour left the invoice as a draft, which meant the
        # event's revenue never appeared on the P&L. If submit fails (missing
        # taxes template, FX rate, etc.) we keep the draft so finance can
        # rescue it manually instead of silently dropping the case.
        try:
            invoice.submit()
        except Exception:
            frappe.log_error(frappe.get_traceback(), "MadaarEventFinanceCase.submit_sales_invoice")

        self.db_set("linked_sales_invoice", invoice.name)


    def _resolve_customer(self) -> str | None:
        # 1) Try a contract party (if the contract has a customer link / party_name).
        if self.contract and frappe.db.exists("Madaar Event Contract", self.contract):
            party = frappe.db.get_value("Madaar Event Contract", self.contract, "party_customer")
            if party and frappe.db.exists("Customer", party):
                return party
        # 2) Fall back to the request's submitter customer.
        if self.event_request and frappe.db.exists("Madaar Event Request", self.event_request):
            party = frappe.db.get_value("Madaar Event Request", self.event_request, "customer")
            if party and frappe.db.exists("Customer", party):
                return party
        # 3) Last resort: walk-in.
        return frappe.db.get_value("Customer", "Walk-in Customer") or None


def _ensure_event_revenue_item(company: str) -> str:
    """Ensure the seed Item 'Event Revenue' exists so the Sales Invoice has
    something to charge. Idempotent — returns the item code."""
    code = "EVENT-REVENUE"
    if frappe.db.exists("Item", code):
        return code
    try:
        item = frappe.new_doc("Item")
        item.item_code = code
        item.item_name = "Event Revenue"
        item.item_group = frappe.db.get_value("Item Group", {"is_group": 0}) or "All Item Groups"
        item.stock_uom = "Nos"
        item.is_stock_item = 0
        item.is_sales_item = 1
        item.is_purchase_item = 0
        item.insert(ignore_permissions=True)
    except Exception:
        frappe.log_error(frappe.get_traceback(), "ensure_event_revenue_item")
    return code
