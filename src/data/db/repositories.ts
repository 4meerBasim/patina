import type {
  Account,
  AccountKind,
  AssetClass,
  CurrencyCode,
  FxRate,
  Goal,
  Holding,
  HoldingWithInstrument,
  Instrument,
  InstrumentKind,
  Liability,
  LiabilityKind,
  Lot,
  Note,
  NoteKind,
  Ownership,
  PriceQuote,
  Snapshot,
  Transaction,
  TransactionType,
  Valuation,
} from '../types';
import type { Database } from './client';

type AccountRow = {
  id: string;
  name: string;
  kind: string;
  ownership: string;
  currency: string;
  institution: string | null;
};

type InstrumentRow = {
  id: string;
  symbol: string;
  name: string;
  kind: string;
  currency: string;
};

type HoldingRow = {
  id: string;
  account_id: string;
  asset_class: string;
  instrument_id: string | null;
  name: string | null;
  quantity: number;
  currency: string;
};

type TransactionRow = {
  id: string;
  holding_id: string | null;
  account_id: string;
  type: string;
  quantity: number | null;
  price: number | null;
  amount: number;
  currency: string;
  date: string;
  note: string | null;
};

type LotRow = {
  id: string;
  holding_id: string;
  quantity: number;
  cost_per_unit: number;
  acquired_at: string;
  remaining_quantity: number;
};

type ValuationRow = {
  id: string;
  holding_id: string;
  date: string;
  value: number;
  currency: string;
};

type LiabilityRow = {
  id: string;
  name: string;
  kind: string;
  balance: number;
  currency: string;
};

type GoalRow = {
  id: string;
  name: string;
  target: number;
  saved_amount: number;
  monthly_contribution: number;
  target_date: string | null;
  linked_holding_ids: string;
  linked_account_ids: string;
};

type NoteRow = {
  id: string;
  kind: string;
  body: string;
  detail: string | null;
  created_at: string;
  read: number;
};

type FxRateRow = { base: string; quote: string; rate: number; as_of: string };

type SnapshotRow = {
  date: string;
  total_net_worth: number;
  total_assets: number;
  total_liabilities: number;
  per_class: string;
  per_account: string;
};

type PriceQuoteRow = { instrument_id: string; price: number; as_of: string };

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as AccountKind,
    ownership: row.ownership as Ownership,
    currency: row.currency as CurrencyCode,
    institution: row.institution,
  };
}

function toInstrument(row: InstrumentRow): Instrument {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    kind: row.kind as InstrumentKind,
    currency: row.currency as CurrencyCode,
  };
}

function toHolding(row: HoldingRow): Holding {
  return {
    id: row.id,
    accountId: row.account_id,
    assetClass: row.asset_class as AssetClass,
    instrumentId: row.instrument_id,
    name: row.name,
    quantity: row.quantity,
    currency: row.currency as CurrencyCode,
  };
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    holdingId: row.holding_id,
    accountId: row.account_id,
    type: row.type as TransactionType,
    quantity: row.quantity,
    price: row.price,
    amount: row.amount,
    currency: row.currency as CurrencyCode,
    date: row.date,
    note: row.note,
  };
}

function toLot(row: LotRow): Lot {
  return {
    id: row.id,
    holdingId: row.holding_id,
    quantity: row.quantity,
    costPerUnit: row.cost_per_unit,
    acquiredAt: row.acquired_at,
    remainingQuantity: row.remaining_quantity,
  };
}

function toValuation(row: ValuationRow): Valuation {
  return {
    id: row.id,
    holdingId: row.holding_id,
    date: row.date,
    value: row.value,
    currency: row.currency as CurrencyCode,
  };
}

