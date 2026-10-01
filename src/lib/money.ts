import type { CurrencyCode } from '@/data/types';

export { parseAmount } from './amount';

export type Locale = 'en' | 'ar';
export type NumeralSystem = 'latin' | 'arabic';

const MINUS = '−';
const EASTERN_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const ARABIC_GROUP = '٬';
const ARABIC_DECIMAL = '٫';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'SR',
  AED: 'AED',
  IQD: 'IQD',
};

export type FormatOptions = {
  numeralSystem?: NumeralSystem;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function toArabicNumerals(text: string): string {
  return text.replace(/[0-9]/g, (digit) => EASTERN_DIGITS[Number(digit)]);
}

export function toLatinNumerals(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

export function formatNumber(value: number, options: FormatOptions = {}): string {
  const { numeralSystem = 'latin', minimumFractionDigits, maximumFractionDigits } = options;
  const max = maximumFractionDigits ?? 2;
  const min = minimumFractionDigits ?? 0;
  const latin = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: min,
    maximumFractionDigits: Math.max(min, max),
    useGrouping: true,
  }).format(Math.abs(value));
  const signed = value < 0 ? `${MINUS}${latin}` : latin;
  if (numeralSystem === 'latin') return signed;
  return toArabicNumerals(
    signed.replace(/,/g, ARABIC_GROUP).replace(/\./g, ARABIC_DECIMAL),
  );
}

function fractionDigitsFor(value: number): number {
  return Number.isInteger(Math.round(value * 100) / 100) ? 0 : 2;
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode,
  options: FormatOptions & { locale?: Locale } = {},
): string {
  const { locale = 'en', ...rest } = options;
  const symbol = CURRENCY_SYMBOLS[currency];
  const digits = formatNumber(Math.abs(value), {
    ...rest,
    minimumFractionDigits: rest.minimumFractionDigits,
    maximumFractionDigits: rest.maximumFractionDigits ?? Math.max(rest.minimumFractionDigits ?? 0, fractionDigitsFor(value)),
  });
  const body = locale === 'ar' ? `${digits} ${symbol}` : `${symbol}${digits}`;
  return value < 0 ? `${MINUS}${body}` : body;
}

export function formatSignedCurrency(
  value: number,
  currency: CurrencyCode,
  options: FormatOptions & { locale?: Locale } = {},
): string {
  const magnitude = formatCurrency(Math.abs(value), currency, options);
  if (value < 0) return `${MINUS}${magnitude}`;
  return `+${magnitude}`;
}

export function formatPercent(
  value: number,
  options: FormatOptions & { signed?: boolean } = {},
): string {
  const { numeralSystem = 'latin', signed = false, minimumFractionDigits, maximumFractionDigits } =
    options;
  const digits = formatNumber(Math.abs(value), {
    numeralSystem,
    minimumFractionDigits: minimumFractionDigits ?? 2,
    maximumFractionDigits: maximumFractionDigits ?? 2,
  });
  const percentMark = numeralSystem === 'arabic' ? '٪' : '%';
  const body = `${digits}${percentMark}`;
  if (value < 0) return `${MINUS}${body}`;
  return signed ? `+${body}` : body;
}
