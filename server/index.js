import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listMarkets, getMarket, upsertMany, countMarkets,
  getPropertyById, searchStoredProperties,
  getPermitsByZip, permitStatsByZip, savePermits,
  listProspects, getProspect, createProspect, updateProspect, deleteProspect,
  addContact, addNote, PROSPECT_STAGES, listRefreshLog
} from './db.js';
import { fetchCensusMarkets } from './census.js';
import { SEED_MARKETS_NORMALIZED } from './seed-data.js';
import { getRenovationTier, getTierLabel } from './scoring.js';
import { configuredProviders } from './providers.js';
import { lookupProperty } from './property-service.js';
import { fetchRecentPermits } from './permits.js';
import { explainMarket, outreachDraft, aiConfigured } from './ai.js';
import { buildMarketsWorkbook, marketsToCsv, buildMarketReport, buildPropertyReport } from './reports.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const asyncH = fn => (req, res) => Promise.resolve(fn(req, res)).catch(err => {
  console.error(`${req.method} ${req.path} —`, err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

function requireAdmin(req, res) {
  if (process.env.ADMIN_TOKEN && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// ─── Health / Config ──────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({
  ok: true, version: '2.1.0', time: new Date().toISOString(),
  markets: countMarkets()
}));

app.get('/api/config', (_, res) => res.json({
  providers: configuredProviders(), ai: aiConfigured(), prospectStages: PROSPECT_STAGES
}));

app.get('/api/admin/refresh-log', (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json({ log: listRefreshLog(100) });
});

// ─── Markets — full list with scores and ranks ────────────────────────────────
app.get('/api/markets', (_, res) => {
  const markets = listMarkets();
  const sorted = [...markets].sort((a, b) => b.opportunityScore - a.opportunityScore);
  sorted.forEach((m, i) => { m.rank = i + 1; });
  const byZip = Object.fromEntries(sorted.map(m => [m.zip, m]));
  const ranked = markets.map(m => ({ ...m, rank: byZip[m.zip].rank }));
  res.json({
    markets: ranked,
    total: ranked.length,
    dataYear: Math.max(0, ...ranked.map(m => m.dataYear || 0)),
    tierSummary: {
      tier1: ranked.filter(m => m.adTier === 1).length,
      tier2: ranked.filter(m => m.adTier === 2).length,
      tier3: ranked.filter(m => m.adTier === 3).length,
    }
  });
});

// ─── ZIP Ranking — sorted by budgetScore, with tier/county filters ────────────
app.get('/api/markets/ranked', (req, res) => {
  const { tier, county, minIncome, minHomeValue, sortBy = 'budgetScore', limit = 200 } = req.query;
  let markets = listMarkets();

  if (tier)         markets = markets.filter(m => m.adTier === Number(tier));
  if (county)       markets = markets.filter(m => m.county.toLowerCase().includes(county.toLowerCase()));
  if (minIncome)    markets = markets.filter(m => m.income >= Number(minIncome));
  if (minHomeValue) markets = markets.filter(m => m.homeValue >= Number(minHomeValue));

  const validSort = ['budgetScore','opportunityScore','renovationScore','income','homeValue','populationGrowth'];
  const sortField = validSort.includes(sortBy) ? sortBy : 'budgetScore';
  markets.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));
  markets.forEach((m, i) => { m.rank = i + 1; });

  res.json({ markets: markets.slice(0, Number(limit)), total: markets.length });
});

// ─── County Summary ───────────────────────────────────────────────────────────
app.get('/api/markets/summary/counties', (_, res) => {
  const markets = listMarkets();
  const counties = {};
  for (const m of markets) {
    if (!counties[m.county]) {
      counties[m.county] = { county: m.county, zips: 0, tier1: 0, tier2: 0, tier3: 0,
        avgIncome: 0, avgHomeValue: 0, avgBudgetScore: 0, topZip: null, topScore: 0 };
    }
    const c = counties[m.county];
    c.zips++;
    if (m.adTier === 1) c.tier1++;
    else if (m.adTier === 2) c.tier2++;
    else if (m.adTier === 3) c.tier3++;
    c.avgIncome += m.income;
    c.avgHomeValue += m.homeValue;
    c.avgBudgetScore += m.budgetScore;
    if (m.budgetScore > c.topScore) { c.topScore = m.budgetScore; c.topZip = m.zip; }
  }
  for (const c of Object.values(counties)) {
    c.avgIncome = Math.round(c.avgIncome / c.zips);
    c.avgHomeValue = Math.round(c.avgHomeValue / c.zips);
    c.avgBudgetScore = Math.round(c.avgBudgetScore / c.zips);
  }
  res.json({ counties: Object.values(counties).sort((a, b) => b.avgBudgetScore - a.avgBudgetScore) });
});

// ─── Single market detail ─────────────────────────────────────────────────────
app.get('/api/markets/:zip', (req, res) => {
  const market = getMarket(req.params.zip);
  if (!market) return res.status(404).json({ error: 'ZIP not found' });
  res.json({ market });
});

