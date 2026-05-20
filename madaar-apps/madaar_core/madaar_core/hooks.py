app_name = "madaar_core"
app_title = "Madaar Core"
app_publisher = "Madaar"
app_description = "Madaar ERP — core app on top of Frappe/ERPNext."
app_email = "dev@madaar.app"
app_license = "MIT"

# -----------------------------------------------------------------------------
# Feature gating: every DocType insert is checked against the tenant's package
# limits held in the `Madaar Settings` singleton. See madaar_core/limits.py.
#
# Group-aware pricing: Sales Invoice / Order / Quotation save → override row
# rates with `Madaar Price List` entries when the customer has a group.
# -----------------------------------------------------------------------------
doc_events = {
    "*": {
        "before_insert": "madaar_core.limits.enforce",
        "on_trash": "madaar_core.limits.decrement",
    },
    "Sales Invoice": {
        "before_save": "madaar_core.pricing.apply_group_pricing",
    },
    "Sales Order": {
        "before_save": "madaar_core.pricing.apply_group_pricing",
    },
    "Quotation": {
        "before_save": "madaar_core.pricing.apply_group_pricing",
    },
    # Auto-number tree DocTypes from the parent's code when the user leaves
    # the code field blank. See madaar_core/auto_code.py.
    "Account": {
        "before_insert": "madaar_core.auto_code.autoset_account_number",
    },
    "Cost Center": {
        "before_insert": "madaar_core.auto_code.autoset_cost_center_number",
    },
}

# Scheduled job that resets monthly feature counters at the period boundary.
scheduler_events = {
    "daily": [
        "madaar_core.limits.reset_period_counters",
        "madaar_core.scheduled.refresh_tenant_usage_counters",
    ],
}

# Whitelisted API methods consumed by the React SPA on app boot.
# (Defined in madaar_core/api.py with @frappe.whitelist decorators.)
override_whitelisted_methods = {}

# -----------------------------------------------------------------------------
# Fixtures: Custom Fields ship with the app so a fresh `bench install-app`
# wires Customer → Madaar Customer Group, Supplier → Madaar Supplier Group,
# Item → Madaar Product Group / Category automatically.
# -----------------------------------------------------------------------------
fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            ["name", "in", [
                "Customer-madaar_customer_category",
                "Customer-madaar_customer_group",
                "Supplier-madaar_supplier_category",
                "Supplier-madaar_supplier_group",
                "Item-madaar_product_category",
                "Item-madaar_product_group",
            ]],
        ],
    },
]
