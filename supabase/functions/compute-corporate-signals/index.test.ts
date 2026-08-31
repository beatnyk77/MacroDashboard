import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  (globalThis as Record<string, unknown>).Deno = {
    serve: vi.fn(),
    env: { get: vi.fn() },
  };
});

import { computeIssuerSignals, type NormalizedEvidence } from './index.ts';

function factEvidence(
  id: string,
  concept: string,
  value: number,
  filed: string,
  end: string,
): NormalizedEvidence {
  return {
    id,
    issuerId: 'issuer-1',
    kind: 'xbrl_fact',
    payload: {
      namespace: 'us-gaap',
      concept,
      unit: 'USD',
      fact: {
        accn: `${id}-accn`,
        filed,
        form: '10-Q',
        fp: end === '2026-06-30' ? 'Q2' : 'Q1',
        end,
        val: value,
      },
    },
    observedAt: filed,
    sourceUrl: `https://www.sec.gov/${id}`,
  };
}

describe('computeIssuerSignals', () => {
  it('derives cash runway and capex impulse directly from SEC evidence', () => {
    const evidence: NormalizedEvidence[] = [
      factEvidence('cash-current', 'CashAndCashEquivalentsAtCarryingValue', 120, '2026-08-01', '2026-06-30'),
      factEvidence('ocf-current', 'NetCashProvidedByUsedInOperatingActivities', -30, '2026-08-01', '2026-06-30'),
      factEvidence('revenue-current', 'RevenueFromContractWithCustomerExcludingAssessedTax', 150, '2026-08-01', '2026-06-30'),
      factEvidence('revenue-prior', 'RevenueFromContractWithCustomerExcludingAssessedTax', 120, '2026-05-01', '2026-03-31'),
      factEvidence('capex-current', 'PaymentsToAcquirePropertyPlantAndEquipment', 45, '2026-08-01', '2026-06-30'),
      factEvidence('capex-prior', 'PaymentsToAcquirePropertyPlantAndEquipment', 20, '2026-05-01', '2026-03-31'),
    ];

    const signals = computeIssuerSignals('issuer-1', evidence);
    const cashRunway = signals.find((signal) => signal.signalId === 'cash_runway_quarters');
    const capexImpulse = signals.find((signal) => signal.signalId === 'capex_impulse');

    expect(cashRunway?.numericValue).toBe(4);
    expect(cashRunway?.evidenceIds).toEqual(['cash-current', 'ocf-current']);
    expect(capexImpulse?.numericValue).toBeCloseTo(1);
    expect(capexImpulse?.comparisonWindow).toContain('2026-06-30');
    expect(capexImpulse?.comparisonWindow).toContain('2026-03-31');
    expect(capexImpulse?.evidenceIds).toEqual([
      'revenue-current',
      'revenue-prior',
      'capex-current',
      'capex-prior',
    ]);
  });
});
