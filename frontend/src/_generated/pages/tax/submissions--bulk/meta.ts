// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/tax/submissions/bulk",
  "titleKey": "pages:page.tax.submissions--bulk.title",
  "doctype": "Madaar EInvoice Bulk Batch",
  "viewType": "list",
  "module": "tax",
  "screenshot": "screenshots\\185_Bulk-Invoice-Submission.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Invoice Number",
    "headerKey": "page.bulk-invoice-submission.col.0"
  },
  {
    "id": "col_1",
    "header": "Customer",
    "headerKey": "page.bulk-invoice-submission.col.1"
  },
  {
    "id": "col_2",
    "header": "Amount",
    "headerKey": "page.bulk-invoice-submission.col.2"
  },
  {
    "id": "col_3",
    "header": "Tax",
    "headerKey": "page.bulk-invoice-submission.col.3"
  },
  {
    "id": "col_4",
    "header": "Date",
    "headerKey": "page.bulk-invoice-submission.col.4"
  }
];
export const fields: FieldDef[] = [];
