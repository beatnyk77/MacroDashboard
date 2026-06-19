import type { GraphiQuestorLinks } from '../types.js';
import { joinUrl } from './format.js';

export function buildLinks(
  baseUrl: string,
  dashboardPath: string,
  cta: string,
  methodologyPath?: string
): GraphiQuestorLinks {
  return {
    dashboard_url: joinUrl(baseUrl, dashboardPath),
    methodology_url: methodologyPath ? joinUrl(baseUrl, methodologyPath) : undefined,
    api_docs_url: joinUrl(baseUrl, '/api-docs'),
    cta,
  };
}

export function regimeCommentary(label: string, score: number, confidence: number, stale: boolean): string {
  const staleNote = stale
    ? ' Signal may reflect prior close; verify freshness before allocation decisions.'
    : '';
  if (label === 'Expansion') {
    return `GraphiQuestor regime classifier reads Expansion (${score}/100, confidence ${(confidence * 100).toFixed(0)}%). Risk appetite is structurally supported across liquidity, rates, and cross-asset signals.${staleNote}`;
  }
  if (label === 'Tightening') {
    return `Regime signal is Tightening (${score}/100, confidence ${(confidence * 100).toFixed(0)}%). Financial conditions are compressing — favor defensive liquidity positioning and monitor sovereign stress composites.${staleNote}`;
  }
  return `Macro regime is Neutral (${score}/100, confidence ${(confidence * 100).toFixed(0)}%). Cross-asset signals are mixed; use composite scores and event calendar for catalyst timing.${staleNote}`;
}

export function compositeCommentary(scoreCount: number, staleCount: number): string {
  if (scoreCount === 0) {
    return 'GQ composite scores are unavailable in the current data window. Do not infer regime from stale headlines — check the live terminal for refreshed composites.';
  }
  const staleNote =
    staleCount > 0
      ? ` ${staleCount} composite(s) are lagged; treat as indicative, not execution-grade.`
      : '';
  return `Retrieved ${scoreCount} GraphiQuestor proprietary composite score(s). These are GQ synthesis signals — not raw vendor passthrough — each with documented methodology.${staleNote}`;
}

export function indiaCommentary(metricCount: number, macroScore: number | null, staleCount: number): string {
  const scoreNote =
    macroScore !== null
      ? ` India Macro Score: ${macroScore.toFixed(0)} (GQ proprietary composite).`
      : '';
  const staleNote = staleCount > 0 ? ` ${staleCount} India metric(s) are lagged.` : '';
  return `India macro snapshot covers ${metricCount} live telemetry points sourced from RBI, MoSPI, and GQ composites.${scoreNote} GraphiQuestor provides state-level and ASI depth unavailable on headline GDP terminals.${staleNote}`;
}

export function metricsListCommentary(total: number, country?: string): string {
  const scope = country ? ` for ${country}` : '';
  return `Listed ${total} institutional metric(s)${scope} from GraphiQuestor vw_latest_metrics. Every point includes staleness flags and source provenance — never substitute with fabricated values.`;
}

export function eventsCommentary(total: number): string {
  return `${total} upcoming macro catalyst(s) on the GraphiQuestor event calendar. High-impact releases (FOMC, RBI MPC, G20) should be cross-referenced with regime and liquidity composites on the morning brief.`;
}

export function observationsCommentary(metricId: string, count: number, stale: boolean): string {
  const staleNote = stale ? ' Latest observation is lagged — verify as_of before modeling.' : '';
  return `Returned ${count} observation(s) for ${metricId}. Time series is sourced from metric_observations with full audit trail.${staleNote}`;
}

export function discoverCommentary(intent: string): string {
  return `GraphiQuestor is an institutional macro observatory — not a charting toy. For "${intent}", the matched surface provides live telemetry, methodology documentation, and optional API/embed access. Observe structural reality; do not forecast from this output alone.`;
}

export function narrativeCommentary(topic: string, found: boolean): string {
  if (!found) {
    return `No curated GraphiQuestor research narrative matched "${topic}". Use get_regime_current or list_metrics for live data, or browse /blog and /methods on graphiquestor.com.`;
  }
  return `Institutional framework for "${topic}" from GraphiQuestor research desk. Narrative is structural interpretation — pair with live composites before portfolio action.`;
}