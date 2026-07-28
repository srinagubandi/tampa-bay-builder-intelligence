import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import { FaqView } from './FaqView';

type ZipMarket = {
  zip: string; county: string; city: string; latitude: number; longitude: number;
  population: number; income: number; homeValue: number; ownerOccupied: number;
  medianYearBuilt: number; luxuryShare: number; renovationScore: number;
  customHomeScore: number; waterfrontScore: number; teardownScore: number;
  opportunityScore: number; recommendation: string; dataYear: number;
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

/* ------------------------------- Modal ------------------------------- */
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

/* ------------------------------- Markets view ------------------------------- */
function MarketsView({ markets, status, dataYear, onSaveProspect }:
  { markets: ZipMarket[]; status: string; dataYear: number; onSaveProspect: (m: ZipMarket) => void }) {
  const [query, setQuery] = useState('');
  const [minIncome, setMinIncome] = useState(75000);
  const [minValue, setMinValue] = useState(300000);
  const [sort, setSort] = useState<keyof ZipMarket>('opportunityScore');
  const [explain, setExplain] = useState<{ zip: string; text: string; by: string } | null>(null);
  const [busy, setBusy] = useState('');

  const filtered = useMemo(() => markets.filter(m => {
    const text = `${m.zip} ${m.city} ${m.county}`.toLowerCase();
    return text.includes(query.toLowerCase()) && m.income >= minIncome && m.homeValue >= minValue;
  }).sort((a, b) => Number(b[sort]) - Number(a[sort])), [markets, query, minIncome, minValue, sort]);

  const exportUrl = (format: string) => {
    const p = new URLSearchParams({ format, query, minIncome: String(minIncome), minValue: String(minValue), sort: String(sort) });
    return `/api/export/markets?${p}`;
  };

  async function explainMarket(m: ZipMarket) {
    setBusy(m.zip);
    try {
      const r = await api('/api/ai/explain-market', { method: 'POST', body: JSON.stringify({ market: m }) });
      setExplain({ zip: m.zip, text: r.summary, by: r.generatedBy });
    } catch (e: any) { setExplain({ zip: m.zip, text: `Error: ${e.message}`, by: '' }); }
    finally { setBusy(''); }
  }

  return <>
    <section className="filters">
      <label>Search<input value={query} onChange={e => setQuery(e.target.value)} placeholder="ZIP, city or county" /></label>
      <label>Minimum income<input type="number" value={minIncome} onChange={e => setMinIncome(Number(e.target.value))} /></label>
      <label>Minimum home value<input type="number" value={minValue} onChange={e => setMinValue(Number(e.target.value))} /></label>
      <label>Rank by<select value={sort} onChange={e => setSort(e.target.value as keyof ZipMarket)}>
        <option value="opportunityScore">Overall opportunity</option><option value="renovationScore">Renovation</option>
        <option value="customHomeScore">Custom home</option><option value="waterfrontScore">Waterfront</option>
        <option value="teardownScore">Teardown</option><option value="income">Income</option><option value="homeValue">Home value</option>
      </select></label>
    </section>

    <section className="sectionHead">
      <span className="muted">{status}{dataYear ? ` • data year ${dataYear}` : ''}</span>
      <div className="btnRow">
        <a className="btn" href={exportUrl('xlsx')}>⬇ Export Excel</a>
        <a className="btn ghost" href={exportUrl('csv')}>⬇ Export CSV</a>
      </div>
    </section>

    <section className="kpis">
      <article><span>Matching markets</span><strong>{filtered.length}</strong></article>
      <article><span>Average income</span><strong>{money.format(filtered.reduce((s, m) => s + m.income, 0) / (filtered.length || 1))}</strong></article>
      <article><span>Average home value</span><strong>{money.format(filtered.reduce((s, m) => s + m.homeValue, 0) / (filtered.length || 1))}</strong></article>
      <article><span>Top market</span><strong>{filtered[0]?.zip ?? '—'}</strong></article>
    </section>

    <section className="mapCard">
      <MapContainer center={[27.95, -82.46]} zoom={9} scrollWheelZoom className="map">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Tiled_web_map_Stevage.png/330px-Tiled_web_map_Stevage.png" />
        {filtered.map(m => <CircleMarker key={m.zip} center={[m.latitude, m.longitude]} radius={Math.max(5, m.opportunityScore / 8)} pathOptions={{ fillOpacity: .7 }}>
          <Popup><b>{m.zip} • {m.city}</b><br />{m.county}<br />Opportunity {m.opportunityScore}<br />{money.format(m.homeValue)}</Popup>
        </CircleMarker>)}
      </MapContainer>
    </section>

    <section className="tableCard"><table><thead><tr>
      <th>ZIP</th><th>Market</th><th>Income</th><th>Home value</th><th>Owner %</th><th>Year built</th><th>Luxury %</th>
      <th>Reno</th><th>Custom</th><th>Overall</th><th>Actions</th>
    </tr></thead>
      <tbody>{filtered.map(m => <tr key={m.zip}>
        <td>{m.zip}</td><td>{m.city}<small>{m.county}</small></td><td>{money.format(m.income)}</td><td>{money.format(m.homeValue)}</td>
        <td>{m.ownerOccupied}%</td><td>{m.medianYearBuilt}</td><td>{m.luxuryShare}%</td>
        <td>{m.renovationScore}</td><td>{m.customHomeScore}</td><td><b>{m.opportunityScore}</b></td>
        <td className="actions">
          <button className="chip" disabled={busy === m.zip} onClick={() => explainMarket(m)}>{busy === m.zip ? '…' : '✨ Explain'}</button>
          <a className="chip" href={`/api/reports/market/${m.zip}`}>📄 PDF</a>
          <button className="chip" onClick={() => onSaveProspect(m)}>＋ Save</button>
        </td>
      </tr>)}</tbody></table></section>

    {explain && <Modal title={`Why ZIP ${explain.zip} scored this way`} onClose={() => setExplain(null)}>
      <p className="aiText">{explain.text}</p>
      {explain.by && <p className="muted small">Generated by {explain.by}</p>}
    </Modal>}
  </>;
}

/* ------------------------------- Property lookup view ------------------------------- */
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
    setBusy(true); setStatus('Looking up…'); setProperty(null);
    try {
      const r = await api('/api/properties/lookup', { method: 'POST', body: JSON.stringify({ address }) });
      setProperty(r.property); setProviders(r.providers); setStatus(r.cached ? 'Loaded from cache' : 'Fetched from providers');
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
    finally { setBusy(false); }
  }

  async function draft() {
    if (!property) return;
    setBusy(true);
    try {
      const r = await api('/api/ai/outreach-draft', { method: 'POST', body: JSON.stringify({ property }) });
      setLetter({ text: r.letter, by: r.generatedBy });
    } catch (e: any) { setLetter({ text: `Error: ${e.message}`, by: '' }); }
    finally { setBusy(false); }
  }

  const s = property?.scores;
  return <>
    <section className="filters">
      <form onSubmit={lookup} className="lookupForm">
        <label style={{ flex: 1 }}>Property address
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Bayshore Blvd, Tampa, FL 33606" />
        </label>
        <button className="btn" disabled={busy} type="submit">{busy ? '…' : 'Look up'}</button>
      </form>
    </section>
    {status && <p className="muted" style={{ padding: '0 4px' }}>{status}{providers ? ` • providers: ${Object.entries(providers).map(([k, v]: any) => `${k}:${v.ok ? '✓' : (v.error ? '✕' : '–')}`).join(' ')}` : ''}</p>}

    {property && <section className="propCard">
      <div className="propHead">
        <div><h2>{property.address}</h2><span className="muted">{property.propertyType || '—'} • {property.zip}</span></div>
        <div className="btnRow">
          <button className="btn" disabled={busy} onClick={draft}>✉ Generate Outreach Letter</button>
          <a className="btn ghost" href={`/api/reports/property/${property.id}`}>📄 Download PDF</a>
          <button className="btn ghost" onClick={() => onSaveProspect(property)}>＋ Save to Prospects</button>
        </div>
      </div>
      <div className="propGrid">
        <div><span>Year built</span><strong>{property.yearBuilt ?? '—'}</strong></div>
        <div><span>Building</span><strong>{property.squareFeet ? `${property.squareFeet.toLocaleString()} sqft` : '—'}</strong></div>
        <div><span>Lot</span><strong>{property.lotSquareFeet ? `${property.lotSquareFeet.toLocaleString()} sqft` : '—'}</strong></div>
        <div><span>Beds / Baths</span><strong>{property.bedrooms ?? '—'} / {property.bathrooms ?? '—'}</strong></div>
        <div><span>Estimated value</span><strong>{property.estimatedValue ? money.format(property.estimatedValue) : '—'}</strong></div>
        <div><span>Assessed value</span><strong>{property.assessedValue ? money.format(property.assessedValue) : '—'}</strong></div>
        <div><span>Flood zone</span><strong>{property.floodZone || '—'}{property.sfha ? ' (SFHA)' : ''}</strong></div>
        <div><span>Owner occupied</span><strong>{property.ownerOccupied == null ? '—' : (property.ownerOccupied ? 'Yes' : 'No')}</strong></div>
      </div>
      {s && <div className="scoreRow">
        <ScorePill label="Overall" value={s.opportunityScore} />
        <ScorePill label="Renovation" value={s.renovationScore} />
        <ScorePill label="Teardown" value={s.teardownScore} />
        <ScorePill label="Luxury" value={s.luxuryPotential} />
      </div>}
    </section>}

    {letter && <Modal title="Outreach letter draft" onClose={() => setLetter(null)}>
      <pre className="letter">{letter.text}</pre>
      {letter.by && <p className="muted small">Generated by {letter.by}</p>}
      <button className="btn" onClick={() => navigator.clipboard?.writeText(letter.text)}>Copy to clipboard</button>
    </Modal>}
  </>;
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? '#16a34a' : value >= 55 ? '#1d4ed8' : '#d97706';
  return <div className="pill"><span>{label}</span><strong style={{ color }}>{value}</strong></div>;
}

