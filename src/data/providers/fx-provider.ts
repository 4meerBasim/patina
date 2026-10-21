import type { CurrencyCode, FxRate } from '../types';

export type FxProvider = {
  getRates(base: CurrencyCode): Promise<FxRate[]>;
};

export function createSeededFxProvider(rates: FxRate[]): FxProvider {
  return {
    getRates: async (base) => rates.filter((rate) => rate.base === base),
  };
}