// ─── Admin: Refresh from Census ───────────────────────────────────────────────
app.post('/api/admin/refresh', asyncH(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const rows = await fetchCensusMarkets();
  upsertMany(rows);
  res.json({ ok: true, updated: rows.length, source: 'census' });
}));

// ─── Admin: Reseed from static data ──────────────────────────────────────────
app.post('/api/admin/reseed', asyncH(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  upsertMany(SEED_MARKETS_NORMALIZED);
  res.json({ ok: true, seeded: SEED_MARKETS_NORMALIZED.length, source: 'static-seed' });
}));

// ─── WS1: Property lookup ─────────────────────────────────────────────────────
app.post('/api/properties/lookup', asyncH(async (req, res) => {
  const address = req.body?.address;
  if (!address) return res.status(400).json({ error: 'address is required' });
  const result = await lookupProperty(address, { force: Boolean(req.body?.force) });
  res.json(result);
}));

app.get('/api/properties/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'q is required' });
  res.json({ properties: searchStoredProperties(String(q), Number(req.query.limit) || 20) });
});

app.get('/api/properties/:id', (req, res) => {
  const property = getPropertyById(Number(req.params.id));
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json({ property });
});

// ─── WS2: Permits ─────────────────────────────────────────────────────────────
app.get('/api/permits/market/:zip', (req, res) => {
  const zip = req.params.zip;
  const since = new Date(Date.now() - (Number(req.query.days) || 30) * 86400000).toISOString().slice(0, 10);
  res.json({
    zip,
    permits: getPermitsByZip(zip, { since, limit: Number(req.query.limit) || 100 }),
    stats: permitStatsByZip(zip, { since })
  });
});

app.post('/api/admin/refresh-permits', asyncH(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { permits, sources } = await fetchRecentPermits({ sinceDays: Number(req.body?.days) || 30 });
  const saved = savePermits(permits);
  res.json({ ok: true, saved, sources });
}));

// ─── WS2: CRM / Prospects ─────────────────────────────────────────────────────
app.get('/api/prospects', (_, res) => res.json({ prospects: listProspects(), stages: PROSPECT_STAGES }));

app.post('/api/prospects', (req, res) => {
  const { address } = req.body || {};
  if (!address) return res.status(400).json({ error: 'address is required' });
  res.status(201).json({ prospect: createProspect(req.body) });
});

app.get('/api/prospects/:id', (req, res) => {
  const prospect = getProspect(Number(req.params.id));
  if (!prospect) return res.status(404).json({ error: 'Prospect not found' });
  res.json({ prospect });
});

app.patch('/api/prospects/:id', (req, res) => {
  const prospect = updateProspect(Number(req.params.id), req.body || {});
  if (!prospect) return res.status(404).json({ error: 'Prospect not found' });
  res.json({ prospect });
});

