import type { CurrencyCode } from '@/data/types';
import { MINUS, snapDecimalNoise } from './amount';

export { parseAmount } from './amount';

export type Locale = 'en' | 'ar';
export type NumeralSystem = 'latin' | 'arabic';

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
  }).format(snapDecimalNoise(Math.abs(value)));
  const signed = isNegative(value, latin) ? `${MINUS}${latin}` : latin;
  if (numeralSystem === 'latin') return signed;
  return toArabicNumerals(
    signed.replace(/,/g, ARABIC_GROUP).replace(/\./g, ARABIC_DECIMAL),
  );
}

function isNegative(value: number, digits: string): boolean {
  return value < 0 && /[1-9]/.test(toLatinNumerals(digits));
}

function currencyFractionDigits(
  magnitude: number,
  options: FormatOptions,
): { min: number; max: number } {
  const { minimumFractionDigits, maximumFractionDigits } = options;
  if (minimumFractionDigits != null || maximumFractionDigits != null) {
    const min = minimumFractionDigits ?? 0;
    return { min, max: Math.max(min, maximumFractionDigits ?? 2) };
  }
  const cents = formatNumber(magnitude, { maximumFractionDigits: 2 });
  return cents.includes('.') ? { min: 2, max: 2 } : { min: 0, max: 0 };
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode,
  options: FormatOptions & { locale?: Locale } = {},
): string {
  const { locale = 'en', ...rest } = options;
  const symbol = CURRENCY_SYMBOLS[currency];
  const magnitude = Math.abs(value);
  const { min, max } = currencyFractionDigits(magnitude, rest);
  const digits = formatNumber(magnitude, {
    numeralSystem: rest.numeralSystem,
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
  const body = locale === 'ar' ? `${digits} ${symbol}` : `${symbol}${digits}`;
  return isNegative(value, digits) ? `${MINUS}${body}` : body;
}

export function formatSignedCurrency(
  value: number,
  currency: CurrencyCode,
  options: FormatOptions & { locale?: Locale } = {},
): string {
  const magnitude = formatCurrency(Math.abs(value), currency, options);
  if (isNegative(value, magnitude)) return `${MINUS}${magnitude}`;
  return `+${magnitude}`;
}

export function formatPercent(
  value: number,
  options: FormatOptions & { signed?: boolean } = {},
): string {
  const { numeralSystem = 'latin', signed = false, minimumFractionDigits, maximumFractionDigits } =
    options;
  const max = maximumFractionDigits ?? 2;
  const digits = formatNumber(Math.abs(value), {
    numeralSystem,
    minimumFractionDigits: minimumFractionDigits ?? Math.min(2, max),
    maximumFractionDigits: max,
  });
  const percentMark = numeralSystem === 'arabic' ? '٪' : '%';
  const body = `${digits}${percentMark}`;
  if (isNegative(value, digits)) return `${MINUS}${body}`;
  return signed ? `+${body}` : body;
}
