// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/sales/returns",
  "titleKey": "pages:page.sales.returns.title",
  "doctype": "Sales Invoice",
  "viewType": "list",
  "module": "sales",
  "screenshot": "screenshots\\170_Sales-Returns.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Number Return",
    "headerKey": "page.export-data.col.0"
  },
  {
    "id": "col_1",
    "header": "Customer",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "Invoice Number",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "Date",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Total",
    "headerKey": "page.export-data.col.4"
  },
  {
    "id": "col_5",
    "header": "Status",
    "headerKey": "page.export-data.col.5"
  },
  {
    "id": "col_6",
    "header": "Actions",
    "headerKey": "page.export-data.col.6"
  }
];
export const fields: FieldDef[] = [];
