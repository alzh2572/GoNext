import { getDatabase } from './database';
import { mapPlace, stringifyPhotos } from './mappers';
import type { Place, PlaceInput } from './types';

export async function getAllPlaces(): Promise<Place[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    description: string;
    visitlater: number;
    liked: number;
    latitude: number | null;
    longitude: number | null;
    photos: string;
    createdAt: string;
  }>('SELECT * FROM places ORDER BY createdAt DESC, id DESC');
  return rows.map(mapPlace);
}

export async function getPlaceById(id: number): Promise<Place | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: number;
    name: string;
    description: string;
    visitlater: number;
    liked: number;
    latitude: number | null;
    longitude: number | null;
    photos: string;
    createdAt: string;
  }>('SELECT * FROM places WHERE id = ?', id);
  return row ? mapPlace(row) : null;
}

export async function createPlace(input: PlaceInput): Promise<Place> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO places (
      name, description, visitlater, liked, latitude, longitude, photos, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.name.trim(),
    input.description?.trim() ?? '',
    input.visitlater ? 1 : 0,
    input.liked ? 1 : 0,
    input.dd?.latitude ?? null,
    input.dd?.longitude ?? null,
    stringifyPhotos(input.photos),
    createdAt,
  );

  const place = await getPlaceById(Number(result.lastInsertRowId));
  if (!place) {
    throw new Error('Не удалось создать место');
  }
  return place;
}

export async function updatePlace(
  id: number,
  input: PlaceInput,
): Promise<Place> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE places SET
      name = ?,
      description = ?,
      visitlater = ?,
      liked = ?,
      latitude = ?,
      longitude = ?,
      photos = ?
    WHERE id = ?`,
    input.name.trim(),
    input.description?.trim() ?? '',
    input.visitlater ? 1 : 0,
    input.liked ? 1 : 0,
    input.dd?.latitude ?? null,
    input.dd?.longitude ?? null,
    stringifyPhotos(input.photos),
    id,
  );

  const place = await getPlaceById(id);
  if (!place) {
    throw new Error('Место не найдено');
  }
  return place;
}

export async function deletePlace(id: number): Promise<void> {
  const db = await getDatabase();
  try {
    const result = await db.runAsync('DELETE FROM places WHERE id = ?', id);
    if (result.changes === 0) {
      throw new Error('Место не найдено');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('foreign key')) {
      throw new Error(
        'Нельзя удалить место: оно используется в одной из поездок',
      );
    }
    throw error;
  }
}

export async function countPlaces(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM places',
  );
  return row?.count ?? 0;
}
