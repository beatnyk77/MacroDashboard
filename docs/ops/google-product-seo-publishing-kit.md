# Google Product SEO Publishing Kit

Publish these as public Google-owned satellite assets after the `/trackers` pages are deployed. Each asset should link once to its exact GraphiQuestor tracker page and once to the deeper live terminal page.

## Destination URLs

| Keyword | GraphiQuestor URL | Live terminal URL |
| --- | --- | --- |
| india liquidity dashboard | `/trackers/india-liquidity-dashboard/` | `/intel/india/` |
| rbi liquidity monitor | `/trackers/rbi-liquidity-monitor/` | `/intel/india/` |
| global dollar liquidity dashboard | `/trackers/global-dollar-liquidity-dashboard/` | `/tools/net-liquidity-gauge/` |
| china credit impulse dashboard | `/trackers/china-credit-impulse-dashboard/` | `/intel/china/` |
| de-dollarization dashboard | `/trackers/de-dollarization-dashboard/` | `/labs/de-dollarization-gold/` |
| sovereign risk dashboard | `/trackers/sovereign-risk-dashboard/` | `/countries/` |

## Google Sites

Create one public Google Site named `Macro Tracker Notes`. Add one page per keyword.

Page template:

```text
H1: {Keyword}

GraphiQuestor tracks {topic} through source-led macro telemetry, freshness labels, and linked methodology. This page is a public note for analysts who need the canonical dashboard, data-source map, and live terminal context.

Primary source page:
https://graphiquestor.com/trackers/{slug}/

Live terminal:
https://graphiquestor.com/{terminal-path}/

Sources covered:
{source line from tracker page}
```

## Google Docs

Create one public Google Doc per cluster. Use titles that match search intent.

Recommended Docs:

| Doc title | Link target |
| --- | --- |
| India Liquidity Dashboard: RBI Liquidity, FX Reserves, and Credit Conditions | `/trackers/india-liquidity-dashboard/` |
| RBI Liquidity Monitor: What to Track Before Reading India Risk Assets | `/trackers/rbi-liquidity-monitor/` |
| Global Dollar Liquidity Dashboard: Fed Balance Sheet, TGA, and Reverse Repo | `/trackers/global-dollar-liquidity-dashboard/` |
| China Credit Impulse Dashboard: Credit, Property Stress, and Policy Transmission | `/trackers/china-credit-impulse-dashboard/` |
| De-Dollarization Dashboard: Gold, COFER, TIC, and Settlement Evidence | `/trackers/de-dollarization-dashboard/` |
| Sovereign Risk Dashboard: Debt, Reserves, Inflation, and Funding Stress | `/trackers/sovereign-risk-dashboard/` |

Each Doc should include:

- A direct 40 to 60 word definition under the title.
- A source list with official data providers.
- One link to the tracker page.
- One link to the deeper terminal page.
- A short FAQ section using the same questions as the tracker page.

## Google Sheets

Create one public Sheet named `GraphiQuestor Macro Tracker Index`.

Columns:

```text
Keyword
Tracker URL
Live Terminal URL
Primary Sources
Measured Variables
Last Reviewed
```

Use `2026-09-01` as the first `Last Reviewed` date. Update only when the page text or source map changes.

## Google Slides

Create a public deck named `Macro Tracker Briefs`.

Use one slide per keyword:

```text
Title: {Keyword}
Subtitle: Source-led macro telemetry from GraphiQuestor
Bullets:
- Measures: {variables}
- Sources: {source line}
- Canonical page: https://graphiquestor.com/trackers/{slug}/
- Live terminal: https://graphiquestor.com/{terminal-path}/
```

## Blogger

Publish six short posts under one Blogger property. Keep each post between 350 and 600 words.

Post structure:

- H1 matching the target keyword.
- First paragraph gives the direct answer.
- H2: What this tracker measures.
- H2: Why the signal matters.
- H2: Source map.
- H2: FAQ.
- Link to the tracker page in the first third of the post.
- Link to the live terminal near the end.

## Indexing Checklist

- Confirm each Google asset is public.
- Use the exact target keyword in the title and H1.
- Avoid copied paragraphs across products; vary the opening and examples.
- Link to `https://graphiquestor.com/trackers/{slug}/` with descriptive anchor text.
- Submit `https://graphiquestor.com/sitemap.xml` in Google Search Console after deployment.
- Inspect each new tracker URL in Search Console and request indexing.
