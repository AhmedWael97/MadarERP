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


# ──────────────────────────────────────────────────────────────────────────────
# Super Admin
# Endpoints behind /super-admin/* in the React app. Restricted to users with the
# "System Manager" role so tenants can't see each other's data.
# ──────────────────────────────────────────────────────────────────────────────

def _require_super_admin() -> None:
    """Raise PermissionError unless caller is a System Manager / Administrator."""
    user = frappe.session.user
    if user == "Administrator":
        return
    roles = set(frappe.get_roles(user))
    if "System Manager" not in roles and "Madaar Super Admin" not in roles:
        frappe.throw(
            "Only System Managers can access super-admin endpoints.",
            frappe.PermissionError,
        )


@frappe.whitelist()
def super_admin_overview() -> dict[str, Any]:
    """Aggregate counts + lists for the super-admin landing dashboard.

    Mirrors the data the reference's SuperAdminDashboardController computes:
    total companies / users / revenue, expiring subscriptions, companies by
    plan, module usage, recent companies, recent activity.
    """
    _require_super_admin()

    def _count(doctype: str, filters: dict | None = None) -> int:
        try:
            return frappe.db.count(doctype, filters or {})
        except Exception:
            return 0

    # ── Counts ────────────────────────────────────────────────────────────────
    total_companies = _count("Company")
    total_users = _count("User", {"enabled": 1, "name": ["!=", "Administrator"]})
    active_users = total_users  # alias until per-tenant user-status tracking exists

    # If the new tenant-subscription DocType exists, derive per-status counts.
    active_companies = trial_companies = suspended_companies = 0
    if frappe.db.has_table("tabMadaar Tenant Subscription") or frappe.db.exists("DocType", "Madaar Tenant Subscription"):
        try:
            active_companies = _count("Madaar Tenant Subscription", {"subscription_status": "active"})
            trial_companies = _count("Madaar Tenant Subscription", {"subscription_status": "trial"})
            suspended_companies = _count("Madaar Tenant Subscription", {"subscription_status": "suspended"})
        except Exception:
            pass

    total_plans = _count("Madaar Subscription Plan", {"is_active": 1}) if frappe.db.exists("DocType", "Madaar Subscription Plan") else 0

    # ── Monthly revenue (sum of active subscriptions' monthly_amount) ────────
    monthly_revenue = 0.0
    if frappe.db.exists("DocType", "Madaar Tenant Subscription"):
        try:
            rows = frappe.db.get_all(
                "Madaar Tenant Subscription",
                fields=["SUM(monthly_amount) as v"],
                filters={"subscription_status": "active"},
                as_list=True,
            )
            monthly_revenue = float(rows[0][0] or 0) if rows else 0.0
        except Exception:
            pass

    # ── Companies by plan ─────────────────────────────────────────────────────
    companies_by_plan: list[dict[str, Any]] = []
    if frappe.db.exists("DocType", "Madaar Tenant Subscription") and frappe.db.exists("DocType", "Madaar Subscription Plan"):
        try:
            rows = frappe.db.sql(
                """
                SELECT p.name AS plan_name, p.name_ar AS name_ar, p.name_en AS name_en,
                       COUNT(s.name) AS companies_count
                FROM `tabMadaar Subscription Plan` p
                LEFT JOIN `tabMadaar Tenant Subscription` s ON s.subscription_plan = p.name
                WHERE p.is_active = 1
                GROUP BY p.name
                ORDER BY companies_count DESC
                """,
                as_dict=True,
            )
            companies_by_plan = [
                {
                    "plan_name": r.plan_name,
                    "name_ar": r.name_ar or r.plan_name,
                    "name_en": r.name_en or r.plan_name,
                    "companies_count": int(r.companies_count or 0),
                }
                for r in rows
            ]
        except Exception:
            pass

    # ── Module usage ──────────────────────────────────────────────────────────
    # We approximate "usage" by counting distinct tenants whose plan includes
    # each module. Module list comes from the sidebar definition.
    module_keys = [
        "accounting", "sales", "purchases", "inventory", "treasury", "crm", "hr",
        "construction", "fleet", "logistics", "ecommerce", "restaurant", "workshop",
        "manufacturing", "tax", "support", "assets",
    ]
    module_stats: list[dict[str, Any]] = []
    if frappe.db.exists("DocType", "Madaar Tenant Subscription") and frappe.db.exists("DocType", "Madaar Subscription Plan"):
        try:
            for key in module_keys:
                count = frappe.db.sql(
                    """
                    SELECT COUNT(DISTINCT s.name)
                    FROM `tabMadaar Tenant Subscription` s
                    JOIN `tabMadaar Subscription Plan` p ON p.name = s.subscription_plan
                    WHERE p.modules LIKE %s AND s.subscription_status IN ('active','trial')
                    """,
                    (f"%{key}%",),
                )
                module_stats.append({"key": key, "name": key.title(), "count": int(count[0][0] or 0) if count else 0})
        except Exception:
            pass

    # ── Expiring subscriptions (next 30 days) ────────────────────────────────
    expiring: list[dict[str, Any]] = []
    if frappe.db.exists("DocType", "Madaar Tenant Subscription"):
        try:
            rows = frappe.db.sql(
                """
                SELECT s.name, s.tenant_company, s.name_ar, s.subscription_end_date,
                       p.name_ar AS plan_name_ar
                FROM `tabMadaar Tenant Subscription` s
                LEFT JOIN `tabMadaar Subscription Plan` p ON p.name = s.subscription_plan
                WHERE s.subscription_status IN ('active','trial')
                  AND s.subscription_end_date IS NOT NULL
                  AND s.subscription_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                ORDER BY s.subscription_end_date ASC
                LIMIT 10
                """,
                as_dict=True,
            )
            for r in rows:
                expiring.append({
                    "name": r.name,
                    "name_ar": r.name_ar or r.tenant_company,
                    "plan_name_ar": r.plan_name_ar,
                    "end_date": str(r.subscription_end_date) if r.subscription_end_date else None,
                })
        except Exception:
            pass

    # ── Recent companies ──────────────────────────────────────────────────────
    recent_companies: list[dict[str, Any]] = []
    if frappe.db.exists("DocType", "Madaar Tenant Subscription"):
        try:
            rows = frappe.db.get_all(
                "Madaar Tenant Subscription",
                fields=["name", "tenant_company", "name_ar", "subscription_status", "subscription_plan", "creation"],
                order_by="creation desc",
                limit=8,
            )
            for r in rows:
                plan_name_ar = None
                if r["subscription_plan"]:
                    plan_name_ar = frappe.db.get_value("Madaar Subscription Plan", r["subscription_plan"], "name_ar")
                recent_companies.append({
                    "name": r["name"],
                    "name_ar": r["name_ar"] or r["tenant_company"],
                    "plan_name_ar": plan_name_ar,
                    "subscription_status": r["subscription_status"],
                })
        except Exception:
            pass

    # ── Recent activity ───────────────────────────────────────────────────────
    recent_activity: list[dict[str, Any]] = []
    if frappe.db.exists("DocType", "Madaar Admin Activity Log"):
        try:
            rows = frappe.db.get_all(
                "Madaar Admin Activity Log",
                fields=["name", "action", "summary", "user", "creation", "tenant_company"],
                order_by="creation desc",
                limit=10,
            )
            for r in rows:
                recent_activity.append({
                    "name": r["name"],
                    "action": r["action"],
                    "summary": r["summary"],
                    "user": r["user"],
                    "tenant_company": r["tenant_company"],
                    "created_at": str(r["creation"]) if r["creation"] else None,
                })
        except Exception:
            pass

    return {
        "total_companies": total_companies,
        "active_companies": active_companies,
        "trial_companies": trial_companies,
        "suspended_companies": suspended_companies,
        "total_users": total_users,
        "active_users": active_users,
        "monthly_revenue": monthly_revenue,
        "total_plans": total_plans,
        "companies_by_plan": companies_by_plan,
        "module_stats": module_stats,
        "expiring_subscriptions": expiring,
        "recent_companies": recent_companies,
        "recent_activity": recent_activity,
    }


