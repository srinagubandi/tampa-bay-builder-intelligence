const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
const scale = (value, min, max) => clamp(((value - min) / (max - min)) * 100);

export function scoreMarket(row) {
  const affluence = (scale(row.income, 45000, 180000) + scale(row.homeValue, 180000, 1200000)) / 2;
  const ownership = scale(row.ownerOccupied, 40, 90);
  const age = scale(2026 - row.medianYearBuilt, 10, 70);
  const luxury = scale(row.luxuryShare, 3, 60);
  const renovationScore = clamp(affluence * .35 + ownership * .2 + age * .3 + luxury * .15);
  const customHomeScore = clamp(affluence * .4 + ownership * .2 + (100-age) * .15 + luxury * .25);
  return { renovationScore, customHomeScore, opportunityScore: clamp(renovationScore*.5 + customHomeScore*.5) };
}
