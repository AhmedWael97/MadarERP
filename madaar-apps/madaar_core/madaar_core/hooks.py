app_name = "madaar_core"
app_title = "Madaar Core"
app_publisher = "Madaar"
app_description = "Madaar ERP — core app on top of Frappe/ERPNext."
app_email = "dev@madaar.app"
app_license = "MIT"

# -----------------------------------------------------------------------------
# Feature gating: every DocType insert is checked against the tenant's package
# limits held in the `Madaar Settings` singleton. See madaar_core/limits.py.
# -----------------------------------------------------------------------------
doc_events = {
    "*": {
        "before_insert": "madaar_core.limits.enforce",
        "on_trash": "madaar_core.limits.decrement",
    }
}

# Scheduled job that resets monthly feature counters at the period boundary.
scheduler_events = {
    "daily": [
        "madaar_core.limits.reset_period_counters",
    ],
}

# Whitelisted API methods consumed by the React SPA on app boot.
# (Defined in madaar_core/api.py with @frappe.whitelist decorators.)
override_whitelisted_methods = {}

# Fixtures shipped with this app; loaded by `bench --site <site> install-app madaar_core`
# and on every `bench migrate`. Lists are kept short here; full Egypt VAT / COA seeding
# happens in madaar_core/setup.py::bootstrap_tenant which the control-plane provisioner
# calls per-tenant after the site is created.
fixtures = []
