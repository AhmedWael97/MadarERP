#!/usr/bin/env node
/* Page scaffolder for Madaar ERP.
 * Reads scan_output/data/pages.json (296 entries) and emits:
 *   src/_generated/pages/<module>/<slug>/index.tsx
 *   src/_generated/pages/<module>/<slug>/meta.ts
 *   src/_generated/pages/<module>/<slug>/i18n.json
 *   src/_generated/pages.manifest.ts
 *   src/_generated/report.json
 *
 * URL is mapped to a route by stripping the original origin.
 * DocType comes from scripts/url-to-doctype.map.mjs (hand-curated).
 *
 * Pass --check to run as a dry-run that exits non-zero if _generated/ would change.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL_TO_DOCTYPE } from './url-to-doctype.map.mjs';
import { arabicTitleFor } from './page-titles-ar.mjs';
import { englishTitleFor } from './page-titles-en.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(ROOT, '..');
const PAGES_IN = path.join(PROJECT_ROOT, 'scan_output', 'data', 'pages.json');
const OUT_DIR = path.join(ROOT, 'src', '_generated');
const PAGES_DIR = path.join(OUT_DIR, 'pages');
const CHECK_MODE = process.argv.includes('--check');

function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\-/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function routePathFromUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    let p = u.pathname || '/';
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  } catch {
    return '/' + slugify(rawUrl);
  }
}

function moduleAndSlug(routePath) {
  const parts = routePath.split('/').filter(Boolean);
  if (parts.length === 0) return { module: 'core', slug: 'home' };
  if (parts.length === 1) return { module: 'core', slug: parts[0] };
  // Slugs must be filesystem-safe; React Router uses `:id`, the disk uses `$id`.
  const safe = (s) => s.replace(/^:/, '$');
  return { module: parts[0], slug: parts.slice(1).map(safe).join('--') };
}

/**
 * The raw scan contains 91 separate URLs for `/accounting/chart-of-accounts/{1..91}/edit`.
 * Detect URL families where the only varying segment is a numeric primary key and
 * collapse them into a single `:id` route. Returns:
 *   - skipUrls: Set of raw route paths whose URLs should not be emitted as static pages.
 *   - dynamicPages: [{ pattern, samplePage }] — emit one page per pattern.
 *
 * Only collapses families with ≥ 2 raw URLs so we don't accidentally turn a one-off
 * path containing a digit into a dynamic route.
 */
function collapseDynamicRoutes(pages) {
  const buckets = new Map(); // pattern → [pages]
  const isNumeric = (s) => /^\d+$/.test(s);

  for (const p of pages) {
    const rp = routePathFromUrl(p.url);
    const segs = rp.split('/').filter(Boolean);
    if (!segs.some(isNumeric)) continue;
    const pattern = '/' + segs.map((s) => (isNumeric(s) ? ':id' : s)).join('/');
    const list = buckets.get(pattern) ?? [];
    list.push(p);
    buckets.set(pattern, list);
  }

  const skipUrls = new Set();
  const dynamicPages = [];
  for (const [pattern, plist] of buckets) {
    if (plist.length < 2) continue;
    for (const p of plist) skipUrls.add(routePathFromUrl(p.url));
    dynamicPages.push({ pattern, samplePage: plist[0] });
  }
  return { skipUrls, dynamicPages };
}

/** Heuristic: an edit page is one whose URL ends with `/edit` (sometimes `/:id/edit`). */
function isEditRoute(routePath) {
  return routePath.endsWith('/edit') || routePath.endsWith('/:id/edit');
}

