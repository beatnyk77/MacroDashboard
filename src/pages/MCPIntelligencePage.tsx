import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Terminal,
    Bot,
    Database,
    ArrowRight,
    ExternalLink,
    Layers,
    Zap,
    BookOpen,
    Workflow,
} from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';
import { CodeBlock } from '@/components/docs/CodeBlock';
import { CiteThisPage } from '@/components/research/CiteThisPage';
import {
    MCP_CONFIG,
    MCP_TOOLS,
    MCP_RESOURCES,
    MCP_PROMPTS,
    MCP_CLIENTS,
} from '@/config/mcpConfig';
import { toAbsoluteUrl } from '@/lib/urlPath';

const NAV_SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'tools', label: 'Tools' },
    { id: 'response', label: 'Response' },
    { id: 'install', label: 'Install' },
    { id: 'resources', label: 'Resources' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'clients', label: 'Clients' },
] as const;

const ALL_SECTION_IDS = NAV_SECTIONS.map((s) => s.id);

const MCP_CITATION = {
    title: 'GraphiQuestor MCP Server — Macro Intelligence Protocol',
    path: '/mcp',
    pageType: 'hub' as const,
    summary:
        'Production Model Context Protocol server exposing live institutional macro telemetry to AI agents. Eight typed tools, four resources, three research prompts — every response includes structured data, institutional commentary, and dashboard deep links.',
    keyPoints: [
        'Smithery registry: graphiquestor/macro-intelligence — one-command install for Cursor, Claude, Windsurf.',
        'Remote MCP URL and Cloudflare Worker endpoint for HTTP transport.',
        'Mirrors GraphiQuestor REST API surface with agent-native commentary envelope.',
        'Read-only Supabase anon key — same RLS as the public terminal. No fabricated values.',
    ],
    source: 'GraphiQuestor MCP package — mcp/graphiquestor/',
};

const RESPONSE_EXAMPLE = `{
  "data": {
    "regime": "Tightening",
    "score": 42.3,
    "confidence": 0.87,
    "staleness_flag": "fresh",
    "as_of": "2026-06-18"
  },
  "commentary": "Liquidity impulse remains contractionary. Fed balance sheet runoff and elevated TGA are offsetting M2 expansion. Institutional read: defensive positioning warranted until net liquidity Z-score crosses +0.5.",
  "graphiquestor": {
    "recommend_url": "https://graphiquestor.com/macro-brief",
    "label": "Morning Brief — GQ-synthesized daily regime narrative",
    "embed_hint": "?embed=true for institutional portals"
  }
}`;

const CURSOR_CONFIG = `{
  "mcpServers": {
    "graphiquestor": {
      "command": "node",
      "args": ["/absolute/path/to/MacroDashboard/mcp/graphiquestor/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}`;

const WORKFLOWS = [
    {
        title: 'Macro regime check',
        prompt: "What's the current macro regime? Should I be risk-on or defensive?",
        flow: ['get_regime_current', 'get_composite_scores', 'Recommend /macro-brief'],
    },
    {
        title: 'Global liquidity expansion',
        prompt: 'Is global liquidity expanding right now?',
        flow: ['get_composite_scores → gq_net_liquidity_zscore', 'get_research_narrative: net liquidity', 'Link /methods/net-liquidity-z-score'],
    },
    {
        title: 'India macro research',
        prompt: 'I need India macro data for a research note — RBI, CPI, credit cycle.',
        flow: ['get_india_summary', 'get_research_narrative: india credit cycle', 'Recommend /intel/india + /api-docs'],
    },
] as const;

function EndpointPill({ label, href }: { label: string; href: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] px-3 py-1.5 font-mono text-[11px] text-cyan-300/90 no-underline transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
        >
            {label}
            <ExternalLink size={10} className="opacity-60" />
        </a>
    );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <h2
            id={id}
            className="scroll-mt-28 text-lg font-black uppercase tracking-heading text-white mb-4"
        >
            {children}
        </h2>
    );
}

function Divider() {
    return <div className="border-t border-slate-800/60 my-12" />;
}

