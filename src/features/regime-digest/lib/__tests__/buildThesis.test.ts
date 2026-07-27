import { describe, it, expect } from 'vitest';
import { buildThesisLines } from '../buildThesis';
import { positioningForRegime } from '../positioning';
import { buildLevelWatchlist } from '../buildWatchlist';
import type { MetricRow, NotebookRegime } from '../types';

const regime: NotebookRegime = {
  label: 'RISK_OFF',
  confidence: 82,
  daysInRegime: 12,
  compositeScore: 30,
};

function row(partial: Partial<MetricRow> & Pick<MetricRow, 'id' | 'name' | 'section'>): MetricRow {
  return {
    level: null,
    priorLevel: null,
    delta: null,
    deltaPct: null,
    unit: '',
    asOf: null,
    sourceFamily: 't',
    status: 'missing',
    ...partial,
  };
}

describe('buildThesisLines', () => {
  it('includes regime line and skips failed metrics', () => {
    const board: MetricRow[] = [
      row({
        id: 'DXY_INDEX', name: 'DXY', section: 'rates_usd',
        status: 'ok', level: 101, priorLevel: 100, delta: 1, deltaPct: 1, unit: 'index', asOf: '2026-06-30',
      }),
      row({
        id: 'US_CPI_YOY', name: 'US CPI YoY', section: 'us',
        status: 'failed_validation', level: null, unit: '%',
      }),
    ];
    const lines = buildThesisLines(regime, board);
    // Label is humanized in prose (RISK_OFF → RISK OFF)
    expect(lines.some((l) => l.includes('RISK OFF'))).toBe(true);
    expect(lines[0]).toBe('Month-end regime: RISK OFF (confidence 82%; 12 days in regime).');
    expect(lines.some((l) => l.includes('DXY'))).toBe(true);
    expect(lines.some((l) => l.includes('CPI'))).toBe(false);
    expect(lines.length).toBeLessThanOrEqual(5);
  });

  it('formats days-only paren without leading semicolon', () => {
    const daysOnly: NotebookRegime = {
      label: 'NEUTRAL',
      confidence: null,
      daysInRegime: 7,
      compositeScore: null,
    };
    const lines = buildThesisLines(daysOnly, []);
    expect(lines[0]).toBe('Month-end regime: NEUTRAL (7 days in regime).');
    expect(lines[0]).not.toMatch(/;\s*\d+ days/);
  });

  it('omits paren when confidence and days are both null', () => {
    const bare: NotebookRegime = {
      label: 'NEUTRAL',
      confidence: null,
      daysInRegime: null,
      compositeScore: null,
      regimeSource: 'default',
    };
    const lines = buildThesisLines(bare, []);
    expect(lines[0]).toBe('Month-end regime: NEUTRAL.');
  });
});

describe('positioningForRegime', () => {
  it('returns framework bullets for RISK_OFF', () => {
    const bullets = positioningForRegime('RISK_OFF');
    expect(bullets.length).toBeGreaterThan(0);
    expect(bullets.join(' ')).toMatch(/defensive|gold|duration|cash/i);
  });
});

describe('buildLevelWatchlist', () => {
  it('creates level watches from largest movers', () => {
    const movers = {
      up: [{ id: 'GOLD_PRICE_USD', name: 'Gold', deltaPct: 5, level: 4200, section: 'metals' as const }],
      down: [{ id: 'BRENT_CRUDE_PRICE', name: 'Brent', deltaPct: -6, level: 90, section: 'energy' as const }],
    };
    const w = buildLevelWatchlist(movers);
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((x) => x.type === 'level')).toBe(true);
  });
});