@frappe.whitelist()
def list_tenant_subscriptions(
    status: str | None = None,
    plan: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """Paginated list for the super-admin Companies page."""
    _require_super_admin()
    filters: dict[str, Any] = {}
    if status:
        filters["subscription_status"] = status
    if plan:
        filters["subscription_plan"] = plan
    or_filters: list | None = None
    if search:
        or_filters = [
            ["tenant_company", "like", f"%{search}%"],
            ["name_ar", "like", f"%{search}%"],
            ["owner_email", "like", f"%{search}%"],
        ]
    rows = frappe.get_all(
        "Madaar Tenant Subscription",
        filters=filters,
        or_filters=or_filters,
        fields=[
            "name", "tenant_company", "name_ar", "subscription_plan", "subscription_status",
            "subscription_start_date", "subscription_end_date", "owner_email", "phone",
            "monthly_amount", "currency", "current_users",
        ],
        order_by="modified desc",
        limit_start=int(offset),
        limit_page_length=int(limit),
    )
    total = frappe.db.count("Madaar Tenant Subscription", filters or {})
    return {"rows": rows, "total": total, "limit": int(limit), "offset": int(offset)}


@frappe.whitelist()
def list_subscription_plans() -> list[dict[str, Any]]:
    """All plans (active + inactive) for the super-admin Plans page."""
    _require_super_admin()
    return frappe.get_all(
        "Madaar Subscription Plan",
        fields=[
            "name", "plan_code", "name_en", "name_ar", "is_active", "sort_order",
            "monthly_price", "yearly_price", "currency", "trial_days",
            "max_companies", "max_users_per_company", "max_branches", "max_warehouses",
            "max_invoices_per_month", "max_products", "max_employees", "max_storage_mb",
            "modules",
        ],
        order_by="sort_order asc, monthly_price asc",
    )


@frappe.whitelist()
def toggle_tenant_status(tenant_company: str, status: str) -> dict[str, Any]:
    """Suspend / reactivate a tenant. Logs to `Madaar Admin Activity Log`."""
    _require_super_admin()
    valid = {"trial", "active", "suspended", "cancelled", "expired"}
    if status not in valid:
        frappe.throw(f"Invalid status: {status}")

    doc = frappe.get_doc("Madaar Tenant Subscription", tenant_company)
    prev = doc.subscription_status
    doc.subscription_status = status
    doc.save(ignore_permissions=True)

    from madaar_core.madaar_core.doctype.madaar_admin_activity_log.madaar_admin_activity_log import (
        MadaarAdminActivityLog,
    )
    MadaarAdminActivityLog.record(
        action="company_status_toggled",
        summary=f"Status: {prev} → {status}",
        tenant_company=tenant_company,
        target_doctype="Madaar Tenant Subscription",
        target_name=doc.name,
        details={"previous_status": prev, "new_status": status},
    )
    return {"ok": True, "tenant_company": tenant_company, "status": status}


@frappe.whitelist()
def list_admin_activity(limit: int = 100, offset: int = 0) -> dict[str, Any]:
    """Admin audit feed for `/super-admin/activity` page."""
    _require_super_admin()
    rows = frappe.get_all(
        "Madaar Admin Activity Log",
        fields=["name", "action", "summary", "user", "tenant_company", "creation", "target_doctype", "target_name"],
        order_by="creation desc",
        limit_start=int(offset),
        limit_page_length=int(limit),
    )
    total = frappe.db.count("Madaar Admin Activity Log")
    return {"rows": rows, "total": total, "limit": int(limit), "offset": int(offset)}
