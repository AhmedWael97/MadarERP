// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/sales/orders",
  "titleKey": "pages:page.sales.orders.title",
  "doctype": "Sales Order",
  "viewType": "list",
  "module": "sales",
  "screenshot": "screenshots\\161_Sales-Orders.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "#",
    "headerKey": "page.sales-orders.col.0"
  },
  {
    "id": "col_1",
    "header": "NUMBER",
    "headerKey": "page.sales-orders.col.1"
  },
  {
    "id": "col_2",
    "header": "DATE",
    "headerKey": "page.sales-orders.col.2"
  },
  {
    "id": "col_3",
    "header": "DELIVERY DATE",
    "headerKey": "page.sales-orders.col.3"
  },
  {
    "id": "col_4",
    "header": "CUSTOMER",
    "headerKey": "page.sales-orders.col.4"
  },
  {
    "id": "col_5",
    "header": "TOTAL",
    "headerKey": "page.sales-orders.col.5"
  },
  {
    "id": "col_6",
    "header": "STATUS",
    "headerKey": "page.sales-orders.col.6"
  },
  {
    "id": "col_7",
    "header": "ACTIONS",
    "headerKey": "page.sales-orders.col.7"
  }
];
export const fields: FieldDef[] = [];
