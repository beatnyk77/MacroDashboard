import fs from 'fs';
import path from 'path';

const missingFuncs = [
'compute-hs-opportunity-scores',
'generate-export-scout',
'ingest-asi',
'ingest-china-defaults',
'ingest-commodity-terminal',
'ingest-country-metrics',
'ingest-daily',
'ingest-eurostat-debt',
'ingest-events',
'ingest-financial-hubs-gold',
'ingest-gfcf',
'ingest-global-liquidity',
'ingest-imf',
'ingest-imf-gdp-per-capita',
'ingest-macro-events',
'ingest-mospi',
'ingest-rbi-fx-defense',
'ingest-shadow-trade',
'ingest-tic-foreign-holders',
'ingest-trade-global-pulse',
'ingest-trade-gravity',
'ingest-un-comtrade',
'ingest-us-edgar-fundamentals'
];

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

for (const func of missingFuncs) {
    let lastSchedule = null;
    let lastFile = null;
    
    for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Match standard helper
        let regex1 = new RegExp(`schedule_standard_cron\\([^,]+,\\s*'([^']+)',\\s*'${func}'`, 'g');
        let m = regex1.exec(content);
        if (m) {
            lastSchedule = m[1];
            lastFile = file;
        }
        
        // Match raw cron.schedule with http_post
        let regex2 = new RegExp(`cron\\.schedule\\([^,]+,\\s*'([^']+)',[^;]+${func}`, 'g');
        m = regex2.exec(content);
        if (m) {
            lastSchedule = m[1];
            lastFile = file;
        }
    }
    
    if (lastSchedule) {
        console.log(`${func}: ${lastSchedule} (from ${lastFile})`);
    } else {
        console.log(`${func}: NEVER SCHEDULED IN MIGRATIONS`);
    }
}
