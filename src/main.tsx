import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';

// ─── Types ────────────────────────────────────────────────────────────────────
type ZipMarket = {
  zip: string; county: string; city: string; latitude: number; longitude: number;
  population: number; income: number; homeValue: number; ownerOccupied: number;
  medianYearBuilt: number; luxuryShare: number; waterfrontZip: number;
  populationGrowth: number; dataYear: number;
  // Scores
  renovationScore: number; customHomeScore: number; waterfrontScore: number;
  teardownScore: number; opportunityScore: number; budgetScore: number;
  // Ad targeting
  adTier: number; adTierLabel: string; tierColor: string; tierMapColor: string;
  recommendation: string; rank?: number;
};

type CountySummary = {
  county: string; zips: number; tier1: number; tier2: number; tier3: number;
  avgIncome: number; avgHomeValue: number; avgBudgetScore: number; topZip: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const pct = (n: number) => `${n}%`;
const TIER_COLORS: Record<number, string> = { 1: '#1a6b3a', 2: '#2563eb', 3: '#d97706', 4: '#6b7280' };
const TIER_BG: Record<number, string>     = { 1: '#dcfce7', 2: '#dbeafe', 3: '#fef3c7', 4: '#f3f4f6' };
const TIER_MAP: Record<number, string>    = { 1: '#22c55e', 2: '#3b82f6', 3: '#f59e0b', 4: '#9ca3af' };

function TierBadge({ tier, label }: { tier: number; label: string }) {
  return (
    <span className="tier-badge" style={{ background: TIER_BG[tier], color: TIER_COLORS[tier], border: `1px solid ${TIER_COLORS[tier]}` }}>
      {tier <= 3 ? `Tier ${tier}` : '—'} {label}
    </span>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [markets, setMarkets] = useState<ZipMarket[]>([]);
  const [counties, setCounties] = useState<CountySummary[]>([]);
  const [status, setStatus] = useState('Loading market data…');
  const [error, setError] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [countyFilter, setCountyFilter] = useState('');
  const [minIncome, setMinIncome] = useState(0);
  const [minValue, setMinValue] = useState(0);
  const [waterfrontOnly, setWaterfrontOnly] = useState(false);
  const [sortBy, setSortBy] = useState<keyof ZipMarket>('budgetScore');
  const [activeTab, setActiveTab] = useState<'map' | 'table' | 'counties' | 'top10'>('table');
  const [copiedMsg, setCopiedMsg] = useState('');

  // Load data
  async function load() {
    const [mRes, cRes] = await Promise.all([
      fetch('/api/markets'),
      fetch('/api/markets/summary/counties'),
    ]);
    if (!mRes.ok) throw new Error('Could not load market data');
    const mData = await mRes.json();
    const cData = cRes.ok ? await cRes.json() : { counties: [] };
    setMarkets(mData.markets || []);
    setCounties(cData.counties || []);
    const t = mData.tierSummary || {};
    setStatus(`${mData.total} ZIPs loaded · Tier 1: ${t.tier1 || 0} · Tier 2: ${t.tier2 || 0} · Tier 3: ${t.tier3 || 0}`);
  }

  useEffect(() => {
    load().catch(e => { setError(e.message); setStatus('Error loading data'); });
  }, []);

  // Filtered + ranked markets
  const filtered = useMemo(() => {
    let result = markets.filter(m => {
      const text = `${m.zip} ${m.city} ${m.county}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) return false;
      if (tierFilter !== null && m.adTier !== tierFilter) return false;
      if (countyFilter && !m.county.toLowerCase().includes(countyFilter.toLowerCase())) return false;
      if (minIncome && m.income < minIncome) return false;
      if (minValue && m.homeValue < minValue) return false;
      if (waterfrontOnly && !m.waterfrontZip) return false;
      return true;
    });
    result = [...result].sort((a, b) => (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0));
    result.forEach((m, i) => { m.rank = i + 1; });
    return result;
  }, [markets, query, tierFilter, countyFilter, minIncome, minValue, waterfrontOnly, sortBy]);

  const top10 = useMemo(() => [...markets].sort((a, b) => b.budgetScore - a.budgetScore).slice(0, 10), [markets]);

  // CSV export
  function downloadCSV() {
    const params = new URLSearchParams();
    if (tierFilter !== null) params.set('tier', String(tierFilter));
    if (countyFilter) params.set('county', countyFilter);
    if (minIncome) params.set('minIncome', String(minIncome));
    if (minValue) params.set('minHomeValue', String(minValue));
    window.location.href = `/api/export/markets.csv?${params}`;
  }

  // Copy ZIP list
  async function copyZips() {
    const zips = filtered.map(m => m.zip).join('\n');
    await navigator.clipboard.writeText(zips);
    setCopiedMsg(`Copied ${filtered.length} ZIPs`);
    setTimeout(() => setCopiedMsg(''), 3000);
  }

  // KPI averages
  const avgIncome    = filtered.length ? Math.round(filtered.reduce((s, m) => s + m.income, 0) / filtered.length) : 0;
  const avgHomeValue = filtered.length ? Math.round(filtered.reduce((s, m) => s + m.homeValue, 0) / filtered.length) : 0;
  const avgBudget    = filtered.length ? Math.round(filtered.reduce((s, m) => s + m.budgetScore, 0) / filtered.length) : 0;
  const tier1Count   = filtered.filter(m => m.adTier === 1).length;
  const tier2Count   = filtered.filter(m => m.adTier === 2).length;

  const allCounties = useMemo(() => [...new Set(markets.map(m => m.county))].sort(), [markets]);

  return (
    <main>
      {/* ── Header ── */}
      <header>
        <div>
          <p className="eyebrow">Tampa Bay · 5-County Region</p>
          <h1>Builder Market Intelligence</h1>
          <p className="subtitle">ZIP Code Ranking for Renovation Ad Targeting · $250K–$500K+</p>
        </div>
        <div className="status-block">
          <span className="version-badge">v2.1</span>
          <span className="status-text">{status}</span>
          {error && <span className="error-text">{error}</span>}
        </div>
      </header>

      {/* ── Tier Legend ── */}
      <section className="tier-legend">
        <div className="legend-item" onClick={() => setTierFilter(tierFilter === 1 ? null : 1)} style={{ cursor: 'pointer', opacity: tierFilter && tierFilter !== 1 ? 0.4 : 1 }}>
          <span className="legend-dot" style={{ background: TIER_MAP[1] }} />
          <strong>Tier 1</strong> — $500K+ Renovations
          <span className="legend-count">{markets.filter(m => m.adTier === 1).length} ZIPs</span>
        </div>
        <div className="legend-item" onClick={() => setTierFilter(tierFilter === 2 ? null : 2)} style={{ cursor: 'pointer', opacity: tierFilter && tierFilter !== 2 ? 0.4 : 1 }}>
          <span className="legend-dot" style={{ background: TIER_MAP[2] }} />
          <strong>Tier 2</strong> — $250K–$500K Renovations
          <span className="legend-count">{markets.filter(m => m.adTier === 2).length} ZIPs</span>
        </div>
        <div className="legend-item" onClick={() => setTierFilter(tierFilter === 3 ? null : 3)} style={{ cursor: 'pointer', opacity: tierFilter && tierFilter !== 3 ? 0.4 : 1 }}>
          <span className="legend-dot" style={{ background: TIER_MAP[3] }} />
          <strong>Tier 3</strong> — Monitor ($250K)
          <span className="legend-count">{markets.filter(m => m.adTier === 3).length} ZIPs</span>
        </div>
        {tierFilter !== null && (
          <button className="btn-ghost" onClick={() => setTierFilter(null)}>Clear tier filter ×</button>
        )}
      </section>

      {/* ── Filters ── */}
      <section className="filters">
        <label>Search
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ZIP, city, or county" />
        </label>
        <label>County
          <select value={countyFilter} onChange={e => setCountyFilter(e.target.value)}>
            <option value="">All counties</option>
            {allCounties.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Min Income
          <input type="number" value={minIncome || ''} onChange={e => setMinIncome(Number(e.target.value))} placeholder="e.g. 85000" />
        </label>
        <label>Min Home Value
          <input type="number" value={minValue || ''} onChange={e => setMinValue(Number(e.target.value))} placeholder="e.g. 350000" />
        </label>
        <label>Sort by
          <select value={sortBy} onChange={e => setSortBy(e.target.value as keyof ZipMarket)}>
            <option value="budgetScore">Budget Score</option>
            <option value="opportunityScore">Opportunity Score</option>
            <option value="renovationScore">Renovation Score</option>
            <option value="income">Median Income</option>
            <option value="homeValue">Home Value</option>
            <option value="populationGrowth">Growth Rate</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={waterfrontOnly} onChange={e => setWaterfrontOnly(e.target.checked)} />
          Waterfront only
        </label>
      </section>

      {/* ── KPI Cards ── */}
      <section className="kpis">
        <article className="kpi-card">
          <span>Matching ZIPs</span>
          <strong>{filtered.length}</strong>
          <small>of {markets.length} total</small>
        </article>
        <article className="kpi-card kpi-tier1">
          <span>Tier 1 ZIPs</span>
          <strong>{tier1Count}</strong>
          <small>$500K+ renovations</small>
        </article>
        <article className="kpi-card kpi-tier2">
          <span>Tier 2 ZIPs</span>
          <strong>{tier2Count}</strong>
          <small>$250K–$500K</small>
        </article>
        <article className="kpi-card">
          <span>Avg Budget Score</span>
          <strong>{avgBudget}</strong>
          <small>out of 100</small>
        </article>
        <article className="kpi-card">
          <span>Avg Median Income</span>
          <strong>{money.format(avgIncome)}</strong>
          <small>filtered ZIPs</small>
        </article>
        <article className="kpi-card">
          <span>Avg Home Value</span>
          <strong>{money.format(avgHomeValue)}</strong>
          <small>filtered ZIPs</small>
        </article>
      </section>

      {/* ── Action Bar ── */}
      <section className="action-bar">
        <div className="tabs">
          {(['table','map','counties','top10'] as const).map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'table' ? '📋 Rankings' : tab === 'map' ? '🗺 Map' : tab === 'counties' ? '🏙 Counties' : '⭐ Top 10'}
            </button>
          ))}
        </div>
        <div className="export-actions">
          {copiedMsg && <span className="copy-confirm">{copiedMsg}</span>}
          <button className="btn-secondary" onClick={copyZips} title="Copy ZIP codes for ad platform upload">
            📋 Copy {filtered.length} ZIPs
          </button>
          <button className="btn-primary" onClick={downloadCSV}>
            ⬇ Export CSV
          </button>
        </div>
      </section>

      {/* ── Map Tab ── */}
      {activeTab === 'map' && (
        <section className="mapCard">
          <MapContainer center={[27.95, -82.46]} zoom={9} scrollWheelZoom className="map">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filtered.map(m => (
              <CircleMarker
                key={m.zip}
                center={[m.latitude, m.longitude]}
                radius={Math.max(5, m.budgetScore / 10)}
                pathOptions={{ color: TIER_MAP[m.adTier] || '#9ca3af', fillColor: TIER_MAP[m.adTier] || '#9ca3af', fillOpacity: 0.75, weight: 1 }}
              >
                <Popup>
                  <div className="map-popup">
                    <div className="popup-header">
                      <strong>{m.zip}</strong>
                      <TierBadge tier={m.adTier} label={m.adTierLabel} />
                    </div>
                    <div className="popup-city">{m.city} · {m.county}</div>
                    <div className="popup-stats">
                      <span>Budget Score: <b>{m.budgetScore}</b></span>
                      <span>Rank: <b>#{m.rank}</b></span>
                      <span>Income: <b>{money.format(m.income)}</b></span>
                      <span>Home Value: <b>{money.format(m.homeValue)}</b></span>
                      {m.waterfrontZip ? <span className="waterfront-tag">🌊 Waterfront</span> : null}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="map-legend">
            {[1,2,3].map(t => (
              <span key={t} className="map-legend-item">
                <span className="legend-dot" style={{ background: TIER_MAP[t] }} />
                Tier {t}
              </span>
            ))}
            <span className="map-note">Circle size = budget score</span>
          </div>
        </section>
      )}

      {/* ── Rankings Table Tab ── */}
      {activeTab === 'table' && (
        <section className="tableCard">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>ZIP</th>
                  <th>Market</th>
                  <th>Ad Tier</th>
                  <th>Budget Score</th>
                  <th>Median Income</th>
                  <th>Median Home Value</th>
                  <th>Owner %</th>
                  <th>Year Built</th>
                  <th>Luxury %</th>
                  <th>Reno Score</th>
                  <th>Opportunity</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.zip} className={`tier-row tier-${m.adTier}`}>
                    <td className="rank-cell">#{m.rank}</td>
                    <td className="zip-cell"><strong>{m.zip}</strong></td>
                    <td className="market-cell">
                      {m.city}
                      <small>{m.county}</small>
                    </td>
                    <td><TierBadge tier={m.adTier} label={m.adTierLabel} /></td>
                    <td className="score-cell">
                      <div className="score-bar-wrap">
                        <div className="score-bar" style={{ width: `${m.budgetScore}%`, background: TIER_MAP[m.adTier] }} />
                        <span>{m.budgetScore}</span>
                      </div>
                    </td>
                    <td>{money.format(m.income)}</td>
                    <td>{money.format(m.homeValue)}</td>
                    <td>{pct(m.ownerOccupied)}</td>
                    <td>{m.medianYearBuilt}</td>
                    <td>{pct(m.luxuryShare)}</td>
                    <td>{m.renovationScore}</td>
                    <td><b>{m.opportunityScore}</b></td>
                    <td className="flags-cell">
                      {m.waterfrontZip ? <span title="Waterfront ZIP">🌊</span> : null}
                      {m.populationGrowth >= 3 ? <span title={`${m.populationGrowth}% annual growth`}>📈</span> : null}
                      {m.adTier === 1 ? <span title="Top renovation target">⭐</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">No ZIPs match your current filters. Try relaxing the criteria.</div>
          )}
        </section>
      )}

      {/* ── County Summary Tab ── */}
      {activeTab === 'counties' && (
        <section className="counties-grid">
          {counties.map(c => (
            <article key={c.county} className="county-card" onClick={() => { setCountyFilter(c.county); setActiveTab('table'); }}>
              <h3>{c.county} County</h3>
              <div className="county-stats">
                <div className="county-stat"><span>Total ZIPs</span><strong>{c.zips}</strong></div>
                <div className="county-stat tier1-stat"><span>Tier 1</span><strong>{c.tier1}</strong></div>
                <div className="county-stat tier2-stat"><span>Tier 2</span><strong>{c.tier2}</strong></div>
                <div className="county-stat tier3-stat"><span>Tier 3</span><strong>{c.tier3}</strong></div>
              </div>
              <div className="county-metrics">
                <span>Avg Income: <b>{money.format(c.avgIncome)}</b></span>
                <span>Avg Home Value: <b>{money.format(c.avgHomeValue)}</b></span>
                <span>Avg Budget Score: <b>{c.avgBudgetScore}</b></span>
                <span>Top ZIP: <b>{c.topZip}</b></span>
              </div>
              <div className="county-action">Click to filter table →</div>
            </article>
          ))}
        </section>
      )}

      {/* ── Top 10 Tab ── */}
      {activeTab === 'top10' && (
        <section className="top10-section">
          <div className="top10-header">
            <h2>Top 10 ZIP Codes for Renovation Ad Targeting</h2>
            <p>Ranked by renovation budget capacity score. These are your highest-priority ad targeting ZIPs.</p>
          </div>
          <div className="top10-grid">
            {top10.map((m, i) => (
              <article key={m.zip} className={`top10-card tier-card-${m.adTier}`}>
                <div className="top10-rank">#{i + 1}</div>
                <div className="top10-zip">{m.zip}</div>
                <div className="top10-city">{m.city}</div>
                <div className="top10-county">{m.county} County</div>
                <TierBadge tier={m.adTier} label={m.adTierLabel} />
                <div className="top10-metrics">
                  <div><span>Budget Score</span><strong>{m.budgetScore}</strong></div>
                  <div><span>Median Income</span><strong>{money.format(m.income)}</strong></div>
                  <div><span>Median Home Value</span><strong>{money.format(m.homeValue)}</strong></div>
                  <div><span>Owner Occupied</span><strong>{pct(m.ownerOccupied)}</strong></div>
                  <div><span>Luxury Share</span><strong>{pct(m.luxuryShare)}</strong></div>
                  <div><span>Reno Score</span><strong>{m.renovationScore}</strong></div>
                </div>
                {m.waterfrontZip ? <div className="top10-waterfront">🌊 Waterfront ZIP</div> : null}
              </article>
            ))}
          </div>
          <div className="top10-export">
            <button className="btn-primary" onClick={() => {
              const zips = top10.map(m => m.zip).join('\n');
              navigator.clipboard.writeText(zips);
              setCopiedMsg('Copied Top 10 ZIPs');
              setTimeout(() => setCopiedMsg(''), 3000);
            }}>
              📋 Copy Top 10 ZIPs for Ad Targeting
            </button>
            {copiedMsg && <span className="copy-confirm">{copiedMsg}</span>}
          </div>
        </section>
      )}

      <footer>
        <p>Tampa Bay Builder Intelligence v2.1 · Data: ACS 2024 5-year estimates · {new Date().getFullYear()}</p>
        <p>Tier 1 = $500K+ renovations · Tier 2 = $250K–$500K · Tier 3 = Monitor</p>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
