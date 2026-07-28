const timeoutMs = Number(process.env.API_TIMEOUT_MS || 12000);

async function getJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
    if (!response.ok) {
      const error = new Error(`${options.provider || 'API'} request failed (${response.status})`);
      error.status = response.status;
      error.details = body;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

export function configuredProviders() {
  return {
    census: true,
    fema: true,
    rentcast: Boolean(process.env.RENTCAST_API_KEY),
    attom: Boolean(process.env.ATTOM_API_KEY),
    mock: mockEnabled()
  };
}

// When no paid API keys are configured we fall back to deterministic mock data so the
// pipeline can be exercised end-to-end. Disable by setting MOCK_PROVIDERS=0.
export function mockEnabled() {
  if (process.env.MOCK_PROVIDERS === '0' || process.env.MOCK_PROVIDERS === 'false') return false;
  if (process.env.MOCK_PROVIDERS === '1' || process.env.MOCK_PROVIDERS === 'true') return true;
  // Default: enable mocks only when neither real provider key is present.
  return !process.env.ATTOM_API_KEY && !process.env.RENTCAST_API_KEY;
}

// Simple deterministic hash so mock values are stable for a given address.
function hashString(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) { hash = (hash * 31 + text.charCodeAt(i)) >>> 0; }
  return hash;
}

export function mockAttomProperty({ street, city, state = 'FL', zip }) {
  const seed = hashString(`attom:${street}:${zip}`);
  const yearBuilt = 1955 + (seed % 65);
  const sqft = 1400 + (seed % 3200);
  const lot = 5000 + (seed % 22000);
  return {
    source: 'attom-mock', providerId: `mock-${seed}`, parcelId: `U-${(seed % 999999).toString().padStart(6, '0')}`,
    address: [street, city, state, zip].filter(Boolean).join(', '), county: null,
    latitude: null, longitude: null, propertyType: (seed % 5 === 0) ? 'Condominium' : 'Single Family Residence',
    bedrooms: 2 + (seed % 4), bathrooms: 1 + (seed % 4), squareFeet: sqft, lotSquareFeet: lot,
    yearBuilt, lastSaleDate: null, lastSalePrice: 200000 + (seed % 600000),
    assessedValue: 220000 + (seed % 900000), ownerOccupied: seed % 2 === 0, raw: { mock: true }
  };
}

export function mockRentCastProperty(address) {
  const seed = hashString(`rentcast:${address}`);
  return {
    source: 'rentcast-mock', providerId: `mock-${seed}`, address, parcelId: null, county: null,
    latitude: null, longitude: null, propertyType: null, bedrooms: null, bathrooms: null,
    squareFeet: null, lotSquareFeet: null, yearBuilt: null, lastSaleDate: null, lastSalePrice: null,
    assessedValue: null, estimatedValue: 260000 + (seed % 1200000), ownerOccupied: null, raw: { mock: true }
  };
}

export async function geocodeAddress({ street, city, state = 'FL', zip }) {
  if (!street) throw new Error('street is required');
  const params = new URLSearchParams({
    street,
    city: city || '',
    state,
    zip: zip || '',
    benchmark: 'Public_AR_Current',
    format: 'json'
  });
  const url = `https://geocoding.geo.census.gov/geocoder/locations/address?${params}`;
  const data = await getJson(url, { provider: 'Census Geocoder' });
  const match = data?.result?.addressMatches?.[0];
  if (!match) return null;
  return {
    source: 'census',
    matchedAddress: match.matchedAddress,
    latitude: Number(match.coordinates?.y),
    longitude: Number(match.coordinates?.x),
    tigerLineId: match.tigerLine?.tigerLineId || null
  };
}

export async function fetchRentCastProperty(address) {
  if (!process.env.RENTCAST_API_KEY) return null;
  const params = new URLSearchParams({ address, limit: '1' });
  const rows = await getJson(`https://api.rentcast.io/v1/properties?${params}`, {
    provider: 'RentCast',
    headers: { Accept: 'application/json', 'X-Api-Key': process.env.RENTCAST_API_KEY }
  });
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) return null;
  return {
    source: 'rentcast', providerId: row.id || null, address: row.formattedAddress || address,
    parcelId: row.assessorID || row.legalDescription || null, county: row.county || null,
    latitude: row.latitude ?? null, longitude: row.longitude ?? null,
    propertyType: row.propertyType || null, bedrooms: row.bedrooms ?? null,
    bathrooms: row.bathrooms ?? null, squareFeet: row.squareFootage ?? null,
    lotSquareFeet: row.lotSize ?? null, yearBuilt: row.yearBuilt ?? null,
    lastSaleDate: row.lastSaleDate || null, lastSalePrice: row.lastSalePrice ?? null,
    assessedValue: row.taxAssessments ? Object.values(row.taxAssessments).at(-1)?.value ?? null : null,
    ownerOccupied: row.ownerOccupied ?? null, raw: row
  };
}

export async function fetchAttomProperty({ street, city, state = 'FL', zip, apn }) {
  if (!process.env.ATTOM_API_KEY) return null;
  const params = new URLSearchParams();
  if (apn) params.set('apn', apn);
  else {
    params.set('address1', street);
    params.set('address2', [city, state, zip].filter(Boolean).join(', '));
  }
  const data = await getJson(`https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?${params}`, {
    provider: 'ATTOM',
    headers: { Accept: 'application/json', APIKey: process.env.ATTOM_API_KEY }
  });
  const row = data?.property?.[0];
  if (!row) return null;
  return {
    source: 'attom', providerId: row.identifier?.attomId || row.identifier?.Id || null,
    parcelId: row.identifier?.apn || null,
    address: row.address?.oneLine || [street, city, state, zip].filter(Boolean).join(', '),
    county: row.area?.countrysecsubd || row.area?.munname || null,
    latitude: Number(row.location?.latitude) || null, longitude: Number(row.location?.longitude) || null,
    propertyType: row.summary?.propertyType || row.summary?.propLandUse || null,
    bedrooms: row.building?.rooms?.beds ?? null, bathrooms: row.building?.rooms?.bathstotal ?? null,
    squareFeet: row.building?.size?.universalsize ?? null, lotSquareFeet: row.lot?.lotsize2 ?? null,
    yearBuilt: row.summary?.yearbuilt ?? null, lastSaleDate: row.sale?.salesearchdate || null,
    lastSalePrice: row.sale?.amount?.saleamt ?? null, assessedValue: row.assessment?.assessed?.assdttlvalue ?? null,
    ownerOccupied: row.assessment?.owner?.absenteeowner === 'OCCUPIED', raw: row
  };
}

export async function fetchFemaFloodZone(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const params = new URLSearchParams({
    where: '1=1', geometry: `${longitude},${latitude}`, geometryType: 'esriGeometryPoint',
    inSR: '4326', spatialRel: 'esriSpatialRelIntersects', outFields: 'FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE',
    returnGeometry: 'false', f: 'json'
  });
  const url = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?${params}`;
  const data = await getJson(url, { provider: 'FEMA NFHL' });
  const a = data?.features?.[0]?.attributes;
  return a ? { source: 'fema', floodZone: a.FLD_ZONE || null, zoneSubtype: a.ZONE_SUBTY || null, specialFloodHazardArea: a.SFHA_TF === 'T', baseFloodElevation: a.STATIC_BFE ?? null } : null;
}
