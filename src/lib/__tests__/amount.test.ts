import { describe, expect, it } from '@jest/globals';

import { formatDollars, parseAmount } from '@/lib/amount';

const GROUP = '٬';
const DECIMAL = '٫';
const MINUS = '−';

describe('parseAmount', () => {
  it('parses a plain integer string', () => {
    expect(parseAmount('12')).toBe(12);
    expect(parseAmount('0')).toBe(0);
  });

  it('parses a decimal string', () => {
    expect(parseAmount('12.5')).toBe(12.5);
    expect(parseAmount('1234.56')).toBe(1234.56);
  });

  it('strips a leading dollar sign', () => {
    expect(parseAmount('$12.50')).toBe(12.5);
  });

  it('strips comma grouping', () => {
    expect(parseAmount('1,234.56')).toBe(1234.56);
  });

  it('strips a dollar sign and comma grouping together', () => {
    expect(parseAmount('$1,234.56')).toBe(1234.56);
  });

  it('strips surrounding whitespace', () => {
    expect(parseAmount('  42  ')).toBe(42);
    expect(parseAmount('\t 7.25 \n')).toBe(7.25);
  });

  it('strips whitespace from inside the number too', () => {
    expect(parseAmount('  $ 1 , 2 3 4 . 5 6  ')).toBe(1234.56);
  });

  it('parses eastern-arabic digits', () => {
    expect(parseAmount('١٢٣٤٥٦٧٨٩٠')).toBe(1234567890);
    expect(parseAmount('٠')).toBe(0);
  });

  it('parses persian digits', () => {
    expect(parseAmount('۰۱۲۳۴۵۶۷۸۹')).toBe(123456789);
    expect(parseAmount(`۱۲۳${DECIMAL}۴۵`)).toBe(123.45);
  });

  it('reads the arabic decimal separator as a decimal point', () => {
    expect(parseAmount(`١٢٣٤${DECIMAL}٥٦`)).toBe(1234.56);
  });

  it('strips the arabic group separator', () => {
    expect(parseAmount(`١${GROUP}٢٣٤${DECIMAL}٥٦`)).toBe(1234.56);
  });

  it('returns null for an empty string', () => {
    expect(parseAmount('')).toBeNull();
  });

  it('returns null for a whitespace-only string', () => {
    expect(parseAmount('   ')).toBeNull();
  });

  it('returns null for a string that is only strippable characters', () => {
    expect(parseAmount('$')).toBeNull();
    expect(parseAmount(',')).toBeNull();
    expect(parseAmount(GROUP)).toBeNull();
  });

  it('returns null for non-numeric junk', () => {
    expect(parseAmount('abc')).toBeNull();
  });

  it('returns null for partially-numeric input rather than parsing the numeric prefix', () => {
    expect(parseAmount('12abc')).toBeNull();
  });

  it('returns null for a string with two decimal points', () => {
    expect(parseAmount('1.2.3')).toBeNull();
  });

  it('returns null for an underscore-separated number', () => {
    expect(parseAmount('1_000')).toBeNull();
  });

  it('parses a negative written with an ascii hyphen', () => {
    expect(parseAmount('-5')).toBe(-5);
    expect(parseAmount('-1,234.56')).toBe(-1234.56);
    expect(parseAmount('$-1,234.56')).toBe(-1234.56);
  });

  it('collapses a negated zero to positive zero', () => {
    expect(parseAmount('-0')).toBe(0);
  });

  it('parses a negative written with the U+2212 minus sign money.ts writes', () => {
    expect(parseAmount(`${MINUS}5`)).toBe(-5);
    expect(parseAmount(`${MINUS}1,234.56`)).toBe(-1234.56);
  });

  it('returns null for the literal strings Infinity and NaN', () => {
    expect(parseAmount('Infinity')).toBeNull();
    expect(parseAmount('-Infinity')).toBeNull();
    expect(parseAmount('NaN')).toBeNull();
  });

  it('returns null for a numeric literal that overflows to infinity', () => {
    expect(parseAmount('1e999')).toBeNull();
  });

  it('accepts the numeric literal forms that Number accepts', () => {
    expect(parseAmount('1e3')).toBe(1000);
    expect(parseAmount('0x10')).toBe(16);
    expect(parseAmount('.5')).toBe(0.5);
    expect(parseAmount('5.')).toBe(5);
    expect(parseAmount('+5')).toBe(5);
  });

  it('silently joins digits that commas and spaces were separating', () => {
    expect(parseAmount('1 2')).toBe(12);
    expect(parseAmount('1,2,3,4')).toBe(1234);
    expect(parseAmount('12,')).toBe(12);
  });
});

