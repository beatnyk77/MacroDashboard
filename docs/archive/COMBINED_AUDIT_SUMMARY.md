# 🎯 GraphiQuestor Combined Audit: Executive Summary & Action Plan

---

## 📊 Overall Assessment

| Dimension | Score | Status |
|-----------|-------|--------|
| **Architecture** | 85/100 | ✅ Strong foundation |
| **Type Safety** | 70/100 | ⚠️ Erosion (any types) |
| **Testing** | 10/100 | 🔴 Critical gap |
| **Security** | 50/100 | 🔴 Needs hardening |
| **Performance** | 60/100 | ⚠️ Bundle bloat |
| **UI/UX** | 65/100 | ⚠️ Accessibility & consistency issues |
| **Observability** | 40/100 | 🔴 No error tracking |
| **DevOps** | 30/100 | 🔴 No CI/CD |

**Overall: C+ → Target B+ (80)** with 200 hours focused effort.

---

## 🔴 CRITICAL FIXES (Week 1-2)

### Priority 1: Security Hardening (4 hours)

**1.1 Edge Function Authentication**
```typescript
// supabase/functions/ingest-daily/index.ts
const SHARED_SECRET = Deno.env.get('INGEST_SHARED_SECRET')!
if (authHeader !== `Bearer ${SHARED_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
}
```

**1.2 Input Validation**
```typescript
// Add Zod to all Edge Functions
import { z } from 'zod'
const ObservationSchema = z.array(z.object({
    date: z.string(),
    value: z.number().nullable()
}))
```

**1.3 Security Headers**
```typescript
// vite.config.ts - add response headers plugin
response: {
    headers: {
        'Content-Security-Policy': "default-src 'self'",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
}
```

---

### Priority 2: Error Tracking Setup (2 hours)

```bash
npm install @sentry/react @sentry/tracing @sentry/nextjs
```

```typescript
// src/main.tsx or App.tsx
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/browser";

Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracingSampleRate: 0.2, // 20% of transactions
});
```

Add to Edge Functions too (`_shared/logging.ts`):
```typescript
import * as Sentry from "npm:@sentry/deno"

export class Logger {
    // Add error reporting
    async error(source: string, message: string, meta?: any) {
        await Sentry.captureMessage(`[${source}] ${message}`, {
            extra: meta,
            level: 'error'
        })
    }
}
```

---

### Priority 3: Environment Validation (30 min)

```typescript
// src/utils/env.ts
import { z } from 'zod'

const envSchema = z.object({
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(10),
    VITE_SENTRY_DSN: z.string().optional(),
    INGEST_SHARED_SECRET: z.string().min(32).optional(),
    FRED_API_KEY: z.string().min(10).optional(),
})

export const env = envSchema.parse(import.meta.env)

// Throw early if missing required
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Missing required environment variables')
}
```

Add `.env.example` with all variables.

---

### Priority 4: Accessibility Fast Fixes (3 hours)

**4.1 Skip-to-Content Link**
```tsx
// In GlobalLayout.tsx, add:
<a href="#main" className="skip-link">Skip to content</a>
<main id="main" tabIndex={-1}>
```

**4.2 Global Focus Styles**
```css
/* Add to src/index.css */
*:focus-visible {
    outline: 2px solid #8B5CF6;
    outline-offset: 2px;
}
```

**4.3 ARIA Labels**
```tsx
// Audit all icon-only buttons
<button aria-label="Refresh" onClick={...}>  // ✅
<button onClick={...}>                         // ❌ Find with: grep -r "<button>[^<]*<[Ii]con" src/
```

**4.4 Color Contrast Fix**
- Find all `text-gray-400` (Slate-400: 4.3:1 ❌)
- Replace with `text-gray-300` (Slate-300: 6.9:1 ✅)
- Command: `find src/ -name "*.tsx" -exec sed -i '' 's/text-gray-400/text-gray-300/g {} +`

