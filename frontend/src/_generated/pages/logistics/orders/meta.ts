// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/logistics/orders",
  "titleKey": "pages:page.logistics.orders.title",
  "doctype": "Sales Order",
  "viewType": "list",
  "module": "logistics",
  "screenshot": "screenshots\\112_Order-Management.png"
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
    "header": "Track",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "Customer",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "From → To",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Weight",
    "headerKey": "page.export-data.col.4"
  },
  {
    "id": "col_5",
    "header": "Priority",
    "headerKey": "page.export-data.col.5"
  },
  {
    "id": "col_6",
    "header": "Status",
    "headerKey": "page.export-data.col.6"
  },
  {
    "id": "col_7",
    "header": "Amount",
    "headerKey": "page.export-data.col.7"
  }
];
export const fields: FieldDef[] = [];
