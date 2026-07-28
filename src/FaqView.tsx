/* ------------------------------- FAQ / Legend / Methodology view ------------------------------- */
export function FaqView() {
  return (
    <div className="faqPage">

      {/* ── OVERVIEW ── */}
      <section className="faqSection faqHero">
        <h2>📋 Overview — What Is This Tool?</h2>
        <p>
          This is a <strong>renovation and custom-home ad-targeting intelligence platform</strong> built
          specifically for Tampa Bay area builders. It ranks every ZIP code across Hillsborough, Pinellas,
          Pasco, Manatee, and Sarasota counties by how likely homeowners in that area can afford and are
          likely to commission a major renovation ($250K+) or custom home build ($500K+).
        </p>
        <p>
          Use it to decide <strong>where to spend your ad budget</strong>, which neighborhoods to target
          with direct mail, and which ZIP codes to prioritize for Google/Meta geo-targeting campaigns.
          Every ZIP is scored, ranked, and assigned to one of three ad tiers so you can act immediately
          without needing a data analyst.
        </p>
        <div className="heroStats">
          <div className="heroStat"><strong>150</strong><span>Tampa Bay ZIPs ranked</span></div>
          <div className="heroStat"><strong>5</strong><span>Counties covered</span></div>
          <div className="heroStat"><strong>3</strong><span>Ad targeting tiers</span></div>
          <div className="heroStat"><strong>2023</strong><span>ACS Census vintage</span></div>
        </div>
      </section>

      {/* ── METHODOLOGY ── */}
      <section className="faqSection">
        <h2>🔬 Methodology — How We Built This</h2>

        <h3>Step 1 — Define the Target Market</h3>
        <p>
          The goal is to identify homeowners who can afford and are likely to commission renovation or
          custom build projects of $250K or more. Research on renovation spending patterns shows that
          households need to meet <em>at least two</em> of three conditions to reliably commission
          high-budget work:
        </p>
        <table className="faqTable">
          <thead><tr><th>Condition</th><th>Threshold</th><th>Why It Matters</th></tr></thead>
          <tbody>
            <tr><td>Household income</td><td>≥ $90K/year</td><td>Renovation financing and discretionary spend capacity</td></tr>
            <tr><td>Home market value</td><td>≥ $350K</td><td>Homeowners rarely spend more on renovation than the home is worth</td></tr>
            <tr><td>Owner-occupied</td><td>≥ 60% of units</td><td>Only owners commission renovations — renters do not</td></tr>
          </tbody>
        </table>

        <h3>Step 2 — Select the Geographic Scope</h3>
        <p>
          The platform covers all ZIP codes in the five-county Tampa Bay metro area: <strong>Hillsborough</strong>
          (52 ZIPs), <strong>Pinellas</strong> (48 ZIPs), <strong>Pasco</strong> (22 ZIPs),{' '}
          <strong>Manatee</strong> (15 ZIPs), and <strong>Sarasota</strong> (13 ZIPs). The geographic
          filter uses the USPS ZIP code boundaries for Florida, cross-referenced against county FIPS
          codes to ensure complete coverage including the <code>346xx</code> Pinellas/Pasco corridor
          (Palm Harbor, Trinity, Safety Harbor, Oldsmar) which is frequently missed by simpler filters.
        </p>

        <h3>Step 3 — Source the Data</h3>
        <p>
          All demographic data comes from the <strong>US Census Bureau American Community Survey (ACS)
          5-Year Estimates, 2023 vintage</strong> — the most current ZIP-level dataset available. The
          ACS 5-year estimates are used (rather than 1-year) because they provide statistically reliable
          estimates for small geographies like ZIP codes, which have populations too small for the 1-year
          survey to produce reliable numbers. Each data point is pulled from a specific ACS table:
        </p>
        <table className="faqTable">
          <thead><tr><th>Data Point</th><th>ACS Table</th><th>Variable</th></tr></thead>
          <tbody>
            <tr><td>Median Household Income</td><td>B19013</td><td>B19013_001E</td></tr>
            <tr><td>Median Home Value (owner-occupied)</td><td>B25077</td><td>B25077_001E</td></tr>
            <tr><td>Owner Occupancy Rate</td><td>B25003</td><td>B25003_002E / B25003_001E</td></tr>
            <tr><td>Median Year Structure Built</td><td>B25035</td><td>B25035_001E</td></tr>
            <tr><td>Total Population</td><td>B01003</td><td>B01003_001E</td></tr>
            <tr><td>Home Value Distribution (for Luxury %)</td><td>B25075</td><td>Buckets $750K–$1M, $1M–$1.5M, $1.5M+</td></tr>
          </tbody>
        </table>

        <h3>Step 4 — Calculate the Scores</h3>
        <p>
          Three composite scores are calculated for each ZIP. All inputs are normalized to a 0–100 scale
          relative to the full Tampa Bay dataset before weighting, so a score of 100 would represent the
          theoretical maximum for this region.
        </p>

        <div className="methodBlock">
          <div className="methodTitle">Budget Score (Primary Ranking Score)</div>
          <div className="methodFormula">
            Budget Score = (Income Score × 0.40) + (Home Value Score × 0.40) + (Owner Occupancy Score × 0.20)
          </div>
          <p className="methodNote">
            <strong>Income Score:</strong> Normalized from $0–$250K range. $164K (South Tampa) = ~66, $50K = ~20.<br/>
            <strong>Home Value Score:</strong> Normalized from $0–$1.5M range. $1.2M (Siesta Key) = ~80, $200K = ~13.<br/>
            <strong>Owner Occupancy Score:</strong> Normalized from 0–100%. 85% owner-occupied = 85 score.<br/>
            Income and home value are weighted equally at 40% each because both are strong independent
            predictors — high income with a modest home (condo owner) and high home value with moderate
            income (inherited property) both produce renovation clients.
          </p>
        </div>

        <div className="methodBlock">
          <div className="methodTitle">Renovation Score</div>
          <div className="methodFormula">
            Reno Score = (Age Score × 0.35) + (Home Value Score × 0.30) + (Owner Occupancy Score × 0.20) + (Luxury Share Score × 0.15)
          </div>
          <p className="methodNote">
            <strong>Age Score:</strong> Homes built before 1970 score highest (100). Built 2020+ score lowest (0).
            Formula: max(0, (2024 − medianYearBuilt − 10) / 60 × 100).<br/>
            <strong>Luxury Share Score:</strong> % of homes valued over $750K, normalized to 0–100.<br/>
            Age is the dominant factor (35%) because it directly drives renovation necessity — old homes
            need new kitchens, baths, electrical, and HVAC regardless of owner income.
          </p>
        </div>

        <div className="methodBlock">
          <div className="methodTitle">Opportunity Score (Composite)</div>
          <div className="methodFormula">
            Opportunity = (Reno Score × 0.35) + (Income Score × 0.25) + (Home Value Score × 0.20) + (Growth Bonus × 0.10) + (Waterfront Bonus × 0.10)
          </div>
          <p className="methodNote">
            <strong>Growth Bonus:</strong> Population growth rate normalized 0–100 (1.5%+/year = high bonus).<br/>
            <strong>Waterfront Bonus:</strong> Binary flag — waterfront ZIPs receive a fixed 15-point bonus
            because waterfront properties command 20–50% value premiums and owners routinely invest in
            dock additions, outdoor living, and full gut-renovations.<br/>
            The Opportunity Score is the overall tiebreaker — use it when two ZIPs have similar Budget Scores.
          </p>
        </div>

        <h3>Step 5 — Assign Ad Tiers</h3>
        <p>
          Tiers are assigned based on a combination of Budget Score and absolute thresholds, not purely
          on relative rank. This ensures that a ZIP with genuinely low income doesn't get labeled Tier 1
          just because it's the best in a weak county.
        </p>
        <table className="faqTable">
          <thead><tr><th>Tier</th><th>Budget Score</th><th>AND Median Income</th><th>AND Median Home Value</th></tr></thead>
          <tbody>
            <tr className="tier1row"><td><strong>Tier 1</strong> — $500K+ Renovations</td><td>≥ 35</td><td>≥ $110,000</td><td>≥ $550,000</td></tr>
            <tr className="tier2row"><td><strong>Tier 2</strong> — $250K–$500K Renovations</td><td>≥ 15</td><td>≥ $65,000</td><td>≥ $280,000</td></tr>
            <tr className="tier3row"><td><strong>Tier 3</strong> — Monitor</td><td colspan="3">All other ZIPs — watch for growth signals</td></tr>
          </tbody>
        </table>

        <h3>Step 6 — Enrich with Flags</h3>
        <p>
          Two enrichment flags are applied after scoring:
        </p>
        <p>
          <strong>🌊 Waterfront:</strong> Assigned via geographic analysis of ZIP code boundaries against
          known waterfront corridors — Tampa Bay shoreline, Gulf Coast barrier islands, and major inland
          lakes. ZIPs with significant waterfront frontage include Longboat Key (34228), Siesta Key (34242),
          Tierra Verde (33715), St. Pete Beach (33706), Clearwater Beach (33767), and others.
        </p>
        <p>
          <strong>📈 Growing:</strong> Assigned to ZIPs with population growth rate above 1.5% annually,
          derived from comparing ACS 2019 and 2023 population estimates. Growth markets attract move-up
          buyers who renovate before or after purchase.
        </p>
      </section>

      {/* ── DATA SOURCING ── */}
      <section className="faqSection">
        <h2>📦 Data Sources — Where Every Number Comes From</h2>

        <div className="sourceCards">
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>💰 Median Household Income</strong>
              <span className="sourceMeta">US Census ACS 5-Year · 2023 · Updated annually</span>
            </div>
            <p>Pulled from ACS table <code>B19013</code> via the Census API. This is the midpoint income for all households in the ZIP — half earn more, half earn less. Higher income = more renovation budget available.</p>
          </div>
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>🏠 Median Home Value</strong>
              <span className="sourceMeta">US Census ACS 5-Year · 2023 · Updated annually</span>
            </div>
            <p>ACS table <code>B25077</code> — homeowner self-reported estimated market value of owner-occupied units. Lags Zillow by 12–18 months but is the only dataset with complete coverage across all 150 ZIPs. Used for relative ranking, not absolute pricing.</p>
          </div>
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>👤 Owner Occupancy Rate</strong>
              <span className="sourceMeta">US Census ACS 5-Year · 2023 · Updated annually</span>
            </div>
            <p>ACS table <code>B25003</code>: owner-occupied units ÷ total occupied units. Only homeowners hire renovation contractors — renters don't. A ZIP with 80% owners is a much better ad target than one with 40% owners.</p>
          </div>
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>🏗️ Median Year Built</strong>
              <span className="sourceMeta">US Census ACS 5-Year · 2023 · Updated annually</span>
            </div>
            <p>ACS table <code>B25035</code>: median year all housing structures were built. Older homes (pre-1980) have outdated kitchens, baths, electrical, and HVAC — the highest renovation demand. A ZIP built in 1965 on average is a better target than one built in 2010.</p>
          </div>
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>💎 Luxury Share %</strong>
              <span className="sourceMeta">US Census ACS 5-Year · 2023 · Updated annually</span>
            </div>
            <p>ACS table <code>B25075</code> (home value distribution). We add up all homes valued over $750K and divide by total owner-occupied units. A high luxury share signals a neighborhood culture of high-end spending — these homeowners are comfortable with $500K+ projects.</p>
          </div>
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>📈 Population &amp; Growth Rate</strong>
              <span className="sourceMeta">US Census ACS 5-Year · 2023 vs 2019 · Updated annually</span>
            </div>
            <p>ACS table <code>B01003</code> compared across 2019 and 2023 vintages. Growth rate = (2023 pop − 2019 pop) ÷ 2019 pop ÷ 4 years. Fast-growing ZIPs attract move-up buyers who renovate before or after purchase — a strong demand signal.</p>
          </div>
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>🌊 Waterfront Flag</strong>
              <span className="sourceMeta">Geographic analysis · Static · Reviewed annually</span>
            </div>
            <p>Manual classification: ZIP code boundaries were overlaid with Tampa Bay shoreline, Gulf Coast barrier islands, and major inland lakes (Lake Tarpon, Lake Maggiore, etc.). Waterfront ZIPs command premium renovation budgets — homeowners invest heavily in outdoor living, docks, and water views.</p>
          </div>
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>🔨 Permit Activity</strong>
              <span className="sourceMeta">Hillsborough County &amp; Tampa Open Data · Live · Refreshed nightly</span>
            </div>
            <p>Fetched nightly via Socrata API from <code>gis.hillsboroughcounty.org</code> and the Tampa ArcGIS REST API. Filters for permit types: new construction, addition, remodel, renovation. Aggregated by ZIP and permit value. Shows where renovation work is actually happening right now.</p>
          </div>
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>🏡 Property Detail</strong>
              <span className="sourceMeta">ATTOM Data Solutions + RentCast · On-demand · 7-day cache</span>
            </div>
            <p>Looked up in real time when you search an address in the Property Lookup tab. ATTOM provides automated valuation (AVM), ownership history, and lot details. RentCast provides rental comps. Results are cached for 7 days. If no API keys are configured, realistic mock data is shown.</p>
          </div>
          <div className="sourceCard">
            <div className="sourceCardHead">
              <strong>✨ AI Explanations</strong>
              <span className="sourceMeta">OpenAI GPT-4o-mini · On-demand · No cache</span>
            </div>
            <p>When you click the ✨ Why? button on any ZIP, the full data object is sent to GPT-4o-mini with a prompt that explains the score in plain builder language. If no OpenAI key is set, a rules-based fallback generates the explanation automatically from score thresholds.</p>
          </div>
        </div>

        <h3>A Note on Census ACS vs. Zillow/Redfin Home Values</h3>
        <p>
          You may notice that Census ACS median home values are lower than current Zillow estimates for
          the same ZIP. This is expected and intentional. The ACS 2023 data reflects homeowner
          self-reported values from the survey period (2019–2023 rolling average), which lags the
          actual market by 12–24 months. However, ACS is the only source with complete ZIP-level
          coverage across all 150 ZIPs — Zillow and Redfin have gaps in lower-volume markets.
          For ranking and scoring purposes, the relative ordering of ZIPs is accurate even if the
          absolute dollar values are slightly below current market. The scoring engine normalizes all
          values relative to each other, so the tier assignments and ranks are reliable.
        </p>
      </section>

      {/* ── COLUMN LEGEND ── */}
      <section className="faqSection">
        <h2>📊 Column Legend — Every Column Explained</h2>

        <div className="legendGrid">
          <div className="legendCard">
            <div className="legendLabel"># Rank</div>
            <div className="legendDesc">
              Overall position among all 150 Tampa Bay ZIPs, sorted by <strong>Budget Score</strong>
              (highest = best ad target). Rank 1 is the most attractive market for high-budget renovation work.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">ZIP</div>
            <div className="legendDesc">
              5-digit USPS ZIP code. Paste directly into Google Ads, Meta Ads, or direct-mail platforms
              to geo-target campaigns. Use the Export or ZIP List buttons to copy the full list.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Market</div>
            <div className="legendDesc">
              City or neighborhood name for the ZIP, plus county. A single city (e.g., Tampa) spans
              many ZIPs with very different demographics — always target at the ZIP level, not city level.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Ad Tier</div>
            <div className="legendDesc">
              <strong>T1 — $500K+ Renovations:</strong> 18 ZIPs. Primary targets — highest income and home value.<br/><br/>
              <strong>T2 — $250K–$500K Renovations:</strong> 79 ZIPs. Strong secondary targets for volume campaigns.<br/><br/>
              <strong>T3 — Monitor:</strong> 53 ZIPs. Watch list — minimal ad spend until growth signals appear.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Budget Score</div>
            <div className="legendDesc">
              <strong>Primary ranking score (0–100).</strong> Answers: "Can homeowners here afford a $250K–$500K+ renovation?"
              Weighted 40% income + 40% home value + 20% owner occupancy. Score 60+ = strong $500K+ market.
              Score 25–45 = solid $250K–$500K market.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Median Income</div>
            <div className="legendDesc">
              Median annual household income. Source: ACS B19013. Households earning $120K+ routinely
              spend $300K–$600K on major renovations. Under $70K rarely commission work above $100K.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Median Home Value</div>
            <div className="legendDesc">
              Median estimated market value of owner-occupied homes. Source: ACS B25077. Homeowners
              rarely spend more on renovation than the home is worth — a $1.2M home easily supports
              a $500K renovation; a $280K home typically cannot.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Owner %</div>
            <div className="legendDesc">
              Percentage of housing units that are owner-occupied. Source: ACS B25003. Renters never
              commission renovations — only owners do. A ZIP with 80% owner-occupancy means 80% of
              households are potential renovation clients.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Year Built</div>
            <div className="legendDesc">
              Median year homes in this ZIP were built. Source: ACS B25035.<br/><br/>
              <strong>Pre-1980:</strong> Kitchen, bath, electrical, plumbing, HVAC all overdue. High gut-reno potential.<br/>
              <strong>1980–2000:</strong> First major reno cycle. Kitchens and baths dated.<br/>
              <strong>2000–2015:</strong> Additions and upgrades in demand.<br/>
              <strong>Post-2015:</strong> Newer — lower immediate demand but good for luxury additions.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Luxury %</div>
            <div className="legendDesc">
              Estimated % of homes valued above $750K. Source: ACS B25075 distribution buckets.
              When 30%+ of homes in a ZIP are luxury tier, there is a self-reinforcing culture of
              high-end renovation — neighbors see each other's projects and budgets follow.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Reno Score</div>
            <div className="legendDesc">
              Renovation Score (0–100). Measures how ripe this ZIP is for remodel work specifically.
              Weighted toward older homes, high owner-occupancy, and high home values. Score 50+ means
              a large share of homes are old enough to need work and valuable enough to justify it.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Opportunity</div>
            <div className="legendDesc">
              Overall Opportunity Score (0–100). Composite of all dimensions — renovation demand,
              income, home value, population growth, and waterfront premium. Use as tiebreaker when
              two ZIPs have similar Budget Scores.
            </div>
          </div>
          <div className="legendCard">
            <div className="legendLabel">Flags</div>
            <div className="legendDesc">
              <strong>🌊 Waterfront:</strong> ZIP has significant bay, gulf, or lake frontage. Owners
              invest heavily in dock additions, outdoor living, and full gut-renovations. Premium target
              for luxury work.<br/><br/>
              <strong>📈 Growing:</strong> Population growing 1.5%+ annually. Growth markets attract
              move-up buyers who renovate before or after purchase.
            </div>
          </div>
        </div>
      </section>

      {/* ── AD TIER GUIDE ── */}
      <section className="faqSection">
        <h2>🎯 Ad Targeting Guide</h2>
        <table className="faqTable">
          <thead>
            <tr><th>Tier</th><th>Label</th><th>Income</th><th>Home Value</th><th>Recommended Budget Allocation</th></tr>
          </thead>
          <tbody>
            <tr className="tier1row">
              <td><strong>Tier 1</strong></td><td>$500K+ Renovations</td><td>≥ $110K</td><td>≥ $550K</td>
              <td>Primary — 60–70% of ad budget</td>
            </tr>
            <tr className="tier2row">
              <td><strong>Tier 2</strong></td><td>$250K–$500K Renovations</td><td>$65K–$110K</td><td>$280K–$550K</td>
              <td>Secondary — 25–35% of ad budget</td>
            </tr>
            <tr className="tier3row">
              <td><strong>Tier 3</strong></td><td>Monitor</td><td>&lt; $65K</td><td>&lt; $280K</td>
              <td>Watch list — minimal spend, test only</td>
            </tr>
          </tbody>
        </table>

        <h3>Google Ads / Local Services Ads</h3>
        <ol>
          <li>Filter to <strong>Tier 1</strong> ZIPs in the Markets tab.</li>
          <li>Click <strong>Export CSV</strong> or use the ZIP List endpoint to copy the ZIP codes.</li>
          <li>In Google Ads → <em>Campaign → Locations → Enter location</em> → paste ZIP codes.</li>
          <li>Set bid adjustments: +20% for Tier 1, +10% for Tier 2, 0% for Tier 3.</li>
        </ol>

        <h3>Meta (Facebook / Instagram) Ads</h3>
        <ol>
          <li>In Ads Manager → <em>Ad Set → Audience → Locations</em> → switch to <strong>ZIP Code</strong> targeting.</li>
          <li>Paste your Tier 1 ZIP codes. Meta will show estimated reach per ZIP.</li>
          <li>Layer on income targeting: <em>Household income — top 10–25%</em> to further qualify.</li>
        </ol>

        <h3>Direct Mail</h3>
        <ol>
          <li>Export the full CSV and sort by <strong>Year Built</strong> (oldest first) within Tier 1 ZIPs.</li>
          <li>ZIPs with median year built before 1985 and home values above $500K are your best targets — old enough to need work, owners wealthy enough to pay for it.</li>
          <li>Use the <strong>Property Lookup</strong> tab to research specific addresses before mailing.</li>
        </ol>
      </section>

      {/* ── FAQ ── */}
      <section className="faqSection">
        <h2>❓ Frequently Asked Questions</h2>

        <div className="faqItem">
          <h4>Why is South Tampa (33629) ranked #3 but not #1?</h4>
          <p>Longboat Key (34228) and Siesta Key (34242) have higher median home values ($1.1M–$1.2M)
          vs. South Tampa ($920K), which pushes their Budget Scores slightly higher. However, South
          Tampa has the highest median income in the region ($164K) and far more households — making
          it the highest-volume Tier 1 market. For volume campaigns, 33629 is your #1 target.</p>
        </div>

        <div className="faqItem">
          <h4>Why is Year Built so important?</h4>
          <p>A home built in 1965 with a $900K market value is a near-certain renovation candidate.
          The kitchen, bathrooms, electrical panel, plumbing, and HVAC are all 50+ years old. The
          owner has the equity and the motivation. A home built in 2020 at the same value has no
          renovation need yet. Year Built is the strongest signal for <em>timing</em>.</p>
        </div>

        <div className="faqItem">
          <h4>Why do Census ACS home values look lower than Zillow?</h4>
          <p>ACS values are homeowner self-reported estimates from a rolling 5-year survey (2019–2023),
          which lags the actual market by 12–24 months. However, ACS is the only source with complete
          ZIP-level coverage across all 150 ZIPs. The relative ranking of ZIPs is accurate — the
          tier assignments and scores are reliable even if absolute dollar values are slightly below
          current market.</p>
        </div>

        <div className="faqItem">
          <h4>What does Owner % tell me?</h4>
          <p>Renters don't hire renovation contractors — their landlords do, and usually at much lower
          budgets. A ZIP with 80% owner-occupancy means 80% of households are potential renovation
          clients. A ZIP with 40% owner-occupancy (common in downtown areas) means half your ad
          impressions are wasted on renters.</p>
        </div>

        <div className="faqItem">
          <h4>How often is the data updated?</h4>
          <p>Demographic data (income, home values, year built) comes from the 2023 ACS 5-Year
          estimates — updated annually each December. Permit data refreshes nightly from Hillsborough
          County and City of Tampa open data portals. Property-level data (ATTOM/RentCast) is cached
          7 days per address.</p>
        </div>

        <div className="faqItem">
          <h4>What do the ✨ Explain and 📄 PDF buttons do?</h4>
          <p><strong>✨ Explain</strong> sends the ZIP's data to GPT-4o-mini which writes a plain-English
          summary of why the ZIP scored the way it did and what type of builder should target it.
          If no OpenAI key is configured, a rules-based fallback generates the summary automatically.<br/><br/>
          <strong>📄 PDF</strong> generates a printable 1-page market report — useful for client
          presentations or sales meetings.</p>
        </div>

        <div className="faqItem">
          <h4>Can I adjust the scoring weights?</h4>
          <p>Yes — the scoring engine is in <code>server/scoring.js</code> in the GitHub repository.
          Each weight is clearly labeled and can be adjusted. If you have permit data, sales history,
          or your own lead data, it can be integrated via the data pipeline.</p>
        </div>
      </section>

    </div>
  );
}
