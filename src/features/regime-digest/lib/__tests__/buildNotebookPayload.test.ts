import { describe, it, expect } from 'vitest';
import { buildNotebookPayload } from '../buildNotebookPayload';
import type { RawMetricPoint } from '../buildNotebookPayload';

const samplePoints: RawMetricPoint[] = [
  { id: 'DXY_INDEX', value: 101, asOf: '2026-06-28' },
  { id: 'DXY_INDEX', value: 100, asOf: '2026-05-28' },
  { id: 'VIX_INDEX', value: 17, asOf: '2026-06-28' },
  { id: 'VIX_INDEX', value: 18, asOf: '2026-05-28' },
  { id: 'GOLD_PRICE_USD', value: 4200, asOf: '2026-06-28' },
  { id: 'GOLD_PRICE_USD', value: 4000, asOf: '2026-05-28' },
  { id: 'BIS_GLOBAL_LIQUIDITY_USD_BN', value: 25400, asOf: '2026-06-15' },
  { id: 'BIS_GLOBAL_LIQUIDITY_USD_BN', value: 25000, asOf: '2026-05-15' },
  { id: 'US_CPI_YOY', value: 2.7, asOf: '2026-06-12' },
  { id: 'US_CPI_YOY', value: 2.8, asOf: '2026-05-12' },
  // poison value must be withheld
  { id: 'US_CPI_YOY', value: 332.57, asOf: '2026-04-12' },
];

describe('buildNotebookPayload', () => {
  it('builds ok quality payload with thesis and board', () => {
    const payload = buildNotebookPayload({
      yearMonth: '2026-06',
      now: new Date('2026-07-01T12:00:00Z'),
      points: samplePoints,
      regime: { label: 'RISK_OFF', confidence: 80, daysInRegime: 10, compositeScore: 30 },
      history: [{ yearMonth: '2026-05', regime: 'NEUTRAL' }],
      briefLinks: [],
      editionNumber: 5,
    });
    expect(payload.generation.mode).toBe('notebook_v1');
    expect(payload.thesis.length).toBeGreaterThan(0);
    expect(payload.board.some((r) => r.id === 'DXY_INDEX' && r.deltaPct != null)).toBe(true);
    expect(payload.quality.overall).not.toBe('blocked');
  });

  it('withholds invalid CPI and never puts it on movers', () => {
    const payload = buildNotebookPayload({
      yearMonth: '2026-06',
      now: new Date('2026-07-01T12:00:00Z'),
      points: [
        { id: 'US_CPI_YOY', value: 332.57, asOf: '2026-06-30' },
        { id: 'DXY_INDEX', value: 101, asOf: '2026-06-28' },
        { id: 'DXY_INDEX', value: 100, asOf: '2026-05-28' },
      ],
      regime: { label: 'NEUTRAL', confidence: 50, daysInRegime: 1, compositeScore: 50 },
      history: [],
      briefLinks: [],
      editionNumber: 1,
    });
    const cpi = payload.board.find((r) => r.id === 'US_CPI_YOY');
    expect(cpi?.status).toBe('failed_validation');
    expect(payload.movers.up.every((m) => m.id !== 'US_CPI_YOY')).toBe(true);
  });

  it('forces quality partial when regime is defaulted (no freeze)', () => {
    // Full core set at healthy levels so metrics alone would be ok/partial from core only;
    // defaulted regime must still prevent pure `ok`.
    const corePoints: RawMetricPoint[] = [
      { id: 'BIS_GLOBAL_LIQUIDITY_USD_BN', value: 25400, asOf: '2026-06-15' },
      { id: 'BIS_GLOBAL_LIQUIDITY_USD_BN', value: 25000, asOf: '2026-05-15' },
      { id: 'DXY_INDEX', value: 101, asOf: '2026-06-28' },
      { id: 'DXY_INDEX', value: 100, asOf: '2026-05-28' },
      { id: 'VIX_INDEX', value: 17, asOf: '2026-06-28' },
      { id: 'VIX_INDEX', value: 18, asOf: '2026-05-28' },
      { id: 'GOLD_PRICE_USD', value: 4200, asOf: '2026-06-28' },
      { id: 'GOLD_PRICE_USD', value: 4000, asOf: '2026-05-28' },
      { id: 'US_CPI_YOY', value: 2.7, asOf: '2026-06-12' },
      { id: 'US_CPI_YOY', value: 2.8, asOf: '2026-05-12' },
      { id: 'IN_CPI_YOY', value: 4.1, asOf: '2026-06-12' },
      { id: 'IN_CPI_YOY', value: 4.0, asOf: '2026-05-12' },
      { id: 'CN_GDP_GROWTH_YOY', value: 5.0, asOf: '2026-06-01' },
      { id: 'CN_GDP_GROWTH_YOY', value: 4.8, asOf: '2026-03-01' },
    ];
    const payload = buildNotebookPayload({
      yearMonth: '2026-06',
      now: new Date('2026-07-01T12:00:00Z'),
      points: corePoints,
      regime: {
        label: 'NEUTRAL',
        confidence: null,
        daysInRegime: null,
        compositeScore: null,
        regimeSource: 'default',
      },
      history: [],
      briefLinks: [],
      editionNumber: 1,
    });
    expect(payload.quality.overall).not.toBe('ok');
    expect(['partial', 'blocked']).toContain(payload.quality.overall);
  });

  it('forces quality partial when confidence/days/score all null even without regimeSource', () => {
    const payload = buildNotebookPayload({
      yearMonth: '2026-06',
      now: new Date('2026-07-01T12:00:00Z'),
      points: samplePoints,
      regime: {
        label: 'NEUTRAL',
        confidence: null,
        daysInRegime: null,
        compositeScore: null,
      },
      history: [],
      briefLinks: [],
      editionNumber: 1,
    });
    expect(payload.quality.overall).not.toBe('ok');
  });
});
