import { create } from 'zustand';

import { getDatabase, type Database } from '@/data/db/client';
import * as repo from '@/data/db/repositories';
import { createActiveProviders } from '@/data/providers';
import { seedIfEmpty } from '@/data/seed';
import { defaultSettings, loadSettings, saveSettings, type Settings } from '@/data/settings';
import type {
  Account,
  AllocationTargets,
  CurrencyCode,
  FxRate,
  Goal,
  Holding,
  Instrument,
  Liability,
  Lot,
  Note,
  PriceQuote,
  Snapshot,
  Transaction,
  Valuation,
} from '@/data/types';
import { BACKUP_VERSION, readBackup, writeAndShareBackup, type BackupData } from '@/lib/backup';
import { computeFeeAnalysis } from '@/lib/fees';
import { computeInsights, defaultInsightThresholds, type InsightThresholds } from '@/lib/insights';
import { computePositions } from '@/lib/positions';
import { defaultAllocationTargets } from '@/lib/rebalance';
import { computeSnapshot, convertCurrency } from '@/lib/snapshots';

import { selectAllocation, selectGoalProgress, selectNetWorth } from './selectors';

const ALLOCATION_TARGETS_KEY = 'allocation_targets';
const INSIGHT_THRESHOLDS_KEY = 'insight_thresholds';

let idCounter = 0;
function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Entities = {
  accounts: Account[];
  instruments: Instrument[];
  holdings: Holding[];
  transactions: Transaction[];
  lots: Lot[];
  valuations: Valuation[];
  liabilities: Liability[];
  goals: Goal[];
  notes: Note[];
  fxRates: FxRate[];
  priceQuotes: PriceQuote[];
  snapshots: Snapshot[];
  livePrices: Record<string, number>;
  allocationTargets: AllocationTargets;
  insightThresholds: InsightThresholds;
};

