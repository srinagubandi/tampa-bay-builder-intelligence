import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { scoreMarket, scoreProperty } from './scoring.js';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'markets.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS markets (
  zip TEXT PRIMARY KEY, county TEXT, city TEXT, latitude REAL, longitude REAL,
  population INTEGER, income INTEGER, home_value INTEGER, owner_occupied REAL,
  median_year_built INTEGER, luxury_share REAL,
  waterfront_zip INTEGER DEFAULT 0,
  population_growth REAL DEFAULT 0,
  data_year INTEGER, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT, lookup_key TEXT UNIQUE NOT NULL, provider_id TEXT,
  parcel_id TEXT, address TEXT NOT NULL, city TEXT, state TEXT, zip TEXT, county TEXT,
  latitude REAL, longitude REAL, property_type TEXT, bedrooms REAL, bathrooms REAL,
  square_feet INTEGER, lot_square_feet INTEGER, year_built INTEGER, last_sale_date TEXT,
  last_sale_price INTEGER, assessed_value INTEGER, estimated_value INTEGER,
  owner_occupied INTEGER, flood_zone TEXT, flood_zone_subtype TEXT, sfha INTEGER,
  base_flood_elevation REAL, sources_json TEXT, raw_json TEXT, fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(address);
CREATE INDEX IF NOT EXISTS idx_properties_parcel ON properties(parcel_id);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip);
CREATE TABLE IF NOT EXISTS refresh_log(id INTEGER PRIMARY KEY, source TEXT, status TEXT, message TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS api_cache (
  cache_key TEXT PRIMARY KEY, provider TEXT NOT NULL, response_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL, expires_at TEXT NOT NULL
);
`);

// Add new columns if upgrading from old schema
try { db.exec(`ALTER TABLE markets ADD COLUMN waterfront_zip INTEGER DEFAULT 0`); } catch(_) {}
try { db.exec(`ALTER TABLE markets ADD COLUMN population_growth REAL DEFAULT 0`); } catch(_) {}

const upsert = db.prepare(`
  INSERT INTO markets(zip,county,city,latitude,longitude,population,income,home_value,
    owner_occupied,median_year_built,luxury_share,waterfront_zip,population_growth,data_year,updated_at)
  VALUES(@zip,@county,@city,@latitude,@longitude,@population,@income,@homeValue,
    @ownerOccupied,@medianYearBuilt,@luxuryShare,@waterfrontZip,@populationGrowth,@dataYear,@updatedAt)
  ON CONFLICT(zip) DO UPDATE SET
    county=excluded.county,city=excluded.city,latitude=excluded.latitude,longitude=excluded.longitude,
    population=excluded.population,income=excluded.income,home_value=excluded.home_value,
    owner_occupied=excluded.owner_occupied,median_year_built=excluded.median_year_built,
    luxury_share=excluded.luxury_share,waterfront_zip=excluded.waterfront_zip,
    population_growth=excluded.population_growth,data_year=excluded.data_year,updated_at=excluded.updated_at
`);
export const upsertMany = db.transaction(rows => rows.forEach(row => upsert.run(row)));

const MARKET_SELECT = `SELECT zip,county,city,latitude,longitude,population,income,
  home_value AS homeValue,owner_occupied AS ownerOccupied,
  median_year_built AS medianYearBuilt,luxury_share AS luxuryShare,
  waterfront_zip AS waterfrontZip,population_growth AS populationGrowth,
  data_year AS dataYear FROM markets`;

export function listMarkets() {
  return db.prepare(`${MARKET_SELECT} ORDER BY zip`).all()
    .map(row => ({ ...row, ...scoreMarket(row) }));
}

export function getMarket(zip) {
  if (!zip) return null;
  const row = db.prepare(`${MARKET_SELECT} WHERE zip=?`).get(zip);
  return row ? { ...row, ...scoreMarket(row) } : null;
}

export function countMarkets() {
  return db.prepare('SELECT COUNT(*) AS n FROM markets').get().n;
}

const propertySelect = `SELECT id,lookup_key AS lookupKey,provider_id AS providerId,parcel_id AS parcelId,
  address,city,state,zip,county,latitude,longitude,property_type AS propertyType,bedrooms,bathrooms,
  square_feet AS squareFeet,lot_square_feet AS lotSquareFeet,year_built AS yearBuilt,
  last_sale_date AS lastSaleDate,last_sale_price AS lastSalePrice,assessed_value AS assessedValue,
  estimated_value AS estimatedValue,owner_occupied AS ownerOccupied,flood_zone AS floodZone,
  flood_zone_subtype AS floodZoneSubtype,sfha,base_flood_elevation AS baseFloodElevation,
  sources_json AS sourcesJson,raw_json AS rawJson,fetched_at AS fetchedAt,expires_at AS expiresAt
  FROM properties`;

function hydrateProperty(row) {
  if (!row) return null;
  const property = {
    ...row,
    ownerOccupied: row.ownerOccupied == null ? null : Boolean(row.ownerOccupied),
    sfha: row.sfha == null ? null : Boolean(row.sfha),
    sources: JSON.parse(row.sourcesJson || '[]')
  };
  delete property.sourcesJson;
  delete property.rawJson;
  return { ...property, scores: scoreProperty({ ...property, lotSqFt: property.lotSquareFeet }, getMarket(property.zip) || {}) };
}

export function getPropertyById(id) { return hydrateProperty(db.prepare(`${propertySelect} WHERE id=?`).get(id)); }
export function getFreshProperty(lookupKey) { return hydrateProperty(db.prepare(`${propertySelect} WHERE lookup_key=? AND expires_at>datetime('now')`).get(lookupKey)); }
export function searchStoredProperties(query, limit = 20) {
  const like = `%${query}%`;
  return db.prepare(`${propertySelect} WHERE address LIKE ? OR parcel_id LIKE ? ORDER BY fetched_at DESC LIMIT ?`).all(like, like, Math.min(100, limit)).map(hydrateProperty);
}

const savePropertyStatement = db.prepare(`
  INSERT INTO properties(lookup_key,provider_id,parcel_id,address,city,state,zip,county,
    latitude,longitude,property_type,bedrooms,bathrooms,square_feet,lot_square_feet,year_built,
    last_sale_date,last_sale_price,assessed_value,estimated_value,owner_occupied,flood_zone,
    flood_zone_subtype,sfha,base_flood_elevation,sources_json,raw_json,fetched_at,expires_at)
  VALUES(@lookupKey,@providerId,@parcelId,@address,@city,@state,@zip,@county,
    @latitude,@longitude,@propertyType,@bedrooms,@bathrooms,@squareFeet,@lotSquareFeet,@yearBuilt,
    @lastSaleDate,@lastSalePrice,@assessedValue,@estimatedValue,@ownerOccupied,@floodZone,
    @floodZoneSubtype,@sfha,@baseFloodElevation,@sourcesJson,@rawJson,@fetchedAt,@expiresAt)
  ON CONFLICT(lookup_key) DO UPDATE SET
    provider_id=excluded.provider_id,parcel_id=excluded.parcel_id,address=excluded.address,
    city=excluded.city,state=excluded.state,zip=excluded.zip,county=excluded.county,
    latitude=excluded.latitude,longitude=excluded.longitude,property_type=excluded.property_type,
    bedrooms=excluded.bedrooms,bathrooms=excluded.bathrooms,square_feet=excluded.square_feet,
    lot_square_feet=excluded.lot_square_feet,year_built=excluded.year_built,
    last_sale_date=excluded.last_sale_date,last_sale_price=excluded.last_sale_price,
    assessed_value=excluded.assessed_value,estimated_value=excluded.estimated_value,
    owner_occupied=excluded.owner_occupied,flood_zone=excluded.flood_zone,
    flood_zone_subtype=excluded.flood_zone_subtype,sfha=excluded.sfha,
    base_flood_elevation=excluded.base_flood_elevation,sources_json=excluded.sources_json,
    raw_json=excluded.raw_json,fetched_at=excluded.fetched_at,expires_at=excluded.expires_at
`);

export function saveProperty(property, ttlHours = 168) {
  const now = new Date();
  const expires = new Date(now.getTime() + ttlHours * 3600000);
  savePropertyStatement.run({
    ...property,
    ownerOccupied: property.ownerOccupied == null ? null : Number(Boolean(property.ownerOccupied)),
    sfha: property.sfha == null ? null : Number(Boolean(property.sfha)),
    sourcesJson: JSON.stringify(property.sources || []),
    rawJson: JSON.stringify(property.raw || {}),
    fetchedAt: now.toISOString(),
    expiresAt: expires.toISOString()
  });
  return getFreshProperty(property.lookupKey);
}

export function getCachedApiResponse(key) {
  return db.prepare(`SELECT response_json FROM api_cache WHERE cache_key=? AND expires_at>datetime('now')`).get(key);
}

export function setCachedApiResponse(key, provider, responseJson, ttlHours = 24) {
  const now = new Date();
  const expires = new Date(now.getTime() + ttlHours * 3600000);
  db.prepare(`INSERT INTO api_cache(cache_key,provider,response_json,fetched_at,expires_at)
    VALUES(?,?,?,?,?)
    ON CONFLICT(cache_key) DO UPDATE SET provider=excluded.provider,response_json=excluded.response_json,
    fetched_at=excluded.fetched_at,expires_at=excluded.expires_at`
  ).run(key, provider, responseJson, now.toISOString(), expires.toISOString());
}

export default db;
