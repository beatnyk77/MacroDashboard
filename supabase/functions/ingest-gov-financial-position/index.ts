/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { fetchWithRetry } from '../_shared/ingest_utils.ts';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

const BASE = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
const PAGE = 10000;

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === 'null' || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchAll(path: string, extraQuery = ''): Promise<any[]> {
  const rows: any[] = [];
  let page = 1;
  for (;;) {
    const url =
      `${BASE}/${path}?page%5Bsize%5D=${PAGE}&page%5Bnumber%5D=${page}&format=json` +
      (extraQuery ? `&${extraQuery}` : '');
    const res = await fetchWithRetry(url, { timeoutMs: 60_000, maxRetries: 2 });
    const json = await res.json();
    const data = json?.data ?? [];
    rows.push(...data);
    if (data.length < PAGE) break;
    page += 1;
    if (page > 200) break; // safety
  }
  return rows;
}

async function upsertChunk(supabase: any, table: string, rows: any[], onConflict: string) {
  if (!rows.length) return 0;
  const chunk = 500;
  let n = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await supabase.from(table).upsert(slice, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
    n += slice.length;
  }
  return n;
}

serveIngest('ingest-gov-financial-position', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const url = new URL(req.url);
  const backfill = url.searchParams.get('backfill') === 'true';
  const counts: Record<string, number> = {};
  const errors: string[] = [];

  // 1) Net Cost
  try {
    const raw = await fetchAll('v2/accounting/od/statement_net_cost');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      agency_nm: r.agency_nm,
      gross_cost_bil: num(r.gross_cost_bil_amt),
      earned_revenue_bil: num(r.earned_revenue_bil_amt),
      change_assumptions_bil: num(r.change_assumptions_bil_amt),
      net_cost_bil: num(r.net_cost_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v2/accounting/od/statement_net_cost',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_net_cost = await upsertChunk(
      supabase, 'frusg_net_cost', rows,
      'stmt_fiscal_year,restmt_flag,agency_nm,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`net_cost: ${e.message}`);
  }

  // 2) Balance sheets
  try {
    const raw = await fetchAll('v2/accounting/od/balance_sheets');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      account_desc: r.account_desc,
      line_item_desc: r.line_item_desc,
      position_bil: num(r.position_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v2/accounting/od/balance_sheets',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_balance_sheet = await upsertChunk(
      supabase, 'frusg_balance_sheet', rows,
      'stmt_fiscal_year,restmt_flag,account_desc,line_item_desc,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`balance_sheet: ${e.message}`);
  }

  // 3) Net position
  try {
    const raw = await fetchAll('v1/accounting/od/net_position');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      account_desc: r.account_desc,
      line_item_desc: r.line_item_desc,
      non_dedicated_funds_bil: num(r.non_dedicated_funds_bil_amt),
      dedicated_funds_bil: num(r.dedicated_funds_bil_amt),
      eliminations_bil: num(r.eliminations_bil_amt),
      consolidated_bil: num(r.consolidated_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/od/net_position',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_net_position = await upsertChunk(
      supabase, 'frusg_net_position', rows,
      'stmt_fiscal_year,restmt_flag,account_desc,line_item_desc,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`net_position: ${e.message}`);
  }

  // 4) Reconciliations
  try {
    const raw = await fetchAll('v1/accounting/od/reconciliations');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      account_desc: r.account_desc,
      component_desc: r.component_desc ?? null,
      line_item_desc: r.line_item_desc,
      position_bil: num(r.position_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/od/reconciliations',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_reconciliations = await upsertChunk(
      supabase, 'frusg_reconciliations', rows,
      'stmt_fiscal_year,restmt_flag,account_desc,line_item_desc,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`reconciliations: ${e.message}`);
  }

  // 5) Cash balance
  try {
    const raw = await fetchAll('v1/accounting/od/cash_balance');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      account_desc: r.account_desc,
      component_desc: r.component_desc ?? null,
      line_item_desc: r.line_item_desc,
      position_bil: num(r.position_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/od/cash_balance',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_cash_balance = await upsertChunk(
      supabase, 'frusg_cash_balance', rows,
      'stmt_fiscal_year,restmt_flag,account_desc,line_item_desc,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`cash_balance: ${e.message}`);
  }

  // 6) MTS Table 5 — full history if backfill; else last ~24 months via record_date filter
  try {
    const extra = backfill
      ? ''
      : `filter=record_date:gte:${new Date(Date.now() - 1000 * 60 * 60 * 24 * 800).toISOString().slice(0, 10)}`;
    const raw = await fetchAll('v1/accounting/mts/mts_table_5', extra);
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      classification_id: String(r.classification_id),
      parent_id: r.parent_id != null ? String(r.parent_id) : null,
      classification_desc: r.classification_desc,
      current_month_net_outly: num(r.current_month_net_outly_amt),
      current_fytd_net_outly: num(r.current_fytd_net_outly_amt),
      prior_fytd_net_outly: num(r.prior_fytd_net_outly_amt),
      data_type_cd: r.data_type_cd ?? null,
      record_type_cd: r.record_type_cd ?? null,
      sequence_level_nbr: r.sequence_level_nbr != null ? String(r.sequence_level_nbr) : null,
      line_code_nbr: r.line_code_nbr != null ? String(r.line_code_nbr) : null,
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/mts/mts_table_5',
      ingested_at: new Date().toISOString(),
    }));
    counts.mts_agency_outlays = await upsertChunk(
      supabase, 'mts_agency_outlays', rows,
      'record_date,classification_id,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`mts_table_5: ${e.message}`);
  }

  // 7) Receipts by department
  try {
    const raw = await fetchAll('v1/accounting/od/receipts_by_department');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      receipt_line_item_nm: r.receipt_line_item_nm,
      aid_cd: String(r.aid_cd),
      a_cd: r.a_cd === 'null' || r.a_cd == null ? null : String(r.a_cd),
      main_cd: String(r.main_cd),
      sub_cd: String(r.sub_cd),
      receipt_amt: num(r.receipt_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/od/receipts_by_department',
      ingested_at: new Date().toISOString(),
    }));
    counts.treasury_receipts_by_dept = await upsertChunk(
      supabase, 'treasury_receipts_by_dept', rows,
      'record_date,aid_cd,main_cd,sub_cd,receipt_line_item_nm,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`receipts: ${e.message}`);
  }

  const anyOk = Object.values(counts).some((c) => c > 0);
  if (!anyOk) {
    return { ok: false, error: errors.join('; ') || 'No rows upserted', counts };
  }
  return {
    ok: true,
    counts,
    meta: { errors: errors.length ? errors : undefined, backfill },
  };
}, { timeoutMs: 45 * 60 * 1000 });