function toLiability(row: LiabilityRow): Liability {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as LiabilityKind,
    balance: row.balance,
    currency: row.currency as CurrencyCode,
  };
}

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    target: row.target,
    savedAmount: row.saved_amount,
    monthlyContribution: row.monthly_contribution,
    targetDate: row.target_date,
    linkedHoldingIds: JSON.parse(row.linked_holding_ids) as string[],
    linkedAccountIds: JSON.parse(row.linked_account_ids) as string[],
  };
}

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    kind: row.kind as NoteKind,
    body: row.body,
    detail: row.detail,
    createdAt: row.created_at,
    read: row.read === 1,
  };
}

function toFxRate(row: FxRateRow): FxRate {
  return {
    base: row.base as CurrencyCode,
    quote: row.quote as CurrencyCode,
    rate: row.rate,
    asOf: row.as_of,
  };
}

function toSnapshot(row: SnapshotRow): Snapshot {
  return {
    date: row.date,
    totalNetWorth: row.total_net_worth,
    totalAssets: row.total_assets,
    totalLiabilities: row.total_liabilities,
    perClass: JSON.parse(row.per_class) as Record<AssetClass, number>,
    perAccount: JSON.parse(row.per_account) as Record<string, number>,
  };
}

function toPriceQuote(row: PriceQuoteRow): PriceQuote {
  return { instrumentId: row.instrument_id, price: row.price, asOf: row.as_of };
}

export async function getAllAccounts(db: Database): Promise<Account[]> {
  return (await db.getAllAsync<AccountRow>('SELECT * FROM accounts')).map(toAccount);
}

export async function insertAccount(db: Database, account: Account): Promise<void> {
  await db.runAsync(
    'INSERT INTO accounts (id, name, kind, ownership, currency, institution) VALUES (?, ?, ?, ?, ?, ?)',
    [account.id, account.name, account.kind, account.ownership, account.currency, account.institution],
  );
}

export async function getAllInstruments(db: Database): Promise<Instrument[]> {
  return (await db.getAllAsync<InstrumentRow>('SELECT * FROM instruments')).map(toInstrument);
}

export async function insertInstrument(db: Database, instrument: Instrument): Promise<void> {
  await db.runAsync(
    'INSERT INTO instruments (id, symbol, name, kind, currency) VALUES (?, ?, ?, ?, ?)',
    [instrument.id, instrument.symbol, instrument.name, instrument.kind, instrument.currency],
  );
}

export async function getAllHoldings(db: Database): Promise<Holding[]> {
  return (await db.getAllAsync<HoldingRow>('SELECT * FROM holdings')).map(toHolding);
}

export async function getHoldingsWithInstrument(db: Database): Promise<HoldingWithInstrument[]> {
  const rows = await db.getAllAsync<HoldingRow & { i_id: string | null }>(
    `SELECT h.*, i.id AS i_id, i.symbol AS i_symbol, i.name AS i_name, i.kind AS i_kind, i.currency AS i_currency
     FROM holdings h LEFT JOIN instruments i ON h.instrument_id = i.id`,
  );
  return rows.map((row) => {
    const r = row as HoldingRow & {
      i_id: string | null;
      i_symbol: string | null;
      i_name: string | null;
      i_kind: string | null;
      i_currency: string | null;
    };
    const instrument =
      r.i_id && r.i_symbol && r.i_name && r.i_kind && r.i_currency
        ? toInstrument({
            id: r.i_id,
            symbol: r.i_symbol,
            name: r.i_name,
            kind: r.i_kind,
            currency: r.i_currency,
          })
        : null;
    return { ...toHolding(r), instrument };
  });
}

export async function insertHolding(db: Database, holding: Holding): Promise<void> {
  await db.runAsync(
    'INSERT INTO holdings (id, account_id, asset_class, instrument_id, name, quantity, currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      holding.id,
      holding.accountId,
      holding.assetClass,
      holding.instrumentId,
      holding.name,
      holding.quantity,
      holding.currency,
    ],
  );
}

