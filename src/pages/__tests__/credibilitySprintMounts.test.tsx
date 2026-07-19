import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { creditCycleFreshness } from '@/hooks/useIndiaCreditCycle';

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('credibility sprint — mount absence', () => {
  it('Terminal does not mount IndiaMacroDashboard', () => {
    const src = readSrc('src/pages/Terminal.tsx');
    expect(src).not.toMatch(/<IndiaMacroDashboard\b/);
    expect(src).not.toMatch(/import\('@\/features\/dashboard\/components\/sections\/IndiaMacroDashboard'/);
  });

  it('IntelIndiaPage does not mount IndiaMacroDashboard', () => {
    const src = readSrc('src/pages/IntelIndiaPage.tsx');
    expect(src).not.toMatch(/<IndiaMacroDashboard\b/);
    expect(src).not.toMatch(/import\('@\/features\/dashboard\/components\/sections\/IndiaMacroDashboard'/);
  });

  it('database.types includes growth-stack fields that unblocked CI', () => {
    const src = readSrc('src/types/database.types.ts');
    expect(src).toContain('share_image_url');
    expect(src).toContain('export_scout_leads');
    expect(src).toContain('regime_alert_sends');
  });
});

describe('creditCycleFreshness SLA', () => {
  const now = Date.parse('2026-07-20T12:00:00Z');

  it('marks ≤45d as fresh', () => {
    expect(creditCycleFreshness('2026-06-30', now)).toBe('fresh');
  });

  it('marks 46–90d as lagged', () => {
    expect(creditCycleFreshness('2026-05-01', now)).toBe('lagged');
  });

  it('marks >90d as stale', () => {
    expect(creditCycleFreshness('2026-03-01', now)).toBe('stale');
  });

  it('marks missing as no_data', () => {
    expect(creditCycleFreshness(null, now)).toBe('no_data');
  });
});
