import * as SQLite from 'expo-sqlite';

import { migrate } from './schema';

const DATABASE_NAME = 'patina.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync('PRAGMA journal_mode = WAL;\nPRAGMA foreign_keys = ON;');
  await migrate(database);
  return database;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) databasePromise = openDatabase();
  return databasePromise;
}

export type Database = SQLite.SQLiteDatabase;
