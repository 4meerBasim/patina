import { describe, expect, it } from '@jest/globals';

import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatSignedCurrency,
  toArabicNumerals,
  toLatinNumerals,
} from '@/lib/money';

const MINUS = '−';
const GROUP = '٬';
const DECIMAL = '٫';
const PERCENT = '٪';

describe('toArabicNumerals', () => {
  it('converts a plain integer to eastern-arabic digits', () => {
    expect(toArabicNumerals('1234567890')).toBe('١٢٣٤٥٦٧٨٩٠');
  });

  it('converts the digits of a decimal and leaves the ascii decimal point in place', () => {
    expect(toArabicNumerals('1,234.56')).toBe('١,٢٣٤.٥٦');
  });

  it('leaves an ascii hyphen in front of a negative untouched', () => {
    expect(toArabicNumerals('-42')).toBe('-٤٢');
  });

  it('leaves a U+2212 minus sign untouched', () => {
    expect(toArabicNumerals(`${MINUS}5.5`)).toBe(`${MINUS}٥.٥`);
  });

  it('passes non-digit characters through untouched', () => {
    expect(toArabicNumerals('Order #7 (USD 3)')).toBe('Order #٧ (USD ٣)');
  });

  it('returns a string with no digits unchanged', () => {
    expect(toArabicNumerals('no digits here')).toBe('no digits here');
  });

  it('returns an empty string unchanged', () => {
    expect(toArabicNumerals('')).toBe('');
  });

  it('leaves text that is already in eastern-arabic digits unchanged', () => {
    expect(toArabicNumerals('٠١٢')).toBe('٠١٢');
  });
});