function deriveViewType(page, mapped, routePath) {
  // Edit pages are always forms — regardless of what the URL_TO_DOCTYPE map says for
  // the base path. The route path comes in pre-collapsed (e.g. `…/:id/edit`).
  if (routePath && isEditRoute(routePath)) return 'form';
  // Reports — any URL with `/reports/` in it or ending in `/report` is a report
  // page, regardless of what tables the scan captured. The runtime resolves the
  // actual config via REPORT_CONFIGS[routePath] in lib/reports/configs.ts.
  if (routePath && (routePath.includes('/reports/') || routePath.endsWith('/report'))) {
    return 'report';
  }
  // Module dashboards — `/<module>/dashboard` and the top-level `/dashboard`.
  if (routePath && (routePath.endsWith('/dashboard') || routePath === '/dashboard')) {
    return 'dashboard';
  }
  if (mapped?.viewType) return mapped.viewType;
  const url = page.url || '';
  if (url.endsWith('/create') || url.endsWith('/new')) return 'form';
  if ((page.create_forms ?? []).some((f) => !f.is_filter_form)) return 'form';
  if ((page.tables ?? []).length > 0) return 'list';
  return 'detail';
}

/**
 * For an edit path like `/accounting/chart-of-accounts/:id/edit`, the matching list
 * page lives at `/accounting/chart-of-accounts`. The form's `Cancel`/`onSuccess`
 * navigations need that base path.
 */
function listPathForEdit(routePath) {
  const segs = routePath.split('/').filter(Boolean);
  // Drop the trailing `:id/edit` (or `<n>/edit`) pair.
  return '/' + segs.slice(0, -2).join('/');
}

/** Resolve URL_TO_DOCTYPE for a route, with fall-throughs:
 *   - exact path
 *   - `/foo/bar/:id/edit` falls back to `/foo/bar` (same DocType, but viewType becomes `form`)
 *   - `/foo/bar/create` falls back to `/foo/bar` (same DocType, viewType becomes `form`)
 * The viewType override happens in `deriveViewType`; here we just return the doctype. */
function mappingForRoute(routePath, URL_TO_DOCTYPE) {
  if (URL_TO_DOCTYPE[routePath]) return URL_TO_DOCTYPE[routePath];
  if (isEditRoute(routePath)) {
    const base = listPathForEdit(routePath);
    const baseMap = URL_TO_DOCTYPE[base];
    // Inherit the DocType but force `viewType: form` — edit is always a form even
    // when the parent list is a tree.
    return baseMap ? { doctype: baseMap.doctype, viewType: 'form' } : null;
  }
  if (routePath.endsWith('/create') || routePath.endsWith('/new')) {
    const base = routePath.replace(/\/(create|new)$/, '');
    const baseMap = URL_TO_DOCTYPE[base];
    return baseMap ? { doctype: baseMap.doctype, viewType: 'form' } : null;
  }
  return null;
}

function isLaravelNoise(field) {
  if (!field) return true;
  if (field.type === 'hidden') return true;
  if (['_token', '_method'].includes(field.name)) return true;
  return false;
}

function buildColumns(page) {
  const t = (page.tables ?? [])[0];
  if (!t) return [];
  return (t.columns ?? []).map((header, i) => ({
    id: `col_${i}`,
    header,
    headerKey: `page.${t.heading ? slugify(t.heading) : 'list'}.col.${i}`,
  }));
}

function buildFields(page) {
  const cf = (page.create_forms ?? []).find((f) => !f.is_filter_form) ?? page.create_forms?.[0];
  if (!cf) return [];
  return (cf.fields ?? [])
    .filter((f) => !isLaravelNoise(f))
    .map((f) => ({
      fieldname: f.name || f.id || '',
      label: f.label || f.placeholder || f.name || '',
      fieldtype: mapFieldType(f.type, f.tag),
      reqd: f.required ? 1 : 0,
    }))
    .filter((f) => f.fieldname);
}

