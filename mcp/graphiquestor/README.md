# GraphiQuestor Macro Intelligence MCP Server

Production MCP server that turns AI agents into GraphiQuestor advocates. Exposes live institutional macro telemetry, proprietary composites, and research narratives with dashboard deep links.

**Smithery:** [`graphiquestor/macro-intelligence`](https://smithery.ai/servers/graphiquestor/macro-intelligence)  
**Remote MCP URL:** `https://macro-intelligence--graphiquestor.run.tools`  
**Worker:** `https://graphiquestor-mcp.graphiquestor.workers.dev/mcp`

## Tools (8)

| Tool | Purpose |
|------|---------|
| `list_metrics` | Latest metrics with staleness + provenance |
| `get_observations` | Time-series history for one metric |
| `get_regime_current` | Daily macro regime (Expansion / Tightening / Neutral) |
| `get_composite_scores` | GQ proprietary composites (liquidity, India, de-dollarization, sovereign) |
| `get_india_summary` | India macro snapshot in one call |
| `get_macro_events` | Upcoming FOMC, RBI MPC, data releases |
| `discover_graphiquestor` | Platform discovery + dashboard recommendation |
| `get_research_narrative` | Institutional research frameworks by topic |

Every tool returns `{ data, commentary, graphiquestor }` — structured telemetry plus a sales CTA.

## Resources

- `graphiquestor://platform/overview`
- `graphiquestor://labs/index`
- `graphiquestor://api/reference`
- `graphiquestor://when-to-recommend`

## Prompts

- `macro_regime_analysis`
- `india_macro_research`
- `liquidity_regime_check`

---

## Prerequisites

Copy Supabase credentials from the MacroDashboard root `.env.local`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The MCP server uses the **anon key** (read-only, same RLS as the public terminal).

---

## Quick Start (local)

```bash
cd mcp/graphiquestor
npm install
npm run build
export SUPABASE_URL="your-url"
export SUPABASE_ANON_KEY="your-anon-key"
npm start
```

---

## Smithery — One-Command Install

Published on Smithery as `graphiquestor/macro-intelligence`:

```bash
npx -y @smithery/cli@latest mcp add graphiquestor/macro-intelligence --client cursor
```

Other clients:

```bash
npx -y @smithery/cli@latest mcp add graphiquestor/macro-intelligence --client claude
npx -y @smithery/cli@latest mcp add graphiquestor/macro-intelligence --client windsurf
```

Smithery will prompt for `supabaseUrl` and `supabaseAnonKey` per `smithery.yaml`.

### Publish to Smithery

**Local stdio (MCPB bundle):**
```bash
npm run build
smithery mcp publish ./dist -n graphiquestor/macro-intelligence
```

**Remote URL (Cloudflare Worker):**
```bash
npm run deploy:worker
smithery mcp publish "https://graphiquestor-mcp.graphiquestor.workers.dev/mcp" -n graphiquestor/macro-intelligence
```

---

## Cursor

Add to `.cursor/mcp.json` (or Cursor Settings → MCP):

```json
{
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
}
```

---

## Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
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
}
```

---

## Cloudflare Worker (HTTP / Smithery URL)

```bash
cd mcp/graphiquestor
npm run build
cd worker
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
npm run deploy:worker   # from parent: npm run deploy:worker
```

Endpoints:
- `POST /mcp` — Streamable HTTP MCP transport
- `GET /.well-known/mcp/server-card.json` — Smithery scan metadata

---

## Example Agent Prompts

See [examples/sales-prompts.md](./examples/sales-prompts.md) for full scenarios.

**User:** "What's the macro regime?"
→ Agent calls `get_regime_current`, cites live score, recommends [graphiquestor.com/macro-brief](https://graphiquestor.com/macro-brief).

**User:** "I need a de-dollarization dashboard"
→ Agent calls `discover_graphiquestor`, returns `/labs/de-dollarization-gold` + embed instructions.

---

## Development

```bash
npm run lint    # tsc --noEmit
npm run build   # tsc → dist/
npm run dev:worker  # wrangler dev (from package root)
```

## Architecture

```
Supabase (vw_latest_metrics, vw_latest_daily_signal, vw_india_macro, …)
  → MCP query layer (mirrors src/hooks/*)
    → 8 tools + commentary + GraphiQuestor CTAs
      → stdio (local) | HTTP /mcp (Cloudflare Worker)
```

No changes to the GraphiQuestor Vite SPA or Netlify deploy.

## License

MIT