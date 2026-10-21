import type { Instrument } from '../types';

export type InstrumentSearchProvider = {
  search(query: string): Promise<Instrument[]>;
};

export function createInstrumentSearchProvider(
  instruments: Instrument[],
): InstrumentSearchProvider {
  return {
    search: async (query) => {
      const term = query.trim().toLowerCase();
      if (term === '') return instruments;
      return instruments.filter(
        (instrument) =>
          instrument.symbol.toLowerCase().includes(term) ||
          instrument.name.toLowerCase().includes(term),
      );
    },
  };
}
