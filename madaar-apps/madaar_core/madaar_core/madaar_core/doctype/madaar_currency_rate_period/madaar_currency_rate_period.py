import frappe
from frappe.model.document import Document


class MadaarCurrencyRatePeriod(Document):
    def validate(self):
        # effective_to (if set) must come after effective_from.
        if self.effective_to and self.effective_from and self.effective_to < self.effective_from:
            frappe.throw("تاريخ نهاية السريان يجب أن يكون بعد تاريخ البداية.")
        if self.from_currency and self.from_currency == self.to_currency:
            frappe.throw("عملة المصدر يجب أن تختلف عن عملة الوجهة.")
