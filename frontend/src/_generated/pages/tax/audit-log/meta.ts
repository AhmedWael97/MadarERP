// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/tax/audit-log",
  "titleKey": "pages:page.tax.audit-log.title",
  "doctype": "Version",
  "viewType": "list",
  "module": "tax",
  "screenshot": "screenshots\\178_Tax-Audit-Log.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Date",
    "headerKey": "page.tax-audit-log.col.0"
  },
  {
    "id": "col_1",
    "header": "Operation",
    "headerKey": "page.tax-audit-log.col.1"
  },
  {
    "id": "col_2",
    "header": "User",
    "headerKey": "page.tax-audit-log.col.2"
  },
  {
    "id": "col_3",
    "header": "Hash",
    "headerKey": "page.tax-audit-log.col.3"
  },
  {
    "id": "col_4",
    "header": "IP",
    "headerKey": "page.tax-audit-log.col.4"
  },
  {
    "id": "col_5",
    "header": "Details",
    "headerKey": "page.tax-audit-log.col.5"
  }
];
export const fields: FieldDef[] = [];
