import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { METRIC_IDS } from '@/constants/metricIds';

const migrationSql = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260830000001_india_institutional_positioning.sql'),
  'utf8',
);

const databaseTypes = readFileSync(
  join(process.cwd(), 'src/types/database.types.ts'),
  'utf8',
);

const expectedMetricIds = [
  'IN_FII_CASH_NET',
  'IN_DII_CASH_NET',
  'IN_FII_INDEX_FUTURE_NET',
  'IN_FII_INDEX_FUTURE_LONG_SHORT_RATIO',
  'IN_FII_PUT_CALL_POSITIONING',
  'IN_INDIA_VIX',
  'IN_NSDL_SECTOR_FLOW',
  'IN_NSDL_SECTOR_AUM',
  'IN_MARKET_BREADTH',
  'IN_NIFTY_RETURN',
  'IN_USD_INR_RETURN',
  'IN_RBI_LIQUIDITY_IMPULSE',
  'IN_BANK_CREDIT_GROWTH_YOY',
] as const;

describe('India institutional positioning schema', () => {
  it('registers the canonical 13 metric IDs from the plan', () => {
    expect(expectedMetricIds).toHaveLength(13);
    expect(expectedMetricIds.every((id) => METRIC_IDS[id as keyof typeof METRIC_IDS] === id)).toBe(true);
  });

  it('defines the sector observation table contract and uniqueness intent', () => {
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.india_institutional_sector_observations');
    expect(migrationSql).toContain('PRIMARY KEY (sector_key, report_period_end)');
    expect(migrationSql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS idx_india_metric_observations_metric_date');
    expect(migrationSql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_india_institutional_sector_observations_report_period_end',
    );
    expect(migrationSql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_india_institutional_sector_observations_sector_key',
    );
    expect(migrationSql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_india_institutional_sector_observations_provenance',
    );
    expect(migrationSql).toContain(
      'CREATE INDEX IF NOT EXISTS idx_india_institutional_sector_observations_source_hash',
    );
    expect(migrationSql).toContain(
      'CREATE POLICY "Allow public read access on india_institutional_sector_observations"',
    );
    expect(migrationSql).toContain(
      'CREATE POLICY "Service role write access on india_institutional_sector_observations"',
    );
    expect(migrationSql).toContain(
      'GRANT SELECT ON public.india_institutional_sector_observations TO anon, authenticated;',
    );
    expect(migrationSql).toContain(
      'GRANT ALL ON public.india_institutional_sector_observations TO service_role;',
    );
  });

  it('includes the required public columns and excludes fabricated F&O coverage fields', () => {
    for (const column of [
      'sector_key text NOT NULL',
      'source_sector_label text NOT NULL',
      'report_period_end date NOT NULL',
      'equity_flow_inr_crore numeric',
      'total_flow_inr_crore numeric',
      'equity_aum_inr_crore numeric',
      'total_aum_inr_crore numeric',
      'source_url text NOT NULL',
      'source_hash text NOT NULL',
      'ingested_at timestamptz NOT NULL DEFAULT now()',
      'parser_version text NOT NULL',
      'provenance text NOT NULL',
      'is_provisional boolean NOT NULL DEFAULT true',
    ]) {
      expect(migrationSql).toContain(column);
    }

    for (const forbidden of [
      'fii_idx_fut_net',
      'fii_idx_fut_long',
      'fii_idx_fut_short',
      'coverage_mask',
      'coverage_state',
      'fno_coverage',
    ]) {
      expect(migrationSql.toLowerCase()).not.toContain(forbidden);
    }
  });

  it('adds the new table to the generated database types surface', () => {
    expect(databaseTypes).toContain('india_institutional_sector_observations: {');
    expect(databaseTypes).toContain('sector_key: string');
    expect(databaseTypes).toContain('source_sector_label: string');
    expect(databaseTypes).toContain('report_period_end: string');
    expect(databaseTypes).toContain('equity_flow_inr_crore: number | null');
    expect(databaseTypes).toContain('total_flow_inr_crore: number | null');
    expect(databaseTypes).toContain('equity_aum_inr_crore: number | null');
    expect(databaseTypes).toContain('total_aum_inr_crore: number | null');
    expect(databaseTypes).toContain('source_url: string');
    expect(databaseTypes).toContain('source_hash: string');
    expect(databaseTypes).toContain('ingested_at: string');
    expect(databaseTypes).toContain('parser_version: string');
    expect(databaseTypes).toContain('provenance: string');
    expect(databaseTypes).toContain('is_provisional: boolean');
  });
});

