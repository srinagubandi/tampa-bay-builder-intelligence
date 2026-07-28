import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listMarkets, getMarket, upsertMany, countMarkets } from './db.js';
import { fetchCensusMarkets } from './census.js';
import { SEED_MARKETS_NORMALIZED } from './seed-data.js';
import { getRenovationTier, getTierLabel } from './scoring.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({
  ok: true, version: '2.1.0', time: new Date().toISOString(),
  markets: countMarkets()
}));

// ─── Markets — full list with scores ─────────────────────────────────────────
app.get('/api/markets', (_, res) => {
  const markets = listMarkets();
  // Assign rank by opportunityScore descending
  const sorted = [...markets].sort((a, b) => b.opportunityScore - a.opportunityScore);
  sorted.forEach((m, i) => { m.rank = i + 1; });
  // Re-sort by ZIP for consistent API response; rank is embedded
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

// ─── ZIP Ranking — sorted by budgetScore, with tier filter ───────────────────
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

// ─── Single market detail ─────────────────────────────────────────────────────
app.get('/api/markets/:zip', (req, res) => {
  const market = getMarket(req.params.zip);
  if (!market) return res.status(404).json({ error: 'ZIP not found' });
  res.json(market);
});

// ─── CSV Export ───────────────────────────────────────────────────────────────
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

// ─── ZIP List for Ad Platforms ────────────────────────────────────────────────
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

// ─── Admin: Refresh from Census ───────────────────────────────────────────────
app.post('/api/admin/refresh', async (req, res) => {
  if (process.env.ADMIN_TOKEN && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const rows = await fetchCensusMarkets();
    upsertMany(rows);
    res.json({ ok: true, updated: rows.length, source: 'census' });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// ─── Admin: Reseed from static data ──────────────────────────────────────────
app.post('/api/admin/reseed', async (req, res) => {
  if (process.env.ADMIN_TOKEN && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    upsertMany(SEED_MARKETS_NORMALIZED);
    res.json({ ok: true, seeded: SEED_MARKETS_NORMALIZED.length, source: 'static-seed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Static frontend ──────────────────────────────────────────────────────────
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
    // Also try Census API if key is available
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
