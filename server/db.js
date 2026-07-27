import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { scoreMarket } from './scoring.js';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'markets.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS markets (
 zip TEXT PRIMARY KEY, county TEXT, city TEXT, latitude REAL, longitude REAL,
 population INTEGER, income INTEGER, home_value INTEGER, owner_occupied REAL,
 median_year_built INTEGER, luxury_share REAL, data_year INTEGER, updated_at TEXT
); CREATE TABLE IF NOT EXISTS refresh_log(id INTEGER PRIMARY KEY, source TEXT, status TEXT, message TEXT, created_at TEXT);`);

const upsert = db.prepare(`INSERT INTO markets(zip,county,city,latitude,longitude,population,income,home_value,owner_occupied,median_year_built,luxury_share,data_year,updated_at)
VALUES(@zip,@county,@city,@latitude,@longitude,@population,@income,@homeValue,@ownerOccupied,@medianYearBuilt,@luxuryShare,@dataYear,@updatedAt)
ON CONFLICT(zip) DO UPDATE SET county=excluded.county,city=excluded.city,latitude=excluded.latitude,longitude=excluded.longitude,population=excluded.population,income=excluded.income,home_value=excluded.home_value,owner_occupied=excluded.owner_occupied,median_year_built=excluded.median_year_built,luxury_share=excluded.luxury_share,data_year=excluded.data_year,updated_at=excluded.updated_at`);
export const upsertMany = db.transaction(rows => rows.forEach(row => upsert.run(row)));

export function listMarkets() {
 return db.prepare('SELECT zip,county,city,latitude,longitude,population,income,home_value AS homeValue,owner_occupied AS ownerOccupied,median_year_built AS medianYearBuilt,luxury_share AS luxuryShare,data_year AS dataYear FROM markets ORDER BY zip').all().map(row => ({...row,...scoreMarket(row)}));
}
