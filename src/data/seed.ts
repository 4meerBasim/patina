import {
  ASSET_CLASSES,
  type Account,
  type AssetClass,
  type CurrencyCode,
  type FxRate,
  type Goal,
  type Holding,
  type Instrument,
  type Lot,
  type Note,
  type PriceQuote,
  type Snapshot,
  type Transaction,
  type Valuation,
} from './types';
import type { Database } from './db/client';
import {
  countHoldings,
  insertAccount,
  insertGoal,
  insertHolding,
  insertInstrument,
  insertLot,
  insertNote,
  insertTransaction,
  insertValuation,
  setKv,
  upsertFxRate,
  upsertPriceQuote,
  upsertSnapshot,
} from './db/repositories';
import { defaultAllocationTargets } from '@/lib/rebalance';

const TODAY = '2026-10-01';
const SNAPSHOT_DAYS = 90;

const accounts: Account[] = [
  { id: 'acc-ibkr-ind', name: 'IBKR Individual', kind: 'brokerage', ownership: 'me', currency: 'USD', institution: 'Interactive Brokers' },
  { id: 'acc-ibkr-joint', name: 'IBKR Joint', kind: 'brokerage', ownership: 'joint', currency: 'USD', institution: 'Interactive Brokers' },
  { id: 'acc-coinbase', name: 'Coinbase', kind: 'exchange', ownership: 'me', currency: 'USD', institution: 'Coinbase' },
  { id: 'acc-chase', name: 'Chase Checking', kind: 'bank', ownership: 'me', currency: 'USD', institution: 'Chase' },
  { id: 'acc-wells', name: 'Wells Checking', kind: 'bank', ownership: 'joint', currency: 'USD', institution: 'Wells Fargo' },
  { id: 'acc-reserve', name: 'Everyday Reserve', kind: 'bank', ownership: 'spouse', currency: 'USD', institution: null },
  { id: 'acc-marcus', name: 'Marcus Savings', kind: 'bank', ownership: 'me', currency: 'USD', institution: 'Marcus' },
  { id: 'acc-ally', name: 'Ally Savings', kind: 'bank', ownership: 'spouse', currency: 'USD', institution: 'Ally' },
  { id: 'acc-realestate', name: 'Real Estate', kind: 'manual', ownership: 'joint', currency: 'USD', institution: null },
  { id: 'acc-degiro', name: 'DEGIRO', kind: 'brokerage', ownership: 'me', currency: 'EUR', institution: 'DEGIRO' },
];

const instruments: Instrument[] = [
  { id: 'inst-aapl', symbol: 'AAPL', name: 'Apple', kind: 'stock', currency: 'USD' },
  { id: 'inst-msft', symbol: 'MSFT', name: 'Microsoft', kind: 'stock', currency: 'USD' },
  { id: 'inst-googl', symbol: 'GOOGL', name: 'Alphabet', kind: 'stock', currency: 'USD' },
  { id: 'inst-amzn', symbol: 'AMZN', name: 'Amazon', kind: 'stock', currency: 'USD' },
  { id: 'inst-nvda', symbol: 'NVDA', name: 'Nvidia', kind: 'stock', currency: 'USD' },
  { id: 'inst-tsla', symbol: 'TSLA', name: 'Tesla', kind: 'stock', currency: 'USD' },
  { id: 'inst-meta', symbol: 'META', name: 'Meta Platforms', kind: 'stock', currency: 'USD' },
  { id: 'inst-jpm', symbol: 'JPM', name: 'JPMorgan Chase', kind: 'stock', currency: 'USD' },
  { id: 'inst-v', symbol: 'V', name: 'Visa', kind: 'stock', currency: 'USD' },
  { id: 'inst-jnj', symbol: 'JNJ', name: 'Johnson & Johnson', kind: 'stock', currency: 'USD' },
  { id: 'inst-wmt', symbol: 'WMT', name: 'Walmart', kind: 'stock', currency: 'USD' },
  { id: 'inst-cost', symbol: 'COST', name: 'Costco', kind: 'stock', currency: 'USD' },
  { id: 'inst-voo', symbol: 'VOO', name: 'Vanguard S&P 500', kind: 'etf', currency: 'USD' },
  { id: 'inst-vti', symbol: 'VTI', name: 'Vanguard Total', kind: 'etf', currency: 'USD' },
  { id: 'inst-vea', symbol: 'VEA', name: 'Vanguard Developed Markets', kind: 'etf', currency: 'USD' },
  { id: 'inst-bnd', symbol: 'BND', name: 'Vanguard Total Bond', kind: 'etf', currency: 'USD' },
  { id: 'inst-btc', symbol: 'BTC', name: 'Bitcoin', kind: 'crypto', currency: 'USD' },
  { id: 'inst-eth', symbol: 'ETH', name: 'Ether', kind: 'crypto', currency: 'USD' },
  { id: 'inst-sol', symbol: 'SOL', name: 'Solana', kind: 'crypto', currency: 'USD' },
  { id: 'inst-ada', symbol: 'ADA', name: 'Cardano', kind: 'crypto', currency: 'USD' },
  { id: 'inst-asml', symbol: 'ASML', name: 'ASML Holding', kind: 'stock', currency: 'EUR' },
];

