import { createClient } from '@supabase/supabase-js';

// Supabase credentials - using service role key
const supabaseUrl = 'https://debdriyzfcwvgrhzzzre.supabase.co';
const serviceRoleKey = 'fe95bc684b136a455cb3ae290e273510317e0404e07de14b17f818857faae38e';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runChecks() {
    try {
        console.log('=== Checking 13F ingestion state ===\n');
        
        // Check 1: Recent ingestion_logs for ingest-institutional-13f
        console.log('--- CHECK 1: Recent ingestion_logs (last ~20 minutes) ---');
        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
        
        const { data: logs, error: logsError } = await supabase
            .from('ingestion_logs')
            .select('function_name, status, rows_inserted, start_time, completed_at, status_code, error_message')
            .eq('function_name', 'ingest-institutional-13f')
            .gte('start_time', twentyMinutesAgo)
            .order('start_time', { ascending: false });
            
        if (logsError) throw logsError;
        
        console.log(`Found ${logs?.length || 0} recent ingestion log entries:`);
        if (logs && logs.length > 0) {
            logs.forEach(row => {
                console.log(`  - ${row.start_time} | ${row.status} | rows_inserted: ${row.rows_inserted}${row.error_message ? ' | ERROR: ' + row.error_message : ''}`);
            });
        } else {
            console.log('  No recent ingestion logs found.');
        }
        console.log('');
        
        // Check 2: institutional_13f_holdings status
        console.log('--- CHECK 2: institutional_13f_holdings summary ---');
        const { count: totalRecords } = await supabase
            .from('institutional_13f_holdings')
            .select('*', { count: 'exact', head: true });
            
        const { count: withTopHoldings } = await supabase
            .from('institutional_13f_holdings')
            .select('*', { count: 'exact', head: true })
            .not('top_holdings', 'is', null);
            
        // Note: array_length check might not be directly supported in simple query, approximate
        const { data: dateRange, error: dateError } = await supabase
            .from('institutional_13f_holdings')
            .select('MIN(as_of_date) as min_date, MAX(as_of_date) as max_date')
            .single();
            
        console.log(`Total records: ${totalRecords}`);
        console.log(`With top_holdings (not null): ${withTopHoldings}`);
        if (dateError) {
            console.log(`Date range: ERROR - ${dateError.message}`);
        } else {
            console.log(`Date range: ${dateRange?.min_date} to ${dateRange?.max_date}`);
        }
        console.log('');
        
        // Sample holdings with populated top_holdings
        console.log('--- Sample records with populated top_holdings ---');
        const { data: sampleHoldings, error: sampleError } = await supabase
            .from('institutional_13f_holdings')
            .select('fund_name, cik, as_of_date, top_sectors, total_aum, top_holdings')
            .not('top_holdings', 'is', null)
            .order('as_of_date', { ascending: false })
            .limit(3);
            
        if (sampleError) throw sampleError;
        
        console.log(`Found ${sampleHoldings?.length || 0} sample records:`);
        if (sampleHoldings && sampleHoldings.length > 0) {
            sampleHoldings.forEach((row, idx) => {
                console.log(`\nRecord ${idx + 1}:`);
                console.log(`  Fund: ${row.fund_name} (${row.cik})`);
                console.log(`  As of: ${row.as_of_date}`);
                console.log(`  Total AUM: $${row.total_aum ? row.total_aum.toLocaleString() : 'N/A'}`);
                console.log(`  Top Sectors: ${JSON.stringify(row.top_sectors)}`);
                if (row.top_holdings && row.top_holdings.length > 0) {
                    console.log(`  Top Holdings (${row.top_holdings.length}):`);
                    row.top_holdings.slice(0, 5).forEach((h) => {
                        console.log(`    - ${h.ticker || h.cusip} | ${h.sector || 'N/A'} | $${h.value ? h.value.toLocaleString() : 'N/A'} (${(h.concentration_contribution * 100).toFixed(1)}%)`);
                    });
                }
            });
        } else {
            console.log('  No records with populated top_holdings found.');
        }
        console.log('');
        
        // Check 3: cusip_ticker_cache status
        console.log('--- CHECK 3: cusip_ticker_cache summary ---');
        const { count: cacheTotal } = await supabase
            .from('cusip_ticker_cache')
            .select('*', { count: 'exact', head: true });
            
        const { count: cacheWithTickers } = await supabase
            .from('cusip_ticker_cache')
            .select('*', { count: 'exact', head: true })
            .not('ticker', 'is', null);
            
        const { count: cacheWithoutTickers } = await supabase
            .from('cusip_ticker_cache')
            .select('*', { count: 'exact', head: true })
            .is('ticker', null);
            
        const { data: cacheDateRange, error: cacheDateError } = await supabase
            .from('cusip_ticker_cache')
            .select('MIN(fetched_at) as min_fetch, MAX(fetched_at) as max_fetch')
            .single();
            
        console.log(`Total entries: ${cacheTotal}`);
        console.log(`With tickers: ${cacheWithTickers}`);
        console.log(`Without tickers (failed lookups): ${cacheWithoutTickers}`);
        if (cacheDateError) {
            console.log(`Date range: ERROR - ${cacheDateError.message}`);
        } else {
            console.log(`Date range: ${cacheDateRange?.min_fetch} to ${cacheDateRange?.max_fetch}`);
        }
        console.log('');
        
        // Sample cache entries
        console.log('--- Sample cusip_ticker_cache entries ---');
        const { data: sampleCache, error: cacheSampleError } = await supabase
            .from('cusip_ticker_cache')
            .select('cusip, ticker, company_name, sector, fetched_at, last_used_at')
            .order('fetched_at', { ascending: false })
            .limit(5);
            
        if (cacheSampleError) throw cacheSampleError;
        
        if (sampleCache && sampleCache.length > 0) {
            sampleCache.forEach((row, idx) => {
                console.log(`  ${idx + 1}. CUSIP: ${row.cusip} => Ticker: ${row.ticker || 'NULL'} | ${row.company_name || 'N/A'} | Sector: ${row.sector || 'N/A'}`);
                console.log(`     Fetched: ${row.fetched_at}, Last used: ${row.last_used_at || 'never'}`);
            });
        } else {
            console.log('  No cache entries found.');
        }
        console.log('');
        
    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.details) console.error('Details:', error.details);
        if (error.hint) console.error('Hint:', error.hint);
        process.exit(1);
    }
}

runChecks();
