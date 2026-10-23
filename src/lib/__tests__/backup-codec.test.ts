import { describe, expect, it } from '@jest/globals';

import type { Account, Holding, Instrument, Transaction } from '@/data/types';
import {
  BACKUP_VERSION,
  assertPriceable,
  parseCsvBackup,
  parseJson,
  rowsToTable,
  serializeCsv,
  serializeJson,
  tableToRows,
  type BackupData,
} from '@/lib/backup-codec';

function emptyBackup(overrides: Partial<BackupData> = {}): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: '2026-10-23T00:00:00.000Z',
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
    kv: {},
    ...overrides,
  };
}

const account: Account = {
  id: 'acc-1',
  name: 'Interactive Brokers',
  kind: 'brokerage',
  ownership: 'me',
  currency: 'USD',
  institution: 'IBKR',
};

const instrument: Instrument = {
  id: 'inst-1',
  symbol: 'AAPL',
  name: 'Apple Inc.',
  kind: 'stock',
  currency: 'USD',
};

const holding: Holding = {
  id: 'hld-1',
  accountId: 'acc-1',
  assetClass: 'stocks',
  instrumentId: 'inst-1',
  name: null,
  quantity: 12.5,
  currency: 'USD',
  expenseRatio: 0.0003,
};

const transaction: Transaction = {
  id: 'tx-1',
  holdingId: 'hld-1',
  accountId: 'acc-1',
  type: 'buy',
  quantity: 12.5,
  price: 248.2,
  amount: -3102.5,
  currency: 'USD',
  date: '2026-09-17',
  note: null,
};

const fullBackup = emptyBackup({
  accounts: [account],
  instruments: [instrument],
  holdings: [holding],
  transactions: [transaction],
  lots: [
    {
      id: 'lot-1',
      holdingId: 'hld-1',
      quantity: 12.5,
      costPerUnit: 248.2,
      acquiredAt: '2026-09-17',
      remainingQuantity: 12.5,
      acquiredFxRate: null,
    },
  ],
  valuations: [
    { id: 'val-1', holdingId: 'hld-1', date: '2026-10-01', value: 3200, currency: 'USD' },
  ],
  liabilities: [
    { id: 'lia-1', name: 'Mortgage', kind: 'mortgage', balance: 182000, currency: 'EUR' },
  ],
  goals: [
    {
      id: 'goal-1',
      name: 'House deposit',
      target: 80000,
      savedAmount: 24000,
      monthlyContribution: 900,
      targetDate: '2029-06',
      linkedHoldingIds: ['hld-1'],
      linkedAccountIds: [],
    },
  ],
  notes: [
    { id: 'note-1', kind: 'concentration', body: 'Stocks are 62% of net worth.', detail: null, createdAt: '2026-10-20', read: false },
  ],
  fxRates: [{ base: 'USD', quote: 'EUR', rate: 0.92, asOf: '2026-10-01' }],
  priceQuotes: [{ instrumentId: 'inst-1', price: 256, asOf: '2026-10-22' }],
  snapshots: [
    {
      date: '2026-10-22',
      totalNetWorth: 1280000,
      totalAssets: 1462000,
      totalLiabilities: 182000,
      perClass: { stocks: 800000, crypto: 40000, property: 500000, cash: 62000, savings: 60000 },
      perAccount: { 'acc-1': 800000 },
    },
  ],
  kv: { locale: 'ar', numeralSystem: 'arabic' },
});

describe('tableToRows and rowsToTable', () => {
  it('round-trips a table of records through the header and body rows', () => {
    const rows = tableToRows([account as unknown as Record<string, unknown>]);
    expect(rows[0]).toContain('id');
    expect(rowsToTable<Account>(rows)).toEqual([account]);
  });

  it('returns no rows for an empty table and no records for a header-only table', () => {
    expect(tableToRows([])).toEqual([]);
    expect(rowsToTable<Account>([['id', 'name']])).toEqual([]);
    expect(rowsToTable<Account>([])).toEqual([]);
  });

  it('round-trips a single-column table', () => {
    const rows = tableToRows([{ key: 'locale' }, { key: 'numeralSystem' }]);
    expect(rows).toEqual([['key'], ['"locale"'], ['"numeralSystem"']]);
    expect(rowsToTable<{ key: string }>(rows)).toEqual([{ key: 'locale' }, { key: 'numeralSystem' }]);
  });

  it('keeps every value type rather than stringifying it', () => {
    const rows = tableToRows([
      { n: 12.5, b: true, s: 'text', nothing: null, list: [1, 2], nested: { a: 1 } },
    ]);
    expect(rowsToTable<Record<string, unknown>>(rows)).toEqual([
      { n: 12.5, b: true, s: 'text', nothing: null, list: [1, 2], nested: { a: 1 } },
    ]);
  });

  it('fills a column a later record introduced with null for the earlier ones', () => {
    const rows = tableToRows([{ a: 1 }, { a: 2, b: 3 }]);
    expect(rowsToTable<Record<string, unknown>>(rows)).toEqual([{ a: 1, b: null }, { a: 2, b: 3 }]);
  });

  it('names the damaged cell rather than throwing a raw syntax error', () => {
    expect(() => rowsToTable([['id', 'name'], ['"acc-1"', '{"truncated']])).toThrow(
      'Backup file is not readable: the "name" value in row 1 is damaged.',
    );
  });
});

