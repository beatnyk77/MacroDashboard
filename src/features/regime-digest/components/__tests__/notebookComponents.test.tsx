import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EditionHeader } from '../EditionHeader';
import { RegimeStrip } from '../RegimeStrip';
import { DeskBrief } from '../DeskBrief';
import { Scoreboard } from '../Scoreboard';
import { RegimeHistory } from '../RegimeHistory';
import { BriefIndex } from '../BriefIndex';
import { QualityFooter } from '../QualityFooter';
import type { MetricRow, NotebookPayload } from '@/features/regime-digest/lib/types';

const sampleBoard: MetricRow[] = [
  {
    id: 'DXY_INDEX',
    name: 'DXY',
    section: 'rates_usd',
    level: 101.2,
    priorLevel: 100,
    delta: 1.2,
    deltaPct: 1.2,
    unit: 'index',
    asOf: '2026-06-28',
    sourceFamily: 'market',
    status: 'ok',
  },
  {
    id: 'US_CPI_YOY',
    name: 'US CPI YoY',
    section: 'us',
    level: null,
    priorLevel: null,
    delta: null,
    deltaPct: null,
    unit: '%',
    asOf: null,
    sourceFamily: 'FRED',
    status: 'failed_validation',
  },
];

const quality: NotebookPayload['quality'] = {
  okCount: 1,
  staleCount: 0,
  withheldCount: 1,
  missingCount: 0,
  failedMetrics: ['US_CPI_YOY'],
  overall: 'partial',
};

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('notebook UI components', () => {
  it('EditionHeader shows month and edition', () => {
    wrap(
      <EditionHeader
        yearMonth="2026-06"
        publishedAt="2026-07-01T12:00:00Z"
        asOf="2026-06-28"
        editionNumber={5}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/June 2026/i);
    expect(screen.getByText(/Edition 5/i)).toBeTruthy();
    expect(screen.getByText(/Desk brief/i)).toBeTruthy();
  });

  it('RegimeStrip shows Risk Off with stats (icon+text, not color alone)', () => {
    wrap(
      <RegimeStrip
        regime={{ label: 'RISK_OFF', confidence: 80, daysInRegime: 10, compositeScore: 30 }}
      />,
    );
    expect(screen.getByText(/Risk Off/i)).toBeTruthy();
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('10d')).toBeTruthy();
  });

  it('DeskBrief includes positioning disclaimer and movers', () => {
    wrap(
      <DeskBrief
        thesis={['Liquidity tightened while USD firmed.']}
        movers={{
          up: [{ id: 'DXY_INDEX', name: 'DXY', deltaPct: 1.2, level: 101.2, section: 'rates_usd' }],
          down: [],
        }}
        positioning={['Framework: mixed signals.']}
        watchlist={[{ type: 'level', label: 'VIX 20', why: 'Vol breakout threshold' }]}
      />,
    );
    expect(screen.getByText(/Liquidity tightened/i)).toBeTruthy();
    expect(screen.getByText(/Framework implications — not personalized advice/i)).toBeTruthy();
    expect(screen.getByText('DXY')).toBeTruthy();
    expect(screen.getByText(/VIX 20/i)).toBeTruthy();
  });

  it('Scoreboard renders sections and status chips with text', () => {
    wrap(<Scoreboard board={sampleBoard} />);
    expect(screen.getByText('Rates & USD')).toBeTruthy();
    expect(screen.getByText('United States')).toBeTruthy();
    expect(screen.getAllByText('OK').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Withheld').length).toBeGreaterThanOrEqual(1);
  });

  it('Scoreboard hides empty sections', () => {
    wrap(<Scoreboard board={sampleBoard.filter((r) => r.section === 'us')} />);
    expect(screen.queryByText('Liquidity')).toBeNull();
    expect(screen.getByText('United States')).toBeTruthy();
  });

  it('RegimeHistory, BriefIndex, QualityFooter render core labels', () => {
    wrap(
      <>
        <RegimeHistory history={[{ yearMonth: '2026-05', regime: 'NEUTRAL' }]} />
        <BriefIndex
          links={[{ date: '2026-06-15', url: '/macro-brief/2026-06-15', title: 'Mid-month brief' }]}
        />
        <QualityFooter quality={quality} asOf="2026-06-28" />
      </>,
    );
    expect(screen.getByText(/Regime history/i)).toBeTruthy();
    expect(screen.getByText(/Neutral/i)).toBeTruthy();
    expect(screen.getByText(/Mid-month brief/i)).toBeTruthy();
    expect(screen.getByText(/Data quality/i)).toBeTruthy();
    expect(screen.getByText('Partial')).toBeTruthy();
    expect(screen.getByText(/US_CPI_YOY/)).toBeTruthy();
  });
});
