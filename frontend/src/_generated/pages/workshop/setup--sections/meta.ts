// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/workshop/setup/sections",
  "titleKey": "pages:page.workshop.setup--sections.title",
  "doctype": "Department",
  "viewType": "list",
  "module": "workshop",
  "screenshot": "screenshots\\199_Workshop-Departments.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Code",
    "headerKey": "page.workshop-departments.col.0"
  },
  {
    "id": "col_1",
    "header": "Name",
    "headerKey": "page.workshop-departments.col.1"
  },
  {
    "id": "col_2",
    "header": "Capacity",
    "headerKey": "page.workshop-departments.col.2"
  },
  {
    "id": "col_3",
    "header": "Manager",
    "headerKey": "page.workshop-departments.col.3"
  },
  {
    "id": "col_4",
    "header": "Status",
    "headerKey": "page.workshop-departments.col.4"
  }
];
export const fields: FieldDef[] = [];
