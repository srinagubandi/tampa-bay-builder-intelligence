// scripts/cron.js
// Optional in-process scheduler for the background refresh jobs using node-cron.
// On Railway you can instead configure Railway Cron to invoke the individual npm
// scripts (npm run refresh:markets / refresh:properties / refresh:permits) — see README.
//
// Run via: npm run cron
//
// Schedules (override with env CRON_* using standard cron syntax):
//   CRON_MARKETS     default weekly  (Sunday 03:00)  — Census is slow-moving
//   CRON_PROPERTIES  default daily   (04:00)         — refresh expired property records
//   CRON_PERMITS     default nightly (02:00)         — pull last 30 days of permits

import cron from 'node-cron';
import { refreshMarkets } from './refresh-markets.js';
import { refreshProperties } from './refresh-properties.js';
import { refreshPermits } from './refresh-permits.js';

const schedules = {
  markets: process.env.CRON_MARKETS || '0 3 * * 0',
  properties: process.env.CRON_PROPERTIES || '0 4 * * *',
  permits: process.env.CRON_PERMITS || '0 2 * * *'
};

function guard(name, fn) {
  return async () => {
    console.log(`[cron] ${name} starting ${new Date().toISOString()}`);
    try { await fn(); } catch (e) { console.error(`[cron] ${name} crashed —`, e.message); }
  };
}

for (const [name, expr] of Object.entries(schedules)) {
  if (!cron.validate(expr)) { console.error(`[cron] invalid schedule for ${name}: ${expr}`); continue; }
  const fn = name === 'markets' ? refreshMarkets : name === 'properties' ? refreshProperties : refreshPermits;
  cron.schedule(expr, guard(name, fn));
  console.log(`[cron] scheduled ${name} -> "${expr}"`);
}

console.log('[cron] scheduler running. Press Ctrl+C to exit.');
