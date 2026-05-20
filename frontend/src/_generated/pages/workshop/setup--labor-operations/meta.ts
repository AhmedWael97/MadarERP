// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/workshop/setup/labor-operations",
  "titleKey": "pages:page.workshop.setup--labor-operations.title",
  "doctype": "Operation",
  "viewType": "list",
  "module": "workshop",
  "screenshot": "screenshots\\198_Labor-Operations.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Name",
    "headerKey": "page.labor-operations.col.0"
  },
  {
    "id": "col_1",
    "header": "Type",
    "headerKey": "page.labor-operations.col.1"
  },
  {
    "id": "col_2",
    "header": "Hours",
    "headerKey": "page.labor-operations.col.2"
  },
  {
    "id": "col_3",
    "header": "Selling Price",
    "headerKey": "page.labor-operations.col.3"
  },
  {
    "id": "col_4",
    "header": "Status",
    "headerKey": "page.labor-operations.col.4"
  }
];
export const fields: FieldDef[] = [];
