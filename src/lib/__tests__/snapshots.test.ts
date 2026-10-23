import { describe, expect, it } from '@jest/globals';

import type {
  CurrencyCode,
  FxRate,
  Holding,
  Liability,
  PriceQuote,
  Valuation,
} from '@/data/types';
import {
  computeSnapshot,
  convertCurrency,
  holdingValue,
  type SnapshotInput,
} from '@/lib/snapshots';

const fxRates: FxRate[] = [
  { base: 'USD', quote: 'EUR', rate: 0.8, asOf: '2026-03-01' },
  { base: 'USD', quote: 'GBP', rate: 0.75, asOf: '2026-03-01' },
];

function makeHolding(overrides: Partial<Holding> & { id: string }): Holding {
  return {
    accountId: 'acc-1',
    assetClass: 'stocks',
    instrumentId: null,
    name: null,
    quantity: 1,
    currency: 'USD',
    ...overrides,
  };
}

function makeValuation(
  holdingId: string,
  date: string,
  value: number,
  currency: CurrencyCode = 'USD',
): Valuation {
  return { id: `val-${holdingId}-${date}`, holdingId, date, value, currency };
}

function makeQuote(instrumentId: string, price: number): PriceQuote {
  return { instrumentId, price, asOf: '2026-03-01' };
}

function makeLiability(id: string, balance: number, currency: CurrencyCode = 'USD'): Liability {
  return { id, name: id, kind: 'loan', balance, currency };
}

function makeInput(overrides: Partial<SnapshotInput> = {}): SnapshotInput {
  return {
    holdings: [],
    valuations: [],
    liabilities: [],
    priceQuotes: [],
    fxRates,
    baseCurrency: 'USD',
    ...overrides,
  };
}

describe('convertCurrency', () => {
  it('returns the amount unchanged when the two currencies are the same', () => {
    expect(convertCurrency(1234.56, 'EUR', 'EUR', fxRates)).toBe(1234.56);
  });

  it('converts out of USD by multiplying by the quoted rate', () => {
    expect(convertCurrency(100, 'USD', 'EUR', fxRates)).toBe(80);
  });

  it('converts into USD by dividing by the quoted rate', () => {
    expect(convertCurrency(80, 'EUR', 'USD', fxRates)).toBe(100);
  });

  it('routes a conversion between two non-USD currencies through USD', () => {
    expect(convertCurrency(80, 'EUR', 'GBP', fxRates)).toBe(75);
  });

  it('treats a missing rate as one instead of producing NaN', () => {
    const result = convertCurrency(100, 'SAR', 'USD', fxRates);
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(100);
  });

  it('treats a missing target rate as one instead of producing NaN', () => {
    const result = convertCurrency(100, 'USD', 'IQD', fxRates);
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(100);
  });

  it('ignores rate rows that are not quoted against USD', () => {
    const crossOnly: FxRate[] = [{ base: 'EUR', quote: 'GBP', rate: 0.9, asOf: '2026-03-01' }];
    expect(convertCurrency(100, 'EUR', 'GBP', crossOnly)).toBe(100);
  });

  it('converts a negative amount with the same rate', () => {
    expect(convertCurrency(-100, 'USD', 'EUR', fxRates)).toBe(-80);
  });
});

describe('holdingValue', () => {
  it('multiplies quantity by the quoted price for an instrument-backed holding', () => {
    const holding = makeHolding({ id: 'h-1', instrumentId: 'inst-1', quantity: 10 });
    expect(holdingValue(holding, [makeQuote('inst-1', 150)], new Map())).toBe(1500);
  });

  it('values an instrument-backed holding at zero when it has neither a quote nor a mark', () => {
    const holding = makeHolding({ id: 'h-1', instrumentId: 'inst-1', quantity: 10 });
    expect(holdingValue(holding, [makeQuote('inst-other', 150)], new Map())).toBe(0);
  });

  it('falls back to the last dated mark when an instrument-backed quote is missing', () => {
    const holding = makeHolding({ id: 'h-1', instrumentId: 'inst-1', quantity: 10 });
    const valuations = new Map([['h-1', makeValuation('h-1', '2026-02-01', 1480)]]);
    expect(holdingValue(holding, [makeQuote('inst-other', 150)], valuations)).toBe(1480);
  });

  it('prefers the quote over a stale mark when both exist', () => {
    const holding = makeHolding({ id: 'h-1', instrumentId: 'inst-1', quantity: 10 });
    const valuations = new Map([['h-1', makeValuation('h-1', '2026-02-01', 1480)]]);
    expect(holdingValue(holding, [makeQuote('inst-1', 150)], valuations)).toBe(1500);
  });

  it('rounds an instrument-backed value to cents', () => {
    const holding = makeHolding({ id: 'h-1', instrumentId: 'inst-1', quantity: 3 });
    expect(holdingValue(holding, [makeQuote('inst-1', 10.1111)], new Map())).toBe(30.33);
  });

  it('uses the latest valuation for a holding with no instrument', () => {
    const holding = makeHolding({ id: 'h-1', instrumentId: null, assetClass: 'property' });
    const valuations = new Map([['h-1', makeValuation('h-1', '2026-02-01', 1200.5)]]);
    expect(holdingValue(holding, [], valuations)).toBe(1200.5);
  });

  it('values a valuation-backed holding at zero when it has no valuation', () => {
    const holding = makeHolding({ id: 'h-1', instrumentId: null, assetClass: 'property' });
    expect(holdingValue(holding, [], new Map())).toBe(0);
  });

  it('rounds a valuation to cents', () => {
    const holding = makeHolding({ id: 'h-1', instrumentId: null, assetClass: 'cash' });
    const valuations = new Map([['h-1', makeValuation('h-1', '2026-02-01', 50.555)]]);
    expect(holdingValue(holding, [], valuations)).toBe(50.56);
  });

  it('ignores the quantity of a valuation-backed holding', () => {
    const holding = makeHolding({ id: 'h-1', instrumentId: null, quantity: 7, assetClass: 'cash' });
    const valuations = new Map([['h-1', makeValuation('h-1', '2026-02-01', 400)]]);
    expect(holdingValue(holding, [], valuations)).toBe(400);
  });
});

