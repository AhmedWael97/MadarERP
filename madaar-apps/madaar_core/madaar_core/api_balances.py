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
