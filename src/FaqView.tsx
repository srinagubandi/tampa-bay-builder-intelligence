/* ------------------------------- FAQ / Legend view ------------------------------- */
export function FaqView() {
  return (
    <div className="faqPage">

      {/* ── WHAT IS THIS TOOL ── */}
      <section className="faqSection">
        <h2>What is this tool?</h2>
        <p>
          This is a <strong>renovation and custom-home ad-targeting intelligence platform</strong> built
          specifically for Tampa Bay area builders. It ranks every ZIP code in Hillsborough, Pinellas,
          Pasco, Manatee, and Sarasota counties by how likely homeowners in that area can afford and
          are likely to commission a major renovation ($250K+) or custom home build ($500K+).
        </p>
        <p>
          Use it to decide <strong>where to spend your ad budget</strong>, which neighborhoods to
          target with direct mail, and which ZIP codes to prioritize for door-knocking or Google/Meta
          geo-targeting campaigns.
        </p>
      </section>

      {/* ── COLUMN LEGEND ── */}
      <section className="faqSection">
        <h2>Column Legend — Every Column Explained</h2>
        <p>Every column in the Markets table is explained below in plain builder language.</p>

        <div className="legendGrid">

          <div className="legendCard">
            <div className="legendLabel"># Rank</div>
            <div className="legendDesc">
              The overall position of this ZIP code among all 150 Tampa Bay ZIPs, sorted by{' '}
              <strong>Budget Score</strong> (highest = best ad target). Rank 1 is the most
              attractive market for high-budget renovation work.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">ZIP</div>
            <div className="legendDesc">
              The 5-digit US Postal Service ZIP code. You can paste these directly into Google Ads,
              Meta Ads, or direct-mail platforms to geo-target your campaigns.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Market</div>
            <div className="legendDesc">
              The city or neighborhood name for the ZIP, plus the county beneath it. A single city
              (e.g., Tampa) can span many ZIPs with very different demographics — always look at
              the ZIP level, not just the city name.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Ad Tier</div>
            <div className="legendDesc">
              <strong>Tier 1 — $500K+ Renovations (18 ZIPs):</strong> The highest-income, highest
              home-value markets. Homeowners here regularly commission full gut-renovations, additions,
              and luxury custom builds. These are your primary ad targets.<br /><br />
              <strong>Tier 2 — $250K–$500K Renovations (79 ZIPs):</strong> Strong secondary markets.
              Homeowners can afford major kitchen/bath remodels, additions, and mid-range custom homes.
              Good for volume campaigns.<br /><br />
              <strong>Tier 3 — Monitor (53 ZIPs):</strong> Lower income and home values. Occasional
              $250K+ jobs exist but are not the norm. Watch these for growth signals before investing
              heavily in ads.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Budget Score</div>
            <div className="legendDesc">
              <strong>The primary ranking score (0–100).</strong> Answers the question:{' '}
              <em>"Can homeowners in this ZIP afford a $250K–$500K+ renovation?"</em><br /><br />
              Calculated from: median household income (40%), median home value (40%), and
              owner-occupancy rate (20%). A score of 60+ means the market strongly supports
              $500K+ projects. A score of 25–45 supports $250K–$500K projects.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Median Income</div>
            <div className="legendDesc">
              The median annual household income for all households in this ZIP code, sourced from
              the US Census Bureau ACS 5-Year Estimates (2023). This is the single strongest
              predictor of renovation budget — households earning $120K+ routinely spend $300K–$600K
              on major renovations. Households under $70K rarely commission work above $100K.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Median Home Value</div>
            <div className="legendDesc">
              The median estimated market value of owner-occupied homes in the ZIP. This matters
              because homeowners rarely spend more on a renovation than the home is worth — a
              $1.2M home can easily support a $500K renovation, while a $280K home typically cannot.
              Homes valued over $600K are the sweet spot for high-budget work.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Owner %</div>
            <div className="legendDesc">
              The percentage of housing units that are <strong>owner-occupied</strong> (vs. rented).
              Renters almost never commission renovations — the landlord does, and usually at a lower
              budget. A high owner-occupancy rate (70%+) means more potential renovation clients per
              household in the ZIP. Always prioritize high owner-occupancy ZIPs for renovation campaigns.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Year Built</div>
            <div className="legendDesc">
              The <strong>median year the homes in this ZIP were built.</strong> This is one of the
              most important signals for renovation demand:<br /><br />
              <strong>Built before 1980</strong> — Kitchens, baths, electrical, plumbing, and HVAC
              are all overdue for replacement. High teardown and gut-renovation potential.<br />
              <strong>Built 1980–2000</strong> — First major renovation cycle. Kitchens and baths
              are dated. Strong remodel demand.<br />
              <strong>Built 2000–2015</strong> — Starting to show age. Good for additions and
              upgrades.<br />
              <strong>Built after 2015</strong> — Newer homes. Lower immediate renovation demand
              but good for luxury additions and pool/outdoor living projects.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Luxury %</div>
            <div className="legendDesc">
              The estimated percentage of homes in the ZIP valued above $750K. A high luxury share
              (30%+) means there is a critical mass of high-net-worth homeowners who expect and
              budget for premium finishes, architect-designed renovations, and custom builds. This
              is your best signal for targeting $500K+ project clients.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Reno Score</div>
            <div className="legendDesc">
              <strong>Renovation Score (0–100).</strong> Specifically measures how ripe this ZIP is
              for <em>renovation and remodel</em> work (vs. new construction). Weighted toward older
              homes, high owner-occupancy, and high home values. A score of 50+ means a large share
              of homes are both old enough to need work and valuable enough to justify it.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Opportunity</div>
            <div className="legendDesc">
              <strong>Overall Opportunity Score (0–100).</strong> A composite of all scoring
              dimensions — renovation demand, income, home value, population growth, and waterfront
              premium. Use this as a quick tiebreaker when two ZIPs have similar Budget Scores.
              Higher is always better.
            </div>
          </div>

          <div className="legendCard">
            <div className="legendLabel">Flags</div>
            <div className="legendDesc">
              Special market characteristics that affect strategy:<br /><br />
              <strong>🌊 Waterfront</strong> — The ZIP contains significant waterfront property
              (bay, gulf, or lake frontage). Waterfront homes command 20–50% premiums and owners
              routinely invest in dock additions, outdoor living, and full gut-renovations. These
              are premium targets for luxury renovation work.<br /><br />
              <strong>📈 Growing</strong> — Population is growing faster than the regional average
              (1.5%+ annually). Growth markets attract move-up buyers who renovate before or after
              purchase, and new residents who customize their homes.
            </div>
          </div>

        </div>
      </section>

      {/* ── HOW SCORES ARE CALCULATED ── */}
      <section className="faqSection">
        <h2>How are scores calculated?</h2>
        <table className="faqTable">
          <thead>
            <tr><th>Score</th><th>Formula</th><th>What it measures</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Budget Score</strong></td>
              <td>Income (40%) + Home Value (40%) + Owner % (20%)</td>
              <td>Can this ZIP afford a $250K–$500K+ renovation?</td>
            </tr>
            <tr>
              <td><strong>Reno Score</strong></td>
              <td>Home Age (35%) + Home Value (30%) + Owner % (20%) + Luxury % (15%)</td>
              <td>Are homes old enough and valuable enough to justify renovation?</td>
            </tr>
            <tr>
              <td><strong>Opportunity Score</strong></td>
              <td>Reno (35%) + Income (25%) + Home Value (20%) + Growth (10%) + Waterfront (10%)</td>
              <td>Overall composite attractiveness for a builder</td>
            </tr>
          </tbody>
        </table>
        <p className="muted small">All scores are normalized 0–100 relative to the Tampa Bay region. A score of 100 would be the theoretical maximum for this market.</p>
      </section>

      {/* ── AD TIER THRESHOLDS ── */}
      <section className="faqSection">
        <h2>Ad Tier Thresholds</h2>
        <table className="faqTable">
          <thead>
            <tr><th>Tier</th><th>Label</th><th>Median Income</th><th>Median Home Value</th><th>Recommended Ad Budget Allocation</th></tr>
          </thead>
          <tbody>
            <tr className="tier1row">
              <td><strong>Tier 1</strong></td>
              <td>$500K+ Renovations</td>
              <td>≥ $110,000</td>
              <td>≥ $550,000</td>
              <td>Primary — spend 60–70% of budget here</td>
            </tr>
            <tr className="tier2row">
              <td><strong>Tier 2</strong></td>
              <td>$250K–$500K Renovations</td>
              <td>$70,000–$110,000</td>
              <td>$300,000–$550,000</td>
              <td>Secondary — spend 25–35% of budget here</td>
            </tr>
            <tr className="tier3row">
              <td><strong>Tier 3</strong></td>
              <td>Monitor</td>
              <td>&lt; $70,000</td>
              <td>&lt; $300,000</td>
              <td>Watch list — minimal spend, test only</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── WHERE DOES THE DATA COME FROM ── */}
      <section className="faqSection">
        <h2>Where does the data come from?</h2>
        <table className="faqTable">
          <thead>
            <tr><th>Data Point</th><th>Source</th><th>Vintage</th></tr>
          </thead>
          <tbody>
            <tr><td>Median Household Income</td><td>US Census Bureau — ACS 5-Year Estimates</td><td>2023</td></tr>
            <tr><td>Median Home Value</td><td>US Census Bureau — ACS 5-Year Estimates</td><td>2023</td></tr>
            <tr><td>Owner Occupancy Rate</td><td>US Census Bureau — ACS 5-Year Estimates</td><td>2023</td></tr>
            <tr><td>Median Year Built</td><td>US Census Bureau — ACS 5-Year Estimates</td><td>2023</td></tr>
            <tr><td>Population &amp; Growth</td><td>US Census Bureau — ACS 5-Year Estimates</td><td>2023</td></tr>
            <tr><td>Luxury Share (%)</td><td>Derived from ACS home value distribution</td><td>2023</td></tr>
            <tr><td>Waterfront Flag</td><td>Geographic analysis — Tampa Bay, Gulf Coast, lakes</td><td>Static</td></tr>
            <tr><td>Permit Activity</td><td>Hillsborough County &amp; City of Tampa open data portals</td><td>Live / nightly refresh</td></tr>
            <tr><td>Property Detail</td><td>ATTOM Data + RentCast (when API keys configured)</td><td>Live / 7-day cache</td></tr>
          </tbody>
        </table>
      </section>

      {/* ── HOW TO USE FOR ADS ── */}
      <section className="faqSection">
        <h2>How to use this for ad targeting</h2>

        <h3>Google Ads / Local Services Ads</h3>
        <ol>
          <li>Go to the <strong>Markets</strong> tab and filter to <strong>Tier 1</strong> ZIPs.</li>
          <li>Click <strong>Export CSV</strong> or use the ZIP List API endpoint to copy the ZIP codes.</li>
          <li>In Google Ads, go to <em>Campaign → Locations → Enter location</em> and paste the ZIP codes.</li>
          <li>Set bid adjustments: +20% for Tier 1, +10% for Tier 2, 0% for Tier 3.</li>
        </ol>

        <h3>Meta (Facebook / Instagram) Ads</h3>
        <ol>
          <li>In Ads Manager, go to <em>Ad Set → Audience → Locations</em>.</li>
          <li>Switch from "City" to <strong>"ZIP Code"</strong> targeting.</li>
          <li>Paste your Tier 1 ZIP codes. Meta will show you the estimated reach per ZIP.</li>
          <li>Layer on income targeting: <em>Household income — top 10–25%</em> to further qualify.</li>
        </ol>

        <h3>Direct Mail</h3>
        <ol>
          <li>Export the full CSV and sort by <strong>Year Built</strong> (oldest first) within Tier 1 ZIPs.</li>
          <li>ZIPs with median year built before 1985 and home values above $500K are your best direct-mail targets — homes old enough to need work, owners wealthy enough to pay for it.</li>
          <li>Use the <strong>Property Lookup</strong> tab to research specific addresses before mailing.</li>
        </ol>
      </section>

      {/* ── FAQ ── */}
      <section className="faqSection">
        <h2>Frequently Asked Questions</h2>

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
          renovation need yet. Year Built is the strongest signal for <em>timing</em> — it tells you
          who needs work now vs. in 10 years.</p>
        </div>

        <div className="faqItem">
          <h4>What does Owner % tell me?</h4>
          <p>Renters don't hire renovation contractors — their landlords do, and usually at much lower
          budgets. A ZIP with 80% owner-occupancy means 80% of households are potential renovation
          clients. A ZIP with 40% owner-occupancy (common in downtown areas) means half your ad
          impressions are wasted on renters. Always prioritize high owner-occupancy ZIPs for
          renovation campaigns.</p>
        </div>

        <div className="faqItem">
          <h4>What is the Luxury % and why does it matter?</h4>
          <p>Luxury Share is the estimated percentage of homes in the ZIP valued above $750K. When
          30%+ of homes in a ZIP are in the luxury tier, there is a self-reinforcing culture of
          high-end renovation — neighbors see each other's projects, expectations rise, and budgets
          follow. Luxury-dense ZIPs like Tierra Verde (33715) and Hyde Park (33606) routinely produce
          $500K–$1M+ renovation projects.</p>
        </div>

        <div className="faqItem">
          <h4>How often is the data updated?</h4>
          <p>The demographic data (income, home values, year built) comes from the 2023 ACS 5-Year
          Census estimates — this is the most current ZIP-level data available and is updated
          annually when the Census releases new estimates (typically December). Permit data refreshes
          nightly from Hillsborough County and City of Tampa open data portals. Property-level data
          (via ATTOM/RentCast) is cached for 7 days per property.</p>
        </div>

        <div className="faqItem">
          <h4>Can I adjust the scoring weights?</h4>
          <p>Yes — the scoring engine is in <code>server/scoring.js</code> in the GitHub repository.
          Each weight is clearly labeled and can be adjusted. If you have permit data, sales data,
          or your own lead history, it can be integrated via the data pipeline.</p>
        </div>

        <div className="faqItem">
          <h4>What do the ✨ Explain and 📄 PDF buttons do?</h4>
          <p><strong>✨ Explain</strong> sends the ZIP's data to an AI assistant that writes a
          plain-English summary of why the ZIP scored the way it did and what type of builder should
          target it. If no OpenAI key is configured, a rules-based fallback generates the summary
          automatically.<br /><br />
          <strong>📄 PDF</strong> generates a printable 1-page market report for the ZIP — useful
          for client presentations, sales meetings, or keeping on file.</p>
        </div>

      </section>

    </div>
  );
}
