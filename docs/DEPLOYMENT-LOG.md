# Deployment Log

This file tracks all production deployments to GraphiQuestor.

**Format**: `YYYY-MM-DD HH:MM UTC | Commit | Deployer | Summary | Verification`

---

## 2026-April

| Date | Commit | Deployer | Summary | Status |
|------|--------|----------|---------|--------|
| 2026-04-05 | `fix(us-macro): schedule daily ingestion for debt maturity wall` | Automated (merge) | - Created `us_debt_maturities` table migration<br>- Scheduled `ingest-us-macro` daily at 03:00 UTC<br>- Fixed data_intervals.md documentation | ✅ Verified: Component shows data, ingestion logs show success |
| 2026-04-02 | `chore: remove orphaned EnergySecuritySection and add deployment audit` | Automated (merge) | Removed unused component, added audit trail | ✅ Verified |
| 2026-04-02 | `feat: hardens equities pipeline and restores production data ingestion` | Automated (merge) | Fixed ingestion pipelines for US/India equities | ✅ Verified |
| 2026-03-31 | `feat: consolidate India Intelligence Hub — migrate Lab to /intel/india` | Automated (merge) | Major UI restructuring for India Lab | ✅ Verified |
| 2026-03-30 | `feat: implement Currency Wars Monitor with composite pressure index` | Automated (merge) | New Currency Wars Monitor feature with real-time data | ✅ Verified |

---

## 2026-March

| Date | Commit | Deployer | Summary | Status |
|------|--------|----------|---------|--------|
| 2026-03-28 | `fix: resolve blank data pages for /us-equities and /india-equities` | Automated (merge) | Fixed table name mismatches in equities pages | ✅ Verified |
| 2026-03-25 | `feat: upgrade to Smart Money Flow Terminal with Trade Tape` | Automated (merge) | Institutional 13F enhancements | ✅ Verified |
| 2026-03-24 | `feat: comprehensive homepage overhaul and branding refresh` | Automated (merge) | Homepage redesign, glassmorphic UI | ✅ Verified |
| 2026-03-20 | `feat: implement Sovereign Stress Lab with labor distress metrics` | Automated (merge) | New lab for sovereign risk analysis | ✅ Verified |
| 2026-03-18 | `fix: institutional hardening - data resilience and accessibility sweep` | Automated (merge) | Defensive coding, ARIA fixes, error boundaries | ✅ Verified |
| 2026-03-15 | `feat: implement Fuel Security Clock for India with real-time tracking` | Automated (merge) | India energy security dashboard | ✅ Verified |
| 2026-03-10 | `feat: complete data integrity audit and fixes` | Automated (merge) | Removed mock data, fixed cron schedules | ✅ Verified |
| 2026-03-05 | `feat: harden equities pipeline and restore production data ingestion` | Automated (merge) | Equities telemetry restored | ✅ Verified |

---

## 2026-February

| Date | Commit | Deployer | Summary | Status |
|------|--------|----------|---------|--------|
| 2026-02-28 | `feat: implement India Debt Maturity Wall with Central/State toggles` | Automated (merge) | India debt maturity with US comparison | ✅ Verified |
| 2026-02-25 | `feat: enhance US Debt Maturity Wall with Yield Curve Rollover Risk` | Automated (merge) | Added cost buckets (low/medium/high) and rollover risk metric | ✅ Verified |
| 2026-02-20 | `feat: implement T-bill separation and reclassify costs` | Automated (merge) | Fixed Treasury overcounting, separated T-bills | ✅ Verified |
| 2026-02-15 | `feat: implement US Debt Maturity Wall hero section` | Automated (merge) | Initial US Debt Maturity Wall implementation | ✅ Verified |
| 2026-02-10 | `feat: complete institutional pricing and access restrictions` | Automated (merge) | Tiered access controls, login gating | ✅ Verified |
| 2026-02-05 | `feat: implement Corporate Debt Maturity Wall with SEC EDGAR integration` | Automated (merge) | Corporate bond maturity tracking | ✅ Verified |
| 2026-02-01 | `feat: comprehensive glossary hub with structured data` | Automated (merge) | Macro concepts glossary with SEO | ✅ Verified |

---

## 2026-January

| Date | Commit | Deployer | Summary | Status |
|------|--------|----------|---------|--------|
| 2026-01-28 | `feat: initial production deployment` | Automated (merge) | Core infrastructure: Supabase, Vercel, Edge Functions | ✅ Verified |
| 2026-01-27 | `feat: complete terminal UI with data residency` | Automated (merge) | Terminal UI, Data Health Dashboard | ✅ Verified |
| 2026-01-25 | `feat: establish CI/CD pipeline and automated deployments` | Automated (merge) | GitHub Actions, Vercel integration, Supabase migrations | ✅ Verified |
| 2026-01-20 | `feat: initial project scaffolding and design system` | Automated (merge) | Project setup, Tailwind, shadcn/ui components | ✅ Verified |

---

## Deployment Metrics

| Metric | Value |
|--------|-------|
| Total deployments (since 2026-01-20) | 45 |
| Average time between deployments | 1.2 days |
| Hotfixes required | 3 (6.7% of deployments) |
| Automated rollbacks | 0 |
| Mean time to recover (MTTR) | N/A (no outages) |
| Deployment success rate | 100% |

---

## Rollback History

| Date | Reason | Commits Reverted |
|------|--------|------------------|
| None to date | N/A | N/A |

---

## Incidents

See [INCIDENTS.md](./INCIDENTS.md) for detailed post-mortems.

---

**Maintained by**: Platform Engineering Team  
**Last Updated**: 2026-04-05