app.delete('/api/prospects/:id', (req, res) => {
  const ok = deleteProspect(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Prospect not found' });
  res.json({ ok: true });
});

app.post('/api/prospects/:id/notes', (req, res) => {
  const prospect = getProspect(Number(req.params.id));
  if (!prospect) return res.status(404).json({ error: 'Prospect not found' });
  const note = addNote(Number(req.params.id), req.body?.body);
  if (!note) return res.status(400).json({ error: 'note body is required' });
  res.status(201).json({ note });
});

app.post('/api/prospects/:id/contacts', (req, res) => {
  const prospect = getProspect(Number(req.params.id));
  if (!prospect) return res.status(404).json({ error: 'Prospect not found' });
  res.status(201).json({ contact: addContact(Number(req.params.id), req.body || {}) });
});

// ─── WS3: AI ──────────────────────────────────────────────────────────────────
app.post('/api/ai/explain-market', asyncH(async (req, res) => {
  let market = req.body?.market;
  if (!market && req.body?.zip) market = getMarket(req.body.zip);
  if (!market) return res.status(400).json({ error: 'market data or a known zip is required' });
  res.json(await explainMarket(market));
}));

app.post('/api/ai/outreach-draft', asyncH(async (req, res) => {
  let property = req.body?.property;
  if (!property && req.body?.propertyId) property = getPropertyById(Number(req.body.propertyId));
  if (!property) return res.status(400).json({ error: 'property data or a known propertyId is required' });
  res.json(await outreachDraft(property, { builderName: req.body?.builderName }));
}));

// ─── WS3: Export & Reports ────────────────────────────────────────────────────

// Legacy CSV endpoint (kept for backward compatibility)
app.get('/api/export/markets.csv', (req, res) => {
  const { tier, county, minIncome, minHomeValue } = req.query;
  let markets = listMarkets();

  if (tier)         markets = markets.filter(m => m.adTier === Number(tier));
  if (county)       markets = markets.filter(m => m.county.toLowerCase().includes(county.toLowerCase()));
  if (minIncome)    markets = markets.filter(m => m.income >= Number(minIncome));
  if (minHomeValue) markets = markets.filter(m => m.homeValue >= Number(minHomeValue));

  markets.sort((a, b) => b.budgetScore - a.budgetScore);
  markets.forEach((m, i) => { m.rank = i + 1; });

  const headers = [
    'Rank','ZIP','City','County','Ad Tier','Tier Label','Budget Score','Opportunity Score',
    'Renovation Score','Median Income','Median Home Value','Owner Occupied %',
    'Median Year Built','Luxury Share %','Waterfront','Population','Pop Growth %','Data Year'
  ];
  const rows = markets.map(m => [
    m.rank, m.zip, `"${m.city}"`, m.county, m.adTier, `"${m.adTierLabel}"`,
    m.budgetScore, m.opportunityScore, m.renovationScore,
    m.income, m.homeValue, m.ownerOccupied,
    m.medianYearBuilt, m.luxuryShare, m.waterfrontZip ? 'Yes' : 'No',
    m.population, m.populationGrowth, m.dataYear
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tampa-bay-zip-targets.csv"');
  res.send(csv);
});

// New unified export endpoint (xlsx or csv)
app.get('/api/export/markets', asyncH(async (req, res) => {
  const { tier, county, minIncome, minHomeValue, query: q, sort } = req.query;
  let markets = listMarkets();

  if (tier)         markets = markets.filter(m => m.adTier === Number(tier));
  if (county)       markets = markets.filter(m => m.county.toLowerCase().includes(county.toLowerCase()));
  if (minIncome)    markets = markets.filter(m => m.income >= Number(minIncome));
  if (minHomeValue) markets = markets.filter(m => m.homeValue >= Number(minHomeValue));
  if (q) {
    const ql = String(q).toLowerCase();
    markets = markets.filter(m => `${m.zip} ${m.city} ${m.county}`.toLowerCase().includes(ql));
  }

  const validSort = ['budgetScore','opportunityScore','renovationScore','income','homeValue'];
  const sortField = validSort.includes(sort) ? sort : 'budgetScore';
  markets.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

  const format = String(req.query.format || 'xlsx').toLowerCase();
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tampa-bay-markets.csv"');
    return res.send(marketsToCsv(markets));
  }
  const wb = await buildMarketsWorkbook(markets);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="tampa-bay-markets.xlsx"');
  await wb.xlsx.write(res);
  res.end();
}));

// ZIP list for ad platforms
app.get('/api/export/zip-list', (req, res) => {
  const { tier, county, minIncome, minHomeValue, format = 'json' } = req.query;
  let markets = listMarkets();

  if (tier)         markets = markets.filter(m => m.adTier === Number(tier));
  if (county)       markets = markets.filter(m => m.county.toLowerCase().includes(county.toLowerCase()));
  if (minIncome)    markets = markets.filter(m => m.income >= Number(minIncome));
  if (minHomeValue) markets = markets.filter(m => m.homeValue >= Number(minHomeValue));

  markets.sort((a, b) => b.budgetScore - a.budgetScore);
  const zips = markets.map(m => m.zip);

  if (format === 'text') {
    res.setHeader('Content-Type', 'text/plain');
    res.send(zips.join('\n'));
  } else {
    res.json({ zips, count: zips.length });
  }
});

// PDF reports
app.get('/api/reports/market/:zip', asyncH(async (req, res) => {
  const market = getMarket(req.params.zip);
  if (!market) return res.status(404).json({ error: 'ZIP not found' });
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const buffer = await buildMarketReport(market, permitStatsByZip(req.params.zip, { since }));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="market-${req.params.zip}.pdf"`);
  res.send(buffer);
}));

app.get('/api/reports/property/:id', asyncH(async (req, res) => {
  const property = getPropertyById(Number(req.params.id));
  if (!property) return res.status(404).json({ error: 'Property not found' });
  const buffer = await buildPropertyReport(property, getMarket(property.zip) || {});
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="property-${req.params.id}.pdf"`);
  res.send(buffer);
}));

// ─── Static SPA ───────────────────────────────────────────────────────────────
app.use(express.static(path.join(root, 'dist'), { maxAge: '1h' }));
app.get('*', (req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));

// ─── Boot ─────────────────────────────────────────────────────────────────────
app.listen(port, async () => {
  console.log(`Builder Intelligence v2.1 listening on port ${port}`);
  const count = countMarkets();
  if (count === 0) {
    console.log('No market data found — seeding from static dataset...');
    try {
      upsertMany(SEED_MARKETS_NORMALIZED);
      console.log(`Seeded ${SEED_MARKETS_NORMALIZED.length} Tampa Bay ZIP markets from static data`);
    } catch (e) {
      console.error('Static seed failed:', e.message);
    }
    if (process.env.CENSUS_API_KEY) {
      try {
        const rows = await fetchCensusMarkets();
        upsertMany(rows);
        console.log(`Refreshed ${rows.length} markets from Census API`);
      } catch (e) {
        console.warn('Census refresh failed (static data is active):', e.message);
      }
    }
  } else {
    console.log(`Loaded ${count} ZIP markets from database`);
  }
});