describe('formatDollars', () => {
  it('formats zero with no fraction digits', () => {
    expect(formatDollars(0)).toBe('$0');
  });

  it('formats a whole number with no fraction digits', () => {
    expect(formatDollars(5)).toBe('$5');
    expect(formatDollars(1234)).toBe('$1,234');
  });

  it('formats a fractional value with two fraction digits', () => {
    expect(formatDollars(5.5)).toBe('$5.50');
    expect(formatDollars(1234.5)).toBe('$1,234.50');
    expect(formatDollars(1234.56)).toBe('$1,234.56');
    expect(formatDollars(0.1)).toBe('$0.10');
  });

  it('groups thousands with commas', () => {
    expect(formatDollars(1000000.5)).toBe('$1,000,000.50');
    expect(formatDollars(999999.99)).toBe('$999,999.99');
  });

  it('rounds a third decimal into the cents', () => {
    expect(formatDollars(1234.567)).toBe('$1,234.57');
    expect(formatDollars(2.675)).toBe('$2.68');
  });

  it('rounds a sub-cent value down to a whole dollar', () => {
    expect(formatDollars(0.004)).toBe('$0');
  });

  it('rounds a half-cent value up to its cents', () => {
    expect(formatDollars(1.005)).toBe('$1.01');
  });

  it('puts the sign ahead of the dollar symbol for a negative', () => {
    expect(formatDollars(-5)).toBe(`${MINUS}$5`);
    expect(formatDollars(-1234.56)).toBe(`${MINUS}$1,234.56`);
    expect(formatDollars(-1234.5)).toBe(`${MINUS}$1,234.50`);
    expect(formatDollars(-0.5)).toBe(`${MINUS}$0.50`);
  });

  it('signs a negative with the same U+2212 money.ts writes', () => {
    const formatted = formatDollars(-5);
    expect(formatted).not.toContain('-');
    expect(formatted.codePointAt(0)).toBe(0x2212);
    expect(formatted.codePointAt(1)).toBe(0x24);
  });

  it('renders negative zero and a negative sub-cent value as an unsigned zero', () => {
    expect(formatDollars(-0)).toBe('$0');
    expect(formatDollars(-0.004)).toBe('$0');
  });

  it('writes a very large value in full without exponential notation or a rounding step', () => {
    expect(formatDollars(1e21)).toBe('$1,000,000,000,000,000,000,000');
    expect(formatDollars(1e21)).not.toContain('e');
  });

  it('formats a parsed amount back into the same string it came from', () => {
    expect(formatDollars(parseAmount('$1,234.56') as number)).toBe('$1,234.56');
    expect(formatDollars(parseAmount(`١${GROUP}٢٣٤${DECIMAL}٥٦`) as number)).toBe('$1,234.56');
  });
});

describe('floating-point accumulation', () => {
  it('formats one thousand additions of 0.01 as ten dollars rather than drifting a cent', () => {
    let sum = 0;
    for (let i = 0; i < 1000; i += 1) sum += 0.01;
    expect(sum).not.toBe(10);
    expect(formatDollars(sum)).toBe('$10');
  });

  it('formats one hundred additions of 0.07 as seven dollars', () => {
    let sum = 0;
    for (let i = 0; i < 100; i += 1) sum += 0.07;
    expect(sum).not.toBe(7);
    expect(formatDollars(sum)).toBe('$7');
  });

  it('formats a sum whose binary value overshoots the exact decimal without drifting a cent', () => {
    const total = 0.1 + 0.2;
    expect(total).not.toBe(0.3);
    expect(formatDollars(total)).toBe('$0.30');
  });

  it('formats a list of cent values as its exact total', () => {
    const total = [19.99, 4.95, 0.01, 0.05, 12.34, 0.66].reduce((a, b) => a + b, 0);
    expect(formatDollars(total)).toBe('$38');
  });

  it('matches the exact decimal total when the added step is a half cent', () => {
    let sum = 0;
    for (let i = 0; i < 11; i += 1) sum += 0.005;
    expect(formatDollars(sum)).toBe('$0.06');
    expect(formatDollars(0.055)).toBe('$0.06');
  });
});