type MarketSpec = {
  id: string;
  account: string;
  instrument: string;
  assetClass: AssetClass;
  quantity: number;
  value: number;
  cost: number;
  acquiredAt: string;
  expenseRatio?: number;
};

const marketHoldings: MarketSpec[] = [
  { id: 'hld-aapl', account: 'acc-ibkr-ind', instrument: 'inst-aapl', assetClass: 'stocks', quantity: 600, value: 148920, cost: 98640, acquiredAt: '2021-11-15' },
  { id: 'hld-msft', account: 'acc-ibkr-ind', instrument: 'inst-msft', assetClass: 'stocks', quantity: 240, value: 96340, cost: 84000, acquiredAt: '2022-03-10' },
  { id: 'hld-googl', account: 'acc-ibkr-ind', instrument: 'inst-googl', assetClass: 'stocks', quantity: 220, value: 45200, cost: 33000, acquiredAt: '2023-01-20' },
  { id: 'hld-nvda', account: 'acc-ibkr-ind', instrument: 'inst-nvda', assetClass: 'stocks', quantity: 320, value: 41300, cost: 19200, acquiredAt: '2023-05-11' },
  { id: 'hld-voo', account: 'acc-ibkr-ind', instrument: 'inst-voo', assetClass: 'stocks', quantity: 62, value: 34100, cost: 25420, acquiredAt: '2022-08-02', expenseRatio: 0.0003 },
  { id: 'hld-jnj', account: 'acc-ibkr-ind', instrument: 'inst-jnj', assetClass: 'stocks', quantity: 100, value: 16420, cost: 15000, acquiredAt: '2021-06-15' },
  { id: 'hld-cost', account: 'acc-ibkr-ind', instrument: 'inst-cost', assetClass: 'stocks', quantity: 13, value: 12900, cost: 9100, acquiredAt: '2023-09-01' },
  { id: 'hld-vti', account: 'acc-ibkr-joint', instrument: 'inst-vti', assetClass: 'stocks', quantity: 312, value: 98410, cost: 74880, acquiredAt: '2022-02-14', expenseRatio: 0.0072 },
  { id: 'hld-amzn', account: 'acc-ibkr-joint', instrument: 'inst-amzn', assetClass: 'stocks', quantity: 190, value: 38900, cost: 30400, acquiredAt: '2023-03-22' },
  { id: 'hld-tsla', account: 'acc-ibkr-joint', instrument: 'inst-tsla', assetClass: 'stocks', quantity: 55, value: 18700, cost: 15400, acquiredAt: '2024-01-09' },
  { id: 'hld-v', account: 'acc-ibkr-joint', instrument: 'inst-v', assetClass: 'stocks', quantity: 46, value: 14878, cost: 11500, acquiredAt: '2022-11-30' },
  { id: 'hld-btc', account: 'acc-coinbase', instrument: 'inst-btc', assetClass: 'crypto', quantity: 0.82, value: 86100, cost: 39360, acquiredAt: '2022-05-01' },
  { id: 'hld-eth', account: 'acc-coinbase', instrument: 'inst-eth', assetClass: 'crypto', quantity: 8.6, value: 29544, cost: 21560, acquiredAt: '2022-06-01' },
];

