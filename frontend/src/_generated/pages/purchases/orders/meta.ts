// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/purchases/orders",
  "titleKey": "pages:page.purchases.orders.title",
  "doctype": "Purchase Order",
  "viewType": "list",
  "module": "purchases",
  "screenshot": "screenshots\\133_Purchase-Orders.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Number",
    "headerKey": "page.export-data.col.0"
  },
  {
    "id": "col_1",
    "header": "Supplier",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "Date",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "Total",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Status",
    "headerKey": "page.export-data.col.4"
  },
  {
    "id": "col_5",
    "header": "Actions",
    "headerKey": "page.export-data.col.5"
  }
];
export const fields: FieldDef[] = [];
