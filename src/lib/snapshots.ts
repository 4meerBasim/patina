import type {
  AssetClass,
  CurrencyCode,
  FxRate,
  Holding,
  Liability,
  PriceQuote,
  Snapshot,
  Valuation,
} from '@/data/types';
import { ASSET_CLASSES } from '@/data/types';

export type SnapshotInput = {
  holdings: Holding[];
  valuations: Valuation[];
  liabilities: Liability[];
  priceQuotes: PriceQuote[];
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

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  fxRates: FxRate[],
): number {
  if (from === to) return amount;
  const inUsd = amount / usdRate(fxRates, from);
  return inUsd * usdRate(fxRates, to);
}

function latestValuationByHolding(valuations: Valuation[]): Map<string, Valuation> {
  const latest = new Map<string, Valuation>();
  for (const valuation of valuations) {
    const current = latest.get(valuation.holdingId);
    if (!current || Date.parse(valuation.date) > Date.parse(current.date)) {
      latest.set(valuation.holdingId, valuation);
    }
  }
  return latest;
}

export function holdingValue(
  holding: Holding,
  priceQuotes: PriceQuote[],
  latestValuations: Map<string, Valuation>,
): number {
  if (holding.instrumentId) {
    const quote = priceQuotes.find((item) => item.instrumentId === holding.instrumentId);
    if (quote) return roundCents(holding.quantity * quote.price);
  }
  // No quote does not mean worth nothing: fall back to the last dated mark for this
  // holding. A zero here becomes a zero net-worth day, which pins time-weighted return.
  return roundCents(latestValuations.get(holding.id)?.value ?? 0);
}

export function computeSnapshot(date: string, input: SnapshotInput): Snapshot {
  const { holdings, valuations, liabilities, priceQuotes, fxRates, baseCurrency } = input;
  const latest = latestValuationByHolding(valuations);

  const perClass = Object.fromEntries(ASSET_CLASSES.map((cls) => [cls, 0])) as Record<
    AssetClass,
    number
  >;
  const perAccount: Record<string, number> = {};

  for (const holding of holdings) {
    const native = holdingValue(holding, priceQuotes, latest);
    const value = convertCurrency(native, holding.currency, baseCurrency, fxRates);
    perClass[holding.assetClass] += value;
    perAccount[holding.accountId] = (perAccount[holding.accountId] ?? 0) + value;
  }

  for (const cls of ASSET_CLASSES) perClass[cls] = roundCents(perClass[cls]);
  for (const accountId of Object.keys(perAccount)) {
    perAccount[accountId] = roundCents(perAccount[accountId]);
  }

  const totalAssets = roundCents(
    ASSET_CLASSES.reduce((sum, cls) => sum + perClass[cls], 0),
  );
  const totalLiabilities = roundCents(
    liabilities.reduce(
      (sum, liability) =>
        sum + convertCurrency(liability.balance, liability.currency, baseCurrency, fxRates),
      0,
    ),
  );

  return {
    date,
    totalNetWorth: roundCents(totalAssets - totalLiabilities),
    totalAssets,
    totalLiabilities,
    perClass,
    perAccount,
  };
}