type ForeignSpec = {
  id: string;
  account: string;
  instrument: string;
  assetClass: AssetClass;
  currency: CurrencyCode;
  quantity: number;
  priceNative: number;
  // Base-currency (USD) value this holding contributes today, kept exact so the
  // net-worth total and class weights stay fixed after the redenomination.
  usdValue: number;
  lot: { quantity: number; costPerUnit: number; acquiredAt: string; acquiredFxRate: number };
};

const foreignHoldings: ForeignSpec[] = [
  {
    id: 'hld-asml',
    account: 'acc-degiro',
    instrument: 'inst-asml',
    assetClass: 'stocks',
    currency: 'EUR',
    quantity: 40,
    priceNative: 575,
    usdValue: 25000,
    lot: { quantity: 40, costPerUnit: 450, acquiredAt: '2024-02-20', acquiredFxRate: 0.95 },
  },
];

type ManualSpec = {
  id: string;
  account: string;
  assetClass: AssetClass;
  name: string;
  valuations: { date: string; value: number }[];
};

const manualHoldings: ManualSpec[] = [
  { id: 'hld-lisbon', account: 'acc-realestate', assetClass: 'property', name: 'Lisbon flat', valuations: [{ date: '2026-06-01', value: 280000 }, { date: '2026-09-01', value: 300000 }] },
  { id: 'hld-porto', account: 'acc-realestate', assetClass: 'property', name: 'Porto studio', valuations: [{ date: '2026-06-01', value: 98328 }] },
  { id: 'hld-chase', account: 'acc-chase', assetClass: 'cash', name: 'Chase Checking', valuations: [{ date: TODAY, value: 28400 }] },
  { id: 'hld-wells', account: 'acc-wells', assetClass: 'cash', name: 'Wells Checking', valuations: [{ date: TODAY, value: 22600 }] },
  { id: 'hld-reserve', account: 'acc-reserve', assetClass: 'cash', name: 'Everyday Reserve', valuations: [{ date: TODAY, value: 26096 }] },
  { id: 'hld-marcus', account: 'acc-marcus', assetClass: 'savings', name: 'Marcus Savings', valuations: [{ date: TODAY, value: 60000 }] },
  { id: 'hld-ally', account: 'acc-ally', assetClass: 'savings', name: 'Ally Savings', valuations: [{ date: TODAY, value: 42794.42 }] },
];

const extraPrices: Record<string, number> = {
  'inst-meta': 598.4,
  'inst-jpm': 243.1,
  'inst-wmt': 102.75,
  'inst-vea': 52.3,
  'inst-bnd': 72.8,
  'inst-sol': 168.4,
  'inst-ada': 0.62,
};

