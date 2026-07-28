import React, { useEffect, useMemo, useState } from 'react';
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
        <header className="modalHead"><h3>{title}</h3><button className="iconBtn" onClick={onClose}>X</button></header>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

/* ── Tier badge ── */
function TierBadge({ tier, label }: { tier: number; label: string }) {
  const cls = tier === 1 ? 'tierBadge t1' : tier === 2 ? 'tierBadge t2' : 'tierBadge t3';
  return <span className={cls}>{label || `T${tier}`}</span>;
}

/* ── Sort header ── */
type SortDir = 'asc' | 'desc';
function SortTh({ col, label, sort, dir, onSort }: {
  col: string; label: string; sort: string; dir: SortDir; onSort: (c: string) => void;
}) {
  const active = sort === col;
  return (
    <th className={'sortable' + (active ? ' sorted' : '')} onClick={() => onSort(col)}>
      {label}{active ? (dir === 'desc' ? ' v' : ' ^') : ' ~'}
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

  const counties = useMemo(() => ['', ...Array.from(new Set(markets.map(m => m.county))).sort()], [markets]);

  function handleSort(col: string) {
    if (sort === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSort(col); setSortDir(col === 'rank' ? 'asc' : 'desc'); }
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

  return <>
    <section className="filters">
      <label>Search
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ZIP, city or county" />
      </label>
      <label>Ad Tier
        <select value={tierFilter} onChange={e => setTierFilter(Number(e.target.value))}>
          <option value={0}>All tiers</option>
          <option value={1}>Tier 1 — $500K+</option>
          <option value={2}>Tier 2 — $250K–$500K</option>
          <option value={3}>Tier 3 — Monitor</option>
        </select>
      </label>
      <label>County
        <select value={countyFilter} onChange={e => setCountyFilter(e.target.value)}>
          {counties.map(c => <option key={c} value={c}>{c || 'All counties'}</option>)}
        </select>
      </label>
      <label>Min income
        <select value={minIncome} onChange={e => setMinIncome(Number(e.target.value))}>
          <option value={0}>Any</option>
          <option value={65000}>$65K+</option>
          <option value={90000}>$90K+</option>
          <option value={110000}>$110K+</option>
          <option value={130000}>$130K+</option>
        </select>
      </label>
      <label>Min home value
        <select value={minValue} onChange={e => setMinValue(Number(e.target.value))}>
          <option value={0}>Any</option>
          <option value={280000}>$280K+</option>
          <option value={400000}>$400K+</option>
          <option value={550000}>$550K+</option>
          <option value={750000}>$750K+</option>
        </select>
      </label>
      <label>Built before
        <select value={maxYearBuilt} onChange={e => setMaxYearBuilt(Number(e.target.value))}>
          <option value={2025}>Any year</option>
          <option value={2000}>Before 2000</option>
          <option value={1990}>Before 1990</option>
          <option value={1980}>Before 1980</option>
          <option value={1970}>Before 1970</option>
        </select>
      </label>
      <label className="checkLabel">
        <input type="checkbox" checked={waterfrontOnly} onChange={e => setWaterfrontOnly(e.target.checked)} />
        Waterfront only
      </label>
    </section>

    <section className="sectionHead">
      <span className="muted">{status}{dataYear ? ' • ' + dataYear + ' ACS data' : ''} • {filtered.length} ZIPs shown</span>
      <div className="btnRow">
        <a className="btn" href={exportUrl('xlsx')}>Download Excel</a>
        <a className="btn ghost" href={exportUrl('csv')}>Download CSV</a>
        <a className="btn ghost" href={'/api/export/zip-list?tier=' + (tierFilter || '')} target="_blank">Copy ZIP List</a>
      </div>
    </section>

    <section className="kpis">
      <article><span>Matching ZIPs</span><strong>{filtered.length}</strong></article>
      <article><span>Tier 1 ($500K+)</span><strong className="t1text">{filtered.filter(m => m.adTier === 1).length}</strong></article>
      <article><span>Tier 2 ($250K+)</span><strong className="t2text">{filtered.filter(m => m.adTier === 2).length}</strong></article>
      <article><span>Avg income</span><strong>{money.format(filtered.reduce((s, m) => s + m.income, 0) / (filtered.length || 1))}</strong></article>
      <article><span>Avg home value</span><strong>{money.format(filtered.reduce((s, m) => s + m.homeValue, 0) / (filtered.length || 1))}</strong></article>
    </section>

    <section className="mapCard">
      <div className="mapLegend">
        <span className="mapDot" style={{ background: '#ef4444' }} /> Tier 1 ($500K+)
        <span className="mapDot" style={{ background: '#f59e0b' }} /> Tier 2 ($250K–$500K)
        <span className="mapDot" style={{ background: '#6b7280' }} /> Tier 3 (Monitor)
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
            radius={m.adTier === 1 ? 10 : m.adTier === 2 ? 7 : 5}
            pathOptions={{ fillColor: dotColor(m), color: dotColor(m), fillOpacity: 0.82, weight: 1.5 }}
          >
            <Popup>
              <div style={{ minWidth: 190 }}>
                <strong style={{ fontSize: 15 }}>{m.zip} — {m.city}</strong><br />
                <span style={{ color: '#6b7280', fontSize: 12 }}>{m.county} County</span><br /><br />
                <TierBadge tier={m.adTier} label={m.adTierLabel} /><br /><br />
                <b>Rank:</b> #{m.rank}<br />
                <b>Budget Score:</b> {m.budgetScore}<br />
                <b>Income:</b> {money.format(m.income)}<br />
                <b>Home Value:</b> {money.format(m.homeValue)}<br />
                <b>Owner %:</b> {m.ownerOccupied}%<br />
                <b>Year Built:</b> {m.medianYearBuilt}<br />
                <b>Luxury %:</b> {m.luxuryShare}%<br />
                <b>Reno Score:</b> {m.renovationScore}<br />
                {m.waterfrontZip ? '🌊 Waterfront  ' : ''}
                {m.populationGrowth >= 2 ? '📈 Growing' : ''}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </section>

    <section className="tableCard">
      <table>
        <thead>
          <tr>
            <SortTh col="rank" label="#" sort={sort} dir={sortDir} onSort={handleSort} />
            <SortTh col="zip" label="ZIP" sort={sort} dir={sortDir} onSort={handleSort} />
            <th>Market</th>
            <th>Ad Tier</th>
            <SortTh col="budgetScore" label="Budget Score" sort={sort} dir={sortDir} onSort={handleSort} />
            <SortTh col="income" label="Income" sort={sort} dir={sortDir} onSort={handleSort} />
            <SortTh col="homeValue" label="Home Value" sort={sort} dir={sortDir} onSort={handleSort} />
            <SortTh col="ownerOccupied" label="Owner %" sort={sort} dir={sortDir} onSort={handleSort} />
            <SortTh col="medianYearBuilt" label="Year Built" sort={sort} dir={sortDir} onSort={handleSort} />
            <SortTh col="luxuryShare" label="Luxury %" sort={sort} dir={sortDir} onSort={handleSort} />
            <SortTh col="renovationScore" label="Reno Score" sort={sort} dir={sortDir} onSort={handleSort} />
            <SortTh col="opportunityScore" label="Opportunity" sort={sort} dir={sortDir} onSort={handleSort} />
            <th>Flags</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(m => (
            <tr key={m.zip} className={m.adTier === 1 ? 'rowT1' : m.adTier === 2 ? 'rowT2' : ''}>
              <td className="rankCell">#{m.rank}</td>
              <td><strong>{m.zip}</strong></td>
              <td>{m.city}<small>{m.county}</small></td>
              <td><TierBadge tier={m.adTier} label={m.adTierLabel} /></td>
              <td><strong>{m.budgetScore}</strong></td>
              <td>{money.format(m.income)}</td>
              <td>{money.format(m.homeValue)}</td>
              <td>{m.ownerOccupied}%</td>
              <td>{m.medianYearBuilt}</td>
              <td>{m.luxuryShare}%</td>
              <td>{m.renovationScore}</td>
              <td><strong>{m.opportunityScore}</strong></td>
              <td className="flags">
                {m.waterfrontZip ? <span title="Waterfront">🌊</span> : null}
                {m.populationGrowth >= 2 ? <span title="Growing">📈</span> : null}
              </td>
              <td className="actions">
                <button className="chip" disabled={busy === m.zip} onClick={() => explainMarket(m)}>
                  {busy === m.zip ? '...' : 'Explain'}
                </button>
                <a className="chip" href={'/api/reports/market/' + m.zip} target="_blank">PDF</a>
                <button className="chip" onClick={() => onSaveProspect(m)}>+ Save</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>

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
        <label style={{ flex: 1 }}>Property address
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="123 Bayshore Blvd, Tampa, FL 33606" />
        </label>
        <button className="btn" disabled={busy} type="submit">{busy ? '...' : 'Look up'}</button>
      </form>
    </section>
    {status && <p className="muted" style={{ padding: '0 4px' }}>
      {status}
      {providers ? ' • providers: ' + Object.entries(providers).map(([k, v]: any) => k + ':' + (v.ok ? 'OK' : (v.error ? 'ERR' : '-'))).join(' ') : ''}
    </p>}
    {property && (
      <section className="propCard">
        <div className="propHead">
          <div>
            <h2>{property.address}</h2>
            <span className="muted">{property.propertyType || 'Property'} • {property.zip}</span>
          </div>
          <div className="btnRow">
            <button className="btn" disabled={busy} onClick={draft}>Draft Outreach Letter</button>
            <a className="btn ghost" href={'/api/reports/property/' + property.id} target="_blank">PDF Report</a>
            <button className="btn ghost" onClick={() => onSaveProspect(property)}>+ Save to Prospects</button>
          </div>
        </div>
        <div className="propGrid">
          <div><span>Year built</span><strong>{property.yearBuilt ?? '—'}</strong></div>
          <div><span>Building</span><strong>{property.squareFeet ? property.squareFeet.toLocaleString() + ' sqft' : '—'}</strong></div>
          <div><span>Lot</span><strong>{property.lotSquareFeet ? property.lotSquareFeet.toLocaleString() + ' sqft' : '—'}</strong></div>
          <div><span>Beds / Baths</span><strong>{property.bedrooms ?? '—'} / {property.bathrooms ?? '—'}</strong></div>
          <div><span>Estimated value</span><strong>{property.estimatedValue ? money.format(property.estimatedValue) : '—'}</strong></div>
          <div><span>Assessed value</span><strong>{property.assessedValue ? money.format(property.assessedValue) : '—'}</strong></div>
          <div><span>Flood zone</span><strong>{property.floodZone || '—'}{property.sfha ? ' (SFHA)' : ''}</strong></div>
          <div><span>Owner occupied</span><strong>{property.ownerOccupied == null ? '—' : (property.ownerOccupied ? 'Yes' : 'No')}</strong></div>
        </div>
        {s && (
          <div className="scoreRow">
            <ScorePill label="Overall" value={s.opportunityScore} />
            <ScorePill label="Renovation" value={s.renovationScore} />
            <ScorePill label="Teardown" value={s.teardownScore} />
            <ScorePill label="Luxury" value={s.luxuryPotential} />
          </div>
        )}
      </section>
    )}
    {letter && (
      <Modal title="Outreach letter draft" onClose={() => setLetter(null)}>
        <pre className="letter">{letter.text}</pre>
        {letter.by && <p className="muted small">Generated by {letter.by}</p>}
        <button className="btn" onClick={() => navigator.clipboard?.writeText(letter.text)}>Copy to clipboard</button>
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
        <button className={'btn ghost' + (view === 'kanban' ? ' on' : '')} onClick={() => setView('kanban')}>Kanban</button>
        <button className={'btn ghost' + (view === 'table' ? ' on' : '')} onClick={() => setView('table')}>Table</button>
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
                  <small>Opp {p.opportunityScore ?? '—'} • {p.noteCount || 0} notes</small>
                </button>
              ))}
              {!items.length && <p className="empty">—</p>}
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
              <th>Est. value</th><th>Opportunity</th><th>Notes</th>
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
        {prospect.zip || ''} {prospect.estimatedValue ? '• ' + money.format(prospect.estimatedValue) : ''} • Opportunity {prospect.opportunityScore ?? '—'}
      </p>
      <label className="field">Stage
        <select value={prospect.stage} disabled={saving} onChange={e => setStage(e.target.value)}>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <h4>Notes</h4>
      <div className="noteAdd">
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Log an interaction..." rows={2} />
        <button className="btn" disabled={saving} onClick={addNote}>Add</button>
      </div>
      <ul className="notes">
        {(prospect.notes || []).map(n => (
          <li key={n.id}><span>{new Date(n.createdAt).toLocaleString('en-US')}</span>{n.body}</li>
        ))}
        {!(prospect.notes || []).length && <li className="empty">No notes yet.</li>}
      </ul>
      <div className="btnRow" style={{ marginTop: 16 }}>
        <button className="btn danger" onClick={onDelete}>Delete prospect</button>
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
      flash('Saved ' + m.zip + ' to prospects');
    } catch (e: any) { flash(e.message); }
  }

  async function savePropertyProspect(p: Property) {
    try {
      await api('/api/prospects', { method: 'POST', body: JSON.stringify({
        address: p.address, zip: p.zip, propertyId: p.id,
        estimatedValue: p.estimatedValue ?? p.assessedValue,
        opportunityScore: p.scores?.opportunityScore
      }) });
      flash('Saved property to prospects');
    } catch (e: any) { flash(e.message); }
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">Tampa Bay</p>
          <h1>Builder Market Intelligence</h1>
        </div>
        <div className="status">v2.1.0<br /><span>{status}</span></div>
      </header>
      <nav className="tabs">
        <button className={tab === 'markets' ? 'on' : ''} onClick={() => setTab('markets')}>Markets</button>
        <button className={tab === 'property' ? 'on' : ''} onClick={() => setTab('property')}>Property Lookup</button>
        <button className={tab === 'prospects' ? 'on' : ''} onClick={() => setTab('prospects')}>Saved Prospects</button>
        <button className={tab === 'faq' ? 'on' : ''} onClick={() => setTab('faq')}>How It Works</button>
      </nav>
      {tab === 'markets' && <MarketsView markets={markets} status={status} dataYear={dataYear} onSaveProspect={saveMarketProspect} />}
      {tab === 'property' && <PropertyView onSaveProspect={savePropertyProspect} />}
      {tab === 'prospects' && <ProspectsView />}
      {tab === 'faq' && <FaqView />}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
