import { describe, expect, it } from '@jest/globals';

import type {
  CurrencyCode,
  FxRate,
  Holding,
  Lot,
  PriceQuote,
  Transaction,
  Valuation,
} from '@/data/types';
import { computePositions } from '@/lib/positions';
import type { PositionsInput } from '@/lib/positions';

function makeHolding(over: Partial<Holding> = {}): Holding {
  return {
    id: 'h1',
    accountId: 'acc1',
    assetClass: 'stocks',
    instrumentId: 'inst1',
    name: 'Acme',
    quantity: 10,
    currency: 'USD',
    ...over,
  };
}

function makeLot(over: Partial<Lot> = {}): Lot {
  return {
    id: 'lot1',
    holdingId: 'h1',
    quantity: 10,
    costPerUnit: 100,
    acquiredAt: '2024-01-01',
    remainingQuantity: 10,
    acquiredFxRate: null,
    ...over,
  };
}

function makeSell(over: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx1',
    holdingId: 'h1',
    accountId: 'acc1',
    type: 'sell',
    quantity: 5,
    price: 150,
    amount: 750,
    currency: 'USD',
    date: '2024-06-01',
    note: null,
    ...over,
  };
}

function makeQuote(price: number, instrumentId = 'inst1'): PriceQuote {
  return { instrumentId, price, asOf: '2024-06-30' };
}

function makeFx(quote: CurrencyCode, rate: number): FxRate {
  return { base: 'USD', quote, rate, asOf: '2024-06-30' };
}

function makeValuation(over: Partial<Valuation> = {}): Valuation {
  return {
    id: 'val1',
    holdingId: 'h1',
    date: '2024-06-01',
    value: 500,
    currency: 'USD',
    ...over,
  };
}

function makeInput(over: Partial<PositionsInput> = {}): PositionsInput {
  return {
    holdings: [],
    lots: [],
    transactions: [],
    priceQuotes: [],
    valuations: [],
    fxRates: [],
    baseCurrency: 'USD',
    ...over,
  };
}

