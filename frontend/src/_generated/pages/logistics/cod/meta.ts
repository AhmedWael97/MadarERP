// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/logistics/cod",
  "titleKey": "pages:page.logistics.cod.title",
  "doctype": "Madaar COD Settlement",
  "viewType": "list",
  "module": "logistics",
  "screenshot": "screenshots\\107_COD-Settlement.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Order Number",
    "headerKey": "page.cod-orders.col.0"
  },
  {
    "id": "col_1",
    "header": "Customer",
    "headerKey": "page.cod-orders.col.1"
  },
  {
    "id": "col_2",
    "header": "COD Amount",
    "headerKey": "page.cod-orders.col.2"
  },
  {
    "id": "col_3",
    "header": "Collected",
    "headerKey": "page.cod-orders.col.3"
  },
  {
    "id": "col_4",
    "header": "Settled",
    "headerKey": "page.cod-orders.col.4"
  },
  {
    "id": "col_5",
    "header": "Status",
    "headerKey": "page.cod-orders.col.5"
  }
];
export const fields: FieldDef[] = [];
