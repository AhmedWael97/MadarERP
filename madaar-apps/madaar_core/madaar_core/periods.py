"""
Generate and toggle Accounting Periods inside a Fiscal Year.

ERPNext already ships the locking machinery — Accounting Period has a
`closed_documents` child table, and its controller blocks insert / submit
/ cancel of any listed doctype that has closed=1 during the period
window. What ERPNext doesn't do is auto-split a fiscal year into N
equal-length periods, so this module wires that up.

Public endpoints (all whitelisted):
  - list_periods(fiscal_year)
  - generate_periods(fiscal_year, period_months=1, doctypes=None, replace=False)
  - set_period_closed(period_name, closed: bool)
"""
from __future__ import annotations

import calendar
import json
from datetime import date

import frappe
from frappe.utils import add_months, get_last_day, getdate


# Transactional doctypes that should be blocked when a period closes.
# Mirrors the set Frappe shows by default in the Accounting Period UI.
DEFAULT_BLOCKED_DOCTYPES = [
    "Sales Invoice",
    "Purchase Invoice",
    "Payment Entry",
    "Journal Entry",
    "Stock Entry",
    "Delivery Note",
    "Purchase Receipt",
    "Asset",
    "Asset Repair",
    "Asset Capitalization",
    "Subcontracting Receipt",
    "Subcontracting Order",
    "Period Closing Voucher",
]


def _months_in_range(start: date, total_months: int, chunk: int) -> list[tuple[date, date]]:
    """Walk forward from `start` in `chunk`-month windows, total `total_months`."""
    out: list[tuple[date, date]] = []
    cursor = start
    remaining = total_months
    while remaining > 0:
        size = min(chunk, remaining)
        end_month = add_months(cursor, size - 1)
        period_end = get_last_day(end_month)
        out.append((cursor, getdate(period_end)))
        cursor = add_months(period_end, 1)
        # add_months returned 1st of next month is wrong — we want first day of next month.
        cursor = cursor.replace(day=1)
        remaining -= size
    return out


@frappe.whitelist()
def list_periods(fiscal_year: str) -> list[dict]:
    """All Accounting Periods that fall inside this fiscal year, ordered by
    start. Each row also carries `closed` (any closed_documents row blocked),
    `total_in` and `total_out` — cash/bank flow inside that period (debits to
    Cash/Bank accounts = money received, credits = money paid). Useful as an
    at-a-glance treasury summary per month."""
    fy = frappe.db.get_value(
        "Fiscal Year", fiscal_year, ["year_start_date", "year_end_date"], as_dict=True
    )
    if not fy:
        frappe.throw(f"Fiscal Year {fiscal_year} not found.")
    rows = frappe.get_all(
        "Accounting Period",
        filters={
            "start_date": [">=", fy.year_start_date],
            "end_date": ["<=", fy.year_end_date],
        },
        fields=["name", "period_name", "start_date", "end_date", "company"],
        order_by="start_date asc",
        limit=120,
    )
    for r in rows:
        # Closed flag — true if any line in closed_documents is closed.
        closed = frappe.db.sql(
            "select count(*) from `tabClosed Document` where parent=%s and closed=1",
            (r["name"],),
        )
        r["closed"] = bool(closed and closed[0][0])

        # Prefer Cash/Bank flow for this period. Some deployments don't maintain
        # account_type consistently, so this can legitimately return zeros even
        # when the fiscal period has accounting activity.
        flow = frappe.db.sql(
            """
            select
                coalesce(sum(gl.debit),  0)  as debit_in,
                coalesce(sum(gl.credit), 0)  as credit_out
            from `tabGL Entry` gl
            inner join `tabAccount` a on a.name = gl.account
            where gl.is_cancelled = 0
              and gl.posting_date between %s and %s
              and (gl.company = %s or %s is null)
              and a.account_type in ('Cash', 'Bank')
            """,
            (r["start_date"], r["end_date"], r["company"], r["company"]),
            as_dict=True,
        )
        cash_in = float((flow[0]["debit_in"] if flow else 0) or 0)
        cash_out = float((flow[0]["credit_out"] if flow else 0) or 0)

        if cash_in > 0 or cash_out > 0:
            r["total_in"] = cash_in
            r["total_out"] = cash_out
            continue

        # Fallback #1: if company-scoped flow is zero, try the same period
        # across all companies. This handles fiscal years shared across
        # companies where Accounting Period.company doesn't match posting data.
        fallback_any_company = frappe.db.sql(
            """
            select
                coalesce(sum(gl.debit),  0) as debit_in,
                coalesce(sum(gl.credit), 0) as credit_out
            from `tabGL Entry` gl
            where gl.is_cancelled = 0
              and gl.posting_date between %s and %s
            """,
            (r["start_date"], r["end_date"]),
            as_dict=True,
        )
        any_in = float((fallback_any_company[0]["debit_in"] if fallback_any_company else 0) or 0)
        any_out = float((fallback_any_company[0]["credit_out"] if fallback_any_company else 0) or 0)
        if any_in > 0 or any_out > 0:
            r["total_in"] = any_in
            r["total_out"] = any_out
            continue

        # Fallback #2: if still zero, keep company-scoped all-account totals
        # as a defensive last result.
        fallback = frappe.db.sql(
            """
            select
                coalesce(sum(gl.debit),  0) as debit_in,
                coalesce(sum(gl.credit), 0) as credit_out
            from `tabGL Entry` gl
            where gl.is_cancelled = 0
              and gl.posting_date between %s and %s
              and (gl.company = %s or %s is null)
            """,
            (r["start_date"], r["end_date"], r["company"], r["company"]),
            as_dict=True,
        )
        r["total_in"] = float((fallback[0]["debit_in"] if fallback else 0) or 0)
        r["total_out"] = float((fallback[0]["credit_out"] if fallback else 0) or 0)
    return rows


