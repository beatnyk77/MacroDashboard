/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

async function doIngest(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
    const mockIPOs = [
        {
            company_name: "Bharat Semiconductors Ltd",
            issue_size_cr: 1250.0,
            price_band_min: 450,
            price_band_max: 475,
            open_date: "2026-03-05",
            close_date: "2026-03-08",
            listing_date: "2026-03-15",
            sector: "Technology",
            macro_risk_score: 35,
            exchange: "Both",
            status: "Upcoming",
            draft_prospectus_url: "https://www.sebi.gov.in/filings/public-issues/mar-2026/bharat-semi-drhp.pdf"
        },
        {
            company_name: "IndiGreen Renewables",
            issue_size_cr: 840.5,
            price_band_min: 110,
            price_band_max: 120,
            open_date: "2026-02-27",
            close_date: "2026-03-02",
            listing_date: "2026-03-10",
            sector: "Energy",
            macro_risk_score: 42,
            exchange: "NSE",
            status: "Open",
            draft_prospectus_url: "https://www.sebi.gov.in/filings/public-issues/feb-2026/indigreen-drhp.pdf"
        },
        {
            company_name: "Quartz Logistics Corp",
            issue_size_cr: 2100.0,
            price_band_min: 85,
            price_band_max: 92,
            open_date: "2026-03-12",
            close_date: "2026-03-15",
            listing_date: "2026-03-22",
            sector: "Logistics",
            macro_risk_score: 65,
            exchange: "Both",
            status: "Upcoming",
            draft_prospectus_url: "https://www.sebi.gov.in/filings/public-issues/mar-2026/quartz-drhp.pdf"
        }
    ]

    const { error: upsertError } = await supabase
        .from('cie_upcoming_ipos')
        .upsert(mockIPOs, { onConflict: 'company_name' })

    if (upsertError) throw upsertError

    return {
        ok: true,
        counts: { upserted: mockIPOs.length, skipped: 0 },
        meta: { message: "Successfully ingested IPO calendar data" }
    }
}

serveIngest('ingest-cie-ipos', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    return doIngest(supabase)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
