import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  createInstrumentSearchProvider,
  type InstrumentSearchProvider,
} from '@/data/providers/instrument-search-provider';
import type { Settings } from '@/data/settings';
import type { Transaction } from '@/data/types';

import { useDataStore, type DataStore } from './data-store';
import {
  selectAccountGroups,
  selectAllocation,
  selectGoalProgress,
  selectHoldingValues,
  selectNetWorth,
  selectOwnerGroups,
  selectPeriodDelta,
  selectRecentActivity,
  selectTodayDelta,
  selectTopMovers,
  selectUnreadNotes,
  type AccountGroup,
  type AllocationSlice,
  type Delta,
  type GoalProgress,
  type HoldingValue,
  type NetWorth,
  type OwnerGroup,
  type TopMover,
} from './selectors';

export { useDataStore } from './data-store';
export type { DataStore } from './data-store';
export * from './selectors';

const TODAY = new Date().toISOString().slice(0, 10);

export function useHydrateStore(): { ready: boolean; error: string | null } {
  const ready = useDataStore((state) => state.ready);
  const error = useDataStore((state) => state.error);
  const hydrate = useDataStore((state) => state.hydrate);
  useEffect(() => {
    if (!ready && !error) hydrate();
  }, [ready, error, hydrate]);
  return { ready, error };
}

export async function initStore(): Promise<void> {
  await useDataStore.getState().hydrate();
}

type Actions = Pick<
  DataStore,
  | 'addHolding'
  | 'updateHolding'
  | 'deleteHolding'
  | 'addTransaction'
  | 'updateTransaction'
  | 'deleteTransaction'
  | 'addValuation'
  | 'updateValuation'
  | 'deleteValuation'
  | 'addLiability'
  | 'updateLiability'
  | 'deleteLiability'
  | 'addGoal'
  | 'updateGoal'
  | 'deleteGoal'
  | 'addNote'
  | 'markNoteRead'
  | 'deleteNote'
  | 'updateSettings'
>;

export function useDataActions(): Actions {
  return useDataStore(
    useShallow((state) => ({
      addHolding: state.addHolding,
      updateHolding: state.updateHolding,
      deleteHolding: state.deleteHolding,
      addTransaction: state.addTransaction,
      updateTransaction: state.updateTransaction,
      deleteTransaction: state.deleteTransaction,
      addValuation: state.addValuation,
      updateValuation: state.updateValuation,
      deleteValuation: state.deleteValuation,
      addLiability: state.addLiability,
      updateLiability: state.updateLiability,
      deleteLiability: state.deleteLiability,
      addGoal: state.addGoal,
      updateGoal: state.updateGoal,
      deleteGoal: state.deleteGoal,
      addNote: state.addNote,
      markNoteRead: state.markNoteRead,
      deleteNote: state.deleteNote,
      updateSettings: state.updateSettings,
    })),
  );
}

export function useSettings(): Settings {
  return useDataStore((state) => state.settings);
}

export function useNetWorth(): NetWorth {
  return useDataStore((state) => selectNetWorth(state.snapshots));
}

export function useAllocation(): AllocationSlice[] {
  return useDataStore((state) => selectAllocation(state.snapshots));
}

export function useTodayDelta(): Delta {
  return useDataStore((state) => selectTodayDelta(state.snapshots));
}

export function usePeriodDelta(days: number): Delta {
  return useDataStore((state) => selectPeriodDelta(state.snapshots, days));
}

export function useAccountGroups(): AccountGroup[] {
  return useDataStore((state) => selectAccountGroups(state.snapshots, state.accounts));
}

export function useOwnerGroups(): OwnerGroup[] {
  return useDataStore((state) => selectOwnerGroups(state.snapshots, state.accounts));
}

export function useRecentActivity(limit = 10): Transaction[] {
  return useDataStore((state) => selectRecentActivity(state.transactions, limit));
}

export function useUnreadNotes(): DataStore['notes'] {
  return useDataStore((state) => selectUnreadNotes(state.notes));
}

export function useTopMovers(limit = 3): TopMover[] {
  return useDataStore((state) =>
    selectTopMovers(state.holdings, state.instruments, state.priceQuotes, state.livePrices, limit),
  );
}

export function useGoalProgress(): GoalProgress[] {
  return useDataStore((state) => selectGoalProgress(state.goals, TODAY));
}

export function useHoldings(): HoldingValue[] {
  return useDataStore((state) =>
    selectHoldingValues(state.holdings, state.instruments, state.priceQuotes, state.valuations),
  );
}

export function useSnapshots(): DataStore['snapshots'] {
  return useDataStore((state) => state.snapshots);
}

export function useAccounts(): DataStore['accounts'] {
  return useDataStore((state) => state.accounts);
}

export function useInstruments(): DataStore['instruments'] {
  return useDataStore((state) => state.instruments);
}

export function useLiabilities(): DataStore['liabilities'] {
  return useDataStore((state) => state.liabilities);
}

export function useGoals(): DataStore['goals'] {
  return useDataStore((state) => state.goals);
}

export function useNotes(): DataStore['notes'] {
  return useDataStore((state) => state.notes);
}

export function useTransactions(): DataStore['transactions'] {
  return useDataStore((state) => state.transactions);
}

export function useLots(): DataStore['lots'] {
  return useDataStore((state) => state.lots);
}

export function useInstrumentSearchProvider(): InstrumentSearchProvider {
  const instruments = useInstruments();
  return useMemo(() => createInstrumentSearchProvider(instruments), [instruments]);
}