describe('computePositions FIFO lot consumption', () => {
  it('charges a partial sell against the cost of the earliest lot only', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 16 })],
        lots: [
          makeLot({ id: 'lot1', quantity: 10, costPerUnit: 100, remainingQuantity: 6 }),
          makeLot({
            id: 'lot2',
            quantity: 10,
            costPerUnit: 200,
            remainingQuantity: 10,
            acquiredAt: '2024-02-01',
          }),
        ],
        transactions: [makeSell({ quantity: 4, price: 150, amount: 600 })],
      }),
    );

    expect(positions[0].realisedGain).toBe(200);
  });

  it('consumes a lot exactly without reaching into the next lot', () => {
    const lots = [
      makeLot({ id: 'lot1', quantity: 10, costPerUnit: 100, remainingQuantity: 0 }),
      makeLot({
        id: 'lot2',
        quantity: 5,
        costPerUnit: 300,
        remainingQuantity: 5,
        acquiredAt: '2024-02-01',
      }),
    ];
    const emptyingSell = makeSell({ id: 'tx1', quantity: 10, price: 150, amount: 1500 });

    const afterFirstSell = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 5 })],
        lots,
        transactions: [emptyingSell],
      }),
    );

    expect(afterFirstSell[0].realisedGain).toBe(500);

    const afterSecondSell = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 0 })],
        lots,
        transactions: [
          emptyingSell,
          makeSell({ id: 'tx2', quantity: 5, price: 400, amount: 2000, date: '2024-07-01' }),
        ],
      }),
    );

    expect(afterSecondSell[0].realisedGain).toBe(1000);
  });

  it('blends the cost of three lots when a sell spans all of them', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 17 })],
        lots: [
          makeLot({ id: 'lot1', quantity: 10, costPerUnit: 100, remainingQuantity: 0 }),
          makeLot({
            id: 'lot2',
            quantity: 5,
            costPerUnit: 200,
            remainingQuantity: 0,
            acquiredAt: '2024-02-01',
          }),
          makeLot({
            id: 'lot3',
            quantity: 20,
            costPerUnit: 250,
            remainingQuantity: 17,
            acquiredAt: '2024-03-01',
          }),
        ],
        transactions: [makeSell({ quantity: 18, price: 300, amount: 5400 })],
      }),
    );

    expect(positions[0].realisedGain).toBe(2650);
  });

  it('carries lot consumption forward across separate sells instead of restarting', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 8 })],
        lots: [
          makeLot({ id: 'lot1', quantity: 10, costPerUnit: 100, remainingQuantity: 0 }),
          makeLot({
            id: 'lot2',
            quantity: 10,
            costPerUnit: 200,
            remainingQuantity: 8,
            acquiredAt: '2024-02-01',
          }),
        ],
        transactions: [
          makeSell({ id: 'tx1', quantity: 6, price: 150, amount: 900, date: '2024-05-01' }),
          makeSell({ id: 'tx2', quantity: 6, price: 180, amount: 1080, date: '2024-06-01' }),
        ],
      }),
    );

    expect(positions[0].realisedGain).toBe(580);
  });

  it('follows acquisition date rather than the order lots arrive in', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 10 })],
        lots: [
          makeLot({
            id: 'lot2',
            quantity: 10,
            costPerUnit: 200,
            remainingQuantity: 10,
            acquiredAt: '2024-02-01',
          }),
          makeLot({
            id: 'lot1',
            quantity: 10,
            costPerUnit: 100,
            remainingQuantity: 0,
            acquiredAt: '2024-01-01',
          }),
        ],
        transactions: [makeSell({ quantity: 10, price: 150, amount: 1500 })],
      }),
    );

    expect(positions[0].realisedGain).toBe(500);
  });

  it('derives proceeds per unit from the amount when the sell carries no price', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 5 })],
        lots: [makeLot({ quantity: 10, costPerUnit: 100, remainingQuantity: 5 })],
        transactions: [makeSell({ quantity: 5, price: null, amount: 750 })],
      }),
    );

    expect(positions[0].realisedGain).toBe(250);
  });

  it('ignores a sell that carries no quantity', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding()],
        lots: [makeLot()],
        transactions: [makeSell({ quantity: null, price: 150, amount: 750 })],
      }),
    );

    expect(positions[0].realisedGain).toBe(0);
  });
});