/* ------------------------------- Prospects (CRM) view ------------------------------- */
function ProspectsView() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [active, setActive] = useState<Prospect | null>(null);
  const [status, setStatus] = useState('Loading prospects…');
  const [view, setView] = useState<'kanban' | 'table'>('kanban');

  async function load() {
    try { const r = await api('/api/prospects'); setProspects(r.prospects); setStatus(`${r.prospects.length} saved prospects`); }
    catch (e: any) { setStatus(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function openDetail(id: number) {
    const r = await api(`/api/prospects/${id}`); setActive(r.prospect);
  }
  async function remove(id: number) {
    if (!confirm('Delete this prospect?')) return;
    await api(`/api/prospects/${id}`, { method: 'DELETE' }); setActive(null); load();
  }

  return <>
    <section className="sectionHead">
      <span className="muted">{status}</span>
      <div className="btnRow">
        <button className={`btn ghost ${view === 'kanban' ? 'on' : ''}`} onClick={() => setView('kanban')}>Kanban</button>
        <button className={`btn ghost ${view === 'table' ? 'on' : ''}`} onClick={() => setView('table')}>Table</button>
      </div>
    </section>

    {view === 'kanban' ? <div className="kanban">
      {STAGES.map(stage => {
        const items = prospects.filter(p => p.stage === stage);
        return <div className="col" key={stage}>
          <header>{stage}<span>{items.length}</span></header>
          {items.map(p => <button className="cardItem" key={p.id} onClick={() => openDetail(p.id)}>
            <b>{p.address}</b>
            <small>{p.zip || ''} {p.estimatedValue ? `• ${money.format(p.estimatedValue)}` : ''}</small>
            <small>Opp {p.opportunityScore ?? '—'} • {p.noteCount || 0} notes</small>
          </button>)}
          {!items.length && <p className="empty">—</p>}
        </div>;
      })}
    </div> : <section className="tableCard"><table><thead><tr>
      <th>Address</th><th>ZIP</th><th>Stage</th><th>Priority</th><th>Est. value</th><th>Opportunity</th><th>Notes</th>
    </tr></thead><tbody>
      {prospects.map(p => <tr key={p.id} className="clickRow" onClick={() => openDetail(p.id)}>
        <td>{p.address}</td><td>{p.zip || '—'}</td><td>{p.stage}</td><td>{p.priority || '—'}</td>
        <td>{p.estimatedValue ? money.format(p.estimatedValue) : '—'}</td><td>{p.opportunityScore ?? '—'}</td><td>{p.noteCount || 0}</td>
      </tr>)}
      {!prospects.length && <tr><td colSpan={7} className="empty">No prospects saved yet. Save one from the Markets or Property tabs.</td></tr>}
    </tbody></table></section>}

    {active && <ProspectModal prospect={active} onClose={() => setActive(null)} onChange={() => { openDetail(active.id); load(); }} onDelete={() => remove(active.id)} />}
  </>;
}

function ProspectModal({ prospect, onClose, onChange, onDelete }:
  { prospect: Prospect; onClose: () => void; onChange: () => void; onDelete: () => void }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function setStage(stage: string) {
    setSaving(true);
    try { await api(`/api/prospects/${prospect.id}`, { method: 'PATCH', body: JSON.stringify({ stage }) }); onChange(); }
    finally { setSaving(false); }
  }
  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    try { await api(`/api/prospects/${prospect.id}/notes`, { method: 'POST', body: JSON.stringify({ body: note }) }); setNote(''); onChange(); }
    finally { setSaving(false); }
  }

  return <Modal title={prospect.address} onClose={onClose}>
    <p className="muted">{prospect.zip || ''} {prospect.estimatedValue ? `• ${money.format(prospect.estimatedValue)}` : ''} • Opportunity {prospect.opportunityScore ?? '—'}</p>
    <label className="field">Stage
      <select value={prospect.stage} disabled={saving} onChange={e => setStage(e.target.value)}>
        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </label>

    <h4>Notes</h4>
    <div className="noteAdd">
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Log an interaction…" rows={2} />
      <button className="btn" disabled={saving} onClick={addNote}>Add</button>
    </div>
    <ul className="notes">
      {(prospect.notes || []).map(n => <li key={n.id}><span>{new Date(n.createdAt).toLocaleString('en-US')}</span>{n.body}</li>)}
      {!(prospect.notes || []).length && <li className="empty">No notes yet.</li>}
    </ul>

    <div className="btnRow" style={{ marginTop: 16 }}>
      <button className="btn danger" onClick={onDelete}>Delete prospect</button>
    </div>
  </Modal>;
}

/* ------------------------------- App shell ------------------------------- */
function App() {
  const [markets, setMarkets] = useState<ZipMarket[]>([]);
  const [dataYear, setDataYear] = useState(0);
  const [status, setStatus] = useState('Loading local cache…');
  const [tab, setTab] = useState<'markets' | 'property' | 'prospects' | 'faq'>('markets');
  const [toast, setToast] = useState('');

  async function load() {
    const payload = await api('/api/markets');
    setMarkets(payload.markets); setDataYear(payload.dataYear);
    setStatus(`${payload.markets.length} ZIP markets`);
  }
  useEffect(() => { load().catch(e => setStatus(e.message)); }, []);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  async function saveMarketProspect(m: ZipMarket) {
    try {
      await api('/api/prospects', { method: 'POST', body: JSON.stringify({ address: `${m.city} ${m.zip} (market)`, zip: m.zip, estimatedValue: m.homeValue, opportunityScore: m.opportunityScore }) });
      flash(`Saved ${m.zip} to prospects`);
    } catch (e: any) { flash(e.message); }
  }
  async function savePropertyProspect(p: Property) {
    try {
      await api('/api/prospects', { method: 'POST', body: JSON.stringify({ address: p.address, zip: p.zip, propertyId: p.id, estimatedValue: p.estimatedValue ?? p.assessedValue, opportunityScore: p.scores?.opportunityScore }) });
      flash('Saved property to prospects');
    } catch (e: any) { flash(e.message); }
  }

  return <main>
    <header>
      <div><p className="eyebrow">Tampa Bay</p><h1>Builder Market Intelligence</h1></div>
      <div className="status">v2.1.0<br /><span>{status}</span></div>
    </header>

    <nav className="tabs">
      <button className={tab === 'markets' ? 'on' : ''} onClick={() => setTab('markets')}>Markets</button>
      <button className={tab === 'property' ? 'on' : ''} onClick={() => setTab('property')}>Property Lookup</button>
      <button className={tab === 'prospects' ? 'on' : ''} onClick={() => setTab('prospects')}>Saved Prospects</button>
      <button className={tab === 'faq' ? 'on' : ''} onClick={() => setTab('faq')}>📖 How It Works</button>
    </nav>

    {tab === 'markets' && <MarketsView markets={markets} status={status} dataYear={dataYear} onSaveProspect={saveMarketProspect} />}
    {tab === 'property' && <PropertyView onSaveProspect={savePropertyProspect} />}
    {tab === 'prospects' && <ProspectsView />}
    {tab === 'faq' && <FaqView />}

    {toast && <div className="toast">{toast}</div>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
