// scripts/refresh-permits.js
// Workstream 2: Nightly job to pull the last 30 days of high-value permits and upsert
// them into the `permits` table. Idempotent (source_permit_id unique key) and
// failure-isolated (individual portals failing don't abort the run).
//
// Run via: npm run refresh:permits

import { fetchRecentPermits } from '../server/permits.js';
import { savePermits, logRefresh } from '../server/db.js';

export async function refreshPermits({ sinceDays = 30 } = {}) {
  const start = Date.now();
  try {
    const { permits, sources } = await fetchRecentPermits({ sinceDays });
    const saved = savePermits(permits);
    const message = `Ingested ${saved} permits from ${JSON.stringify(sources)} in ${Date.now() - start}ms`;
    logRefresh('permits', 'success', message);
    console.log(message);
    return { ok: true, saved, sources };
  } catch (error) {
    logRefresh('permits', 'error', error.message);
    console.error('refresh:permits failed —', error.message);
    return { ok: false, error: error.message };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await refreshPermits();
  process.exit(result.ok ? 0 : 1);
}
