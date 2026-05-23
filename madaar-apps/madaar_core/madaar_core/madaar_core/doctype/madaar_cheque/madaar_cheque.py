from __future__ import annotations

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


VALID_TRANSITIONS = {
    "Pending": {"Deposited", "Cancelled"},
    "Deposited": {"Cleared", "Bounced"},
    "Cleared": set(),
    "Bounced": {"Pending"},  # allow re-presentment
    "Cancelled": set(),
}


class MadaarCheque(Document):
    """Issued or received cheque with a 4-state workflow.

    The state machine is enforced on save:
        Pending → Deposited → Cleared
                         └─→ Bounced → Pending
        Pending → Cancelled

    GL posting (per the project's money-routing rule — bank/cheque flows go
    through Bank Accounts, never directly through cash treasuries):
      * `on_submit` posts a Journal Entry routing the amount between the
        linked Bank Account's GL account and the party's receivable/payable
        account.
      * `on_cancel` cancels that JV.

    Submit is treated as the realized-money moment. The Pending/Deposited
    intermediate statuses are tracking-only and do not move the GL — that's
    appropriate for surface-only accounting; a finer-grained "Cheque in Hand"
    → "Cheque Under Collection" → "Bank" pipeline can be layered on later by
    splitting submit into three steps if the auditor asks for it.
    """

    def validate(self):
        previous = self.get_doc_before_save() if not self.is_new() else None
        if previous and previous.status != self.status:
            allowed = VALID_TRANSITIONS.get(previous.status, set())
            if self.status not in allowed:
                frappe.throw(
                    _("Cannot move cheque from {0} to {1}").format(previous.status, self.status)
                )

    def on_submit(self) -> None:
        je_name = self._post_journal_entry()
        if je_name:
            self.db_set("journal_entry", je_name)

    def on_cancel(self) -> None:
        if self.journal_entry and frappe.db.exists("Journal Entry", self.journal_entry):
            je = frappe.get_doc("Journal Entry", self.journal_entry)
            if je.docstatus == 1:
                je.cancel()

    # ── internals ────────────────────────────────────────────────────────────

    def _post_journal_entry(self) -> str | None:
        if not flt(self.amount) > 0:
            return None
        if not self.linked_account:
            frappe.throw(_("Linked Bank Account is required to post the GL entry."))
        if not (self.party_type and self.party):
            frappe.throw(_("Party Type + Party are required to post the GL entry."))
        if self.party_type not in ("Customer", "Supplier"):
            # Employee and Other don't have a default receivable/payable account
            # in ERPNext. Surface a clear error so the operator picks Customer
            # or Supplier explicitly; staff advances should go via Employee
            # Advance / Expense Claim, not raw Cheque.
            frappe.throw(
                _("Cheque GL posting only supports Customer or Supplier party types. Got {0}.").format(
                    self.party_type
                )
            )

        bank_doc = frappe.get_doc("Bank Account", self.linked_account)
        company = bank_doc.company
        bank_gl = bank_doc.account
        if not company:
            frappe.throw(_("Bank Account {0} has no Company set.").format(self.linked_account))
        if not bank_gl:
            frappe.throw(_("Bank Account {0} has no linked GL Account set.").format(self.linked_account))

        from erpnext.accounts.party import get_party_account

        party_gl = get_party_account(self.party_type, self.party, company)
        if not party_gl:
            frappe.throw(
                _("No default receivable/payable account configured for {0} {1} in company {2}.").format(
                    self.party_type, self.party, company
                )
            )

        if self.direction == "Received":
            # Customer paid us with a cheque → debit Bank, credit Receivable.
            debit_gl, credit_gl = bank_gl, party_gl
        elif self.direction == "Issued":
            # We paid a supplier via cheque → debit Payable, credit Bank.
            debit_gl, credit_gl = party_gl, bank_gl
        else:
            frappe.throw(_("Direction must be Received or Issued; got {0}.").format(self.direction))

        amount = flt(self.amount)
        posting_date = self.cheque_date or frappe.utils.today()

        je = frappe.get_doc({
            "doctype": "Journal Entry",
            "voucher_type": "Bank Entry",
            "company": company,
            "posting_date": posting_date,
            "cheque_no": self.cheque_number,
            "cheque_date": self.cheque_date,
            "user_remark": _("Auto-posted from Madaar Cheque {0}").format(self.name),
            "accounts": [
                _je_row(debit_gl, debit=amount, party_type=self.party_type, party=self.party, party_gl=party_gl),
                _je_row(credit_gl, credit=amount, party_type=self.party_type, party=self.party, party_gl=party_gl),
            ],
        })
        je.insert(ignore_permissions=True)
        je.submit()
        return je.name


def _je_row(
    account: str,
    *,
    debit: float = 0.0,
    credit: float = 0.0,
    party_type: str,
    party: str,
    party_gl: str,
) -> dict:
    """Build a Journal Entry account row.

    Only the row that lives on the party's receivable/payable account carries
    party_type/party — Frappe rejects rows that attach a party to a non-party
    account (e.g., the Bank GL account).
    """
    row = {
        "account": account,
        "debit_in_account_currency": flt(debit),
        "credit_in_account_currency": flt(credit),
    }
    if account == party_gl:
        row["party_type"] = party_type
        row["party"] = party
    return row
