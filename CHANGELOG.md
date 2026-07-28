# Changelog

## 2.1.0 - 2026-07-28

Full platform build combining three workstreams:

- **Data pipeline:** property aggregation service (`server/property-service.js`) that merges ATTOM + RentCast concurrently, enriches with FEMA flood data, scores and caches records; API cache helpers (`getCachedApiResponse`/`setCachedApiResponse`) with per-provider TTLs; `POST /api/properties/lookup`; background refresh jobs (`refresh-markets`, `refresh-properties`) and a `node-cron` scheduler. Deterministic mock providers when no API keys are configured.
- **Permits & CRM:** `permits` table + `server/permits.js` abstraction (Hillsborough Socrata / Tampa ArcGIS) with high-value permit classification; nightly `refresh-permits` job; `GET /api/permits/market/:zip`; lightweight CRM (`prospects`, `contacts`, `notes` tables) with full CRUD API and a React "Saved Prospects" Kanban/table view with status + notes modal.
- **AI & reporting:** `POST /api/ai/explain-market` and `POST /api/ai/outreach-draft` (OpenAI with strict grounding + rules-based fallback); Excel/CSV export (`GET /api/export/markets`); PDF market and property reports (`GET /api/reports/market/:zip`, `/api/reports/property/:id`); frontend "Explain Score", "Generate Outreach Letter", "Export to Excel/CSV" and "Download PDF" buttons.

## 2.0.0 - 2026-07-27

- Rebuilt as a React and TypeScript application.
- Added Express API and local SQLite cache.
- Added Census ACS refresh adapter.
- Added builder opportunity, renovation and custom-home scoring.
- Added Railway production configuration and health endpoint.
- Added local-first operation with optional paid-data environment variables.

## 1.0.0 - 2026-07-27

- Initial single-file Tampa Bay ZIP dashboard.
