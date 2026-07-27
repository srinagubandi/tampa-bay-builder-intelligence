import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './styles.css';

type ZipMarket = {
  zip: string; county: string; city: string; latitude: number; longitude: number;
  population: number; income: number; homeValue: number; ownerOccupied: number;
  medianYearBuilt: number; luxuryShare: number; renovationScore: number;
  customHomeScore: number; opportunityScore: number; dataYear: number;
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function App() {
  const [markets, setMarkets] = useState<ZipMarket[]>([]);
  const [query, setQuery] = useState('');
  const [minIncome, setMinIncome] = useState(75000);
  const [minValue, setMinValue] = useState(300000);
  const [sort, setSort] = useState<keyof ZipMarket>('opportunityScore');
  const [status, setStatus] = useState('Loading local cache…');

  async function load() {
    const response = await fetch('/api/markets');
    if (!response.ok) throw new Error('Could not load market data');
    const payload = await response.json();
    setMarkets(payload.markets);
    setStatus(`${payload.markets.length} ZIP markets • data year ${payload.dataYear}`);
  }

  useEffect(() => { load().catch(error => setStatus(error.message)); }, []);

  const filtered = useMemo(() => markets.filter(m => {
    const text = `${m.zip} ${m.city} ${m.county}`.toLowerCase();
    return text.includes(query.toLowerCase()) && m.income >= minIncome && m.homeValue >= minValue;
  }).sort((a, b) => Number(b[sort]) - Number(a[sort])), [markets, query, minIncome, minValue, sort]);

  return <main>
    <header>
      <div><p className="eyebrow">Tampa Bay</p><h1>Builder Market Intelligence</h1></div>
      <div className="status">v2.0.0<br/><span>{status}</span></div>
    </header>

    <section className="filters">
      <label>Search<input value={query} onChange={e => setQuery(e.target.value)} placeholder="ZIP, city or county" /></label>
      <label>Minimum income<input type="number" value={minIncome} onChange={e => setMinIncome(Number(e.target.value))}/></label>
      <label>Minimum home value<input type="number" value={minValue} onChange={e => setMinValue(Number(e.target.value))}/></label>
      <label>Rank by<select value={sort} onChange={e => setSort(e.target.value as keyof ZipMarket)}>
        <option value="opportunityScore">Overall opportunity</option><option value="renovationScore">Renovation</option>
        <option value="customHomeScore">Custom home</option><option value="income">Income</option><option value="homeValue">Home value</option>
      </select></label>
    </section>

    <section className="kpis">
      <article><span>Matching markets</span><strong>{filtered.length}</strong></article>
      <article><span>Average income</span><strong>{money.format(filtered.reduce((s,m)=>s+m.income,0)/(filtered.length||1))}</strong></article>
      <article><span>Average home value</span><strong>{money.format(filtered.reduce((s,m)=>s+m.homeValue,0)/(filtered.length||1))}</strong></article>
      <article><span>Top market</span><strong>{filtered[0]?.zip ?? '—'}</strong></article>
    </section>

    <section className="mapCard">
      <MapContainer center={[27.95, -82.46]} zoom={9} scrollWheelZoom className="map">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {filtered.map(m => <CircleMarker key={m.zip} center={[m.latitude,m.longitude]} radius={Math.max(5,m.opportunityScore/8)} pathOptions={{fillOpacity:.7}}>
          <Popup><b>{m.zip} • {m.city}</b><br/>{m.county}<br/>Opportunity {m.opportunityScore}<br/>{money.format(m.homeValue)}</Popup>
        </CircleMarker>)}
      </MapContainer>
    </section>

    <section className="tableCard"><table><thead><tr><th>ZIP</th><th>Market</th><th>Income</th><th>Home value</th><th>Owner %</th><th>Year built</th><th>Luxury %</th><th>Renovation</th><th>Custom</th><th>Overall</th></tr></thead>
      <tbody>{filtered.map(m => <tr key={m.zip}><td>{m.zip}</td><td>{m.city}<small>{m.county}</small></td><td>{money.format(m.income)}</td><td>{money.format(m.homeValue)}</td><td>{m.ownerOccupied}%</td><td>{m.medianYearBuilt}</td><td>{m.luxuryShare}%</td><td>{m.renovationScore}</td><td>{m.customHomeScore}</td><td><b>{m.opportunityScore}</b></td></tr>)}</tbody></table></section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
