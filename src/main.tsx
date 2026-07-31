import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import { FaqView } from './FaqView';

/* ── Types ── */
type ZipMarket = {
  zip: string; county: string; city: string; latitude: number; longitude: number;
  population: number; income: number; homeValue: number; ownerOccupied: number;
  medianYearBuilt: number; luxuryShare: number; renovationScore: number;
  customHomeScore: number; waterfrontScore: number; teardownScore: number;
  opportunityScore: number; budgetScore: number; adTier: number; adTierLabel: string;
  tierColor: string; tierMapColor: string; rank: number;
  waterfrontZip: number; populationGrowth: number;
  recommendation: string; dataYear: number;
};
type Property = {
  id: number; address: string; city?: string; zip?: string; parcelId?: string;
  propertyType?: string; bedrooms?: number; bathrooms?: number; squareFeet?: number;
  lotSquareFeet?: number; yearBuilt?: number; estimatedValue?: number; assessedValue?: number;
  lastSaleDate?: string; lastSalePrice?: number; ownerOccupied?: boolean | null;
  floodZone?: string; sfha?: boolean | null; baseFloodElevation?: number | null;
  scores?: { renovationScore: number; teardownScore: number; luxuryPotential: number; opportunityScore: number };
};
type Prospect = {
  id: number; propertyId?: number | null; address: string; zip?: string; stage: string;
  priority?: string; estimatedValue?: number; opportunityScore?: number; noteCount?: number;
  createdAt: string; updatedAt: string;
  contacts?: any[]; notes?: { id: number; body: string; createdAt: string }[];
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const STAGES = ['New Lead', 'Researching', 'Qualified', 'Contacted', 'Proposal', 'Won', 'Lost'];

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed (${res.status})`);
  return res.json();
}

/* ── Modal ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <header className="modalHead"><h3>{title}</h3><button className="iconBtn" onClick={onClose}>✕</button></header>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

/* ── Tier badge — plain English ── */
function TierBadge({ tier }: { tier: number }) {
  if (tier === 1) return <span className="tierBadge t1">🔥 Top Target</span>;
  if (tier === 2) return <span className="tierBadge t2">✅ Good Target</span>;
  return <span className="tierBadge t3">👀 Watch List</span>;
}

/* ── Score bar — visual 0-100 bar ── */
function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 65 ? '#16a34a' : pct >= 40 ? '#2563eb' : '#d97706';
  return (
    <div className="scoreBarWrap" title={value + ' / ' + max}>
      <div className="scoreBarTrack">
        <div className="scoreBarFill" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="scoreBarNum">{value}</span>
    </div>
  );
}

/* ── Column header with tooltip ── */
type SortDir = 'asc' | 'desc';
function ColTh({ col, label, tip, sort, dir, onSort }: {
  col: string; label: string; tip: string; sort: string; dir: SortDir; onSort: (c: string) => void;
}) {
  const active = sort === col;
  return (
    <th
      className={'sortable' + (active ? ' sorted' : '')}
      onClick={() => onSort(col)}
      title={tip + ' — click to sort'}
    >
      <span className="thLabel">{label}</span>
      <span className="thSort">{active ? (dir === 'desc' ? ' ↓' : ' ↑') : ' ↕'}</span>
    </th>
  );
}

/* ── Score pill ── */
function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? '#16a34a' : value >= 55 ? '#1d4ed8' : '#d97706';
  return <div className="pill"><span>{label}</span><strong style={{ color }}>{value}</strong></div>;
}

/* ── Markets view ── */
function MarketsView({ markets, status, dataYear, onSaveProspect }:
  { markets: ZipMarket[]; status: string; dataYear: number; onSaveProspect: (m: ZipMarket) => void }) {

  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<number>(0);
  const [countyFilter, setCountyFilter] = useState('');
  const [minIncome, setMinIncome] = useState(0);
  const [minValue, setMinValue] = useState(0);
  const [maxYearBuilt, setMaxYearBuilt] = useState(2025);
  const [waterfrontOnly, setWaterfrontOnly] = useState(false);
  const [sort, setSort] = useState('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [explain, setExplain] = useState<{ zip: string; text: string; by: string } | null>(null);
  const [busy, setBusy] = useState('');
  const tableTopRef = useRef<HTMLDivElement>(null);
  const tableBottomRef = useRef<HTMLDivElement>(null);

  const counties = useMemo(() => ['', ...Array.from(new Set(markets.map(m => m.county))).sort()], [markets]);

  function handleSort(col: string) {
    if (sort === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSort(col); setSortDir(col === 'rank' || col === 'medianYearBuilt' ? 'asc' : 'desc'); }
  }

  const filtered = useMemo(() => {
    const list = markets.filter(m => {
      const text = (m.zip + ' ' + m.city + ' ' + m.county).toLowerCase();
      if (!text.includes(query.toLowerCase())) return false;
      if (tierFilter && m.adTier !== tierFilter) return false;
      if (countyFilter && m.county !== countyFilter) return false;
      if (m.income < minIncome) return false;
      if (m.homeValue < minValue) return false;
      if (m.medianYearBuilt > maxYearBuilt) return false;
      if (waterfrontOnly && !m.waterfrontZip) return false;
      return true;
    });
    return list.sort((a, b) => {
      const av = (a as any)[sort] ?? 0;
      const bv = (b as any)[sort] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [markets, query, tierFilter, countyFilter, minIncome, minValue, maxYearBuilt, waterfrontOnly, sort, sortDir]);

  const exportUrl = (format: string) => {
    const p = new URLSearchParams({ format, query, minIncome: String(minIncome), minValue: String(minValue), sort });
    return '/api/export/markets?' + p.toString();
  };

  async function explainMarket(m: ZipMarket) {
    setBusy(m.zip);
    try {
      const r = await api('/api/ai/explain-market', { method: 'POST', body: JSON.stringify({ market: m }) });
      setExplain({ zip: m.zip, text: r.summary, by: r.generatedBy });
    } catch (e: any) { setExplain({ zip: m.zip, text: 'Error: ' + e.message, by: '' }); }
    finally { setBusy(''); }
  }

  function dotColor(m: ZipMarket) {
    if (m.adTier === 1) return '#ef4444';
    if (m.adTier === 2) return '#f59e0b';
    return '#6b7280';
  }

  function scrollToTable() { tableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function scrollToBottom() { tableBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }
  function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  const t1 = filtered.filter(m => m.adTier === 1).length;
  const t2 = filtered.filter(m => m.adTier === 2).length;
  const t3 = filtered.filter(m => m.adTier === 3).length;

  return <>
    {/* ── Filter bar ── HIDDEN — activate when ready
    <section className="filters">
      <label>
        <span className="filterLabel">🔍 Search</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ZIP code, city, or county" />
      </label>
      <label>
        <span className="filterLabel">🎯 Target Level</span>
        <select value={tierFilter} onChange={e => setTierFilter(Number(e.target.value))}>
          <option value={0}>Show all ZIPs</option>
          <option value={1}>🔥 Top Targets only ($500K+ jobs)</option>
          <option value={2}>✅ Good Targets only ($250K–$500K jobs)</option>
          <option value={3}>👀 Watch List only</option>
        </select>
      </label>
      <label>
        <span className="filterLabel">📍 County</span>
        <select value={countyFilter} onChange={e => setCountyFilter(e.target.value)}>
          {counties.map(c => <option key={c} value={c}>{c || 'All counties'}</option>)}
        </select>
      </label>
      <label>
        <span className="filterLabel">💰 Household Income</span>
        <select value={minIncome} onChange={e => setMinIncome(Number(e.target.value))}>
          <option value={0}>Any income level</option>
          <option value={65000}>$65K+ per year</option>
          <option value={90000}>$90K+ per year</option>
          <option value={110000}>$110K+ per year</option>
          <option value={130000}>$130K+ per year (affluent)</option>
        </select>
      </label>
      <label>
        <span className="filterLabel">🏠 Home Value</span>
        <select value={minValue} onChange={e => setMinValue(Number(e.target.value))}>
          <option value={0}>Any home value</option>
          <option value={280000}>$280K+ homes</option>
          <option value={400000}>$400K+ homes</option>
          <option value={550000}>$550K+ homes</option>
          <option value={750000}>$750K+ homes (luxury)</option>
        </select>
      </label>
      <label>
        <span className="filterLabel">🏗️ Home Age</span>
        <select value={maxYearBuilt} onChange={e => setMaxYearBuilt(Number(e.target.value))}>
          <option value={2025}>Any age</option>
          <option value={2000}>Older than 25 years</option>
          <option value={1990}>Older than 35 years</option>
          <option value={1980}>Older than 45 years</option>
          <option value={1970}>Older than 55 years</option>
        </select>
      </label>
      <label className="checkLabel">
        <input type="checkbox" checked={waterfrontOnly} onChange={e => setWaterfrontOnly(e.target.checked)} />
        <span>🌊 Waterfront ZIPs only</span>
      </label>
    </section>
    ── END FILTER BAR */}

    {/* ── KPI summary cards ── */}
    <section className="kpis">
      <article className="kpiCard">
        <span className="kpiLabel">Total ZIPs shown</span>
        <strong className="kpiVal">{filtered.length}</strong>
        <span className="kpiSub">of 150 Tampa Bay ZIPs</span>
      </article>
      <article className="kpiCard kpiT1">
        <span className="kpiLabel">🔥 Top Targets</span>
        <strong className="kpiVal t1text">{t1}</strong>
        <span className="kpiSub">Can afford $500K+ renovations</span>
      </article>
      <article className="kpiCard kpiT2">
        <span className="kpiLabel">✅ Good Targets</span>
        <strong className="kpiVal t2text">{t2}</strong>
        <span className="kpiSub">Can afford $250K–$500K renovations</span>
      </article>
      <article className="kpiCard">
        <span className="kpiLabel">👀 Watch List</span>
        <strong className="kpiVal">{t3}</strong>
        <span className="kpiSub">Smaller budgets, monitor over time</span>
      </article>
      <article className="kpiCard">
        <span className="kpiLabel">💰 Avg Household Income</span>
        <strong className="kpiVal">{money.format(filtered.reduce((s, m) => s + m.income, 0) / (filtered.length || 1))}</strong>
        <span className="kpiSub">across filtered ZIPs</span>
      </article>
      <article className="kpiCard">
        <span className="kpiLabel">🏠 Avg Home Value</span>
        <strong className="kpiVal">{money.format(filtered.reduce((s, m) => s + m.homeValue, 0) / (filtered.length || 1))}</strong>
        <span className="kpiSub">across filtered ZIPs</span>
      </article>
    </section>

    {/* ── Export + scroll controls ── */}
    <section className="actionBar">
      <div className="actionBarLeft">
        <span className="muted">{filtered.length} ZIPs • {dataYear ? dataYear + ' Census data' : 'Local data'}</span>
      </div>
      <div className="actionBarRight">
        <a className="btn" href={exportUrl('xlsx')} title="Download as Excel spreadsheet">📊 Excel</a>
        <a className="btn ghost" href={exportUrl('csv')} title="Download as CSV">📄 CSV</a>
        <a className="btn ghost" href={'/api/export/zip-list?tier=' + (tierFilter || '')} target="_blank" title="Get a plain list of ZIP codes to paste into Google Ads or Meta Ads">📋 ZIP List for Ads</a>
        <button className="btn ghost scrollBtn" onClick={scrollToTable} title="Jump to table">⬇ Jump to Table</button>
        <button className="btn ghost scrollBtn" onClick={scrollToTop} title="Back to top">⬆ Top</button>
      </div>
    </section>

    {/* ── Map ── */}
    <section className="mapCard">
      <div className="mapLegend">
        <strong style={{ marginRight: 8 }}>Map key:</strong>
        <span className="mapDot" style={{ background: '#ef4444' }} /><span>🔥 Top Target ($500K+ jobs)</span>
        <span className="mapDot" style={{ background: '#f59e0b' }} /><span>✅ Good Target ($250K–$500K)</span>
        <span className="mapDot" style={{ background: '#6b7280' }} /><span>👀 Watch List</span>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>Click any dot for details</span>
      </div>
      <MapContainer center={[27.95, -82.46]} zoom={9} scrollWheelZoom className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filtered.map(m => (
          <CircleMarker
            key={m.zip}
            center={[m.latitude, m.longitude]}
            radius={m.adTier === 1 ? 11 : m.adTier === 2 ? 8 : 5}
            pathOptions={{ fillColor: dotColor(m), color: '#fff', fillOpacity: 0.88, weight: 1.5 }}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <strong style={{ fontSize: 15 }}>{m.zip} — {m.city}</strong><br />
                <span style={{ color: '#6b7280', fontSize: 12 }}>{m.county} County</span><br /><br />
                <TierBadge tier={m.adTier} /><br /><br />
                <table style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    <tr><td style={{ color: '#6b7280', paddingRight: 8 }}>Rank</td><td><strong>#{m.rank}</strong></td></tr>
                    <tr><td style={{ color: '#6b7280' }}>Ad Budget Score</td><td><strong>{m.budgetScore}/100</strong></td></tr>
                    <tr><td style={{ color: '#6b7280' }}>Household Income</td><td>{money.format(m.income)}</td></tr>
                    <tr><td style={{ color: '#6b7280' }}>Avg Home Value</td><td>{money.format(m.homeValue)}</td></tr>
                    <tr><td style={{ color: '#6b7280' }}>Homeowners</td><td>{m.ownerOccupied}% own</td></tr>
                    <tr><td style={{ color: '#6b7280' }}>Homes built</td><td>avg {m.medianYearBuilt}</td></tr>
                    <tr><td style={{ color: '#6b7280' }}>Luxury homes</td><td>{m.luxuryShare}% of area</td></tr>
                    <tr><td style={{ color: '#6b7280' }}>Reno Score</td><td>{m.renovationScore}/100</td></tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  {m.waterfrontZip ? <span>🌊 Waterfront area&nbsp;&nbsp;</span> : null}
                  {m.populationGrowth >= 2 ? <span>📈 Fast-growing area</span> : null}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </section>

    {/* ── Table top anchor + scroll-to-bottom ── */}
    <div ref={tableTopRef} className="tableNav">
      <span className="muted">{filtered.length} ZIP codes — click any column header to sort</span>
      <button className="btn ghost scrollBtn" onClick={scrollToBottom} title="Jump to bottom of table">⬇ Jump to Bottom</button>
    </div>

    {/* ── Table ── */}
    <section className="tableCard">
      <table>
        <thead>
          <tr>
            <ColTh col="rank" label="Rank" tip="Overall rank from best to worst ad target" sort={sort} dir={sortDir} onSort={handleSort} />
            <ColTh col="zip" label="ZIP Code" tip="5-digit postal ZIP code" sort={sort} dir={sortDir} onSort={handleSort} />
            <th title="City and county name">Neighborhood</th>
            <th title="How good this ZIP is for targeting renovation ads">Ad Target Level</th>
            <ColTh col="budgetScore" label="Ad Score" tip="0–100 score: how likely homeowners here can afford a $250K–$500K+ renovation" sort={sort} dir={sortDir} onSort={handleSort} />
            <ColTh col="income" label="Household Income" tip="Median annual household income — higher means more renovation budget" sort={sort} dir={sortDir} onSort={handleSort} />
            <ColTh col="homeValue" label="Home Value" tip="Median home value — higher-value homes need bigger renovations" sort={sort} dir={sortDir} onSort={handleSort} />
            <ColTh col="ownerOccupied" label="Homeowners" tip="% of residents who OWN (not rent) their home — owners hire contractors" sort={sort} dir={sortDir} onSort={handleSort} />
            <ColTh col="medianYearBuilt" label="Avg Year Built" tip="Older homes need more renovation work — lower year = more opportunity" sort={sort} dir={sortDir} onSort={handleSort} />
            <ColTh col="luxuryShare" label="Luxury Homes" tip="% of homes valued over $750K — signals high-end renovation culture" sort={sort} dir={sortDir} onSort={handleSort} />
            <ColTh col="renovationScore" label="Reno Score" tip="0–100 score combining home age, value, and ownership rate" sort={sort} dir={sortDir} onSort={handleSort} />
            <ColTh col="opportunityScore" label="Overall Score" tip="Final combined score — higher is better for targeting ads" sort={sort} dir={sortDir} onSort={handleSort} />
            <th title="Special characteristics of this ZIP code">Highlights</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(m => (
            <tr key={m.zip} className={m.adTier === 1 ? 'rowT1' : m.adTier === 2 ? 'rowT2' : ''}>
              <td className="rankCell">
                {m.rank <= 3 ? ['🥇','🥈','🥉'][m.rank - 1] : '#' + m.rank}
              </td>
              <td><strong>{m.zip}</strong></td>
              <td className="marketCell">{m.city}<small>{m.county} County</small></td>
              <td><TierBadge tier={m.adTier} /></td>
              <td><ScoreBar value={m.budgetScore} /></td>
              <td>{money.format(m.income)}</td>
              <td>{money.format(m.homeValue)}</td>
              <td>
                <span className={m.ownerOccupied >= 70 ? 'statGood' : m.ownerOccupied >= 55 ? 'statOk' : 'statLow'}>
                  {m.ownerOccupied}%
                </span>
              </td>
              <td>
                <span className={m.medianYearBuilt <= 1980 ? 'statGood' : m.medianYearBuilt <= 1995 ? 'statOk' : ''}>
                  {m.medianYearBuilt}
                </span>
              </td>
              <td>{m.luxuryShare}%</td>
              <td><ScoreBar value={m.renovationScore} /></td>
              <td><ScoreBar value={m.opportunityScore} /></td>
              <td className="flags">
                {m.waterfrontZip ? <span className="flag" title="Waterfront ZIP — premium renovation market">🌊 Water</span> : null}
                {m.populationGrowth >= 2 ? <span className="flag" title="Fast-growing area — new residents = new renovation demand">📈 Growing</span> : null}
                {m.luxuryShare >= 30 ? <span className="flag" title="High concentration of luxury homes">💎 Luxury</span> : null}
              </td>
              <td className="actions">
                <button className="chip primary" disabled={busy === m.zip} onClick={() => explainMarket(m)}
                  title="Get an AI explanation of why this ZIP scored the way it did">
                  {busy === m.zip ? '...' : '✨ Why?'}
                </button>
                <a className="chip" href={'/api/reports/market/' + m.zip} target="_blank"
                  title="Download a PDF report for this ZIP">📄 Report</a>
                <button className="chip" onClick={() => onSaveProspect(m)}
                  title="Save this ZIP to your prospect pipeline">＋ Save</button>
              </td>
            </tr>
          ))}
          {!filtered.length && (
            <tr><td colSpan={14} className="empty">No ZIP codes match your filters. Try relaxing the filters above.</td></tr>
          )}
        </tbody>
      </table>
    </section>

    {/* ── Table bottom anchor + scroll-to-top ── */}
    <div ref={tableBottomRef} className="tableNav tableNavBottom">
      <span className="muted">{filtered.length} ZIP codes shown</span>
      <div className="btnRow">
        <button className="btn ghost scrollBtn" onClick={scrollToTable} title="Back to top of table">⬆ Table Top</button>
        <button className="btn ghost scrollBtn" onClick={scrollToTop} title="Back to page top">⬆ Page Top</button>
      </div>
    </div>

    {explain && (
      <Modal title={'Why ZIP ' + explain.zip + ' scored this way'} onClose={() => setExplain(null)}>
        <p className="aiText">{explain.text}</p>
        {explain.by && <p className="muted small">Generated by {explain.by}</p>}
      </Modal>
    )}
  </>;
}

/* ── Property lookup view ── */
function PropertyView({ onSaveProspect }: { onSaveProspect: (p: Property) => void }) {
  const [address, setAddress] = useState('');
  const [property, setProperty] = useState<Property | null>(null);
  const [providers, setProviders] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [letter, setLetter] = useState<{ text: string; by: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setBusy(true); setStatus('Looking up...'); setProperty(null);
    try {
      const r = await api('/api/properties/lookup', { method: 'POST', body: JSON.stringify({ address }) });
      setProperty(r.property); setProviders(r.providers);
      setStatus(r.cached ? 'Loaded from cache' : 'Fetched from providers');
    } catch (e: any) { setStatus('Error: ' + e.message); }
    finally { setBusy(false); }
  }

  async function draft() {
    if (!property) return;
    setBusy(true);
    try {
      const r = await api('/api/ai/outreach-draft', { method: 'POST', body: JSON.stringify({ property }) });
      setLetter({ text: r.letter, by: r.generatedBy });
    } catch (e: any) { setLetter({ text: 'Error: ' + e.message, by: '' }); }
    finally { setBusy(false); }
  }

  const s = property?.scores;
  return <>
    <section className="filters">
      <form onSubmit={lookup} className="lookupForm">
        <label style={{ flex: 1 }}>
          <span className="filterLabel">🏠 Enter a property address</span>
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="123 Bayshore Blvd, Tampa, FL 33606" />
        </label>
        <button className="btn" disabled={busy} type="submit" style={{ alignSelf: 'flex-end' }}>
          {busy ? 'Looking up...' : '🔍 Look Up Property'}
        </button>
      </form>
    </section>
    {status && <p className="muted" style={{ padding: '0 4px' }}>
      {status}
      {providers ? ' • data sources: ' + Object.entries(providers).map(([k, v]: any) => k + ' ' + (v.ok ? '✓' : '✕')).join(', ') : ''}
    </p>}
    {property && (
      <section className="propCard">
        <div className="propHead">
          <div>
            <h2>{property.address}</h2>
            <span className="muted">{property.propertyType || 'Property'} • {property.zip}</span>
          </div>
          <div className="btnRow">
            <button className="btn" disabled={busy} onClick={draft}>✉ Write Outreach Letter</button>
            <a className="btn ghost" href={'/api/reports/property/' + property.id} target="_blank">📄 Download PDF Report</a>
            <button className="btn ghost" onClick={() => onSaveProspect(property)}>＋ Save to My Pipeline</button>
          </div>
        </div>
        <div className="propGrid">
          <div><span>Year built</span><strong>{property.yearBuilt ?? '—'}</strong></div>
          <div><span>Building size</span><strong>{property.squareFeet ? property.squareFeet.toLocaleString() + ' sqft' : '—'}</strong></div>
          <div><span>Lot size</span><strong>{property.lotSquareFeet ? property.lotSquareFeet.toLocaleString() + ' sqft' : '—'}</strong></div>
          <div><span>Beds / Baths</span><strong>{property.bedrooms ?? '—'} / {property.bathrooms ?? '—'}</strong></div>
          <div><span>Estimated value</span><strong>{property.estimatedValue ? money.format(property.estimatedValue) : '—'}</strong></div>
          <div><span>Tax assessed value</span><strong>{property.assessedValue ? money.format(property.assessedValue) : '—'}</strong></div>
          <div><span>Flood zone</span><strong>{property.floodZone || '—'}{property.sfha ? ' (high risk)' : ''}</strong></div>
          <div><span>Owner lives here?</span><strong>{property.ownerOccupied == null ? '—' : (property.ownerOccupied ? 'Yes — owner occupied' : 'No — rental')}</strong></div>
        </div>
        {s && (
          <div className="scoreRow">
            <ScorePill label="Overall Score" value={s.opportunityScore} />
            <ScorePill label="Renovation Potential" value={s.renovationScore} />
            <ScorePill label="Teardown Potential" value={s.teardownScore} />
            <ScorePill label="Luxury Potential" value={s.luxuryPotential} />
          </div>
        )}
      </section>
    )}
    {letter && (
      <Modal title="Outreach letter draft" onClose={() => setLetter(null)}>
        <pre className="letter">{letter.text}</pre>
        {letter.by && <p className="muted small">Generated by {letter.by}</p>}
        <button className="btn" onClick={() => navigator.clipboard?.writeText(letter.text)}>📋 Copy to clipboard</button>
      </Modal>
    )}
  </>;
}

/* ── Prospects (CRM) view ── */
function ProspectsView() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [active, setActive] = useState<Prospect | null>(null);
  const [status, setStatus] = useState('Loading prospects...');
  const [view, setView] = useState<'kanban' | 'table'>('kanban');

  async function load() {
    try {
      const r = await api('/api/prospects');
      setProspects(r.prospects);
      setStatus(r.prospects.length + ' saved prospects');
    } catch (e: any) { setStatus(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function openDetail(id: number) {
    const r = await api('/api/prospects/' + id);
    setActive(r.prospect);
  }
  async function remove(id: number) {
    if (!confirm('Delete this prospect?')) return;
    await api('/api/prospects/' + id, { method: 'DELETE' });
    setActive(null); load();
  }

  return <>
    <section className="sectionHead">
      <span className="muted">{status}</span>
      <div className="btnRow">
        <button className={'btn ghost' + (view === 'kanban' ? ' on' : '')} onClick={() => setView('kanban')}>📋 Pipeline View</button>
        <button className={'btn ghost' + (view === 'table' ? ' on' : '')} onClick={() => setView('table')}>📊 Table View</button>
      </div>
    </section>

    {view === 'kanban' ? (
      <div className="kanban">
        {STAGES.map(stage => {
          const items = prospects.filter(p => p.stage === stage);
          return (
            <div className="col" key={stage}>
              <header>{stage}<span>{items.length}</span></header>
              {items.map(p => (
                <button className="cardItem" key={p.id} onClick={() => openDetail(p.id)}>
                  <b>{p.address}</b>
                  <small>{p.zip || ''} {p.estimatedValue ? '• ' + money.format(p.estimatedValue) : ''}</small>
                  <small>Score {p.opportunityScore ?? '—'} • {p.noteCount || 0} notes</small>
                </button>
              ))}
              {!items.length && <p className="empty">None yet</p>}
            </div>
          );
        })}
      </div>
    ) : (
      <section className="tableCard">
        <table>
          <thead>
            <tr>
              <th>Address</th><th>ZIP</th><th>Stage</th><th>Priority</th>
              <th>Est. Value</th><th>Score</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map(p => (
              <tr key={p.id} className="clickRow" onClick={() => openDetail(p.id)}>
                <td>{p.address}</td>
                <td>{p.zip || '—'}</td>
                <td>{p.stage}</td>
                <td>{p.priority || '—'}</td>
                <td>{p.estimatedValue ? money.format(p.estimatedValue) : '—'}</td>
                <td>{p.opportunityScore ?? '—'}</td>
                <td>{p.noteCount || 0}</td>
              </tr>
            ))}
            {!prospects.length && (
              <tr><td colSpan={7} className="empty">No prospects saved yet. Save one from the Markets or Property Lookup tab.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    )}

    {active && (
      <ProspectModal
        prospect={active}
        onClose={() => setActive(null)}
        onChange={() => { load(); }}
        onDelete={() => remove(active.id)}
      />
    )}
  </>;
}

/* ── Prospect modal ── */
function ProspectModal({ prospect, onClose, onChange, onDelete }:
  { prospect: Prospect; onClose: () => void; onChange: () => void; onDelete: () => void }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function setStage(stage: string) {
    setSaving(true);
    try { await api('/api/prospects/' + prospect.id, { method: 'PATCH', body: JSON.stringify({ stage }) }); onChange(); }
    finally { setSaving(false); }
  }

  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api('/api/prospects/' + prospect.id + '/notes', { method: 'POST', body: JSON.stringify({ body: note }) });
      setNote(''); onChange();
    } finally { setSaving(false); }
  }

  return (
    <Modal title={prospect.address} onClose={onClose}>
      <p className="muted">
        {prospect.zip || ''} {prospect.estimatedValue ? '• ' + money.format(prospect.estimatedValue) : ''} • Score {prospect.opportunityScore ?? '—'}
      </p>
      <label className="field">Pipeline stage
        <select value={prospect.stage} disabled={saving} onChange={e => setStage(e.target.value)}>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <h4>Notes</h4>
      <div className="noteAdd">
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Log a call, meeting, or next step..." rows={2} />
        <button className="btn" disabled={saving} onClick={addNote}>Add Note</button>
      </div>
      <ul className="notes">
        {(prospect.notes || []).map(n => (
          <li key={n.id}><span>{new Date(n.createdAt).toLocaleString('en-US')}</span>{n.body}</li>
        ))}
        {!(prospect.notes || []).length && <li className="empty">No notes yet.</li>}
      </ul>
      <div className="btnRow" style={{ marginTop: 16 }}>
        <button className="btn danger" onClick={onDelete}>🗑 Delete prospect</button>
      </div>
    </Modal>
  );
}

/* ── App shell ── */
function App() {
  const [markets, setMarkets] = useState<ZipMarket[]>([]);
  const [dataYear, setDataYear] = useState(0);
  const [status, setStatus] = useState('Loading...');
  const [tab, setTab] = useState<'markets' | 'property' | 'prospects' | 'faq'>('markets');
  const [toast, setToast] = useState('');

  async function load() {
    const payload = await api('/api/markets');
    setMarkets(payload.markets); setDataYear(payload.dataYear);
    setStatus(payload.markets.length + ' ZIP markets loaded');
  }
  useEffect(() => { load().catch(e => setStatus(e.message)); }, []);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  async function saveMarketProspect(m: ZipMarket) {
    try {
      await api('/api/prospects', { method: 'POST', body: JSON.stringify({
        address: m.city + ' ' + m.zip + ' (market)', zip: m.zip,
        estimatedValue: m.homeValue, opportunityScore: m.opportunityScore
      }) });
      flash('Saved ' + m.zip + ' to your pipeline!');
    } catch (e: any) { flash(e.message); }
  }

  async function savePropertyProspect(p: Property) {
    try {
      await api('/api/prospects', { method: 'POST', body: JSON.stringify({
        address: p.address, zip: p.zip, propertyId: p.id,
        estimatedValue: p.estimatedValue ?? p.assessedValue,
        opportunityScore: p.scores?.opportunityScore
      }) });
      flash('Property saved to your pipeline!');
    } catch (e: any) { flash(e.message); }
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">Tampa Bay Area</p>
          <h1>Builder Market Intelligence</h1>
          <p className="headerSub">Find the best ZIP codes to target renovation ads — ranked by who can afford $250K–$500K+ projects</p>
        </div>
        <div className="status">
          <span className="statusDot" />
          <span>{status}</span>
        </div>
      </header>
      <nav className="tabs">
        <button className={tab === 'markets' ? 'on' : ''} onClick={() => setTab('markets')}>
          📍 ZIP Rankings
        </button>
        {/* 🏠 Property Lookup — hidden until activated
        <button className={tab === 'property' ? 'on' : ''} onClick={() => setTab('property')}>
          🏠 Property Lookup
        </button>
        */}
        {/* 📋 My Pipeline — hidden until activated
        <button className={tab === 'prospects' ? 'on' : ''} onClick={() => setTab('prospects')}>
          📋 My Pipeline
        </button>
        */}
        <button className={tab === 'faq' ? 'on' : ''} onClick={() => setTab('faq')}>
          ❓ How It Works
        </button>
      </nav>
      {tab === 'markets' && <MarketsView markets={markets} status={status} dataYear={dataYear} onSaveProspect={saveMarketProspect} />}
      {/* tab === 'property' && <PropertyView onSaveProspect={savePropertyProspect} /> — hidden until activated */}
      {/* tab === 'prospects' && <ProspectsView /> — hidden until activated */}
      {tab === 'faq' && <FaqView />}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