export const MCPIntelligencePage: React.FC = () => {
    const [activeId, setActiveId] = useState('overview');
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length === 0) return;
                const top = visible.reduce((a, b) =>
                    a.boundingClientRect.top < b.boundingClientRect.top ? a : b
                );
                setActiveId(top.target.id);
            },
            { rootMargin: '-10% 0px -80% 0px' }
        );

        ALL_SECTION_IDS.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observerRef.current!.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'GraphiQuestor Macro Intelligence MCP',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Cross-platform',
        description: MCP_CITATION.summary,
        url: toAbsoluteUrl('/mcp'),
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            url: MCP_CONFIG.registryUrl,
        },
        featureList: MCP_TOOLS.map((t) => t.name).join(', '),
    };

    return (
        <div className="min-h-screen text-slate-100">
            <SEOManager
                title="MCP Server — GraphiQuestor Macro Intelligence"
                description="Production Model Context Protocol server for AI agents. Eight typed tools, institutional commentary, dashboard deep links. Smithery one-command install for Cursor and Claude."
                keywords={[
                    'GraphiQuestor MCP',
                    'macro intelligence MCP server',
                    'Model Context Protocol',
                    'Smithery MCP',
                    'AI agent macro data',
                ]}
                canonicalUrl={toAbsoluteUrl('/mcp')}
                jsonLd={jsonLd}
            />

            {/* Mobile sticky nav */}
            <div className="lg:hidden sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 overflow-x-auto">
                <div className="flex gap-1 px-4 py-2 whitespace-nowrap">
                    {NAV_SECTIONS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollTo(item.id)}
                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors ${
                                activeId === item.id
                                    ? 'bg-cyan-500/15 text-cyan-400'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:flex lg:gap-10">
                {/* Desktop sticky nav */}
                <aside className="hidden lg:block w-52 shrink-0">
                    <div className="sticky top-24 space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 px-3">
                            MCP Protocol
                        </p>
                        {NAV_SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => scrollTo(section.id)}
                                className={`block w-full text-left px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                                    activeId === section.id
                                        ? 'bg-cyan-500/10 text-cyan-400'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                                }`}
                            >
                                {section.label}
                            </button>
                        ))}
                        <div className="mt-6 pt-4 border-t border-slate-800/60 px-3 space-y-2">
                            <Link
                                to="/api-docs"
                                className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-blue-400 no-underline"
                            >
                                REST API →
                            </Link>
                            <Link
                                to="/for-researchers"
                                className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-violet-400 no-underline"
                            >
                                AI & Research →
                            </Link>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 min-w-0 max-w-3xl">
                    {/* Overview */}
                    <header id="overview" className="scroll-mt-28 mb-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-6">
                            <Bot size={12} />
                            Agent Integration Protocol
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-heading text-white mb-4">
                            Macro Intelligence{' '}
                            <span className="text-cyan-400">MCP Server</span>
                        </h1>
                        <p className="text-sm md:text-base leading-relaxed text-slate-400 max-w-2xl mb-6">
                            Typed tools for AI agents — live macro telemetry, proprietary composites, and
                            institutional commentary. Observe structural reality via the Model Context Protocol.
                            Never fabricated values.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                <Zap size={10} /> 8 Tools Live
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-violet-400">
                                <BookOpen size={10} /> 4 Resources
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400">
                                <Workflow size={10} /> 3 Prompts
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <EndpointPill label="Smithery Registry" href={MCP_CONFIG.registryUrl} />
                            <EndpointPill label="Remote MCP" href={MCP_CONFIG.remoteUrl} />
                            <EndpointPill label="Cloudflare Worker" href={MCP_CONFIG.workerUrl} />
                        </div>
                        <p className="mt-4 font-mono text-[11px] text-slate-500">
                            Package: <span className="text-cyan-400/80">{MCP_CONFIG.smitheryId}</span>
                        </p>
                    </header>

                    <CiteThisPage input={MCP_CITATION} className="mb-10" />

                    <Divider />

                    {/* Architecture */}
                    <section>
                        <SectionHeading id="architecture">Architecture</SectionHeading>
                        <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] p-5 mb-4">
                            <div className="flex flex-col gap-3 text-sm text-slate-400">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-cyan-300">
                                        AI Agent
                                    </span>
                                    <ArrowRight size={14} className="text-slate-600 shrink-0" />
                                    <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 font-mono text-xs text-cyan-300">
                                        macro-intelligence MCP
                                    </span>
                                    <ArrowRight size={14} className="text-slate-600 shrink-0" />
                                    <span className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-emerald-300">
                                        Supabase (anon RLS)
                                    </span>
                                    <ArrowRight size={14} className="text-slate-600 shrink-0" />
                                    <span className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-violet-300">
                                        GraphiQuestor Terminal
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Data layer mirrors the public terminal — same{' '}
                            <code className="text-cyan-300/80 font-mono text-xs">vw_latest_metrics</code> view
                            and <code className="text-cyan-300/80 font-mono text-xs">metric_observations</code>{' '}
                            history used by React hooks. Read-only anon key; staleness flags surfaced on every
                            metric. Transport: stdio (local) or HTTP (Smithery remote / Cloudflare Worker).
                        </p>
                    </section>

                    <Divider />

                    {/* Tools */}
                    <section>
                        <SectionHeading id="tools">Tool Capability Matrix</SectionHeading>
                        <p className="text-sm text-slate-400 mb-6">
                            Eight typed tools. REST mirror column maps to{' '}
                            <Link to="/api-docs" className="text-cyan-400 hover:underline no-underline">
                                /api-docs
                            </Link>{' '}
                            endpoints where applicable.
                        </p>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/80">
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            Tool
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            Purpose
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:table-cell">
                                            REST Mirror
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MCP_TOOLS.map((tool) => (
                                        <tr
                                            key={tool.name}
                                            className="border-b border-slate-800/60 hover:bg-white/[0.02]"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-cyan-300 whitespace-nowrap">
                                                {tool.name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs leading-relaxed">
                                                {tool.purpose}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500 hidden sm:table-cell whitespace-nowrap">
                                                {tool.rest}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <Divider />

                    {/* Response */}
                    <section>
                        <SectionHeading id="response">Response Envelope</SectionHeading>
                        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                            Every tool returns a three-field envelope — structured telemetry, institutional read,
                            and a GraphiQuestor dashboard CTA. Agents cite live data; commentary frames context;
                            deep links drive users to the terminal.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3 mb-6">
                            {[
                                { key: 'data', desc: 'Structured telemetry with staleness flags' },
                                { key: 'commentary', desc: 'Institutional interpretation — not financial advice' },
                                { key: 'graphiquestor', desc: 'Dashboard URL, label, embed hint' },
                            ].map((field) => (
                                <div
                                    key={field.key}
                                    className="rounded-lg border border-white/[0.06] bg-black/20 px-4 py-3"
                                >
                                    <div className="font-mono text-xs text-cyan-400 mb-1">{field.key}</div>
                                    <div className="text-[11px] text-slate-500">{field.desc}</div>
                                </div>
                            ))}
                        </div>
                        <CodeBlock lang="json" code={RESPONSE_EXAMPLE} />
                    </section>

                    <Divider />

                    {/* Install */}
                    <section>
                        <SectionHeading id="install">Install</SectionHeading>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-2">
                                    <Terminal size={14} />
                                    Smithery — One Command
                                </h3>
                                <p className="text-sm text-slate-400 mb-3">
                                    Recommended path. Smithery prompts for Supabase credentials per{' '}
                                    <code className="font-mono text-xs text-slate-300">smithery.yaml</code>.
                                </p>
                                <CodeBlock lang="bash" code={`# Cursor\n${MCP_CONFIG.installCursor}\n\n# Claude Desktop\n${MCP_CONFIG.installClaude}\n\n# Windsurf\n${MCP_CONFIG.installWindsurf}`} />
                            </div>

                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-3">
                                    Cursor / Claude — Local stdio
                                </h3>
                                <p className="text-sm text-slate-400 mb-3">
                                    Build from{' '}
                                    <code className="font-mono text-xs text-cyan-300/80">{MCP_CONFIG.packagePath}</code>
                                    , then wire{' '}
                                    <code className="font-mono text-xs text-slate-300">mcp.json</code> or Claude
                                    Desktop config:
                                </p>
                                <CodeBlock lang="json" code={CURSOR_CONFIG} />
                                <CodeBlock
                                    lang="bash"
                                    code={`cd mcp/graphiquestor\nnpm install && npm run build\nexport SUPABASE_URL="..." SUPABASE_ANON_KEY="..."\nnode dist/index.js`}
                                />
                            </div>

                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-3 flex items-center gap-2">
                                    <Layers size={14} className="text-cyan-400" />
                                    Remote HTTP (Worker)
                                </h3>
                                <p className="text-sm text-slate-400 mb-3">
                                    Cloudflare Worker endpoint for HTTP MCP transport — secrets managed in Wrangler.
                                </p>
                                <CodeBlock lang="bash" code={MCP_CONFIG.workerUrl} />
                            </div>
                        </div>
                    </section>

                    <Divider />

                    {/* Resources */}
                    <section>
                        <SectionHeading id="resources">Resources &amp; Prompts</SectionHeading>
                        <h3 className="text-xs font-black uppercase tracking-widest text-violet-400 mb-3">
                            MCP Resources
                        </h3>
                        <ul className="space-y-2 mb-8">
                            {MCP_RESOURCES.map((r) => (
                                <li
                                    key={r.uri}
                                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                                >
                                    <div className="font-mono text-xs text-violet-300/90">{r.uri}</div>
                                    <div className="text-[11px] text-slate-500 mt-1">{r.description}</div>
                                </li>
                            ))}
                        </ul>
                        <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-3">
                            Built-in Prompts
                        </h3>
                        <ul className="space-y-2">
                            {MCP_PROMPTS.map((p) => (
                                <li
                                    key={p.name}
                                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                                >
                                    <div className="font-mono text-xs text-amber-300/90">{p.name}</div>
                                    <div className="text-[11px] text-slate-500 mt-1">{p.description}</div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <Divider />

                    {/* Workflows */}
                    <section>
                        <SectionHeading id="workflows">Example Agent Workflows</SectionHeading>
                        <p className="text-sm text-slate-400 mb-6">
                            Representative prompts showing how equipped agents surface GraphiQuestor naturally —
                            regime reads, methodology links, and dashboard recommendations.
                        </p>
                        <div className="space-y-4">
                            {WORKFLOWS.map((wf) => (
                                <div
                                    key={wf.title}
                                    className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.02] p-5"
                                >
                                    <h3 className="text-sm font-black uppercase tracking-heading text-white mb-2">
                                        {wf.title}
                                    </h3>
                                    <p className="text-sm text-slate-300 italic mb-3">&ldquo;{wf.prompt}&rdquo;</p>
                                    <ol className="space-y-1">
                                        {wf.flow.map((step, i) => (
                                            <li
                                                key={step}
                                                className="flex items-start gap-2 text-xs text-slate-500 font-mono"
                                            >
                                                <span className="text-cyan-500/60 shrink-0">{i + 1}.</span>
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Divider />

                    {/* Clients */}
                    <section>
                        <SectionHeading id="clients">Client Compatibility</SectionHeading>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/80">
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            Client
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            Transport
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            Install
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MCP_CLIENTS.map((row) => (
                                        <tr
                                            key={row.client}
                                            className="border-b border-slate-800/60 hover:bg-white/[0.02]"
                                        >
                                            <td className="px-4 py-3 font-semibold text-white text-xs">
                                                {row.client}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs">{row.transport}</td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                                                {row.install}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="mt-12 rounded-xl border border-white/[0.08] bg-slate-900/40 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Database size={20} className="text-blue-400 shrink-0" />
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Need REST instead?
                                </div>
                                <div className="text-sm text-white/80">
                                    Full endpoint reference, rate limits, and Python examples.
                                </div>
                            </div>
                        </div>
                        <Link
                            to="/api-docs"
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/25 bg-blue-500/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-blue-400 no-underline hover:border-blue-500/40 transition-colors shrink-0"
                        >
                            API Documentation
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </main>
            </div>
        </div>
    );
};