**4.5 Cursor Pointers**
```css
/* Add globally */
button, [role="button"], a[href], .cursor-pointer {
    cursor: pointer;
}
```
Find elements missing: `grep -r "onClick" src/ | grep -v "cursor-pointer"`

---

### Priority 5: Error Handling Improvements (4 hours)

**5.1 Add Retry Logic to Edge Functions**
```typescript
// supabase/functions/_shared/retry.ts (create this)
export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 500
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (err) {
            if (attempt === maxRetries) throw err
            await delay(baseDelay * attempt) // Exponential backoff
        }
    }
    throw new Error('Unreachable')
}
```

**5.2 Surface Errors in UI**
```tsx
// In GlobalLiquiditySection.tsx, catch errors:
const { data, error, isLoading } = useGlobalLiquidity()

if (error) {
    return (
        <Alert variant="destructive">
            <AlertCircle />
            Failed to load liquidity data
        </Alert>
    )
}
```

---

## 🟡 HIGH PRIORITY (Week 3-4)

### Priority 6: Type Safety (8 hours)

**6.1 Eliminate `any` Types**
```bash
# Find all any usages
grep -r "\bany\b" src/ > any-usage.txt  # 112+ files

# Fix strategy:
# 1. Enable noImplicitAny in tsconfig (already strict: true)
# 2. Fix Supabase queries with generics
# 3. Create interfaces for all API responses
```

**6.2 Shared Types Package**
```
packages/types/
  src/
    index.ts
    metrics.ts
    india-macro.ts
    supabase.ts
  package.json
```

Update imports:
```typescript
// Before:
import { GlobalLiquidityData } from '@/hooks/useGlobalLiquidity'

// After:
import { GlobalLiquidityData } from '@graphiquestor/types'
```

---

### Priority 7: Performance Optimization (12 hours)

**7.1 Bundle Analysis**
```bash
npm install -D rollup-plugin-visualizer
# Add to vite.config.ts:
import visualizer from 'rollup-plugin-visualizer'
plugins: [
    react(),
    visualizer({ filename: 'dist/bundle-analysis.html' })
]
```

**7.2 Code Splitting**
```typescript
// Lazy load heavy components:
const OilFlowsSankey = lazy(() => import('@/features/dashboard/components/cards/OilFlowsSankey'))
const GeopoliticalRiskMap = lazy(() => import('@/features/dashboard/components/maps/GeopoliticalRiskMap'))

// Wrap in Suspense:
<Suspense fallback={<CardSkeleton />}>
    <OilFlowsSankey />
</Suspense>
```

**7.3 Image Optimization**
```bash
# Install plugin
npm install -D vite-plugin-imagemin

# Add to vite.config.ts:
import imagemin from 'vite-plugin-imagemin'
plugins: [react(), imagein()]
```

---

### Priority 8: MUI → Radix Migration (40 hours)

**Week 1: Setup & Simple Components**
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu tabs skeleton
```

Create wrapper components:
```tsx
// src/components/ui/Button.tsx
export const Button = ({ children, ...props }) => (
    <RadixButton className="...">{children}</RadixButton>
)
```

**Week 2: Replace Grid System**
```tsx
// Replace MUI Grid → Tailwind Grid
// Before:
<Grid container spacing={3}>
    <Grid item xs={12} lg={4}>

// After:
<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
    <div className="lg:col-span-1">
```

**Week 3: Complex Components**
- Replace MUI Card with Radix Card + custom styling
- Replace MUI Typography with semantic HTML + Tailwind typography plugin
- Replace MUI Skeleton with custom Skeleton

**Week 4: Remove MUI**
```bash
npm uninstall @mui/material @emotion/react @emotion/styled @mui/icons-material
# Rebuild, test, verify bundle size -400KB ✅
```

---

## 🟢 MEDIUM PRIORITY (Month 2-3)

### Priority 9: Testing Infrastructure (40 hours)

**9.1 Setup Vitest + Testing Library**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
    },
})
```

