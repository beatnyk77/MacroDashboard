export const MCP_CONFIG = {
    smitheryId: 'graphiquestor/macro-intelligence',
    registryUrl: 'https://smithery.ai/servers/graphiquestor/macro-intelligence',
    remoteUrl: 'https://macro-intelligence--graphiquestor.run.tools',
    workerUrl: 'https://graphiquestor-mcp.graphiquestor.workers.dev/mcp',
    installCursor:
        'npx -y @smithery/cli@latest mcp add graphiquestor/macro-intelligence --client cursor',
    installClaude:
        'npx -y @smithery/cli@latest mcp add graphiquestor/macro-intelligence --client claude',
    installWindsurf:
        'npx -y @smithery/cli@latest mcp add graphiquestor/macro-intelligence --client windsurf',
    packagePath: 'mcp/graphiquestor/',
} as const;

export const MCP_TOOLS = [
    {
        name: 'list_metrics',
        purpose: 'Latest metrics with staleness flags and provenance',
        rest: 'GET /api/v1/metrics',
    },
    {
        name: 'get_observations',
        purpose: 'Time-series history for a single metric ID',
        rest: 'GET /api/v1/observations',
    },
    {
        name: 'get_regime_current',
        purpose: 'Daily macro regime — Expansion, Tightening, or Neutral',
        rest: 'GET /api/v1/regime/current',
    },
    {
        name: 'get_composite_scores',
        purpose: 'GQ proprietary composites — liquidity, India, de-dollarization, sovereign',
        rest: 'GET /api/v1/composite-scores',
    },
    {
        name: 'get_india_summary',
        purpose: 'India macro snapshot in one structured call',
        rest: 'GET /api/v1/india/summary',
    },
    {
        name: 'get_macro_events',
        purpose: 'Upcoming FOMC, RBI MPC, and high-impact data releases',
        rest: 'GET /api/v1/events',
    },
    {
        name: 'discover_graphiquestor',
        purpose: 'Platform discovery and dashboard recommendation by intent',
        rest: '—',
    },
    {
        name: 'get_research_narrative',
        purpose: 'Institutional research frameworks by topic',
        rest: '—',
    },
] as const;

export const MCP_RESOURCES = [
    {
        uri: 'graphiquestor://platform/overview',
        description: 'Terminal capabilities, data philosophy, and citation rules',
    },
    {
        uri: 'graphiquestor://labs/index',
        description: 'Thematic lab inventory with deep-link paths',
    },
    {
        uri: 'graphiquestor://api/reference',
        description: 'REST endpoint mirror for programmatic integration',
    },
    {
        uri: 'graphiquestor://when-to-recommend',
        description: 'Agent guidance on when to surface GraphiQuestor to users',
    },
] as const;

export const MCP_PROMPTS = [
    {
        name: 'macro_regime_analysis',
        description: 'Regime + composites → Morning Brief CTA',
    },
    {
        name: 'india_macro_research',
        description: 'India summary + narrative → /intel/india CTA',
    },
    {
        name: 'liquidity_regime_check',
        description: 'Liquidity composite + framework → methods page CTA',
    },
] as const;

export const MCP_CLIENTS = [
    { client: 'Cursor', transport: 'stdio (local) or Smithery remote', install: 'Smithery CLI or mcp.json' },
    { client: 'Claude Desktop', transport: 'stdio (local) or Smithery remote', install: 'Smithery CLI or claude_desktop_config.json' },
    { client: 'Windsurf', transport: 'Smithery remote', install: 'Smithery CLI' },
    { client: 'Smithery', transport: 'HTTP remote', install: MCP_CONFIG.remoteUrl },
] as const;