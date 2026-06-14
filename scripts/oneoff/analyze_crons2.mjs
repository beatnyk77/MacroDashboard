import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql') && f >= '20260408000000').sort();

const scheduledFunctions = new Set();

for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern 1: schedule_standard_cron(..., ..., 'func-name')
    let regex = /schedule_standard_cron\([^,]+,\s*'[^']+',\s*'([^']+)'/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        scheduledFunctions.add(match[1]);
    }
    
    // Pattern 2: url := '.../functions/v1/func-name'
    regex = /url\s*:=\s*'https:\/\/[^/]+\/functions\/v1\/([^']+)'/g;
    while ((match = regex.exec(content)) !== null) {
        scheduledFunctions.add(match[1]);
    }
}

scheduledFunctions.add('ingest-upi-autopay'); // we just added this one

const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
const allFunctions = fs.readdirSync(functionsDir).filter(f => !f.includes('.') && !f.startsWith('_'));

console.log("Functions missing from schedules after 20260408000000:");
const missing = [];
for (const func of allFunctions) {
    if (!scheduledFunctions.has(func) && (func.startsWith('ingest-') || func.startsWith('compute-') || func.startsWith('generate-'))) {
        missing.push(func);
    }
}
missing.sort();
for (const m of missing) console.log("- " + m);
