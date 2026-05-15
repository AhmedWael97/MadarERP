export function formatNumber(value: number | string | null | undefined, locale: string): string {
  if (value == null || value === '') return '';
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    numberingSystem: locale === 'ar' ? 'arab' : 'latn',
    maximumFractionDigits: 2,
  } as Intl.NumberFormatOptions).format(n);
}

export function formatCurrency(value: number | null | undefined, locale: string, currency = 'EGP'): string {
  if (value == null) return '';
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency,
    numberingSystem: locale === 'ar' ? 'arab' : 'latn',
  } as Intl.NumberFormatOptions).format(value);
}
