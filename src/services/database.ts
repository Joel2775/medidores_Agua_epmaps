import * as SQLite from 'expo-sqlite';

import type { MeterReadingRecord, ReadingStatus } from '@/types';

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

async function openDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await SQLite.openDatabaseAsync('medidores-agua.db');
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS pending_readings (
          id TEXT PRIMARY KEY NOT NULL,
          meterId TEXT NOT NULL,
          meterCode TEXT NOT NULL,
          readingValue REAL,
          condition TEXT NOT NULL CHECK (condition IN ('normal', 'inaccesible', 'dañado')),
          reasonOrDamageDescription TEXT NOT NULL DEFAULT '',
          photoUri TEXT,
          isAnomalous INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL CHECK (status IN ('pending_verification', 'pending_sync', 'syncing', 'synced')),
          createdAt TEXT NOT NULL,
          monthYear TEXT NOT NULL,
          UNIQUE (meterId, monthYear)
        );
        CREATE INDEX IF NOT EXISTS pending_readings_status_idx ON pending_readings(status);
      `);
      await database.runAsync(
        "UPDATE pending_readings SET status = 'pending_sync' WHERE status = 'syncing'"
      );
      return database;
    })();
  }

  return databasePromise;
}

function mapReading(row: Omit<MeterReadingRecord, 'isAnomalous'> & { isAnomalous: number }) {
  return { ...row, isAnomalous: Boolean(row.isAnomalous) } satisfies MeterReadingRecord;
}

export async function saveReading(record: MeterReadingRecord) {
  const database = await openDatabase();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const duplicate = await transaction.getFirstAsync<{ id: string }>(
      'SELECT id FROM pending_readings WHERE meterId = ? AND monthYear = ?',
      record.meterId,
      record.monthYear
    );
    if (duplicate) {
      throw new Error('Ya existe una lectura registrada para este medidor durante este mes.');
    }

    await transaction.runAsync(
      `INSERT INTO pending_readings (
        id, meterId, meterCode, readingValue, condition, reasonOrDamageDescription,
        photoUri, isAnomalous, status, createdAt, monthYear
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      record.id,
      record.meterId,
      record.meterCode,
      record.readingValue,
      record.condition,
      record.reasonOrDamageDescription,
      record.photoUri,
      Number(record.isAnomalous),
      record.status,
      record.createdAt,
      record.monthYear
    );
  });
}

export async function getReadings() {
  const database = await openDatabase();
  const rows = await database.getAllAsync<
    Omit<MeterReadingRecord, 'isAnomalous'> & { isAnomalous: number }
  >('SELECT * FROM pending_readings ORDER BY createdAt DESC');
  return rows.map(mapReading);
}

export async function getPendingReadings() {
  const database = await openDatabase();
  const rows = await database.getAllAsync<
    Omit<MeterReadingRecord, 'isAnomalous'> & { isAnomalous: number }
  >(
    "SELECT * FROM pending_readings WHERE status IN ('pending_verification', 'pending_sync') ORDER BY createdAt ASC"
  );
  return rows.map(mapReading);
}

export async function getPendingCount() {
  const database = await openDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM pending_readings WHERE status IN ('pending_verification', 'pending_sync', 'syncing')"
  );
  return result?.count ?? 0;
}

export async function setReadingStatus(id: string, status: ReadingStatus) {
  const database = await openDatabase();
  await database.runAsync('UPDATE pending_readings SET status = ? WHERE id = ?', status, id);
}

export async function updatePendingReadingValue(id: string, readingValue: number) {
  const database = await openDatabase();
  const result = await database.runAsync(
    `UPDATE pending_readings SET readingValue = ?
     WHERE id = ? AND status IN ('pending_verification', 'pending_sync')`,
    readingValue,
    id
  );

  if (result.changes === 0) {
    throw new Error('Esta lectura ya fue enviada y no se puede editar.');
  }
}
