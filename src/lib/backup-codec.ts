import type {
  Account,
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
import { parseCsv, toCsv } from '@/lib/csv';

export const BACKUP_VERSION = 2;

export type BackupData = {
  version: number;
  exportedAt: string;
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
  kv: Record<string, string>;
};

type Row = Record<string, unknown>;

// Every cell is JSON so numbers, nulls, booleans and nested arrays/objects
// survive the round-trip exactly; CSV quoting then protects commas and quotes.
export function tableToRows(records: Row[]): string[][] {
  if (records.length === 0) return [];
  const keys = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  const body = records.map((record) => keys.map((key) => JSON.stringify(record[key] ?? null)));
  return [keys, ...body];
}

export function rowsToTable<T>(rows: string[][]): T[] {
  if (rows.length < 2) return [];
  const [header, ...body] = rows;
  return body.map((cells, rowIndex) => {
    const record: Row = {};
    header.forEach((key, index) => {
      const cell = cells[index];
      record[key] = cell === undefined || cell === '' ? null : parseCell(cell, key, rowIndex);
    });
    return record as T;
  });
}

// Every cell holds JSON, so a truncated or hand-edited file lands here as a SyntaxError.
// The user gets told which cell instead of the parser's own wording.
function parseCell(cell: string, key: string, rowIndex: number): unknown {
  try {
    return JSON.parse(cell);
  } catch {
    throw new Error(
      `Backup file is not readable: the "${key}" value in row ${rowIndex + 1} is damaged.`,
    );
  }
}

export function serializeJson(data: BackupData): string {
  return JSON.stringify(data, null, 2);
}

type TableName =
  | 'accounts'
  | 'instruments'
  | 'holdings'
  | 'transactions'
  | 'lots'
  | 'valuations'
  | 'liabilities'
  | 'goals'
  | 'notes'
  | 'fxRates'
  | 'priceQuotes'
  | 'snapshots';

// Import is a system boundary, so a table that is present but not a list is a damaged
// file rather than something to default away. A missing one still defaults to empty:
// a backup written before a table existed is a different thing from a corrupt one.
function tableOf<T>(parsed: Partial<Record<TableName, unknown>>, name: TableName): T[] {
  const value = parsed[name];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Backup file is not readable: "${name}" is not a list.`);
  }
  return value as T[];
}

export function parseJson(text: string): BackupData {
  let parsed: Partial<BackupData>;
  try {
    parsed = JSON.parse(text) as Partial<BackupData>;
  } catch {
    throw new Error('Backup file is not readable: it is not valid JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Unrecognised backup file.');
  }
  if (typeof parsed.version !== 'number' || !Array.isArray(parsed.holdings)) {
    throw new Error('Unrecognised backup file.');
  }
  if (parsed.kv !== undefined && (typeof parsed.kv !== 'object' || Array.isArray(parsed.kv))) {
    throw new Error('Backup file is not readable: "kv" is not a table of settings.');
  }
  return {
    version: parsed.version,
    exportedAt: parsed.exportedAt ?? '',
    accounts: tableOf<Account>(parsed, 'accounts'),
    instruments: tableOf<Instrument>(parsed, 'instruments'),
    holdings: tableOf<Holding>(parsed, 'holdings'),
    transactions: tableOf<Transaction>(parsed, 'transactions'),
    lots: tableOf<Lot>(parsed, 'lots'),
    valuations: tableOf<Valuation>(parsed, 'valuations'),
    liabilities: tableOf<Liability>(parsed, 'liabilities'),
    goals: tableOf<Goal>(parsed, 'goals'),
    notes: tableOf<Note>(parsed, 'notes'),
    fxRates: tableOf<FxRate>(parsed, 'fxRates'),
    priceQuotes: tableOf<PriceQuote>(parsed, 'priceQuotes'),
    snapshots: tableOf<Snapshot>(parsed, 'snapshots'),
    kv: parsed.kv ?? {},
  };
}

export function serializeCsv(data: BackupData): string {
  const sections: [string, Row[]][] = [
    ['meta', [{ version: data.version, exportedAt: data.exportedAt }]],
    ['accounts', data.accounts],
    ['instruments', data.instruments],
    ['holdings', data.holdings],
    ['transactions', data.transactions],
    ['lots', data.lots],
    ['valuations', data.valuations],
    ['liabilities', data.liabilities],
    ['goals', data.goals],
    ['notes', data.notes],
    ['fxRates', data.fxRates],
    ['priceQuotes', data.priceQuotes],
    ['snapshots', data.snapshots],
    ['kv', Object.entries(data.kv).map(([key, value]) => ({ key, value }))],
  ];
  return sections
    .map(([name, records]) => `#TABLE:${name}\r\n${toCsv(tableToRows(records))}`)
    .join('\r\n\r\n');
}

export function parseCsvBackup(text: string): BackupData {
  const blocks = new Map<string, string>();
  let current: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (current) blocks.set(current, buffer.join('\n').trim());
  };
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('#TABLE:')) {
      flush();
      current = line.slice('#TABLE:'.length).trim();
      buffer = [];
    } else if (current) {
      buffer.push(line);
    }
  }
  flush();

  const table = <T>(name: string): T[] => {
    const raw = blocks.get(name);
    if (!raw) return [];
    return rowsToTable<T>(parseCsv(raw));
  };

  const meta = table<{ version: number; exportedAt: string }>('meta')[0];
  if (!blocks.has('holdings')) {
    throw new Error('Unrecognised backup file.');
  }
  const kv: Record<string, string> = {};
  for (const entry of table<{ key: string; value: string }>('kv')) kv[entry.key] = entry.value;

  return {
    version: meta?.version ?? BACKUP_VERSION,
    exportedAt: meta?.exportedAt ?? '',
    accounts: table<Account>('accounts'),
    instruments: table<Instrument>('instruments'),
    holdings: table<Holding>('holdings'),
    transactions: table<Transaction>('transactions'),
    lots: table<Lot>('lots'),
    valuations: table<Valuation>('valuations'),
    liabilities: table<Liability>('liabilities'),
    goals: table<Goal>('goals'),
    notes: table<Note>('notes'),
    fxRates: table<FxRate>('fxRates'),
    priceQuotes: table<PriceQuote>('priceQuotes'),
    snapshots: table<Snapshot>('snapshots'),
    kv,
  };
}

// A holding priced by neither a quote nor a dated mark values at zero, and one zero day
// pins time-weighted return at -100% for every period after it. Refuse the file instead.
export function assertPriceable(data: BackupData): void {
  const quoted = new Set(data.priceQuotes.map((quote) => quote.instrumentId));
  const marked = new Set(data.valuations.map((valuation) => valuation.holdingId));
  const orphan = data.holdings.find(
    (holding) =>
      !marked.has(holding.id) && !(holding.instrumentId && quoted.has(holding.instrumentId)),
  );
  if (orphan) {
    throw new Error(
      `Backup is missing a price or valuation for ${orphan.name ?? orphan.id}, so it cannot be imported.`,
    );
  }
}
