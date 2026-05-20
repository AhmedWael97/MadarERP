// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/inventory/transfers",
  "titleKey": "pages:page.inventory.transfers.title",
  "doctype": "Stock Entry",
  "viewType": "list",
  "module": "inventory",
  "screenshot": "screenshots\\103_تحويلات-المخزون.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "رقم التحويل",
    "headerKey": "page..col.0"
  },
  {
    "id": "col_1",
    "header": "من مخزن",
    "headerKey": "page..col.1"
  },
  {
    "id": "col_2",
    "header": "إلى مخزن",
    "headerKey": "page..col.2"
  },
  {
    "id": "col_3",
    "header": "التاريخ",
    "headerKey": "page..col.3"
  },
  {
    "id": "col_4",
    "header": "الأصناف",
    "headerKey": "page..col.4"
  },
  {
    "id": "col_5",
    "header": "الحالة",
    "headerKey": "page..col.5"
  },
  {
    "id": "col_6",
    "header": "إجراءات",
    "headerKey": "page..col.6"
  }
];
export const fields: FieldDef[] = [];