describe('toLatinNumerals', () => {
  it('converts eastern-arabic digits to ascii', () => {
    expect(toLatinNumerals('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890');
  });

  it('converts persian digits to ascii', () => {
    expect(toLatinNumerals('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('leaves the arabic group and decimal separators in place', () => {
    expect(toLatinNumerals(`١${GROUP}٢٣٤${DECIMAL}٥٦`)).toBe(`1${GROUP}234${DECIMAL}56`);
  });

  it('returns a string with no digits unchanged', () => {
    expect(toLatinNumerals('no digits here')).toBe('no digits here');
  });

  it('leaves text that is already in ascii digits unchanged', () => {
    expect(toLatinNumerals('0123')).toBe('0123');
  });

  it('restores a mixed string through a round trip', () => {
    const original = 'Invoice 1,234.56 / 2026';
    expect(toLatinNumerals(toArabicNumerals(original))).toBe(original);
  });
});

describe('formatNumber', () => {
  it('rounds to two fraction digits by default', () => {
    expect(formatNumber(1234.5678)).toBe('1,234.57');
  });

  it('honours an explicit maximumFractionDigits', () => {
    expect(formatNumber(1234.5678, { maximumFractionDigits: 3 })).toBe('1,234.568');
  });

  it('pads to an explicit minimumFractionDigits', () => {
    expect(formatNumber(5, { minimumFractionDigits: 2 })).toBe('5.00');
  });

  it('lets minimumFractionDigits raise a lower maximumFractionDigits', () => {
    expect(formatNumber(5, { minimumFractionDigits: 4, maximumFractionDigits: 2 })).toBe('5.0000');
  });

  it('rounds 1.005 up to 1.01 despite its binary value sitting below the halfway point', () => {
    expect(formatNumber(1.005)).toBe('1.01');
  });

  it('rounds 2.675 up to 2.68', () => {
    expect(formatNumber(2.675)).toBe('2.68');
  });

  it('rounds a half away from zero at zero fraction digits', () => {
    expect(formatNumber(0.5, { maximumFractionDigits: 0 })).toBe('1');
    expect(formatNumber(1.5, { maximumFractionDigits: 0 })).toBe('2');
    expect(formatNumber(2.5, { maximumFractionDigits: 0 })).toBe('3');
  });

  it('groups thousands with commas in latin numerals', () => {
    expect(formatNumber(1234567.891)).toBe('1,234,567.89');
  });

  it('groups thousands with the arabic separator in arabic numerals', () => {
    expect(formatNumber(1234567.891, { numeralSystem: 'arabic' })).toBe(
      `١${GROUP}٢٣٤${GROUP}٥٦٧${DECIMAL}٨٩`,
    );
  });

  it('prefixes a negative with U+2212 in latin numerals', () => {
    expect(formatNumber(-1234.5)).toBe(`${MINUS}1,234.5`);
  });

  it('prefixes a negative with U+2212 in arabic numerals', () => {
    expect(formatNumber(-1234567.891, { numeralSystem: 'arabic' })).toBe(
      `${MINUS}١${GROUP}٢٣٤${GROUP}٥٦٧${DECIMAL}٨٩`,
    );
  });

  it('uses U+2212 for the sign rather than an ascii hyphen-minus', () => {
    const formatted = formatNumber(-5);
    expect(formatted.codePointAt(0)).toBe(0x2212);
    expect(formatted).not.toContain('-');
  });

  it('formats zero without a sign', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats negative zero without a sign', () => {
    expect(formatNumber(-0)).toBe('0');
  });

  it('rounds a positive value below half a cent down to a bare zero', () => {
    expect(formatNumber(0.004)).toBe('0');
  });

  // Bug: Negative Sub-Cent Renders As Minus Zero — asserts current behaviour
  it('renders a negative value below half a cent as a signed zero', () => {
    expect(formatNumber(-0.004)).toBe(`${MINUS}0`);
  });

  it('keeps a small non-zero value visible when the fraction digits allow it', () => {
    expect(formatNumber(0.004, { maximumFractionDigits: 4 })).toBe('0.004');
  });

  it('writes a very large value in full without exponential notation', () => {
    expect(formatNumber(1e21)).toBe('1,000,000,000,000,000,000,000');
    expect(formatNumber(1e21)).not.toContain('e');
  });

  it('writes a very large value in full in arabic numerals', () => {
    expect(formatNumber(1e21, { numeralSystem: 'arabic' })).toBe(
      `١${GROUP}٠٠٠${GROUP}٠٠٠${GROUP}٠٠٠${GROUP}٠٠٠${GROUP}٠٠٠${GROUP}٠٠٠${GROUP}٠٠٠`,
    );
  });
});

describe('formatCurrency', () => {
  it('formats zero with no sign', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0');
  });

  it('formats negative zero with no sign', () => {
    expect(formatCurrency(-0, 'USD')).toBe('$0');
  });

  it('puts the U+2212 sign before the symbol for a negative', () => {
    expect(formatCurrency(-1234.5, 'USD')).toBe(`${MINUS}$1,234.5`);
  });

  it('uses U+2212 rather than an ascii hyphen-minus for the sign', () => {
    const formatted = formatCurrency(-1234.5, 'USD');
    expect(formatted.codePointAt(0)).toBe(0x2212);
    expect(formatted.codePointAt(1)).toBe(0x24);
    expect(formatted).not.toContain('-');
  });

  // Bug: Currency Drops The Trailing Cent Zero — asserts current behaviour
  it('leaves a single-decimal value with one fraction digit instead of padding to cents', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.5');
  });

  it('pads to cents when minimumFractionDigits is passed explicitly', () => {
    expect(formatCurrency(1234.5, 'USD', { minimumFractionDigits: 2 })).toBe('$1,234.50');
    expect(formatCurrency(-1234.5, 'USD', { minimumFractionDigits: 2 })).toBe(`${MINUS}$1,234.50`);
  });

  it('drops the fraction entirely for a whole value', () => {
    expect(formatCurrency(1234, 'USD')).toBe('$1,234');
  });

  it('keeps both cents of a two-decimal value', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('rounds a third decimal into the cents', () => {
    expect(formatCurrency(1234.567, 'USD')).toBe('$1,234.57');
  });

  it('honours an explicit maximumFractionDigits', () => {
    expect(formatCurrency(1234.5678, 'USD', { maximumFractionDigits: 3 })).toBe('$1,234.568');
  });

  it('rounds 2.675 up to its cents', () => {
    expect(formatCurrency(2.675, 'USD')).toBe('$2.68');
  });

  // Bug: Half-Cent Value Loses Its Cents In Currency Output — asserts current behaviour
  it('renders 1.005 as a bare dollar even though formatNumber rounds it to 1.01', () => {
    expect(formatNumber(1.005)).toBe('1.01');
    expect(formatCurrency(1.005, 'USD')).toBe('$1');
  });

  it('rounds a positive value below half a cent down to a bare zero', () => {
    expect(formatCurrency(0.004, 'USD')).toBe('$0');
  });

  // Bug: Negative Sub-Cent Renders As Minus Zero — asserts current behaviour
  it('renders a negative value below half a cent as a signed zero', () => {
    expect(formatCurrency(-0.004, 'USD')).toBe(`${MINUS}$0`);
  });

  it('keeps a small non-zero value visible when the fraction digits allow it', () => {
    expect(formatCurrency(0.004, 'USD', { maximumFractionDigits: 4 })).toBe('$0.004');
    expect(formatCurrency(0.004, 'USD', { minimumFractionDigits: 2 })).toBe('$0.00');
  });

  it('writes a very large value in full without exponential notation', () => {
    expect(formatCurrency(1e21, 'USD')).toBe('$1,000,000,000,000,000,000,000');
    expect(formatCurrency(1e21, 'USD')).not.toContain('e');
  });

  it('groups a large value below the exponential threshold', () => {
    expect(formatCurrency(1000000000000.5, 'USD')).toBe('$1,000,000,000,000.5');
  });

  it('puts every currency symbol before the number in the en locale', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.5');
    expect(formatCurrency(1234.5, 'EUR')).toBe('€1,234.5');
    expect(formatCurrency(1234.5, 'GBP')).toBe('£1,234.5');
    expect(formatCurrency(1234.5, 'SAR')).toBe('SR1,234.5');
    expect(formatCurrency(1234.5, 'AED')).toBe('AED1,234.5');
    expect(formatCurrency(1234.5, 'IQD')).toBe('IQD1,234.5');
  });

  it('puts every currency symbol after the number in the ar locale', () => {
    expect(formatCurrency(1234.5, 'USD', { locale: 'ar' })).toBe('1,234.5 $');
    expect(formatCurrency(1234.5, 'EUR', { locale: 'ar' })).toBe('1,234.5 €');
    expect(formatCurrency(1234.5, 'GBP', { locale: 'ar' })).toBe('1,234.5 £');
    expect(formatCurrency(1234.5, 'SAR', { locale: 'ar' })).toBe('1,234.5 SR');
    expect(formatCurrency(1234.5, 'AED', { locale: 'ar' })).toBe('1,234.5 AED');
    expect(formatCurrency(1234.5, 'IQD', { locale: 'ar' })).toBe('1,234.5 IQD');
  });

  it('keeps the sign ahead of the number when the ar locale trails the symbol', () => {
    expect(formatCurrency(-99, 'EUR', { locale: 'ar' })).toBe(`${MINUS}99 €`);
  });

  it('combines the ar locale with arabic numerals', () => {
    expect(formatCurrency(1234.5, 'IQD', { locale: 'ar', numeralSystem: 'arabic' })).toBe(
      `١${GROUP}٢٣٤${DECIMAL}٥ IQD`,
    );
    expect(formatCurrency(-99, 'EUR', { locale: 'ar', numeralSystem: 'arabic' })).toBe(
      `${MINUS}٩٩ €`,
    );
  });

  it('formats zero in the ar locale with the symbol trailing', () => {
    expect(formatCurrency(0, 'USD', { locale: 'ar' })).toBe('0 $');
    expect(formatCurrency(0, 'IQD', { locale: 'ar', numeralSystem: 'arabic' })).toBe('٠ IQD');
  });
});

