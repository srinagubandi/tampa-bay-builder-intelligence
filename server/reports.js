// server/reports.js
// Workstream 3: Professional export & reporting.
//  - Excel/CSV export of the filtered ZIP-code market view.
//  - 1-page PDF market report (demographics, scores, permit activity).
//  - PDF property intelligence report.
//
// Excel via exceljs (currency/percent formatting), PDF via pdfkit (streamed).

import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const USD = '$#,##0';
const PCT = '0.0"%"';

/* ------------------------------------------------------------------ *
 * Excel / CSV export of markets
 * ------------------------------------------------------------------ */
export async function buildMarketsWorkbook(markets = []) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Tampa Bay Builder Intelligence';
  wb.created = new Date();
  const ws = wb.addWorksheet('Markets');

  ws.columns = [
    { header: 'ZIP', key: 'zip', width: 10 },
    { header: 'City', key: 'city', width: 18 },
    { header: 'County', key: 'county', width: 16 },
    { header: 'Population', key: 'population', width: 12 },
    { header: 'Median Income', key: 'income', width: 16 },
    { header: 'Median Home Value', key: 'homeValue', width: 18 },
    { header: 'Owner Occupied', key: 'ownerOccupied', width: 15 },
    { header: 'Median Year Built', key: 'medianYearBuilt', width: 16 },
    { header: 'Luxury Share', key: 'luxuryShare', width: 13 },
    { header: 'Renovation', key: 'renovationScore', width: 12 },
    { header: 'Custom Home', key: 'customHomeScore', width: 13 },
    { header: 'Waterfront', key: 'waterfrontScore', width: 12 },
    { header: 'Teardown', key: 'teardownScore', width: 12 },
    { header: 'Opportunity', key: 'opportunityScore', width: 13 },
    { header: 'Recommendation', key: 'recommendation', width: 24 }
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF172033' } };
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  for (const m of markets) {
    ws.addRow({
      zip: m.zip, city: m.city, county: m.county, population: m.population,
      income: m.income, homeValue: m.homeValue, ownerOccupied: m.ownerOccupied,
      medianYearBuilt: m.medianYearBuilt, luxuryShare: m.luxuryShare,
      renovationScore: m.renovationScore, customHomeScore: m.customHomeScore,
      waterfrontScore: m.waterfrontScore, teardownScore: m.teardownScore,
      opportunityScore: m.opportunityScore, recommendation: m.recommendation
    });
  }

  ws.getColumn('income').numFmt = USD;
  ws.getColumn('homeValue').numFmt = USD;
  ws.getColumn('population').numFmt = '#,##0';
  ws.getColumn('ownerOccupied').numFmt = PCT;
  ws.getColumn('luxuryShare').numFmt = PCT;
  ws.autoFilter = { from: 'A1', to: 'O1' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  return wb;
}

export function marketsToCsv(markets = []) {
  const cols = ['zip', 'city', 'county', 'population', 'income', 'homeValue', 'ownerOccupied', 'medianYearBuilt', 'luxuryShare', 'renovationScore', 'customHomeScore', 'waterfrontScore', 'teardownScore', 'opportunityScore', 'recommendation'];
  const esc = v => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(',')];
  for (const m of markets) lines.push(cols.map(c => esc(m[c])).join(','));
  return lines.join('\n');
}

/* ------------------------------------------------------------------ *
 * PDF helpers
 * ------------------------------------------------------------------ */
const money = n => (n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n)));
const INK = '#172033';
const MUTE = '#637083';
const ACCENT = '#1d4ed8';

function header(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 96).fill(INK);
  doc.fill('#ffffff').fontSize(11).text('TAMPA BAY BUILDER INTELLIGENCE', 48, 30, { characterSpacing: 2 });
  doc.fontSize(22).text(title, 48, 48);
  if (subtitle) doc.fontSize(11).fill('#c8d2e0').text(subtitle, 48, 76);
  doc.fill(INK).moveDown(2);
  doc.y = 120;
}

function scoreRow(doc, label, value) {
  const y = doc.y;
  doc.fontSize(11).fill(MUTE).text(label, 48, y, { width: 220, continued: false });
  const v = Number(value) || 0;
  const barX = 280, barW = 220;
  doc.roundedRect(barX, y + 1, barW, 12, 6).fill('#e8edf2');
  doc.roundedRect(barX, y + 1, Math.max(4, barW * v / 100), 12, 6).fill(v >= 75 ? '#16a34a' : v >= 55 ? ACCENT : '#d97706');
  doc.fill(INK).fontSize(11).text(String(v), barX + barW + 12, y);
  doc.y = y + 22;
}

function kv(doc, label, value) {
  const y = doc.y;
  doc.fontSize(10).fill(MUTE).text(label, 48, y, { width: 170 });
  doc.fontSize(11).fill(INK).text(value == null ? '—' : String(value), 220, y, { width: 320 });
  doc.y = Math.max(doc.y, y + 18);
}

function footer(doc) {
  // Position within the usable area (page height minus bottom margin) so pdfkit does
  // not spill onto a second page. lineBreak:false prevents an accidental page break.
  doc.fontSize(8).fill(MUTE).text(
    `Generated ${new Date().toLocaleString('en-US')} • Data is for prospecting guidance only.`,
    48, doc.page.height - 66, { width: doc.page.width - 96, align: 'center', lineBreak: false }
  );
}

