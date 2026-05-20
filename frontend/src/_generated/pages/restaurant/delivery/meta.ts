// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/restaurant/delivery",
  "titleKey": "pages:page.restaurant.delivery.title",
  "doctype": "Delivery Note",
  "viewType": "list",
  "module": "restaurant",
  "screenshot": "screenshots\\143_Manage-Delivery.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Order",
    "headerKey": "page.delivery0.col.0"
  },
  {
    "id": "col_1",
    "header": "Customer",
    "headerKey": "page.delivery0.col.1"
  },
  {
    "id": "col_2",
    "header": "Status",
    "headerKey": "page.delivery0.col.2"
  },
  {
    "id": "col_3",
    "header": "Driver",
    "headerKey": "page.delivery0.col.3"
  },
  {
    "id": "col_4",
    "header": "Total",
    "headerKey": "page.delivery0.col.4"
  }
];
export const fields: FieldDef[] = [];
