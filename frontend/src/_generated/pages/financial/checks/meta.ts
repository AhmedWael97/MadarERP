// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/financial/checks",
  "titleKey": "pages:page.financial.checks.title",
  "doctype": "Madaar Cheque",
  "viewType": "list",
  "module": "financial",
  "screenshot": "screenshots\\051_الشيكات.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "رقم الشيك",
    "headerKey": "page..col.0"
  },
  {
    "id": "col_1",
    "header": "النوع",
    "headerKey": "page..col.1"
  },
  {
    "id": "col_2",
    "header": "تاريخ الإصدار",
    "headerKey": "page..col.2"
  },
  {
    "id": "col_3",
    "header": "الاستحقاق",
    "headerKey": "page..col.3"
  },
  {
    "id": "col_4",
    "header": "البنك",
    "headerKey": "page..col.4"
  },
  {
    "id": "col_5",
    "header": "المبلغ",
    "headerKey": "page..col.5"
  },
  {
    "id": "col_6",
    "header": "الحالة",
    "headerKey": "page..col.6"
  },
  {
    "id": "col_7",
    "header": "الإجراءات",
    "headerKey": "page..col.7"
  }
];
export const fields: FieldDef[] = [];
