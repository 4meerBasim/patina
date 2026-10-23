import type {
  CurrencyCode,
  FxRate,
  Holding,
  Lot,
  PriceQuote,
  Transaction,
  Valuation,
} from '@/data/types';
import { convertCurrency, holdingValue } from '@/lib/snapshots';

export type HoldingPosition = {
  holdingId: string;
  quantity: number;
  currency: CurrencyCode;
  valueNative: number;
  value: number;
  costBasisNative: number | null;
  costBasis: number | null;
  averageCost: number | null;
  unrealisedGain: number | null;
  unrealisedPercent: number | null;
  realisedGain: number;
  unmatchedSellQuantity: number;
  marketGain: number | null;
  currencyGain: number | null;
};

export type PositionsInput = {
  holdings: Holding[];
  lots: Lot[];
  transactions: Transaction[];
  priceQuotes: PriceQuote[];
  valuations: Valuation[];
  fxRates: FxRate[];
  baseCurrency: CurrencyCode;
};

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function usdRate(fxRates: FxRate[], code: CurrencyCode): number {
  if (code === 'USD') return 1;
  return fxRates.find((rate) => rate.base === 'USD' && rate.quote === code)?.rate ?? 1;
}

function latestValuationMap(valuations: Valuation[]): Map<string, Valuation> {
  const map = new Map<string, Valuation>();
  for (const valuation of valuations) {
    const current = map.get(valuation.holdingId);
    if (!current || Date.parse(valuation.date) > Date.parse(current.date)) {
      map.set(valuation.holdingId, valuation);
    }
  }
  return map;
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

// FIFO realised gain in the holding's native currency: replay every sell against
// the lots in acquisition order, matching proceeds to the cost of units consumed. Units
// no lot can cover have no known cost, so they are counted rather than priced at zero.
function realisedNative(
  lots: Lot[],
  sells: Transaction[],
): { realised: number; unmatched: number } {
  const queue = [...lots]
    .sort((a, b) => Date.parse(a.acquiredAt) - Date.parse(b.acquiredAt))
    .map((lot) => ({ remaining: lot.quantity, cost: lot.costPerUnit }));
  const ordered = [...sells].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  let realised = 0;
  let unmatched = 0;
  for (const sell of ordered) {
    let quantity = sell.quantity ?? 0;
    if (quantity <= 0) continue;
    const proceedsPerUnit = sell.price ?? sell.amount / quantity;
    for (const lot of queue) {
      if (quantity <= 0) break;
      if (lot.remaining <= 0) continue;
      const consumed = Math.min(lot.remaining, quantity);
      realised += consumed * (proceedsPerUnit - lot.cost);
      lot.remaining -= consumed;
      quantity -= consumed;
    }
    unmatched += quantity;
  }
  return { realised, unmatched };
}

export function computePositions(input: PositionsInput): HoldingPosition[] {
  const { holdings, lots, transactions, priceQuotes, valuations, fxRates, baseCurrency } = input;
  const latest = latestValuationMap(valuations);
  const lotsByHolding = groupBy(lots, (lot) => lot.holdingId);
  const sellsByHolding = groupBy(
    transactions.filter((tx) => tx.type === 'sell' && tx.holdingId),
    (tx) => tx.holdingId as string,
  );
  const baseRate = usdRate(fxRates, baseCurrency);
  const usdToBase = (usd: number) => usd * baseRate;

  return holdings.map((holding) => {
    const currency = holding.currency;
    const nowRate = usdRate(fxRates, currency);
    const valueNative = holdingValue(holding, priceQuotes, latest);
    const value = roundCents(convertCurrency(valueNative, currency, baseCurrency, fxRates));

    const holdingLots = lotsByHolding.get(holding.id) ?? [];
    const holdingSells = sellsByHolding.get(holding.id) ?? [];
    const sold = realisedNative(holdingLots, holdingSells);
    const unmatchedSellQuantity = sold.unmatched;
    const realisedGain = roundCents(usdToBase(sold.realised / nowRate));

    if (holdingLots.length === 0) {
      return {
        holdingId: holding.id,
        quantity: holding.quantity,
        currency,
        valueNative,
        value,
        costBasisNative: null,
        costBasis: null,
        averageCost: null,
        unrealisedGain: null,
        unrealisedPercent: null,
        realisedGain,
        unmatchedSellQuantity,
        marketGain: null,
        currencyGain: null,
      };
    }

    let costBasisNative = 0;
    let costUsdAcquired = 0;
    for (const lot of holdingLots) {
      const heldCost = lot.remainingQuantity * lot.costPerUnit;
      const acquiredRate = lot.acquiredFxRate ?? nowRate;
      costBasisNative += heldCost;
      costUsdAcquired += heldCost / acquiredRate;
    }

    const costUsdNow = costBasisNative / nowRate;
    const costBasis = roundCents(usdToBase(costUsdAcquired));
    const marketGain = roundCents(value - usdToBase(costUsdNow));
    const currencyGain = roundCents(usdToBase(costUsdNow - costUsdAcquired));
    const unrealisedGain = roundCents(value - costBasis);
    const unrealisedPercent = costBasis !== 0 ? (unrealisedGain / costBasis) * 100 : null;

    return {
      holdingId: holding.id,
      quantity: holding.quantity,
      currency,
      valueNative,
      value,
      costBasisNative: roundCents(costBasisNative),
      costBasis,
      averageCost: holding.quantity !== 0 ? costBasisNative / holding.quantity : null,
      unrealisedGain,
      unrealisedPercent,
      realisedGain,
      unmatchedSellQuantity,
      marketGain,
      currencyGain,
    };
  });
}
