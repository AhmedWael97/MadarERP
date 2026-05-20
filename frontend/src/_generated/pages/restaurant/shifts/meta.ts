// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/restaurant/shifts",
  "titleKey": "pages:page.restaurant.shifts.title",
  "doctype": "Shift Type",
  "viewType": "list",
  "module": "restaurant",
  "screenshot": "screenshots\\155_Manage-Shifts.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Number",
    "headerKey": "page.shift-log.col.0"
  },
  {
    "id": "col_1",
    "header": "Branch",
    "headerKey": "page.shift-log.col.1"
  },
  {
    "id": "col_2",
    "header": "Cashier",
    "headerKey": "page.shift-log.col.2"
  },
  {
    "id": "col_3",
    "header": "Open",
    "headerKey": "page.shift-log.col.3"
  },
  {
    "id": "col_4",
    "header": "Close",
    "headerKey": "page.shift-log.col.4"
  },
  {
    "id": "col_5",
    "header": "Sales",
    "headerKey": "page.shift-log.col.5"
  },
  {
    "id": "col_6",
    "header": "Difference",
    "headerKey": "page.shift-log.col.6"
  },
  {
    "id": "col_7",
    "header": "Status",
    "headerKey": "page.shift-log.col.7"
  }
];
export const fields: FieldDef[] = [];