// Returns a Promise<Buffer> of the rendered PDF.
function renderPdf(build) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 48 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try { build(doc); doc.end(); } catch (e) { reject(e); }
  });
}

/* ------------------------------------------------------------------ *
 * Market PDF report
 * ------------------------------------------------------------------ */
export function buildMarketReport(market, permitStats = {}) {
  return renderPdf(doc => {
    header(doc, `ZIP ${market.zip} — ${market.city || ''}`, `${market.county || ''} County • Market Intelligence Report`);

    doc.fontSize(14).fill(INK).text('Demographics', 48, doc.y).moveDown(0.4);
    kv(doc, 'Population', market.population?.toLocaleString?.() ?? market.population);
    kv(doc, 'Median household income', money(market.income));
    kv(doc, 'Median home value', money(market.homeValue));
    kv(doc, 'Owner-occupied', market.ownerOccupied != null ? `${market.ownerOccupied}%` : '—');
    kv(doc, 'Median year built', market.medianYearBuilt);
    kv(doc, 'Luxury-home share', market.luxuryShare != null ? `${market.luxuryShare}%` : '—');
    doc.moveDown(0.8);

    doc.fontSize(14).fill(INK).text('Builder opportunity scores', 48, doc.y).moveDown(0.4);
    scoreRow(doc, 'Overall opportunity', market.opportunityScore);
    scoreRow(doc, 'Renovation', market.renovationScore);
    scoreRow(doc, 'Custom home', market.customHomeScore);
    scoreRow(doc, 'Waterfront luxury', market.waterfrontScore);
    scoreRow(doc, 'Teardown / rebuild', market.teardownScore);
    doc.moveDown(0.4);
    doc.fontSize(11).fill(ACCENT).text(`Recommendation: ${market.recommendation || '—'}`, 48, doc.y);
    doc.moveDown(0.8);

    doc.fontSize(14).fill(INK).text('Recent permit activity (last 30 days)', 48, doc.y).moveDown(0.4);
    kv(doc, 'Total permits', permitStats.count ?? 0);
    kv(doc, 'Total declared valuation', money(permitStats.totalValuation ?? 0));
    for (const c of (permitStats.byCategory || []).filter(x => x.category)) {
      kv(doc, `  ${c.category}`, `${c.count} permits • ${money(c.totalValuation)}`);
    }

    footer(doc);
  });
}

/* ------------------------------------------------------------------ *
 * Property intelligence PDF report
 * ------------------------------------------------------------------ */
export function buildPropertyReport(property, market = {}) {
  const s = property.scores || {};
  return renderPdf(doc => {
    header(doc, property.address || 'Property Report', `${property.city || ''}${property.zip ? ` • ${property.zip}` : ''} • Property Intelligence Report`);

    doc.fontSize(14).fill(INK).text('Property details', 48, doc.y).moveDown(0.4);
    kv(doc, 'Parcel ID', property.parcelId);
    kv(doc, 'Property type', property.propertyType);
    kv(doc, 'Bedrooms / Bathrooms', `${property.bedrooms ?? '—'} / ${property.bathrooms ?? '—'}`);
    kv(doc, 'Building size', property.squareFeet ? `${Number(property.squareFeet).toLocaleString()} sq ft` : '—');
    kv(doc, 'Lot size', property.lotSquareFeet ? `${Number(property.lotSquareFeet).toLocaleString()} sq ft` : '—');
    kv(doc, 'Year built', property.yearBuilt);
    kv(doc, 'Last sale', property.lastSaleDate ? `${property.lastSaleDate} • ${money(property.lastSalePrice)}` : '—');
    kv(doc, 'Assessed value', money(property.assessedValue));
    kv(doc, 'Estimated value', money(property.estimatedValue));
    kv(doc, 'Owner occupied', property.ownerOccupied == null ? '—' : (property.ownerOccupied ? 'Yes' : 'No'));
    doc.moveDown(0.6);

    doc.fontSize(14).fill(INK).text('Flood risk (FEMA)', 48, doc.y).moveDown(0.4);
    kv(doc, 'Flood zone', property.floodZone);
    kv(doc, 'Special flood hazard area', property.sfha == null ? '—' : (property.sfha ? 'Yes' : 'No'));
    kv(doc, 'Base flood elevation', property.baseFloodElevation);
    doc.moveDown(0.6);

    doc.fontSize(14).fill(INK).text('Opportunity scores', 48, doc.y).moveDown(0.4);
    scoreRow(doc, 'Overall opportunity', s.opportunityScore);
    scoreRow(doc, 'Renovation', s.renovationScore);
    scoreRow(doc, 'Teardown / rebuild', s.teardownScore);
    scoreRow(doc, 'Luxury potential', s.luxuryPotential);

    if (market?.zip) {
      doc.moveDown(0.4).fontSize(10).fill(MUTE).text(
        `Market context — ZIP ${market.zip}: opportunity ${market.opportunityScore ?? '—'}, median value ${money(market.homeValue)}.`, 48, doc.y
      );
    }
    footer(doc);
  });
}
