import { describe, it, expect } from 'vitest';
import { PIPELINES, PIPELINE_TIER_LABELS, isRetiredPipeline } from '@/lib/pipelineCatalog';

describe('pipelineCatalog after minimalist prune', () => {
  it('has no trade or india_equities tiers', () => {
    expect(Object.keys(PIPELINE_TIER_LABELS)).not.toContain('trade');
    expect(Object.keys(PIPELINE_TIER_LABELS)).not.toContain('india_equities');
    expect(PIPELINES.some((p) => (p.tier as string) === 'trade')).toBe(false);
    expect(PIPELINES.some((p) => (p.tier as string) === 'india_equities')).toBe(false);
  });

  it('does not advertise comtrade/export-scout/cie pipeline entries', () => {
    const ids = PIPELINES.map((p) => p.id);
    expect(ids).not.toContain('ingest-un-comtrade');
    expect(ids).not.toContain('generate-export-scout');
    expect(ids).not.toContain('ingest-cie-fundamentals');
  });

  it('marks deleted trade and CIE functions as retired', () => {
    expect(isRetiredPipeline('ingest-un-comtrade')).toBe(true);
    expect(isRetiredPipeline('generate-export-scout')).toBe(true);
    expect(isRetiredPipeline('ingest-cie-fundamentals')).toBe(true);
    expect(isRetiredPipeline('ingest-fred')).toBe(false);
  });
});