describe('formatSignedCurrency', () => {
  it('prefixes a positive value with an ascii plus', () => {
    expect(formatSignedCurrency(1234.5, 'USD')).toBe('+$1,234.5');
    expect(formatSignedCurrency(1234, 'USD')).toBe('+$1,234');
  });

  it('prefixes a negative value with a single U+2212 ahead of the symbol', () => {
    expect(formatSignedCurrency(-1234.5, 'USD')).toBe(`${MINUS}$1,234.5`);
    expect(formatSignedCurrency(-5, 'USD')).toBe(`${MINUS}$5`);
  });

  it('does not double the sign on a negative value', () => {
    const formatted = formatSignedCurrency(-5, 'USD');
    expect(formatted).not.toContain(`${MINUS}${MINUS}`);
    expect(formatted).not.toContain('-');
    expect(formatted.split(MINUS)).toHaveLength(2);
  });

  it('prefixes zero with a plus rather than leaving it unsigned', () => {
    expect(formatSignedCurrency(0, 'USD')).toBe('+$0');
  });

  it('prefixes negative zero with a plus', () => {
    expect(formatSignedCurrency(-0, 'USD')).toBe('+$0');
  });

  it('rounds a positive sub-cent value to a signed zero', () => {
    expect(formatSignedCurrency(0.004, 'USD')).toBe('+$0');
  });

  // Bug: Negative Sub-Cent Renders As Minus Zero — asserts current behaviour
  it('renders a negative sub-cent value as a minus zero', () => {
    expect(formatSignedCurrency(-0.004, 'USD')).toBe(`${MINUS}$0`);
  });

  it('keeps the sign ahead of the number in the ar locale', () => {
    expect(formatSignedCurrency(-5, 'SAR', { locale: 'ar' })).toBe(`${MINUS}5 SR`);
    expect(formatSignedCurrency(-1234.5, 'EUR', { locale: 'ar', numeralSystem: 'arabic' })).toBe(
      `${MINUS}١${GROUP}٢٣٤${DECIMAL}٥ €`,
    );
  });
});

