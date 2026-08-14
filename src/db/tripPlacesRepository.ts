import { getDatabase } from './database';
import { mapPlace, mapTripPlace, stringifyPhotos } from './mappers';
import type { TripPlace, TripPlaceInput, TripPlaceWithPlace } from './types';

type TripPlaceRow = {
  id: number;
  tripId: number;
  placeId: number;
  orderIndex: number;
  visited: number;
  visitDate: string | null;
  notes: string;
  photos: string;
};

export async function getTripPlaces(tripId: number): Promise<TripPlace[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TripPlaceRow>(
    `SELECT * FROM trip_places
     WHERE tripId = ?
     ORDER BY orderIndex ASC, id ASC`,
    tripId,
  );
  return rows.map(mapTripPlace);
}

export async function getTripPlacesWithPlace(
  tripId: number,
): Promise<TripPlaceWithPlace[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<
    TripPlaceRow & {
      place_id: number;
      name: string;
      description: string;
      visitlater: number;
      liked: number;
      latitude: number | null;
      longitude: number | null;
      place_photos: string;
      place_createdAt: string;
    }
  >(
    `SELECT
       tp.*,
       p.id as place_id,
       p.name,
       p.description,
       p.visitlater,
       p.liked,
       p.latitude,
       p.longitude,
       p.photos as place_photos,
       p.createdAt as place_createdAt
     FROM trip_places tp
     INNER JOIN places p ON p.id = tp.placeId
     WHERE tp.tripId = ?
     ORDER BY tp.orderIndex ASC, tp.id ASC`,
    tripId,
  );

  return rows.map((row) => ({
    ...mapTripPlace(row),
    place: mapPlace({
      id: row.place_id,
      name: row.name,
      description: row.description,
      visitlater: row.visitlater,
      liked: row.liked,
      latitude: row.latitude,
      longitude: row.longitude,
      photos: row.place_photos,
      createdAt: row.place_createdAt,
    }),
  }));
}

export async function getTripPlaceById(id: number): Promise<TripPlace | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TripPlaceRow>(
    'SELECT * FROM trip_places WHERE id = ?',
    id,
  );
  return row ? mapTripPlace(row) : null;
}

export async function getTripPlaceWithPlace(
  id: number,
): Promise<TripPlaceWithPlace | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<
    TripPlaceRow & {
      place_id: number;
      name: string;
      description: string;
      visitlater: number;
      liked: number;
      latitude: number | null;
      longitude: number | null;
      place_photos: string;
      place_createdAt: string;
    }
  >(
    `SELECT
       tp.*,
       p.id as place_id,
       p.name,
       p.description,
       p.visitlater,
       p.liked,
       p.latitude,
       p.longitude,
       p.photos as place_photos,
       p.createdAt as place_createdAt
     FROM trip_places tp
     INNER JOIN places p ON p.id = tp.placeId
     WHERE tp.id = ?`,
    id,
  );

  if (!row) {
    return null;
  }

  return {
    ...mapTripPlace(row),
    place: mapPlace({
      id: row.place_id,
      name: row.name,
      description: row.description,
      visitlater: row.visitlater,
      liked: row.liked,
      latitude: row.latitude,
      longitude: row.longitude,
      photos: row.place_photos,
      createdAt: row.place_createdAt,
    }),
  };
}

export async function getNextOrder(tripId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ nextOrder: number | null }>(
    'SELECT MAX(orderIndex) + 1 as nextOrder FROM trip_places WHERE tripId = ?',
    tripId,
  );
  return row?.nextOrder ?? 0;
}

export async function getTripPlaceStats(): Promise<
  Record<number, { total: number; visited: number }>
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    tripId: number;
    total: number;
    visited: number;
  }>(
    `SELECT
       tripId,
       COUNT(*) as total,
       SUM(CASE WHEN visited = 1 THEN 1 ELSE 0 END) as visited
     FROM trip_places
     GROUP BY tripId`,
  );

  return Object.fromEntries(
    rows.map((row) => [
      row.tripId,
      { total: row.total, visited: row.visited },
    ]),
  );
}

export async function addTripPlace(input: TripPlaceInput): Promise<TripPlace> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO trip_places (
      tripId, placeId, orderIndex, visited, visitDate, notes, photos
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.tripId,
    input.placeId,
    input.order,
    input.visited ? 1 : 0,
    input.visitDate ?? null,
    input.notes?.trim() ?? '',
    stringifyPhotos(input.photos),
  );

  const tripPlace = await getTripPlaceById(Number(result.lastInsertRowId));
  if (!tripPlace) {
    throw new Error('Не удалось добавить место в поездку');
  }
  return tripPlace;
}

export async function updateTripPlace(
  id: number,
  input: Partial<Omit<TripPlaceInput, 'tripId' | 'placeId'>>,
): Promise<TripPlace> {
  const existing = await getTripPlaceById(id);
  if (!existing) {
    throw new Error('Место поездки не найдено');
  }

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE trip_places SET
      orderIndex = ?,
      visited = ?,
      visitDate = ?,
      notes = ?,
      photos = ?
    WHERE id = ?`,
    input.order ?? existing.order,
    (input.visited ?? existing.visited) ? 1 : 0,
    input.visitDate === undefined ? existing.visitDate : input.visitDate,
    input.notes?.trim() ?? existing.notes,
    stringifyPhotos(input.photos ?? existing.photos),
    id,
  );

  const tripPlace = await getTripPlaceById(id);
  if (!tripPlace) {
    throw new Error('Место поездки не найдено');
  }
  return tripPlace;
}

export async function reorderTripPlaces(
  tripId: number,
  orderedIds: number[],
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await db.runAsync(
        'UPDATE trip_places SET orderIndex = ? WHERE id = ? AND tripId = ?',
        index,
        orderedIds[index],
        tripId,
      );
    }
  });
}

export async function deleteTripPlace(id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM trip_places WHERE id = ?', id);
  if (result.changes === 0) {
    throw new Error('Место поездки не найдено');
  }
}

/** Первое непосещённое место текущей поездки (для режима «Следующее место»). */
export async function getNextTripPlace(
  tripId: number,
): Promise<TripPlaceWithPlace | null> {
  const places = await getTripPlacesWithPlace(tripId);
  return places.find((item) => !item.visited) ?? null;
}
