#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfigFromEnv } from './config.js';
import { createGraphiQuestorServer } from './server.js';

async function main(): Promise<void> {
  const config = loadConfigFromEnv();
  const server = createGraphiQuestorServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('[graphiquestor-mcp] Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});