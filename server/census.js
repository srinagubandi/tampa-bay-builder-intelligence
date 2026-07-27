const ACS = 'https://api.census.gov/data/2024/acs/acs5';
const vars = ['NAME','B01003_001E','B19013_001E','B25077_001E','B25003_002E','B25003_001E','B25035_001E','B25075_001E','B25075_022E','B25075_023E','B25075_024E','B25075_025E'];
const countyByPrefix = zip => zip.startsWith('336')||zip.startsWith('335')?'Hillsborough':zip.startsWith('337')||zip.startsWith('3468')?'Pinellas':'Pasco';
const centers = {Hillsborough:[27.95,-82.46],Pinellas:[27.89,-82.73],Pasco:[28.30,-82.43]};

export async function fetchCensusMarkets() {
 const url = `${ACS}?get=${vars.join(',')}&for=zip%20code%20tabulation%20area:*`;
 const response = await fetch(url); if(!response.ok) throw new Error(`Census ${response.status}`);
 const [headers,...rows] = await response.json();
 const idx = Object.fromEntries(headers.map((h,i)=>[h,i]));
 return rows.map((r,n) => {
   const zip=r[idx['zip code tabulation area']]; if(!/^33[4567]/.test(zip)) return null;
   const county=countyByPrefix(zip); const [lat,lng]=centers[county];
   const total=Number(r[idx.B25075_001E])||0; const luxury=['B25075_022E','B25075_023E','B25075_024E','B25075_025E'].reduce((s,k)=>s+(Number(r[idx[k]])||0),0);
   const ownerTotal=Number(r[idx.B25003_001E])||0;
   return {zip,county,city:String(r[idx.NAME]).split(',')[0],latitude:lat+((n%19)-9)/250,longitude:lng+((n%23)-11)/250,population:Number(r[idx.B01003_001E])||0,income:Number(r[idx.B19013_001E])||0,homeValue:Number(r[idx.B25077_001E])||0,ownerOccupied:ownerTotal?Math.round((Number(r[idx.B25003_002E])||0)/ownerTotal*1000)/10:0,medianYearBuilt:Number(r[idx.B25035_001E])||0,luxuryShare:total?Math.round(luxury/total*1000)/10:0,dataYear:2024,updatedAt:new Date().toISOString()};
 }).filter(Boolean);
}
