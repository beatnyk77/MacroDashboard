/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { sendDiscordAlert } from '../_shared/webhook_utils.ts'

import { processFiscal } from './fiscal.ts'
import { processUST } from './ust.ts'
import { processFred } from './fred.ts'
import { processAuctions } from './auctions.ts'

type SubtaskResult = {
  success?: boolean
  count?: number
  error?: string
  details?: unknown
  message?: string
}

/** Map a sub-processor result into the harness IngestResult contract. */
function toIngestResult(value: SubtaskResult, task: string): IngestResult {
  if (value && value.success === false) {
    return {
      ok: false,
      error: value.error ?? `${task} failed`,
      meta: { task, details: value.details },
    }
  }
  return {
    ok: true,
    counts: { upserted: value?.count ?? 0 },
    meta: {
      task,
      details: value?.details,
      message: value?.message,
    },
  }
}

async function doIngestUSMacro(supabase: any, fredApiKey: string): Promise<IngestResult> {
  // Run US macro ingestions sequentially to avoid WORKER_RESOURCE_LIMIT
  const tasks = [
    { name: 'Fiscal', fn: () => processFiscal(supabase, fredApiKey) },
    { name: 'UST', fn: () => processUST(supabase) },
    { name: 'FRED', fn: () => processFred(supabase, fredApiKey) },
    { name: 'Auctions', fn: () => processAuctions(supabase) },
  ]

  let totalRowsInserted = 0
  const errors: string[] = []
  const details: any = {}

  for (const task of tasks) {
    try {
      const value = await task.fn() as SubtaskResult
      if (value.success) {
        totalRowsInserted += (value.count || 0)
        details[task.name] = value.details || { count: value.count }
      } else {
        errors.push(`[${task.name}] ${value.error}`)
      }
    } catch (err: any) {
      errors.push(`[${task.name}] Error: ${err.message}`)
    }
  }

  if (errors.length > 0) {
    const errorMsg = `US Macro Ingestion encountered errors:\n${errors.join('\n')}`
    console.error(errorMsg)
    await sendDiscordAlert('US Macro Ingestion Failed 🚨', errorMsg, true)
    // Throw to trigger serveIngest retries when any sub-process fails
    throw new Error(errorMsg)
  }

  await sendDiscordAlert(
    'US Macro Ingestion Success ✅',
    `Successfully ingested ${totalRowsInserted} records.`,
    false,
  )

  return {
    ok: true,
    counts: { upserted: totalRowsInserted },
    meta: {
      task: 'all',
      errors,
      details,
      total_rows: totalRowsInserted,
    },
  }
}

/**
 * US macro ingest — fixed harness name `ingest-us-macro`.
 * Optional `?task=` selects a sub-pipeline (fiscal | ust | fred | auctions).
 * Task is recorded in meta.task for ops; logging always uses the base name
 * (serveIngest does not support dynamic log names).
 */
serveIngest('ingest-us-macro', async (req: Request): Promise<IngestResult> => {
  const url = new URL(req.url)
  const task = url.searchParams.get('task')

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const fredApiKey = Deno.env.get('FRED_API_KEY')
  const supabase = createClient(supabaseUrl, supabaseKey)

  if (!fredApiKey) {
    const errorMsg = 'FRED_API_KEY is not set'
    await sendDiscordAlert('US Macro Ingestion Failed 🚨', errorMsg, true)
    throw new Error(errorMsg)
  }

  // serveIngest already provides retries/timeouts
  if (task === 'fiscal') return toIngestResult(await processFiscal(supabase, fredApiKey) as SubtaskResult, 'fiscal')
  if (task === 'ust') return toIngestResult(await processUST(supabase) as SubtaskResult, 'ust')
  if (task === 'fred') return toIngestResult(await processFred(supabase, fredApiKey) as SubtaskResult, 'fred')
  if (task === 'auctions') return toIngestResult(await processAuctions(supabase) as SubtaskResult, 'auctions')

  return doIngestUSMacro(supabase, fredApiKey)
}, { timeoutMs: 25 * 60 * 1000, retries: 3 })
