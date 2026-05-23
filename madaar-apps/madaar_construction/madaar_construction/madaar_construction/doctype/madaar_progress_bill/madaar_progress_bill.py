# Copyright (c) 2026, Madaar Software and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class MadaarProgressBill(Document):
    """Construction progress billing (مستخلص) with retention handling.

    Lifecycle:
      validate    → derives `retention_amount` and `net_amount` from inputs
      on_submit   → posts a Sales Invoice for the full gross amount, then a
                    Journal Entry that reclassifies the retention portion
                    from the customer's Debtors balance into the Retention
                    Receivable asset account
      on_cancel   → cancels both linked vouchers

    Accounting view (gross 100,000, retention 10 %):
        Sales Invoice  : Dr Debtors 100,000   Cr Sales 100,000
        Retention JV   : Dr Retention Recv 10,000   Cr Debtors 10,000
                                                      (party = Customer)
        Net effect     : customer's outstanding = 90,000, retention asset
                         = 10,000, revenue recognised = 100,000.

    This mirrors standard Egyptian construction accounting where retention
    is held by the customer until project closeout but recognised as our
    asset (we earned it; it's just deferred cash).
    """

    # ── Lifecycle ───────────────────────────────────────────────────────────

    def validate(self) -> None:
        self.retention_amount = flt(self.gross_amount) * flt(self.retention_pct) / 100.0
        self.net_amount = flt(self.gross_amount) - flt(self.retention_amount)

    def on_submit(self) -> None:
        if flt(self.gross_amount) <= 0:
            frappe.throw(_("Cannot submit a Progress Bill with zero gross amount."))
        if not self.project:
            frappe.throw(_("Project is required to post the Sales Invoice."))

        customer, company = _resolve_project_party(self.project)

        si_name = self._post_sales_invoice(customer=customer, company=company)
        self.db_set("linked_sales_invoice", si_name)

        if flt(self.retention_amount) > 0:
            je_name = self._post_retention_journal(
                customer=customer, company=company, amount=flt(self.retention_amount)
            )
            self.db_set("linked_retention_je", je_name)

        self.db_set("status", "Submitted")

    def on_cancel(self) -> None:
        # Reverse retention JV first (so Debtors goes back up), then the SI.
        if self.linked_retention_je and frappe.db.exists("Journal Entry", self.linked_retention_je):
            je = frappe.get_doc("Journal Entry", self.linked_retention_je)
            if je.docstatus == 1:
                je.cancel()
        if self.linked_sales_invoice and frappe.db.exists("Sales Invoice", self.linked_sales_invoice):
            si = frappe.get_doc("Sales Invoice", self.linked_sales_invoice)
            if si.docstatus == 1:
                si.cancel()
        self.db_set("status", "Draft")

    # ── Internals ───────────────────────────────────────────────────────────

    def _post_sales_invoice(self, *, customer: str, company: str) -> str:
        item_code = _ensure_construction_work_item()
        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "customer": customer,
            "company": company,
            "posting_date": frappe.utils.today(),
            "due_date": frappe.utils.today(),
            "project": self.project,
            "items": [{
                "item_code": item_code,
                "qty": 1,
                "rate": flt(self.gross_amount),
                "description": _("Construction Progress Bill {0} — period {1} → {2}").format(
                    self.billing_number or self.name,
                    self.period_start,
                    self.period_end,
                ),
            }],
            "remarks": _("Auto-posted from Madaar Progress Bill {0}").format(self.name),
        })
        invoice.insert(ignore_permissions=True)
        invoice.submit()
        return invoice.name

    def _post_retention_journal(self, *, customer: str, company: str, amount: float) -> str:
        retention_account = _resolve_retention_account(company)
        debtors_account = _resolve_debtors_account(customer, company)

        je = frappe.get_doc({
            "doctype": "Journal Entry",
            "voucher_type": "Journal Entry",
            "company": company,
            "posting_date": frappe.utils.today(),
            "user_remark": _(
                "Retention {0}% reclassified from Debtors → {1} for Madaar Progress Bill {2}"
            ).format(flt(self.retention_pct), retention_account, self.name),
            "accounts": [
                {
                    "account": retention_account,
                    "debit_in_account_currency": amount,
                    "credit_in_account_currency": 0,
                },
                {
                    "account": debtors_account,
                    "party_type": "Customer",
                    "party": customer,
                    "debit_in_account_currency": 0,
                    "credit_in_account_currency": amount,
                    "reference_type": "Sales Invoice",
                    "reference_name": self.linked_sales_invoice,
                },
            ],
        })
        je.insert(ignore_permissions=True)
        je.submit()
        return je.name


