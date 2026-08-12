import type { DecimalDegrees, Place, Trip, TripPlace } from './types';

type PlaceRow = {
  id: number;
  name: string;
  description: string;
  visitlater: number;
  liked: number;
  latitude: number | null;
  longitude: number | null;
  photos: string;
  createdAt: string;
};

type TripRow = {
  id: number;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  current: number;
};

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

function parsePhotos(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function toDd(
  latitude: number | null,
  longitude: number | null,
): DecimalDegrees | null {
  if (latitude == null || longitude == null) {
    return null;
  }
  return { latitude, longitude };
}

export function mapPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    visitlater: Boolean(row.visitlater),
    liked: Boolean(row.liked),
    dd: toDd(row.latitude, row.longitude),
    photos: parsePhotos(row.photos),
    createdAt: row.createdAt,
  };
}

export function mapTrip(row: TripRow): Trip {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
    current: Boolean(row.current),
  };
}

export function mapTripPlace(row: TripPlaceRow): TripPlace {
  return {
    id: row.id,
    tripId: row.tripId,
    placeId: row.placeId,
    order: row.orderIndex,
    visited: Boolean(row.visited),
    visitDate: row.visitDate,
    notes: row.notes,
    photos: parsePhotos(row.photos),
  };
}

export function stringifyPhotos(photos: string[] | undefined): string {
  return JSON.stringify(photos ?? []);
}
