# Tampa Bay Builder Market Intelligence

Interactive market targeting dashboard for builders pursuing $500,000+ custom-home and major-renovation projects across greater Tampa Bay.

## Coverage

- Hillsborough County
- Pinellas County
- Pasco County
- Residential ZIP-code market indicators, map filters and builder opportunity scoring

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

## Validate

```bash
npm run check
```

## Deploy to Railway

1. Create a Railway project.
2. Choose **Deploy from GitHub repo**.
3. Select this repository.
4. Railway detects Node.js and runs `npm start`.
5. Generate a public domain in Railway under **Settings > Networking**.

No environment variables are required. Railway supplies `PORT` automatically.

## Versioning

This repository uses Semantic Versioning:

- Patch: data corrections, styling fixes and minor filter updates
- Minor: new datasets, filters, exports or map features
- Major: scoring-model changes, backend/API architecture changes or breaking UI changes

Update `package.json`, `VERSION` and `CHANGELOG.md` together for every release. Tag releases as `vMAJOR.MINOR.PATCH`.

## Data updates

The dashboard can query public Census endpoints from the browser. For paid data providers or API keys, use a Railway backend or serverless proxy and never put private keys in `public/index.html`.

## Full platform (v2.1)

This build adds three integrated workstreams. All external API keys are read from environment variables (see `.env.example`); nothing is hardcoded. When keys are absent, deterministic mock data keeps every feature working end-to-end.

### 1. Data pipeline & automation
- `server/property-service.js` — `lookupProperty(address)`: normalizes the address, checks the local `properties` cache, otherwise fetches ATTOM + RentCast **concurrently** (failure-isolated), merges them (ATTOM wins structural fields, RentCast wins valuation), enriches with FEMA flood data, scores and persists a unified record.
- API cache layer in `server/db.js` — `getCachedApiResponse(key)` / `setCachedApiResponse(key, provider, response, ttlHours)`. TTLs: Census geocode 30d, FEMA 30d, ATTOM/RentCast 7d.
- `POST /api/properties/lookup` `{ "address": "..." }` — end-to-end lookup with caching.
- Background jobs: `npm run refresh:markets`, `npm run refresh:properties`, `npm run refresh:permits`. All idempotent and failure-isolated; results are written to the `refresh_log` table.

### 2. Permits & CRM
- `server/permits.js` — abstraction over Hillsborough County Socrata and City of Tampa ArcGIS REST, focused on New Construction, Major Alteration, Demolition, Pool and Roof permits.
- `GET /api/permits/market/:zip?days=30` — permit activity + stats for a ZIP.
- CRM tables `prospects` / `contacts` / `notes` with endpoints: `GET/POST /api/prospects`, `GET/PATCH/DELETE /api/prospects/:id`, `POST /api/prospects/:id/notes`, `POST /api/prospects/:id/contacts`. Stages: New Lead → Researching → Qualified → Contacted → Proposal → Won → Lost.
- Frontend "Saved Prospects" tab with Kanban + table views and a status/notes modal.

### 3. AI assistant & reporting
- `POST /api/ai/explain-market` and `POST /api/ai/outreach-draft` — OpenAI (`gpt-4o-mini` by default) with strict grounding (only uses supplied data) and a rules-based fallback when `OPENAI_API_KEY` is not set.
- `GET /api/export/markets?format=xlsx|csv` — filtered market export (respects `query`, `minIncome`, `minValue`, `sort`).
- `GET /api/reports/market/:zip` and `GET /api/reports/property/:id` — printable 1-page PDF reports.
- Frontend "Explain", "Generate Outreach Letter", "Export Excel/CSV" and "Download PDF" buttons.

### Scheduling
Run all jobs in-process with `npm run cron` (uses `node-cron`; override schedules with `CRON_MARKETS`, `CRON_PROPERTIES`, `CRON_PERMITS`). On Railway you can instead configure **Railway Cron** to call the individual `npm run refresh:*` scripts.