@frappe.whitelist()
def generate_periods(
    fiscal_year: str,
    period_months: int = 1,
    doctypes: list[str] | str | None = None,
    company: str | None = None,
    replace: int | bool = False,
) -> dict:
    """Split the fiscal year into `period_months`-long windows and insert one
    Accounting Period per window. If `replace` is truthy and existing periods
    are inside the fiscal year, delete them first.
    """
    period_months = int(period_months or 1)
    if period_months < 1 or period_months > 12:
        frappe.throw("period_months must be between 1 and 12.")
    replace = bool(int(replace) if isinstance(replace, str) else replace)
    if isinstance(doctypes, str):
        try:
            doctypes = json.loads(doctypes)
        except json.JSONDecodeError:
            doctypes = None
    blocked = doctypes if isinstance(doctypes, list) and doctypes else DEFAULT_BLOCKED_DOCTYPES

    fy = frappe.db.get_value(
        "Fiscal Year", fiscal_year, ["year_start_date", "year_end_date"], as_dict=True
    )
    if not fy:
        frappe.throw(f"Fiscal Year {fiscal_year} not found.")
    company = company or frappe.db.get_single_value("Global Defaults", "default_company")
    if not company:
        frappe.throw("Default Company is not set — please set Global Defaults.default_company first.")

    if replace:
        existing = frappe.get_all(
            "Accounting Period",
            filters={
                "start_date": [">=", fy.year_start_date],
                "end_date": ["<=", fy.year_end_date],
                "company": company,
            },
            pluck="name",
        )
        for n in existing:
            frappe.delete_doc("Accounting Period", n, force=True, ignore_permissions=True)

    start = getdate(fy.year_start_date)
    end = getdate(fy.year_end_date)
    total_months = (end.year - start.year) * 12 + (end.month - start.month) + 1
    windows = _months_in_range(start, total_months, period_months)
    # Clamp last window to fiscal year end so it doesn't spill over.
    last = windows[-1]
    if last[1] > end:
        windows[-1] = (last[0], end)

    arabic_months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ]

    created: list[str] = []
    for ws, we in windows:
        if period_months == 1:
            name = f"{arabic_months[ws.month - 1]} {ws.year}"
        else:
            name = f"{ws.strftime('%Y-%m-%d')} → {we.strftime('%Y-%m-%d')}"
        # Skip if an identical window already exists for this company.
        already = frappe.db.exists("Accounting Period", {
            "start_date": ws, "end_date": we, "company": company,
        })
        if already:
            continue
        doc = frappe.new_doc("Accounting Period")
        doc.period_name = name
        doc.start_date = ws
        doc.end_date = we
        doc.company = company
        # Seed closed_documents with every blockable doctype but mark all as open.
        for dt in blocked:
            doc.append("closed_documents", {"document_type": dt, "closed": 0})
        doc.insert(ignore_permissions=True)
        created.append(doc.name)

    return {
        "fiscal_year": fiscal_year,
        "company": company,
        "period_months": period_months,
        "created": created,
        "total_windows": len(windows),
    }


@frappe.whitelist()
def set_period_closed(period_name: str, closed: int | bool | str) -> dict:
    """Toggle every closed_documents row to `closed` (1/0) on this period."""
    flag = 1 if (str(closed).lower() in ("1", "true", "yes")) else 0
    doc = frappe.get_doc("Accounting Period", period_name)
    if not doc.closed_documents:
        for dt in DEFAULT_BLOCKED_DOCTYPES:
            doc.append("closed_documents", {"document_type": dt, "closed": flag})
    else:
        for row in doc.closed_documents:
            row.closed = flag
    doc.save(ignore_permissions=True)
    return {"period_name": period_name, "closed": bool(flag)}