describe('computeSnapshot', () => {
  const holdings: Holding[] = [
    makeHolding({ id: 'h-stock-us', accountId: 'acc-1', instrumentId: 'inst-vt', quantity: 10 }),
    makeHolding({
      id: 'h-stock-eu',
      accountId: 'acc-1',
      instrumentId: 'inst-eu',
      quantity: 4,
      currency: 'EUR',
    }),
    makeHolding({
      id: 'h-flat',
      accountId: 'acc-2',
      assetClass: 'property',
      instrumentId: null,
      currency: 'GBP',
    }),
    makeHolding({ id: 'h-cash', accountId: 'acc-2', assetClass: 'cash', instrumentId: null }),
    makeHolding({
      id: 'h-btc',
      accountId: 'acc-3',
      assetClass: 'crypto',
      instrumentId: 'inst-btc',
      quantity: 0.5,
    }),
  ];

  const input = makeInput({
    holdings,
    valuations: [
      makeValuation('h-flat', '2026-01-01', 250, 'GBP'),
      makeValuation('h-flat', '2026-02-01', 300, 'GBP'),
      makeValuation('h-cash', '2026-02-01', 50.555),
    ],
    liabilities: [makeLiability('lia-mortgage', 12000), makeLiability('lia-card', 400, 'EUR')],
    priceQuotes: [
      makeQuote('inst-vt', 150),
      makeQuote('inst-eu', 25),
      makeQuote('inst-btc', 60000),
    ],
  });

  it('carries the date it was given', () => {
    expect(computeSnapshot('2026-03-01', input).date).toBe('2026-03-01');
  });

  it('totals assets in the base currency across mixed-currency holdings', () => {
    expect(computeSnapshot('2026-03-01', input).totalAssets).toBe(32075.56);
  });

  it('totals liabilities in the base currency', () => {
    expect(computeSnapshot('2026-03-01', input).totalLiabilities).toBe(12500);
  });

  it('reports net worth as assets minus liabilities', () => {
    const result = computeSnapshot('2026-03-01', input);
    expect(result.totalNetWorth).toBe(19575.56);
    expect(result.totalNetWorth).toBe(
      Math.round((result.totalAssets - result.totalLiabilities) * 100) / 100,
    );
  });

  it('groups converted values by asset class', () => {
    expect(computeSnapshot('2026-03-01', input).perClass).toEqual({
      stocks: 1625,
      crypto: 30000,
      property: 400,
      cash: 50.56,
      savings: 0,
    });
  });

  it('groups converted values by account', () => {
    expect(computeSnapshot('2026-03-01', input).perAccount).toEqual({
      'acc-1': 1625,
      'acc-2': 450.56,
      'acc-3': 30000,
    });
  });

  it('uses the newest valuation when a holding has several', () => {
    const single = makeInput({
      holdings: [makeHolding({ id: 'h-flat', assetClass: 'property', instrumentId: null })],
      valuations: [
        makeValuation('h-flat', '2026-02-01', 300),
        makeValuation('h-flat', '2026-01-01', 250),
        makeValuation('h-flat', '2025-06-01', 900),
      ],
    });
    expect(computeSnapshot('2026-03-01', single).perClass.property).toBe(300);
  });

  it('lists all five asset classes even when only one holds anything', () => {
    const result = computeSnapshot('2026-03-01', makeInput({ holdings: [holdings[0]] }));
    expect(Object.keys(result.perClass)).toEqual([
      'stocks',
      'crypto',
      'property',
      'cash',
      'savings',
    ]);
    expect(result.perClass).toEqual({
      stocks: 0,
      crypto: 0,
      property: 0,
      cash: 0,
      savings: 0,
    });
  });

  it('converts a liability held in a non-base currency instead of summing it raw', () => {
    const result = computeSnapshot(
      '2026-03-01',
      makeInput({ liabilities: [makeLiability('lia-card', 400, 'EUR')] }),
    );
    expect(result.totalLiabilities).toBe(500);
    expect(result.totalNetWorth).toBe(-500);
  });

  it('converts into a base currency other than USD', () => {
    const result = computeSnapshot(
      '2026-03-01',
      makeInput({
        baseCurrency: 'EUR',
        holdings: [makeHolding({ id: 'h-1', instrumentId: 'inst-1', quantity: 2 })],
        priceQuotes: [makeQuote('inst-1', 50)],
        liabilities: [makeLiability('lia-1', 100)],
      }),
    );
    expect(result.totalAssets).toBe(80);
    expect(result.totalLiabilities).toBe(80);
    expect(result.totalNetWorth).toBe(0);
  });

  it('returns a zeroed snapshot for empty input without producing NaN', () => {
    const result = computeSnapshot('2026-03-01', {
      holdings: [],
      valuations: [],
      liabilities: [],
      priceQuotes: [],
      fxRates: [],
      baseCurrency: 'USD',
    });
    expect(result).toEqual({
      date: '2026-03-01',
      totalNetWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      perClass: { stocks: 0, crypto: 0, property: 0, cash: 0, savings: 0 },
      perAccount: {},
    });
    expect(Number.isNaN(result.totalNetWorth)).toBe(false);
  });
});
