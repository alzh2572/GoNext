import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'gonext.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      visitlater INTEGER NOT NULL DEFAULT 0,
      liked INTEGER NOT NULL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      photos TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      startDate TEXT,
      endDate TEXT,
      createdAt TEXT NOT NULL,
      current INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS trip_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      tripId INTEGER NOT NULL,
      placeId INTEGER NOT NULL,
      orderIndex INTEGER NOT NULL,
      visited INTEGER NOT NULL DEFAULT 0,
      visitDate TEXT,
      notes TEXT NOT NULL DEFAULT '',
      photos TEXT NOT NULL DEFAULT '[]',
      FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (placeId) REFERENCES places(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_trip_places_tripId ON trip_places(tripId);
    CREATE INDEX IF NOT EXISTS idx_trip_places_placeId ON trip_places(placeId);
    CREATE INDEX IF NOT EXISTS idx_trips_current ON trips(current);
  `);
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await migrate(db);
      await db.execAsync('PRAGMA foreign_keys = ON;');
      return db;
    })();
  }
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  await getDatabase();
}

export async function resetAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM trip_places;
    DELETE FROM trips;
    DELETE FROM places;
    PRAGMA foreign_keys = ON;
  `);
}
