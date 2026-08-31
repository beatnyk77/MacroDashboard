/**
 * Shared SEO meta templates — unique per surface so prerender never falls
 * back to the sitewide homepage blurb.
 */

const BRAND = 'GraphiQuestor';

export function apiDocsMeta(): { title: string; description: string } {
  return {
    title: `Macro Data REST API Docs | ${BRAND}`,
    description: `REST API reference for ${BRAND}: 270+ institutional macro metrics, time-series history, regime signals, and composites for quant and agent integrations.`,
  };
}

export function mcpMeta(): { title: string; description: string } {
  return {
    title: `MCP Macro Intelligence Server | ${BRAND}`,
    description: `Model Context Protocol server for AI agents: typed macro tools, institutional commentary, and dashboard deep links. Install via Smithery for Cursor and Claude.`,
  };
}

export function forResearchersMeta(): { title: string; description: string } {
  return {
    title: `For Researchers & LLM Citation | ${BRAND}`,
    description: `Citation guidelines, structured summaries, and deep-link inventory for institutional researchers and LLMs using ${BRAND} macro intelligence.`,
  };
}

export function apiAccessMeta(): { title: string; description: string } {
  return {
    title: `API Access & Keys | ${BRAND}`,
    description: `Request institutional API access to ${BRAND} macro metrics, regime signals, and composites. Built for desks, quant teams, and automated agents.`,
  };
}

export function metricPrimaryMeta(label: string, slug: string): {
  title: string;
  description: string;
} {
  return {
    title: `${label} — Live Data & Definition | ${BRAND}`,
    description: `Live ${label} reading, definition, and formula on ${BRAND}. Primary terminal page for the ${slug} composite — methodology and sources linked.`,
  };
}

export function metricSnapshotMeta(label: string, slug: string, dateStr: string): {
  title: string;
  description: string;
} {
  return {
    title: `${label} Snapshot (${dateStr}) | ${BRAND}`,
    description: `Historical snapshot for ${label} recorded on ${dateStr}. Immutable authority record for ${slug} on ${BRAND}.`,
  };
}

export function methodSpokeMeta(label: string): { title: string; description: string } {
  return {
    title: `${label} Methodology | ${BRAND}`,
    description: `How ${BRAND} calculates ${label}: formula, inputs, refresh cadence, and data sources. Links to the live metric terminal page.`,
  };
}

export function glossarySpokeMeta(term: string): { title: string; description: string } {
  return {
    title: `${term} Definition | ${BRAND} Glossary`,
    description: `What is ${term}? Institutional definition and context from ${BRAND}. Jump to live data and full methodology from this glossary entry.`,
  };
}
