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

  it('derives interest coverage ratio, pro-forma refi ICR, and zombie tier classification', () => {
    // Distressed company: EBIT = 40, Interest = 60 (ICR = 0.67x -> Confirmed Zombie)
    // Debt = 1200, Maturing = 420 (35%), Existing coupon = 60/1200 = 5%
    // Refi at 7% -> Pro-forma interest = (780 * 0.05) + (420 * 0.07) = 39 + 29.4 = 68.4
    // Pro-forma ICR = 40 / 68.4 = 0.58x
    const evidence: NormalizedEvidence[] = [
      factEvidence('ebit-current', 'OperatingIncomeLoss', 40, '2026-08-01', '2026-06-30'),
      factEvidence('interest-current', 'InterestExpense', 60, '2026-08-01', '2026-06-30'),
      factEvidence('debt-current', 'LongTermDebtNoncurrent', 1200, '2026-08-01', '2026-06-30'),
    ];

    const signals = computeIssuerSignals('issuer-zombie', evidence);
    const icrSignal = signals.find((s) => s.signalId === 'interest_coverage_ratio');
    const refiSignal = signals.find((s) => s.signalId === 'pro_forma_refi_icr');
    const tierSignal = signals.find((s) => s.signalId === 'zombie_tier');

    expect(icrSignal).toBeDefined();
    expect(icrSignal?.numericValue).toBeCloseTo(40 / 60);
    expect(icrSignal?.severity).toBe('high');

    expect(refiSignal).toBeDefined();
    expect(refiSignal?.numericValue).toBeCloseTo(40 / 68.4);
    expect(refiSignal?.severity).toBe('high');

    expect(tierSignal).toBeDefined();
    expect(tierSignal?.unit).toBe('confirmed_zombie');
    expect(tierSignal?.severity).toBe('high');
  });
});
