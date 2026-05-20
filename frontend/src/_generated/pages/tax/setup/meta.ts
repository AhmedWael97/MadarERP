// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/tax/setup",
  "titleKey": "pages:page.tax.setup.title",
  "doctype": "Sales Taxes and Charges Template",
  "viewType": "list",
  "module": "tax",
  "screenshot": "screenshots\\183_Tax-Setup.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Branch",
    "headerKey": "page.tax-branches.col.0"
  },
  {
    "id": "col_1",
    "header": "ETA Code",
    "headerKey": "page.tax-branches.col.1"
  },
  {
    "id": "col_2",
    "header": "Province",
    "headerKey": "page.tax-branches.col.2"
  }
];
export const fields: FieldDef[] = [];
