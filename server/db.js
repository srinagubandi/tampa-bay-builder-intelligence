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
CREATE TABLE IF NOT EXISTS permits (
  id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, source_permit_id TEXT UNIQUE,
  parcel_id TEXT, address TEXT, zip TEXT, permit_type TEXT, category TEXT,
  description TEXT, valuation INTEGER, issued_date TEXT, status TEXT,
  latitude REAL, longitude REAL, raw_json TEXT, fetched_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_permits_zip ON permits(zip);
CREATE INDEX IF NOT EXISTS idx_permits_issued ON permits(issued_date);
CREATE TABLE IF NOT EXISTS prospects (
  id INTEGER PRIMARY KEY AUTOINCREMENT, property_id INTEGER, address TEXT NOT NULL,
  zip TEXT, stage TEXT NOT NULL DEFAULT 'New Lead', priority TEXT DEFAULT 'Medium',
  estimated_value INTEGER, opportunity_score INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_prospects_stage ON prospects(stage);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, prospect_id INTEGER NOT NULL, name TEXT, role TEXT,
  email TEXT, phone TEXT, created_at TEXT NOT NULL,
  FOREIGN KEY(prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_contacts_prospect ON contacts(prospect_id);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, prospect_id INTEGER NOT NULL, body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notes_prospect ON notes(prospect_id);
`);

// Safe schema migrations for upgrades from older versions
try { db.exec(`ALTER TABLE markets ADD COLUMN waterfront_zip INTEGER DEFAULT 0`); } catch(_) {}
try { db.exec(`ALTER TABLE markets ADD COLUMN population_growth REAL DEFAULT 0`); } catch(_) {}

/* ------------------------------------------------------------------ *
 * Markets
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * Properties
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * API Cache Layer
 * ------------------------------------------------------------------ */

const cacheSelect = db.prepare(`SELECT response_json AS responseJson FROM api_cache WHERE cache_key=? AND expires_at>datetime('now')`);
const cacheUpsert = db.prepare(`INSERT INTO api_cache(cache_key,provider,response_json,fetched_at,expires_at)
  VALUES(@cacheKey,@provider,@responseJson,@fetchedAt,@expiresAt)
  ON CONFLICT(cache_key) DO UPDATE SET provider=excluded.provider,response_json=excluded.response_json,
    fetched_at=excluded.fetched_at,expires_at=excluded.expires_at`);

export function getCachedApiResponse(key) {
  if (!key) return null;
  const row = cacheSelect.get(String(key));
  if (!row) return null;
  try { return JSON.parse(row.responseJson); } catch { return null; }
}

export function setCachedApiResponse(key, provider, response, ttlHours = 168) {
  if (!key) return;
  const now = new Date();
  const expires = new Date(now.getTime() + Number(ttlHours) * 3600000);
  cacheUpsert.run({
    cacheKey: String(key), provider: String(provider || 'unknown'),
    responseJson: JSON.stringify(response ?? null),
    fetchedAt: now.toISOString(), expiresAt: expires.toISOString()
  });
}

export function purgeExpiredCache() {
  return db.prepare(`DELETE FROM api_cache WHERE expires_at<=datetime('now')`).run().changes;
}

/* ------------------------------------------------------------------ *
 * Refresh log
 * ------------------------------------------------------------------ */

const insertRefreshLog = db.prepare(`INSERT INTO refresh_log(source,status,message,created_at) VALUES(?,?,?,?)`);
export function logRefresh(source, status, message = '') {
  insertRefreshLog.run(source, status, String(message).slice(0, 2000), new Date().toISOString());
}
export function listRefreshLog(limit = 50) {
  return db.prepare(`SELECT id,source,status,message,created_at AS createdAt FROM refresh_log ORDER BY id DESC LIMIT ?`).all(Math.min(200, limit));
}

export function getExpiredPropertyKeys(limit = 100) {
  return db.prepare(`SELECT lookup_key AS lookupKey, address, zip FROM properties WHERE expires_at<=datetime('now') ORDER BY expires_at ASC LIMIT ?`).all(Math.min(500, limit));
}

/* ------------------------------------------------------------------ *
 * Permits
 * ------------------------------------------------------------------ */

const permitUpsert = db.prepare(`INSERT INTO permits(source,source_permit_id,parcel_id,address,zip,permit_type,category,description,valuation,issued_date,status,latitude,longitude,raw_json,fetched_at)
  VALUES(@source,@sourcePermitId,@parcelId,@address,@zip,@permitType,@category,@description,@valuation,@issuedDate,@status,@latitude,@longitude,@rawJson,@fetchedAt)
  ON CONFLICT(source_permit_id) DO UPDATE SET parcel_id=excluded.parcel_id,address=excluded.address,zip=excluded.zip,permit_type=excluded.permit_type,category=excluded.category,description=excluded.description,valuation=excluded.valuation,issued_date=excluded.issued_date,status=excluded.status,latitude=excluded.latitude,longitude=excluded.longitude,raw_json=excluded.raw_json,fetched_at=excluded.fetched_at`);

export const savePermits = db.transaction(rows => {
  let count = 0;
  for (const row of rows) {
    permitUpsert.run({
      source: row.source || 'unknown',
      sourcePermitId: row.sourcePermitId || `${row.source}:${row.address}:${row.issuedDate}`,
      parcelId: row.parcelId || null, address: row.address || null, zip: row.zip || null,
      permitType: row.permitType || null, category: row.category || null, description: row.description || null,
      valuation: row.valuation == null ? null : Math.round(Number(row.valuation)) || 0,
      issuedDate: row.issuedDate || null, status: row.status || null,
      latitude: row.latitude ?? null, longitude: row.longitude ?? null,
      rawJson: JSON.stringify(row.raw || {}), fetchedAt: new Date().toISOString()
    });
    count += 1;
  }
  return count;
});

export function getPermitsByZip(zip, { since, limit = 100 } = {}) {
  const clauses = ['zip=?'];
  const params = [zip];
  if (since) { clauses.push('issued_date>=?'); params.push(since); }
  params.push(Math.min(500, limit));
  return db.prepare(`SELECT id,source,parcel_id AS parcelId,address,zip,permit_type AS permitType,category,description,valuation,issued_date AS issuedDate,status,latitude,longitude FROM permits WHERE ${clauses.join(' AND ')} ORDER BY issued_date DESC LIMIT ?`).all(...params);
}

export function permitStatsByZip(zip, { since } = {}) {
  const clauses = ['zip=?'];
  const params = [zip];
  if (since) { clauses.push('issued_date>=?'); params.push(since); }
  const where = clauses.join(' AND ');
  const totals = db.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(valuation),0) AS totalValuation FROM permits WHERE ${where}`).get(...params);
  const byCategory = db.prepare(`SELECT category, COUNT(*) AS count, COALESCE(SUM(valuation),0) AS totalValuation FROM permits WHERE ${where} GROUP BY category ORDER BY count DESC`).all(...params);
  return { ...totals, byCategory };
}

/* ------------------------------------------------------------------ *
 * CRM: prospects / contacts / notes
 * ------------------------------------------------------------------ */

export const PROSPECT_STAGES = ['New Lead', 'Researching', 'Qualified', 'Contacted', 'Proposal', 'Won', 'Lost'];

const insertProspect = db.prepare(`INSERT INTO prospects(property_id,address,zip,stage,priority,estimated_value,opportunity_score,created_at,updated_at)
  VALUES(@propertyId,@address,@zip,@stage,@priority,@estimatedValue,@opportunityScore,@createdAt,@updatedAt)`);

export function createProspect(input) {
  const now = new Date().toISOString();
  const stage = PROSPECT_STAGES.includes(input.stage) ? input.stage : 'New Lead';
  const info = insertProspect.run({
    propertyId: input.propertyId ?? null, address: input.address, zip: input.zip ?? null,
    stage, priority: input.priority || 'Medium',
    estimatedValue: input.estimatedValue == null ? null : Math.round(Number(input.estimatedValue)) || 0,
    opportunityScore: input.opportunityScore == null ? null : Math.round(Number(input.opportunityScore)) || 0,
    createdAt: now, updatedAt: now
  });
  return getProspect(info.lastInsertRowid);
}

export function updateProspect(id, patch = {}) {
  const existing = db.prepare('SELECT * FROM prospects WHERE id=?').get(id);
  if (!existing) return null;
  const stage = patch.stage && PROSPECT_STAGES.includes(patch.stage) ? patch.stage : existing.stage;
  db.prepare('UPDATE prospects SET stage=?,priority=?,estimated_value=?,opportunity_score=?,updated_at=? WHERE id=?').run(
    stage,
    patch.priority ?? existing.priority,
    patch.estimatedValue == null ? existing.estimated_value : Math.round(Number(patch.estimatedValue)) || 0,
    patch.opportunityScore == null ? existing.opportunity_score : Math.round(Number(patch.opportunityScore)) || 0,
    new Date().toISOString(), id
  );
  return getProspect(id);
}

export function deleteProspect(id) {
  return db.prepare('DELETE FROM prospects WHERE id=?').run(id).changes > 0;
}

export function getProspect(id) {
  const row = db.prepare('SELECT id,property_id AS propertyId,address,zip,stage,priority,estimated_value AS estimatedValue,opportunity_score AS opportunityScore,created_at AS createdAt,updated_at AS updatedAt FROM prospects WHERE id=?').get(id);
  if (!row) return null;
  row.contacts = db.prepare('SELECT id,name,role,email,phone,created_at AS createdAt FROM contacts WHERE prospect_id=? ORDER BY id').all(id);
  row.notes = db.prepare('SELECT id,body,created_at AS createdAt FROM notes WHERE prospect_id=? ORDER BY id DESC').all(id);
  return row;
}

export function listProspects() {
  const rows = db.prepare('SELECT id,property_id AS propertyId,address,zip,stage,priority,estimated_value AS estimatedValue,opportunity_score AS opportunityScore,created_at AS createdAt,updated_at AS updatedAt FROM prospects ORDER BY updated_at DESC').all();
  const noteCounts = db.prepare('SELECT prospect_id AS pid, COUNT(*) AS c FROM notes GROUP BY prospect_id').all();
  const map = Object.fromEntries(noteCounts.map(n => [n.pid, n.c]));
  return rows.map(r => ({ ...r, noteCount: map[r.id] || 0 }));
}

export function addContact(prospectId, contact) {
  const info = db.prepare('INSERT INTO contacts(prospect_id,name,role,email,phone,created_at) VALUES(?,?,?,?,?,?)').run(
    prospectId, contact.name || null, contact.role || null, contact.email || null, contact.phone || null, new Date().toISOString()
  );
  return db.prepare('SELECT id,name,role,email,phone,created_at AS createdAt FROM contacts WHERE id=?').get(info.lastInsertRowid);
}

export function addNote(prospectId, body) {
  if (!body || !String(body).trim()) return null;
  const info = db.prepare('INSERT INTO notes(prospect_id,body,created_at) VALUES(?,?,?)').run(prospectId, String(body).trim(), new Date().toISOString());
  db.prepare('UPDATE prospects SET updated_at=? WHERE id=?').run(new Date().toISOString(), prospectId);
  return db.prepare('SELECT id,body,created_at AS createdAt FROM notes WHERE id=?').get(info.lastInsertRowid);
}

export default db;
