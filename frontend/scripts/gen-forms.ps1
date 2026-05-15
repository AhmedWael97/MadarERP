# Generates missing create + edit form pages for every list page that has a doctype.
# Run: powershell -ExecutionPolicy Bypass -File .\scripts\gen-forms.ps1

$PagesDir = "H:\coupons\erp_mr_adham\frontend\src\_generated\pages"
$Manifest = "H:\coupons\erp_mr_adham\frontend\src\_generated\pages.manifest.ts"

# columns: module, slug, listPath, doctype, enTitle
$Pages = @(
  ,@("accounting",      "fiscal-years",             "/accounting/fiscal-years",             "Fiscal Year",                        "New Fiscal Year")
  ,@("construction",    "billings",                  "/construction/billings",               "Madaar Progress Bill",               "New Progress Bill")
  ,@("construction",    "boq",                       "/construction/boq",                    "Madaar BOQ",                         "New BOQ")
  ,@("construction",    "budgets",                   "/construction/budgets",                "Madaar Project Budget",              "New Project Budget")
  ,@("construction",    "contracts",                 "/construction/contracts",              "Contract",                           "New Contract")
  ,@("construction",    "equipment",                 "/construction/equipment",              "Asset",                              "New Equipment")
  ,@("construction",    "expenses",                  "/construction/expenses",               "Expense Claim",                      "New Expense")
  ,@("construction",    "labor",                     "/construction/labor",                  "Madaar Labor Record",                "New Labor Record")
  ,@("construction",    "materials",                 "/construction/materials",              "Material Request",                   "New Material Request")
  ,@("construction",    "projects",                  "/construction/projects",               "Project",                            "New Project")
  ,@("construction",    "subcontractors",            "/construction/subcontractors",         "Supplier",                           "New Subcontractor")
  ,@("construction",    "variations",                "/construction/variations",             "Madaar Change Order",                "New Change Order")
  ,@("crm",             "activities",                "/crm/activities",                      "ToDo",                               "New Activity")
  ,@("crm",             "leads",                     "/crm/leads",                           "Lead",                               "New Lead")
  ,@("crm",             "opportunities",             "/crm/opportunities",                   "Opportunity",                        "New Opportunity")
  ,@("ecommerce",       "banners",                   "/ecommerce/banners",                   "Madaar Banner",                      "New Banner")
  ,@("ecommerce",       "coupons",                   "/ecommerce/coupons",                   "Coupon Code",                        "New Coupon")
  ,@("ecommerce",       "customers",                 "/ecommerce/customers",                 "Customer",                           "New Customer")
  ,@("ecommerce",       "orders",                    "/ecommerce/orders",                    "Sales Order",                        "New Order")
  ,@("ecommerce",       "pages",                     "/ecommerce/pages",                     "Madaar CMS Page",                    "New CMS Page")
  ,@("ecommerce",       "products",                  "/ecommerce/products",                  "Item",                               "New Product")
  ,@("ecommerce",       "returns",                   "/ecommerce/returns",                   "Sales Invoice",                      "New Return")
  ,@("ecommerce",       "shipping",                  "/ecommerce/shipping",                  "Shipping Rule",                      "New Shipping Rule")
  ,@("ecommerce",       "stores",                    "/ecommerce/stores",                    "Madaar Store",                       "New Store")
  ,@("financial",       "checks",                    "/financial/checks",                    "Madaar Cheque",                      "New Cheque")
  ,@("financial",       "credit-notes",              "/financial/credit-notes",              "Sales Invoice",                      "New Credit Note")
  ,@("financial",       "debit-notes",               "/financial/debit-notes",               "Purchase Invoice",                   "New Debit Note")
  ,@("fixed-assets",    "assets",                    "/fixed-assets/assets",                 "Asset",                              "New Asset")
  ,@("fixed-assets",    "categories",                "/fixed-assets/categories",             "Asset Category",                     "New Asset Category")
  ,@("fleet",           "accidents",                 "/fleet/accidents",                     "Madaar Vehicle Accident",            "New Accident")
  ,@("fleet",           "contracts",                 "/fleet/contracts",                     "Contract",                           "New Contract")
  ,@("fleet",           "drivers",                   "/fleet/drivers",                       "Madaar Driver Profile",              "New Driver")
  ,@("fleet",           "fuel",                      "/fleet/fuel",                          "Madaar Fuel Log",                    "New Fuel Log")
  ,@("fleet",           "maintenance--requests",     "/fleet/maintenance/requests",          "Madaar Vehicle Maintenance Request", "New Maintenance Request")
  ,@("fleet",           "routes",                    "/fleet/routes",                        "Madaar Route",                       "New Route")
  ,@("fleet",           "trips",                     "/fleet/trips",                         "Madaar Trip",                        "New Trip")
  ,@("fleet",           "vehicles",                  "/fleet/vehicles",                      "Madaar Vehicle",                     "New Vehicle")
  ,@("fleet",           "violations",                "/fleet/violations",                    "Madaar Vehicle Violation",           "New Violation")
  ,@("hr",              "attendance",                "/hr/attendance",                       "Attendance",                         "New Attendance")
  ,@("hr",              "leaves",                    "/hr/leaves",                           "Leave Application",                  "New Leave")
  ,@("hr",              "payroll",                   "/hr/payroll",                          "Salary Slip",                        "New Salary Slip")
  ,@("inventory",       "adjustments",               "/inventory/adjustments",               "Stock Reconciliation",               "New Stock Adjustment")
  ,@("inventory",       "movements",                 "/inventory/movements",                 "Stock Entry",                        "New Stock Entry")
  ,@("inventory",       "transfers",                 "/inventory/transfers",                 "Stock Entry",                        "New Transfer")
  ,@("logistics",       "cod",                       "/logistics/cod",                       "Madaar COD Settlement",              "New COD Settlement")
  ,@("logistics",       "deliveries",                "/logistics/deliveries",                "Delivery Note",                      "New Delivery")
  ,@("logistics",       "orders",                    "/logistics/orders",                    "Sales Order",                        "New Order")
  ,@("logistics",       "shipments",                 "/logistics/shipments",                 "Shipment",                           "New Shipment")
  ,@("mfg",             "bom",                       "/mfg/bom",                             "BOM",                                "New BOM")
  ,@("mfg",             "finished-goods",            "/mfg/finished-goods",                  "Stock Entry",                        "New Finished Goods")
  ,@("mfg",             "material-issues",           "/mfg/material-issues",                 "Stock Entry",                        "New Material Issue")
  ,@("mfg",             "production-plans",          "/mfg/production-plans",                "Production Plan",                    "New Production Plan")
  ,@("mfg",             "scrap",                     "/mfg/scrap",                           "Stock Entry",                        "New Scrap Entry")
  ,@("mfg",             "work-centers",              "/mfg/work-centers",                    "Workstation",                        "New Work Center")
  ,@("mfg",             "work-orders",               "/mfg/work-orders",                     "Work Order",                         "New Work Order")
  ,@("purchases",       "returns",                   "/purchases/returns",                   "Purchase Invoice",                   "New Purchase Return")
  ,@("restaurant",      "branches",                  "/restaurant/branches",                 "Branch",                             "New Branch")
  ,@("restaurant",      "delivery",                  "/restaurant/delivery",                 "Delivery Note",                      "New Delivery")
  ,@("restaurant",      "halls",                     "/restaurant/halls",                    "Madaar Hall",                        "New Hall")
  ,@("restaurant",      "menu-items",                "/restaurant/menu-items",               "Item",                               "New Menu Item")
  ,@("restaurant",      "modifiers",                 "/restaurant/modifiers",                "Madaar Modifier Group",              "New Modifier Group")
  ,@("restaurant",      "orders",                    "/restaurant/orders",                   "Sales Order",                        "New Order")
  ,@("restaurant",      "pos",                       "/restaurant/pos",                      "POS Profile",                        "New POS Profile")
  ,@("restaurant",      "production-centers",        "/restaurant/production-centers",       "Warehouse",                          "New Production Center")
  ,@("restaurant",      "recipes",                   "/restaurant/recipes",                  "BOM",                                "New Recipe")
  ,@("restaurant",      "reservations",              "/restaurant/reservations",             "Madaar Reservation",                 "New Reservation")
  ,@("restaurant",      "shifts",                    "/restaurant/shifts",                   "Shift Type",                         "New Shift")
  ,@("sales",           "orders",                    "/sales/orders",                        "Sales Order",                        "New Sales Order")
  ,@("sales",           "returns",                   "/sales/returns",                       "Sales Invoice",                      "New Sales Return")
  ,@("tax",             "returns",                   "/tax/returns",                         "Madaar VAT Return",                  "New Tax Return")
  ,@("tax",             "setup",                     "/tax/setup",                           "Sales Taxes and Charges Template",   "New Tax Template")
  ,@("tax",             "submissions",               "/tax/submissions",                     "Madaar EInvoice Submission",         "New E-Invoice Submission")
  ,@("tax",             "submissions--bulk",         "/tax/submissions/bulk",                "Madaar EInvoice Bulk Batch",         "New Bulk Submission")
  ,@("treasury",        "banks",                     "/treasury/banks",                      "Bank Account",                       "New Bank Account")
  ,@("treasury",        "treasuries",                "/treasury/treasuries",                 "Madaar Treasury",                    "New Treasury")
  ,@("user-management", "roles",                     "/user-management/roles",               "Role",                               "New Role")
  ,@("user-management", "users",                     "/user-management/users",               "User",                               "New User")
  ,@("workshop",        "invoices",                  "/workshop/invoices",                   "Sales Invoice",                      "New Workshop Invoice")
  ,@("workshop",        "job-cards",                 "/workshop/job-cards",                  "Madaar Vehicle Job Card",            "New Job Card")
  ,@("workshop",        "setup--labor-operations",   "/workshop/setup/labor-operations",     "Operation",                          "New Labor Operation")
  ,@("workshop",        "setup--sections",           "/workshop/setup/sections",             "Department",                         "New Section")
  ,@("workshop",        "setup--service-packages",   "/workshop/setup/service-packages",     "Madaar Maintenance Package",         "New Service Package")
  ,@("workshop",        "setup--service-types",      "/workshop/setup/service-types",        "Madaar Service Type",                "New Service Type")
  ,@("workshop",        "setup--technicians",        "/workshop/setup/technicians",          "Employee",                           "New Technician")
  ,@("workshop",        "vehicles",                  "/workshop/vehicles",                   "Madaar Vehicle",                     "New Vehicle")
)

