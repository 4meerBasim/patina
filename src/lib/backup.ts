import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
function tableToRows(records: Row[]): string[][] {
  if (records.length === 0) return [];
  const keys = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
  const body = records.map((record) => keys.map((key) => JSON.stringify(record[key] ?? null)));
  return [keys, ...body];
}

function rowsToTable<T>(rows: string[][]): T[] {
  if (rows.length < 2) return [];
  const [header, ...body] = rows;
  return body.map((cells) => {
    const record: Row = {};
    header.forEach((key, index) => {
      const cell = cells[index];
      record[key] = cell === undefined || cell === '' ? null : JSON.parse(cell);
    });
    return record as T;
  });
}

function serializeJson(data: BackupData): string {
  return JSON.stringify(data, null, 2);
}

function parseJson(text: string): BackupData {
  const parsed = JSON.parse(text) as Partial<BackupData>;
  if (typeof parsed.version !== 'number' || !Array.isArray(parsed.holdings)) {
    throw new Error('Unrecognised backup file.');
  }
  return {
    version: parsed.version,
    exportedAt: parsed.exportedAt ?? '',
    accounts: parsed.accounts ?? [],
    instruments: parsed.instruments ?? [],
    holdings: parsed.holdings ?? [],
    transactions: parsed.transactions ?? [],
    lots: parsed.lots ?? [],
    valuations: parsed.valuations ?? [],
    liabilities: parsed.liabilities ?? [],
    goals: parsed.goals ?? [],
    notes: parsed.notes ?? [],
    fxRates: parsed.fxRates ?? [],
    priceQuotes: parsed.priceQuotes ?? [],
    snapshots: parsed.snapshots ?? [],
    kv: parsed.kv ?? {},
  };
}

function serializeCsv(data: BackupData): string {
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

function parseCsvBackup(text: string): BackupData {
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

function freshFile(name: string): File {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  return file;
}

export async function writeAndShareBackup(
  data: BackupData,
): Promise<{ jsonUri: string; csvUri: string }> {
  const jsonFile = freshFile('patina-backup.json');
  jsonFile.write(serializeJson(data));
  const csvFile = freshFile('patina-backup.csv');
  csvFile.write(serializeCsv(data));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(jsonFile.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Patina data',
      UTI: 'public.json',
    });
  }
  return { jsonUri: jsonFile.uri, csvUri: csvFile.uri };
}

export async function readBackup(uri: string): Promise<BackupData> {
  const file = new File(uri);
  const text = await file.text();
  return file.extension.toLowerCase() === '.csv' ? parseCsvBackup(text) : parseJson(text);
}
