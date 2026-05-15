from __future__ import annotations

from frappe.model.document import Document


class MadaarSettings(Document):
    """Tenant identity singleton. One row per Frappe site.

    Holds the current package name and the per-feature limits pushed from the
    control plane. See madaar_core.limits.enforce for how this is consumed.
    """

    pass
