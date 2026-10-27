import React, { useEffect, useMemo, useState } from 'react';
import { TrailLink as Link } from '@/components/TrailLink';
import { SEOManager } from '@/components/SEOManager';
import { Search, ExternalLink, CheckCircle2, Circle, FileText, Bot, Map } from 'lucide-react';
import snapshotJson from '@/data/terminal-snapshot.json';
import type { TerminalSnapshot } from '@/features/dashboard/components/TerminalSnapshotStrip';
import { CHART_COLORS } from '@/constants/chartDefaults';

const BLOOMBERG_ORANGE = CHART_COLORS.gold;

const GSC_BASE = 'https://search.google.com/search-console';
const MONEY_URLS = [
  'https://graphiquestor.com/api-docs/',
  'https://graphiquestor.com/mcp/',
  'https://graphiquestor.com/for-researchers/',
  'https://graphiquestor.com/api-access/',
  'https://graphiquestor.com/',
];

const CHECKLIST = [
  { id: 'cf-robots', label: 'Cloudflare AI crawl policy matches answer-yes / train-no', href: '/docs/ops/cloudflare-ai-crawlers.md' },
  { id: 'sitemap', label: 'GSC sitemap submitted: https://graphiquestor.com/sitemap.xml', href: GSC_BASE },
  { id: 'money-index', label: 'Request indexing for API/MCP/researchers/api-access', href: GSC_BASE },
  { id: 'noindex', label: 'Verify grit-index / india-equities / regime-scoring stay out of sitemap', href: 'https://graphiquestor.com/sitemap.xml' },
  { id: 'briefs', label: 'Weekday deep briefs only (no weekend generation)', href: '/macro-brief/archive/' },
  { id: 'snapshot', label: 'Homepage key telemetry strip present after Netlify deploy', href: '/' },
];