function mapFieldType(htmlType, htmlTag) {
  if (htmlTag === 'textarea') return 'Text';
  if (htmlTag === 'select') return 'Select';
  switch (htmlType) {
    case 'number':
      return 'Float';
    case 'date':
      return 'Date';
    case 'datetime-local':
      return 'Datetime';
    case 'email':
      return 'Data';
    case 'tel':
      return 'Data';
    case 'checkbox':
      return 'Check';
    case 'file':
      return 'Attach';
    case 'password':
      return 'Password';
    default:
      return 'Data';
  }
}

function indexTpl({ doctype, viewType, columnsImport, fieldsImport, titleArabic, titleEnglish, createPath, isEdit, listPath }) {
  // The override mechanism: a sibling override.tsx in src/modules/<module>/<slug>/overrides/ overrides
  // this generated index.tsx at the manifest level. We don't need code here for it.
  const headerKeyExpr = `meta.titleKey`;
  // A standard "not yet configured" placeholder for pages whose URL is in the scan but
  // we don't have a DocType mapping for. Saves us from passing `null` into the SDK
  // (which throws) and gives the user a clear hint while we fill in the map.
  const NOT_CONFIGURED = `<div className="rounded-[var(--radius-card)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-card)] px-6 py-10 text-center text-sm text-[color:var(--color-muted)] shadow-[var(--shadow-card)]">{t('page.unmapped', { defaultValue: 'This page is not connected to a DocType yet.' })}</div>`;

  const body = (() => {
    if (viewType === 'tree') {
      return doctype
        ? `<TreeView doctype={meta.doctype!} columns={columns} />`
        : NOT_CONFIGURED;
    }
    if (viewType === 'list') {
      return doctype
        ? `<DataTable doctype={meta.doctype!} columns={columns} />`
        : NOT_CONFIGURED;
    }
    if (viewType === 'form') {
      if (!doctype) return NOT_CONFIGURED;
      const backTarget = listPath ? JSON.stringify(listPath) : '`/${meta.routePath.split(\'/\').slice(1, -1).join(\'/\')}`';
      if (isEdit) {
        return `<FormShell doctype={meta.doctype!} name={id} onSuccess={() => navigate(${backTarget})} />`;
      }
      return `<FormShell doctype={meta.doctype!} onSuccess={() => navigate(${backTarget})} />`;
    }
    if (viewType === 'report') {
      // Reports use our own <ReportPage> (NOT frappe.desk.query_report). It looks up
      // REPORT_CONFIGS by routePath internally, falling back to a generic listing
      // when a hand-tuned config doesn't exist for this route.
      return `<ReportPage routePath={meta.routePath} doctype={meta.doctype} />`;
    }
    // Hub / dashboard / detail / unknown viewType: render a card grid of all the
    // sibling pages in the same module. Better than the bare title we used to show.
    // Filters out the current page so the user doesn't loop back to themselves.
    return `<ModuleHubCards module={meta.module} currentPath={meta.routePath} />`;
  })();

  // Build the actions slot. Matches the reference Laravel x-page-header pattern:
  //   • list/tree: emerald "+ Add new" pill
  //   • form     : slate "Back" pill with an arrow icon
  const actionsExpr = (() => {
    if ((viewType === 'list' || viewType === 'tree') && createPath) {
      return `actions={<Link to=${JSON.stringify(createPath)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm"><Plus size={16} />{t('action.create')}</Link>}`;
    }
    if (viewType === 'form') {
      return `actions={<button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-500 transition-all shadow-sm"><ArrowRight size={16} />{t('action.back')}</button>}`;
    }
    return '';
  })();

  const needsPerm = doctype != null;
  const needsNavigate = viewType === 'form';
  const needsParams = viewType === 'form' && isEdit;
  const needsLink = (viewType === 'list' || viewType === 'tree') && createPath;
  const iconImports = [];
  if (needsLink) iconImports.push('Plus');
  if (needsNavigate) iconImports.push('ArrowRight');

  const useTree = viewType === 'tree';
  const useDataTable = viewType === 'list';
  const useFormShell = viewType === 'form';
  const useReport = viewType === 'report';
  // Anything that isn't one of the structured viewTypes (typically dashboard / detail
  // / unknown) falls back to a ModuleHub card grid of sibling pages.
  const useModuleHub = !useTree && !useDataTable && !useFormShell && !useReport;

  // react-router imports — collapse `Link`, `useNavigate`, `useParams` into a single line.
  const rrImports = [
    needsLink ? 'Link' : null,
    needsNavigate ? 'useNavigate' : null,
    needsParams ? 'useParams' : null,
  ].filter(Boolean);

  const importLines = [
    `import { PageShell } from '@/components/erp/PageShell';`,
    useDataTable ? `import { DataTable } from '@/components/erp/DataTable';` : '',
    useTree ? `import { TreeView } from '@/components/erp/TreeView';` : '',
    useFormShell ? `import { FormShell } from '@/components/erp/FormShell';` : '',
    useReport ? `import { ReportPage } from '@/components/erp/ReportShell';` : '',
    useModuleHub ? `import { ModuleHubCards } from '@/components/erp/ModuleHub';` : '',
    `import { RequirePerm } from '@/lib/auth/RequirePerm';`,
    `import { useTranslation } from 'react-i18next';`,
    rrImports.length ? `import { ${rrImports.join(', ')} } from 'react-router-dom';` : '',
    iconImports.length ? `import { ${iconImports.join(', ')} } from 'lucide-react';` : '',
    `import meta from './meta';`,
    columnsImport,
    fieldsImport,
  ].filter(Boolean).join('\n');

  return `// AUTO-GENERATED — do not edit. Create src/modules/<module>/<slug>/overrides/page.tsx to override.
${importLines}

export default function Page() {
  const { t } = useTranslation();
  ${needsNavigate ? 'const navigate = useNavigate();' : ''}
  ${needsParams ? "const { id } = useParams<{ id: string }>();" : ''}
  ${needsPerm ? `return (
    <RequirePerm doctype={meta.doctype} action="read">
      <PageShell title={t(${headerKeyExpr}, { defaultValue: ${JSON.stringify(titleEnglish || titleArabic)} })} ${actionsExpr}>
        ${body}
      </PageShell>
    </RequirePerm>
  );` : `return (
    <PageShell title={t(${headerKeyExpr}, { defaultValue: ${JSON.stringify(titleEnglish || titleArabic)} })} ${actionsExpr}>
      ${body}
    </PageShell>
  );`}
}
`;
}