const transactions: Transaction[] = [
  { id: 'tx-aapl-1', holdingId: 'hld-aapl', accountId: 'acc-ibkr-ind', type: 'buy', quantity: 550, price: 86230 / 550, amount: -86230, currency: 'USD', date: '2021-11-15', note: null },
  { id: 'tx-aapl-2', holdingId: 'hld-aapl', accountId: 'acc-ibkr-ind', type: 'buy', quantity: 50, price: 248.2, amount: -12410, currency: 'USD', date: '2026-09-17', note: null },
  { id: 'tx-msft-buy', holdingId: 'hld-msft', accountId: 'acc-ibkr-ind', type: 'buy', quantity: 240, price: 350, amount: -84000, currency: 'USD', date: '2022-03-10', note: null },
  { id: 'tx-msft-div', holdingId: 'hld-msft', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 184.2, currency: 'USD', date: '2026-09-12', note: null },
  { id: 'tx-marcus-sep', holdingId: 'hld-marcus', accountId: 'acc-marcus', type: 'deposit', quantity: null, price: null, amount: 2500, currency: 'USD', date: '2026-09-01', note: 'Monthly' },
  { id: 'tx-marcus-aug', holdingId: 'hld-marcus', accountId: 'acc-marcus', type: 'deposit', quantity: null, price: null, amount: 2500, currency: 'USD', date: '2026-08-01', note: 'Monthly' },
  { id: 'tx-marcus-jul', holdingId: 'hld-marcus', accountId: 'acc-marcus', type: 'deposit', quantity: null, price: null, amount: 2500, currency: 'USD', date: '2026-07-01', note: 'Monthly' },
  { id: 'tx-fee-sep', holdingId: null, accountId: 'acc-ibkr-ind', type: 'withdrawal', quantity: null, price: null, amount: -392.8, currency: 'USD', date: '2026-09-01', note: 'Fidelity quarterly fee' },
  { id: 'tx-eth-sell', holdingId: 'hld-eth', accountId: 'acc-coinbase', type: 'sell', quantity: 1.2, price: 3410, amount: 4092, currency: 'USD', date: '2026-08-28', note: null },
  { id: 'tx-aapl-div-1', holdingId: 'hld-aapl', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 150, currency: 'USD', date: '2025-11-13', note: null },
  { id: 'tx-aapl-div-2', holdingId: 'hld-aapl', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 153, currency: 'USD', date: '2026-02-12', note: null },
  { id: 'tx-aapl-div-3', holdingId: 'hld-aapl', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 156, currency: 'USD', date: '2026-05-13', note: null },
  { id: 'tx-aapl-div-4', holdingId: 'hld-aapl', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 159, currency: 'USD', date: '2026-08-12', note: null },
  { id: 'tx-msft-div-1', holdingId: 'hld-msft', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 180, currency: 'USD', date: '2025-12-11', note: null },
  { id: 'tx-msft-div-2', holdingId: 'hld-msft', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 182, currency: 'USD', date: '2026-03-11', note: null },
  { id: 'tx-msft-div-3', holdingId: 'hld-msft', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 184, currency: 'USD', date: '2026-06-11', note: null },
  { id: 'tx-jnj-div-1', holdingId: 'hld-jnj', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 119, currency: 'USD', date: '2025-12-05', note: null },
  { id: 'tx-jnj-div-2', holdingId: 'hld-jnj', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 121, currency: 'USD', date: '2026-03-05', note: null },
  { id: 'tx-jnj-div-3', holdingId: 'hld-jnj', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 121, currency: 'USD', date: '2026-06-05', note: null },
  { id: 'tx-jnj-div-4', holdingId: 'hld-jnj', accountId: 'acc-ibkr-ind', type: 'dividend', quantity: null, price: null, amount: 123, currency: 'USD', date: '2026-09-05', note: null },
];

function buildLots(): Lot[] {
  const result: Lot[] = [];
  for (const spec of marketHoldings) {
    if (spec.id === 'hld-aapl') {
      result.push({ id: 'lot-aapl-1', holdingId: 'hld-aapl', quantity: 550, costPerUnit: 86230 / 550, acquiredAt: '2021-11-15', remainingQuantity: 550, acquiredFxRate: 1 });
      result.push({ id: 'lot-aapl-2', holdingId: 'hld-aapl', quantity: 50, costPerUnit: 248.2, acquiredAt: '2026-09-17', remainingQuantity: 50, acquiredFxRate: 1 });
      continue;
    }
    if (spec.id === 'hld-eth') {
      result.push({ id: 'lot-eth-1', holdingId: 'hld-eth', quantity: 9.8, costPerUnit: 2200, acquiredAt: spec.acquiredAt, remainingQuantity: 8.6, acquiredFxRate: 1 });
      continue;
    }
    result.push({
      id: `lot-${spec.id}`,
      holdingId: spec.id,
      quantity: spec.quantity,
      costPerUnit: spec.cost / spec.quantity,
      acquiredAt: spec.acquiredAt,
      remainingQuantity: spec.quantity,
      acquiredFxRate: 1,
    });
  }
  for (const spec of foreignHoldings) {
    result.push({
      id: `lot-${spec.id}`,
      holdingId: spec.id,
      quantity: spec.lot.quantity,
      costPerUnit: spec.lot.costPerUnit,
      acquiredAt: spec.lot.acquiredAt,
      remainingQuantity: spec.lot.quantity,
      acquiredFxRate: spec.lot.acquiredFxRate,
    });
  }
  return result;
}