describe('serializeJson and parseJson', () => {
  it('round-trips every table of a full backup', () => {
    expect(parseJson(serializeJson(fullBackup))).toEqual(fullBackup);
  });

  it('round-trips arabic text and eastern numerals', () => {
    const data = emptyBackup({
      holdings: [{ ...holding, name: 'شقة في لشبونة' }],
      kv: { lastTotal: '١٢٨٠٠٠٠' },
    });
    const restored = parseJson(serializeJson(data));
    expect(restored.holdings[0].name).toBe('شقة في لشبونة');
    expect(restored.kv.lastTotal).toBe('١٢٨٠٠٠٠');
  });

  it('defaults a table the file predates to empty', () => {
    const restored = parseJson(JSON.stringify({ version: 1, holdings: [holding] }));
    expect(restored.snapshots).toEqual([]);
    expect(restored.kv).toEqual({});
  });

  it('rejects a file that is not json', () => {
    expect(() => parseJson('{not json')).toThrow('not valid JSON');
  });

  it('rejects a file with no version or no holdings', () => {
    expect(() => parseJson(JSON.stringify({ holdings: [] }))).toThrow('Unrecognised backup file.');
    expect(() => parseJson(JSON.stringify({ version: 2 }))).toThrow('Unrecognised backup file.');
  });

  it('rejects a table that is present but is not a list', () => {
    const text = JSON.stringify({ version: 2, holdings: [holding], snapshots: 'all of them' });
    expect(() => parseJson(text)).toThrow('"snapshots" is not a list.');
  });

  it('rejects a kv block that is not a table of settings', () => {
    const text = JSON.stringify({ version: 2, holdings: [holding], kv: ['locale'] });
    expect(() => parseJson(text)).toThrow('"kv" is not a table of settings.');
  });
});

describe('serializeCsv and parseCsvBackup', () => {
  it('round-trips every table of a full backup', () => {
    expect(parseCsvBackup(serializeCsv(fullBackup))).toEqual(fullBackup);
  });

  it('round-trips a cell containing commas, quotes, newlines and non-ascii text', () => {
    const data = emptyBackup({
      holdings: [holding],
      notes: [
        {
          id: 'note-1',
          kind: 'concentration',
          body: 'Stocks, crypto and "cash"\r\nacross two lines · ٪٦٢',
          detail: null,
          createdAt: '2026-10-20',
          read: false,
        },
      ],
    });
    expect(parseCsvBackup(serializeCsv(data)).notes[0].body).toBe(
      'Stocks, crypto and "cash"\r\nacross two lines · ٪٦٢',
    );
  });

  it('round-trips a backup whose tables are all empty', () => {
    const data = emptyBackup({ holdings: [holding] });
    expect(parseCsvBackup(serializeCsv(data))).toEqual(data);
  });

  it('rejects a file with no holdings block at all', () => {
    expect(() => parseCsvBackup('#TABLE:meta\r\nversion,exportedAt\r\n2,')).toThrow(
      'Unrecognised backup file.',
    );
  });

  it('accepts a holdings block that is present but empty', () => {
    const data = emptyBackup();
    expect(parseCsvBackup(serializeCsv(data))).toEqual(data);
  });

  it('names the damaged cell in a hand-edited csv', () => {
    const text = serializeCsv(emptyBackup({ holdings: [holding] })).replace('12.5', '12.5.5');
    expect(() => parseCsvBackup(text)).toThrow('is damaged');
  });
});

describe('assertPriceable', () => {
  it('accepts a backup whose holdings all have a quote', () => {
    expect(() => assertPriceable(fullBackup)).not.toThrow();
  });

  it('accepts a holding with no instrument that carries a dated mark', () => {
    const data = emptyBackup({
      holdings: [{ ...holding, id: 'hld-flat', instrumentId: null }],
      valuations: [
        { id: 'val-1', holdingId: 'hld-flat', date: '2026-10-01', value: 420000, currency: 'EUR' },
      ],
    });
    expect(() => assertPriceable(data)).not.toThrow();
  });

  it('refuses a backup that leaves a holding with neither a quote nor a mark', () => {
    const data = emptyBackup({ holdings: [{ ...holding, name: 'Apple' }] });
    expect(() => assertPriceable(data)).toThrow('missing a price or valuation for Apple');
  });

  it('refuses a backup whose quotes cover only some of the holdings', () => {
    const data = emptyBackup({
      holdings: [holding, { ...holding, id: 'hld-2', instrumentId: 'inst-2', name: 'Microsoft' }],
      priceQuotes: [{ instrumentId: 'inst-1', price: 256, asOf: '2026-10-22' }],
    });
    expect(() => assertPriceable(data)).toThrow('missing a price or valuation for Microsoft');
  });

  it('names the holding id when the holding has no name', () => {
    const data = emptyBackup({ holdings: [{ ...holding, instrumentId: null }] });
    expect(() => assertPriceable(data)).toThrow('for hld-1');
  });
});
