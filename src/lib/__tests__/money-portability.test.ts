import { describe, expect, it } from '@jest/globals';

import { CURRENCIES, type CurrencyCode } from '@/data/types';
import { formatCurrency, formatNumber, formatPercent, toLatinNumerals } from '@/lib/money';

// The rest of the money suite asserts assembled strings, which only proves what Node's
// ICU does. The app renders on Hermes, a different Intl implementation with different
// ICU data. These cases assert the structure money.ts actually promises — where the sign
// sits, which separators appear, which digit script is used — so a divergent engine
// fails on the thing that broke rather than on a mystery string mismatch.

const MINUS = '−';
const ARABIC_GROUP = '٬';
const ARABIC_DECIMAL = '٫';
const EASTERN = /[٠-٩]/;

const SYMBOL: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'SR',
  AED: 'AED',
  IQD: 'IQD',
};

describe('the Intl behaviour money.ts rests on', () => {
  it('groups en-US thousands with a comma and separates the fraction with a dot', () => {
    const parts = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).formatToParts(1234567.89);

    expect(parts.find((part) => part.type === 'group')?.value).toBe(',');
    expect(parts.find((part) => part.type === 'decimal')?.value).toBe('.');
    expect(parts.filter((part) => part.type === 'integer').map((part) => part.value)).toEqual([
      '1',
      '234',
      '567',
    ]);
  });

  it('rounds a half away from zero rather than to even', () => {
    const at = (value: number) =>
      new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

    expect(at(0.5)).toBe('1');
    expect(at(1.5)).toBe('2');
    expect(at(2.5)).toBe('3');
  });

  it('rounds from the decimal the number prints as, not from its binary value', () => {
    // 1.005 as a double is 1.00499999999999989, so an engine rounding the binary value
    // would give 1.00. Both the formatters and their digit-count probe depend on this.
    const cents = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

    expect(cents.format(1.005)).toBe('1.01');
    expect(cents.format(2.675)).toBe('2.68');
  });

  it('writes a very large value in full rather than in exponential notation', () => {
    const formatted = new Intl.NumberFormat('en-US').format(1e21);

    expect(formatted).not.toContain('e');
    expect(toLatinNumerals(formatted).replace(/,/g, '')).toBe('1' + '0'.repeat(21));
  });

  it('uses latin digits for en-US, since money.ts converts the script itself', () => {
    expect(new Intl.NumberFormat('en-US').format(1234)).not.toMatch(EASTERN);
  });
});

describe('formatNumber structure', () => {
  it('puts the sign at index 0 and nowhere else, in both numeral systems', () => {
    for (const numeralSystem of ['latin', 'arabic'] as const) {
      const formatted = formatNumber(-1234.5, { numeralSystem });

      expect(formatted.codePointAt(0)).toBe(0x2212);
      expect(formatted.slice(1)).not.toContain(MINUS);
      expect(formatted).not.toContain('-');
    }
  });

  it('uses the arabic separators and eastern digits for the arabic system only', () => {
    const arabic = formatNumber(1234567.89, { numeralSystem: 'arabic' });

    expect(arabic).toContain(ARABIC_GROUP);
    expect(arabic).toContain(ARABIC_DECIMAL);
    expect(arabic).not.toContain(',');
    expect(arabic).not.toContain('.');
    expect(arabic).toMatch(EASTERN);

    const latin = formatNumber(1234567.89);

    expect(latin).toContain(',');
    expect(latin).toContain('.');
    expect(latin).not.toMatch(EASTERN);
  });

  it('reads back as the same number through toLatinNumerals in either system', () => {
    for (const numeralSystem of ['latin', 'arabic'] as const) {
      const formatted = formatNumber(1234567.89, { numeralSystem });
      const plain = toLatinNumerals(formatted)
        .replace(new RegExp(`[,${ARABIC_GROUP}]`, 'g'), '')
        .replace(new RegExp(`[${ARABIC_DECIMAL}]`, 'g'), '.');

      expect(Number(plain)).toBeCloseTo(1234567.89, 2);
    }
  });
});

describe('formatCurrency structure', () => {
  it('leads with the symbol in the en locale and trails it in the ar locale', () => {
    for (const currency of CURRENCIES) {
      const symbol = SYMBOL[currency];

      expect(formatCurrency(1234.56, currency).startsWith(symbol)).toBe(true);
      expect(formatCurrency(1234.56, currency, { locale: 'ar' }).endsWith(` ${symbol}`)).toBe(true);
    }
  });

  it('keeps the sign outside the symbol in both locales', () => {
    for (const currency of CURRENCIES) {
      const en = formatCurrency(-1234.56, currency);
      const ar = formatCurrency(-1234.56, currency, { locale: 'ar' });

      expect(en.codePointAt(0)).toBe(0x2212);
      expect(en.slice(1).startsWith(SYMBOL[currency])).toBe(true);
      expect(ar.codePointAt(0)).toBe(0x2212);
      expect(ar.endsWith(` ${SYMBOL[currency]}`)).toBe(true);
    }
  });

  it('shows two fraction digits or none, never one', () => {
    const fractionLength = (formatted: string): number => {
      const latin = toLatinNumerals(formatted).replace(new RegExp(ARABIC_DECIMAL, 'g'), '.');
      return latin.match(/\.(\d+)/)?.[1].length ?? 0;
    };

    for (const value of [1234, 1234.5, 1234.56, 1234.567, 0.004, 1.005]) {
      for (const currency of CURRENCIES) {
        expect([0, 2]).toContain(fractionLength(formatCurrency(value, currency)));
      }
    }
  });
});

describe('formatPercent structure', () => {
  it('puts the latin percent mark last and the arabic one last too', () => {
    expect(formatPercent(12.5).endsWith('%')).toBe(true);
    expect(formatPercent(12.5, { numeralSystem: 'arabic' }).endsWith('٪')).toBe(true);
  });

  it('keeps the sign ahead of the digits in both systems', () => {
    expect(formatPercent(-12.5).codePointAt(0)).toBe(0x2212);
    expect(formatPercent(-12.5, { numeralSystem: 'arabic' }).codePointAt(0)).toBe(0x2212);
    expect(formatPercent(12.5, { signed: true }).codePointAt(0)).toBe(0x2b);
  });
});
