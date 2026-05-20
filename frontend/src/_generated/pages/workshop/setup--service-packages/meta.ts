// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = {
  "routePath": "/workshop/setup/service-packages",
  "titleKey": "pages:page.workshop.setup--service-packages.title",
  "doctype": "Madaar Maintenance Package",
  "viewType": "list",
  "module": "workshop",
  "screenshot": "screenshots\\200_Maintenance-Packages.png"
} as const;

export default meta;
export const columns: ColumnDef[] = [
  {
    "id": "col_0",
    "header": "Name",
    "headerKey": "page.maintenance-packages.col.0"
  },
  {
    "id": "col_1",
    "header": "Price",
    "headerKey": "page.maintenance-packages.col.1"
  },
  {
    "id": "col_2",
    "header": "Discount",
    "headerKey": "page.maintenance-packages.col.2"
  },
  {
    "id": "col_3",
    "header": "Time",
    "headerKey": "page.maintenance-packages.col.3"
  },
  {
    "id": "col_4",
    "header": "Items Count",
    "headerKey": "page.maintenance-packages.col.4"
  },
  {
    "id": "col_5",
    "header": "Status",
    "headerKey": "page.maintenance-packages.col.5"
  }
];
export const fields: FieldDef[] = [];
