// scripts/refresh-properties.js
// Workstream 1: Background job that finds expired property records and re-fetches them
// from ATTOM / RentCast (via the property-service). Failure-isolated: one address (or
// one provider) failing does not abort the whole run.
//
// Run via: npm run refresh:properties

import { getExpiredPropertyKeys, logRefresh } from '../server/db.js';
import { lookupProperty } from '../server/property-service.js';

const BATCH = Number(process.env.REFRESH_BATCH || 50);

export async function refreshProperties({ limit = BATCH } = {}) {
  const start = Date.now();
  const expired = getExpiredPropertyKeys(limit);
  let refreshed = 0;
  const failures = [];

  for (const row of expired) {
    try {
      // Use the original address so parsing/geocoding stays consistent; force a re-fetch.
      await lookupProperty(row.address, { force: true });
      refreshed += 1;
    } catch (error) {
      failures.push({ address: row.address, error: error.message });
    }
  }

  const message = `Refreshed ${refreshed}/${expired.length} expired properties in ${Date.now() - start}ms` +
    (failures.length ? ` (${failures.length} failed)` : '');
  logRefresh('properties', failures.length && !refreshed ? 'error' : 'success', message);
  console.log(message);
  if (failures.length) console.warn('Failures:', failures.slice(0, 10));
  return { ok: true, refreshed, attempted: expired.length, failures };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await refreshProperties();
  process.exit(result.ok ? 0 : 1);
}
