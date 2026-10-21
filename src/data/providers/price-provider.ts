import type { PriceQuote } from '../types';

export type PriceProvider = {
  getQuote(instrumentId: string): Promise<PriceQuote>;
  getQuotes(instrumentIds: string[]): Promise<PriceQuote[]>;
};

function hashUnit(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const MAX_DAILY_DRIFT = 0.03;

export function createSimulatedPriceProvider(basePrices: Record<string, number>): PriceProvider {
  const quoteFor = (instrumentId: string): PriceQuote => {
    const base = basePrices[instrumentId] ?? 0;
    const today = dayKey(new Date());
    const drift = (hashUnit(`${instrumentId}|${today}`) * 2 - 1) * MAX_DAILY_DRIFT;
    return {
      instrumentId,
      price: Math.round(base * (1 + drift) * 100) / 100,
      asOf: today,
    };
  };

  return {
    getQuote: async (instrumentId) => quoteFor(instrumentId),
    getQuotes: async (instrumentIds) => instrumentIds.map(quoteFor),
  };
}
