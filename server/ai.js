// server/ai.js
// Workstream 3: AI market & property explainer.
// Wraps an OpenAI (or Anthropic) chat model. The model is instructed to ONLY use the
// structured data passed in the prompt — it must not invent homeowner names, permit
// history, or any fact not provided. When no API key is configured a deterministic,
// rules-based fallback keeps the endpoints functional (clearly labelled as such).

let openaiClient = null;
async function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (openaiClient) return openaiClient;
  const { default: OpenAI } = await import('openai');
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const GROUNDING_RULES = [
  'You are a real-estate market analyst for home builders in Tampa Bay, Florida.',
  'Use ONLY the numeric and categorical data provided in the JSON below.',
  'Never invent homeowner names, sale prices, permit numbers, or any statistic not present in the data.',
  'If a value is missing, say it is not available rather than guessing.',
  'Be concise, concrete, and professional.'
].join(' ');

function money(n) {
  if (n == null || Number.isNaN(Number(n))) return 'not available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n));
}

async function chat(system, user) {
  const client = await getOpenAI();
  if (!client) return null;
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
  });
  return completion.choices?.[0]?.message?.content?.trim() || null;
}

/* ------------------------------------------------------------------ *
 * Market explainer
 * ------------------------------------------------------------------ */
export async function explainMarket(market = {}) {
  const data = {
    zip: market.zip, city: market.city, county: market.county,
    population: market.population, medianIncome: market.income, medianHomeValue: market.homeValue,
    ownerOccupiedPct: market.ownerOccupied, medianYearBuilt: market.medianYearBuilt,
    luxurySharePct: market.luxuryShare,
    scores: {
      opportunity: market.opportunityScore, renovation: market.renovationScore,
      customHome: market.customHomeScore, waterfront: market.waterfrontScore, teardown: market.teardownScore
    },
    recommendation: market.recommendation
  };

  const user = `Explain, in exactly two short paragraphs, WHY ZIP code ${data.zip} (${data.city}, ${data.county}) scored the way it did for builders, and WHAT TYPE of builder should target it (e.g. custom-home, major renovation, teardown/rebuild, waterfront luxury). Base everything strictly on this data:\n\n${JSON.stringify(data, null, 2)}`;

  const ai = await chat(GROUNDING_RULES, user);
  if (ai) return { summary: ai, generatedBy: MODEL };
  return { summary: fallbackMarketSummary(data), generatedBy: 'rules-based-fallback' };
}

function fallbackMarketSummary(d) {
  const age = d.medianYearBuilt ? 2026 - d.medianYearBuilt : null;
  const p1 = `ZIP ${d.zip} (${d.city || 'n/a'}, ${d.county || 'n/a'}) carries an overall opportunity score of ${d.scores.opportunity ?? 'n/a'}. ` +
    `Median household income is ${money(d.medianIncome)} and the median home value is ${money(d.medianHomeValue)}, with ${d.ownerOccupiedPct ?? 'n/a'}% owner-occupied housing and a luxury-home share of ${d.luxurySharePct ?? 'n/a'}%. ` +
    (age != null ? `The median home is roughly ${age} years old (built ${d.medianYearBuilt}), ` : '') +
    `which drives its renovation score of ${d.scores.renovation ?? 'n/a'} and teardown score of ${d.scores.teardown ?? 'n/a'}.`;
  const p2 = `Recommended posture: ${d.recommendation || 'monitor'}. ` +
    `${(d.scores.customHome ?? 0) >= (d.scores.renovation ?? 0)
      ? 'Higher custom-home potential suggests targeting builders of new custom homes and infill teardown/rebuild projects.'
      : 'Older housing stock and a strong renovation score suggest targeting major-renovation and addition specialists.'} ` +
    `${(d.scores.waterfront ?? 0) >= 70 ? 'The elevated waterfront score also makes this a candidate for luxury waterfront work.' : ''}`.trim();
  return `${p1}\n\n${p2}`;
}

/* ------------------------------------------------------------------ *
 * Outreach letter draft
 * ------------------------------------------------------------------ */
export async function outreachDraft(property = {}, options = {}) {
  const builderName = options.builderName || process.env.BUILDER_NAME || 'Tampa Bay Custom Builders';
  const data = {
    address: property.address, city: property.city, zip: property.zip,
    yearBuilt: property.yearBuilt, squareFeet: property.squareFeet, lotSquareFeet: property.lotSquareFeet,
    estimatedValue: property.estimatedValue ?? property.assessedValue,
    propertyType: property.propertyType,
    scores: property.scores || {}
  };

  const rules = `${GROUNDING_RULES} You are drafting a polite, professional direct-mail letter from a home builder to a homeowner. Do NOT address the homeowner by name (it is unknown) — use a neutral greeting like "Dear Homeowner". Suggest either a renovation or a teardown/rebuild consultation based on the property's age and value. Keep it under 200 words. Do not fabricate any details not in the data.`;
  const user = `Write the direct-mail letter from "${builderName}" about this property. Data:\n\n${JSON.stringify(data, null, 2)}`;

  const ai = await chat(rules, user);
  if (ai) return { letter: ai, generatedBy: MODEL };
  return { letter: fallbackLetter(data, builderName), generatedBy: 'rules-based-fallback' };
}

function fallbackLetter(d, builderName) {
  const age = d.yearBuilt ? 2026 - d.yearBuilt : null;
  const angle = age != null && age >= 45
    ? 'a full renovation or a teardown-and-rebuild'
    : 'a thoughtful renovation or addition';
  return [
    'Dear Homeowner,',
    '',
    `I'm reaching out about your property at ${d.address || 'your address'}${d.city ? `, ${d.city}` : ''}. ` +
    `${age != null ? `Homes of its era (built ${d.yearBuilt}, approximately ${age} years old) ` : 'Homes in your area '}` +
    `often present an excellent opportunity for ${angle} that can significantly increase comfort and long-term value` +
    `${d.estimatedValue ? ` — properties like yours are currently valued around ${money(d.estimatedValue)}` : ''}.`,
    '',
    `We specialize in high-quality custom work across Tampa Bay and would welcome the chance to share ideas tailored to your home` +
    `${d.lotSquareFeet ? ` and its ${Number(d.lotSquareFeet).toLocaleString()} sq ft lot` : ''}. There is no cost or obligation for an initial consultation.`,
    '',
    'If you would like to explore what is possible, simply reply to this letter or give us a call.',
    '',
    'Warm regards,',
    builderName
  ].join('\n');
}

export function aiConfigured() {
  return { openai: Boolean(process.env.OPENAI_API_KEY), model: MODEL };
}
