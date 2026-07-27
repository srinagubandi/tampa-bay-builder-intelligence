const clamp = value => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const scale = (value, min, max) => clamp(((Number(value || 0) - min) / (max - min)) * 100);

export const DEFAULT_WEIGHTS = {
  affluence: 24,
  homeValue: 18,
  ownership: 10,
  housingAge: 16,
  luxuryShare: 14,
  population: 6,
  growth: 7,
  permits: 5
};

function normalizeWeights(weights = {}) {
  const merged = { ...DEFAULT_WEIGHTS, ...weights };
  const total = Object.values(merged).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0) || 1;
  return Object.fromEntries(Object.entries(merged).map(([key, value]) => [key, Math.max(0, Number(value) || 0) / total]));
}

export function scoreMarket(row, customWeights) {
  const weights = normalizeWeights(customWeights);
  const factors = {
    affluence: scale(row.income, 45000, 220000),
    homeValue: scale(row.homeValue, 180000, 1800000),
    ownership: scale(row.ownerOccupied, 35, 92),
    housingAge: scale(2026 - Number(row.medianYearBuilt || 2000), 5, 85),
    luxuryShare: scale(row.luxuryShare, 1, 65),
    population: scale(row.population, 3000, 80000),
    growth: scale(row.populationGrowth ?? row.growthRate ?? 0, -3, 8),
    permits: scale(row.permitActivity ?? row.permitsPer1000 ?? 0, 0, 25)
  };

  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + factors[key] * weight, 0);
  const renovationScore = clamp(
    factors.affluence * .22 + factors.homeValue * .17 + factors.ownership * .10 +
    factors.housingAge * .29 + factors.luxuryShare * .17 + factors.permits * .05
  );
  const customHomeScore = clamp(
    factors.affluence * .24 + factors.homeValue * .23 + factors.ownership * .10 +
    (100 - factors.housingAge) * .12 + factors.luxuryShare * .18 +
    factors.growth * .08 + factors.permits * .05
  );
  const waterfrontScore = clamp(
    factors.affluence * .20 + factors.homeValue * .30 + factors.luxuryShare * .30 +
    Number(row.waterfrontShare || 0) * .20
  );
  const teardownScore = clamp(
    factors.homeValue * .25 + factors.housingAge * .30 + factors.luxuryShare * .20 +
    factors.affluence * .15 + Math.max(0, 100 - factors.ownership) * .10
  );
  const opportunityScore = clamp(weighted * .45 + renovationScore * .25 + customHomeScore * .25 + factors.permits * .05);

  return {
    factors,
    renovationScore,
    customHomeScore,
    waterfrontScore,
    teardownScore,
    opportunityScore,
    recommendation: opportunityScore >= 80 ? 'Priority market' : opportunityScore >= 65 ? 'Strong prospecting market' : opportunityScore >= 50 ? 'Selective opportunity' : 'Monitor'
  };
}

export function scoreProperty(property, market = {}) {
  const age = scale(2026 - Number(property.yearBuilt || market.medianYearBuilt || 2000), 5, 100);
  const value = scale(property.estimatedValue || property.assessedValue || market.homeValue, 150000, 3000000);
  const lot = scale(property.lotSqFt, 2500, 30000);
  const condition = scale(property.conditionScore ?? 50, 0, 100);
  const marketScore = Number(market.opportunityScore || scoreMarket(market).opportunityScore || 0);
  const renovationScore = clamp(age * .35 + value * .20 + lot * .10 + (100 - condition) * .20 + marketScore * .15);
  const teardownScore = clamp(age * .25 + value * .25 + lot * .25 + (100 - condition) * .15 + marketScore * .10);
  const luxuryPotential = clamp(value * .35 + lot * .20 + marketScore * .25 + Number(property.waterfront ? 100 : 0) * .20);
  return { renovationScore, teardownScore, luxuryPotential, opportunityScore: clamp(renovationScore * .4 + teardownScore * .3 + luxuryPotential * .3) };
}
