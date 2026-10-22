import { describe, expect, it } from '@jest/globals';

import { parseCsv, toCsv } from '@/lib/csv';

describe('parseCsv', () => {
  it('splits a plain grid on commas and newlines', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('keeps a comma inside a quoted field', () => {
    expect(parseCsv('a,"b,c",d')).toEqual([['a', 'b,c', 'd']]);
  });

  it('reads a doubled quote as one literal quote', () => {
    expect(parseCsv('"a""b",c')).toEqual([['a"b', 'c']]);
  });

  it('keeps a line break inside a quoted field', () => {
    expect(parseCsv('"a\nb",c')).toEqual([['a\nb', 'c']]);
  });

  it('splits rows on CRLF', () => {
    expect(parseCsv('a,b\r\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('splits rows on a bare carriage return', () => {
    expect(parseCsv('a,b\rc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('splits rows on a bare line feed', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('keeps an empty trailing field', () => {
    expect(parseCsv('a,')).toEqual([['a', '']]);
  });

  it('returns no rows for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('toCsv', () => {
  it('joins plain fields without quoting them', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['c', 'd'],
      ]),
    ).toBe('a,b\r\nc,d');
  });

  it('quotes a field containing a comma', () => {
    expect(toCsv([['a,b']])).toBe('"a,b"');
  });

  it('quotes a field containing a quote and doubles the quote', () => {
    expect(toCsv([['a"b']])).toBe('"a""b"');
  });

  it('quotes a field containing a carriage return', () => {
    expect(toCsv([['a\rb']])).toBe('"a\rb"');
  });

  it('quotes a field containing a line feed', () => {
    expect(toCsv([['a\nb']])).toBe('"a\nb"');
  });

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });
});

describe('round trip', () => {
  it('restores rows holding commas, quotes and line breaks', () => {
    const rows = [
      ['a', 'b,c'],
      ['d"e', 'f\ng'],
      ['', 'h'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
