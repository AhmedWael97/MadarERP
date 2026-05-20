// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/financial/receipt-vouchers",
  "titleKey": "pages:page.financial.receipt-vouchers.title",
  "doctype": "Payment Entry",
  "viewType": "list",
  "module": "financial",
  "screenshot": "screenshots\\058_سندات-القبض.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "رقم السند",
    "headerKey": "page..col.0"
  },
  {
    "id": "col_1",
    "header": "التاريخ",
    "headerKey": "page..col.1"
  },
  {
    "id": "col_2",
    "header": "العميل / المستلم منه",
    "headerKey": "page..col.2"
  },
  {
    "id": "col_3",
    "header": "المبلغ",
    "headerKey": "page..col.3"
  },
  {
    "id": "col_4",
    "header": "طريقة الدفع",
    "headerKey": "page..col.4"
  },
  {
    "id": "col_5",
    "header": "الحالة",
    "headerKey": "page..col.5"
  },
  {
    "id": "col_6",
    "header": "الإجراءات",
    "headerKey": "page..col.6"
  }
];
export const fields: FieldDef[] = [];
