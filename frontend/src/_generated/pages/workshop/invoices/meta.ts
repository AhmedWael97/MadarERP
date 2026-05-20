// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/workshop/invoices",
  "titleKey": "pages:page.workshop.invoices.title",
  "doctype": "Sales Invoice",
  "viewType": "list",
  "module": "workshop",
  "screenshot": "screenshots\\192_Workshop-Invoices.png"
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
    "header": "Customer",
    "headerKey": "page.export-data.col.1"
  },
  {
    "id": "col_2",
    "header": "Vehicle",
    "headerKey": "page.export-data.col.2"
  },
  {
    "id": "col_3",
    "header": "Total",
    "headerKey": "page.export-data.col.3"
  },
  {
    "id": "col_4",
    "header": "Paid Amount",
    "headerKey": "page.export-data.col.4"
  },
  {
    "id": "col_5",
    "header": "Balance",
    "headerKey": "page.export-data.col.5"
  },
  {
    "id": "col_6",
    "header": "Status",
    "headerKey": "page.export-data.col.6"
  },
  {
    "id": "col_7",
    "header": "Date",
    "headerKey": "page.export-data.col.7"
  }
];
export const fields: FieldDef[] = [];