describe('computePositions realised and unrealised split', () => {
  it('keeps realised money out of the unrealised figure', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 9 })],
        lots: [
          makeLot({ id: 'lot1', quantity: 10, costPerUnit: 100, remainingQuantity: 4 }),
          makeLot({
            id: 'lot2',
            quantity: 5,
            costPerUnit: 200,
            remainingQuantity: 5,
            acquiredAt: '2024-02-01',
          }),
        ],
        transactions: [makeSell({ quantity: 6, price: 150, amount: 900 })],
        priceQuotes: [makeQuote(220)],
      }),
    );

    expect(positions[0].realisedGain).toBe(300);
    expect(positions[0].value).toBe(1980);
    expect(positions[0].costBasisNative).toBe(1400);
    expect(positions[0].costBasis).toBe(1400);
    expect(positions[0].unrealisedGain).toBe(580);
  });

  it('reports no realised gain for a holding that has never been sold', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 10 })],
        lots: [makeLot({ quantity: 10, costPerUnit: 100, remainingQuantity: 10 })],
        priceQuotes: [makeQuote(130)],
      }),
    );

    expect(positions[0].realisedGain).toBe(0);
    expect(positions[0].costBasis).toBe(1000);
    expect(positions[0].unrealisedGain).toBe(300);
    expect(positions[0].unrealisedPercent).toBeCloseTo(30, 10);
  });

  it('returns null cost figures for a holding with no lots', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 10 })],
        priceQuotes: [makeQuote(50)],
      }),
    );

    expect(positions[0].costBasisNative).toBeNull();
    expect(positions[0].costBasis).toBeNull();
    expect(positions[0].averageCost).toBeNull();
    expect(positions[0].unrealisedGain).toBeNull();
    expect(positions[0].unrealisedPercent).toBeNull();
    expect(positions[0].marketGain).toBeNull();
    expect(positions[0].currencyGain).toBeNull();
    expect(positions[0].realisedGain).toBe(0);
    expect(positions[0].valueNative).toBe(500);
    expect(positions[0].value).toBe(500);
  });

  it('averages the held cost over the holding quantity and reports the gain as a percentage', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 9 })],
        lots: [
          makeLot({ id: 'lot1', quantity: 10, costPerUnit: 100, remainingQuantity: 4 }),
          makeLot({
            id: 'lot2',
            quantity: 5,
            costPerUnit: 200,
            remainingQuantity: 5,
            acquiredAt: '2024-02-01',
          }),
        ],
        priceQuotes: [makeQuote(220)],
      }),
    );

    expect(positions[0].averageCost).toBeCloseTo(1400 / 9, 10);
    expect(positions[0].unrealisedPercent).toBeCloseTo((580 / 1400) * 100, 10);
  });

  it('returns a null percentage instead of dividing by a zero cost basis', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 10 })],
        lots: [makeLot({ quantity: 10, costPerUnit: 0, remainingQuantity: 10 })],
        priceQuotes: [makeQuote(50)],
      }),
    );

    expect(positions[0].costBasis).toBe(0);
    expect(positions[0].unrealisedPercent).toBeNull();
    expect(positions[0].unrealisedGain).toBe(500);
    expect(Number.isFinite(positions[0].unrealisedGain as number)).toBe(true);
  });

  it('returns a null average cost when the holding quantity is zero', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 0 })],
        lots: [makeLot({ quantity: 10, costPerUnit: 100, remainingQuantity: 0 })],
        priceQuotes: [makeQuote(50)],
      }),
    );

    expect(positions[0].averageCost).toBeNull();
    expect(positions[0].costBasisNative).toBe(0);
    expect(positions[0].unrealisedPercent).toBeNull();
  });
});

describe('computePositions overselling', () => {
  it('reports no unmatched units for a sell the lots fully cover', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 5 })],
        lots: [makeLot({ quantity: 10, costPerUnit: 100, remainingQuantity: 5 })],
        transactions: [makeSell({ quantity: 5, price: 150, amount: 750 })],
        priceQuotes: [makeQuote(150)],
      }),
    );

    expect(positions[0].realisedGain).toBe(250);
    expect(positions[0].unmatchedSellQuantity).toBe(0);
  });

  it('counts the units no lot can cover instead of pricing them at zero cost', () => {
    const lots = [
      makeLot({ id: 'lot1', quantity: 10, costPerUnit: 100, remainingQuantity: 0 }),
      makeLot({
        id: 'lot2',
        quantity: 5,
        costPerUnit: 200,
        remainingQuantity: 0,
        acquiredAt: '2024-02-01',
      }),
    ];
    const oversell = makeSell({ id: 'tx1', quantity: 20, price: 300, amount: 6000 });

    const positions = computePositions(
      makeInput({ holdings: [makeHolding({ quantity: 0 })], lots, transactions: [oversell] }),
    );

    expect(positions[0].realisedGain).toBe(2500);
    expect(positions[0].unmatchedSellQuantity).toBe(5);

    const afterLaterSell = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 0 })],
        lots,
        transactions: [
          oversell,
          makeSell({ id: 'tx2', quantity: 5, price: 400, amount: 2000, date: '2024-07-01' }),
        ],
      }),
    );

    expect(afterLaterSell[0].realisedGain).toBe(2500);
    expect(afterLaterSell[0].unmatchedSellQuantity).toBe(10);
  });

  it('reports no realised gain for a sell against a holding with no lots', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 0 })],
        transactions: [makeSell({ quantity: 5, price: 150, amount: 750 })],
        priceQuotes: [makeQuote(150)],
      }),
    );

    expect(positions[0].realisedGain).toBe(0);
    expect(positions[0].unmatchedSellQuantity).toBe(5);
    expect(Number.isNaN(positions[0].realisedGain)).toBe(false);
    expect(positions[0].costBasis).toBeNull();
    expect(positions[0].unrealisedGain).toBeNull();
  });
});