**9.2 Write Tests**

Priority order:
1. `src/lib/utils.ts` (formatters) - 1 hour
2. `src/hooks/useGlobalLiquidity.ts` - 2 hours (mock Supabase)
3. `src/components/MetricCard.tsx` - 2 hours
4. `src/components/DataHealthBanner.tsx` - 1 hour
5. `src/features/dashboard/components/sections/GlobalLiquiditySection.tsx` - 3 hours

Coverage target: 60% → 80% over 2 months.

---

### Priority 10: CI/CD Pipeline (8 hours)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with: { node-version: '20' }
            - run: npm ci
            - run: npm run type-check  # Add script
            - run: npm run lint
            - run: npm test -- --coverage
            - run: npm run build
            - run: npm run bundle-analyzer  # Add script

    deploy-preview:
        if: github.event_name == 'pull_request'
        runs-on: ubuntu-latest
        needs: test
        steps:
            - uses: vercel/action@v1
              with:
                vercel-token: ${{ secrets.VERCEL_TOKEN }}
                vercel-org-id: ${{ secrets.ORG_ID }}
                vercel-project-id: ${{ secrets.PROJECT_ID }}
                working-directory: ./
```

Add scripts to `package.json`:
```json
{
    "scripts": {
        "type-check": "tsc --noEmit",
        "build": "vite build",
        "preview": "vite preview"
    }
}
```

---

### Priority 11: Documentation (12 hours)

**11.1 Root README.md**
```markdown
# GraphiQuestor

Institutional-grade macro intelligence terminal.

## Quick Start
1. `cp .env.example .env && $EDITOR .env`
2. `npm install`
3. `npm run dev`
4. Open http://localhost:5173

## Architecture
[High-level diagram]

## Data Ingestion
Supabase Edge Functions run on pg_cron schedule.

## Testing
`npm test` - Vitest + Testing Library

## Deployment
Vercel frontend + Supabase edge functions. See docs/deployment.md.

## Contributing
[Code style, PR process, etc.]
```

**11.2 ADRs**
```
docs/adr/
  001-use-mui-over-tailwind.md
  002-why-react-query.md
  003-terminal-design-system.md
  004-shared-types-approach.md
```

**11.3 API Documentation**
```markdown
# Edge Functions API

