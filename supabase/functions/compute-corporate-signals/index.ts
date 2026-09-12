import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';
import {
  calculateCapexImpulse,
  calculateCashRunway,
  calculateInterestCoverageRatio,
  calculateProFormaRefiIcr,
  classifyZombieTier,
} from '../_shared/corporateSignalMath.ts';
import { SEC_CORPORATE_SIGNAL_CONCEPTS } from '../_shared/secCorporateConcepts.ts';

export type NormalizedEvidence = {
  id: string;
  issuerId: string;
  kind: string;
  payload: Record<string, unknown>;
  observedAt: string;
  sourceUrl: string;
};

export type SignalObservation = {
  issuerId: string;
  signalId: string;
  signalFamily: string;
  macroTheme: string;
  state: 'observed' | 'measured' | 'changed' | 'confirmed';
  numericValue: number | null;
  unit: string | null;
  baselineValue: number | null;
  comparisonWindow: string;
  severity: 'info' | 'watch' | 'elevated' | 'high';
  confidence: number;
  methodologyVersion: string;
  evidenceIds: string[];
  observedAt: string;
  calculationInputs?: Record<string, unknown>;
  confidenceReason?: string;
  availabilityStatus?: 'available' | 'insufficient_evidence' | 'unavailable';
};

type FactPayload = {
  concept?: string;
  unit?: string;
  fact?: {
    val?: unknown;
    end?: string;
    filed?: string;
    fy?: number;
    fp?: string;
    form?: string;
    frame?: string;
  };
};

type FactObservation = {
  id: string;
  concept: string;
  unit: string;
  value: number;
  observedAt: string;
  periodEnd: string;
  periodKey: string;
  periodClass: 'quarterly' | 'annual' | 'unknown';
};

type CapexComparison = {
  unit: string;
  periodClass: 'quarterly' | 'annual' | 'unknown';
  currentRevenue: FactObservation;
  priorRevenue: FactObservation;
  currentCapex: FactObservation;
  priorCapex: FactObservation;
};

