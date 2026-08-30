export const INDIA_INSTITUTIONAL_PARSER_VERSION = '1.2.0';

export interface ParsedCashFlow {
  participant: 'FII' | 'DII';
  date: string;
  buyValue: number;
  sellValue: number;
  netValue: number;
  sourceRef: string;
  sourceHash: string;
  parserVersion: string;
  sourceFields: Record<string, unknown>;
}

export interface ParsedParticipantOi {
  reportDate: string;
  fii: ParticipantOi | null;
  dii: ParticipantOi | null;
  coverage: 'observed' | 'unavailable';
  coverageReason: 'observed' | 'missing_participant_rows' | 'missing_required_fields';
  sourceHash: string;
  parserVersion: string;
}

export interface ParticipantOi {
  indexFutureLong: number;
  indexFutureShort: number;
  indexFutureNet: number;
  indexFutureLongShortRatio: number | null;
  indexCallShort: number;
  indexPutShort: number;
  putCallPositioning: number | null;
  sourceFields: Record<string, string>;
}

export interface ParsedSectorObservation {
  sectorKey: string;
  sourceSectorLabel: string;
  reportPeriodEnd: string;
  equityFlowInrCrore: number | null;
  totalFlowInrCrore: number | null;
  equityAumInrCrore: number | null;
  totalAumInrCrore: number | null;
  sourceUrl: string;
  sourceHash: string;
  parserVersion: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const SOURCE_NSE_CASH = 'https://www.nseindia.com/api/fiidiiTradeReact';
const finite = (value: number | null): value is number => value !== null && Number.isFinite(value);

function numberValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/,/g, '').replace(/[₹%]/g, '');
  if (!normalized || /^[-–—]$/.test(normalized)) return null;
  const negative = normalized.startsWith('(') && normalized.endsWith(')');
  const parsed = Number(normalized.replace(/[()]/g, ''));
  return Number.isFinite(parsed) ? (negative ? -parsed : parsed) : null;
}

function stableHash(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function participantFromCategory(category: unknown): 'FII' | 'DII' | null {
  const normalized = String(category ?? '').toUpperCase();
  if (normalized.includes('FII') || normalized.includes('FPI')) return 'FII';
  if (normalized.includes('DII')) return 'DII';
  return null;
}

export function parseNseCashPayload(payload: unknown): ParsedCashFlow[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const record = row as Record<string, unknown>;
    const participant = participantFromCategory(record.category);
    const date = String(record.date ?? '').trim();
    const buyValue = numberValue(record.buyValue);
    const sellValue = numberValue(record.sellValue);
    const netValue = numberValue(record.netValue);
    if (!participant || !date || !finite(buyValue) || !finite(sellValue) || !finite(netValue)) return [];
    return [{
      participant,
      date,
      buyValue,
      sellValue,
      netValue,
      sourceRef: `live_api:nse:${SOURCE_NSE_CASH}`,
      sourceHash: stableHash(record),
      parserVersion: INDIA_INSTITUTIONAL_PARSER_VERSION,
      sourceFields: record,
    }];
  });
}

function csvRows(csv: string): string[][] {
  return csv.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    const cells: string[] = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { cells.push(current.trim()); current = ''; }
      else current += char;
    }
    cells.push(current.trim());
    return cells;
  });
}

function headerIndex(headers: string[], name: string): number {
  return headers.findIndex((header) => header.toLowerCase() === name.toLowerCase());
}

function oiValue(row: string[], headers: string[], name: string): number | null {
  const index = headerIndex(headers, name);
  return index < 0 ? null : numberValue(row[index]);
}

function buildOi(row: string[], headers: string[]): ParticipantOi | null {
  const long = oiValue(row, headers, 'Future Index Long');
  const short = oiValue(row, headers, 'Future Index Short');
  const callShort = oiValue(row, headers, 'Option Index Call Short');
  const putShort = oiValue(row, headers, 'Option Index Put Short');
  if (![long, short, callShort, putShort].every(finite)) return null;
  return {
    indexFutureLong: long,
    indexFutureShort: short,
    indexFutureNet: long - short,
    indexFutureLongShortRatio: short === 0 ? null : long / short,
    indexCallShort: callShort,
    indexPutShort: putShort,
    putCallPositioning: callShort === 0 ? null : putShort / callShort,
    sourceFields: Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
  };
}