## ingest-daily
Trigger: pg_cron daily at 06:00 UTC
Auth: Bearer ${INGEST_SHARED_SECRET}
Idempotent: Yes (upserts)
```

---

## 📈 Success Metrics

### Week 2 Targets
- [ ] All Edge Functions secured with shared secret
- [ ] Sentry capturing errors in production
- [ ] Environment validation preventing misconfiguration
- [ ] 100% cursor-pointer on interactive elements
- [ ] Focus states visible on all controls
- [ ] Color contrast ≥ 4.5:1 for all text
- [ ] ARIA labels on all icon buttons
- [ ] Skip-to-content link working

### Week 4 Targets
- [ ] bundle < 600KB (from ~850KB)
- [ ] LCP < 1.5s
- [ ] Basic unit tests (30% coverage)
- [ ] MUI components reduced by 50%
- [ ] CI/CD pipeline operational
- [ ] No `any` types in new code (enforced by CI)

### Month 3 Targets
- [ ] MUI completely removed
- [ ] Test coverage ≥ 70%
- [ ] All pages WCAG AA compliant (axe score 0)
- [ ] Zero critical lighthouse errors
- [ ] Bundle < 500KB
- [ ] Production error rate < 0.1%
- [ ] Documentation complete (README, ADRs, API docs)

---

## 📊 Estimated Effort & Prioritization

| Task | Hours | Priority | Dependencies |
|------|-------|----------|--------------|
| **Security hardening** | 8 | 🔴 Critical | None |
| **Sentry setup** | 2 | 🔴 Critical | None |
| **Env validation** | 0.5 | 🔴 Critical | None |
| **A11y quick wins** | 3 | 🔴 Critical | None |
| **Error handling** | 4 | 🔴 Critical | Retry utility |
| **Type safety fixes** | 8 | 🟡 High | None |
| **Performance optimization** | 12 | 🟡 High | Bundle analysis |
| **MUI→Radix migration** | 40 | 🟡 High | Radix setup |
| **Testing infrastructure** | 40 | 🟢 Medium | MUI refactor? |
| **CI/CD pipeline** | 8 | 🟢 Medium | Testing |
| **Documentation** | 12 | 🟢 Medium | None |
| **Advanced UX polish** | 20 | 🟢 Low | All above |

**Total:** ~157 hours (4 weeks with 2 engineers, or 8 weeks solo)

---

## 🎯 Recommended Team Allocation

**Scenario A: 2 Engineers (4 weeks)**
- Engineer 1: Security + Type Safety + Backend/Edge Functions (60h)
- Engineer 2: MUI Migration + Performance + Accessibility (60h)
- Shared: Documentation, testing, code review (20h)

**Scenario B: 1 Engineer (8 weeks)**
- Weeks 1-2: Critical fixes (security, error handling, a11y)
- Weeks 3-4: Type safety + performance
- Weeks 5-6: MUI→Radix migration Phase 1
- Weeks 7-8: MUI→Radix migration Phase 2 + testing setup

---

## 💡 Immediate Next Steps (Today)

1. **Clone fresh repo, create feature branch:**
```bash
git checkout -b chore/security-and-a11y-hardening
```

2. **Add env validation & .env.example** (30 min)
3. **Fix Edge Function auth** (1 hour)
4. **Add Sentry** (1 hour)
5. **Install axios-zod for validation** (30 min)
6. **Run accessibility audit:**
```bash
npm install -D @axe-core/react
# Add to smoke test, run, fix violations
```

7. **Add z-index scale to tailwind** (15 min)
8. **Fix contrast (text-gray-400 → text-gray-300)** (5 min)
9. **Add skip-to-content link** (10 min)
10. **Add cursor-pointer to all interactive cards** (20 min)

**Total today: ~4-5 hours of critical fixes**

Commit as: `chore: security and a11y hardening - critical fixes`

---

## 📞 Questions to Stakeholder

1. **MUI migration decision:** Approved? (40h effort, 400KB savings)
2. **Testing requirement:** Must reach 80% coverage? (Impacts timeline)
3. **CI/CD platform:** GitHub Actions, GitLab CI, or something else?
4. **Error tracking budget:** Sentry free tier OK or need enterprise?
5. **Accessibility compliance:** WCAG AA minimum or striving for AAA?

---

## 📚 Reference Documents

1. **ELITE_CODE_AUDIT_REPORT.md** - Full code review with backend/frontend analysis
2. **UI_UX_AUDIT_REPORT.md** - Design system recommendations, accessibility, UX patterns
3. **PRELAUNCH_CHECKLIST.md** (if exists) - Deployment readiness
4. **DEPLOYMENT_READINESS.md** (if exists) - Ops checklist

---

## 🎖️ Closing Note

Your codebase is **unusually strong** in data architecture and ingestion pipelines. The main gaps are **frontend polish, testing, and DevOps maturity**.

With focused effort (150-200 hours), you'll have:
- ✅ Enterprise-grade security
- ✅ Institutional-appropriate UX
- ✅ 60% faster load times
- ✅ WCAG AA compliance
- ✅ Automated testing & deployment
- ✅ Professional-grade codebase ready for funding round

**Start with the critical fixes list above. Complete within 2 weeks. Then proceed to MUI migration.**

You're 80% there. The last 20% is polish and hardening.

---

*Audit completed: April 1, 2026*  
*Next review: After critical fixes implemented*