function metaTpl({ routePath, titleKey, doctype, viewType, module, screenshot, columns, fields }) {
  return `// AUTO-GENERATED.
import type { ColumnDef } from '@/components/erp/DataTable';
import type { FieldDef } from '@/components/erp/FormShell';

const meta = ${JSON.stringify({ routePath, titleKey, doctype, viewType, module, screenshot }, null, 2)} as const;

export default meta;
export const columns: ColumnDef[] = ${JSON.stringify(columns, null, 2)};
export const fields: FieldDef[] = ${JSON.stringify(fields, null, 2)};
`;
}

function manifestTpl(routes) {
  const lines = routes.map((r) => {
    const importPath = `./pages/${r.module}/${r.slug}/index`;
    return `  { path: ${JSON.stringify(r.path)}, importFn: () => import(${JSON.stringify(importPath)}), doctype: ${JSON.stringify(r.doctype)}, perm: 'read' as const, module: ${JSON.stringify(r.module)}, slug: ${JSON.stringify(r.slug)}, titleKey: ${JSON.stringify(r.titleKey)}, titleArabic: ${JSON.stringify(r.titleArabic)}, titleEnglish: ${JSON.stringify(r.titleEnglish)}, viewType: ${JSON.stringify(r.viewType)} }`;
  });
  return `// AUTO-GENERATED by scripts/generate-pages.mjs.
import type { ComponentType } from 'react';

export interface GeneratedRoute {
  path: string;
  importFn: () => Promise<{ default: ComponentType }>;
  doctype: string | null;
  perm: 'read' | 'write';
  module: string;
  slug: string;
  /** Translation key — e.g. \`pages:page.<module>.<slug>.title\`. Pass to \`t()\`. */
  titleKey: string;
  /** Arabic fallback title (used when locale=ar and key is missing). */
  titleArabic: string;
  /** English fallback title (used when locale=en and key is missing). */
  titleEnglish: string;
  /** How this page should render: list / tree / form / report / detail / dashboard. */
  viewType: string;
}

export const routes: GeneratedRoute[] = [
${lines.join(',\n')}
];
`;
}

