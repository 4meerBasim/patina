import { create } from 'zustand';

import { getDatabase, type Database } from '@/data/db/client';
import * as repo from '@/data/db/repositories';
import { createActiveProviders } from '@/data/providers';
import { seedIfEmpty } from '@/data/seed';
import { defaultSettings, loadSettings, saveSettings, type Settings } from '@/data/settings';
import type {
  Account,
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
import { computeSnapshot, convertCurrency } from '@/lib/snapshots';

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
};

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

async function applyTransactionToLots(db: Database, transaction: Transaction): Promise<void> {
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
      await applyTransactionToLots(db, transaction);
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
