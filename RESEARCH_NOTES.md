# Research Notes — Tampa Bay Builder Intelligence

## Census API Status (as of July 2026)
- The Census ACS API now requires a valid API key (DEMO_KEY no longer works)
- URL: https://api.census.gov/data/2023/acs/acs5
- Key signup: https://api.census.gov/data/key_signup.html
- Solution: Embed static seed data as fallback; support CENSUS_API_KEY env var for live refresh

## Data Sources Used for Seed Data
- ACS 2024 5-year estimates (2020-2024): https://www.census.gov/acs/www/data/
- Income by ZIP: https://www.incomebyzipcode.com/florida/
  - 33629: median HH income $164,355, avg HH income $243,705
  - 33606: median HH income $120,729, avg HH income $206,421
- Zillow/Redfin median home values (2024-2025)
- Niche.com Pinellas County ZIP rankings: https://www.niche.com/places-to-live/search/best-zip-codes-to-live/c/pinellas-county-fl/
- Pinellas County ZIP list: https://www.ciclt.net/sn/clt/capitolimpact/gw_ziplist.aspx?FIPS=12103

## ZIP Coverage
- Total ZIPs in seed data: ~123
- Hillsborough County: ~50 ZIPs (335xx)
- Pinellas County: ~47 ZIPs (337xx) + 8 ZIPs (346xx = Palm Harbor, Dunedin, Safety Harbor, Oldsmar, Tarpon Springs)
- Pasco County: ~14 ZIPs (335xx) + 13 ZIPs (346xx = Trinity, Land O Lakes, New Port Richey, Holiday)
- Manatee County: ~14 ZIPs (342xx)
- Sarasota County: ~13 ZIPs (342xx)

## Key High-Value ZIPs for $500K+ Renovations
- 33629 (South Tampa): income $164K, home $920K — TOP TIER
- 33606 (Hyde Park): income $121K, home $780K — TOP TIER
- 34228 (Longboat Key): income $145K, home $1.1M — TOP TIER (Manatee)
- 34242 (Siesta Key): income $138K, home $1.2M — TOP TIER (Sarasota)
- 33715 (Tierra Verde): income $115K, home $720K — TOP TIER
- 33609 (Palma Ceia): income $116K, home $617K — TOP TIER
- 34685 (Palm Harbor/Lansbrook): income $130K, home $570K — TOP TIER
- 33704 (Old NE St Pete): income $95K, home $580K — TIER 1

## Renovation Tier Thresholds (agreed)
- Tier 1 ($500K+ reno): median home value ≥ $550K OR median income ≥ $130K
- Tier 2 ($250K-$500K reno): median home value $350K-$550K OR median income $85K-$130K
- Tier 3 (monitor, occasional $250K): median home value $200K-$350K OR median income $55K-$85K
- Below threshold: median home value < $200K AND median income < $55K

## Railway Project
- Project ID: 475d41ea-05c1-4271-873b-4ffaefc35959
- Environment ID: 26c58f1e-a3af-4a30-b937-843c1f9f6491
- Workspace ID: 78ab9c4c-78e3-420a-bfe0-3c92e85e4a37
- Token: 904799ea-e9fe-4102-82f6-74fb8296d649 (account token for Sri Nagubandi)
- Port: 8080 (Railway preference)

## Current Branch
- Working branch: agent/complete-2x-platform
- New deployment branch to create: agent/v2-ad-targeting

## Files Created
- server/seed-data.js — static seed data for all 123+ ZIPs
- server/scoring.js — existing scoring engine (needs renovation tier additions)
- server/census.js — Census API fetch (needs CENSUS_API_KEY support + 346xx fix)
- server/db.js — SQLite schema (needs waterfrontZip, populationGrowth columns)
- server/index.js — Express server (needs new endpoints)
- src/main.tsx — React frontend (needs complete rebuild for ad targeting)
- AGENT_HANDOFF_1_DATA_PIPELINE.md — for data pipeline agent
- AGENT_HANDOFF_2_PERMITS_CRM.md — for permits/CRM agent
- AGENT_HANDOFF_3_AI_REPORTING.md — for AI/reporting agent