const goals: Goal[] = [
  { id: 'goal-lisbon', name: 'Second home, Lisbon', target: 600000, savedAmount: 348000, monthlyContribution: 15750, targetDate: '2028-06-01', linkedHoldingIds: ['hld-marcus', 'hld-ally', 'hld-vti'], linkedAccountIds: [] },
  { id: 'goal-education', name: "Children's education", target: 200000, savedAmount: 62000, monthlyContribution: 1250, targetDate: '2034-09-01', linkedHoldingIds: [], linkedAccountIds: [] },
  { id: 'goal-expenses', name: 'Twelve months of expenses', target: 90000, savedAmount: 77096, monthlyContribution: 0, targetDate: null, linkedHoldingIds: ['hld-chase', 'hld-wells', 'hld-reserve'], linkedAccountIds: [] },
];

const notes: Note[] = [
  { id: 'note-concentration', kind: 'concentration', body: "Crypto moved 62% of today's change while holding 9% of the total.", detail: 'Bitcoin −2.4% · Ether −1.9%', createdAt: '2026-10-01', read: false },
  { id: 'note-milestone', kind: 'milestone', body: 'Your Lisbon goal passed the halfway mark.', detail: '$348,000 of $600,000 · four months early', createdAt: '2026-09-30', read: false },
  { id: 'note-fees', kind: 'fees', body: 'One fund costs 0.72% a year; a comparable index fund costs 0.03%.', detail: 'About $612 a year on $84,900', createdAt: '2026-09-12', read: true },
  { id: 'note-drift', kind: 'drift', body: 'Stocks are six points above target; property four below.', detail: null, createdAt: '2026-09-03', read: true },
];

const fxRates: FxRate[] = [
  { base: 'USD', quote: 'USD', rate: 1, asOf: TODAY },
  { base: 'USD', quote: 'EUR', rate: 0.92, asOf: TODAY },
  { base: 'USD', quote: 'GBP', rate: 0.79, asOf: TODAY },
  { base: 'USD', quote: 'SAR', rate: 3.75, asOf: TODAY },
  { base: 'USD', quote: 'AED', rate: 3.67, asOf: TODAY },
  { base: 'USD', quote: 'IQD', rate: 1310, asOf: TODAY },
];

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function classTotalsToday(): Record<AssetClass, number> {
  const totals = Object.fromEntries(ASSET_CLASSES.map((cls) => [cls, 0])) as Record<
    AssetClass,
    number
  >;
  for (const spec of marketHoldings) totals[spec.assetClass] += spec.value;
  for (const spec of foreignHoldings) totals[spec.assetClass] += spec.usdValue;
  for (const spec of manualHoldings) {
    totals[spec.assetClass] += spec.valuations[spec.valuations.length - 1].value;
  }
  return totals;
}

function accountTotalsToday(): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const spec of marketHoldings) totals[spec.account] = (totals[spec.account] ?? 0) + spec.value;
  for (const spec of foreignHoldings) {
    totals[spec.account] = (totals[spec.account] ?? 0) + spec.usdValue;
  }
  for (const spec of manualHoldings) {
    totals[spec.account] =
      (totals[spec.account] ?? 0) + spec.valuations[spec.valuations.length - 1].value;
  }
  return totals;
}

