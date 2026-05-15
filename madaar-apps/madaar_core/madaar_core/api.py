"""Whitelisted API endpoints exposed to the React SPA.

The frontend calls these via `/api/method/madaar_core.api.<name>` after login.
Everything here is read-only or returns derived state — actual writes go through
the standard frappe.client.* endpoints.
"""

from __future__ import annotations

from typing import Any

import frappe


@frappe.whitelist()
def bootstrap() -> dict[str, Any]:
    """Single call the React app makes on login.

    Returns the tenant identity, current package + feature limits + usage, the user's
    locale, and any branding overrides. The SPA uses this to:
      - render the tenant chip in the topbar
      - proactively disable "Create" buttons that would hit a feature limit
      - pick the right default locale + branding
    """
    user = frappe.session.user
    settings = _madaar_settings()

    features = []
    for row in settings.get("feature_limits") or []:
        features.append(
            {
                "key": row.feature_key,
                "limit": row.limit,
                "period": row.period or "lifetime",
                "used": row.current_count or 0,
            }
        )

    return {
        "tenant_id": settings.get("tenant_id"),
        "package": settings.get("package_name"),
        "features": features,
        "user": {
            "name": user,
            "language": frappe.db.get_value("User", user, "language") or "ar",
            "full_name": frappe.db.get_value("User", user, "full_name"),
            "roles": frappe.get_roles(user),
            **_perm_arrays(user),
        },
        "branding": {
            "logo": settings.get("logo_url"),
            "primary_color": settings.get("primary_color") or "#10b981",
        },
    }


def _perm_arrays(user: str) -> dict[str, list[str]]:
    """Return the per-DocType permission arrays the React SPA reads on boot.

    Frappe's internal `frappe.boot.get_bootinfo` returns these but is NOT whitelisted
    for REST access, so we recompute them here from the user's roles.
    """
    from frappe.permissions import get_doctypes_with_read

    keys = ("read", "write", "create", "delete", "submit", "cancel", "print", "export", "email", "report")
    arrays: dict[str, list[str]] = {f"can_{k}": [] for k in keys}

    # Administrator has full access to everything — short-circuit.
    if user == "Administrator":
        all_dts = frappe.get_all("DocType", filters={"istable": 0}, pluck="name")
        for k in keys:
            arrays[f"can_{k}"] = list(all_dts)
        return arrays

    readable = set(get_doctypes_with_read())
    arrays["can_read"] = list(readable)

    # For each readable DocType, ask frappe.has_permission per action.
    for dt in readable:
        for k in keys:
            if k == "read":
                continue
            if frappe.has_permission(dt, ptype=k, user=user, throw=False):
                arrays[f"can_{k}"].append(dt)

    return arrays


@frappe.whitelist()
def complete_setup(
    company_name: str = "Madaar Demo",
    company_abbr: str = "MAD",
    country: str = "Egypt",
    currency: str = "EGP",
) -> dict[str, Any]:
    """Run Frappe's setup wizard with Egyptian defaults.

    Exposed so the React dashboard can offer a one-click "complete setup" button
    when the system is not yet initialised (no Company exists).
    """
    from madaar_core.setup import bootstrap_tenant

    bootstrap_tenant(
        company_name=company_name,
        company_abbr=company_abbr,
        country=country,
        currency=currency,
    )
    return {"ok": True, "company": company_name}


@frappe.whitelist()
def dashboard_stats() -> dict[str, Any]:
    """Aggregate counts the React Dashboard renders as KPI tiles.

    Returns zeros if the system is empty (no Company set up yet) so the UI shows
    a clean state instead of fake placeholders.
    """
    def _count(doctype: str, filters: dict | None = None) -> int:
        try:
            return frappe.db.count(doctype, filters or {})
        except Exception:
            return 0

    def _sum(doctype: str, field: str, filters: dict | None = None) -> float:
        try:
            rows = frappe.db.get_all(
                doctype,
                fields=[f"SUM(`{field}`) as v"],
                filters=filters or {},
                as_list=True,
            )
            return float(rows[0][0] or 0) if rows else 0.0
        except Exception:
            return 0.0

    import datetime
    today = datetime.date.today().isoformat()

    company_exists = _count("Company") > 0

    return {
        "company_exists": company_exists,
        "sales_today": _sum("Sales Invoice", "grand_total", {"posting_date": today, "docstatus": 1}),
        "purchases_today": _sum("Purchase Invoice", "grand_total", {"posting_date": today, "docstatus": 1}),
        "customers": _count("Customer"),
        "suppliers": _count("Supplier"),
        "items": _count("Item"),
        "employees": _count("Employee"),
        "invoices": _count("Sales Invoice"),
        "outstanding_receivables": _sum("Sales Invoice", "outstanding_amount", {"docstatus": 1}),
    }


@frappe.whitelist()
def get_limits() -> list[dict[str, Any]]:
    """Lightweight subset of bootstrap — only the feature limits.

    Useful to refresh after a successful insert that bumped a counter.
    """
    settings = _madaar_settings()
    return [
        {
            "key": row.feature_key,
            "limit": row.limit,
            "period": row.period or "lifetime",
            "used": row.current_count or 0,
        }
        for row in settings.get("feature_limits") or []
    ]


@frappe.whitelist(allow_guest=False)
def sync_limits(payload: dict[str, Any] | str) -> dict[str, Any]:
    """Called by the control plane to push the current package + limits into this tenant.

    Authenticated using a server-to-server API key/secret stored as a Madaar Settings
    secret. The control plane signs every call with that pair via the standard
    `Authorization: token` header.
    """
    if isinstance(payload, str):
        import json

        payload = json.loads(payload)

    settings = _madaar_settings()
    settings.tenant_id = payload.get("tenant_id") or settings.tenant_id
    settings.package_name = payload.get("package") or settings.package_name

    incoming = {f["key"]: f for f in payload.get("features", [])}

    # Replace the child rows wholesale — limits push is the source of truth.
    settings.set("feature_limits", [])
    for key, info in incoming.items():
        settings.append(
            "feature_limits",
            {
                "feature_key": key,
                "limit": int(info.get("limit", -1)),
                "period": info.get("period", "lifetime"),
                "current_count": 0,
            },
        )
    settings.save(ignore_permissions=True)
    frappe.db.commit()
    return {"ok": True, "features": len(incoming)}


def _madaar_settings():
    name = "Madaar Settings"
    if not frappe.db.exists("Madaar Settings", name):
        doc = frappe.get_doc({"doctype": "Madaar Settings", "name": name})
        doc.insert(ignore_permissions=True)
    return frappe.get_single("Madaar Settings")
