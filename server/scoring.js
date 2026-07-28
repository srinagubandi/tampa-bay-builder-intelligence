// Tampa Bay Builder Intelligence — Scoring Engine v2
// Renovation affordability tiers calibrated for Tampa Bay market (2024-2025)

const clamp = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const scale = (value, min, max) => clamp(((Number(value || 0) - min) / (max - min)) * 100);

export function getRenovationTier(income, homeValue) {
  const inc = Number(income) || 0;
  const hv  = Number(homeValue) || 0;
  if (hv >= 550000 || inc >= 130000) return 1;
  if (hv >= 350000 || inc >= 85000)  return 2;
  if (hv >= 200000 || inc >= 55000)  return 3;
  return 4;
}

export function getTierLabel(tier) {
  switch (tier) {
    case 1: return '$500K+ Renovations';
    case 2: return '$250K–$500K Renovations';
    case 3: return 'Monitor ($250K)';
    default: return 'Below Threshold';
  }
}

export function getTierColor(tier) {
  switch (tier) {
    case 1: return '#1a6b3a';
    case 2: return '#2563eb';
    case 3: return '#d97706';
    default: return '#6b7280';
  }
}

export function getTierMapColor(tier) {
  switch (tier) {
    case 1: return '#22c55e';
    case 2: return '#3b82f6';
    case 3: return '#f59e0b';
    default: return '#9ca3af';
  }
}

export function renovationBudgetScore(income, homeValue, ownerOccupied, luxuryShare) {
  const incScore = scale(income,        50000,  250000);
  const hvScore  = scale(homeValue,     200000, 1500000);
  const ownScore = scale(ownerOccupied, 30,     95);
  const luxScore = scale(luxuryShare,   0,      60);
  return clamp(incScore * 0.35 + hvScore * 0.40 + ownScore * 0.15 + luxScore * 0.10);
}

export const DEFAULT_WEIGHTS = {
  affluence: 24, homeValue: 18, ownership: 10, housingAge: 16,
  luxuryShare: 14, population: 6, growth: 7, permits: 5,
};

function normalizeWeights(weights = {}) {
  const merged = { ...DEFAULT_WEIGHTS, ...weights };
  const total = Object.values(merged).reduce((s, v) => s + Math.max(0, Number(v) || 0), 0) || 1;
  return Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, Math.max(0, Number(v) || 0) / total]));
}

export function scoreMarket(row, customWeights) {
  const weights = normalizeWeights(customWeights);
  const factors = {
    affluence:   scale(row.income,                            45000,  220000),
    homeValue:   scale(row.homeValue,                         180000, 1800000),
    ownership:   scale(row.ownerOccupied,                     35,     92),
    housingAge:  scale(2026 - Number(row.medianYearBuilt || 2000), 5, 85),
    luxuryShare: scale(row.luxuryShare,                       1,      65),
    population:  scale(row.population,                        3000,   80000),
    growth:      scale(row.populationGrowth ?? row.growthRate ?? 0, -3, 8),
    permits:     scale(row.permitActivity ?? row.permitsPer1000 ?? 0, 0, 25),
  };
  const weighted = Object.entries(weights).reduce((s, [k, w]) => s + factors[k] * w, 0);
  const renovationScore = clamp(
    factors.affluence * 0.22 + factors.homeValue * 0.17 + factors.ownership * 0.10 +
    factors.housingAge * 0.29 + factors.luxuryShare * 0.17 + factors.permits * 0.05
  );
  const customHomeScore = clamp(
    factors.affluence * 0.24 + factors.homeValue * 0.23 + factors.ownership * 0.10 +
    (100 - factors.housingAge) * 0.12 + factors.luxuryShare * 0.18 +
    factors.growth * 0.08 + factors.permits * 0.05
  );
  const waterfrontScore = clamp(
    factors.affluence * 0.20 + factors.homeValue * 0.30 + factors.luxuryShare * 0.30 +
    Number(row.waterfrontZip ? 30 : 0) * 0.20
  );
  const teardownScore = clamp(
    factors.homeValue * 0.25 + factors.housingAge * 0.30 + factors.luxuryShare * 0.20 +
    factors.affluence * 0.15 + Math.max(0, 100 - factors.ownership) * 0.10
  );
  const opportunityScore = clamp(
    weighted * 0.45 + renovationScore * 0.25 + customHomeScore * 0.25 + factors.permits * 0.05
  );
  const budgetScore = renovationBudgetScore(row.income, row.homeValue, row.ownerOccupied, row.luxuryShare);
  const adTier = getRenovationTier(row.income, row.homeValue);
  const adTierLabel = getTierLabel(adTier);
  const tierColor = getTierColor(adTier);
  const tierMapColor = getTierMapColor(adTier);
  const recommendation =
    opportunityScore >= 80 ? 'Priority market' :
    opportunityScore >= 65 ? 'Strong prospecting market' :
    opportunityScore >= 50 ? 'Selective opportunity' : 'Monitor';
  return {
    factors, renovationScore, customHomeScore, waterfrontScore, teardownScore,
    opportunityScore, budgetScore, adTier, adTierLabel, tierColor, tierMapColor, recommendation,
  };
}

export function scoreProperty(property, market = {}) {
  const age       = scale(2026 - Number(property.yearBuilt || market.medianYearBuilt || 2000), 5, 100);
  const value     = scale(property.estimatedValue || property.assessedValue || market.homeValue, 150000, 3000000);
  const lot       = scale(property.lotSqFt, 2500, 30000);
  const condition = scale(property.conditionScore ?? 50, 0, 100);
  const marketScore = Number(market.opportunityScore || scoreMarket(market).opportunityScore || 0);
  const renovationScore = clamp(age * 0.35 + value * 0.20 + lot * 0.10 + (100 - condition) * 0.20 + marketScore * 0.15);
  const teardownScore   = clamp(age * 0.25 + value * 0.25 + lot * 0.25 + (100 - condition) * 0.15 + marketScore * 0.10);
  const luxuryPotential = clamp(value * 0.35 + lot * 0.20 + marketScore * 0.25 + Number(property.waterfront ? 100 : 0) * 0.20);
  return { renovationScore, teardownScore, luxuryPotential, opportunityScore: clamp(renovationScore * 0.4 + teardownScore * 0.3 + luxuryPotential * 0.3) };
}
