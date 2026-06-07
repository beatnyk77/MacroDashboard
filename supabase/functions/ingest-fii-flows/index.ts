/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// FII equity flow data source:
// SEBI FII/FPI Investment Data
// URL: https://www.sebi.gov.in/statistics/
// Alternatively: RBI DBIE Table 37
// metric_id: india_fii_equity_net_usd_mn
// Frequency: Monthly, released T+15 days
// Unit: USD millions, net (buy - sell)
//
// TODO: Implement ingestion from SEBI 
// data portal or RBI DBIE API

Deno.serve((req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    return new Response(
        JSON.stringify({
            error: "Not Implemented",
            message: "FII flows ingestion worker is not yet implemented. Ingestion is scheduled to be completed in the next phase."
        }),
        {
            status: 501,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        }
    )
})