export async function updateHolding(db: Database, holding: Holding): Promise<void> {
  await db.runAsync(
    'UPDATE holdings SET account_id = ?, asset_class = ?, instrument_id = ?, name = ?, quantity = ?, currency = ? WHERE id = ?',
    [
      holding.accountId,
      holding.assetClass,
      holding.instrumentId,
      holding.name,
      holding.quantity,
      holding.currency,
      holding.id,
    ],
  );
}

export async function deleteHolding(db: Database, id: string): Promise<void> {
  await db.runAsync('DELETE FROM lots WHERE holding_id = ?', [id]);
  await db.runAsync('DELETE FROM valuations WHERE holding_id = ?', [id]);
  await db.runAsync('DELETE FROM transactions WHERE holding_id = ?', [id]);
  await db.runAsync('DELETE FROM holdings WHERE id = ?', [id]);
}

export async function getAllTransactions(db: Database): Promise<Transaction[]> {
  return (await db.getAllAsync<TransactionRow>('SELECT * FROM transactions ORDER BY date DESC')).map(
    toTransaction,
  );
}

export async function getTransactionsByHolding(
  db: Database,
  holdingId: string,
): Promise<Transaction[]> {
  return (
    await db.getAllAsync<TransactionRow>(
      'SELECT * FROM transactions WHERE holding_id = ? ORDER BY date DESC',
      [holdingId],
    )
  ).map(toTransaction);
}

export async function insertTransaction(db: Database, transaction: Transaction): Promise<void> {
  await db.runAsync(
    'INSERT INTO transactions (id, holding_id, account_id, type, quantity, price, amount, currency, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      transaction.id,
      transaction.holdingId,
      transaction.accountId,
      transaction.type,
      transaction.quantity,
      transaction.price,
      transaction.amount,
      transaction.currency,
      transaction.date,
      transaction.note,
    ],
  );
}

export async function updateTransaction(db: Database, transaction: Transaction): Promise<void> {
  await db.runAsync(
    'UPDATE transactions SET holding_id = ?, account_id = ?, type = ?, quantity = ?, price = ?, amount = ?, currency = ?, date = ?, note = ? WHERE id = ?',
    [
      transaction.holdingId,
      transaction.accountId,
      transaction.type,
      transaction.quantity,
      transaction.price,
      transaction.amount,
      transaction.currency,
      transaction.date,
      transaction.note,
      transaction.id,
    ],
  );
}

export async function deleteTransaction(db: Database, id: string): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getAllLots(db: Database): Promise<Lot[]> {
  return (await db.getAllAsync<LotRow>('SELECT * FROM lots ORDER BY acquired_at')).map(toLot);
}

export async function getLotsByHolding(db: Database, holdingId: string): Promise<Lot[]> {
  return (
    await db.getAllAsync<LotRow>('SELECT * FROM lots WHERE holding_id = ? ORDER BY acquired_at', [
      holdingId,
    ])
  ).map(toLot);
}

export async function insertLot(db: Database, lot: Lot): Promise<void> {
  await db.runAsync(
    'INSERT INTO lots (id, holding_id, quantity, cost_per_unit, acquired_at, remaining_quantity) VALUES (?, ?, ?, ?, ?, ?)',
    [lot.id, lot.holdingId, lot.quantity, lot.costPerUnit, lot.acquiredAt, lot.remainingQuantity],
  );
}

export async function updateLotRemaining(
  db: Database,
  id: string,
  remainingQuantity: number,
): Promise<void> {
  await db.runAsync('UPDATE lots SET remaining_quantity = ? WHERE id = ?', [remainingQuantity, id]);
}

export async function getAllValuations(db: Database): Promise<Valuation[]> {
  return (await db.getAllAsync<ValuationRow>('SELECT * FROM valuations ORDER BY date DESC')).map(
    toValuation,
  );
}

export async function getValuationsByHolding(
  db: Database,
  holdingId: string,
): Promise<Valuation[]> {
  return (
    await db.getAllAsync<ValuationRow>(
      'SELECT * FROM valuations WHERE holding_id = ? ORDER BY date DESC',
      [holdingId],
    )
  ).map(toValuation);
}

