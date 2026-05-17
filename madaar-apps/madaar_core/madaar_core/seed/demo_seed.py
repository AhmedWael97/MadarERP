"""Demo-data seeder for empty master tables.

Goal: every list page in the React UI should render *something* after a
fresh install, not just an "empty" placeholder. We seed exactly one sample
row per master doctype that has zero records. Submittable / transactional
doctypes (Sales Invoice, Stock Entry, Salary Slip, Journal Entry, …) are
deliberately skipped — they need a full setup chain (company, items, tax
templates, etc.) and creating a half-baked one would be worse than empty.

Usage on the server:

    docker compose exec backend bench --site <site> \\
        execute madaar_core.seed.demo_seed.run

Idempotent: if a doctype already has rows, we leave it alone. Each seed
attempt is wrapped in a try/except so a missing dependency on one doctype
(e.g. a Madaar app not installed) doesn't cascade into a hard failure.
"""

from __future__ import annotations

from typing import Any, Callable

import frappe


# ─── helpers ─────────────────────────────────────────────────────────────────


def _has_rows(doctype: str, extra_filters: dict[str, Any] | None = None) -> bool:
    """True when the doctype's table has at least one row."""
    if not frappe.db.exists("DocType", doctype):
        return True  # treat as "skip" — doctype isn't installed on this site
    filters = extra_filters or {}
    return frappe.db.count(doctype, filters=filters) > 0


def _seed(doctype: str, doc: dict[str, Any], extra_filters: dict[str, Any] | None = None) -> str:
    """Create one doc of `doctype` if the table is empty. Returns a status tag."""
    if not frappe.db.exists("DocType", doctype):
        return f"  ⊘  {doctype}: doctype not installed, skipped"
    if _has_rows(doctype, extra_filters):
        return f"  •  {doctype}: already has data, skipped"
    try:
        d = frappe.new_doc(doctype)
        d.update(doc)
        d.insert(ignore_permissions=True, ignore_mandatory=True)
        frappe.db.commit()
        return f"  ✓  {doctype}: created {d.name}"
    except Exception as e:
        frappe.db.rollback()
        # Truncate long tracebacks — we just want a hint.
        return f"  ✗  {doctype}: {type(e).__name__}: {str(e)[:160]}"


def _first(doctype: str, filters: dict[str, Any] | None = None) -> str | None:
    """Return the name of any one record from `doctype`, or None."""
    if not frappe.db.exists("DocType", doctype):
        return None
    row = frappe.get_all(doctype, filters=filters or {}, limit=1, pluck="name")
    return row[0] if row else None


# ─── seed plan ───────────────────────────────────────────────────────────────


