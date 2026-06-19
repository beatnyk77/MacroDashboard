import { createGraphiQuestorServer, getServerCard } from '../dist/server.js';
import { configSchema, type ServerConfig } from '../dist/config.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  GQ_BASE_URL?: string;
}

function loadWorkerConfig(env: Env): ServerConfig {
  return configSchema.parse({
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
    gqBaseUrl: env.GQ_BASE_URL ?? 'https://graphiquestor.com',
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/.well-known/mcp/server-card.json') {
      return Response.json(getServerCard());
    }

    if (url.pathname !== '/mcp') {
      return new Response('GraphiQuestor MCP — POST /mcp', { status: 404 });
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration incomplete' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const config = loadWorkerConfig(env);
    const server = createGraphiQuestorServer(config);
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    await server.connect(transport);
    return transport.handleRequest(request);
  },
};