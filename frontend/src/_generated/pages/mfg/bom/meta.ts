// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/mfg/bom",
  "titleKey": "pages:page.mfg.bom.title",
  "doctype": "BOM",
  "viewType": "list",
  "module": "mfg",
  "screenshot": "screenshots\\119_and-Components-Bill-of-Materials.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "BOM Number",
    "headerKey": "page.export-data.col.0"
  },
  {
    "id": "col_1",
    "header": "Product",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "Version",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "Ingredients",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Cost",
    "headerKey": "page.export-data.col.4"
  },
  {
    "id": "col_5",
    "header": "Actions",
    "headerKey": "page.export-data.col.5"
  }
];
export const fields: FieldDef[] = [];
