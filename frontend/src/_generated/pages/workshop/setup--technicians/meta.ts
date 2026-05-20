// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/workshop/setup/technicians",
  "titleKey": "pages:page.workshop.setup--technicians.title",
  "doctype": "Employee",
  "viewType": "list",
  "module": "workshop",
  "screenshot": "screenshots\\202_Technicians.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Code",
    "headerKey": "page.technicians.col.0"
  },
  {
    "id": "col_1",
    "header": "Name",
    "headerKey": "page.technicians.col.1"
  },
  {
    "id": "col_2",
    "header": "Specialty",
    "headerKey": "page.technicians.col.2"
  },
  {
    "id": "col_3",
    "header": "Level",
    "headerKey": "page.technicians.col.3"
  },
  {
    "id": "col_4",
    "header": "Department",
    "headerKey": "page.technicians.col.4"
  },
  {
    "id": "col_5",
    "header": "Hourly Rate",
    "headerKey": "page.technicians.col.5"
  },
  {
    "id": "col_6",
    "header": "Status",
    "headerKey": "page.technicians.col.6"
  }
];
export const fields: FieldDef[] = [];
