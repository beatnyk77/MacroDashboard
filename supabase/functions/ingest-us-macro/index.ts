/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { sendDiscordAlert } from '../_shared/webhook_utils.ts'

import { processFiscal } from './fiscal.ts'
import { processUST } from './ust.ts'
import { processFred } from './fred.ts'
import { processAuctions } from './auctions.ts'

async function doIngestUSMacro(supabase: any, fredApiKey: string): Promise<IngestResult> {
    // Run US macro ingestions sequentially to avoid WORKER_RESOURCE_LIMIT
    const tasks = [
      { name: 'Fiscal', fn: () => processFiscal(supabase, fredApiKey) },
      { name: 'UST', fn: () => processUST(supabase) },
      { name: 'FRED', fn: () => processFred(supabase, fredApiKey) },
      { name: 'Auctions', fn: () => processAuctions(supabase) }
    ];

    let totalRowsInserted = 0;
    const errors: string[] = [];
    const details: any = {};

    for (const task of tasks) {
      try {
        const value = await task.fn() as any;
        if (value.success) {
           totalRowsInserted += (value.count || 0);
           details[task.name] = value.details || { count: value.count };
        } else {
           errors.push(`[${task.name}] ${value.error}`);
        }
      } catch (err: any) {
        errors.push(`[${task.name}] Error: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      const errorMsg = `US Macro Ingestion encountered errors:\n${errors.join('\n')}`;
      console.error(errorMsg);
      await sendDiscordAlert('US Macro Ingestion Failed 🚨', errorMsg, true);
      // Throw error to trigger retry if any of the sub-processes fail
      throw new Error(errorMsg);
    } else {
      await sendDiscordAlert('US Macro Ingestion Success ✅', `Successfully ingested ${totalRowsInserted} records.`, false);
    }

    return {
      ok: true,
      counts: { upserted: totalRowsInserted, skipped: 0 },
      meta: { errors, details, total_rows: totalRowsInserted }
    };
}

serveIngest('ingest-us-macro', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
  if (!fredApiKey) {
    const errorMsg = 'FRED_API_KEY is not set';
    await sendDiscordAlert('US Macro Ingestion Failed 🚨', errorMsg, true);
    throw new Error(errorMsg);
  }

  const task = new URL(req.url).searchParams.get('task');

  if (task === 'fiscal') {
    const value = await processFiscal(supabase, fredApiKey) as any;
    return { ok: true, counts: { upserted: value.count || 0, skipped: 0 }, meta: value.details || {} };
  }
  if (task === 'ust') {
    const value = await processUST(supabase) as any;
    return { ok: true, counts: { upserted: value.count || 0, skipped: 0 }, meta: value.details || {} };
  }
  if (task === 'fred') {
    const value = await processFred(supabase, fredApiKey) as any;
    return { ok: true, counts: { upserted: value.count || 0, skipped: 0 }, meta: value.details || {} };
  }
  if (task === 'auctions') {
    const value = await processAuctions(supabase) as any;
    return { ok: true, counts: { upserted: value.count || 0, skipped: 0 }, meta: value.details || {} };
  }

  // Default: Run all sequentially
  return doIngestUSMacro(supabase, fredApiKey);
}, { timeoutMs: 25 * 60 * 1000, retries: 3 })
