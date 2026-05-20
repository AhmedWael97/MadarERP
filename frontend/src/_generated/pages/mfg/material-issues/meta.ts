// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/mfg/material-issues",
  "titleKey": "pages:page.mfg.material-issues.title",
  "doctype": "Stock Entry",
  "viewType": "list",
  "module": "mfg",
  "screenshot": "screenshots\\121_Issue-Materials-Material-Issues.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Number Issue",
    "headerKey": "page.export-data.col.0"
  },
  {
    "id": "col_1",
    "header": "Production Order",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "Warehouse",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "Date",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Items",
    "headerKey": "page.export-data.col.4"
  }
];
export const fields: FieldDef[] = [];
