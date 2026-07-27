import { fetchCensusMarkets } from '../server/census.js';
import { upsertMany } from '../server/db.js';
const rows=await fetchCensusMarkets(); upsertMany(rows); console.log(`Updated ${rows.length} ZIP markets.`);
