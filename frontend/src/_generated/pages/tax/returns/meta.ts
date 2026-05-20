// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/tax/returns",
  "titleKey": "pages:page.tax.returns.title",
  "doctype": "Madaar VAT Return",
  "viewType": "list",
  "module": "tax",
  "screenshot": "screenshots\\182_Tax-Returns.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Return Number",
    "headerKey": "page.export-data.col.0"
  },
  {
    "id": "col_1",
    "header": "Type",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "Period",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "Output Tax",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Input Tax",
    "headerKey": "page.export-data.col.4"
  },
  {
    "id": "col_5",
    "header": "Net Tax",
    "headerKey": "page.export-data.col.5"
  },
  {
    "id": "col_6",
    "header": "Status",
    "headerKey": "page.export-data.col.6"
  }
];
export const fields: FieldDef[] = [];
