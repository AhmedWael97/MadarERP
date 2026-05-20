// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/accounting/journal-entries",
  "titleKey": "pages:page.accounting.journal-entries.title",
  "doctype": "Journal Entry",
  "viewType": "list",
  "module": "accounting",
  "screenshot": "screenshots\\006_القيود-اليومية.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "رقم القيد",
    "headerKey": "page..col.0"
  },
  {
    "id": "col_1",
    "header": "التاريخ",
    "headerKey": "page..col.1"
  },
  {
    "id": "col_2",
    "header": "الوصف",
    "headerKey": "page..col.2"
  },
  {
    "id": "col_3",
    "header": "المدين",
    "headerKey": "page..col.3"
  },
  {
    "id": "col_4",
    "header": "الدائن",
    "headerKey": "page..col.4"
  },
  {
    "id": "col_5",
    "header": "الحالة",
    "headerKey": "page..col.5"
  },
  {
    "id": "col_6",
    "header": "المصدر",
    "headerKey": "page..col.6"
  },
  {
    "id": "col_7",
    "header": "إجراءات",
    "headerKey": "page..col.7"
  }
];
export const fields: FieldDef[] = [];
