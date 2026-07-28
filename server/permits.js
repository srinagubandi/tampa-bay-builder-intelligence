// server/permits.js
// Workstream 2: Permit data integration abstraction.
// Fetches recent building permits from local open-data portals (Hillsborough County
// Socrata API and the City of Tampa ArcGIS REST service), normalizes them into a common
// shape, and classifies them into the high-value categories builders care about.
//
// Every fetcher is failure-isolated: a portal being down returns [] rather than throwing,
// so the nightly job can still ingest whatever is available.

const timeoutMs = Number(process.env.API_TIMEOUT_MS || 15000);

// High-value permit categories we care about, plus keyword matchers to bucket raw types.
export const PERMIT_CATEGORIES = ['New Construction', 'Major Alteration', 'Demolition', 'Pool', 'Roof'];

const CATEGORY_MATCHERS = [
  { category: 'New Construction', re: /(new\s+(single|residential|construction|building|home|dwelling)|new\s+sfr|building\s*-\s*new)/i },
  { category: 'Demolition', re: /(demo|demolition|razing|tear\s*down)/i },
  { category: 'Pool', re: /(pool|spa)/i },
  { category: 'Roof', re: /(roof|reroof|re-roof)/i },
  { category: 'Major Alteration', re: /(alteration|addition|remodel|renovation|major\s+repair|structural)/i }
];

export function classifyPermit(permitType = '', description = '') {
  const text = `${permitType} ${description}`;
  for (const { category, re } of CATEGORY_MATCHERS) {
    if (re.test(text)) return category;
  }
  return null;
}

async function getJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`${options.provider || 'Permit API'} request failed (${response.status})`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ *
 * Hillsborough County — Socrata (SODA) API
 * Dataset id and host are configurable via env so the integration can be
 * pointed at the correct current dataset without code changes.
 * ------------------------------------------------------------------ */
async function fetchHillsboroughPermits({ sinceDays = 30, limit = 1000 } = {}) {
  const host = process.env.HILLSBOROUGH_SOCRATA_HOST || 'https://gis.hillsboroughcounty.org';
  const dataset = process.env.HILLSBOROUGH_SOCRATA_DATASET;
  if (!dataset) return []; // No dataset configured — skip gracefully.

  const since = isoDaysAgo(sinceDays);
  const params = new URLSearchParams({
    $where: `issued_date >= '${since}'`,
    $limit: String(limit),
    $order: 'issued_date DESC'
  });
  const headers = { Accept: 'application/json' };
  if (process.env.SOCRATA_APP_TOKEN) headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;

  const rows = await getJson(`${host}/resource/${dataset}.json?${params}`, { provider: 'Hillsborough Socrata', headers });
  return (Array.isArray(rows) ? rows : []).map(r => normalize({
    source: 'hillsborough',
    sourcePermitId: `hillsborough:${r.permit_number || r.permitnumber || r.record_id || r.objectid || ''}`,
    parcelId: r.folio || r.parcel_id || r.folio_number || null,
    address: r.address || r.project_address || r.site_address || null,
    zip: (r.zip || r.zip_code || '').toString().slice(0, 5) || null,
    permitType: r.permit_type || r.permittype || r.type || null,
    description: r.description || r.work_description || r.scope || null,
    valuation: r.estimated_cost || r.job_value || r.valuation || r.construction_cost || null,
    issuedDate: (r.issued_date || r.issue_date || '').toString().slice(0, 10) || null,
    status: r.status || r.permit_status || null,
    latitude: r.latitude ? Number(r.latitude) : null,
    longitude: r.longitude ? Number(r.longitude) : null,
    raw: r
  })).filter(Boolean);
}

/* ------------------------------------------------------------------ *
 * City of Tampa — ArcGIS REST FeatureServer query
 * ------------------------------------------------------------------ */
async function fetchTampaArcgisPermits({ sinceDays = 30, limit = 1000 } = {}) {
  const url = process.env.TAMPA_ARCGIS_URL; // e.g. https://.../FeatureServer/0/query
  if (!url) return []; // Not configured — skip gracefully.

  const sinceMs = Date.now() - sinceDays * 86400000;
  const params = new URLSearchParams({
    where: `IssuedDate >= ${sinceMs}`,
    outFields: '*',
    returnGeometry: 'true',
    resultRecordCount: String(limit),
    f: 'json'
  });
  const data = await getJson(`${url}?${params}`, { provider: 'Tampa ArcGIS' });
  const features = data?.features || [];
  return features.map(f => {
    const a = f.attributes || {};
    const geom = f.geometry || {};
    const issued = a.IssuedDate ? new Date(a.IssuedDate).toISOString().slice(0, 10) : null;
    return normalize({
      source: 'tampa',
      sourcePermitId: `tampa:${a.PermitNumber || a.OBJECTID || ''}`,
      parcelId: a.FolioNumber || a.ParcelID || null,
      address: a.Address || a.SiteAddress || null,
      zip: (a.Zip || a.ZipCode || '').toString().slice(0, 5) || null,
      permitType: a.PermitType || a.Type || null,
      description: a.Description || a.WorkDescription || null,
      valuation: a.EstimatedValue || a.JobValue || a.Valuation || null,
      issuedDate: issued,
      status: a.Status || null,
      latitude: geom.y ?? null,
      longitude: geom.x ?? null,
      raw: a
    });
  }).filter(Boolean);
}

