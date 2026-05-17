import type { TFunction } from 'i18next';

/**
 * Convert a Frappe-style English label ("Customer Name", "Mobile No.") into a
 * lookup slug ("customer_name", "mobile_no") suitable for the `forms` i18n
 * namespace. Mirrors the slug rules used in `forms.json`.
 */
export function labelSlug(label: string): string {
  return String(label ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Translate a Frappe field label to the current locale. Looks up
 * `forms:<slug>` first, then falls back to the original label so any field we
 * don't have a translation for still renders the English string from Frappe.
 *
 * The empty/undefined check matters because some Frappe fields ship with only
 * a fieldname (no label) — we let the caller fall back to fieldname in that case.
 */
export function translateLabel(t: TFunction, label: string | undefined): string {
  if (!label) return '';
  const key = `forms:${labelSlug(label)}`;
  return t(key, { defaultValue: label }) as string;
}

/** Same as translateLabel but for section legends (uses `forms:section.<slug>`). */
export function translateSection(t: TFunction, label: string | undefined): string {
  if (!label) return '';
  const key = `forms:section.${labelSlug(label)}`;
  return t(key, { defaultValue: label }) as string;
}