/** Return a new object with the same entries, keys sorted alphabetically. Stable
 * diffs in version control are nice-to-have for the i18n aggregate files. */
function sortKeys(obj) {
  const out = {};
  for (const k of Object.keys(obj).sort()) out[k] = obj[k];
  return out;
}

function snapshotDir(dir) {
  if (!existsSync(dir)) return new Map();
  const out = new Map();
  function walk(d) {
    for (const name of readdirSync(d)) {
      const full = path.join(d, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else out.set(path.relative(dir, full), readFileSync(full, 'utf8'));
    }
  }
  walk(dir);
  return out;
}

function main() {
  if (!existsSync(PAGES_IN)) {
    console.error(`pages.json not found at ${PAGES_IN}`);
    process.exit(2);
  }
  const pages = JSON.parse(readFileSync(PAGES_IN, 'utf8'));
  if (!Array.isArray(pages)) {
    console.error('pages.json must be an array');
    process.exit(2);
  }

  const before = CHECK_MODE ? snapshotDir(OUT_DIR) : null;

  // Reset the generated tree (preserving the manifest stub fallback during dev — we rewrite it anyway).
  if (!CHECK_MODE) {
    if (existsSync(PAGES_DIR)) rmSync(PAGES_DIR, { recursive: true, force: true });
    mkdirSync(PAGES_DIR, { recursive: true });
  }

  const written = [];
  const seenRoutes = new Set();
  const report = { scaffolded: 0, collapsed_dynamic: 0, skipped_override: 0, no_doctype: [] };
  // Aggregated translation tables, keyed by the full namespaced key
  // (`page.<module>.<slug>.title`). Written to `locales/{ar,en}/pages.json` at the end.
  const arTranslations = {};
  const enTranslations = {};

  // Detect URL families like `/path/{1..N}/edit` and collapse them into one `:id` route.
  const { skipUrls, dynamicPages } = collapseDynamicRoutes(pages);

  // First pass: collect the set of all paths so we can decide which list pages have a
  // corresponding /create page in the manifest (so we know whether to render an "Add new" button).
  const allPaths = new Set();
  for (const page of pages) {
    allPaths.add(routePathFromUrl(page.url));
  }

  /**
   * Emit a single page (writes its index.tsx + meta.ts + i18n.json and records it on
   * the manifest). Shared by both the static-URL pass and the dynamic-pattern pass.
   */
  function emitPage({ routePath, page, doctype, viewType, isEdit, parentTitles }) {
    if (seenRoutes.has(routePath)) return;
    seenRoutes.add(routePath);

    const { module, slug } = moduleAndSlug(routePath);
    const rawTitle = page?.name || page?.title || routePath;
    // For synthesized routes (no page in the scan), prefer a caller-supplied title
    // — e.g. "Edit — Bank Accounts" rather than the ugly path "/treasury/banks/:id/edit".
    const titleArabic = parentTitles?.ar ?? (arabicTitleFor(rawTitle) || rawTitle);
    const titleEnglish = parentTitles?.en ?? (englishTitleFor(rawTitle, slug) || rawTitle);
    // The key is namespaced (`pages:…`) so react-i18next looks it up in the
    // generated `pages` namespace instead of the hand-maintained `common`.
    const titleKey = `pages:page.${module}.${slug}.title`;
    // Record both translations on the aggregate table. Keys are stored WITHOUT the
    // `pages:` prefix because i18next strips the namespace when keying into the JSON.
    const flatKey = `page.${module}.${slug}.title`;
    arTranslations[flatKey] = titleArabic;
    enTranslations[flatKey] = titleEnglish;
    const columns = viewType === 'list' || viewType === 'tree' ? buildColumns(page ?? {}) : [];
    const fields = viewType === 'form' ? buildFields(page ?? {}) : [];

    const listPath = isEdit ? listPathForEdit(routePath) : null;
    const createPath = (viewType === 'list' || viewType === 'tree')
      ? `${routePath}/create`
      : null;

    const targetDir = path.join(PAGES_DIR, module, slug);
    const indexPath = path.join(targetDir, 'index.tsx');
    const metaPath = path.join(targetDir, 'meta.ts');
    const i18nPath = path.join(targetDir, 'i18n.json');

    // meta.ts ALWAYS exports `columns` and `fields` (possibly as empty arrays).
    // Importing unconditionally is the simplest way to avoid the
    // `ReferenceError: columns is not defined` we used to hit on pages where the scan
    // had no table. FormShell currently ignores `fields`, so we only import columns.
    const columnsImport = (viewType === 'list' || viewType === 'tree')
      ? `import { columns } from './meta';`
      : '';
    const fieldsImport = '';

    const indexSrc = indexTpl({
      doctype,
      viewType,
      columnsImport,
      fieldsImport,
      titleArabic,
      titleEnglish,
      createPath,
      isEdit,
      listPath,
    });
    const metaSrc = metaTpl({
      routePath,
      titleKey,
      doctype,
      viewType,
      module,
      screenshot: page?.screenshot ?? null,
      columns,
      fields,
    });
    const i18nObj = {
      [`${titleKey}`]: titleArabic,
      ...Object.fromEntries(columns.map((c) => [c.headerKey, c.header])),
    };

    if (!CHECK_MODE) {
      mkdirSync(targetDir, { recursive: true });
      writeFileSync(indexPath, indexSrc, 'utf8');
      writeFileSync(metaPath, metaSrc, 'utf8');
      writeFileSync(i18nPath, JSON.stringify(i18nObj, null, 2), 'utf8');
    }

    written.push({
      path: routePath,
      module,
      slug,
      doctype,
      titleKey,
      titleArabic,
      titleEnglish,
      viewType,
    });
    report.scaffolded += 1;
    if (!doctype && viewType !== 'dashboard' && viewType !== 'report') {
      report.no_doctype.push(routePath);
    }
  }

  // ---- Pass 1: static URLs from the scan ----
  for (const page of pages) {
    const routePath = routePathFromUrl(page.url);
    if (skipUrls.has(routePath)) continue; // handled by the dynamic pass below
    const mapped = mappingForRoute(routePath, URL_TO_DOCTYPE);
    const viewType = deriveViewType(page, mapped, routePath);
    emitPage({
      routePath,
      page,
      doctype: mapped?.doctype ?? null,
      viewType,
      isEdit: false,
    });
  }

  // ---- Pass 2: collapsed dynamic patterns (e.g. `/.../:id/edit`) ----
  for (const { pattern, samplePage } of dynamicPages) {
    const mapped = mappingForRoute(pattern, URL_TO_DOCTYPE);
    const viewType = deriveViewType(samplePage, mapped, pattern);
    emitPage({
      routePath: pattern,
      page: samplePage,
      doctype: mapped?.doctype ?? null,
      viewType,
      isEdit: isEditRoute(pattern),
    });
    report.collapsed_dynamic += 1;
  }

  // ---- Pass 3 & 4: implicit create + edit routes for every doctype-bound list page ----
  // The scan only contains URLs the crawler actually visited, so create / :id/edit
  // routes only appear for doctypes the crawler had records for (or buttons it
  // happened to click). Synthesize them for every list/tree route that points at
  // a doctype, so users can always reach create + edit forms by URL.
  const listLikeRoutes = written.filter(
    (r) => (r.viewType === 'list' || r.viewType === 'tree') && r.doctype,
  );
  for (const r of listLikeRoutes) {
    const editPath = `${r.path}/:id/edit`;
    if (!seenRoutes.has(editPath)) {
      emitPage({
        routePath: editPath,
        page: null,
        doctype: r.doctype,
        viewType: 'form',
        isEdit: true,
        // Inherit the list page's name so the edit form reads "Edit — Bank Accounts"
        // instead of a path-based default.
        parentTitles: { ar: `تعديل — ${r.titleArabic}`, en: `Edit — ${r.titleEnglish}` },
      });
      report.collapsed_dynamic += 1;
    }
    const createPath = `${r.path}/create`;
    if (!seenRoutes.has(createPath)) {
      emitPage({
        routePath: createPath,
        page: null,
        doctype: r.doctype,
        viewType: 'form',
        isEdit: false,
        parentTitles: { ar: `إضافة — ${r.titleArabic}`, en: `New — ${r.titleEnglish}` },
      });
      report.collapsed_dynamic += 1;
    }
  }

  const manifestPath = path.join(OUT_DIR, 'pages.manifest.ts');
  const reportPath = path.join(OUT_DIR, 'report.json');
  // i18n: aggregate every page title into one JSON per locale. The runtime
  // i18n/index.ts static-imports both files into the `pages` namespace, so the
  // generated `t('pages:…')` lookups resolve in either Arabic or English mode.
  const localesDir = path.join(ROOT, 'src', 'lib', 'i18n', 'locales');
  const arPagesPath = path.join(localesDir, 'ar', 'pages.json');
  const enPagesPath = path.join(localesDir, 'en', 'pages.json');
  if (!CHECK_MODE) {
    writeFileSync(manifestPath, manifestTpl(written), 'utf8');
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    mkdirSync(path.dirname(arPagesPath), { recursive: true });
    mkdirSync(path.dirname(enPagesPath), { recursive: true });
    writeFileSync(arPagesPath, JSON.stringify(sortKeys(arTranslations), null, 2), 'utf8');
    writeFileSync(enPagesPath, JSON.stringify(sortKeys(enTranslations), null, 2), 'utf8');
  }

  if (CHECK_MODE) {
    // Compute the would-be state by simulating writes in-memory.
    const wouldBe = new Map();
    for (const r of written) {
      const dir = `pages/${r.module}/${r.slug}`;
      wouldBe.set(`${dir}/index.tsx`, ''); // existence-only check is fine for CI
      wouldBe.set(`${dir}/meta.ts`, '');
      wouldBe.set(`${dir}/i18n.json`, '');
    }
    wouldBe.set('pages.manifest.ts', '');
    wouldBe.set('report.json', '');
    const beforeKeys = new Set([...before.keys()].filter((k) => k.startsWith('pages/') || k === 'pages.manifest.ts' || k === 'report.json'));
    const wouldKeys = new Set(wouldBe.keys());
    const same =
      beforeKeys.size === wouldKeys.size && [...beforeKeys].every((k) => wouldKeys.has(k));
    if (!same) {
      console.error('✗ _generated/ is out of date. Run `pnpm gen:pages` and commit the result.');
      process.exit(1);
    }
    console.log('✓ check: _generated/ matches scan');
    return;
  }

  console.log(`✓ ${report.scaffolded} pages scaffolded`);
  console.log(`  • collapsed dynamic patterns: ${report.collapsed_dynamic}`);
  console.log(`  • without DocType mapping: ${report.no_doctype.length}`);
  console.log(`  → ${path.relative(PROJECT_ROOT, reportPath)}`);
}

main();
