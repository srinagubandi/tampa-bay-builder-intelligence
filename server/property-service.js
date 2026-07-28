// server/property-service.js
// Workstream 1: Property Aggregation Service.
// Accepts an address, checks the local cache, otherwise fetches from ATTOM + RentCast
// concurrently, merges the results, enriches with FEMA flood data, scores the property
// and persists a unified record back to SQLite.

import {
  getFreshProperty, saveProperty, getMarket,
  getCachedApiResponse, setCachedApiResponse
} from './db.js';
import {
  geocodeAddress, fetchAttomProperty, fetchRentCastProperty, fetchFemaFloodZone,
  mockEnabled, mockAttomProperty, mockRentCastProperty
} from './providers.js';

// Cache TTLs (hours) per the data-pipeline handoff.
const TTL = {
  geocode: 30 * 24,   // Census geocode: 30 days
  flood: 30 * 24,     // FEMA flood data: 30 days
  property: 7 * 24    // ATTOM / RentCast property detail: 7 days
};

// Normalize an address string into a stable lookup key.
export function normalizeAddress(address) {
  return String(address || '')
    .toLowerCase()
    .replace(/[.,#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Very light US-address parser: "123 Main St, Tampa, FL 33602".
export function parseAddress(address) {
  const raw = String(address || '').trim();
  const zipMatch = raw.match(/\b(\d{5})(?:-\d{4})?\b/);
  const zip = zipMatch ? zipMatch[1] : '';
  const stateMatch = raw.match(/\b([A-Za-z]{2})\b(?=\s*\d{5}|\s*$)/);
  const state = (stateMatch ? stateMatch[1] : 'FL').toUpperCase();
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
  const street = parts[0] || raw;
  const city = parts.length >= 2 ? parts[1].replace(/\b[A-Za-z]{2}\b\s*\d{5}.*/, '').trim() : '';
  return { street, city, state, zip };
}

async function cachedGeocode(parsed) {
  const key = `geocode:${normalizeAddress(`${parsed.street} ${parsed.zip}`)}`;
  const cached = getCachedApiResponse(key);
  if (cached !== null) return cached;
  const result = await geocodeAddress(parsed);
  setCachedApiResponse(key, 'census-geocode', result, TTL.geocode);
  return result;
}

async function cachedFlood(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const key = `fema:${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = getCachedApiResponse(key);
  if (cached !== null) return cached;
  const result = await fetchFemaFloodZone(latitude, longitude);
  setCachedApiResponse(key, 'fema', result, TTL.flood);
  return result;
}

// Failure-isolated provider call: never throws, returns { data, error }.
async function safeProvider(name, fn) {
  try {
    return { name, data: await fn(), error: null };
  } catch (error) {
    return { name, data: null, error: error.message || String(error) };
  }
}

async function cachedAttom(parsed) {
  const key = `attom:${normalizeAddress(`${parsed.street} ${parsed.zip}`)}`;
  const cached = getCachedApiResponse(key);
  if (cached !== null) return cached;
  let data = await fetchAttomProperty(parsed);
  if (!data && mockEnabled()) data = mockAttomProperty(parsed);
  setCachedApiResponse(key, 'attom', data, TTL.property);
  return data;
}

async function cachedRentCast(address) {
  const key = `rentcast:${normalizeAddress(address)}`;
  const cached = getCachedApiResponse(key);
  if (cached !== null) return cached;
  let data = await fetchRentCastProperty(address);
  if (!data && mockEnabled()) data = mockRentCastProperty(address);
  setCachedApiResponse(key, 'rentcast', data, TTL.property);
  return data;
}

// Merge ATTOM (structural precedence) + RentCast (valuation precedence).
function mergeProviders(attom, rentcast, parsed, geo) {
  const pick = (...vals) => vals.find(v => v !== null && v !== undefined && v !== '');
  const sources = [];
  if (attom) sources.push(attom.source);
  if (rentcast) sources.push(rentcast.source);
  if (geo) sources.push(geo.source);

  return {
    providerId: pick(attom?.providerId, rentcast?.providerId),
    parcelId: pick(attom?.parcelId, rentcast?.parcelId),
    address: pick(attom?.address, rentcast?.address, geo?.matchedAddress, `${parsed.street}, ${parsed.city} ${parsed.state} ${parsed.zip}`.trim()),
    city: parsed.city || null,
    state: parsed.state || 'FL',
    zip: parsed.zip || null,
    county: pick(attom?.county, rentcast?.county),
    latitude: pick(attom?.latitude, rentcast?.latitude, geo?.latitude),
    longitude: pick(attom?.longitude, rentcast?.longitude, geo?.longitude),
    // Structural data — ATTOM takes precedence.
    propertyType: pick(attom?.propertyType, rentcast?.propertyType),
    bedrooms: pick(attom?.bedrooms, rentcast?.bedrooms),
    bathrooms: pick(attom?.bathrooms, rentcast?.bathrooms),
    squareFeet: pick(attom?.squareFeet, rentcast?.squareFeet),
    lotSquareFeet: pick(attom?.lotSquareFeet, rentcast?.lotSquareFeet),
    yearBuilt: pick(attom?.yearBuilt, rentcast?.yearBuilt),
    lastSaleDate: pick(attom?.lastSaleDate, rentcast?.lastSaleDate),
    lastSalePrice: pick(attom?.lastSalePrice, rentcast?.lastSalePrice),
    assessedValue: pick(attom?.assessedValue, rentcast?.assessedValue),
    // Valuation — RentCast takes precedence.
    estimatedValue: pick(rentcast?.estimatedValue, attom?.estimatedValue, attom?.assessedValue),
    ownerOccupied: pick(attom?.ownerOccupied, rentcast?.ownerOccupied),
    sources: [...new Set(sources)],
    raw: { attom: attom?.raw || null, rentcast: rentcast?.raw || null }
  };
}

/**
 * Look up (and cache) a full property record for an address.
 * @param {string} address
 * @param {{ force?: boolean }} options
 */
export async function lookupProperty(address, { force = false } = {}) {
  if (!address || !String(address).trim()) throw new Error('address is required');
  const parsed = parseAddress(address);
  const lookupKey = normalizeAddress(address);

  // 1. Cache hit on the local properties table.
  if (!force) {
    const fresh = getFreshProperty(lookupKey);
    if (fresh) return { property: fresh, cached: true, providers: {} };
  }

  // 2. Geocode (cached) — non-fatal if it fails.
  const geoResult = await safeProvider('geocode', () => cachedGeocode(parsed));
  const geo = geoResult.data;

  // 3. Concurrent, failure-isolated provider fetch.
  const [attomResult, rentcastResult] = await Promise.all([
    safeProvider('attom', () => cachedAttom(parsed)),
    safeProvider('rentcast', () => cachedRentCast(address))
  ]);

  const attom = attomResult.data;
  const rentcast = rentcastResult.data;

  if (!attom && !rentcast && !geo) {
    const err = attomResult.error || rentcastResult.error || 'No provider returned data for this address';
    const noDataError = new Error(err);
    noDataError.code = 'NO_PROVIDER_DATA';
    throw noDataError;
  }

  // 4. Merge providers.
  const merged = mergeProviders(attom, rentcast, parsed, geo);

  // 5. FEMA flood enrichment (cached).
  const floodResult = await safeProvider('fema', () => cachedFlood(merged.latitude, merged.longitude));
  const flood = floodResult.data;
  merged.floodZone = flood?.floodZone ?? null;
  merged.floodZoneSubtype = flood?.zoneSubtype ?? null;
  merged.sfha = flood?.specialFloodHazardArea ?? null;
  merged.baseFloodElevation = flood?.baseFloodElevation ?? null;
  if (flood) merged.sources.push('fema');

  merged.lookupKey = lookupKey;

  // 6. Persist (ttl 7 days) and return the hydrated + scored record.
  const property = saveProperty(merged, TTL.property);
  return {
    property,
    cached: false,
    providers: {
      attom: attomResult.error ? { error: attomResult.error } : { ok: Boolean(attom) },
      rentcast: rentcastResult.error ? { error: rentcastResult.error } : { ok: Boolean(rentcast) },
      geocode: geoResult.error ? { error: geoResult.error } : { ok: Boolean(geo) },
      fema: floodResult.error ? { error: floodResult.error } : { ok: Boolean(flood) }
    }
  };
}