export type DataStore = Entities & {
  ready: boolean;
  error: string | null;
  settings: Settings;
  hydrate: () => Promise<void>;
  addHolding: (input: Omit<Holding, 'id'>) => Promise<string>;
  updateHolding: (holding: Holding) => Promise<void>;
  deleteHolding: (id: string) => Promise<void>;
  addTransaction: (input: Omit<Transaction, 'id'>) => Promise<string>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addValuation: (input: Omit<Valuation, 'id'>) => Promise<string>;
  updateValuation: (valuation: Valuation) => Promise<void>;
  deleteValuation: (id: string) => Promise<void>;
  addLiability: (input: Omit<Liability, 'id'>) => Promise<string>;
  updateLiability: (liability: Liability) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  addGoal: (input: Omit<Goal, 'id'>) => Promise<string>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addNote: (input: Omit<Note, 'id'>) => Promise<string>;
  markNoteRead: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  regenerateInsights: () => Promise<void>;
  setAllocationTargets: (targets: AllocationTargets) => Promise<void>;
  setExpenseRatio: (holdingId: string, expenseRatio: number | null) => Promise<void>;
  exportAllData: () => Promise<void>;
  importBackup: (uri: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
};

const emptyEntities: Entities = {
  accounts: [],
  instruments: [],
  holdings: [],
  transactions: [],
  lots: [],
  valuations: [],
  liabilities: [],
  goals: [],
  notes: [],
  fxRates: [],
  priceQuotes: [],
  snapshots: [],
  livePrices: {},
  allocationTargets: defaultAllocationTargets,
  insightThresholds: defaultInsightThresholds,
};

function parseJsonKv<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

async function loadEntities(db: Database): Promise<Entities & { settings: Settings }> {
  const [
    settings,
    accounts,
    instruments,
    holdings,
    transactions,
    lots,
    valuations,
    liabilities,
    goals,
    notes,
    fxRates,
    priceQuotes,
    snapshots,
    targetsRaw,
    thresholdsRaw,
  ] = await Promise.all([
    loadSettings(db),
    repo.getAllAccounts(db),
    repo.getAllInstruments(db),
    repo.getAllHoldings(db),
    repo.getAllTransactions(db),
    repo.getAllLots(db),
    repo.getAllValuations(db),
    repo.getAllLiabilities(db),
    repo.getAllGoals(db),
    repo.getAllNotes(db),
    repo.getAllFxRates(db),
    repo.getAllPriceQuotes(db),
    repo.getAllSnapshots(db),
    repo.getKv(db, ALLOCATION_TARGETS_KEY),
    repo.getKv(db, INSIGHT_THRESHOLDS_KEY),
  ]);
  return {
    settings,
    accounts,
    instruments,
    holdings,
    transactions,
    lots,
    valuations,
    liabilities,
    goals,
    notes,
    fxRates,
    priceQuotes,
    snapshots,
    livePrices: {},
    allocationTargets: parseJsonKv(targetsRaw, defaultAllocationTargets),
    insightThresholds: parseJsonKv(thresholdsRaw, defaultInsightThresholds),
  };
}

function mergeSnapshot(snapshots: Snapshot[], next: Snapshot): Snapshot[] {
  const rest = snapshots.filter((snapshot) => snapshot.date !== next.date);
  return [...rest, next].sort((a, b) => a.date.localeCompare(b.date));
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function snapshotValuesEqual(a: Snapshot, b: Snapshot): boolean {
  const near = (x: number, y: number) => Math.abs(x - y) < 0.005;
  if (!near(a.totalNetWorth, b.totalNetWorth)) return false;
  if (!near(a.totalAssets, b.totalAssets)) return false;
  if (!near(a.totalLiabilities, b.totalLiabilities)) return false;
  for (const [key, value] of Object.entries(a.perClass)) {
    if (!near(value, (b.perClass as Record<string, number>)[key] ?? 0)) return false;
  }
  for (const [key, value] of Object.entries(a.perAccount)) {
    if (!near(value, b.perAccount[key] ?? 0)) return false;
  }
  return true;
}

function latestSnapshot(snapshots: Snapshot[]): Snapshot | undefined {
  return snapshots.reduce<Snapshot | undefined>(
    (max, snapshot) => (!max || snapshot.date > max.date ? snapshot : max),
    undefined,
  );
}

function reconcileSnapshot(
  existing: Snapshot[],
  next: Snapshot,
): { snapshots: Snapshot[]; persist: boolean } {
  const latest = latestSnapshot(existing);
  if (latest && latest.date < next.date && snapshotValuesEqual(latest, next)) {
    return { snapshots: existing, persist: false };
  }
  return { snapshots: mergeSnapshot(existing, next), persist: true };
}

function rebaseSnapshot(
  snapshot: Snapshot,
  from: CurrencyCode,
  to: CurrencyCode,
  fxRates: FxRate[],
): Snapshot {
  const convert = (value: number) => roundCents(convertCurrency(value, from, to, fxRates));
  return {
    ...snapshot,
    totalNetWorth: convert(snapshot.totalNetWorth),
    totalAssets: convert(snapshot.totalAssets),
    totalLiabilities: convert(snapshot.totalLiabilities),
    perClass: Object.fromEntries(
      Object.entries(snapshot.perClass).map(([key, value]) => [key, convert(value)]),
    ) as Snapshot['perClass'],
    perAccount: Object.fromEntries(
      Object.entries(snapshot.perAccount).map(([key, value]) => [key, convert(value)]),
    ),
  };
}

function usdRateOf(fxRates: FxRate[], code: CurrencyCode): number {
  if (code === 'USD') return 1;
  return fxRates.find((rate) => rate.base === 'USD' && rate.quote === code)?.rate ?? 1;
}

async function applyTransactionToLots(
  db: Database,
  transaction: Transaction,
  fxRates: FxRate[],
): Promise<void> {
  if (!transaction.holdingId || transaction.quantity == null) return;
  if (transaction.type === 'buy') {
    if (transaction.price == null) return;
    await repo.insertLot(db, {
      id: createId('lot'),
      holdingId: transaction.holdingId,
      quantity: transaction.quantity,
      costPerUnit: transaction.price,
      acquiredAt: transaction.date,
      remainingQuantity: transaction.quantity,
      acquiredFxRate: usdRateOf(fxRates, transaction.currency),
    });
    return;
  }
  if (transaction.type === 'sell') {
    let remaining = transaction.quantity;
    for (const lot of await repo.getLotsByHolding(db, transaction.holdingId)) {
      if (remaining <= 0) break;
      if (lot.remainingQuantity <= 0) continue;
      const consumed = Math.min(lot.remainingQuantity, remaining);
      await repo.updateLotRemaining(db, lot.id, lot.remainingQuantity - consumed);
      remaining -= consumed;
    }
  }
}

export const useDataStore = create<DataStore>((set, get) => {
  async function writeSnapshot(db: Database): Promise<Snapshot[]> {
    const state = get();
    const snapshot = computeSnapshot(todayIso(), {
      holdings: state.holdings,
      valuations: state.valuations,
      liabilities: state.liabilities,
      priceQuotes: state.priceQuotes,
      fxRates: state.fxRates,
      baseCurrency: state.settings.baseCurrency,
    });
    const { snapshots, persist } = reconcileSnapshot(state.snapshots, snapshot);
    if (persist) await repo.upsertSnapshot(db, snapshot);
    return snapshots;
  }

  async function reload<K extends keyof Entities>(
    db: Database,
    patch: Pick<Entities, K>,
  ): Promise<void> {
    set(patch);
    const snapshots = await writeSnapshot(db);
    set({ snapshots });
  }

  return {
    ...emptyEntities,
    ready: false,
    error: null,
    settings: defaultSettings,

    hydrate: async () => {
      try {
        const db = await getDatabase();
        await seedIfEmpty(db);
        const loaded = await loadEntities(db);

        const snapshot = computeSnapshot(todayIso(), {
          holdings: loaded.holdings,
          valuations: loaded.valuations,
          liabilities: loaded.liabilities,
          priceQuotes: loaded.priceQuotes,
          fxRates: loaded.fxRates,
          baseCurrency: loaded.settings.baseCurrency,
        });
        const reconciled = reconcileSnapshot(loaded.snapshots, snapshot);
        if (reconciled.persist) await repo.upsertSnapshot(db, snapshot);

        const providers = createActiveProviders({
          priceQuotes: loaded.priceQuotes,
          fxRates: loaded.fxRates,
          instruments: loaded.instruments,
        });
        const quotes = await providers.price.getQuotes(
          loaded.instruments.map((instrument) => instrument.id),
        );
        const livePrices = Object.fromEntries(
          quotes.map((quote) => [quote.instrumentId, quote.price]),
        );

        set({
          ...loaded,
          snapshots: reconciled.snapshots,
          livePrices,
          ready: true,
          error: null,
        });
      } catch (error) {
        set({ ready: false, error: error instanceof Error ? error.message : String(error) });
      }
    },

    addHolding: async (input) => {
      const db = await getDatabase();
      const holding: Holding = { ...input, id: createId('hld') };
      await repo.insertHolding(db, holding);
      await reload(db, { holdings: await repo.getAllHoldings(db) });
      return holding.id;
    },
    updateHolding: async (holding) => {
      const db = await getDatabase();
      await repo.updateHolding(db, holding);
      await reload(db, { holdings: await repo.getAllHoldings(db) });
    },
    deleteHolding: async (id) => {
      const db = await getDatabase();
      await repo.deleteHolding(db, id);
      await reload(db, {
        holdings: await repo.getAllHoldings(db),
        transactions: await repo.getAllTransactions(db),
        valuations: await repo.getAllValuations(db),
        lots: await repo.getAllLots(db),
      });
    },

    addTransaction: async (input) => {
      const db = await getDatabase();
      const transaction: Transaction = { ...input, id: createId('tx') };
      await repo.insertTransaction(db, transaction);
      await applyTransactionToLots(db, transaction, get().fxRates);
      await reload(db, {
        transactions: await repo.getAllTransactions(db),
        lots: await repo.getAllLots(db),
      });
      return transaction.id;
    },
    updateTransaction: async (transaction) => {
      const db = await getDatabase();
      await repo.updateTransaction(db, transaction);
      await reload(db, { transactions: await repo.getAllTransactions(db) });
    },
    deleteTransaction: async (id) => {
      const db = await getDatabase();
      await repo.deleteTransaction(db, id);
      await reload(db, { transactions: await repo.getAllTransactions(db) });
    },

    addValuation: async (input) => {
      const db = await getDatabase();
      const valuation: Valuation = { ...input, id: createId('val') };
      await repo.insertValuation(db, valuation);
      await reload(db, { valuations: await repo.getAllValuations(db) });
      return valuation.id;
    },
    updateValuation: async (valuation) => {
      const db = await getDatabase();
      await repo.updateValuation(db, valuation);
      await reload(db, { valuations: await repo.getAllValuations(db) });
    },
    deleteValuation: async (id) => {
      const db = await getDatabase();
      await repo.deleteValuation(db, id);
      await reload(db, { valuations: await repo.getAllValuations(db) });
    },

    addLiability: async (input) => {
      const db = await getDatabase();
      const liability: Liability = { ...input, id: createId('lia') };
      await repo.insertLiability(db, liability);
      await reload(db, { liabilities: await repo.getAllLiabilities(db) });
      return liability.id;
    },
    updateLiability: async (liability) => {
      const db = await getDatabase();
      await repo.updateLiability(db, liability);
      await reload(db, { liabilities: await repo.getAllLiabilities(db) });
    },
    deleteLiability: async (id) => {
      const db = await getDatabase();
      await repo.deleteLiability(db, id);
      await reload(db, { liabilities: await repo.getAllLiabilities(db) });
    },

    addGoal: async (input) => {
      const db = await getDatabase();
      const goal: Goal = { ...input, id: createId('goal') };
      await repo.insertGoal(db, goal);
      set({ goals: await repo.getAllGoals(db) });
      return goal.id;
    },
    updateGoal: async (goal) => {
      const db = await getDatabase();
      await repo.updateGoal(db, goal);
      set({ goals: await repo.getAllGoals(db) });
    },
    deleteGoal: async (id) => {
      const db = await getDatabase();
      await repo.deleteGoal(db, id);
      set({ goals: await repo.getAllGoals(db) });
    },

    addNote: async (input) => {
      const db = await getDatabase();
      const note: Note = { ...input, id: createId('note') };
      await repo.insertNote(db, note);
      set({ notes: await repo.getAllNotes(db) });
      return note.id;
    },
    markNoteRead: async (id) => {
      const db = await getDatabase();
      const note = get().notes.find((item) => item.id === id);
      if (!note) return;
      await repo.updateNote(db, { ...note, read: true });
      set({ notes: await repo.getAllNotes(db) });
    },
    deleteNote: async (id) => {
      const db = await getDatabase();
      await repo.deleteNote(db, id);
      set({ notes: await repo.getAllNotes(db) });
    },

    regenerateInsights: async () => {
      const db = await getDatabase();
      const state = get();
      const now = todayIso();

      const positions = computePositions({
        holdings: state.holdings,
        lots: state.lots,
        transactions: state.transactions,
        priceQuotes: state.priceQuotes,
        valuations: state.valuations,
        fxRates: state.fxRates,
        baseCurrency: state.settings.baseCurrency,
      });
      const holdingsById = new Map(state.holdings.map((holding) => [holding.id, holding]));
      const instrumentsById = new Map(state.instruments.map((item) => [item.id, item]));
      const labelFor = (id: string): string => {
        const holding = holdingsById.get(id);
        if (!holding) return id;
        if (holding.name) return holding.name;
        const instrument = holding.instrumentId ? instrumentsById.get(holding.instrumentId) : null;
        return instrument?.name ?? instrument?.symbol ?? id;
      };

      const fees = computeFeeAnalysis({
        holdings: positions.map((position) => ({
          id: position.holdingId,
          label: labelFor(position.holdingId),
          value: position.value,
          expenseRatio: holdingsById.get(position.holdingId)?.expenseRatio ?? null,
        })),
      });
      const { assets } = selectNetWorth(state.snapshots);

      const candidates = computeInsights({
        allocation: selectAllocation(state.snapshots),
        targets: state.allocationTargets,
        holdings: positions.map((position) => ({
          id: position.holdingId,
          label: labelFor(position.holdingId),
          value: position.value,
        })),
        totalAssets: assets,
        fees,
        goals: selectGoalProgress(state.goals, now).map((entry) => ({
          id: entry.goal.id,
          name: entry.goal.name,
          percent: entry.percent,
          pace: entry.pace,
        })),
        baseCurrency: state.settings.baseCurrency,
        thresholds: state.insightThresholds,
      });

      const existingIds = new Set(state.notes.map((note) => note.id));
      let unread = state.notes.filter((note) => !note.read).length;
      for (const candidate of candidates) {
        if (unread >= 3) break;
        if (existingIds.has(candidate.key)) continue;
        await repo.insertNote(db, {
          id: candidate.key,
          kind: candidate.kind,
          body: candidate.body,
          detail: candidate.detail,
          createdAt: now,
          read: false,
        });
        unread += 1;
      }
      set({ notes: await repo.getAllNotes(db) });
    },

    setAllocationTargets: async (targets) => {
      const db = await getDatabase();
      await repo.setKv(db, ALLOCATION_TARGETS_KEY, JSON.stringify(targets));
      set({ allocationTargets: targets });
    },

    setExpenseRatio: async (holdingId, expenseRatio) => {
      const db = await getDatabase();
      await repo.updateHoldingExpenseRatio(db, holdingId, expenseRatio);
      set({ holdings: await repo.getAllHoldings(db) });
    },

    exportAllData: async () => {
      const db = await getDatabase();
      const state = get();
      const kv: Record<string, string> = {};
      for (const key of [ALLOCATION_TARGETS_KEY, INSIGHT_THRESHOLDS_KEY, 'settings']) {
        const value = await repo.getKv(db, key);
        if (value != null) kv[key] = value;
      }
      const data: BackupData = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        accounts: state.accounts,
        instruments: state.instruments,
        holdings: state.holdings,
        transactions: state.transactions,
        lots: state.lots,
        valuations: state.valuations,
        liabilities: state.liabilities,
        goals: state.goals,
        notes: state.notes,
        fxRates: state.fxRates,
        priceQuotes: state.priceQuotes,
        snapshots: state.snapshots,
        kv,
      };
      await writeAndShareBackup(data);
    },

    importBackup: async (uri) => {
      const db = await getDatabase();
      const data = await readBackup(uri);
      await repo.deleteAllRows(db);
      await db.withTransactionAsync(async () => {
        for (const account of data.accounts) await repo.insertAccount(db, account);
        for (const instrument of data.instruments) await repo.insertInstrument(db, instrument);
        for (const holding of data.holdings) await repo.insertHolding(db, holding);
        for (const transaction of data.transactions) await repo.insertTransaction(db, transaction);
        for (const lot of data.lots) await repo.insertLot(db, lot);
        for (const valuation of data.valuations) await repo.insertValuation(db, valuation);
        for (const liability of data.liabilities) await repo.insertLiability(db, liability);
        for (const goal of data.goals) await repo.insertGoal(db, goal);
        for (const note of data.notes) await repo.insertNote(db, note);
        for (const rate of data.fxRates) await repo.upsertFxRate(db, rate);
        for (const quote of data.priceQuotes) await repo.upsertPriceQuote(db, quote);
        for (const snapshot of data.snapshots) await repo.upsertSnapshot(db, snapshot);
        for (const [key, value] of Object.entries(data.kv)) await repo.setKv(db, key, value);
      });

      const loaded = await loadEntities(db);
      const snapshot = computeSnapshot(todayIso(), {
        holdings: loaded.holdings,
        valuations: loaded.valuations,
        liabilities: loaded.liabilities,
        priceQuotes: loaded.priceQuotes,
        fxRates: loaded.fxRates,
        baseCurrency: loaded.settings.baseCurrency,
      });
      const reconciled = reconcileSnapshot(loaded.snapshots, snapshot);
      if (reconciled.persist) await repo.upsertSnapshot(db, snapshot);
      set({ ...loaded, snapshots: reconciled.snapshots });
    },

    deleteAllData: async () => {
      const db = await getDatabase();
      await repo.deleteAllRows(db);
      set({ ...emptyEntities });
    },

    updateSettings: async (patch) => {
      const db = await getDatabase();
      const prev = get().settings;
      const next = { ...prev, ...patch };
      await saveSettings(db, next);
      if (patch.baseCurrency && patch.baseCurrency !== prev.baseCurrency) {
        const { fxRates, snapshots } = get();
        const rebased = snapshots.map((snapshot) =>
          rebaseSnapshot(snapshot, prev.baseCurrency, next.baseCurrency, fxRates),
        );
        for (const snapshot of rebased) await repo.upsertSnapshot(db, snapshot);
        set({ settings: next, snapshots: rebased });
      } else {
        set({ settings: next });
      }
    },
  };
});
