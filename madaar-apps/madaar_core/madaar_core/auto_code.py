"""
Auto-numbering for ERPNext tree DocTypes (Account, Cost Center).

When a user creates a new Account or Cost Center without filling in the
code field, derive one from the parent's code:

    Parent code length 1  → suffix length 1  (parent `1` → children `11`, `12` …)
    Parent code length 2+ → suffix length 2  (parent `11` → children `1101`, `1102` …
                                              parent `1101` → children `110101`, `110102` …)

Among siblings already under the same parent, take the max suffix and add 1.
If the parent has no code (or is null), fall back to picking the next
unused root-level integer.

Wired in hooks.py as a `before_insert` hook so it fires regardless of which
UI (React SPA or ERPNext desk) issues the create.
"""
import frappe


# -- Generic helpers ---------------------------------------------------------

def _next_sibling_code(prefix: str, suffix_width: int, sibling_codes: list[str]) -> str:
    """Return `prefix` + zero-padded next-available suffix.

    Considers only siblings whose code is exactly `prefix + N` where N is a
    purely numeric `suffix_width`-digit string (so `1101` is treated as a
    sibling of `11` but `11A` or `1101X` are ignored).
    """
    max_suffix = 0
    for c in sibling_codes:
        if not c or not c.startswith(prefix):
            continue
        tail = c[len(prefix):]
        if len(tail) != suffix_width or not tail.isdigit():
            continue
        max_suffix = max(max_suffix, int(tail))
    return prefix + str(max_suffix + 1).zfill(suffix_width)


def _next_root_code(existing_root_codes: list[str]) -> str:
    """Pick the next 1-digit integer not already taken by a root-level entry."""
    used = sorted({int(c) for c in existing_root_codes if c and c.isdigit() and len(c) <= 2})
    n = 1
    for u in used:
        if u == n:
            n += 1
        elif u > n:
            break
    return str(n)


# -- Account (ERPNext) -------------------------------------------------------

def autoset_account_number(doc, method=None):
    """before_insert hook for Account. Skips if user typed a code."""
    if getattr(doc, "account_number", None):
        return

    parent_name = getattr(doc, "parent_account", None)
    company = getattr(doc, "company", None)

    if not parent_name:
        # Root level — pick next unused single-digit code for this company.
        existing = frappe.get_all(
            "Account",
            filters={"company": company, "is_group": 1, "parent_account": ["in", [None, ""]]},
            pluck="account_number",
        )
        doc.account_number = _next_root_code(existing)
        return

    parent_code = frappe.db.get_value("Account", parent_name, "account_number")
    if not parent_code:
        # Parent has no code; leave the child empty so the user can intervene
        # rather than guess. ERPNext will still build a `name` from account_name.
        return

    suffix_width = 1 if len(parent_code) == 1 else 2
    sibling_codes = frappe.get_all(
        "Account",
        filters={"parent_account": parent_name},
        pluck="account_number",
    )
    doc.account_number = _next_sibling_code(parent_code, suffix_width, sibling_codes)


# -- Cost Center (ERPNext) ---------------------------------------------------

def autoset_cost_center_number(doc, method=None):
    """before_insert hook for Cost Center. Same shape as Account."""
    if getattr(doc, "cost_center_number", None):
        return

    parent_name = getattr(doc, "parent_cost_center", None)
    company = getattr(doc, "company", None)

    if not parent_name:
        existing = frappe.get_all(
            "Cost Center",
            filters={"company": company, "is_group": 1, "parent_cost_center": ["in", [None, ""]]},
            pluck="cost_center_number",
        )
        doc.cost_center_number = _next_root_code(existing)
        return

    parent_code = frappe.db.get_value("Cost Center", parent_name, "cost_center_number")
    if not parent_code:
        return

    suffix_width = 1 if len(parent_code) == 1 else 2
    sibling_codes = frappe.get_all(
        "Cost Center",
        filters={"parent_cost_center": parent_name},
        pluck="cost_center_number",
    )
    doc.cost_center_number = _next_sibling_code(parent_code, suffix_width, sibling_codes)
