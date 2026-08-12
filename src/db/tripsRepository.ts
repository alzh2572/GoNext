import { getDatabase } from './database';
import { mapTrip } from './mappers';
import type { Trip, TripInput } from './types';

export async function getAllTrips(): Promise<Trip[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    title: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    current: number;
  }>('SELECT * FROM trips ORDER BY createdAt DESC, id DESC');
  return rows.map(mapTrip);
}

export async function getTripById(id: number): Promise<Trip | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: number;
    title: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    current: number;
  }>('SELECT * FROM trips WHERE id = ?', id);
  return row ? mapTrip(row) : null;
}

export async function getCurrentTrip(): Promise<Trip | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: number;
    title: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    current: number;
  }>('SELECT * FROM trips WHERE current = 1 ORDER BY id DESC LIMIT 1');
  return row ? mapTrip(row) : null;
}

async function clearCurrentFlag(db: Awaited<ReturnType<typeof getDatabase>>) {
  await db.runAsync('UPDATE trips SET current = 0 WHERE current = 1');
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const makeCurrent = Boolean(input.current);
  let tripId = 0;

  await db.withTransactionAsync(async () => {
    if (makeCurrent) {
      await clearCurrentFlag(db);
    }
    const result = await db.runAsync(
      `INSERT INTO trips (
        title, description, startDate, endDate, createdAt, current
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      input.title.trim(),
      input.description?.trim() ?? '',
      input.startDate ?? null,
      input.endDate ?? null,
      createdAt,
      makeCurrent ? 1 : 0,
    );
    tripId = Number(result.lastInsertRowId);
  });

  const trip = await getTripById(tripId);
  if (!trip) {
    throw new Error('Не удалось создать поездку');
  }
  return trip;
}

export async function updateTrip(id: number, input: TripInput): Promise<Trip> {
  const db = await getDatabase();
  const makeCurrent = Boolean(input.current);

  await db.withTransactionAsync(async () => {
    if (makeCurrent) {
      await clearCurrentFlag(db);
    }
    await db.runAsync(
      `UPDATE trips SET
        title = ?,
        description = ?,
        startDate = ?,
        endDate = ?,
        current = ?
      WHERE id = ?`,
      input.title.trim(),
      input.description?.trim() ?? '',
      input.startDate ?? null,
      input.endDate ?? null,
      makeCurrent ? 1 : 0,
      id,
    );
  });

  const trip = await getTripById(id);
  if (!trip) {
    throw new Error('Поездка не найдена');
  }
  return trip;
}

export async function setCurrentTrip(id: number): Promise<Trip> {
  const existing = await getTripById(id);
  if (!existing) {
    throw new Error('Поездка не найдена');
  }

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await clearCurrentFlag(db);
    await db.runAsync('UPDATE trips SET current = 1 WHERE id = ?', id);
  });

  const trip = await getTripById(id);
  if (!trip) {
    throw new Error('Поездка не найдена');
  }
  return trip;
}

export async function deleteTrip(id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM trips WHERE id = ?', id);
  if (result.changes === 0) {
    throw new Error('Поездка не найдена');
  }
}

export async function countTrips(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM trips',
  );
  return row?.count ?? 0;
}