describe('formatPercent', () => {
  it('formats a positive value to two fraction digits with no sign by default', () => {
    expect(formatPercent(12.5)).toBe('12.50%');
  });

  it('prefixes a positive value with a plus when signed', () => {
    expect(formatPercent(12.5, { signed: true })).toBe('+12.50%');
  });

  it('prefixes a negative value with U+2212 whether or not signed is set', () => {
    expect(formatPercent(-12.5)).toBe(`${MINUS}12.50%`);
    expect(formatPercent(-12.5, { signed: true })).toBe(`${MINUS}12.50%`);
  });

  it('uses U+2212 rather than an ascii hyphen-minus for a negative', () => {
    const formatted = formatPercent(-12.5);
    expect(formatted.codePointAt(0)).toBe(0x2212);
    expect(formatted).not.toContain('-');
  });

  it('formats zero without a sign by default', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('prefixes zero with a plus when signed', () => {
    expect(formatPercent(0, { signed: true })).toBe('+0.00%');
    expect(formatPercent(-0, { signed: true })).toBe('+0.00%');
  });

  it('uses the arabic percent mark and digits in arabic numerals', () => {
    expect(formatPercent(12.5, { numeralSystem: 'arabic' })).toBe(`١٢${DECIMAL}٥٠${PERCENT}`);
  });

  it('keeps the U+2212 sign ahead of arabic digits', () => {
    expect(formatPercent(-12.5, { numeralSystem: 'arabic', signed: true })).toBe(
      `${MINUS}١٢${DECIMAL}٥٠${PERCENT}`,
    );
  });

  it('groups thousands in a large percentage', () => {
    expect(formatPercent(1234.5678)).toBe('1,234.57%');
  });

  // Bug: Percent Ignores maximumFractionDigits Unless Minimum Is Also Passed — asserts current behaviour
  it('keeps two fraction digits when only maximumFractionDigits is lowered', () => {
    expect(formatPercent(5, { maximumFractionDigits: 0 })).toBe('5.00%');
  });

  it('drops the fraction when both fraction-digit options are lowered', () => {
    expect(formatPercent(7.5, { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe('8%');
    expect(formatPercent(7.5, { minimumFractionDigits: 1, maximumFractionDigits: 1 })).toBe('7.5%');
  });

  // Bug: Negative Sub-Cent Renders As Minus Zero — asserts current behaviour
  it('renders a negative value below the displayed precision as a minus zero', () => {
    expect(formatPercent(-0.001, { signed: true })).toBe(`${MINUS}0.00%`);
  });
});

describe('floating-point accumulation', () => {
  it('formats one thousand additions of 0.01 as ten dollars rather than drifting a cent', () => {
    let sum = 0;
    for (let i = 0; i < 1000; i += 1) sum += 0.01;
    expect(sum).not.toBe(10);
    expect(sum).toBeCloseTo(10, 10);
    expect(formatCurrency(sum, 'USD', { minimumFractionDigits: 2 })).toBe('$10.00');
    expect(formatNumber(sum, { minimumFractionDigits: 2 })).toBe('10.00');
  });

  it('formats one hundred additions of 0.07 as seven dollars', () => {
    let sum = 0;
    for (let i = 0; i < 100; i += 1) sum += 0.07;
    expect(sum).not.toBe(7);
    expect(formatCurrency(sum, 'USD', { minimumFractionDigits: 2 })).toBe('$7.00');
  });

  it('formats one hundred additions of 1.10 as one hundred and ten dollars', () => {
    let sum = 0;
    for (let i = 0; i < 100; i += 1) sum += 1.1;
    expect(sum).not.toBe(110);
    expect(formatCurrency(sum, 'USD', { minimumFractionDigits: 2 })).toBe('$110.00');
  });

  it('formats a list of cent values as its exact total', () => {
    const total = [19.99, 4.95, 0.01, 0.05, 12.34, 0.66].reduce((a, b) => a + b, 0);
    expect(formatCurrency(total, 'USD', { minimumFractionDigits: 2 })).toBe('$38.00');
  });

  it('formats a sum whose binary value overshoots the exact decimal without drifting a cent', () => {
    const total = 0.1 + 0.2;
    expect(total).not.toBe(0.3);
    expect(formatNumber(total, { minimumFractionDigits: 2 })).toBe('0.30');
    expect(formatCurrency(total, 'USD', { minimumFractionDigits: 2 })).toBe('$0.30');
  });

  // Bug: Sub-Cent Accumulation Lands A Cent Low — asserts current behaviour
  it('lands a cent below the exact decimal total when the added step is a half cent', () => {
    let sum = 0;
    for (let i = 0; i < 11; i += 1) sum += 0.005;
    expect(formatCurrency(sum, 'USD', { minimumFractionDigits: 2 })).toBe('$0.05');
    expect(formatCurrency(0.055, 'USD', { minimumFractionDigits: 2 })).toBe('$0.06');
  });
});
