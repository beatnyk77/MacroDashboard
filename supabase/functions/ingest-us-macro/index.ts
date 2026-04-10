/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { sendDiscordAlert } from '../_shared/webhook_utils.ts'

import { processFiscal } from './fiscal.ts'
import { processUST } from './ust.ts'
import { processFred } from './fred.ts'
import { processAuctions } from './auctions.ts'
import { processMaturities } from './maturities.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const fredApiKey = Deno.env.get('FRED_API_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  return runIngestion(supabase, 'ingest-us-macro', async (ctx) => {
    if (!fredApiKey) {
      const errorMsg = 'FRED_API_KEY is not set';
      await sendDiscordAlert('US Macro Ingestion Failed 🚨', errorMsg, true);
      throw new Error(errorMsg);
    }

    // Run all US macro ingestions concurrently 
    const results = await Promise.allSettled([
      processFiscal(supabase, fredApiKey),
      processUST(supabase),
      processFred(supabase, fredApiKey),
      processAuctions(supabase),
      processMaturities(supabase)
    ]);

    let totalRowsInserted = 0;
    const errors: string[] = [];
    const details: any = {};
    const names = ['Fiscal', 'UST', 'FRED', 'Auctions', 'Maturities'];

    results.forEach((result, index) => {
      const taskName = names[index];
      if (result.status === 'fulfilled') {
        const value = result.value as any;
        if (value.success) {
           totalRowsInserted += (value.count || 0);
           details[taskName] = value.details || { count: value.count };
        } else {
           errors.push(`[${taskName}] ${value.error}`);
        }
      } else {
        errors.push(`[${taskName}] Promise rejected: ${result.reason}`);
      }
    });

    if (errors.length > 0) {
      const errorMsg = `US Macro Ingestion encountered errors:\n${errors.join('\n')}`;
      console.error(errorMsg);
      await sendDiscordAlert('US Macro Ingestion Failed 🚨', errorMsg, true);
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
  });
});
