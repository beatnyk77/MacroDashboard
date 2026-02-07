import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Ingest Institutional Loans Data
 * Orchestrates data collection from West (IMF/WB) and East (NDB/JICA/China)
 * Standardizes into Regional/Income Brackets for "Institutional Money Wars" Dashboard
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Starting Institutional Loan ingestion...');

        const asOfDate = '2025-12-31'; // Quarterly snap

        // 1. Unified Dataset (Mocking logic for heterogeneous sources)
        // In production, these would be individual API calls to WB DRS, IMF SDR, and Scrapers for JICA/NDB.
        const loanData = [
            // AFRICA
            { lender_id: 'WORLD_BANK', lender_bloc: 'WEST', region: 'Africa', income: 'Low', type: 'Stock', amount: 45000000000 },
            { lender_id: 'CN_POLICY_BANKS', lender_bloc: 'EAST', region: 'Africa', income: 'Low', type: 'Stock', amount: 62000000000 },
            { lender_id: 'IMF', lender_bloc: 'WEST', region: 'Africa', income: 'Low', type: 'Flow', amount: 5200000000 },
            { lender_id: 'NDB', lender_bloc: 'EAST', region: 'Africa', income: 'Low', type: 'Flow', amount: 4800000000 },

            // SE ASIA
            { lender_id: 'ADB', lender_bloc: 'WEST', region: 'SE_Asia', income: 'Lower_Middle', type: 'Stock', amount: 38000000000 },
            { lender_id: 'CN_POLICY_BANKS', lender_bloc: 'EAST', region: 'SE_Asia', income: 'Lower_Middle', type: 'Stock', amount: 41000000000 },
            { lender_id: 'JICA', lender_bloc: 'EAST', region: 'SE_Asia', income: 'Lower_Middle', type: 'Flow', amount: 2100000000 },
            { lender_id: 'WORLD_BANK', lender_bloc: 'WEST', region: 'SE_Asia', income: 'Lower_Middle', type: 'Flow', amount: 1800000000 },

            // LATIN AMERICA
            { lender_id: 'IMF', lender_bloc: 'WEST', region: 'Latin_America', income: 'Upper_Middle', type: 'Stock', amount: 85000000000 },
            { lender_id: 'CN_POLICY_BANKS', lender_bloc: 'EAST', region: 'Latin_America', income: 'Upper_Middle', type: 'Stock', amount: 22000000000 },
            { lender_id: 'WORLD_BANK', lender_bloc: 'WEST', region: 'Latin_America', income: 'Upper_Middle', type: 'Flow', amount: 3200000000 },
            { lender_id: 'NDB', lender_bloc: 'EAST', region: 'Latin_America', income: 'Upper_Middle', type: 'Flow', amount: 4500000000 }
        ];

        const summary: any = {
            total_attempted: loanData.length,
            upserted: 0,
            errors: []
        };

        const upserts = loanData.map(d => ({
            lender_id: d.lender_id,
            lender_bloc: d.lender_bloc,
            recipient_region: d.region,
            recipient_income_bracket: d.income,
            loan_type: d.type,
            amount_usd: d.amount,
            as_of_date: asOfDate,
            last_updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('institutional_loans')
            .upsert(upserts, { onConflict: 'lender_id, recipient_region, recipient_income_bracket, loan_type, as_of_date' });

        if (error) {
            summary.errors.push(error.message);
        } else {
            summary.upserted = upserts.length;
        }

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Institutional Loan Ingestion Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
