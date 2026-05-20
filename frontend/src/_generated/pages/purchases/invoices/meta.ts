// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/purchases/invoices",
  "titleKey": "pages:page.purchases.invoices.title",
  "doctype": "Purchase Invoice",
  "viewType": "list",
  "module": "purchases",
  "screenshot": "screenshots\\131_Purchase-Invoices.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "INVOICE NUMBER",
    "headerKey": "page.purchase-invoices.col.0"
  },
  {
    "id": "col_1",
    "header": "DATE",
    "headerKey": "page.purchase-invoices.col.1"
  },
  {
    "id": "col_2",
    "header": "SUPPLIER",
    "headerKey": "page.purchase-invoices.col.2"
  },
  {
    "id": "col_3",
    "header": "TOTAL",
    "headerKey": "page.purchase-invoices.col.3"
  },
  {
    "id": "col_4",
    "header": "PAID",
    "headerKey": "page.purchase-invoices.col.4"
  },
  {
    "id": "col_5",
    "header": "DUE",
    "headerKey": "page.purchase-invoices.col.5"
  },
  {
    "id": "col_6",
    "header": "STATUS",
    "headerKey": "page.purchase-invoices.col.6"
  },
  {
    "id": "col_7",
    "header": "ACTIONS",
    "headerKey": "page.purchase-invoices.col.7"
  }
];
export const fields: FieldDef[] = [];
