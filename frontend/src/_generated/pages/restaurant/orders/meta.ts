// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/restaurant/orders",
  "titleKey": "pages:page.restaurant.orders.title",
  "doctype": "Sales Order",
  "viewType": "list",
  "module": "restaurant",
  "screenshot": "screenshots\\149_Order-Management.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Order Number",
    "headerKey": "page.export-data.col.0"
  },
  {
    "id": "col_1",
    "header": "Type",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "Branch",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "Status",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Total",
    "headerKey": "page.export-data.col.4"
  },
  {
    "id": "col_5",
    "header": "Payment",
    "headerKey": "page.export-data.col.5"
  },
  {
    "id": "col_6",
    "header": "Time",
    "headerKey": "page.export-data.col.6"
  },
  {
    "id": "col_7",
    "header": "Actions",
    "headerKey": "page.export-data.col.7"
  }
];
export const fields: FieldDef[] = [];