$CREATE_INDEX = @'
// AUTO-GENERATED -- do not edit.
import { PageShell } from '@/components/erp/PageShell';
import { FormShell } from '@/components/erp/FormShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import meta from './meta';

export default function Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <RequirePerm doctype={meta.doctype} action="read">
      <PageShell
        title={t(meta.titleKey, { defaultValue: 'Add New' })}
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-app px-4 py-2 text-sm font-medium hover:bg-[color:var(--color-card)]"
          >
            <ArrowRight size={16} />
            {t('action.back')}
          </button>
        }
      >
        <FormShell doctype={meta.doctype!} onSuccess={() => navigate(-1)} />
      </PageShell>
    </RequirePerm>
  );
}
'@

$EDIT_INDEX = @'
// AUTO-GENERATED -- do not edit.
import { PageShell } from '@/components/erp/PageShell';
import { FormShell } from '@/components/erp/FormShell';
import { RequirePerm } from '@/lib/auth/RequirePerm';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import meta from './meta';

export default function Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <RequirePerm doctype={meta.doctype} action="read">
      <PageShell
        title={t(meta.titleKey, { defaultValue: 'Edit' })}
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[color:var(--color-border)] bg-app px-4 py-2 text-sm font-medium hover:bg-[color:var(--color-card)]"
          >
            <ArrowRight size={16} />
            {t('action.back')}
          </button>
        }
      >
        <FormShell doctype={meta.doctype!} name={id} onSuccess={() => navigate(-1)} />
      </PageShell>
    </RequirePerm>
  );
}
'@

