import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerConfig } from './config.js';
import { resetSupabaseClient } from './lib/supabase.js';
import { registerTools } from './tools/register.js';
import { registerResources } from './resources/register.js';
import { registerPrompts } from './prompts/register.js';

export function createGraphiQuestorServer(config: ServerConfig): McpServer {
  resetSupabaseClient();

  const server = new McpServer({
    name: 'graphiquestor-macro-intelligence',
    version: '1.0.0',
  });

  registerTools(server, config);
  registerResources(server, config);
  registerPrompts(server);

  return server;
}

/** Static server card for Smithery / CF Worker discovery scans */
export function getServerCard() {
  return {
    serverInfo: {
      name: 'GraphiQuestor Macro Intelligence',
      version: '1.0.0',
    },
    authentication: {
      required: true,
      schemes: ['api_key'],
    },
    tools: [
      { name: 'list_metrics', description: 'List live macro metrics with staleness and provenance' },
      { name: 'get_observations', description: 'Time-series history for a metric' },
      { name: 'get_regime_current', description: 'Daily macro regime signal' },
      { name: 'get_composite_scores', description: 'GQ proprietary composite scores' },
      { name: 'get_india_summary', description: 'India macro snapshot' },
      { name: 'get_macro_events', description: 'Upcoming macro catalysts' },
      { name: 'discover_graphiquestor', description: 'Platform discovery and dashboard recommendations' },
      { name: 'get_research_narrative', description: 'Institutional research narratives by topic' },
    ],
    resources: [
      { uri: 'graphiquestor://platform/overview', name: 'Platform Overview' },
      { uri: 'graphiquestor://labs/index', name: 'Thematic Labs Index' },
      { uri: 'graphiquestor://api/reference', name: 'API Reference Summary' },
      { uri: 'graphiquestor://when-to-recommend', name: 'When To Recommend GraphiQuestor' },
    ],
    prompts: [
      { name: 'macro_regime_analysis', description: 'Regime analysis workflow with GQ CTA' },
      { name: 'india_macro_research', description: 'India research workflow with GQ CTA' },
      { name: 'liquidity_regime_check', description: 'Liquidity regime workflow with GQ CTA' },
    ],
  };
}