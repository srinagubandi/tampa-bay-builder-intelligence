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
