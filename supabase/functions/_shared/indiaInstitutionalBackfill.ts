import type { ParsedCashFlow } from './indiaInstitutionalSources.ts';

export interface IndiaCashObservation {
  metric_id: 'IN_FII_CASH_NET' | 'IN_DII_CASH_NET';
  as_of_date: string;
  value: number;
  last_updated_at: string;
  source_ref: string;
  provenance: 'api_live' | 'verified_historical';
  is_provisional: boolean;
  metadata: {
    source_name: 'NSE';
    native_frequency: 'daily';
    source_fields: Record<string, unknown>;
    source_hash: string;
    parser_version: string;
    coverage_state: 'observed';
    source_scope: 'combined_cash_segment' | 'nse_cash_segment';
  };
}

export interface AcceptedCashObservation {
  metric_id: string;
  as_of_date: string;
  value: number | string | null;
  source_ref: string | null;
  metadata: Record<string, unknown> | null;
}

export function buildIndiaCashObservations(rows: ParsedCashFlow[], ingestedAt: string): IndiaCashObservation[] {
  return rows.map((row) => {
    const archived = row.sourceRef.startsWith('official_archive:nse:');
    return {
      metric_id: row.participant === 'FII' ? 'IN_FII_CASH_NET' : 'IN_DII_CASH_NET',
      as_of_date: row.date,
      value: row.netValue,
      last_updated_at: ingestedAt,
      source_ref: row.sourceRef,
      provenance: archived ? 'verified_historical' : 'api_live',
      is_provisional: false,
      metadata: {
        source_name: 'NSE',
        native_frequency: 'daily',
        source_fields: row.sourceFields,
        source_hash: row.sourceHash,
        parser_version: row.parserVersion,
        coverage_state: 'observed',
        source_scope: archived ? 'nse_cash_segment' : 'combined_cash_segment',
      },
    };
  });
}

export function findCashObservationRevisions(accepted: AcceptedCashObservation[], incoming: IndiaCashObservation[]) {
  return accepted.flatMap((old) => {
    const replacement = incoming.find((row) => row.metric_id === old.metric_id && row.as_of_date === old.as_of_date);
    const oldHash = old.metadata?.source_hash;
    const newHash = replacement?.metadata.source_hash;
    return replacement && oldHash && newHash && oldHash !== newHash
      ? [{
        metric_id: old.metric_id,
        as_of_date: old.as_of_date,
        value: old.value,
        source_ref: old.source_ref,
        source_hash: String(oldHash),
        metadata: old.metadata,
      }]
      : [];
  });
}

export function planNseCategoryBackfillDates(earliestAcceptedDate: string, acceptedSessions: number, requiredSessions: number): string[] {
  const remaining = Math.max(0, requiredSessions - acceptedSessions);
  if (!remaining) return [];
  const cursor = new Date(`${earliestAcceptedDate}T00:00:00Z`);
  const dates: string[] = [];
  while (dates.length < remaining) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6) continue;
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

export function nseCategoryWorkbookUrl(date: string): string {
  const [year, month, day] = date.split('-');
  return `https://nsearchives.nseindia.com/archives/equities/cat/cat_turnover_${day}${month}${year.slice(-2)}.xls`;
}
