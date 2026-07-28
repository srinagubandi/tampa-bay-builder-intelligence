// scripts/refresh-markets.js
// Workstream 1: Background job to refresh the `markets` table from the Census ACS API.
// Idempotent (uses upsert) and failure-isolated (logs and exits non-zero on error but
// never leaves the DB in a partial state because upsertMany runs in a transaction).
//
// Run via: npm run refresh:markets

import { fetchCensusMarkets } from '../server/census.js';
import { upsertMany, logRefresh } from '../server/db.js';

export async function refreshMarkets() {
  const start = Date.now();
  try {
    const rows = await fetchCensusMarkets();
    if (!rows.length) throw new Error('Census returned zero rows');
    upsertMany(rows);
    const message = `Updated ${rows.length} ZIP markets in ${Date.now() - start}ms`;
    logRefresh('markets', 'success', message);
    console.log(message);
    return { ok: true, updated: rows.length };
  } catch (error) {
    logRefresh('markets', 'error', error.message);
    console.error('refresh:markets failed —', error.message);
    return { ok: false, error: error.message };
  }
}

// Execute when run directly from the CLI.
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await refreshMarkets();
  process.exit(result.ok ? 0 : 1);
}
