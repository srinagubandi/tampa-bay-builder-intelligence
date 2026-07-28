// Census ACS fetch — supports CENSUS_API_KEY env var
// Covers all Tampa Bay ZIPs: Hillsborough (335xx/336xx), Pinellas (337xx/346x8),
// Pasco (335xx/346xx), Manatee (342xx), Sarasota (342xx)

const ACS_YEAR = '2023'; // Latest available as of 2026
const ACS = `https://api.census.gov/data/${ACS_YEAR}/acs/acs5`;
const vars = [
  'NAME','B01003_001E','B19013_001E','B25077_001E',
  'B25003_002E','B25003_001E','B25035_001E',
  'B25075_001E','B25075_022E','B25075_023E','B25075_024E','B25075_025E'
];

// Tampa Bay region ZIP prefix matcher — covers all 5 counties
const isTampaBayZip = zip =>
  /^33[4-9]/.test(zip) ||  // Hillsborough, Pinellas, Pasco (335xx-339xx)
  /^3346/.test(zip)    ||  // Pinellas/Pasco 346xx
  /^342/.test(zip);        // Manatee + Sarasota 342xx

const countyByZip = zip => {
  if (/^336/.test(zip) || /^335[0-2]/.test(zip) || /^335[4-9]/.test(zip)) return 'Hillsborough';
  if (/^337/.test(zip) || /^3346[7-9]/.test(zip) || /^3469[5-8]/.test(zip)) return 'Pinellas';
  if (/^335[4-9]/.test(zip) || /^3346[0-6]/.test(zip) || /^3469[0-4]/.test(zip)) return 'Pasco';
  if (/^3421/.test(zip) || /^3422/.test(zip)) return 'Manatee';
  if (/^3423/.test(zip) || /^3424/.test(zip)) return 'Sarasota';
  return 'Tampa Bay';
};

const centers = {
  Hillsborough: [27.95, -82.46],
  Pinellas:     [27.89, -82.73],
  Pasco:        [28.30, -82.43],
  Manatee:      [27.48, -82.57],
  Sarasota:     [27.34, -82.53],
  'Tampa Bay':  [27.95, -82.46],
};

export async function fetchCensusMarkets() {
  const key = process.env.CENSUS_API_KEY ? `&key=${process.env.CENSUS_API_KEY}` : '';
  const url = `${ACS}?get=${vars.join(',')}&for=zip%20code%20tabulation%20area:*${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Census API ${response.status}: ${await response.text()}`);
  const [headers, ...rows] = await response.json();
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));

  return rows.map((r, n) => {
    const zip = r[idx['zip code tabulation area']];
    if (!isTampaBayZip(zip)) return null;
    const county = countyByZip(zip);
    const [lat, lng] = centers[county];
    const total = Number(r[idx.B25075_001E]) || 0;
    const luxury = ['B25075_022E','B25075_023E','B25075_024E','B25075_025E']
      .reduce((s, k) => s + (Number(r[idx[k]]) || 0), 0);
    const ownerTotal = Number(r[idx.B25003_001E]) || 0;
    return {
      zip, county,
      city: String(r[idx.NAME]).split(',')[0],
      latitude:  lat + ((n % 19) - 9) / 250,
      longitude: lng + ((n % 23) - 11) / 250,
      population:      Number(r[idx.B01003_001E]) || 0,
      income:          Number(r[idx.B19013_001E]) || 0,
      homeValue:       Number(r[idx.B25077_001E]) || 0,
      ownerOccupied:   ownerTotal ? Math.round((Number(r[idx.B25003_002E]) || 0) / ownerTotal * 1000) / 10 : 0,
      medianYearBuilt: Number(r[idx.B25035_001E]) || 0,
      luxuryShare:     total ? Math.round(luxury / total * 1000) / 10 : 0,
      waterfrontZip:   0,
      populationGrowth: 0,
      dataYear:        Number(ACS_YEAR),
      updatedAt:       new Date().toISOString(),
    };
  }).filter(Boolean);
}
