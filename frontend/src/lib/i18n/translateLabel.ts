import type { TFunction } from 'i18next';
import i18n from 'i18next';
import enLegacy from './locales/en/legacy.json';

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

// ─── Reverse legacy index (English → Arabic) ────────────────────────────────
// `en/legacy.json` has Arabic phrases as keys and their English translations
// as values. We need the reverse direction at runtime so that an English label
// the Frappe API returns can be flipped back to Arabic without having to list
// every field manually in forms.json.
//
// The map is lazily built on first use (≈ 6 000 entries) and cached on the
// module. Case-insensitive — both the lookup key and the legacy values are
// normalised to lower-case.
let englishToArabic: Map<string, string> | null = null;

function ensureLegacyIndex(): Map<string, string> {
  if (englishToArabic) return englishToArabic;
  const m = new Map<string, string>();
  for (const [ar, en] of Object.entries(enLegacy as Record<string, string>)) {
    if (!en) continue;
    const key = en.trim().toLowerCase();
    // Prefer the first translation we see — later entries usually represent
    // the same English term in a different context and would shadow the
    // canonical Arabic phrase otherwise.
    if (!m.has(key)) m.set(key, ar);
  }
  englishToArabic = m;
  return m;
}

/**
 * Translate a Frappe field label to the current locale. Resolution order:
 *   1. `forms:<slug>`             — hand-curated translations in forms.json
 *   2. `legacy:<arabic phrase>`   — when the label happens to BE an Arabic phrase
 *   3. Reverse-legacy lookup      — English text found in the legacy map → Arabic
 *   4. Original English label     — last-resort fallback
 *
 * The empty/undefined check matters because some Frappe fields ship with only
 * a fieldname (no label) — we let the caller fall back to fieldname in that case.
 */
export function translateLabel(t: TFunction, label: string | undefined): string {
  if (!label) return '';

  // 1) forms namespace — fastest, most specific.
  const slug = labelSlug(label);
  const formsKey = `forms:${slug}`;
  const fromForms = t(formsKey, { defaultValue: '' }) as string;
  if (fromForms && fromForms !== formsKey && fromForms !== slug) return fromForms;

  // 2) If the label is already Arabic, the legacy namespace will round-trip it.
  const fromLegacy = t(label, { ns: 'legacy', defaultValue: '' }) as string;
  if (fromLegacy && fromLegacy !== label) return fromLegacy;

  // 3) English → Arabic via the reverse legacy index (only when locale is ar).
  const lang = i18n.language || 'ar';
  if (lang.startsWith('ar')) {
    const ar = ensureLegacyIndex().get(label.trim().toLowerCase());
    if (ar) return ar;
  }

  // 4) Fall back to the original English label so something still renders.
  return label;
}

/** Same as translateLabel but for section legends (uses `forms:section.<slug>`). */
export function translateSection(t: TFunction, label: string | undefined): string {
  if (!label) return '';
  // Try the dedicated section.* slug first, then fall back to the regular label
  // translation pipeline so reverse-legacy still applies when section.* is missing.
  const key = `forms:section.${labelSlug(label)}`;
  const fromSection = t(key, { defaultValue: '' }) as string;
  if (fromSection && fromSection !== key) return fromSection;
  return translateLabel(t, label);
}