export async function getLatestValuations(db: Database): Promise<Valuation[]> {
  return (
    await db.getAllAsync<ValuationRow>(
      `SELECT v.* FROM valuations v
       JOIN (SELECT holding_id, MAX(date) AS max_date FROM valuations GROUP BY holding_id) m
         ON v.holding_id = m.holding_id AND v.date = m.max_date`,
    )
  ).map(toValuation);
}

export async function getLatestValuationForHolding(
  db: Database,
  holdingId: string,
): Promise<Valuation | null> {
  const row = await db.getFirstAsync<ValuationRow>(
    'SELECT * FROM valuations WHERE holding_id = ? ORDER BY date DESC LIMIT 1',
    [holdingId],
  );
  return row ? toValuation(row) : null;
}

export async function insertValuation(db: Database, valuation: Valuation): Promise<void> {
  await db.runAsync(
    'INSERT INTO valuations (id, holding_id, date, value, currency) VALUES (?, ?, ?, ?, ?)',
    [valuation.id, valuation.holdingId, valuation.date, valuation.value, valuation.currency],
  );
}

export async function updateValuation(db: Database, valuation: Valuation): Promise<void> {
  await db.runAsync('UPDATE valuations SET date = ?, value = ?, currency = ? WHERE id = ?', [
    valuation.date,
    valuation.value,
    valuation.currency,
    valuation.id,
  ]);
}

export async function deleteValuation(db: Database, id: string): Promise<void> {
  await db.runAsync('DELETE FROM valuations WHERE id = ?', [id]);
}

export async function getAllLiabilities(db: Database): Promise<Liability[]> {
  return (await db.getAllAsync<LiabilityRow>('SELECT * FROM liabilities')).map(toLiability);
}

export async function insertLiability(db: Database, liability: Liability): Promise<void> {
  await db.runAsync(
    'INSERT INTO liabilities (id, name, kind, balance, currency) VALUES (?, ?, ?, ?, ?)',
    [liability.id, liability.name, liability.kind, liability.balance, liability.currency],
  );
}

export async function updateLiability(db: Database, liability: Liability): Promise<void> {
  await db.runAsync('UPDATE liabilities SET name = ?, kind = ?, balance = ?, currency = ? WHERE id = ?', [
    liability.name,
    liability.kind,
    liability.balance,
    liability.currency,
    liability.id,
  ]);
}

export async function deleteLiability(db: Database, id: string): Promise<void> {
  await db.runAsync('DELETE FROM liabilities WHERE id = ?', [id]);
}

export async function getAllGoals(db: Database): Promise<Goal[]> {
  return (await db.getAllAsync<GoalRow>('SELECT * FROM goals')).map(toGoal);
}

export async function insertGoal(db: Database, goal: Goal): Promise<void> {
  await db.runAsync(
    'INSERT INTO goals (id, name, target, saved_amount, monthly_contribution, target_date, linked_holding_ids, linked_account_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      goal.id,
      goal.name,
      goal.target,
      goal.savedAmount,
      goal.monthlyContribution,
      goal.targetDate,
      JSON.stringify(goal.linkedHoldingIds),
      JSON.stringify(goal.linkedAccountIds),
    ],
  );
}

export async function updateGoal(db: Database, goal: Goal): Promise<void> {
  await db.runAsync(
    'UPDATE goals SET name = ?, target = ?, saved_amount = ?, monthly_contribution = ?, target_date = ?, linked_holding_ids = ?, linked_account_ids = ? WHERE id = ?',
    [
      goal.name,
      goal.target,
      goal.savedAmount,
      goal.monthlyContribution,
      goal.targetDate,
      JSON.stringify(goal.linkedHoldingIds),
      JSON.stringify(goal.linkedAccountIds),
      goal.id,
    ],
  );
}