function compareDesc(left?: string, right?: string): number {
  if (left === right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return right.localeCompare(left);
}

function compareObservationRecency(left: FactObservation, right: FactObservation): number {
  const periodClassRank = periodClassRankValue(left.periodClass) - periodClassRankValue(right.periodClass);
  if (periodClassRank !== 0) return periodClassRank;
  const observedAtComparison = compareDesc(left.observedAt, right.observedAt);
  if (observedAtComparison !== 0) return observedAtComparison;
  return compareDesc(left.periodEnd, right.periodEnd);
}

function periodClassRankValue(periodClass: FactObservation['periodClass']): number {
  if (periodClass === 'quarterly') return 0;
  if (periodClass === 'annual') return 1;
  return 2;
}

function inferPeriodClass(fact: FactPayload['fact']): FactObservation['periodClass'] {
  const form = fact?.form ?? '';
  const fiscalPeriod = fact?.fp ?? '';
  if (form === '10-Q' || /^Q[1-4]$/.test(fiscalPeriod)) return 'quarterly';
  if (form === '10-K' || form === '20-F' || fiscalPeriod === 'FY') return 'annual';
  return 'unknown';
}

function factPeriodKey(fact: FactPayload['fact']): string | null {
  if (fact?.end) return fact.end;
  if (fact?.frame) return fact.frame;
  if (Number.isFinite(fact?.fy) && fact?.fp) return `${fact?.fy}:${fact.fp}`;
  return fact?.filed ?? null;
}

function conceptRank(concepts: readonly string[], concept: string): number {
  const index = concepts.indexOf(concept);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function normalizeFact(evidence: NormalizedEvidence, concepts: readonly string[]): FactObservation | null {
  if (evidence.kind !== 'xbrl_fact') return null;
  const payload = evidence.payload as FactPayload;
  const concept = payload.concept;
  const unit = payload.unit;
  const fact = payload.fact;
  if (!concept || !concepts.includes(concept) || !unit || !fact) return null;
  if (typeof fact.val !== 'number' || !Number.isFinite(fact.val)) return null;
  const periodKey = factPeriodKey(fact);
  if (!periodKey) return null;
  return {
    id: evidence.id,
    concept,
    unit,
    value: fact.val,
    observedAt: fact.filed ?? evidence.observedAt,
    periodEnd: fact.end ?? periodKey,
    periodKey,
    periodClass: inferPeriodClass(fact),
  };
}

function shouldReplaceObservation(
  candidate: FactObservation,
  existing: FactObservation,
  concepts: readonly string[],
): boolean {
  const candidateRank = conceptRank(concepts, candidate.concept);
  const existingRank = conceptRank(concepts, existing.concept);
  if (candidateRank !== existingRank) return candidateRank < existingRank;
  return compareObservationRecency(candidate, existing) < 0;
}

function selectLatestObservation(
  evidence: NormalizedEvidence[],
  concepts: readonly string[],
): FactObservation | null {
  const observations = evidence
    .map((item) => normalizeFact(item, concepts))
    .filter((item): item is FactObservation => item !== null)
    .sort(compareObservationRecency);
  return observations[0] ?? null;
}

function buildSeriesMap(
  evidence: NormalizedEvidence[],
  concepts: readonly string[],
): Map<string, Map<string, FactObservation>> {
  const series = new Map<string, Map<string, FactObservation>>();
  for (const item of evidence) {
    const observation = normalizeFact(item, concepts);
    if (!observation) continue;
    const seriesKey = `${observation.unit}:${observation.periodClass}`;
    const periodMap = series.get(seriesKey) ?? new Map<string, FactObservation>();
    const existing = periodMap.get(observation.periodKey);
    if (!existing || shouldReplaceObservation(observation, existing, concepts)) {
      periodMap.set(observation.periodKey, observation);
    }
    series.set(seriesKey, periodMap);
  }
  return series;
}

function chooseCapexComparison(evidence: NormalizedEvidence[]): CapexComparison | null {
  const revenueSeries = buildSeriesMap(evidence, SEC_CORPORATE_SIGNAL_CONCEPTS.revenue);
  const capexSeries = buildSeriesMap(evidence, SEC_CORPORATE_SIGNAL_CONCEPTS.capex);
  let bestMatch: CapexComparison | null = null;

  for (const [seriesKey, revenuePeriods] of revenueSeries.entries()) {
    const capexPeriods = capexSeries.get(seriesKey);
    if (!capexPeriods) continue;
    const commonPeriods = Array.from(revenuePeriods.keys())
      .filter((periodKey) => capexPeriods.has(periodKey))
      .sort((leftPeriodKey, rightPeriodKey) => {
        const leftRevenue = revenuePeriods.get(leftPeriodKey);
        const rightRevenue = revenuePeriods.get(rightPeriodKey);
        if (!leftRevenue || !rightRevenue) return 0;
        return compareObservationRecency(leftRevenue, rightRevenue);
      });
    if (commonPeriods.length < 2) continue;

    const currentPeriod = commonPeriods[0];
    const priorPeriod = commonPeriods[1];
    const currentRevenue = revenuePeriods.get(currentPeriod);
    const priorRevenue = revenuePeriods.get(priorPeriod);
    const currentCapex = capexPeriods.get(currentPeriod);
    const priorCapex = capexPeriods.get(priorPeriod);
    if (!currentRevenue || !priorRevenue || !currentCapex || !priorCapex) continue;

    const [unit, periodClass] = seriesKey.split(':') as [string, FactObservation['periodClass']];
    const candidate: CapexComparison = {
      unit,
      periodClass,
      currentRevenue,
      priorRevenue,
      currentCapex,
      priorCapex,
    };

    if (!bestMatch) {
      bestMatch = candidate;
      continue;
    }

    const periodClassDelta = periodClassRankValue(candidate.periodClass) - periodClassRankValue(bestMatch.periodClass);
    if (periodClassDelta < 0) {
      bestMatch = candidate;
      continue;
    }
    if (periodClassDelta > 0) continue;

    if (candidate.unit === 'USD' && bestMatch.unit !== 'USD') {
      bestMatch = candidate;
      continue;
    }
    if (candidate.unit !== 'USD' && bestMatch.unit === 'USD') continue;

    if (compareObservationRecency(candidate.currentRevenue, bestMatch.currentRevenue) < 0) {
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

function latestTimestamp(...timestamps: string[]): string {
  return timestamps.filter(Boolean).sort((left, right) => right.localeCompare(left))[0] ?? new Date().toISOString();
}

export function computeIssuerSignals(issuerId: string, evidence: NormalizedEvidence[]): SignalObservation[] {
  const cash = selectLatestObservation(evidence, SEC_CORPORATE_SIGNAL_CONCEPTS.cash);
  const operatingCash = selectLatestObservation(evidence, SEC_CORPORATE_SIGNAL_CONCEPTS.operatingCash);
  const ebit = selectLatestObservation(evidence, SEC_CORPORATE_SIGNAL_CONCEPTS.ebit);
  const interest = selectLatestObservation(evidence, SEC_CORPORATE_SIGNAL_CONCEPTS.interest);
  const debt = selectLatestObservation(evidence, SEC_CORPORATE_SIGNAL_CONCEPTS.debt);
  const output: SignalObservation[] = [];

  let currentIcr: number | null = null;
  let proFormaIcr: number | null = null;
  let runway: number | null = null;

  if (cash && operatingCash) {
    runway = calculateCashRunway(cash.value, operatingCash.value);
    if (runway !== null) {
      output.push({
        issuerId,
        signalId: 'cash_runway_quarters',
        signalFamily: 'liquidity',
        macroTheme: 'corporate_stress',
        state: 'measured',
        numericValue: runway,
        unit: 'quarters',
        baselineValue: null,
        comparisonWindow: 'latest reported quarter',
        severity: runway < 4 ? 'high' : runway < 8 ? 'elevated' : 'info',
        confidence: 0.9,
        methodologyVersion: 'v1.0.0',
        evidenceIds: [cash.id, operatingCash.id],
        observedAt: latestTimestamp(cash.observedAt, operatingCash.observedAt),
        calculationInputs: { cash: cash.value, operatingCashFlow: operatingCash.value },
        availabilityStatus: 'available',
      });
    }
  }

  if (ebit && interest) {
    currentIcr = calculateInterestCoverageRatio(ebit.value, interest.value);
    if (currentIcr !== null) {
      output.push({
        issuerId,
        signalId: 'interest_coverage_ratio',
        signalFamily: 'solvency',
        macroTheme: 'corporate_stress',
        state: 'measured',
        numericValue: currentIcr,
        unit: 'ratio',
        baselineValue: 1.0,
        comparisonWindow: ebit.periodKey,
        severity: currentIcr < 1.0 ? 'high' : currentIcr < 1.75 ? 'elevated' : 'info',
        confidence: 0.95,
        methodologyVersion: 'v1.0.0',
        evidenceIds: [ebit.id, interest.id],
        observedAt: latestTimestamp(ebit.observedAt, interest.observedAt),
        calculationInputs: { ebit: ebit.value, interestExpense: interest.value, totalDebt: debt?.value ?? 0 },
        availabilityStatus: 'available',
      });
    }
  }

  if (ebit && debt && debt.value > 0) {
    const existingInterest = interest ? Math.max(0, interest.value) : debt.value * 0.045;
    const existingCoupon = existingInterest / debt.value;
    const maturingDebt = debt.value * 0.35; // 35% maturing <2Y baseline
    const refiRate = 0.07; // 7.00% benchmark yield
    const refiCalc = calculateProFormaRefiIcr(ebit.value, debt.value, maturingDebt, existingCoupon, refiRate);
    if (refiCalc !== null) {
      proFormaIcr = refiCalc.proFormaIcr;
      output.push({
        issuerId,
        signalId: 'pro_forma_refi_icr',
        signalFamily: 'refinancing_shock',
        macroTheme: 'corporate_stress',
        state: 'measured',
        numericValue: refiCalc.proFormaIcr,
        unit: 'ratio',
        baselineValue: 1.0,
        comparisonWindow: 'simulated 7.00% refi',
        severity: refiCalc.proFormaIcr < 1.0 ? 'high' : refiCalc.proFormaIcr < 1.75 ? 'elevated' : 'info',
        confidence: 0.85,
        methodologyVersion: 'v1.0.0',
        evidenceIds: [ebit.id, debt.id, ...(interest ? [interest.id] : [])],
        observedAt: latestTimestamp(ebit.observedAt, debt.observedAt),
        calculationInputs: {
          ebit: ebit.value,
          totalDebt: debt.value,
          maturingDebt,
          existingCoupon,
          refiRate,
          additionalInterestDrag: refiCalc.additionalInterestDrag,
        },
        availabilityStatus: 'available',
      });
    }
  }

  if (currentIcr !== null || proFormaIcr !== null) {
    const tier = classifyZombieTier(currentIcr, proFormaIcr, runway);
    output.push({
      issuerId,
      signalId: 'zombie_tier',
      signalFamily: 'classification',
      macroTheme: 'corporate_stress',
      state: 'confirmed',
      numericValue: tier === 'confirmed_zombie' ? 1 : tier === 'rollover_zombie' ? 2 : tier === 'vulnerable' ? 3 : 4,
      unit: tier,
      baselineValue: 4,
      comparisonWindow: 'trailing + pro-forma',
      severity: tier === 'confirmed_zombie' ? 'high' : tier === 'rollover_zombie' ? 'elevated' : tier === 'vulnerable' ? 'watch' : 'info',
      confidence: 0.9,
      methodologyVersion: 'v1.0.0',
      evidenceIds: [
        ...(ebit ? [ebit.id] : []),
        ...(interest ? [interest.id] : []),
        ...(debt ? [debt.id] : []),
      ],
      observedAt: latestTimestamp(ebit?.observedAt ?? '', interest?.observedAt ?? '', debt?.observedAt ?? ''),
      calculationInputs: { tier, currentIcr, proFormaIcr, cashRunway: runway },
      availabilityStatus: 'available',
    });
  }

  const comparison = chooseCapexComparison(evidence);
  if (comparison && comparison.priorRevenue.value > 0 && comparison.priorCapex.value > 0) {
    const revenueGrowth = comparison.currentRevenue.value / comparison.priorRevenue.value - 1;
    const capexGrowth = comparison.currentCapex.value / comparison.priorCapex.value - 1;
    const impulse = calculateCapexImpulse(capexGrowth, revenueGrowth);
    if (impulse !== null) {
      output.push({
        issuerId,
        signalId: 'capex_impulse',
        signalFamily: 'industrial_cycle',
        macroTheme: 'corporate_stress',
        state: 'changed',
        numericValue: impulse,
        unit: 'ratio',
        baselineValue: 0,
        comparisonWindow: `${comparison.periodClass} ${comparison.currentRevenue.periodEnd} vs ${comparison.priorRevenue.periodEnd}`,
        severity: Math.abs(impulse) > 0.2 ? 'elevated' : 'watch',
        confidence: 0.8,
        methodologyVersion: 'v1.0.0',
        evidenceIds: [
          comparison.currentRevenue.id,
          comparison.priorRevenue.id,
          comparison.currentCapex.id,
          comparison.priorCapex.id,
        ],
        observedAt: latestTimestamp(comparison.currentRevenue.observedAt, comparison.currentCapex.observedAt),
        calculationInputs: { revenueGrowth, capexGrowth, impulse },
        availabilityStatus: 'available',
      });
    }
  }

  return output;
}

export async function computeSignalsForIssuer(issuerId: string, supabase: SupabaseClient): Promise<number> {
  const { data: evidence, error: evidenceError } = await supabase
    .from('sec_filing_evidence')
    .select('id, issuer_id, evidence_kind, structured_payload, filing_date, document_url')
    .eq('issuer_id', issuerId);
  if (evidenceError) throw evidenceError;

  const signals = computeIssuerSignals(
    issuerId,
    (evidence ?? []).map((row) => ({
      id: row.id,
      issuerId: row.issuer_id,
      kind: row.evidence_kind,
      payload: row.structured_payload ?? {},
      observedAt: row.filing_date,
      sourceUrl: row.document_url,
    })),
  );
  if (signals.length === 0) return 0;

  const { error } = await supabase.from('sec_corporate_signals').upsert(
    signals.map((signal) => ({
      issuer_id: signal.issuerId,
      signal_id: signal.signalId,
      signal_family: signal.signalFamily,
      macro_theme: signal.macroTheme,
      state: signal.state,
      numeric_value: signal.numericValue,
      unit: signal.unit,
      baseline_value: signal.baselineValue,
      comparison_window: signal.comparisonWindow,
      severity: signal.severity,
      confidence: signal.confidence,
      methodology_version: signal.methodologyVersion,
      evidence_ids: signal.evidenceIds,
      observed_at: signal.observedAt,
      calculation_inputs: signal.calculationInputs ?? {},
      confidence_reason: signal.confidenceReason ?? null,
      availability_status: signal.availabilityStatus ?? 'available',
    })),
    { onConflict: 'issuer_id,signal_id,observed_at' },
  );
  if (error) throw error;
  return signals.length;
}

serveIngest('compute-corporate-signals', async (): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const { data: issuers, error } = await supabase.from('sec_corporate_issuers').select('id').eq('is_active', true);
  if (error) throw error;

  let upserted = 0;
  for (const issuer of issuers ?? []) upserted += await computeSignalsForIssuer(issuer.id, supabase);
  return { ok: true, counts: { upserted } };
}, { timeoutMs: 25 * 60 * 1000, retries: 3 });
