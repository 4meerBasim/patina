import type { FxRate, Instrument, PriceQuote } from '../types';
import { createSeededFxProvider, type FxProvider } from './fx-provider';
import {
  createInstrumentSearchProvider,
  type InstrumentSearchProvider,
} from './instrument-search-provider';
import { createSimulatedPriceProvider, type PriceProvider } from './price-provider';

export type { PriceProvider } from './price-provider';
export type { FxProvider } from './fx-provider';
export type { InstrumentSearchProvider } from './instrument-search-provider';

export type Providers = {
  price: PriceProvider;
  fx: FxProvider;
  search: InstrumentSearchProvider;
};

export function createActiveProviders(input: {
  priceQuotes: PriceQuote[];
  fxRates: FxRate[];
  instruments: Instrument[];
}): Providers {
  const basePrices = Object.fromEntries(
    input.priceQuotes.map((quote) => [quote.instrumentId, quote.price]),
  );
  return {
    price: createSimulatedPriceProvider(basePrices),
    fx: createSeededFxProvider(input.fxRates),
    search: createInstrumentSearchProvider(input.instruments),
  };
}
