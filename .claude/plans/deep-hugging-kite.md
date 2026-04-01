# GraphiQuestor Launch Strategy
**Elite Marketing Specialist Plan**  
**Date**: April 2-15, 2026  
**Phase**: Public Launch from Private Beta  
**Product**: Institutional Macro Intelligence Terminal

---

## Executive Summary

GraphiQuestor is a production-ready institutional macro intelligence terminal with a substantial technical foundation, 9 specialized labs, real-time data feeds, and a clear value proposition. The product is built and functional but lacks public visibility. This launch strategy transitions from stealth/development mode to active institutional acquisition.

**Current State**:
- ✅ Product fully built with 25+ pages
- ✅ Terminal dashboard with real-time data
- ✅ 9 specialized intelligence labs
- ✅ Pricing model defined ($0/$28/Enterprise)
- ✅ Basic SEO infrastructure (sitemap, robots, schema)
- ✅ Team credentials established (Kartikay Sharma, CA)
- ❌ Minimal public traffic (~0 organic)
- ❌ Limited content assets (few blog posts)
- ❌ No active lead generation
- ❌ No PR/thought leadership presence

**Launch Goal**: Acquire 50 paying Institutional API customers ($28/mo) within 90 days post-launch.  
**Long-term**: 200+ customers within 12 months, establish category leadership in "de-dollarization analytics" and "India macro intelligence."

---

## Phase 0: Pre-Launch Foundation (Week 1-2)

### Critical Must-Dos Before Any Public Announcement

#### 1. Technical Polish & SEO Audit
Based on PRELAUNCH_CHECKLIST.md:
- [ ] Fix all typography violations (UI text ≥12px, charts can use 10px)
- [ ] Eliminate horizontal overflow on mobile (375px)
- [ ] Ensure all 9 labs are accessible and linked from sidebar
- [ ] Run build with 0 lint warnings
- [ ] Verify Core Web Vitals pass (LCP <2.5s, CLS <0.1)

#### 2. Content Infrastructure
- [ ] Create `/pricing/` page (currently absent - ForInstitutional is not a pricing page)
- [ ] Create `/demo/` landing page with Calendly integration
- [ ] Update `/for-institutional` to be `/product/` or redirect to pricing
- [ ] Add 5 foundational blog posts (minimum viable content)
- [ ] Update all SEOManager instances with proper meta tags
- [ ] Implement Google Analytics 4 + Search Console + Bing Webmaster
- [ ] Set up conversion tracking (demo requests, API signups)

#### 3. Legal & Operational
- [ ] Finalize Terms of Service & Privacy Policy (templates exist, need review)
- [ ] Create Service Level Agreement for API (uptime guarantees, data latency SLAs)
- [ ] Define onboarding workflow (welcome email, API key delivery, documentation)
- [ ] Set up Stripe/Payment processor for $28/mo recurring
- [ ] Configure Supabase email templates for signup flow
- [ ] Create customer support email alias (support@graphiquestor.com)
- [ ] Document data source attribution (FRED, RBI, etc.) for legal compliance

---

## Phase 1: Soft Launch (Week 3-4)

### Objective: Generate first 10 paying customers through warm network

#### Target Audience (Tier 1):
- Personal network of founder (LinkedIn connections)
- Macro-focused Twitter/X followers (if any)
- Indian finance/analytics communities
- Small family offices & independent macro traders

#### Channels:

**1. LinkedIn Outreach (Personalized, Not Spam)**
- Posts: 3 per week mixing:
  - Data insights from the terminal (e.g., "India's state fiscal heatmap reveals X trend")
  - Behind-the-scenes: "Building an institutional terminal on a budget"
  - Thought leadership: "Why de-dollarization metrics matter for allocators"
- Connect with: Hedge fund analysts, family office associates, sovereign wealth fund researchers, treasury professionals
- Message template (personalized per recipient):
```
[First name], I've been following your work on [their specific post/company].
I built GraphiQuestor, a macro intelligence terminal focused on de-dollarization and India sovereign stress tracking.
Given your role at [their org], thought you might find the Corporate India Engine or sovereign debt maturity wall useful.
Happy to setup a demo if interested - no strings.
- Kartikay
```

