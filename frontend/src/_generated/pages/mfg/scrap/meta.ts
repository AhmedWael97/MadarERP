// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/mfg/scrap",
  "titleKey": "pages:page.mfg.scrap.title",
  "doctype": "Stock Entry",
  "viewType": "list",
  "module": "mfg",
  "screenshot": "screenshots\\123_Scrap.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Production Order",
    "headerKey": "page.export-data.col.0"
  },
  {
    "id": "col_1",
    "header": "Product",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "Type",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "Quantity",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Cost",
    "headerKey": "page.export-data.col.4"
  },
  {
    "id": "col_5",
    "header": "Date",
    "headerKey": "page.export-data.col.5"
  }
];
export const fields: FieldDef[] = [];
