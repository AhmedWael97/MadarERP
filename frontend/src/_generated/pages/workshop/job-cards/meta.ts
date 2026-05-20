// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/workshop/job-cards",
  "titleKey": "pages:page.workshop.job-cards.title",
  "doctype": "Madaar Vehicle Job Card",
  "viewType": "list",
  "module": "workshop",
  "screenshot": "screenshots\\193_Job-Cards.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "رقم أمر الشغل",
    "headerKey": "page.job-cards.col.0"
  },
  {
    "id": "col_1",
    "header": "Customer",
    "headerKey": "page.job-cards.col.1"
  },
  {
    "id": "col_2",
    "header": "Vehicle",
    "headerKey": "page.job-cards.col.2"
  },
  {
    "id": "col_3",
    "header": "Type",
    "headerKey": "page.job-cards.col.3"
  },
  {
    "id": "col_4",
    "header": "Priority",
    "headerKey": "page.job-cards.col.4"
  },
  {
    "id": "col_5",
    "header": "Status",
    "headerKey": "page.job-cards.col.5"
  },
  {
    "id": "col_6",
    "header": "Date",
    "headerKey": "page.job-cards.col.6"
  }
];
export const fields: FieldDef[] = [];
