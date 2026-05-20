// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/tax/submissions",
  "titleKey": "pages:page.tax.submissions.title",
  "doctype": "Madaar EInvoice Submission",
  "viewType": "list",
  "module": "tax",
  "screenshot": "screenshots\\184_Track-Submitted-Invoices.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Invoice Number",
    "headerKey": "page.export-data.col.0"
  },
  {
    "id": "col_1",
    "header": "Type",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "ETA UUID",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "Status",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Submission Date",
    "headerKey": "page.export-data.col.4"
  },
  {
    "id": "col_5",
    "header": "and",
    "headerKey": "page.export-data.col.5"
  }
];
export const fields: FieldDef[] = [];
