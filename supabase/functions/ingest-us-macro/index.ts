/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { sendDiscordAlert } from '../_shared/webhook_utils.ts'
import { runWithRetry } from '../_shared/job-runner.ts'

import { processFiscal } from './fiscal.ts'
import { processUST } from './ust.ts'
import { processFred } from './fred.ts'
import { processAuctions } from './auctions.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function doIngestUSMacro(supabase: any, fredApiKey: string) {
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
      rows_inserted: totalRowsInserted,
      metadata: {
        errors,
        details,
        total_rows: totalRowsInserted
      }
    };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const task = url.searchParams.get('task');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const fredApiKey = Deno.env.get('FRED_API_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const jobId = task ? `ingest-us-macro-${task}` : 'ingest-us-macro';

  return runIngestion(supabase, jobId, async (ctx) => {
    if (!fredApiKey) {
      const errorMsg = 'FRED_API_KEY is not set';
      await sendDiscordAlert('US Macro Ingestion Failed 🚨', errorMsg, true);
      throw new Error(errorMsg);
    }

    return runWithRetry(
        jobId,
        async () => {
          if (task === 'fiscal') return processFiscal(supabase, fredApiKey);
          if (task === 'ust') return processUST(supabase);
          if (task === 'fred') return processFred(supabase, fredApiKey);
          if (task === 'auctions') return processAuctions(supabase);
          
          // Default: Run all sequentially
          return doIngestUSMacro(supabase, fredApiKey);
        },
        { timeoutMs: 25 * 60 * 1000, maxRetries: 3 } // 25 mins timeout since it's heavy
    );
  });
});