describe('computePositions currency conversion', () => {
  it('splits the unrealised gain of a foreign holding into market and currency parts', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 10, currency: 'EUR' })],
        lots: [
          makeLot({ quantity: 10, costPerUnit: 80, remainingQuantity: 10, acquiredFxRate: 1 }),
        ],
        priceQuotes: [makeQuote(100)],
        fxRates: [makeFx('EUR', 0.8)],
      }),
    );

    const position = positions[0];
    expect(position.valueNative).toBe(1000);
    expect(position.value).toBe(1250);
    expect(position.costBasisNative).toBe(800);
    expect(position.costBasis).toBe(800);
    expect(position.marketGain).toBe(250);
    expect(position.currencyGain).toBe(200);
    expect(position.unrealisedGain).toBe(450);
    expect((position.marketGain as number) + (position.currencyGain as number)).toBeCloseTo(
      position.unrealisedGain as number,
      8,
    );
    expect(position.unrealisedPercent).toBeCloseTo(56.25, 10);
  });

  it('values a lot with no acquisition rate at the current rate and reports no currency gain', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 10, currency: 'EUR' })],
        lots: [
          makeLot({ quantity: 10, costPerUnit: 80, remainingQuantity: 10, acquiredFxRate: null }),
        ],
        priceQuotes: [makeQuote(100)],
        fxRates: [makeFx('EUR', 0.8)],
      }),
    );

    const position = positions[0];
    expect(position.value).toBe(1250);
    expect(position.costBasis).toBe(1000);
    expect(position.currencyGain).toBe(0);
    expect(position.marketGain).toBe(250);
    expect(position.unrealisedGain).toBe(250);
    expect((position.marketGain as number) + (position.currencyGain as number)).toBeCloseTo(
      position.unrealisedGain as number,
      8,
    );
  });

  it('treats a missing exchange rate as parity rather than producing NaN', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ quantity: 5, currency: 'GBP' })],
        lots: [makeLot({ quantity: 10, costPerUnit: 80, remainingQuantity: 5 })],
        transactions: [makeSell({ quantity: 5, price: 150, amount: 750 })],
        priceQuotes: [makeQuote(100)],
      }),
    );

    const position = positions[0];
    expect(position.valueNative).toBe(500);
    expect(position.value).toBe(500);
    expect(position.costBasis).toBe(400);
    expect(position.unrealisedGain).toBe(100);
    expect(position.currencyGain).toBe(0);
    expect(position.realisedGain).toBe(350);
  });
});

describe('computePositions valuation-backed holdings', () => {
  it('values a holding without an instrument from its most recent valuation', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ instrumentId: null, quantity: 1 })],
        valuations: [
          makeValuation({ id: 'val1', date: '2024-01-01', value: 500 }),
          makeValuation({ id: 'val2', date: '2024-06-01', value: 900 }),
        ],
      }),
    );

    expect(positions[0].valueNative).toBe(900);
    expect(positions[0].value).toBe(900);
  });

  it('values a holding at zero when its instrument has no quote', () => {
    const positions = computePositions(
      makeInput({
        holdings: [makeHolding({ instrumentId: 'unquoted', quantity: 10 })],
        priceQuotes: [makeQuote(100, 'inst1')],
      }),
    );

    expect(positions[0].valueNative).toBe(0);
    expect(positions[0].value).toBe(0);
  });
});

describe('computePositions empty input', () => {
  it('returns no positions when there are no holdings', () => {
    expect(computePositions(makeInput())).toEqual([]);
  });
});