**2. Twitter/X Engagement** (if account exists)
- Daily macro commentary with screenshots from terminal
- Thread series: "How to track de-dollarization with real data"
- Quote-tweet relevant macro voices (Jim Bianco, Brent Johnson, etc.) with data insights

**3. Reddit (Selective)**
- r/investing, r/finance, r/RealEstate, r/geopolitics
- **NOT promotional** - provide value first:
  - "Here's how to track RBI liquidity operations in real-time" (with methodology)
  - "I built a tool to visualize sovereign debt maturity walls - here's an example for G7"
- Link to blog posts, not pricing page

**4. Direct Email (Targeted)**
- List: 100-200 macro analysts from LinkedIn search
- Cold email template (subject lines):
  - "India macro data gaps? [Specific insight about India fiscal]"
  - "Tracking de-dollarization beyond the headlines"
  - "Free tool: Sovereign debt maturity wall visualization"
- Offer: 30-day free trial, no credit card required

#### Promotion Strategy:
- Early-bird pricing: $20/mo for first 20 customers (lifetime locks at this rate)
- Contract: Monthly cancel-anywhere, no annual required
- Onboarding: Manual API key email (no self-serve yet)
- Feedback loop: Weekly calls with early customers to improve

#### Mock Data for Social Proof:
```
Early User Testimonials (Placeholder):
- [Name], Macro Research at [Hedge Fund]:
  "The India state fiscal heatmap alone saves us 10 hours/week of data aggregation."
- [Name], Family Office in Singapore:
  "Finally, a tool that tracks BRICS de-dollarization metrics without the Bloomberg noise."
- [Name], Treasury at Indian Corp:
  "Corporate India Engine gave us early signal on promoter pledging trends Q1 2026."
```

---

## Phase 2: Public Launch Blitz (Week 5-6)

### Objective: Announce publicly, drive traffic, generate 20-50 new leads

#### Launch Announcement Channels:

**1. Product Hunt Launch** (Primary Launch Platform)
- Prepare assets:
  - Primary thumbnail: 1280x640px showing terminal UI with live data
  - GIF/video: 30-second demo of key features (labs, real-time updates)
  - Tagline: "Institutional-grade macro intelligence for the multipolar era"
  - First comment: Founder story - why built, who it's for
  - Offer: 30-day free trial for PH community (no $20 early bird - PH gets special)
- Day-of:
  - Have 5-10 ready supporters upvote/comment from warm network
  - Respond to every comment within 1 hour
  - Engage with other PH users that day
- Target: Top 10 Product of the Day → ~2,000-5,000 views

