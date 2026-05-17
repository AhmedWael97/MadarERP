import json
from typing import Any

import frappe
from frappe.model.document import Document


class MadaarAdminActivityLog(Document):
    """Append-only audit log for super-admin / billing actions.

    Records are created via `MadaarAdminActivityLog.record(...)` rather than the
    public API so the controller can set sensible defaults (current user, IP,
    UA) and serialize details to JSON.
    """

    @classmethod
    def record(
        cls,
        action: str,
        *,
        summary: str | None = None,
        tenant_company: str | None = None,
        target_doctype: str | None = None,
        target_name: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> "MadaarAdminActivityLog":
        doc = frappe.new_doc("Madaar Admin Activity Log")
        doc.action = action
        doc.user = frappe.session.user
        doc.tenant_company = tenant_company
        doc.target_doctype = target_doctype
        doc.target_name = target_name
        doc.summary = summary or action
        if details:
            doc.details_json = json.dumps(details, ensure_ascii=False, default=str)
        try:
            doc.ip_address = frappe.local.request_ip
        except Exception:
            pass
        try:
            doc.user_agent = (frappe.local.request.headers.get("User-Agent") or "")[:1000]
        except Exception:
            pass
        doc.insert(ignore_permissions=True)
        return doc