function buildSnapshotSeries(): Snapshot[] {
  const anchor = new Date().toISOString().slice(0, 10);
  const classToday = classTotalsToday();
  const accountToday = accountTotalsToday();
  const netToday = ASSET_CLASSES.reduce((sum, cls) => sum + classToday[cls], 0);
  const start = 1180000;

  const raw: number[] = [];
  for (let i = 0; i < SNAPSHOT_DAYS; i += 1) {
    const t = i / (SNAPSHOT_DAYS - 1);
    const ease = t * t * (3 - 2 * t);
    raw.push(start + (netToday - start) * ease + 3000 * Math.sin(i * 0.7) * (1 - t));
  }

  const thirtyAgo = SNAPSHOT_DAYS - 31;
  const last = SNAPSHOT_DAYS - 1;
  const slope = (netToday - 1272520.42) / (raw[last] - raw[thirtyAgo]);
  const offset = 1272520.42 - slope * raw[thirtyAgo];
  const values = raw.map((value) => roundCents(slope * value + offset));
  values[SNAPSHOT_DAYS - 2] = 1288032.42;

  return values.map((netWorth, i) => {
    const factor = netWorth / netToday;
    const perClass = Object.fromEntries(
      ASSET_CLASSES.map((cls) => [cls, roundCents(classToday[cls] * factor)]),
    ) as Record<AssetClass, number>;
    const perAccount = Object.fromEntries(
      Object.entries(accountToday).map(([id, value]) => [id, roundCents(value * factor)]),
    );
    return {
      date: addDays(anchor, i - (SNAPSHOT_DAYS - 1)),
      totalNetWorth: netWorth,
      totalAssets: netWorth,
      totalLiabilities: 0,
      perClass,
      perAccount,
    };
  });
}

export async function seedIfEmpty(db: Database): Promise<boolean> {
  if ((await countHoldings(db)) > 0) return false;

  await db.withTransactionAsync(async () => {
    for (const account of accounts) await insertAccount(db, account);
    for (const instrument of instruments) await insertInstrument(db, instrument);

    for (const spec of marketHoldings) {
      const holding: Holding = {
        id: spec.id,
        accountId: spec.account,
        assetClass: spec.assetClass,
        instrumentId: spec.instrument,
        name: null,
        quantity: spec.quantity,
        currency: 'USD',
        expenseRatio: spec.expenseRatio ?? null,
      };
      await insertHolding(db, holding);
      const quote: PriceQuote = {
        instrumentId: spec.instrument,
        price: spec.value / spec.quantity,
        asOf: TODAY,
      };
      await upsertPriceQuote(db, quote);
    }

    for (const spec of foreignHoldings) {
      await insertHolding(db, {
        id: spec.id,
        accountId: spec.account,
        assetClass: spec.assetClass,
        instrumentId: spec.instrument,
        name: null,
        quantity: spec.quantity,
        currency: spec.currency,
        expenseRatio: null,
      });
      await upsertPriceQuote(db, {
        instrumentId: spec.instrument,
        price: spec.priceNative,
        asOf: TODAY,
      });
    }

    for (const [instrumentId, price] of Object.entries(extraPrices)) {
      await upsertPriceQuote(db, { instrumentId, price, asOf: TODAY });
    }

    for (const spec of manualHoldings) {
      await insertHolding(db, {
        id: spec.id,
        accountId: spec.account,
        assetClass: spec.assetClass,
        instrumentId: null,
        name: spec.name,
        quantity: 1,
        currency: 'USD',
      });
      for (const mark of spec.valuations) {
        const valuation: Valuation = {
          id: `val-${spec.id}-${mark.date}`,
          holdingId: spec.id,
          date: mark.date,
          value: mark.value,
          currency: 'USD',
        };
        await insertValuation(db, valuation);
      }
    }

    for (const lot of buildLots()) await insertLot(db, lot);
    for (const transaction of transactions) await insertTransaction(db, transaction);
    for (const goal of goals) await insertGoal(db, goal);
    for (const note of notes) await insertNote(db, note);
    for (const rate of fxRates) await upsertFxRate(db, rate);
    for (const snapshot of buildSnapshotSeries()) await upsertSnapshot(db, snapshot);
    await setKv(db, 'allocation_targets', JSON.stringify(defaultAllocationTargets));
  });

  return true;
}
