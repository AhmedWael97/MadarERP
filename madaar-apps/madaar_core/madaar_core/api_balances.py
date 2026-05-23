"""
Lightweight balance API for the React SPA.

The treasury and bank-account list pages need to display the current balance
per row (and a grand total at the top). ERPNext provides
`erpnext.accounts.utils.get_balance_on` per-account, but calling that once
per row from the browser is wasteful. This module batches multiple accounts
into a single request and returns a {account_name: balance} dict.
"""
from __future__ import annotations

import json

import frappe
from frappe import _


@frappe.whitelist()
def get_account_balances(accounts: list[str] | str, date: str | None = None) -> dict:
    """Return ``{account_name: signed_balance}`` for the given accounts.

    Signed balance follows ERPNext convention: positive for asset/expense
    accounts that carry a debit balance and for liability/income accounts that
    carry a credit balance (i.e. the natural balance for the account type).
    """
    if isinstance(accounts, str):
        try:
            accounts = json.loads(accounts)
        except json.JSONDecodeError:
            accounts = [accounts] if accounts else []
    if not isinstance(accounts, list):
        return {}

    date = date or frappe.utils.nowdate()
    try:
        from erpnext.accounts.utils import get_balance_on
    except Exception:
        get_balance_on = None  # type: ignore

    out: dict[str, float] = {}
    for acc in accounts:
        if not acc:
            continue
        try:
            if get_balance_on:
                out[acc] = float(get_balance_on(account=acc, date=date) or 0)
            else:
                # ERPNext not installed — fall back to raw GL sum.
                row = frappe.db.sql(
                    """select coalesce(sum(debit) - sum(credit), 0)
                       from `tabGL Entry`
                       where account = %s and is_cancelled = 0 and posting_date <= %s""",
                    (acc, date),
                )
                out[acc] = float(row[0][0]) if row else 0.0
        except Exception:
            out[acc] = 0.0
    return out


@frappe.whitelist()
def get_party_outstanding(
    parties: list[str] | str,
    party_type: str = "Customer",
    company: str | None = None,
    date: str | None = None,
) -> dict:
    """Return ``{party_name: signed_outstanding}`` for the given Customers / Suppliers.

    Conventions:
      * **Customer** balance: positive = customer owes us (Debtors GL > 0).
      * **Supplier** balance: positive = we owe supplier (Creditors GL < 0,
        flipped here so the sign matches "amount due").

    Computed straight off `tabGL Entry` (the same table Customer Aging and
    Trial Balance read). Cancelled rows are excluded; future-dated rows are
    excluded if `date` is given. One round-trip per list page — the
    Customer / Supplier list pages call this once with up to 100 party
    names and join the result client-side.
    """
    if isinstance(parties, str):
        try:
            parties = json.loads(parties)
        except json.JSONDecodeError:
            parties = [parties] if parties else []
    if not isinstance(parties, list) or not parties:
        return {}

    date = date or frappe.utils.nowdate()
    if party_type not in ("Customer", "Supplier", "Employee", "Shareholder"):
        # Frappe supports more party types in principle; we restrict here to
        # the ones our UI currently surfaces, to avoid expensive injection
        # surface via this whitelisted method.
        return {}

    placeholders = ", ".join(["%s"] * len(parties))
    args: list = [party_type] + list(parties) + [date]
    company_clause = ""
    if company:
        company_clause = " AND company = %s"
        args.append(company)

    try:
        rows = frappe.db.sql(
            f"""SELECT party, COALESCE(SUM(debit) - SUM(credit), 0) AS balance
                FROM `tabGL Entry`
                WHERE party_type = %s
                  AND party IN ({placeholders})
                  AND is_cancelled = 0
                  AND posting_date <= %s
                  {company_clause}
                GROUP BY party""",
            args,
            as_dict=True,
        )
    except Exception:
        # If the GL Entry table doesn't exist yet (very fresh tenant) just
        # return zeros — the UI handles missing keys gracefully.
        return {p: 0.0 for p in parties}

    # Suppliers carry a credit balance natively (debit - credit is negative
    # when we owe them). Flip the sign so the column shows "amount owed".
    flip = -1 if party_type == "Supplier" else 1
    out: dict[str, float] = {p: 0.0 for p in parties}
    for r in rows:
        out[r["party"]] = float(r["balance"] or 0) * flip
    return out