function normalize(row) {
  if (!row.address && !row.parcelId) return null;
  const category = classifyPermit(row.permitType || '', row.description || '');
  return { ...row, category, valuation: row.valuation == null ? null : Number(row.valuation) || 0 };
}

/* ------------------------------------------------------------------ *
 * Mock permit generator — used when no portals are configured so the
 * feature works end-to-end in development / demos.
 * ------------------------------------------------------------------ */
export function mockPermits(zip, count = 12) {
  const types = [
    { permitType: 'New Single Family Residence', category: 'New Construction' },
    { permitType: 'Residential Demolition', category: 'Demolition' },
    { permitType: 'Swimming Pool', category: 'Pool' },
    { permitType: 'Re-Roof', category: 'Roof' },
    { permitType: 'Major Alteration / Addition', category: 'Major Alteration' }
  ];
  const streets = ['Bayshore Blvd', 'Davis Blvd', 'W Azeele St', 'S Dale Mabry Hwy', 'Beach Dr NE', 'Snell Isle Blvd'];
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const t = types[i % types.length];
    const seed = (Number(zip) || 33602) + i * 7;
    rows.push({
      source: 'mock',
      sourcePermitId: `mock:${zip}:${i}`,
      parcelId: `U-${(seed % 999999).toString().padStart(6, '0')}`,
      address: `${1000 + (seed % 8000)} ${streets[i % streets.length]}`,
      zip: String(zip),
      permitType: t.permitType,
      category: t.category,
      description: `${t.permitType} permit`,
      valuation: 75000 + ((seed * 137) % 900000),
      issuedDate: isoDaysAgo(i * 2 + 1),
      status: i % 4 === 0 ? 'Issued' : (i % 4 === 1 ? 'Under Review' : 'Finaled'),
      latitude: null, longitude: null, raw: { mock: true }
    });
  }
  return rows;
}

function mockEnabled() {
  if (process.env.MOCK_PERMITS === '0' || process.env.MOCK_PERMITS === 'false') return false;
  if (process.env.MOCK_PERMITS === '1' || process.env.MOCK_PERMITS === 'true') return true;
  // Default to mock only when no real portal is configured.
  return !process.env.HILLSBOROUGH_SOCRATA_DATASET && !process.env.TAMPA_ARCGIS_URL;
}

// Tampa Bay ZIP codes for seeding mock data across the coverage area.
const SEED_ZIPS = ['33602', '33606', '33629', '33611', '33703', '33701', '34655', '33559'];

/**
 * Fetch permits from all configured sources for the last `sinceDays` days.
 * Focuses on the high-value categories. Failure-isolated across sources.
 * @returns {Promise<{ permits: Array, sources: object }>}
 */
export async function fetchRecentPermits({ sinceDays = 30, limit = 1000, zips = SEED_ZIPS } = {}) {
  const sources = {};
  let permits = [];

  const results = await Promise.allSettled([
    fetchHillsboroughPermits({ sinceDays, limit }),
    fetchTampaArcgisPermits({ sinceDays, limit })
  ]);
  const [hills, tampa] = results;
  if (hills.status === 'fulfilled') { permits.push(...hills.value); sources.hillsborough = { ok: true, count: hills.value.length }; }
  else sources.hillsborough = { ok: false, error: hills.reason?.message };
  if (tampa.status === 'fulfilled') { permits.push(...tampa.value); sources.tampa = { ok: true, count: tampa.value.length }; }
  else sources.tampa = { ok: false, error: tampa.reason?.message };

  if (!permits.length && mockEnabled()) {
    permits = zips.flatMap(zip => mockPermits(zip));
    sources.mock = { ok: true, count: permits.length };
  }

  // Keep only the high-value categories.
  permits = permits.filter(p => p.category && PERMIT_CATEGORIES.includes(p.category));
  return { permits, sources };
}