# ── Helpers (module-level so other Madaar doctypes can call them) ───────────


def _resolve_project_party(project: str) -> tuple[str, str]:
    """Return ``(customer, company)`` for an ERPNext Project."""
    if not frappe.db.exists("Project", project):
        frappe.throw(_("Project {0} not found.").format(project))
    customer = frappe.db.get_value("Project", project, "customer")
    company = frappe.db.get_value("Project", project, "company")
    if not customer:
        frappe.throw(_("Project {0} has no Customer set.").format(project))
    if not company:
        # Fall back to global default — better than aborting.
        company = (
            frappe.db.get_single_value("Global Defaults", "default_company")
            or frappe.db.get_value("Company", {}, "name")
        )
    if not company:
        frappe.throw(_("Could not resolve a Company from Project {0}.").format(project))
    return customer, company


def _ensure_construction_work_item() -> str:
    """Sentinel non-stock service Item used as the Sales Invoice line.

    Mirrors `_ensure_event_revenue_item` from madaar_events — we use a single
    well-known item code so the SI carries a meaningful description without
    requiring the user to pre-configure anything.
    """
    code = "CONSTRUCTION-WORK"
    if frappe.db.exists("Item", code):
        return code
    item = frappe.get_doc({
        "doctype": "Item",
        "item_code": code,
        "item_name": "Construction Work",
        "item_group": frappe.db.get_value("Item Group", {"is_group": 0}) or "All Item Groups",
        "stock_uom": "Nos",
        "is_stock_item": 0,
        "is_sales_item": 1,
        "is_purchase_item": 0,
    })
    item.insert(ignore_permissions=True)
    return code


def _resolve_debtors_account(customer: str, company: str) -> str:
    """Per-company default receivable account for the customer.

    Re-uses the ERPNext helper so multi-currency setups Just Work.
    """
    from erpnext.accounts.party import get_party_account

    account = get_party_account("Customer", customer, company)
    if not account:
        frappe.throw(
            _("No default receivable account configured for {0} in {1}.").format(customer, company)
        )
    return account


def _resolve_retention_account(company: str) -> str:
    """Find or create the per-company Retention Receivable account.

    Looks for any non-group account in the company whose name or
    `account_name` contains "retention" (case-insensitive). If none exists,
    creates "Retention Receivable - <abbr>" as a child of the company's
    Accounts Receivable group (falling back to any asset group if AR isn't
    findable). The account is marked as Receivable type so it carries the
    natural debit balance for an asset.
    """
    company_abbr = frappe.db.get_value("Company", company, "abbr") or "MAD"

    # 1. Exact "Retention Receivable - <abbr>" match.
    exact = f"Retention Receivable - {company_abbr}"
    if frappe.db.exists("Account", exact):
        return exact

    # 2. Any account in the company whose name contains "retention".
    rows = frappe.get_all(
        "Account",
        filters=[
            ["company", "=", company],
            ["is_group", "=", 0],
            ["disabled", "=", 0],
            ["account_name", "like", "%Retention%"],
        ],
        fields=["name"],
        limit=1,
    )
    if rows:
        return rows[0]["name"]

    # 3. Auto-create under a Receivable / Asset parent.
    parent = (
        frappe.db.get_value(
            "Account",
            {"company": company, "account_name": ["in", ["Accounts Receivable", "Current Assets"]], "is_group": 1},
            "name",
        )
        or frappe.db.get_value(
            "Account",
            {"company": company, "root_type": "Asset", "is_group": 1},
            "name",
        )
    )
    if not parent:
        frappe.throw(
            _("Cannot create Retention Receivable account — no parent Asset group found in company {0}.").format(company)
        )

    account = frappe.get_doc({
        "doctype": "Account",
        "account_name": "Retention Receivable",
        "parent_account": parent,
        "company": company,
        "account_type": "Receivable",
        "root_type": "Asset",
        "is_group": 0,
    })
    account.insert(ignore_permissions=True)
    return account.name