export function parseParticipantOiCsv(csv: string, reportDate = ''): ParsedParticipantOi {
  const rows = csvRows(csv);
  const headers = rows[0] ?? [];
  const clientIndex = headers.findIndex((header) => header.toLowerCase() === 'client type');
  let fii: ParticipantOi | null = null;
  let dii: ParticipantOi | null = null;
  let sawFii = false;
  let sawDii = false;
  for (const row of rows.slice(1)) {
    const participant = participantFromCategory(row[clientIndex]);
    if (participant === 'FII') { sawFii = true; fii = buildOi(row, headers); }
    if (participant === 'DII') { sawDii = true; dii = buildOi(row, headers); }
  }
  const coverage = fii || dii ? 'observed' : 'unavailable';
  const coverageReason = coverage === 'observed'
    ? 'observed'
    : (sawFii || sawDii ? 'missing_required_fields' : 'missing_participant_rows');
  return {
    reportDate,
    fii,
    dii,
    coverage,
    coverageReason,
    sourceHash: stableHash(csv),
    parserVersion: INDIA_INSTITUTIONAL_PARSER_VERSION,
  };
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function sectorKey(label: string): string {
  return label.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function findColumn(headers: string[], terms: string[]): number {
  return headers.findIndex((header) => terms.every((term) => header.includes(term)));
}

export function parseNsdlSectorHtml(html: string, sourceUrl: string, reportPeriodEnd = ''): ParsedSectorObservation[] {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((match) => match[0]);
  const observations: ParsedSectorObservation[] = [];
  for (const table of tables) {
    const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((match) => [...match[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cell) => stripHtml(cell[1])));
    const headerRowIndex = rows.findIndex((row) => row.some((cell) => /sector/i.test(cell)) && row.some((cell) => /auc|aum|asset/i.test(cell)));
    if (headerRowIndex < 0) continue;
    const headers = rows[headerRowIndex].map((header) => header.toLowerCase());
    const sectorIndex = headers.findIndex((header) => /sector/.test(header));
    const equityFlowIndex = findColumn(headers, ['equity', 'net']);
    const totalFlowIndex = findColumn(headers, ['total', 'net']);
    const equityAumIndex = findColumn(headers, ['equity', 'auc']) >= 0 ? findColumn(headers, ['equity', 'auc']) : findColumn(headers, ['equity', 'aum']);
    const totalAumIndex = findColumn(headers, ['total', 'auc']) >= 0 ? findColumn(headers, ['total', 'auc']) : findColumn(headers, ['total', 'aum']);
    for (const row of rows.slice(headerRowIndex + 1)) {
      const label = row[sectorIndex]?.trim();
      if (!label || !/[A-Za-z]/.test(label) || /total|grand/i.test(label)) continue;
      observations.push({
        sectorKey: sectorKey(label),
        sourceSectorLabel: label,
        reportPeriodEnd,
        equityFlowInrCrore: equityFlowIndex >= 0 ? numberValue(row[equityFlowIndex]) : null,
        totalFlowInrCrore: totalFlowIndex >= 0 ? numberValue(row[totalFlowIndex]) : null,
        equityAumInrCrore: equityAumIndex >= 0 ? numberValue(row[equityAumIndex]) : null,
        totalAumInrCrore: totalAumIndex >= 0 ? numberValue(row[totalAumIndex]) : null,
        sourceUrl,
        sourceHash: stableHash(row),
        parserVersion: INDIA_INSTITUTIONAL_PARSER_VERSION,
      });
    }
  }

  // Current NSDL exports use a two-level header. The first level contains
  // four groups (prior AUC, prior-period net investment, current-period net
  // investment, current AUC), while the second level contains the product
  // columns. The existing single-row header strategy cannot identify those
  // merged groups, so retain an explicit fallback keyed to the stable report
  // layout: the final 24 cells are current AUC and the preceding 24 cells are
  // current-period net investment. Within each group, equity is the first INR
  // crore column and total is offset by eleven columns.
  if (!observations.length) {
    for (const table of tables) {
      const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((match) =>
        [...match[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cell) => stripHtml(cell[1]))
      );
      const headerIndex = rows.findIndex((row) => row.some((cell) => /^sectors?$/i.test(cell)));
      if (headerIndex < 0) continue;
      for (const row of rows.slice(headerIndex + 1)) {
        const label = row[1]?.trim();
        if (!label || !/[A-Za-z]/.test(label) || /total|grand/i.test(label) || row.length < 74) continue;
        const flowStart = row.length - 48;
        const aumStart = row.length - 24;
        observations.push({
          sectorKey: sectorKey(label),
          sourceSectorLabel: label,
          reportPeriodEnd,
          equityFlowInrCrore: numberValue(row[flowStart]),
          totalFlowInrCrore: numberValue(row[flowStart + 11]),
          equityAumInrCrore: numberValue(row[aumStart]),
          totalAumInrCrore: numberValue(row[aumStart + 11]),
          sourceUrl,
          sourceHash: stableHash(row),
          parserVersion: INDIA_INSTITUTIONAL_PARSER_VERSION,
        });
      }
      if (observations.length) break;
    }
  }
  return observations;
}

export function validateCashFlow(row: ParsedCashFlow): ValidationResult {
  const errors: string[] = [];
  if (!row.date) errors.push('missing date');
  if (!finite(row.buyValue) || !finite(row.sellValue) || !finite(row.netValue)) errors.push('cash values must be finite');
  if (finite(row.buyValue) && finite(row.sellValue) && finite(row.netValue)) {
    const tolerance = Math.max(1, (Math.abs(row.buyValue) + Math.abs(row.sellValue)) * 0.001);
    if (Math.abs(row.buyValue - row.sellValue - row.netValue) > tolerance) errors.push('net value does not reconcile');
  }
  return { valid: errors.length === 0, errors };
}

export function validateSectorRows(rows: ParsedSectorObservation[]): ValidationResult {
  const errors: string[] = [];
  const keys = new Set<string>();
  for (const row of rows) {
    if (keys.has(row.sectorKey)) errors.push(`duplicate sector: ${row.sectorKey}`);
    keys.add(row.sectorKey);
    if (!row.sourceUrl || !row.reportPeriodEnd) errors.push(`missing source metadata: ${row.sectorKey}`);
    if (!validIsoDate(row.reportPeriodEnd)) errors.push(`malformed report date: ${row.sectorKey}`);
    if (!finite(row.equityAumInrCrore) && !finite(row.totalAumInrCrore)) errors.push(`missing AUM: ${row.sectorKey}`);
    if (finite(row.equityAumInrCrore) && finite(row.totalAumInrCrore) && row.totalAumInrCrore < row.equityAumInrCrore) errors.push(`invalid AUM totals: ${row.sectorKey}`);
    // NSDL's total net investment can differ slightly from equity net flow
    // because the total includes other product buckets with their own signs.
  }
  return { valid: errors.length === 0 && rows.length > 0, errors };
}
