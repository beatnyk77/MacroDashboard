import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';
import { calculateCapexImpulse, calculateCashRunway, calculateWorkingCapitalDays } from '../_shared/corporateSignalMath.ts';

export type NormalizedEvidence = { id: string; issuerId: string; kind: string; payload: Record<string, unknown>; observedAt: string; sourceUrl: string };
export type SignalObservation = {
  issuerId: string; signalId: string; signalFamily: string; macroTheme: string; state: 'observed' | 'measured' | 'changed' | 'confirmed';
  numericValue: number | null; unit: string | null; baselineValue: number | null; comparisonWindow: string;
  severity: 'info' | 'watch' | 'elevated' | 'high'; confidence: number; methodologyVersion: string; evidenceIds: string[]; observedAt: string;
};

function value(evidence: NormalizedEvidence[], concept: string): { value: number; id: string; observedAt: string } | null {
  const match = evidence.find((item) => item.kind === 'xbrl_fact' && item.payload.concept === concept && typeof item.payload.fact === 'object');
  const raw = match?.payload.fact as { val?: unknown } | undefined;
  return match && typeof raw?.val === 'number' ? { value: raw.val, id: match.id, observedAt: match.observedAt } : null;
}

export function computeIssuerSignals(issuerId: string, evidence: NormalizedEvidence[], priorSignals: SignalObservation[]): SignalObservation[] {
  const cash = value(evidence, 'CashAndCashEquivalentsAtCarryingValue');
  const operatingCash = value(evidence, 'NetCashProvidedByUsedInOperatingActivities');
  const revenue = value(evidence, 'Revenues');
  const capex = value(evidence, 'PaymentsToAcquirePropertyPlantAndEquipment');
  const previousRevenue = priorSignals.find((item) => item.signalId === 'corporate_revenue_baseline')?.baselineValue;
  const previousCapex = priorSignals.find((item) => item.signalId === 'corporate_capex_baseline')?.baselineValue;
  const observedAt = cash?.observedAt ?? operatingCash?.observedAt ?? new Date().toISOString();
  const output: SignalObservation[] = [];
  if (cash && operatingCash) {
    const runway = calculateCashRunway(cash.value, operatingCash.value);
    if (runway !== null) output.push({ issuerId, signalId: 'cash_runway_quarters', signalFamily: 'liquidity', macroTheme: 'corporate_stress', state: 'measured', numericValue: runway, unit: 'quarters', baselineValue: null, comparisonWindow: 'latest reported quarter', severity: runway < 4 ? 'high' : runway < 8 ? 'elevated' : 'info', confidence: 0.9, methodologyVersion: 'v1.0.0', evidenceIds: [cash.id, operatingCash.id], observedAt });
  }
  if (revenue && capex && previousRevenue && previousCapex && previousRevenue > 0 && previousCapex > 0) {
    const impulse = calculateCapexImpulse(capex.value / previousCapex - 1, revenue.value / previousRevenue - 1);
    if (impulse !== null) output.push({ issuerId, signalId: 'capex_impulse', signalFamily: 'industrial_cycle', macroTheme: 'corporate_stress', state: 'changed', numericValue: impulse, unit: 'ratio', baselineValue: 0, comparisonWindow: 'latest quarter versus prior observation', severity: Math.abs(impulse) > 0.2 ? 'elevated' : 'watch', confidence: 0.8, methodologyVersion: 'v1.0.0', evidenceIds: [revenue.id, capex.id], observedAt });
  }
  return output;
}

export async function computeSignalsForIssuer(issuerId: string, supabase: SupabaseClient): Promise<number> {
  const { data: evidence, error: evidenceError } = await supabase.from('sec_filing_evidence').select('id, issuer_id, evidence_kind, structured_payload, filing_date, document_url').eq('issuer_id', issuerId);
  if (evidenceError) throw evidenceError;
  const { data: previous, error: previousError } = await supabase.from('sec_corporate_signals').select('*').eq('issuer_id', issuerId);
  if (previousError) throw previousError;
  const priorSignals: SignalObservation[] = (previous ?? []).map((row) => ({
    issuerId: row.issuer_id,
    signalId: row.signal_id,
    signalFamily: row.signal_family,
    macroTheme: row.macro_theme,
    state: row.state,
    numericValue: row.numeric_value,
    unit: row.unit,
    baselineValue: row.baseline_value,
    comparisonWindow: row.comparison_window,
    severity: row.severity,
    confidence: row.confidence,
    methodologyVersion: row.methodology_version,
    evidenceIds: row.evidence_ids ?? [],
    observedAt: row.observed_at,
  }));
  const signals = computeIssuerSignals(issuerId, (evidence ?? []).map((row) => ({ id: row.id, issuerId: row.issuer_id, kind: row.evidence_kind, payload: row.structured_payload ?? {}, observedAt: row.filing_date, sourceUrl: row.document_url })), priorSignals);
  if (signals.length === 0) return 0;
  const { error } = await supabase.from('sec_corporate_signals').upsert(signals.map((signal) => ({ issuer_id: signal.issuerId, signal_id: signal.signalId, signal_family: signal.signalFamily, macro_theme: signal.macroTheme, state: signal.state, numeric_value: signal.numericValue, unit: signal.unit, baseline_value: signal.baselineValue, comparison_window: signal.comparisonWindow, severity: signal.severity, confidence: signal.confidence, methodology_version: signal.methodologyVersion, evidence_ids: signal.evidenceIds, observed_at: signal.observedAt })), { onConflict: 'issuer_id,signal_id,observed_at' });
  if (error) throw error;
  return signals.length;
}

serveIngest('compute-corporate-signals', async (): Promise<IngestResult> => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const { data: issuers, error } = await supabase.from('sec_corporate_issuers').select('id').eq('is_active', true);
  if (error) throw error;
  let upserted = 0;
  for (const issuer of issuers ?? []) upserted += await computeSignalsForIssuer(issuer.id, supabase);
  return { ok: true, counts: { upserted } };
}, { timeoutMs: 25 * 60 * 1000, retries: 3 });
