import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

const cronSchedules = new Map();
const functionSchedules = new Map();

for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const regex = /url\s*:=\s*'https:\/\/[^/]+\/functions\/v1\/([^']+)'/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const funcName = match[1];
        const isBeforeWipe = file < '20260310000001'; // 20260310000001 is the big wipe
        
        if (!functionSchedules.has(funcName)) {
            functionSchedules.set(funcName, { before: false, after: false, files: [] });
        }
        if (isBeforeWipe) {
            functionSchedules.get(funcName).before = true;
        } else {
            functionSchedules.get(funcName).after = true;
        }
        functionSchedules.get(funcName).files.push(file);
    }
}

console.log("=== FUNCTIONS SCHEDULED BEFORE WIPE BUT NOT AFTER ===");
let count = 0;
for (const [funcName, status] of functionSchedules.entries()) {
    if (status.before && !status.after) {
        console.log(`- ${funcName} (Originally found in: ${status.files.join(', ')})`);
        count++;
    }
}
if (count === 0) console.log("None!");

const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
const allFunctions = fs.readdirSync(functionsDir).filter(f => !f.includes('.') && !f.startsWith('_'));

console.log("\n=== FUNCTIONS IN DIR BUT NEVER SCHEDULED (Might be webhooks, manual, or missing) ===");
for (const func of allFunctions) {
    if (!functionSchedules.has(func)) {
        console.log(`- ${func}`);
    }
}
