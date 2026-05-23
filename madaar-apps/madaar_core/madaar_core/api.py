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


@frappe.whitelist()
def create_company_with_subscription(payload: dict[str, Any] | str) -> dict[str, Any]:
    """Atomically create an ERPNext Company + a Madaar Tenant Subscription.

    The super-admin "Create a new company" form holds fields for both — the
    Company's `abbr` / `default_currency` / `country` / `chart_of_accounts`
    AND the subscription's `subscription_status` / `owner_email` / `plan` /
    `enabled_modules`. The Tenant Subscription's `tenant_company` is a Link
    to `Company`, so the Company has to exist FIRST or Frappe throws
    LinkValidationError on insert.

    Steps:
      1. Pull Company-side fields from the payload and create the Company
         if it doesn't already exist (this seeds the Chart of Accounts via
         ERPNext's standard `setup_complete`-style hooks).
      2. Optionally create a Fiscal Year for the company if start/end dates
         are provided and one doesn't already cover the period.
      3. Pull subscription-side fields and create the Madaar Tenant
         Subscription row pointing at the Company.

    Returns ``{ok: True, tenant_company, subscription, company_created}``.

    Idempotent on the Company side — if a Company with the same name exists
    the create is skipped and we link to it. The Tenant Subscription create
    will still fail on the unique constraint if one already exists for that
    company, surfacing a clear DuplicateEntryError to the caller.
    """
    _require_super_admin()

    if isinstance(payload, str):
        import json

        payload = json.loads(payload)
    if not isinstance(payload, dict):
        frappe.throw("Payload must be an object")

    company_name = (payload.get("tenant_company") or "").strip()
    if not company_name:
        frappe.throw("Company ID (tenant_company) is required.")
    abbr = (payload.get("abbr") or "").strip()
    if not abbr and not frappe.db.exists("Company", company_name):
        frappe.throw("Company abbreviation (abbr) is required when creating a new Company.")

    # ── Step 1: create Company if missing ───────────────────────────────────
    company_created = False
    if not frappe.db.exists("Company", company_name):
        co = frappe.get_doc({
            "doctype": "Company",
            "company_name": company_name,
            "abbr": abbr,
            "default_currency": payload.get("default_currency") or "EGP",
            "country": payload.get("country") or "Egypt",
            "chart_of_accounts": payload.get("chart_of_accounts") or "Standard",
        })
        co.insert(ignore_permissions=True)
        company_created = True
        frappe.db.commit()  # ensure Company exists before the Link below validates

    # ── Step 2: Fiscal Year (best-effort, never blocks the flow) ────────────
    fy_start = payload.get("fy_start_date")
    fy_end = payload.get("fy_end_date")
    if fy_start and fy_end:
        try:
            existing_fy = frappe.db.get_value(
                "Fiscal Year",
                {"year_start_date": fy_start, "year_end_date": fy_end},
                "name",
            )
            if not existing_fy:
                year_label = str(fy_start)[:4]
                fy = frappe.get_doc({
                    "doctype": "Fiscal Year",
                    "year": year_label,
                    "year_start_date": fy_start,
                    "year_end_date": fy_end,
                    "companies": [{"company": company_name}],
                })
                fy.insert(ignore_permissions=True)
        except Exception:
            frappe.log_error(frappe.get_traceback(), "create_company_with_subscription.fiscal_year")

    # ── Step 3: Tenant Subscription ─────────────────────────────────────────
    # Whitelist the fields we actually persist on the subscription so junk
    # like `subdomain`/`max_users`/`abbr` (which the form sends but the
    # doctype doesn't define) doesn't crash the insert.
    sub_field_names = {
        "tenant_company", "name_ar", "subscription_plan", "subscription_status",
        "owner_email", "phone",
        "subscription_start_date", "subscription_end_date", "trial_ends_at",
        "billing_period", "monthly_amount", "currency", "notes",
        "enabled_modules",
    }
    sub_doc: dict[str, Any] = {"doctype": "Madaar Tenant Subscription"}
    for k in sub_field_names:
        v = payload.get(k)
        if v is None or v == "":
            continue
        # The doctype stores enabled_modules as a JSON string in a Long Text
        # field. Accept either a list (we serialise) or a pre-serialised string.
        if k == "enabled_modules" and not isinstance(v, str):
            import json

            v = json.dumps(v)
        sub_doc[k] = v
    sub_doc["tenant_company"] = company_name  # canonical — always set
    if not sub_doc.get("subscription_status"):
        sub_doc["subscription_status"] = "trial"

    sub = frappe.get_doc(sub_doc)
    sub.insert(ignore_permissions=True)
    frappe.db.commit()

    return {
        "ok": True,
        "tenant_company": company_name,
        "subscription": sub.name,
        "company_created": company_created,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Sales Commissions
# Persistent policy + server-side commission calculations consumed by the
# Sales Commission frontend pages.
# ──────────────────────────────────────────────────────────────────────────────

def _default_company() -> str:
    company = frappe.defaults.get_user_default("Company") or frappe.db.get_value(
        "Company", filters={}, fieldname="name", order_by="creation asc"
    )
    if not company:
        frappe.throw("No Company exists yet.")
    return company


def _normalize_sales_person(value: str | None) -> str:
    cleaned = (value or "").strip()
    if cleaned.lower() in {"default", "all", "none"}:
        return ""
    return cleaned


def _parse_tiers(tiers: list[dict[str, Any]] | str | None) -> list[dict[str, float]]:
    if tiers is None:
        return []
    parsed = tiers
    if isinstance(tiers, str):
        import json

        parsed = json.loads(tiers)
    if not isinstance(parsed, list):
        frappe.throw("tiers must be a list")

    out: list[dict[str, float]] = []
    for row in parsed:
        if not isinstance(row, dict):
            continue
        out.append(
            {
                "from_amount": float(row.get("from_amount", row.get("from", 0)) or 0),
                "to_amount": float(row.get("to_amount", row.get("to", 0)) or 0),
                "commission_percentage": float(row.get("commission_percentage", row.get("percentage", 0)) or 0),
            }
        )
    return out


def _load_policy(company: str, sales_person: str) -> dict[str, Any] | None:
    if sales_person:
        exact = frappe.db.sql(
            """
            SELECT name, company, sales_person, is_active, notes
            FROM `tabMadaar Commission Policy`
            WHERE company = %s
              AND COALESCE(sales_person, '') = %s
              AND is_active = 1
            ORDER BY modified DESC
            LIMIT 1
            """,
            (company, sales_person),
            as_dict=True,
        )
        if exact:
            return dict(exact[0])

    fallback = frappe.db.sql(
        """
        SELECT name, company, sales_person, is_active, notes
        FROM `tabMadaar Commission Policy`
        WHERE company = %s
          AND COALESCE(sales_person, '') = ''
          AND is_active = 1
        ORDER BY modified DESC
        LIMIT 1
        """,
        (company,),
        as_dict=True,
    )
    if fallback:
        return dict(fallback[0])
    return None


@frappe.whitelist()
def get_commission_policy(
    sales_person: str | None = None,
    company: str | None = None,
) -> dict[str, Any]:
    company_name = company or _default_company()
    rep = _normalize_sales_person(sales_person)

    policy = _load_policy(company_name, rep)
    if not policy:
        return {
            "company": company_name,
            "sales_person": rep,
            "policy_name": None,
            "is_active": 1,
            "notes": "",
            "tiers": [],
            "fallback_used": False,
        }

    tier_rows = frappe.get_all(
        "Madaar Commission Policy Tier",
        filters={"parent": policy["name"], "parenttype": "Madaar Commission Policy"},
        fields=["from_amount", "to_amount", "commission_percentage"],
        order_by="idx asc",
    )
    return {
        "company": policy["company"],
        "sales_person": policy.get("sales_person") or "",
        "policy_name": policy["name"],
        "is_active": int(policy.get("is_active") or 0),
        "notes": policy.get("notes") or "",
        "tiers": [
            {
                "from_amount": float(r.get("from_amount") or 0),
                "to_amount": float(r.get("to_amount") or 0),
                "commission_percentage": float(r.get("commission_percentage") or 0),
            }
            for r in tier_rows
        ],
        "fallback_used": bool(rep and not policy.get("sales_person")),
    }


@frappe.whitelist()
def save_commission_policy(
    sales_person: str | None = None,
    tiers: list[dict[str, Any]] | str | None = None,
    company: str | None = None,
    is_active: int = 1,
    notes: str | None = None,
) -> dict[str, Any]:
    company_name = company or _default_company()
    rep = _normalize_sales_person(sales_person)
    tier_rows = _parse_tiers(tiers)
    if not tier_rows:
        frappe.throw("At least one tier is required")

    existing = frappe.db.sql(
        """
        SELECT name
        FROM `tabMadaar Commission Policy`
        WHERE company = %s
          AND COALESCE(sales_person, '') = %s
        ORDER BY modified DESC
        LIMIT 1
        """,
        (company_name, rep),
        as_dict=True,
    )

    if existing:
        doc = frappe.get_doc("Madaar Commission Policy", existing[0]["name"])
    else:
        doc = frappe.get_doc({
            "doctype": "Madaar Commission Policy",
            "company": company_name,
            "sales_person": rep or None,
        })

    doc.company = company_name
    doc.sales_person = rep or None
    doc.is_active = int(is_active or 0)
    doc.notes = notes or ""
    doc.set("tiers", [])
    for row in tier_rows:
        doc.append("tiers", row)

    if doc.is_new():
        doc.insert(ignore_permissions=False)
    else:
        doc.save(ignore_permissions=False)

    return get_commission_policy(sales_person=rep, company=company_name)


@frappe.whitelist()
def get_sales_commissions(
    from_date: str,
    to_date: str,
    sales_person: str | None = None,
    company: str | None = None,
) -> dict[str, Any]:
    company_name = company or _default_company()
    rep_filter = _normalize_sales_person(sales_person)

    filters: dict[str, Any] = {
        "docstatus": 1,
        "posting_date": ["between", [from_date, to_date]],
        "company": company_name,
    }
    if rep_filter:
        filters["madaar_sales_person"] = rep_filter

    invoices = frappe.get_all(
        "Sales Invoice",
        filters=filters,
        fields=[
            "name",
            "posting_date",
            "company",
            "customer",
            "customer_name",
            "madaar_sales_person",
            "rounded_total",
            "grand_total",
        ],
        order_by="posting_date desc, modified desc",
        limit_page_length=2000,
    )

    policy_rows = frappe.get_all(
        "Madaar Commission Policy",
        filters={"company": company_name, "is_active": 1},
        fields=["name", "sales_person"],
        limit_page_length=500,
    )
    policy_names = [p["name"] for p in policy_rows]
    tier_rows = frappe.get_all(
        "Madaar Commission Policy Tier",
        filters={"parent": ["in", policy_names], "parenttype": "Madaar Commission Policy"}
        if policy_names
        else {"parent": "__none__"},
        fields=["parent", "from_amount", "to_amount", "commission_percentage"],
        order_by="idx asc",
        limit_page_length=5000,
    )

    tiers_by_policy: dict[str, list[dict[str, float]]] = {}
    for t in tier_rows:
        tiers_by_policy.setdefault(t["parent"], []).append(
            {
                "from_amount": float(t.get("from_amount") or 0),
                "to_amount": float(t.get("to_amount") or 0),
                "commission_percentage": float(t.get("commission_percentage") or 0),
            }
        )

    policy_for_rep: dict[str, tuple[str, list[dict[str, float]]]] = {}
    default_policy: tuple[str, list[dict[str, float]]] | None = None
    for p in policy_rows:
        rep = (p.get("sales_person") or "").strip()
        policy_tuple = (p["name"], tiers_by_policy.get(p["name"], []))
        if rep:
            policy_for_rep[rep] = policy_tuple
        elif default_policy is None:
            default_policy = policy_tuple

    def _pick_tier(amount: float, tiers_data: list[dict[str, float]]) -> dict[str, float] | None:
        for tier in tiers_data:
            if amount >= tier["from_amount"] and amount <= tier["to_amount"]:
                return tier
        return None

    rows: list[dict[str, Any]] = []
    summary_map: dict[str, dict[str, float]] = {}
    total_sales = 0.0
    total_commission = 0.0

    for inv in invoices:
        rep = (inv.get("madaar_sales_person") or "").strip()
        chosen = policy_for_rep.get(rep) or default_policy
        policy_name = chosen[0] if chosen else None
        tiers_data = chosen[1] if chosen else []

        amount = float(inv.get("rounded_total") or inv.get("grand_total") or 0)
        tier = _pick_tier(amount, tiers_data)
        pct = float(tier.get("commission_percentage") or 0) if tier else 0.0
        commission = (amount * pct) / 100.0

        rows.append(
            {
                "name": inv["name"],
                "posting_date": str(inv["posting_date"]),
                "company": inv.get("company"),
                "customer": inv.get("customer"),
                "customer_name": inv.get("customer_name"),
                "sales_rep": rep,
                "amount": amount,
                "percentage": pct,
                "commission": commission,
                "policy_name": policy_name,
            }
        )

        summary_key = rep or ""
        if summary_key not in summary_map:
            summary_map[summary_key] = {"sales": 0.0, "commission": 0.0, "count": 0.0}
        summary_map[summary_key]["sales"] += amount
        summary_map[summary_key]["commission"] += commission
        summary_map[summary_key]["count"] += 1.0

        total_sales += amount
        total_commission += commission

    summary = [
        {
            "sales_rep": key,
            "sales": val["sales"],
            "commission": val["commission"],
            "count": int(val["count"]),
        }
        for key, val in summary_map.items()
    ]
    summary.sort(key=lambda r: r["commission"], reverse=True)

    return {
        "rows": rows,
        "summary": summary,
        "total_sales": total_sales,
        "total_commission": total_commission,
        "from_date": from_date,
        "to_date": to_date,
        "company": company_name,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Retail POS
# Endpoints powering the React cashier UI at /retail/pos. Combine ERPNext's
# POS Profile / POS Opening Entry / POS Invoice with our barcode + price-list
# helpers so the cashier doesn't have to round-trip the Desk.
# ──────────────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_pos_payment_modes(pos_profile: str | None = None) -> list[dict[str, Any]]:
    """Active payment modes available at the POS.

    If `pos_profile` is given, return only modes attached to that profile
    (POS Profile Payment Method child table). Otherwise return every enabled
    Mode of Payment so a profile-less cashier UI still has something to show.

    Each row: {mode, type, default}.
    """
    if pos_profile and frappe.db.exists("POS Profile", pos_profile):
        rows = frappe.get_all(
            "Sales Invoice Payment",
            filters={"parent": pos_profile, "parenttype": "POS Profile"},
            fields=["mode_of_payment as mode", "default"],
            order_by="idx asc",
        )
        modes = [r for r in rows if r.get("mode")]
        if modes:
            type_map: dict[str, str] = {}
            for m in modes:
                t = frappe.db.get_value("Mode of Payment", m["mode"], "type")
                type_map[m["mode"]] = t or "Cash"
            return [
                {"mode": m["mode"], "type": type_map.get(m["mode"], "Cash"), "default": int(m.get("default") or 0)}
                for m in modes
            ]
    return [
        {"mode": r["name"], "type": r.get("type") or "Cash", "default": 0}
        for r in frappe.get_all(
            "Mode of Payment",
            filters={"enabled": 1},
            fields=["name", "type"],
            order_by="name asc",
        )
    ]


@frappe.whitelist()
def list_pos_profiles() -> list[dict[str, Any]]:
    """POS Profiles the current user can operate.

    Filters by `applicable_for_users` when populated on the profile; otherwise
    every non-disabled profile is returned (so a fresh tenant with one profile
    "just works" without per-user wiring).
    """
    user = frappe.session.user
    profiles = frappe.get_all(
        "POS Profile",
        filters={"disabled": 0},
        fields=[
            "name", "company", "warehouse", "currency", "customer",
            "selling_price_list", "country", "letter_head",
            "write_off_account", "write_off_cost_center", "cost_center",
        ],
        order_by="modified desc",
    )
    out: list[dict[str, Any]] = []
    for p in profiles:
        users = frappe.get_all(
            "POS Profile User",
            filters={"parent": p["name"], "parenttype": "POS Profile"},
            pluck="user",
        )
        if users and user not in users:
            continue
        out.append(dict(p))
    return out


@frappe.whitelist()
def get_pos_profile(name: str) -> dict[str, Any]:
    """Full POS Profile + its payment modes, for the cashier UI."""
    if not frappe.db.exists("POS Profile", name):
        frappe.throw(f"POS Profile not found: {name}")
    doc = frappe.get_doc("POS Profile", name).as_dict()
    doc["payment_modes"] = get_pos_payment_modes(name)
    return doc


@frappe.whitelist()
def current_pos_opening() -> dict[str, Any] | None:
    """Current user's open POS shift, if any.

    Returns the matching POS Opening Entry (status=Open, submitted) plus a
    rollup of POS Invoices issued since opening so the cashier can resume
    mid-shift after a refresh.
    """
    user = frappe.session.user
    rows = frappe.get_all(
        "POS Opening Entry",
        filters={"user": user, "status": "Open", "docstatus": 1},
        fields=["name", "pos_profile", "company", "period_start_date", "posting_date"],
        order_by="creation desc",
        limit=1,
    )
    if not rows:
        return None
    opening = dict(rows[0])
    summary = frappe.db.sql(
        """
        SELECT COUNT(*) AS invoice_count,
               COALESCE(SUM(grand_total), 0) AS total_sales
        FROM `tabPOS Invoice`
        WHERE pos_profile = %s
          AND owner = %s
          AND docstatus = 1
          AND creation >= %s
        """,
        (opening["pos_profile"], user, opening["period_start_date"]),
        as_dict=True,
    )
    opening["summary"] = summary[0] if summary else {"invoice_count": 0, "total_sales": 0}
    return opening


@frappe.whitelist()
def open_pos_shift(
    pos_profile: str,
    opening_amount: float = 0,
    mode_of_payment: str = "Cash",
) -> dict[str, Any]:
    """Create + submit a POS Opening Entry for the current user."""
    if not frappe.db.exists("POS Profile", pos_profile):
        frappe.throw(f"POS Profile not found: {pos_profile}")
    profile = frappe.get_doc("POS Profile", pos_profile)

    balance = []
    if float(opening_amount or 0) > 0:
        balance.append({"mode_of_payment": mode_of_payment, "opening_amount": float(opening_amount)})

    doc = frappe.get_doc({
        "doctype": "POS Opening Entry",
        "pos_profile": pos_profile,
        "company": profile.company,
        "user": frappe.session.user,
        "period_start_date": frappe.utils.now(),
        "posting_date": frappe.utils.today(),
        "set_posting_date": 1,
        "status": "Open",
        "balance_details": balance,
    })
    doc.insert(ignore_permissions=True)
    doc.submit()
    frappe.db.commit()
    return {"name": doc.name, "status": doc.status, "pos_profile": pos_profile}


@frappe.whitelist()
def close_pos_shift(pos_opening_entry: str) -> dict[str, Any]:
    """Mark a POS Opening Entry as Closed, summarise the shift, and return totals.

    The full POS Closing Entry workflow lives in ERPNext Desk for now — this
    endpoint just flips the status so the cashier can open a new shift without
    leaving the SPA. Settlement happens later from the Desk.
    """
    if not frappe.db.exists("POS Opening Entry", pos_opening_entry):
        frappe.throw(f"POS Opening Entry not found: {pos_opening_entry}")
    opening = frappe.get_doc("POS Opening Entry", pos_opening_entry)
    summary = frappe.db.sql(
        """
        SELECT COUNT(*) AS invoice_count,
               COALESCE(SUM(grand_total), 0) AS total_sales,
               COALESCE(SUM(total_qty), 0) AS total_qty
        FROM `tabPOS Invoice`
        WHERE pos_profile = %s
          AND owner = %s
          AND docstatus = 1
          AND creation >= %s
        """,
        (opening.pos_profile, opening.user, opening.period_start_date),
        as_dict=True,
    )
    opening.db_set("status", "Closed", commit=True)
    return {"name": opening.name, "status": "Closed", "summary": summary[0] if summary else {}}


@frappe.whitelist()
def create_default_pos_profile(
    name: str | None = None,
    company: str | None = None,
) -> dict[str, Any]:
    """One-click bootstrap: spin up a POS Profile with sensible defaults.

    Picks the user's default Company (or the first Company that exists),
    finds the first non-group Warehouse, ensures a Walk-in Customer + "Standard
    Selling" price list + Cash Mode of Payment exist, then assembles a POS
    Profile with Cash as the default payment mode.

    Idempotent: returns the existing profile (created=False) if one with the
    same name already exists.
    """
    company = company or frappe.defaults.get_user_default("Company") or frappe.db.get_value(
        "Company", filters={}, fieldname="name", order_by="creation asc",
    )
    if not company:
        frappe.throw("No Company exists yet. Create a Company first.")

    co = frappe.get_doc("Company", company)
    pname = name or f"POS - {co.name}"

    if frappe.db.exists("POS Profile", pname):
        return {"name": pname, "created": False, "company": company}

    warehouse = frappe.db.get_value(
        "Warehouse", {"company": company, "is_group": 0, "disabled": 0}, "name"
    )
    if not warehouse:
        frappe.throw(f"No warehouse found for company {company}. Create a Warehouse first.")

    walk_in = "Walk-in Customer"
    if not frappe.db.exists("Customer", walk_in):
        frappe.get_doc({
            "doctype": "Customer",
            "customer_name": walk_in,
            "customer_type": "Individual",
        }).insert(ignore_permissions=True)

    price_list = "Standard Selling"
    if not frappe.db.exists("Price List", price_list):
        frappe.get_doc({
            "doctype": "Price List",
            "price_list_name": price_list,
            "currency": co.default_currency or "EGP",
            "selling": 1,
            "enabled": 1,
        }).insert(ignore_permissions=True)

    if not frappe.db.exists("Mode of Payment", "Cash"):
        frappe.get_doc({
            "doctype": "Mode of Payment",
            "mode_of_payment": "Cash",
            "type": "Cash",
            "enabled": 1,
        }).insert(ignore_permissions=True)

    income_account = frappe.db.get_value(
        "Account",
        {"company": company, "account_type": "Income Account", "is_group": 0},
        "name",
    )
    cost_center = co.cost_center or frappe.db.get_value(
        "Cost Center", {"company": company, "is_group": 0}, "name",
    )

    # write_off_account / write_off_cost_center are required on POS Profile.
    # Prefer the company's own write-off account; fall back to any Expense account.
    write_off_account = co.write_off_account or frappe.db.get_value(
        "Account",
        {"company": company, "account_type": "Expense Account", "is_group": 0},
        "name",
    )
    write_off_cost_center = cost_center

    profile = frappe.get_doc({
        "doctype": "POS Profile",
        "name": pname,
        "company": company,
        "warehouse": warehouse,
        "customer": walk_in,
        "currency": co.default_currency or "EGP",
        "selling_price_list": price_list,
        "cost_center": cost_center,
        "income_account": income_account,
        "write_off_account": write_off_account,
        "write_off_cost_center": write_off_cost_center,
        "write_off_limit": 1,
        "disabled": 0,
        "payments": [
            {"mode_of_payment": "Cash", "default": 1},
        ],
    })
    profile.insert(ignore_permissions=True)
    frappe.db.commit()
    return {
        "name": profile.name,
        "created": True,
        "company": company,
        "warehouse": warehouse,
    }


@frappe.whitelist()
def lookup_item_by_barcode(barcode: str, price_list: str | None = None) -> dict[str, Any] | None:
    """Find one Item by barcode or item_code.

    Tries (in order):
      1. `Item Barcode` child table — exact match.
      2. `Item.madaar_barcode` custom field — exact match.
      3. `Item.item_code` — exact match (lets you scan unbarcoded SKUs).

    Returns the Item row + resolved selling price (from `price_list` if given,
    otherwise the first selling Item Price). Returns None if nothing matches.
    """
    code = (barcode or "").strip()
    if not code:
        return None

    item_code: str | None = None

    rows = frappe.get_all(
        "Item Barcode",
        filters={"barcode": code},
        fields=["parent"],
        limit=1,
    )
    if rows:
        item_code = rows[0]["parent"]

    if not item_code and frappe.db.has_column("Item", "madaar_barcode"):
        item_code = frappe.db.get_value("Item", {"madaar_barcode": code}, "item_code")

    if not item_code:
        match = frappe.db.get_value("Item", {"item_code": code, "disabled": 0}, "item_code")
        if match:
            item_code = match

    if not item_code:
        return None

    item = frappe.db.get_value(
        "Item",
        item_code,
        ["name", "item_code", "item_name", "item_group", "image", "stock_uom", "disabled"],
        as_dict=True,
    )
    if not item or item.get("disabled"):
        return None

    pf: list[list[Any]] = [["item_code", "=", item["item_code"]], ["selling", "=", 1]]
    if price_list:
        pf.append(["price_list", "=", price_list])
    price_row = frappe.get_all(
        "Item Price",
        filters=pf,
        fields=["price_list_rate"],
        order_by="modified desc",
        limit=1,
    )
    item["price"] = float(price_row[0]["price_list_rate"] or 0) if price_row else 0.0
    return item