export async function deleteGoal(db: Database, id: string): Promise<void> {
  await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
}

export async function getAllNotes(db: Database): Promise<Note[]> {
  return (await db.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY created_at DESC')).map(toNote);
}

export async function insertNote(db: Database, note: Note): Promise<void> {
  await db.runAsync(
    'INSERT INTO notes (id, kind, body, detail, created_at, read) VALUES (?, ?, ?, ?, ?, ?)',
    [note.id, note.kind, note.body, note.detail, note.createdAt, note.read ? 1 : 0],
  );
}

export async function updateNote(db: Database, note: Note): Promise<void> {
  await db.runAsync('UPDATE notes SET kind = ?, body = ?, detail = ?, created_at = ?, read = ? WHERE id = ?', [
    note.kind,
    note.body,
    note.detail,
    note.createdAt,
    note.read ? 1 : 0,
    note.id,
  ]);
}

export async function deleteNote(db: Database, id: string): Promise<void> {
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}

export async function getAllFxRates(db: Database): Promise<FxRate[]> {
  return (await db.getAllAsync<FxRateRow>('SELECT * FROM fx_rates')).map(toFxRate);
}

export async function upsertFxRate(db: Database, rate: FxRate): Promise<void> {
  await db.runAsync(
    'INSERT INTO fx_rates (base, quote, rate, as_of) VALUES (?, ?, ?, ?) ON CONFLICT(base, quote) DO UPDATE SET rate = excluded.rate, as_of = excluded.as_of',
    [rate.base, rate.quote, rate.rate, rate.asOf],
  );
}

export async function getAllSnapshots(db: Database): Promise<Snapshot[]> {
  return (await db.getAllAsync<SnapshotRow>('SELECT * FROM snapshots ORDER BY date')).map(
    toSnapshot,
  );
}

export async function getSnapshotsInRange(
  db: Database,
  from: string,
  to: string,
): Promise<Snapshot[]> {
  return (
    await db.getAllAsync<SnapshotRow>(
      'SELECT * FROM snapshots WHERE date >= ? AND date <= ? ORDER BY date',
      [from, to],
    )
  ).map(toSnapshot);
}

export async function getLatestSnapshot(db: Database): Promise<Snapshot | null> {
  const row = await db.getFirstAsync<SnapshotRow>(
    'SELECT * FROM snapshots ORDER BY date DESC LIMIT 1',
  );
  return row ? toSnapshot(row) : null;
}

export async function upsertSnapshot(db: Database, snapshot: Snapshot): Promise<void> {
  await db.runAsync(
    `INSERT INTO snapshots (date, total_net_worth, total_assets, total_liabilities, per_class, per_account)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       total_net_worth = excluded.total_net_worth,
       total_assets = excluded.total_assets,
       total_liabilities = excluded.total_liabilities,
       per_class = excluded.per_class,
       per_account = excluded.per_account`,
    [
      snapshot.date,
      snapshot.totalNetWorth,
      snapshot.totalAssets,
      snapshot.totalLiabilities,
      JSON.stringify(snapshot.perClass),
      JSON.stringify(snapshot.perAccount),
    ],
  );
}

export async function getAllPriceQuotes(db: Database): Promise<PriceQuote[]> {
  return (await db.getAllAsync<PriceQuoteRow>('SELECT * FROM price_quotes')).map(toPriceQuote);
}

export async function upsertPriceQuote(db: Database, quote: PriceQuote): Promise<void> {
  await db.runAsync(
    'INSERT INTO price_quotes (instrument_id, price, as_of) VALUES (?, ?, ?) ON CONFLICT(instrument_id) DO UPDATE SET price = excluded.price, as_of = excluded.as_of',
    [quote.instrumentId, quote.price, quote.asOf],
  );
}

export async function getKv(db: Database, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setKv(db: Database, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

export async function countHoldings(db: Database): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM holdings');
  return row?.count ?? 0;
}