def _seed_plan() -> list[tuple[str, dict[str, Any]]]:
    """Build the seed plan in dependency order. The actual link targets are
    resolved at call time so we don't crash if a referenced doctype hasn't
    been migrated yet."""

    # Resolve references that several seeds need.
    customer_group = _first("Customer Group", {"is_group": 0}) or "All Customer Groups"
    supplier_group = _first("Supplier Group", {"is_group": 0}) or "All Supplier Groups"
    item_group = _first("Item Group", {"is_group": 0}) or "All Item Groups"
    territory = _first("Territory") or "All Territories"
    uom = _first("UOM", {"name": "Nos"}) or _first("UOM") or "Nos"
    company = _first("Company")
    warehouse = _first("Warehouse", {"is_group": 0})

    plan: list[tuple[str, dict[str, Any]]] = []

    # ── Madaar master / category doctypes ───────────────────────────────────
    plan.append((
        "Madaar Customer Category",
        {"name_ar": "أفراد", "name_en": "Individuals", "discount_percentage": 0, "is_active": 1},
    ))
    plan.append((
        "Madaar Supplier Category",
        {"name_ar": "موردين عامون", "name_en": "General Suppliers", "discount_percentage": 0, "is_active": 1},
    ))
    plan.append((
        "Madaar Customer Group",
        {"name_ar": "عام", "name_en": "General"},
    ))
    plan.append((
        "Madaar Supplier Group",
        {"name_ar": "عام", "name_en": "General"},
    ))
    plan.append((
        "Madaar Product Category",
        {"name_ar": "منتجات عامة", "name_en": "General Products"},
    ))
    plan.append((
        "Madaar Product Group",
        {"name_ar": "عام", "name_en": "General"},
    ))

    # ── Customer / Supplier ─────────────────────────────────────────────────
    plan.append((
        "Customer",
        {
            "customer_name": "عميل تجريبي",
            "customer_type": "Individual",
            "customer_group": customer_group,
            "territory": territory,
            "madaar_customer_code": "CUS-DEMO-001",
            "madaar_name_ar": "عميل تجريبي",
            "madaar_name_en": "Demo Customer",
            "madaar_phone": "01000000001",
            "madaar_email": "demo@madaar.local",
            "madaar_city": "القاهرة",
            "madaar_country": "مصر",
            "madaar_is_taxable": 1,
        },
    ))
    plan.append((
        "Supplier",
        {
            "supplier_name": "مورد تجريبي",
            "supplier_type": "Company",
            "supplier_group": supplier_group,
            "madaar_supplier_code": "SUP-DEMO-001",
            "madaar_name_ar": "مورد تجريبي",
            "madaar_name_en": "Demo Supplier",
            "madaar_phone": "01000000002",
            "madaar_email": "supplier@madaar.local",
            "madaar_city": "القاهرة",
            "madaar_country": "مصر",
        },
    ))

    # ── Items / Warehouses ──────────────────────────────────────────────────
    plan.append((
        "Item",
        {
            "item_code": "ITEM-DEMO-001",
            "item_name": "صنف تجريبي",
            "item_group": item_group,
            "stock_uom": uom,
            "is_stock_item": 1,
            "standard_rate": 100,
            "madaar_name_en": "Demo Item",
            "madaar_product_type": "product",
            "madaar_barcode": "0000000000001",
        },
    ))
    # Warehouse: ERPNext usually pre-creates "Stores", "Work In Progress", etc.
    # so this often skips with "already has data". Left in for fresh sites.
    plan.append((
        "Warehouse",
        {
            "warehouse_name": "مخزن تجريبي",
            "company": company,
            "madaar_warehouse_code": "WH-DEMO",
            "madaar_name_en": "Demo Warehouse",
        },
    ))

    # ── HR ──────────────────────────────────────────────────────────────────
    plan.append((
        "Department",
        {"department_name": "قسم تجريبي", "company": company},
    ))
    plan.append((
        "Employee",
        {
            "employee_name": "موظف تجريبي",
            "first_name": "موظف",
            "last_name": "تجريبي",
            "gender": "Male",
            "date_of_birth": "1990-01-01",
            "date_of_joining": "2024-01-01",
            "company": company,
            "status": "Active",
            "madaar_name_en": "Demo Employee",
            "madaar_national_id": "00000000000000",
            "cell_number": "01000000003",
            "personal_email": "employee@madaar.local",
        },
    ))

    # ── Fleet ───────────────────────────────────────────────────────────────
    plan.append((
        "Madaar Driver Profile",
        {"driver_name": "سائق تجريبي", "license_number": "DEMO-LIC-001", "status": "Active"},
    ))
    plan.append((
        "Madaar Vehicle",
        {
            "vehicle_number": "VEH-DEMO-001",
            "license_plate": "أ ب ج 1234",
            "make": "Toyota",
            "model": "Hilux",
            "year": 2024,
            "fuel_type": "Diesel",
            "status": "Active",
        },
    ))
    plan.append((
        "Madaar Route",
        {"route_name": "القاهرة - الإسكندرية", "origin": "القاهرة", "destination": "الإسكندرية", "distance_km": 220},
    ))

    # ── Workshop / Restaurant masters ───────────────────────────────────────
    plan.append((
        "Madaar Service Type",
        {"service_name": "صيانة دورية", "base_price": 500},
    ))
    plan.append((
        "Madaar Maintenance Package",
        {"package_name": "باقة الصيانة الذهبية", "duration_months": 12, "price": 5000},
    ))
    plan.append((
        "Madaar Hall",
        {"hall_name": "الصالة الرئيسية", "capacity": 80, "tables_count": 20},
    ))
    plan.append((
        "Madaar Modifier Group",
        {"group_name": "الإضافات", "is_required": 0, "min_selections": 0, "max_selections": 3},
    ))

    # ── Construction masters ────────────────────────────────────────────────
    plan.append((
        "Project",
        {"project_name": "مشروع تجريبي", "status": "Open", "company": company},
    ))

    # ── CRM ─────────────────────────────────────────────────────────────────
    plan.append((
        "Lead",
        {
            "lead_name": "عميل محتمل تجريبي",
            "company_name": "شركة تجريبية",
            "email_id": "lead@madaar.local",
            "mobile_no": "01000000004",
            "status": "Lead",
            "source": "Walk In",
        },
    ))
    plan.append((
        "Opportunity",
        {
            "opportunity_from": "Lead",
            "party_name": _first("Lead") or "demo",  # may need a lead first
            "opportunity_type": "Sales",
            "status": "Open",
        },
    ))

    # ── Fixed Assets ────────────────────────────────────────────────────────
    plan.append((
        "Asset Category",
        {"asset_category_name": "أصول تجريبية", "enable_cwip_accounting": 0},
    ))

    # ── Treasury ────────────────────────────────────────────────────────────
    plan.append((
        "Madaar Treasury",
        {"treasury_name": "الخزنة الرئيسية", "currency": "EGP", "company": company, "balance": 0, "is_active": 1},
    ))

    # ── Ecommerce ───────────────────────────────────────────────────────────
    plan.append((
        "Madaar Store",
        {"store_name": "المتجر الرئيسي", "domain": "shop.madaar.local", "currency": "EGP", "language": "ar", "is_active": 1},
    ))
    plan.append((
        "Madaar Banner",
        {"title": "بانر ترحيبي", "position": "Hero", "is_active": 1, "start_date": "2024-01-01", "end_date": "2030-12-31"},
    ))
    plan.append((
        "Madaar CMS Page",
        {"title": "من نحن", "slug": "about", "is_published": 1, "content": "<p>صفحة تجريبية</p>"},
    ))
    plan.append((
        "Coupon Code",
        {"coupon_name": "WELCOME10", "coupon_code": "WELCOME10", "coupon_type": "Promotional", "maximum_use": 100},
    ))

    # ── Logistics ───────────────────────────────────────────────────────────
    plan.append((
        "Shipping Rule",
        {"label": "شحن قياسي", "shipping_rule_type": "Selling", "calculate_based_on": "Fixed", "shipping_amount": 50, "account": _first("Account", {"is_group": 0, "account_type": "Income Account"}), "cost_center": _first("Cost Center", {"is_group": 0})},
    ))

    # ── Tax ─────────────────────────────────────────────────────────────────
    # Tax template needs at least one tax row in `taxes` child table. Skip the
    # body and let the auto-gen form handle it — we just want the list non-empty.

    return plan


# ─── public entry point ──────────────────────────────────────────────────────


def run() -> None:
    """Seed one row per empty master doctype. Safe to re-run."""
    print("Madaar demo-seed — starting")
    print(f"Site: {frappe.local.site}")

    plan = _seed_plan()
    print(f"Plan: {len(plan)} doctypes to consider")

    for doctype, doc in plan:
        print(_seed(doctype, doc))

    frappe.db.commit()
    print("Madaar demo-seed — done")
