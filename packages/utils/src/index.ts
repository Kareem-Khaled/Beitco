/**
 * Format a price in Egyptian Pounds.
 * @example formatPrice(1500000) → "1,500,000 ج.م"
 * @example formatPrice(1500000, 'en') → "1,500,000 EGP"
 */
export function formatPrice(amount: number, locale: 'ar' | 'en' = 'ar'): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG').format(amount);
  const suffix = locale === 'ar' ? 'ج.م' : 'EGP';
  return `${formatted} ${suffix}`;
}

/**
 * Convert Western digits to Arabic-Indic numerals.
 * @example toArabicDigits('123') → '١٢٣'
 */
export function toArabicDigits(str: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/\d/g, (d) => arabicDigits[parseInt(d)] ?? d);
}

/**
 * Format a relative time string in Arabic or English.
 * @example relativeTime(new Date(Date.now() - 3600000), 'ar') → "منذ ساعة"
 */
export function relativeTime(date: Date, locale: 'ar' | 'en' = 'ar'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG');
}

/**
 * Generate a URL-safe slug from Arabic or English text.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
