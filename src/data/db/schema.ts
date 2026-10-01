import type { Database } from './client';

const SCHEMA_VERSION = 2;

const createStatements = `
CREATE TABLE accounts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  ownership TEXT NOT NULL,
  currency TEXT NOT NULL,
  institution TEXT
);

CREATE TABLE instruments (
  id TEXT PRIMARY KEY NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  currency TEXT NOT NULL
);

CREATE TABLE holdings (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  asset_class TEXT NOT NULL,
  instrument_id TEXT REFERENCES instruments(id),
  name TEXT,
  quantity REAL NOT NULL,
  currency TEXT NOT NULL
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY NOT NULL,
  holding_id TEXT REFERENCES holdings(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  type TEXT NOT NULL,
  quantity REAL,
  price REAL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT
);

CREATE TABLE lots (
  id TEXT PRIMARY KEY NOT NULL,
  holding_id TEXT NOT NULL REFERENCES holdings(id),
  quantity REAL NOT NULL,
  cost_per_unit REAL NOT NULL,
  acquired_at TEXT NOT NULL,
  remaining_quantity REAL NOT NULL
);

CREATE TABLE valuations (
  id TEXT PRIMARY KEY NOT NULL,
  holding_id TEXT NOT NULL REFERENCES holdings(id),
  date TEXT NOT NULL,
  value REAL NOT NULL,
  currency TEXT NOT NULL
);

CREATE TABLE liabilities (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  balance REAL NOT NULL,
  currency TEXT NOT NULL
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  target REAL NOT NULL,
  saved_amount REAL NOT NULL,
  monthly_contribution REAL NOT NULL,
  target_date TEXT,
  linked_holding_ids TEXT NOT NULL,
  linked_account_ids TEXT NOT NULL
);

CREATE TABLE notes (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  body TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL,
  read INTEGER NOT NULL
);

CREATE TABLE fx_rates (
  base TEXT NOT NULL,
  quote TEXT NOT NULL,
  rate REAL NOT NULL,
  as_of TEXT NOT NULL,
  PRIMARY KEY (base, quote)
);

CREATE TABLE snapshots (
  date TEXT PRIMARY KEY NOT NULL,
  total_net_worth REAL NOT NULL,
  total_assets REAL NOT NULL,
  total_liabilities REAL NOT NULL,
  per_class TEXT NOT NULL,
  per_account TEXT NOT NULL
);

CREATE TABLE price_quotes (
  instrument_id TEXT PRIMARY KEY NOT NULL REFERENCES instruments(id),
  price REAL NOT NULL,
  as_of TEXT NOT NULL
);

CREATE TABLE kv (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX idx_holdings_account ON holdings(account_id);
CREATE INDEX idx_holdings_instrument ON holdings(instrument_id);
CREATE INDEX idx_transactions_holding ON transactions(holding_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_lots_holding ON lots(holding_id);
CREATE INDEX idx_valuations_holding ON valuations(holding_id);
CREATE INDEX idx_valuations_date ON valuations(date);
`;

// v2 is additive only: new nullable columns, no rewrite of existing data.
const v2Statements = `
ALTER TABLE holdings ADD COLUMN expense_ratio REAL;
ALTER TABLE lots ADD COLUMN acquired_fx_rate REAL;
`;

export async function migrate(db: Database): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  if (current < 1) {
    await db.execAsync(createStatements);
  }
  if (current < 2) {
    await db.execAsync(v2Statements);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
