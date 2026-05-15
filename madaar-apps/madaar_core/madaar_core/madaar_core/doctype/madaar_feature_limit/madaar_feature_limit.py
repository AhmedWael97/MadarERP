from __future__ import annotations

from frappe.model.document import Document


class MadaarFeatureLimit(Document):
    """Child row of Madaar Settings — one per feature key the current package gates."""

    pass