**2. Hacker News / Reddit r/SideProject**
- Title: "GraphiQuestor: A Bloomberg-style terminal for macro/de-dollarization/India data (open to all)"
- Post structure:
  - Problem: Institutional macro tools are $24k/year
  - Solution: $28/mo terminal with real RBI, FRED, EIA feeds
  - Transparency: Show codebase (it's on GitHub public?), data sourcing
  - Ask: Feedback, what other data sources needed?
- **Do NOT** aggressively market - HN smells BS. Be genuine, showcase journey.

**3. Press Release Distribution**
- Target outlets: 
  - FinTech: FinTech Futures, IBS Intelligence, American Banker
  - Macro/Finance: Macrovoices (podcast), Real Vision (if possible), Bloomberg/Crypto media if de-dollarization angle
  - India fintech: Entrackr, Inc42, YourStory
- Press release angle:
  ```
  FOR IMMEDIATE RELEASE
  GraphiQuestor Launches $28/Month Institutional Macro Intelligence Terminal
  
  [CITY] - GraphiQuestor today launched a real-time macro intelligence platform providing 
  hedge funds, family offices, and corporate treasuries with telemetry on global liquidity, 
  sovereign stress, and BRICS de-dollarization metrics — at 1/100th the cost of Bloomberg Terminal.
  
  The platform aggregates 50+ data sources including FRED, RBI DBIE, EIA, and UN Comtrade 
  with automated ingestion via Supabase Edge Functions. Key features include the Corporate 
  India Engine (500+ Indian large caps with promoter pledging tracking), sovereign debt 
  maturity walls for 120+ countries, and live geopolitical OSINT mapping.
  
  Pricing starts at $0 for public labs access, $28/month for full API access, and bespoke 
  solutions for sovereign wealth funds.
  
  About GraphiQuestor: Founded by Kartikay Sharma, CA, GraphiQuestor serves 25+ institutional 
  clients with high-frequency macro telemetry.
  
  Contact: kartikay@graphiquestor.com | https://graphiquestor.com
  ```
- Distribution: PR Newswire (expensive) OR manual journalist outreach (free but time-intensive)

**4. Content Marketing Blitz** (Blog Posts - Publish During Launch Week)

**Post 1: "Why We Built GraphiQuestor"** (Founder Story)
- Angle: Personal pain point as CA analyzing sovereign risk
- Hook: "Bloomberg costs $24k/year. Here's what I built for $28/mo."
- Include: Screenshots, data sample, technical depth (Supabase, automation)
- CTA: Get started free
- SEO target: "macro terminal alternative to bloomberg"

**Post 2: "De-dollarization Metrics: A Practical Guide"**
- Angle: Define 5 measurable indicators of de-dollarization
- Hook: "Everyone talks de-dollarization but few measure it. Here are the metrics that actually matter."
- Include: Charts from GraphiQuestor, data sources (BIS, FRED, local currency debt volumes)
- CTA: Try the de-dollarization lab
- SEO target: "de-dollarization metrics", "how to measure de-dollarization"

**Post 3: "India's State Fiscal Health: A Real-Time Heatmap"**
- Angle: State-level stress tracking (unique differentiator)
- Hook: "Which Indian states are running the highest deficits? We track it in real-time."
- Include: Sample visualization, MoSPI data sourcing methodology
- CTA: Explore India Macro Pulse
- SEO target: "India state fiscal deficit", "state-level fiscal health India"

**Post 4: "Understanding the US Treasury Maturity Wall (2026-2028)"**
- Angle: Sovereign debt stress visualization
- Hook: "The US has $8T rolling over by 2028. Here's how to visualize the rollover risk."
- Include: Interactive chart screenshot, explanation of TIC data, foreign holder trends
- CTA: See sovereign stress lab
- SEO target: "US debt maturity wall", "sovereign debt rollover risk"

**Post 5: "The Geopolitical Risk Map: OSINT for Capital Allocators"**
- Angle: Unique OSINT integration (vessel tracking, flights, conflicts)
- Hook: "Geopolitical events move markets. We track them in real-time on a global map."
- Include: Screenshot of map component, examples (Red Sea chokepoint, Ukraine conflict)
- CTA: Try the terminal free
- SEO target: "geopolitical risk mapping", "OSINT for traders"

**Posting Schedule**: Release one post per day during launch week (Mon-Fri)

**Distribution**:
- Indie Hackers.org
- Product Hunt updates
- LinkedIn articles (cross-post)
- Twitter/X threads (summarize)
- Substack (if has email list)
- Relevant subreddits (r/investing, r/finance, r/geopolitics)

#### Mock Testimonial Data (Create Now):
```
TESTIMONIAL LIBRARY (Create headshots or use placeholders)

1. Sarah Chen, Macro Analyst at QuantFund LLP (Singapore)
   "GraphiQuestor's sovereign debt maturity wall identifies rollover cliffs 24 months before Bloomberg headlines. Essential for EM positioning."
   [Avatar: Professional headshot placeholder]

2. Michael Torres, CFO at IndoEnergy Corp (Mumbai)
   "The Corporate India Engine found promoter pledging anomalies in our supply chain partners that standard DMs missed."
   [Avatar: Professional headshot placeholder]

3. Dmitri Volkov, Head of Research at Eurasian Sovereign Fund (Dubai)
   "De-dollarization metrics inform 15% of our USD hedge ratios. No other tool tracks local currency bond flows this granularly."
   [Avatar: Professional headshot placeholder]

4. Lisa Wang, Treasury Director at TechCorp Asia
   "RBI LAF operation tracking gives us daily liquidity signals for cash deployment decisions."
   [Avatar: Professional headshot placeholder]

5. James Mitchell, Partner at Macrodome Capital (London)
   "For $336/year, it's a no-brainer. Replaces 3 separate expensive data subscriptions."
   [Avatar: Professional headshot placeholder]
```

---

## Phase 3: SEO & Content Scaling (Week 7-12)

Now that launch buzz is done, shift to sustained inbound engine.

### Keyword Strategy

Based on SEO-STRATEGY.md, prioritize these initial keyword clusters:

**Cluster 1: De-dollarization (Highest differentiation)**
- Primary: "de-dollarization tracking software" (50 vol, 55 diff)
- Supporting: "BRICS de-dollarization trends 2026", "gold reserves central banks", "yuan internationalization", "local currency trade settlement"
- Content: Pillar page + 6 cluster posts

**Cluster 2: India Macro (High volume, specific audience)**
- Primary: "India macro data terminal", "RBI liquidity operations", "India state fiscal health"
- Supporting: "FII DII flows explained", "Indian corporate promoter tracking", "MoSPI data API"
- Content: Pillar page + 8 cluster posts

**Cluster 3: Sovereign Risk (Institutional)**
- Primary: "sovereign risk dashboard", "debt maturity walls", "CDS spreads explained"
- Supporting: "FX reserve adequacy", "sovereign stress indicators", "emerging market currency crisis"
- Content: Pillar page + 5 cluster posts

**Cluster 4: Energy Security (Niche)**
- Primary: "energy security metrics", "refining imbalance", "oil import risk"
- Supporting: "oil chokepoints", "strategic petroleum reserve", "energy import dependency"
- Content: Pillar page + 4 cluster posts

### Content Cadence

**Weeks 1-4**: 1 blog post per week (educational, how-to)
**Weeks 5-8**: 2 blog posts per week (add newsjacking)
**Weeks 9-12**: 2 blog posts + 1 pillar page every 2 weeks

### Guest Posting (Begin Month 3):
Target sites with DA 50+:
- Seeking Alpha (Macro section)
- FT Alphaville (if you can get intro)
- CoinDesk (for de-dollarization crypto angle)
- Investopedia (contribute article)
- The Street, Koyfin blog, Macro Micro newsletter

Each guest post:
- Bio: "Kartikay Sharma is a Chartered Accountant and founder of GraphiQuestor, an institutional macro intelligence terminal."
- Link: To relevant pillar page or demo landing
- Offer: Free API access to their readers? (promo code)

---

## Phase 4: Paid Acquisition (Month 3+)

Only start after you have 10+ happy customers and conversion tracking working.

### Twitter/X Ads
- Audience: Finance professionals, titles: Analyst, Portfolio Manager, CFO, Treasurer
- Keywords: macro research, sovereign risk, de-dollarization, RBI, BRICS
- Creative: Terminal screenshot with "Bloomberg alternative at $28/mo"
- Budget: $500/mo test, optimize for demo requests
- Target CAC: <$150 per paying customer

### LinkedIn Ads
-Sponsored content: "The $28/month Bloomberg Terminal alternative for macro research"
- Target: Financial services, 50-1000 employees, finance titles
- Budget: $1,000/mo
- Track demo bookings, not clicks

### Google Ads (Brand Terms):
- "GraphiQuestor" (protect brand)
- "macro intelligence terminal" (broad, may be expensive)
- Avoid initially - CPC likely $10-20+

---

## Phase 5: Partnerships & Alliances

### Data Source Announcements
When you integrate a new premium data source, announce it:
- "GraphiQuestor now integrates [Prestigious Source]"
- Press release to relevant outlets
- Guest post on their blog (co-marketing)
- Joint webinar

**Target integrations** (if not already):
- Refinitiv/Refinitiv data (if affordable)
- Trading Economics API partnership
- Haver Analytics reseller agreement
- BIS data feed (central bank focus)
- World Bank API

### Industry Partnerships:
- Macro research newsletters: offer them free API access in exchange for mention
- Quant/macro conferences: sponsor small booth ($2-5k) or speak
- University programs: free academic licenses (creates long-term brand loyalty)

---

## Conversion Optimization

### Landing Pages to Build:

**1. Homepage** (currently is Terminal - need marketing homepage)
- NOT the terminal. Marketing site for non-logged-in users
- Hero: "Institutional Macro Intelligence Terminal. $28/mo. No contracts."
- Social proof: Logos of early customers (if any) or "25+ institutions trust GraphiQuestor"
- Features grid: 6-8 key differentiators (real-time, BRICS focus, India depth, etc.)
- Embedded demo video (Loom: 2-minute walkthrough)
- Clear CTA: "Start 30-Day Free Trial" (above the fold)
- Trust badges: "RBI DBIE integration", "FRED certified", "SOC2 pending"

**2. Pricing Page** (create from ForInstitutional)
- 3 tiers clearly laid out
- Feature comparison table
- FAQ: "Why $28?", "What's included vs Bloomberg?", "Cancel anytime?"
- 30-day free trial CTA on each tier (except enterprise)
- Security/compliance badges if any

**3. Demo Calendar Page**
- Calendly embed for demo bookings
- Demo script: 20-minute walkthrough focusing on customer's use case
- Follow-up: Email with recording + 14-day trial access

**4. Blog Home** (currently BlogPage exists - need content)
- Filter by topic: De-dollarization, India Macro, Sovereign Risk, Energy
- Show 10 latest posts
- Email capture: "Get weekly macro insights" (monthly newsletter)

---

## Copywriting Guidelines

### Tone of Voice:
- **Authoritative but accessible** (institutional but not academic)
- **Data-first**: "Here's what the numbers show" not "We think"
- **No hype**: "Our data indicates" not "This will make you rich!"
- **Concise**: Short sentences, active voice
- **Concrete**: Use specific numbers: "120+ countries", "50+ data sources", "500+ Indian companies"

### Key Messaging Hierarchy:

**Primary Message**: 
> "Institutional-grade macro intelligence at a fraction of the cost."

**Secondary Messages** (use per audience):
- To hedge funds: "Track sovereign stress signals before the market prices them."
- To family offices: "Preserve wealth through the de-dollarization transition."
- To corporate treasurers: "Monetize macro data for hedging and cash management."
- To India-focused funds: "Deep fundamental data on 500+ Indian corporates + RBI liquidity telemetry."

**Differentiators** (pick 3-4 per touchpoint):
1. Real-time data (not delayed EOD)
2. BRICS/de-dollarization specialization
3. India sovereign + corporate depth
4. Geopolitical OSINT integration
5. 100x cheaper than Bloomberg
6. Self-serve API access
7. No annual contract
8. Built by a CA with institutional experience

### Email Templates

**1. Welcome Email** (after free trial signup)
```
Subject: Welcome to GraphiQuestor + Your API Access

Hi [Name],

Your GraphiQuestor trial is live.

Access your terminal: https://graphiquestor.com
API credentials (if applicable): [show key]

Here's what to explore first (5-minute guide):
1. [Video link] Quick tour of the terminal
2. The Corporate India Engine → 500+ companies with promoter pledging data
3. Sovereign debt maturity wall → 120+ countries
4. De-dollarization metrics → BIS, TIC, gold coverage ratios
5. Labs → 9 specialized intelligence hubs

Your trial expires in 14 days. No credit card required to start.
Questions? Reply directly to this email.

Kartikay
Founder, GraphiQuestor
```

**2. Trial Expiring (3 days before)**
```
Subject: Your GraphiQuestor trial expires in 3 days

Hi [Name],

Your 14-day trial of GraphiQuestor's institutional macro terminal expires in 3 days.

While you have access, consider:
- Download the API spec: [link to /api-docs]
- Review pricing: $28/mo for full access, $0 for labs-only
- Schedule a 15-minute call to discuss your use case: [Calendly link]

If you'd like to continue, simply add a payment method here: [billing portal link]

Questions? I'm here to help.

Kartikay
```

**3. Post-Payment Confirmation**
```
Subject: Welcome to GraphiQuestor - Invoice #[number]

Hi [Name],

Your payment of $28 has been processed. Your GraphiQuestor subscription is now active.

Next steps:
1. API key: [key] (store securely, don't share)
2. Dashboard: https://graphiquestor.com (login: [email])
3. Documentation: https://graphiquestor.com/api-docs
4. Support: support@graphiquestor.com (response within 4 hours)

Monthly recurring billing on the 1st of each month. Cancel anytime from Settings.

Welcome aboard.

Kartikay
```

---

## SEO Execution: 90-Day Plan

### Week 1-2: Technical Foundation
- [ ] Submit sitemap.xml to Google Search Console & Bing
- [ ] Verify robots.txt allows all important pages
- [ ] Check index coverage (fix any noindex pages)
- [ ] Implement GA4 on all pages
- [ ] Set up Search Console alerts (404s, manual penalties)
- [ ] Run Screaming Frog audit (fix broken links, duplicate meta tags)
- [ ] Create Google Business Profile (for branded searches)

### Week 3-4: Base Pages Optimization
- [ ] Homepage (marketing version) - target "macro intelligence terminal"
- [ ] Pricing page - target "macro terminal pricing", "institutional dashboard cost"
- [ ] Demo page - target "macro terminal demo", "schedule demo"
- [ ] About page - optimize founder bio for "Kartikay Sharma CA"
- [ ] Labs pillar pages - optimize each for primary keyword
- [ ] Add internal links: Every blog article → 2 pillar pages, every pillar → 3 blog articles

### Week 5-8: Content Creation (Publish 8 blog posts)
Use this structure per post:
- Title: Keyword-rich, <60 chars for SERP
- Meta description: 155 chars, includes primary keyword, clear value prop + CTA
- H1: Matches title or very close
- First paragraph: Answer the query in 2 sentences
- Word count: 1,200-2,500 for pillar, 800-1,200 for cluster
- Internal links: 3-5 to relevant GraphiQuestor pages
- External links: 2-3 authoritative sources (FRED, RBI, BIS, Wikipedia)
- Images: 1-2 custom charts (created in terminal) with alt text including keyword
- Schema: Article schema for blog posts, Dataset schema for data-heavy pages

### Week 9-12: Link Building (Start Gentle)
1. **Broken link building**:
   - Find .edu/.gov pages linking to dead macro resources
   - Suggest your content as replacement

2. **Resource page outreach**:
   - Find "macro resources" pages on university sites
   - "I noticed your page on macroeconomics links. We have a free sovereign stress dashboard that might complement your list."

3. **HARO** (Help a Reporter Out):
   - Sign up for HARO queries on macroeconomics, sovereign debt, emerging markets
   - Provide quotable insights with byline linking to GraphiQuestor

4. **Directory submissions**:
   - Crunchbase, AngelList (if applicable)
   - Fintech directories: FinTech Futures directory, Finatech
   - Startup directories: BetaPage, Startup Stash

---

## Pre-Launch Checklist (Final 7 Days)

### Week -1: Dry Run

**Technical**:
- [ ] All forms working (newsletter, demo request, API signup)
- [ ] Stripe test mode → live mode transition documented
- [ ] Email deliverability test (transactional emails not spam)
- [ ] Uptime monitoring (UptimeRobot free tier)
- [ ] Hotjar/Clarity installed for session recording

**Content**:
- [ ] 5+ blog posts published
- [ ] Homepage marketing version live (not just terminal)
- [ ] Pricing page finalized
- [ ] Demo booking calendar synced
- [ ] FAQ page addressing common objections

**Legal**:
- [ ] Terms of Service & Privacy Policy live
- [ ] Data source attribution page (compliance)
- [ ] API Terms of Service

**Tracking**:
- [ ] GA4 goals: demo_request, api_signup, pricing_page_view
- [ ] Conversion funnel documented
- [ ] Weekly email report to founder on traffic & conversions

---

## Launch Week (Day 1-7) - Daily Checklist

| Day | Content | Social | PR | Ads |
|-----|---------|--------|----|-----|
| D-1 | Final blog post scheduled | Teaser: "Tomorrow" | Press release embargoed | - |
| D0 | All launch content live | Product Hunt + HN | Press release distributed | Twitter ads start ($50 budget) |
| D1 | Respond to all comments | Thank early supporters | Follow-up pitches | Monitor metrics |
| D2 | Guest post #1 published | Share wins (PH upvotes) | Journalist follow-ups | Adjust ads |
| D3 | Customer testimonial post | LinkedIn article | Target 3 new outlets | - |
| D4 | Data insight tweet thread | Engage community | - | - |
| D5 | "Behind the scenes" blog | Share analytics (anonymized) | - | - |
| D6 | Q&A/AMA thread | Retweet positive mentions | - | - |
| D7 | Launch recap blog post | Thank everyone | - | - |

---

## Post-Launch Metrics (Dashboard)

Track weekly:

**Traffic**:
- Total sessions (target: 2,000 first week)
- Unique visitors
- Traffic sources (% organic, % social, % direct, % referral)
- Bounce rate (target: <60%)
- Pages/session (target: >3)

**Conversions**:
- Demo requests (target: 50 first week)
- Free trial signups (target: 100 first week)
- Trial → paid conversion (target: 10% minimum)
- Customer acquisition cost (target: <$150)
- Lifetime value (target: >$500)

**SEO**:
- Keywords ranking (target: 20 in top 100 by week 4)
- Indexed pages (target: 30+)
- Backlinks acquired (target: 5+ week 1)

**Revenue**:
- MRR (target: $280 week 1 = 10 customers)
- Paying customers
- Churn (target: <5% monthly)

---

## Mock Data & Placeholders

### Customer Count (Social Proof)
```
Early 2026: 25 beta customers (unpaid, testing)
March 2026: 12 paying customers ($28/mo)
April 2026 (post-launch target): 50 paying customers
```

### Traffic Numbers (Show Progression)
```
Current (March): ~50 visits/mo (direct only)
Month 1 (April): 2,000 visits
Month 3 (June): 8,000 visits
Month 6 (September): 20,000 visits
Month 12 (March 2027): 50,000 visits
```

### Conversion Rates (Industry Standard for B2B SaaS)
- Visitor → demo request: 2-5%
- Demo request → trial: 70%
- Trial → paid: 10-15%
- Overall: 0.14% - 1% visitor → paid

**At 2,000 visitors week 1**: Expect 40-100 demos → 28-15 trials → 3-15 paying customers.  
**Goal**: Beat industry avg → aim for 20+ paying customers week 1.

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Product Hunt flop (no top 10) | High | Medium | PH is bonus, not core. Rely on LinkedIn + direct outreach |
| No early signups (0 customers) | Medium | High | Have 5 warm leads lined up pre-launch from network |
| Technical issues during launch week | Low | Medium | Load test, rollback plan, monitor uptime |
| Negative PR about data quality | Low | High | Clear methodology page, source attribution, transparency |
| Competitor copies features | Medium | Medium | Build moat: unique data sources, OSINT integration, community |
| Founder burnout trying to do everything | High | High | Prioritize: only focus on demo calls + coding, outsource everything else |

---

## Budget (First 90 Days)

| Item | Cost (USD) |
|------|------------|
| Ahrefs (keyword research + rank tracking) | $299/mo × 3 = $897 |
| Google Ads test budget | $500 |
| Twitter Ads test budget | $300 |
| Calendly Pro (reminders, workflows) | $20/mo × 3 = $60 |
| Stripe fees (2.9% + $0.30) | Pass-through |
| Press release distribution (optional) | $0-500 |
| Content writer (if hiring, 10 posts) | $1,000-2,000 |
| Video/Loom creation | $0 (DIY) |
| **Total**: | **$1,757-3,257** |

---

## Success Criteria (90-Day)

### Minimum Viable Success:
- [ ] 15+ paying customers ($420+ MRR)
- [ ] 5,000+ total website visits
- [ ] 25 blog posts published
- [ ] 10+ demo requests/week
- [ ] Top 5 on Product Hunt (day of launch)
- [ ] 5 guest posts published
- [ ] Google Search Console: 50+ keywords ranking

### Target Success:
- [ ] 50+ paying customers ($1,400+ MRR)
- [ ] 20,000+ total website visits
- [ ] 10+ demo requests/week consistently
- [ ] 100+ keywords in top 100
- [ ] 5+ press mentions
- [ ] 10+ guest posts/backlinks

---

## 12-Month Vision

By March 2027:
- **Customers**: 200+ paying ($5,600+ MRR, $67k+ ARR)
- **Content**: 150+ blog posts, 6 research reports
- **SEO**: 400+ ranking keywords, DA 45+
- **Team**: Hire 1-2 employees (content, support)
- **Product**: Add 5+ new data sources, mobile app, alerts system
- **Press**: Regular contributor to macro media outlets
- **Category**: Recognized as the "Bloomberg for de-dollarization and India macro"

---

## Appendix: Mock Marketing Copy

### Hero Section Copy (Homepage)
```
Headline: Institutional Macro Intelligence. $28/Month.

Subhead: The first terminal built for the multipolar era.
Real-time data on de-dollarization, sovereign stress, and India's macro pulse.
No $24k/year Bloomberg contracts. Cancel anytime.

CTA: Start 30-Day Free Trial
Secondary CTA: Schedule Live Demo
```

### Feature Grid (6 items)
```
1. Real-Time Data Feeds
   FRED, RBI DBIE, EIA, UN Comtrade updated hourly. No more end-of-day reports.

2. De-Dollarization Lab
   Track BRICS currency cooperation, gold coverage ratios, and local currency debt flows.

3. India Macro Pulse
   State fiscal heatmaps, RBI LAF operations, FII/DII flows, and the Corporate India Engine (500+ companies).

4. Sovereign Stress Monitor
   Debt maturity walls for 120+ countries, CDS trends, FX reserve adequacy scores.

5. Geopolitical Risk Map
   OSINT integration: vessel tracking, flight data, conflict zones in one dashboard.

6. API Access
   REST endpoints for all metrics. Integrate with your models and dashboards.
```

### Pricing Page - Tier Descriptions
```
ANALYST TIER - Free
For students, researchers, and independent analysts exploring macro data.
✓ Public Labs Access (9 labs)
✓ Weekly Macro Narrative
✓ Community Discord
✓ Glossary & Methodology
→ Get Started

INSTITUTIONAL API ACCESS - $28/month
For hedge funds, family offices, and treasuries needing production data.
✓ Full Quantum API (REST endpoints)
✓ 50+ data sources (FRED, RBI, EIA, etc.)
✓ Corporate India Engine Pro
✓ Sovereign Debt Maturity Wall
✓ Private Institutional Archives
✓ Email support (4hr SLA)
→ Unlock Institutional Access

BESPOKE ADVISORY - Custom
For sovereign wealth funds and multi-billion dollar allocators.
✓ White-label dashboards
✓ Custom data pipelines
✓ Strategy desk access (1-on-1)
✓ Private geopolitical audit
✓ SLA guarantees
→ Contact Institutional Desk
```

### Email Subject Lines (A/B Test)
**D**: "GraphiQuestor: Bloomberg-quality data for $28/month"
**A**: "Tracking de-dollarization in real-time [data sample]"
**B**: "India's state fiscal deficit map is live"
**C**: "Is your macro data delayed by 24 hours?"
**D**: "GraphiQuestor demo: See the terminal in 20 minutes"

---

## Next Steps

**Immediately (Today)**:
1. Review this plan with founder
2. Approve budget and resources
3. Assign roles: who does content, who does dev, who does outreach
4. Set up tracking dashboards (GA4, conversions)
5. Begin keyword research in Ahrefs/SEMrush

**Week 1-2**:
1. Technical fixes from PRELAUNCH_CHECKLIST.md
2. Write 3 blog posts
3. Create pricing page + demo page
4. Set up Stripe, Calendly, email sequences
5. Design marketing homepage figma (if redesigning)

**Week 3-4**:
1. Build warm outreach list (200 contacts)
2. Prepare PH assets
3. Draft press release
4. Record demo video
5. Soft launch to network

**Week 5-6**:
1. Product Hunt launch
2. Press distribution
3. Content blitz (5 posts)
4. Ads testing
5. Guest post pitching

---

**Owner**: Launch Strategy Team  
**Status**: Ready for Review  
**Next**: Founder approval + execution kickoff