const AdminLogin = ({ onOk }: { onOk: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const tryLogin = () => {
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD;
    if (adminPass && password === adminPass) {
      sessionStorage.setItem('admin_auth', 'true');
      onOk();
    } else setError(true);
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card/90 p-8 text-center">
        <Search className="mx-auto mb-4 text-amber-400" size={36} />
        <h1 className="mb-1 text-lg font-bold text-white">SEO OPS CONSOLE</h1>
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">Admin access</p>
        {!import.meta.env.VITE_ADMIN_PASSWORD && (
          <p className="mb-3 text-xs text-rose-400">Admin access is not configured.</p>
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && tryLogin()}
          placeholder="Access code"
          className="mb-3 w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm text-white"
        />
        {error && <p className="mb-2 text-xs text-rose-400">Invalid credentials</p>}
        <button
          type="button"
          onClick={tryLogin}
          className="w-full rounded-lg bg-amber-500 py-2 text-xs font-semibold uppercase tracking-wider text-black"
        >
          Open console
        </button>
      </div>
    </div>
  );
};

export const AdminSeoPage: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_auth') === 'true');
  const [sitemapCount, setSitemapCount] = useState<number | null>(null);
  const [robotsHasProduct, setRobotsHasProduct] = useState<boolean | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('seo_ops_checklist') || '{}');
    } catch {
      return {};
    }
  });

  const snapshot = snapshotJson as TerminalSnapshot;

  useEffect(() => {
    sessionStorage.setItem('seo_ops_checklist', JSON.stringify(checked));
  }, [checked]);

  useEffect(() => {
    if (!authed) return;
    fetch('/sitemap.xml')
      .then((r) => r.text())
      .then((xml) => {
        const locs = xml.match(/<loc>/g);
        setSitemapCount(locs?.length ?? 0);
      })
      .catch(() => setSitemapCount(null));
    fetch('/robots.txt')
      .then((r) => r.text())
      .then((t) => setRobotsHasProduct(t.includes('answer engines yes') || t.includes('Product lock')))
      .catch(() => setRobotsHasProduct(null));
  }, [authed]);

  const moneyInspectLinks = useMemo(
    () =>
      MONEY_URLS.map((u) => ({
        url: u,
        gsc: `${GSC_BASE}?resource_id=sc-domain:graphiquestor.com&page=${encodeURIComponent(u)}`,
      })),
    []
  );

  if (!authed) {
    return (
      <>
        <SEOManager title="SEO Ops | Admin" robots="noindex, nofollow" description="Internal SEO ops console." />
        <AdminLogin onOk={() => setAuthed(true)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-white sm:px-8">
      <SEOManager title="SEO Ops Console | Admin" robots="noindex, nofollow" description="Internal SEO ops." />

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: BLOOMBERG_ORANGE }}>
            GraphiQuestor · Ops
          </p>
          <h1 className="text-2xl font-bold tracking-tight">SEO Ops Console</h1>
          <p className="mt-1 max-w-xl text-sm text-terminal-dim">
            Build artifacts, robots/sitemap health, and GSC checklist. North star: API / MCP developer leads.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/" className="rounded-lg border border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/60 hover:text-white">
            Health monitor
          </Link>
          <a
            href={GSC_BASE}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-black"
          >
            Open GSC <ExternalLink size={12} />
          </a>
        </div>
      </header>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">
            <Map size={14} /> Sitemap
          </div>
          <div className="text-3xl font-bold tabular-nums">{sitemapCount ?? '—'}</div>
          <p className="mt-1 text-[11px] text-terminal-dim">URLs in sitemap.xml</p>
        </div>
        <div className="rounded-xl border border-border bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">
            <Bot size={14} /> Robots policy
          </div>
          <div className="text-lg font-bold">
            {robotsHasProduct === null ? '…' : robotsHasProduct ? 'Product lock live' : 'Check deploy'}
          </div>
          <p className="mt-1 text-[11px] text-terminal-dim">Answer engines yes · training no</p>
        </div>
        <div className="rounded-xl border border-border bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">
            <FileText size={14} /> Terminal snapshot
          </div>
          <div className="text-lg font-bold">
            {snapshot.available ? `${snapshot.metrics?.length ?? 0} metrics` : 'Unavailable at build'}
          </div>
          <p className="mt-1 text-[11px] text-terminal-dim">
            {snapshot.generatedAt?.slice(0, 19) || '—'} · {snapshot.source}
          </p>
        </div>
      </div>

      <section className="mb-10 rounded-xl border border-border bg-white/[0.02] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">Ops checklist</h2>
        <ul className="space-y-2">
          {CHECKLIST.map((item) => {
            const on = !!checked[item.id];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setChecked((c) => ({ ...c, [item.id]: !c[item.id] }))}
                  className="flex w-full items-start gap-3 rounded-lg border border-border bg-background/20 px-3 py-2.5 text-left hover:border-white/15"
                >
                  {on ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle size={18} className="mt-0.5 shrink-0 text-terminal-dim" />
                  )}
                  <span className={`text-sm ${on ? 'text-white/50 line-through' : 'text-white/80'}`}>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">Money URLs — inspect / re-index</h2>
        <ul className="space-y-2">
          {moneyInspectLinks.map((row) => (
            <li
              key={row.url}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/20 px-3 py-2 text-[12px]"
            >
              <a href={row.url} className="font-mono text-blue-400 hover:underline" target="_blank" rel="noreferrer">
                {row.url}
              </a>
              <a
                href={row.gsc}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400/90"
              >
                GSC inspect <ExternalLink size={11} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-white/[0.02] p-5 text-[12px] text-white/50">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/70">Build artifacts</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>
            Snapshot file: <code className="text-white/70">src/data/terminal-snapshot.json</code> (also{' '}
            <code className="text-white/70">public/data/</code>)
          </li>
          <li>
            Generate: <code className="text-white/70">npm run generate-terminal-snapshot</code>
          </li>
          <li>
            Validate SEO: <code className="text-white/70">npm run validate-seo</code> (post-prerender)
          </li>
          <li>
            CF ops doc: <code className="text-white/70">docs/ops/cloudflare-ai-crawlers.md</code>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default AdminSeoPage;
