// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/sales/invoices",
  "titleKey": "pages:page.sales.invoices.title",
  "doctype": "Sales Invoice",
  "viewType": "list",
  "module": "sales",
  "screenshot": "screenshots\\159_Sales-Invoices.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "#",
    "headerKey": "page.sales-invoices.col.0"
  },
  {
    "id": "col_1",
    "header": "INVOICE NUMBER",
    "headerKey": "page.sales-invoices.col.1"
  },
  {
    "id": "col_2",
    "header": "DATE",
    "headerKey": "page.sales-invoices.col.2"
  },
  {
    "id": "col_3",
    "header": "CUSTOMER",
    "headerKey": "page.sales-invoices.col.3"
  },
  {
    "id": "col_4",
    "header": "REPRESENTATIVE",
    "headerKey": "page.sales-invoices.col.4"
  },
  {
    "id": "col_5",
    "header": "TOTAL",
    "headerKey": "page.sales-invoices.col.5"
  },
  {
    "id": "col_6",
    "header": "PAID",
    "headerKey": "page.sales-invoices.col.6"
  },
  {
    "id": "col_7",
    "header": "DUE",
    "headerKey": "page.sales-invoices.col.7"
  },
  {
    "id": "col_8",
    "header": "STATUS",
    "headerKey": "page.sales-invoices.col.8"
  },
  {
    "id": "col_9",
    "header": "ACTIONS",
    "headerKey": "page.sales-invoices.col.9"
  }
];
export const fields: FieldDef[] = [];
