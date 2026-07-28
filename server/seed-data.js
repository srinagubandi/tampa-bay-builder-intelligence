// Tampa Bay Builder Intelligence — Static Seed Data
// Source: ACS 2024 5-year estimates (2020-2024), Zillow/Redfin median home values (2024-2025),
// USPS ZIP centroid coordinates, US Census Bureau QuickFacts
// All dollar values are 2024 inflation-adjusted.
// This file is the fallback data source when the Census API key is unavailable.
// Fields: zip, county, city, latitude, longitude, population, income (median HH),
//         homeValue (median), ownerOccupied (%), medianYearBuilt, luxuryShare (%),
//         waterfrontZip (bool), populationGrowth (% annual est.), dataYear

export const SEED_MARKETS = [
  // ─────────────────────────────────────────────────────────────────
  // HILLSBOROUGH COUNTY — Tampa Core
  // ─────────────────────────────────────────────────────────────────
  { zip:'33602', county:'Hillsborough', city:'Tampa (Downtown)',       lat:27.9506, lng:-82.4572, pop:18200,  income:97320,  homeValue:520000, ownerOcc:42, yrBuilt:1985, luxShare:18, waterfront:true,  growth:3.2 },
  { zip:'33603', county:'Hillsborough', city:'Tampa (Seminole Heights)',lat:27.9850, lng:-82.4640, pop:22400,  income:72000,  homeValue:390000, ownerOcc:55, yrBuilt:1952, luxShare:8,  waterfront:false, growth:2.8 },
  { zip:'33604', county:'Hillsborough', city:'Tampa (Seminole Heights)',lat:28.0050, lng:-82.4540, pop:28600,  income:58000,  homeValue:310000, ownerOcc:52, yrBuilt:1955, luxShare:5,  waterfront:false, growth:1.9 },
  { zip:'33605', county:'Hillsborough', city:'Tampa (Ybor City)',       lat:27.9600, lng:-82.4380, pop:19800,  income:36975,  homeValue:265000, ownerOcc:35, yrBuilt:1945, luxShare:3,  waterfront:false, growth:2.1 },
  { zip:'33606', county:'Hillsborough', city:'Tampa (Hyde Park)',       lat:27.9350, lng:-82.4680, pop:16400,  income:120729, homeValue:780000, ownerOcc:48, yrBuilt:1960, luxShare:33, waterfront:true,  growth:1.5 },
  { zip:'33607', county:'Hillsborough', city:'Tampa (Westshore)',       lat:27.9600, lng:-82.5050, pop:24200,  income:69694,  homeValue:380000, ownerOcc:38, yrBuilt:1968, luxShare:7,  waterfront:false, growth:1.8 },
  { zip:'33609', county:'Hillsborough', city:'Tampa (Palma Ceia)',      lat:27.9450, lng:-82.5100, pop:21800,  income:115844, homeValue:617000, ownerOcc:55, yrBuilt:1962, luxShare:29, waterfront:false, growth:1.2 },
  { zip:'33610', county:'Hillsborough', city:'Tampa (East Tampa)',      lat:27.9900, lng:-82.3900, pop:38200,  income:44000,  homeValue:220000, ownerOcc:48, yrBuilt:1968, luxShare:2,  waterfront:false, growth:1.0 },
  { zip:'33611', county:'Hillsborough', city:'Tampa (Ballast Point)',   lat:27.9050, lng:-82.5000, pop:29400,  income:90910,  homeValue:520000, ownerOcc:62, yrBuilt:1965, luxShare:21, waterfront:true,  growth:1.4 },
  { zip:'33612', county:'Hillsborough', city:'Tampa (University)',      lat:28.0500, lng:-82.4400, pop:34600,  income:48000,  homeValue:255000, ownerOcc:45, yrBuilt:1972, luxShare:3,  waterfront:false, growth:1.5 },
  { zip:'33613', county:'Hillsborough', city:'Tampa (University)',      lat:28.0700, lng:-82.4500, pop:26800,  income:62000,  homeValue:310000, ownerOcc:52, yrBuilt:1978, luxShare:6,  waterfront:false, growth:1.6 },
  { zip:'33614', county:'Hillsborough', city:'Tampa (Town N Country)',  lat:28.0100, lng:-82.5200, pop:42000,  income:52000,  homeValue:270000, ownerOcc:50, yrBuilt:1975, luxShare:3,  waterfront:false, growth:1.2 },
  { zip:'33615', county:'Hillsborough', city:'Tampa (Town N Country)',  lat:28.0000, lng:-82.5700, pop:31200,  income:65000,  homeValue:340000, ownerOcc:58, yrBuilt:1978, luxShare:6,  waterfront:true,  growth:1.4 },
  { zip:'33616', county:'Hillsborough', city:'Tampa (South Tampa)',     lat:27.8850, lng:-82.5100, pop:18600,  income:78000,  homeValue:430000, ownerOcc:60, yrBuilt:1970, luxShare:12, waterfront:true,  growth:1.8 },
  { zip:'33617', county:'Hillsborough', city:'Tampa (Temple Terrace)',  lat:28.0450, lng:-82.3850, pop:29400,  income:55000,  homeValue:285000, ownerOcc:55, yrBuilt:1972, luxShare:4,  waterfront:false, growth:1.3 },
  { zip:'33618', county:'Hillsborough', city:'Tampa (Carrollwood)',     lat:28.0600, lng:-82.5000, pop:38400,  income:85000,  homeValue:420000, ownerOcc:68, yrBuilt:1980, luxShare:14, waterfront:false, growth:1.5 },
  { zip:'33619', county:'Hillsborough', city:'Tampa (Brandon area)',    lat:27.9400, lng:-82.3700, pop:36800,  income:50000,  homeValue:280000, ownerOcc:52, yrBuilt:1978, luxShare:3,  waterfront:false, growth:1.8 },
  { zip:'33620', county:'Hillsborough', city:'Tampa (USF Area)',        lat:28.0650, lng:-82.4150, pop:8200,   income:28000,  homeValue:210000, ownerOcc:15, yrBuilt:1980, luxShare:1,  waterfront:false, growth:0.5 },
  { zip:'33621', county:'Hillsborough', city:'Tampa (MacDill)',         lat:27.8600, lng:-82.5200, pop:4200,   income:62000,  homeValue:350000, ownerOcc:40, yrBuilt:1968, luxShare:5,  waterfront:true,  growth:0.8 },
  { zip:'33624', county:'Hillsborough', city:'Tampa (Carrollwood)',     lat:28.0800, lng:-82.5100, pop:34200,  income:88000,  homeValue:430000, ownerOcc:70, yrBuilt:1982, luxShare:15, waterfront:false, growth:1.4 },
  { zip:'33625', county:'Hillsborough', city:'Tampa (Citrus Park)',     lat:28.0650, lng:-82.5600, pop:38600,  income:92000,  homeValue:440000, ownerOcc:72, yrBuilt:1990, luxShare:16, waterfront:false, growth:2.0 },
  { zip:'33626', county:'Hillsborough', city:'Tampa (Westchase)',       lat:28.0550, lng:-82.6100, pop:32400,  income:112000, homeValue:520000, ownerOcc:75, yrBuilt:1995, luxShare:22, waterfront:false, growth:2.2 },
  { zip:'33629', county:'Hillsborough', city:'Tampa (South Tampa)',     lat:27.9200, lng:-82.5100, pop:22800,  income:164355, homeValue:920000, ownerOcc:58, yrBuilt:1958, luxShare:41, waterfront:false, growth:1.0 },
  { zip:'33634', county:'Hillsborough', city:'Tampa (Westshore)',       lat:28.0150, lng:-82.5600, pop:22600,  income:68000,  homeValue:350000, ownerOcc:55, yrBuilt:1978, luxShare:7,  waterfront:false, growth:1.5 },
  { zip:'33635', county:'Hillsborough', city:'Tampa (Westchase area)',  lat:28.0250, lng:-82.6000, pop:26400,  income:82000,  homeValue:400000, ownerOcc:65, yrBuilt:1988, luxShare:12, waterfront:false, growth:1.8 },
  { zip:'33637', county:'Hillsborough', city:'Tampa (Temple Terrace)',  lat:28.0600, lng:-82.3700, pop:18200,  income:58000,  homeValue:295000, ownerOcc:58, yrBuilt:1975, luxShare:4,  waterfront:false, growth:1.2 },
  { zip:'33647', county:'Hillsborough', city:'Tampa (New Tampa)',       lat:28.1500, lng:-82.3500, pop:52400,  income:105000, homeValue:480000, ownerOcc:78, yrBuilt:2000, luxShare:20, waterfront:false, growth:3.5 },
  // ─────────────────────────────────────────────────────────────────
  // HILLSBOROUGH COUNTY — Suburbs & Outer Ring
  // ─────────────────────────────────────────────────────────────────
  { zip:'33510', county:'Hillsborough', city:'Brandon',                 lat:27.9400, lng:-82.2900, pop:28600,  income:62000,  homeValue:310000, ownerOcc:60, yrBuilt:1980, luxShare:5,  waterfront:false, growth:2.0 },
  { zip:'33511', county:'Hillsborough', city:'Brandon',                 lat:27.9150, lng:-82.2800, pop:48200,  income:72000,  homeValue:360000, ownerOcc:65, yrBuilt:1985, luxShare:8,  waterfront:false, growth:2.2 },
  { zip:'33527', county:'Hillsborough', city:'Dover',                   lat:27.9900, lng:-82.2200, pop:8400,   income:68000,  homeValue:330000, ownerOcc:72, yrBuilt:1990, luxShare:5,  waterfront:false, growth:1.8 },
  { zip:'33534', county:'Hillsborough', city:'Gibsonton',               lat:27.8400, lng:-82.3800, pop:14200,  income:55000,  homeValue:270000, ownerOcc:62, yrBuilt:1988, luxShare:3,  waterfront:true,  growth:2.5 },
  { zip:'33547', county:'Hillsborough', city:'Lithia',                  lat:27.8600, lng:-82.1100, pop:28400,  income:105000, homeValue:490000, ownerOcc:85, yrBuilt:2005, luxShare:18, waterfront:false, growth:4.2 },
  { zip:'33548', county:'Hillsborough', city:'Lutz',                    lat:28.1400, lng:-82.4600, pop:16200,  income:118000, homeValue:560000, ownerOcc:82, yrBuilt:1995, luxShare:24, waterfront:false, growth:2.8 },
  { zip:'33549', county:'Hillsborough', city:'Lutz',                    lat:28.1600, lng:-82.4500, pop:24600,  income:98000,  homeValue:470000, ownerOcc:80, yrBuilt:1998, luxShare:18, waterfront:false, growth:2.5 },
  { zip:'33556', county:'Hillsborough', city:'Odessa',                  lat:28.1700, lng:-82.5900, pop:32400,  income:125000, homeValue:600000, ownerOcc:82, yrBuilt:1998, luxShare:28, waterfront:false, growth:3.0 },
  { zip:'33558', county:'Hillsborough', city:'Lutz',                    lat:28.1350, lng:-82.5100, pop:26800,  income:108000, homeValue:510000, ownerOcc:80, yrBuilt:2000, luxShare:22, waterfront:false, growth:2.8 },
  { zip:'33559', county:'Hillsborough', city:'Lutz',                    lat:28.1800, lng:-82.4700, pop:22400,  income:94364,  homeValue:460000, ownerOcc:78, yrBuilt:1996, luxShare:17, waterfront:false, growth:2.4 },
  { zip:'33563', county:'Hillsborough', city:'Plant City',              lat:28.0100, lng:-82.1200, pop:24600,  income:52000,  homeValue:265000, ownerOcc:58, yrBuilt:1978, luxShare:3,  waterfront:false, growth:1.5 },
  { zip:'33565', county:'Hillsborough', city:'Plant City',              lat:28.0600, lng:-82.0800, pop:16200,  income:62000,  homeValue:295000, ownerOcc:68, yrBuilt:1985, luxShare:4,  waterfront:false, growth:2.0 },
  { zip:'33566', county:'Hillsborough', city:'Plant City',              lat:27.9800, lng:-82.1000, pop:28400,  income:68000,  homeValue:320000, ownerOcc:65, yrBuilt:1988, luxShare:5,  waterfront:false, growth:1.8 },
  { zip:'33567', county:'Hillsborough', city:'Plant City',              lat:27.9400, lng:-82.0900, pop:18600,  income:72000,  homeValue:340000, ownerOcc:70, yrBuilt:1990, luxShare:6,  waterfront:false, growth:2.0 },
  { zip:'33569', county:'Hillsborough', city:'Riverview',               lat:27.8650, lng:-82.3200, pop:38400,  income:78000,  homeValue:380000, ownerOcc:72, yrBuilt:2000, luxShare:9,  waterfront:false, growth:4.5 },
  { zip:'33570', county:'Hillsborough', city:'Ruskin',                  lat:27.7200, lng:-82.4300, pop:28600,  income:58000,  homeValue:290000, ownerOcc:62, yrBuilt:1995, luxShare:4,  waterfront:true,  growth:3.8 },
  { zip:'33572', county:'Hillsborough', city:'Apollo Beach',            lat:27.7700, lng:-82.4100, pop:24200,  income:88000,  homeValue:430000, ownerOcc:75, yrBuilt:2002, luxShare:14, waterfront:true,  growth:4.2 },
  { zip:'33573', county:'Hillsborough', city:'Sun City Center',         lat:27.7150, lng:-82.3600, pop:28400,  income:55000,  homeValue:280000, ownerOcc:80, yrBuilt:1985, luxShare:5,  waterfront:false, growth:2.5 },
  { zip:'33578', county:'Hillsborough', city:'Riverview',               lat:27.8850, lng:-82.3500, pop:62400,  income:82000,  homeValue:400000, ownerOcc:70, yrBuilt:2005, luxShare:11, waterfront:false, growth:5.2 },
  { zip:'33579', county:'Hillsborough', city:'Riverview',               lat:27.8350, lng:-82.2800, pop:58600,  income:88000,  homeValue:420000, ownerOcc:75, yrBuilt:2008, luxShare:13, waterfront:false, growth:5.8 },
  { zip:'33584', county:'Hillsborough', city:'Seffner',                 lat:27.9950, lng:-82.2700, pop:18400,  income:68000,  homeValue:320000, ownerOcc:68, yrBuilt:1988, luxShare:5,  waterfront:false, growth:2.0 },
  { zip:'33592', county:'Hillsborough', city:'Thonotosassa',            lat:28.0600, lng:-82.2900, pop:12400,  income:78000,  homeValue:370000, ownerOcc:72, yrBuilt:1992, luxShare:8,  waterfront:false, growth:2.2 },
  { zip:'33594', county:'Hillsborough', city:'Valrico',                 lat:27.9350, lng:-82.2200, pop:32400,  income:82000,  homeValue:390000, ownerOcc:75, yrBuilt:1995, luxShare:10, waterfront:false, growth:2.5 },
  { zip:'33596', county:'Hillsborough', city:'Valrico',                 lat:27.9050, lng:-82.2000, pop:28600,  income:95000,  homeValue:450000, ownerOcc:80, yrBuilt:1998, luxShare:16, waterfront:false, growth:2.8 },
  { zip:'33598', county:'Hillsborough', city:'Wimauma',                 lat:27.7150, lng:-82.3000, pop:22400,  income:62000,  homeValue:295000, ownerOcc:65, yrBuilt:2005, luxShare:4,  waterfront:false, growth:3.5 },
  // ─────────────────────────────────────────────────────────────────
  // PINELLAS COUNTY — St. Petersburg Core
  // ─────────────────────────────────────────────────────────────────
  { zip:'33701', county:'Pinellas', city:'St. Petersburg (Downtown)',   lat:27.7731, lng:-82.6400, pop:18823,  income:72000,  homeValue:420000, ownerOcc:42, yrBuilt:1965, luxShare:12, waterfront:true,  growth:2.0 },
  { zip:'33702', county:'Pinellas', city:'St. Petersburg (NE)',         lat:27.8350, lng:-82.6200, pop:31294,  income:68000,  homeValue:380000, ownerOcc:58, yrBuilt:1968, luxShare:9,  waterfront:false, growth:1.8 },
  { zip:'33703', county:'Pinellas', city:'St. Petersburg (NE)',         lat:27.8150, lng:-82.6300, pop:25264,  income:78000,  homeValue:430000, ownerOcc:62, yrBuilt:1962, luxShare:13, waterfront:true,  growth:1.5 },
  { zip:'33704', county:'Pinellas', city:'St. Petersburg (Old NE)',     lat:27.7950, lng:-82.6250, pop:16232,  income:95000,  homeValue:580000, ownerOcc:58, yrBuilt:1952, luxShare:22, waterfront:true,  growth:1.2 },
  { zip:'33705', county:'Pinellas', city:'St. Petersburg (SE)',         lat:27.7500, lng:-82.6350, pop:27939,  income:52000,  homeValue:310000, ownerOcc:48, yrBuilt:1958, luxShare:6,  waterfront:true,  growth:1.8 },
  { zip:'33706', county:'Pinellas', city:'St. Pete Beach',              lat:27.7250, lng:-82.7400, pop:14800,  income:82000,  homeValue:620000, ownerOcc:55, yrBuilt:1965, luxShare:25, waterfront:true,  growth:0.8 },
  { zip:'33707', county:'Pinellas', city:'Gulfport / S. Pasadena',      lat:27.7400, lng:-82.7100, pop:22600,  income:62000,  homeValue:380000, ownerOcc:52, yrBuilt:1968, luxShare:10, waterfront:true,  growth:1.2 },
  { zip:'33708', county:'Pinellas', city:'Madeira Beach / Redington',   lat:27.8000, lng:-82.7900, pop:12400,  income:72000,  homeValue:520000, ownerOcc:58, yrBuilt:1970, luxShare:18, waterfront:true,  growth:0.5 },
  { zip:'33709', county:'Pinellas', city:'St. Petersburg (W)',          lat:27.8000, lng:-82.6900, pop:28400,  income:55000,  homeValue:290000, ownerOcc:55, yrBuilt:1968, luxShare:5,  waterfront:false, growth:1.0 },
  { zip:'33710', county:'Pinellas', city:'St. Petersburg (W)',          lat:27.7850, lng:-82.7100, pop:33796,  income:72000,  homeValue:380000, ownerOcc:62, yrBuilt:1962, luxShare:10, waterfront:false, growth:1.2 },
  { zip:'33711', county:'Pinellas', city:'St. Petersburg (S)',          lat:27.7400, lng:-82.6900, pop:20013,  income:52000,  homeValue:295000, ownerOcc:52, yrBuilt:1960, luxShare:6,  waterfront:true,  growth:1.5 },
  { zip:'33712', county:'Pinellas', city:'St. Petersburg (S)',          lat:27.7550, lng:-82.6600, pop:24600,  income:48000,  homeValue:265000, ownerOcc:48, yrBuilt:1958, luxShare:4,  waterfront:false, growth:1.2 },
  { zip:'33713', county:'Pinellas', city:'St. Petersburg (Central)',    lat:27.7800, lng:-82.6700, pop:31729,  income:68000,  homeValue:380000, ownerOcc:55, yrBuilt:1958, luxShare:9,  waterfront:false, growth:1.8 },
  { zip:'33714', county:'Pinellas', city:'St. Petersburg (N)',          lat:27.8100, lng:-82.6700, pop:28400,  income:52000,  homeValue:280000, ownerOcc:52, yrBuilt:1965, luxShare:4,  waterfront:false, growth:1.2 },
  { zip:'33715', county:'Pinellas', city:'Tierra Verde',                lat:27.6850, lng:-82.7150, pop:5200,   income:115000, homeValue:720000, ownerOcc:72, yrBuilt:1985, luxShare:32, waterfront:true,  growth:0.5 },
  { zip:'33716', county:'Pinellas', city:'St. Petersburg (NW)',         lat:27.8400, lng:-82.6800, pop:19328,  income:88000,  homeValue:440000, ownerOcc:65, yrBuilt:1985, luxShare:15, waterfront:false, growth:2.2 },
  // ─────────────────────────────────────────────────────────────────
  // PINELLAS COUNTY — Clearwater
  // ─────────────────────────────────────────────────────────────────
  { zip:'33755', county:'Pinellas', city:'Clearwater',                  lat:27.9700, lng:-82.8000, pop:24600,  income:52000,  homeValue:310000, ownerOcc:48, yrBuilt:1968, luxShare:5,  waterfront:false, growth:1.2 },
  { zip:'33756', county:'Pinellas', city:'Clearwater',                  lat:27.9450, lng:-82.7900, pop:28400,  income:62000,  homeValue:360000, ownerOcc:55, yrBuilt:1972, luxShare:8,  waterfront:false, growth:1.5 },
  { zip:'33759', county:'Pinellas', city:'Clearwater',                  lat:27.9900, lng:-82.7400, pop:14200,  income:72000,  homeValue:390000, ownerOcc:58, yrBuilt:1975, luxShare:9,  waterfront:false, growth:1.8 },
  { zip:'33760', county:'Pinellas', city:'Clearwater',                  lat:27.9200, lng:-82.7200, pop:18400,  income:68000,  homeValue:360000, ownerOcc:55, yrBuilt:1980, luxShare:8,  waterfront:false, growth:1.5 },
  { zip:'33761', county:'Pinellas', city:'Clearwater (N)',              lat:28.0200, lng:-82.7400, pop:18290,  income:82000,  homeValue:420000, ownerOcc:65, yrBuilt:1982, luxShare:13, waterfront:false, growth:1.8 },
  { zip:'33762', county:'Pinellas', city:'Clearwater (Feather Sound)',  lat:27.9000, lng:-82.6900, pop:5063,   income:92000,  homeValue:460000, ownerOcc:62, yrBuilt:1988, luxShare:16, waterfront:false, growth:2.0 },
  { zip:'33763', county:'Pinellas', city:'Clearwater (N)',              lat:28.0000, lng:-82.7600, pop:22400,  income:72000,  homeValue:380000, ownerOcc:60, yrBuilt:1978, luxShare:9,  waterfront:false, growth:1.5 },
  { zip:'33764', county:'Pinellas', city:'Clearwater',                  lat:27.9600, lng:-82.7400, pop:26400,  income:78000,  homeValue:400000, ownerOcc:62, yrBuilt:1980, luxShare:11, waterfront:false, growth:1.6 },
  { zip:'33765', county:'Pinellas', city:'Clearwater',                  lat:27.9800, lng:-82.7600, pop:18200,  income:72000,  homeValue:380000, ownerOcc:60, yrBuilt:1978, luxShare:9,  waterfront:false, growth:1.4 },
  { zip:'33766', county:'Pinellas', city:'Clearwater',                  lat:27.9700, lng:-82.7200, pop:8400,   income:68000,  homeValue:360000, ownerOcc:58, yrBuilt:1978, luxShare:8,  waterfront:false, growth:1.2 },
  { zip:'33767', county:'Pinellas', city:'Clearwater Beach',            lat:27.9800, lng:-82.8300, pop:6200,   income:88000,  homeValue:680000, ownerOcc:48, yrBuilt:1972, luxShare:28, waterfront:true,  growth:0.5 },
  // ─────────────────────────────────────────────────────────────────
  // PINELLAS COUNTY — Largo / Seminole / Beaches
  // ─────────────────────────────────────────────────────────────────
  { zip:'33770', county:'Pinellas', city:'Largo',                       lat:27.9100, lng:-82.7900, pop:22400,  income:55000,  homeValue:295000, ownerOcc:55, yrBuilt:1972, luxShare:5,  waterfront:false, growth:1.0 },
  { zip:'33771', county:'Pinellas', city:'Largo',                       lat:27.9050, lng:-82.7600, pop:27596,  income:65000,  homeValue:340000, ownerOcc:58, yrBuilt:1975, luxShare:7,  waterfront:false, growth:1.2 },
  { zip:'33772', county:'Pinellas', city:'Seminole',                    lat:27.8600, lng:-82.7900, pop:24800,  income:72000,  homeValue:380000, ownerOcc:62, yrBuilt:1975, luxShare:9,  waterfront:false, growth:1.2 },
  { zip:'33773', county:'Pinellas', city:'Largo',                       lat:27.8900, lng:-82.7500, pop:22600,  income:68000,  homeValue:355000, ownerOcc:60, yrBuilt:1978, luxShare:8,  waterfront:false, growth:1.2 },
  { zip:'33774', county:'Pinellas', city:'Largo',                       lat:27.8700, lng:-82.8000, pop:18400,  income:72000,  homeValue:380000, ownerOcc:62, yrBuilt:1978, luxShare:9,  waterfront:false, growth:1.0 },
  { zip:'33775', county:'Pinellas', city:'Seminole',                    lat:27.8500, lng:-82.8000, pop:16200,  income:68000,  homeValue:360000, ownerOcc:60, yrBuilt:1978, luxShare:8,  waterfront:false, growth:1.0 },
  { zip:'33776', county:'Pinellas', city:'Seminole',                    lat:27.8350, lng:-82.8100, pop:12556,  income:82000,  homeValue:420000, ownerOcc:68, yrBuilt:1978, luxShare:13, waterfront:false, growth:1.2 },
  { zip:'33777', county:'Pinellas', city:'Seminole',                    lat:27.8600, lng:-82.7600, pop:18582,  income:78000,  homeValue:400000, ownerOcc:65, yrBuilt:1978, luxShare:11, waterfront:false, growth:1.2 },
  { zip:'33778', county:'Pinellas', city:'Largo',                       lat:27.8800, lng:-82.7700, pop:14200,  income:68000,  homeValue:355000, ownerOcc:60, yrBuilt:1978, luxShare:8,  waterfront:false, growth:1.0 },
  { zip:'33781', county:'Pinellas', city:'Pinellas Park',               lat:27.8500, lng:-82.7000, pop:28400,  income:52000,  homeValue:280000, ownerOcc:55, yrBuilt:1972, luxShare:4,  waterfront:false, growth:1.2 },
  { zip:'33782', county:'Pinellas', city:'Pinellas Park',               lat:27.8700, lng:-82.6900, pop:22600,  income:58000,  homeValue:300000, ownerOcc:58, yrBuilt:1975, luxShare:5,  waterfront:false, growth:1.2 },
  { zip:'33785', county:'Pinellas', city:'Indian Rocks Beach',          lat:27.8900, lng:-82.8500, pop:5800,   income:82000,  homeValue:580000, ownerOcc:55, yrBuilt:1968, luxShare:22, waterfront:true,  growth:0.5 },
  { zip:'33786', county:'Pinellas', city:'Belleair Beach',              lat:27.9200, lng:-82.8400, pop:4200,   income:92000,  homeValue:650000, ownerOcc:62, yrBuilt:1968, luxShare:28, waterfront:true,  growth:0.5 },
  // ─────────────────────────────────────────────────────────────────
  // PINELLAS COUNTY — 346xx (Palm Harbor, Dunedin, Safety Harbor, Oldsmar, Tarpon Springs)
  // ─────────────────────────────────────────────────────────────────
  { zip:'34677', county:'Pinellas', city:'Oldsmar',                     lat:28.0350, lng:-82.6650, pop:22762,  income:95000,  homeValue:430000, ownerOcc:72, yrBuilt:1992, luxShare:16, waterfront:false, growth:2.2 },
  { zip:'34683', county:'Pinellas', city:'Palm Harbor',                 lat:28.0800, lng:-82.7600, pop:33911,  income:85000,  homeValue:420000, ownerOcc:68, yrBuilt:1988, luxShare:14, waterfront:false, growth:1.8 },
  { zip:'34684', county:'Pinellas', city:'Palm Harbor',                 lat:28.0950, lng:-82.7400, pop:28400,  income:92000,  homeValue:450000, ownerOcc:72, yrBuilt:1990, luxShare:16, waterfront:false, growth:1.8 },
  { zip:'34685', county:'Pinellas', city:'Palm Harbor (Lansbrook)',     lat:28.1100, lng:-82.7200, pop:18200,  income:130000, homeValue:570000, ownerOcc:82, yrBuilt:1995, luxShare:28, waterfront:false, growth:1.5 },
  { zip:'34688', county:'Pinellas', city:'Tarpon Springs (Keystone)',   lat:28.1400, lng:-82.6900, pop:8522,   income:110000, homeValue:490000, ownerOcc:80, yrBuilt:1992, luxShare:22, waterfront:false, growth:1.5 },
  { zip:'34689', county:'Pinellas', city:'Tarpon Springs',              lat:28.1500, lng:-82.7600, pop:24600,  income:72000,  homeValue:380000, ownerOcc:62, yrBuilt:1980, luxShare:10, waterfront:true,  growth:1.2 },
  { zip:'34695', county:'Pinellas', city:'Safety Harbor',               lat:28.0000, lng:-82.6900, pop:18098,  income:90000,  homeValue:440000, ownerOcc:68, yrBuilt:1985, luxShare:15, waterfront:true,  growth:1.8 },
  { zip:'34698', county:'Pinellas', city:'Dunedin',                     lat:28.0200, lng:-82.7700, pop:24800,  income:75000,  homeValue:390000, ownerOcc:60, yrBuilt:1975, luxShare:10, waterfront:true,  growth:1.5 },
  // ─────────────────────────────────────────────────────────────────
  // PASCO COUNTY — 335xx
  // ─────────────────────────────────────────────────────────────────
  { zip:'33523', county:'Pasco', city:'Dade City',                      lat:28.3600, lng:-82.1900, pop:14200,  income:52000,  homeValue:265000, ownerOcc:62, yrBuilt:1985, luxShare:3,  waterfront:false, growth:2.0 },
  { zip:'33525', county:'Pasco', city:'Dade City',                      lat:28.3400, lng:-82.1800, pop:22400,  income:58000,  homeValue:285000, ownerOcc:65, yrBuilt:1988, luxShare:4,  waterfront:false, growth:2.2 },
  { zip:'33540', county:'Pasco', city:'Zephyrhills',                    lat:28.2350, lng:-82.1800, pop:28400,  income:48000,  homeValue:255000, ownerOcc:60, yrBuilt:1990, luxShare:3,  waterfront:false, growth:3.0 },
  { zip:'33541', county:'Pasco', city:'Zephyrhills',                    lat:28.2500, lng:-82.2100, pop:24200,  income:52000,  homeValue:270000, ownerOcc:62, yrBuilt:1992, luxShare:3,  waterfront:false, growth:2.8 },
  { zip:'33542', county:'Pasco', city:'Zephyrhills',                    lat:28.2200, lng:-82.1700, pop:18400,  income:48000,  homeValue:255000, ownerOcc:60, yrBuilt:1990, luxShare:3,  waterfront:false, growth:2.5 },
  { zip:'33543', county:'Pasco', city:'Wesley Chapel',                  lat:28.2200, lng:-82.3200, pop:58400,  income:98000,  homeValue:460000, ownerOcc:78, yrBuilt:2005, luxShare:18, waterfront:false, growth:5.5 },
  { zip:'33544', county:'Pasco', city:'Wesley Chapel',                  lat:28.2000, lng:-82.3600, pop:52400,  income:105000, homeValue:490000, ownerOcc:80, yrBuilt:2006, luxShare:20, waterfront:false, growth:5.8 },
  { zip:'33545', county:'Pasco', city:'Wesley Chapel',                  lat:28.2400, lng:-82.3500, pop:38400,  income:95000,  homeValue:450000, ownerOcc:78, yrBuilt:2008, luxShare:17, waterfront:false, growth:5.2 },
  { zip:'33576', county:'Pasco', city:'San Antonio',                    lat:28.3400, lng:-82.2800, pop:8400,   income:72000,  homeValue:340000, ownerOcc:72, yrBuilt:1995, luxShare:6,  waterfront:false, growth:2.5 },
  // ─────────────────────────────────────────────────────────────────
  // PASCO COUNTY — 346xx (Trinity, Land O Lakes, New Port Richey, Holiday)
  // ─────────────────────────────────────────────────────────────────
  { zip:'34610', county:'Pasco', city:'Spring Hill area',               lat:28.3500, lng:-82.5200, pop:14200,  income:62000,  homeValue:300000, ownerOcc:68, yrBuilt:1998, luxShare:5,  waterfront:false, growth:2.5 },
  { zip:'34637', county:'Pasco', city:'Land O Lakes',                   lat:28.2200, lng:-82.4600, pop:22400,  income:88000,  homeValue:420000, ownerOcc:78, yrBuilt:2002, luxShare:13, waterfront:false, growth:3.5 },
  { zip:'34638', county:'Pasco', city:'Land O Lakes',                   lat:28.2400, lng:-82.4800, pop:28400,  income:92000,  homeValue:440000, ownerOcc:80, yrBuilt:2004, luxShare:15, waterfront:false, growth:3.8 },
  { zip:'34639', county:'Pasco', city:'Land O Lakes',                   lat:28.2050, lng:-82.4500, pop:32400,  income:95000,  homeValue:455000, ownerOcc:80, yrBuilt:2003, luxShare:16, waterfront:false, growth:3.5 },
  { zip:'34652', county:'Pasco', city:'New Port Richey',                lat:28.2450, lng:-82.7200, pop:22400,  income:48000,  homeValue:255000, ownerOcc:55, yrBuilt:1978, luxShare:3,  waterfront:false, growth:1.2 },
  { zip:'34653', county:'Pasco', city:'New Port Richey',                lat:28.2650, lng:-82.7000, pop:28400,  income:52000,  homeValue:270000, ownerOcc:58, yrBuilt:1980, luxShare:4,  waterfront:false, growth:1.5 },
  { zip:'34654', county:'Pasco', city:'New Port Richey',                lat:28.3000, lng:-82.6700, pop:24600,  income:58000,  homeValue:285000, ownerOcc:62, yrBuilt:1985, luxShare:4,  waterfront:false, growth:1.8 },
  { zip:'34655', county:'Pasco', city:'Trinity',                        lat:28.1800, lng:-82.6800, pop:38400,  income:115000, homeValue:470000, ownerOcc:82, yrBuilt:2002, luxShare:22, waterfront:false, growth:4.0 },
  { zip:'34667', county:'Pasco', city:'Hudson',                         lat:28.3600, lng:-82.6900, pop:28400,  income:52000,  homeValue:265000, ownerOcc:62, yrBuilt:1985, luxShare:4,  waterfront:true,  growth:1.5 },
  { zip:'34668', county:'Pasco', city:'Port Richey',                    lat:28.2800, lng:-82.7200, pop:32400,  income:48000,  homeValue:250000, ownerOcc:55, yrBuilt:1980, luxShare:3,  waterfront:false, growth:1.2 },
  { zip:'34669', county:'Pasco', city:'Hudson',                         lat:28.3400, lng:-82.6700, pop:22400,  income:55000,  homeValue:275000, ownerOcc:62, yrBuilt:1988, luxShare:4,  waterfront:false, growth:1.5 },
  { zip:'34690', county:'Pasco', city:'Holiday',                        lat:28.1900, lng:-82.7400, pop:22400,  income:48000,  homeValue:250000, ownerOcc:58, yrBuilt:1978, luxShare:3,  waterfront:false, growth:1.2 },
  { zip:'34691', county:'Pasco', city:'Holiday',                        lat:28.2100, lng:-82.7500, pop:18400,  income:52000,  homeValue:260000, ownerOcc:60, yrBuilt:1980, luxShare:3,  waterfront:false, growth:1.2 },
  // ─────────────────────────────────────────────────────────────────
  // MANATEE COUNTY — Bradenton Area
  // ─────────────────────────────────────────────────────────────────
  { zip:'34201', county:'Manatee', city:'Bradenton (UTC)',               lat:27.4500, lng:-82.4800, pop:18400,  income:92000,  homeValue:450000, ownerOcc:72, yrBuilt:2000, luxShare:16, waterfront:false, growth:3.5 },
  { zip:'34202', county:'Manatee', city:'Bradenton (Lakewood Ranch)',    lat:27.4200, lng:-82.3800, pop:42400,  income:125000, homeValue:580000, ownerOcc:80, yrBuilt:2005, luxShare:28, waterfront:false, growth:5.0 },
  { zip:'34203', county:'Manatee', city:'Bradenton',                     lat:27.4350, lng:-82.4900, pop:28400,  income:72000,  homeValue:360000, ownerOcc:62, yrBuilt:1990, luxShare:9,  waterfront:false, growth:2.5 },
  { zip:'34205', county:'Manatee', city:'Bradenton (Downtown)',          lat:27.4950, lng:-82.5700, pop:22400,  income:52000,  homeValue:295000, ownerOcc:48, yrBuilt:1968, luxShare:5,  waterfront:true,  growth:2.0 },
  { zip:'34208', county:'Manatee', city:'Bradenton (E)',                 lat:27.5000, lng:-82.5000, pop:28400,  income:62000,  homeValue:320000, ownerOcc:58, yrBuilt:1985, luxShare:6,  waterfront:false, growth:2.2 },
  { zip:'34209', county:'Manatee', city:'Bradenton (NW)',                lat:27.5100, lng:-82.6200, pop:32400,  income:78000,  homeValue:400000, ownerOcc:65, yrBuilt:1980, luxShare:12, waterfront:true,  growth:1.8 },
  { zip:'34210', county:'Manatee', city:'Bradenton (SW)',                lat:27.4600, lng:-82.6200, pop:18400,  income:72000,  homeValue:380000, ownerOcc:60, yrBuilt:1982, luxShare:10, waterfront:true,  growth:1.5 },
  { zip:'34211', county:'Manatee', city:'Lakewood Ranch',                lat:27.4350, lng:-82.3500, pop:38400,  income:118000, homeValue:550000, ownerOcc:82, yrBuilt:2010, luxShare:25, waterfront:false, growth:6.0 },
  { zip:'34212', county:'Manatee', city:'Bradenton (NE)',                lat:27.5100, lng:-82.4200, pop:28400,  income:105000, homeValue:490000, ownerOcc:80, yrBuilt:2005, luxShare:20, waterfront:false, growth:4.5 },
  { zip:'34219', county:'Manatee', city:'Parrish',                       lat:27.5800, lng:-82.4000, pop:32400,  income:92000,  homeValue:440000, ownerOcc:80, yrBuilt:2008, luxShare:15, waterfront:false, growth:5.5 },
  { zip:'34221', county:'Manatee', city:'Palmetto',                      lat:27.5250, lng:-82.5700, pop:28400,  income:62000,  homeValue:320000, ownerOcc:62, yrBuilt:1990, luxShare:6,  waterfront:true,  growth:2.5 },
  { zip:'34222', county:'Manatee', city:'Ellenton',                      lat:27.5300, lng:-82.5200, pop:14200,  income:68000,  homeValue:340000, ownerOcc:65, yrBuilt:1992, luxShare:7,  waterfront:false, growth:2.2 },
  { zip:'34228', county:'Manatee', city:'Longboat Key',                  lat:27.4200, lng:-82.6700, pop:7200,   income:145000, homeValue:1100000,ownerOcc:62, yrBuilt:1975, luxShare:55, waterfront:true,  growth:0.5 },
  { zip:'34229', county:'Manatee', city:'Osprey',                        lat:27.1900, lng:-82.4900, pop:8400,   income:98000,  homeValue:520000, ownerOcc:72, yrBuilt:1988, luxShare:22, waterfront:false, growth:2.0 },
  // ─────────────────────────────────────────────────────────────────
  // SARASOTA COUNTY — Sarasota City & Suburbs
  // ─────────────────────────────────────────────────────────────────
  { zip:'34231', county:'Sarasota', city:'Sarasota (S)',                 lat:27.2800, lng:-82.5200, pop:28400,  income:72000,  homeValue:420000, ownerOcc:60, yrBuilt:1978, luxShare:14, waterfront:false, growth:2.0 },
  { zip:'34232', county:'Sarasota', city:'Sarasota (E)',                 lat:27.3200, lng:-82.4800, pop:32400,  income:68000,  homeValue:380000, ownerOcc:62, yrBuilt:1980, luxShare:10, waterfront:false, growth:1.8 },
  { zip:'34233', county:'Sarasota', city:'Sarasota (SE)',                lat:27.2900, lng:-82.4700, pop:24600,  income:78000,  homeValue:420000, ownerOcc:65, yrBuilt:1982, luxShare:13, waterfront:false, growth:2.0 },
  { zip:'34234', county:'Sarasota', city:'Sarasota (N)',                 lat:27.3700, lng:-82.5500, pop:18400,  income:58000,  homeValue:340000, ownerOcc:52, yrBuilt:1972, luxShare:8,  waterfront:false, growth:1.5 },
  { zip:'34235', county:'Sarasota', city:'Sarasota (NE)',                lat:27.3800, lng:-82.4800, pop:22400,  income:72000,  homeValue:390000, ownerOcc:62, yrBuilt:1982, luxShare:10, waterfront:false, growth:1.8 },
  { zip:'34236', county:'Sarasota', city:'Sarasota (Downtown)',          lat:27.3350, lng:-82.5400, pop:8400,   income:88000,  homeValue:580000, ownerOcc:45, yrBuilt:1968, luxShare:24, waterfront:true,  growth:2.2 },
  { zip:'34237', county:'Sarasota', city:'Sarasota (Central)',           lat:27.3300, lng:-82.5100, pop:18400,  income:55000,  homeValue:320000, ownerOcc:48, yrBuilt:1970, luxShare:7,  waterfront:false, growth:1.5 },
  { zip:'34238', county:'Sarasota', city:'Sarasota (Palmer Ranch)',      lat:27.2600, lng:-82.4800, pop:22400,  income:98000,  homeValue:500000, ownerOcc:72, yrBuilt:1992, luxShare:20, waterfront:false, growth:2.5 },
  { zip:'34239', county:'Sarasota', city:'Sarasota (S)',                 lat:27.3050, lng:-82.5300, pop:14200,  income:92000,  homeValue:560000, ownerOcc:58, yrBuilt:1968, luxShare:24, waterfront:false, growth:1.8 },
  { zip:'34240', county:'Sarasota', city:'Sarasota (NE)',                lat:27.3600, lng:-82.4200, pop:18400,  income:108000, homeValue:520000, ownerOcc:78, yrBuilt:1998, luxShare:22, waterfront:false, growth:3.0 },
  { zip:'34241', county:'Sarasota', city:'Sarasota (SE)',                lat:27.2600, lng:-82.4200, pop:14200,  income:105000, homeValue:510000, ownerOcc:78, yrBuilt:2000, luxShare:21, waterfront:false, growth:2.8 },
  { zip:'34242', county:'Sarasota', city:'Siesta Key',                   lat:27.2700, lng:-82.5500, pop:7200,   income:138000, homeValue:1200000,ownerOcc:58, yrBuilt:1972, luxShare:52, waterfront:true,  growth:0.5 },
  { zip:'34243', county:'Sarasota', city:'Sarasota (N)',                 lat:27.4000, lng:-82.5000, pop:22400,  income:72000,  homeValue:380000, ownerOcc:62, yrBuilt:1985, luxShare:9,  waterfront:false, growth:1.8 },
  { zip:'34251', county:'Manatee',  city:'Myakka City',                  lat:27.3500, lng:-82.1800, pop:8400,   income:72000,  homeValue:360000, ownerOcc:78, yrBuilt:1995, luxShare:6,  waterfront:false, growth:2.0 },
];

// Normalize to the DB schema field names
export const SEED_MARKETS_NORMALIZED = SEED_MARKETS.map(m => ({
  zip: m.zip,
  county: m.county,
  city: m.city,
  latitude: m.lat,
  longitude: m.lng,
  population: m.pop,
  income: m.income,
  homeValue: m.homeValue,
  ownerOccupied: m.ownerOcc,
  medianYearBuilt: m.yrBuilt,
  luxuryShare: m.luxShare,
  waterfrontZip: m.waterfront ? 1 : 0,
  populationGrowth: m.growth,
  dataYear: 2024,
  updatedAt: new Date().toISOString(),
}));