$newManifestLines = [System.Collections.Generic.List[string]]::new()

foreach ($row in $Pages) {
  $module   = $row[0]
  $slug     = $row[1]
  $listPath = $row[2]
  $doctype  = $row[3]
  $enTitle  = $row[4]

  # ── CREATE ──────────────────────────────────────────────────────────
  $cSlug   = "$slug--create"
  $cPath   = "$listPath/create"
  $cDir    = Join-Path $PagesDir "$module\$cSlug"
  $cKey    = "pages:page.$module.$cSlug.title"
  $cImport = "./pages/$module/$cSlug/index"

  if (-not (Test-Path (Join-Path $cDir "index.tsx"))) {
    New-Item -ItemType Directory -Force -Path $cDir | Out-Null
    [System.IO.File]::WriteAllText((Join-Path $cDir "index.tsx"), $CREATE_INDEX, [System.Text.Encoding]::UTF8)
    $metaTxt = "// AUTO-GENERATED.`nimport type { ColumnDef } from '@/components/erp/DataTable';`nimport type { FieldDef } from '@/components/erp/FormShell';`n`nconst meta = {`n  routePath: ""$cPath"",`n  titleKey: ""$cKey"",`n  doctype: ""$doctype"",`n  viewType: ""form"" as const,`n} as const;`n`nexport default meta;`nexport const columns: ColumnDef[] = [];`nexport const fields: FieldDef[] = [];`n"
    [System.IO.File]::WriteAllText((Join-Path $cDir "meta.ts"), $metaTxt, [System.Text.Encoding]::UTF8)
    Write-Host "CREATED create: $cPath"
  } else {
    Write-Host "exists  create: $cPath"
  }

  $newManifestLines.Add("  { path: ""$cPath"", importFn: () => import(""$cImport""), doctype: ""$doctype"", perm: 'read' as const, module: ""$module"", slug: ""$cSlug"", titleKey: ""$cKey"", titleArabic: ""$enTitle"", titleEnglish: ""$enTitle"", viewType: ""form"" },")

  # ── EDIT ─────────────────────────────────────────────────────────────
  $eSlug   = $slug + '--$id--edit'
  $ePath   = "$listPath/:id/edit"
  $eDir    = Join-Path $PagesDir "$module\$eSlug"
  $eKey    = "pages:page.$module.$eSlug.title"
  $eImport = "./pages/$module/$eSlug/index"

  if (-not (Test-Path (Join-Path $eDir "index.tsx"))) {
    New-Item -ItemType Directory -Force -Path $eDir | Out-Null
    [System.IO.File]::WriteAllText((Join-Path $eDir "index.tsx"), $EDIT_INDEX, [System.Text.Encoding]::UTF8)
    $metaEditTxt = "// AUTO-GENERATED.`nimport type { ColumnDef } from '@/components/erp/DataTable';`nimport type { FieldDef } from '@/components/erp/FormShell';`n`nconst meta = {`n  routePath: ""$ePath"",`n  titleKey: ""$eKey"",`n  doctype: ""$doctype"",`n  viewType: ""form"" as const,`n} as const;`n`nexport default meta;`nexport const columns: ColumnDef[] = [];`nexport const fields: FieldDef[] = [];`n"
    [System.IO.File]::WriteAllText((Join-Path $eDir "meta.ts"), $metaEditTxt, [System.Text.Encoding]::UTF8)
    Write-Host "CREATED edit:   $ePath"
  } else {
    Write-Host "exists  edit:   $ePath"
  }

  $newManifestLines.Add("  { path: ""$ePath"", importFn: () => import(""$eImport""), doctype: ""$doctype"", perm: 'read' as const, module: ""$module"", slug: ""$eSlug"", titleKey: ""$eKey"", titleArabic: ""Edit"", titleEnglish: ""Edit"", viewType: ""form"" },")
}

# ── Patch manifest ──────────────────────────────────────────────────────────
$manifestContent = [System.IO.File]::ReadAllText($Manifest, [System.Text.Encoding]::UTF8)

$toAdd = $newManifestLines | Where-Object {
  $m = [regex]::Match($_, 'path: "([^"]+)"')
  if ($m.Success) {
    $p = $m.Groups[1].Value
    -not ([regex]::IsMatch($manifestContent, 'path: "' + [regex]::Escape($p) + '"'))
  } else { $false }
}

if ($toAdd.Count -gt 0) {
  $insert = "`n" + ($toAdd -join "`n")
  $updated = [regex]::Replace($manifestContent, '\];\s*$', "$insert`n];")
  [System.IO.File]::WriteAllText($Manifest, $updated, [System.Text.Encoding]::UTF8)
  Write-Host "`nInserted $($toAdd.Count) new manifest entries."
} else {
  Write-Host "`nAll manifest entries already present -- nothing added."
}

Write-Host "Done."
