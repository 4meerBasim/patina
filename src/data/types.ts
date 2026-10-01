export type AssetClass = 'stocks' | 'crypto' | 'property' | 'cash' | 'savings';

export type AccountKind = 'brokerage' | 'exchange' | 'bank' | 'manual';

export type Ownership = 'me' | 'spouse' | 'joint' | 'entity';

export type InstrumentKind = 'stock' | 'etf' | 'crypto';

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal' | 'split';

export type LiabilityKind = 'mortgage' | 'loan' | 'credit' | 'other';

export type NoteKind = 'concentration' | 'drift' | 'fees' | 'milestone' | 'pace';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'IQD';

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  ownership: Ownership;
  currency: CurrencyCode;
  institution: string | null;
};

export type Instrument = {
  id: string;
  symbol: string;
  name: string;
  kind: InstrumentKind;
  currency: CurrencyCode;
};

export type Holding = {
  id: string;
  accountId: string;
  assetClass: AssetClass;
  instrumentId: string | null;
  name: string | null;
  quantity: number;
  currency: CurrencyCode;
};

export type HoldingWithInstrument = Holding & { instrument: Instrument | null };

export type Transaction = {
  id: string;
  holdingId: string | null;
  accountId: string;
  type: TransactionType;
  quantity: number | null;
  price: number | null;
  amount: number;
  currency: CurrencyCode;
  date: string;
  note: string | null;
};

export type Lot = {
  id: string;
  holdingId: string;
  quantity: number;
  costPerUnit: number;
  acquiredAt: string;
  remainingQuantity: number;
};

export type Valuation = {
  id: string;
  holdingId: string;
  date: string;
  value: number;
  currency: CurrencyCode;
};

export type Liability = {
  id: string;
  name: string;
  kind: LiabilityKind;
  balance: number;
  currency: CurrencyCode;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  savedAmount: number;
  monthlyContribution: number;
  targetDate: string | null;
  linkedHoldingIds: string[];
  linkedAccountIds: string[];
};

export type Note = {
  id: string;
  kind: NoteKind;
  body: string;
  detail: string | null;
  createdAt: string;
  read: boolean;
};

export type FxRate = {
  base: CurrencyCode;
  quote: CurrencyCode;
  rate: number;
  asOf: string;
};

export type Snapshot = {
  date: string;
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  perClass: Record<AssetClass, number>;
  perAccount: Record<string, number>;
};

export type PriceQuote = {
  instrumentId: string;
  price: number;
  asOf: string;
};

export const ASSET_CLASSES: AssetClass[] = ['stocks', 'crypto', 'property', 'cash', 'savings'];

export const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'IQD'];
