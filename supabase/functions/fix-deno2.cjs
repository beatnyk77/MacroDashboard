const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else if (f.endsWith('.ts')) {
            callback(dirPath);
        }
    });
}

walkDir(__dirname, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix unused @ts-expect-error
    content = content.replace(/\/\/\s*@ts-expect-error: Deno globals and third-party types(: Deno is a global in Supabase Edge Functions)?\n/g, '');

    if (filePath.includes('generate-weekly-regime-digest/index.ts')) {
        content = content.replace(/holisticNarrative,/g, 'holisticNarrative: holisticNarrative || "",');
    }

    if (filePath.includes('get-newsletter-data/index.ts')) {
        content = content.replace(/Object is possibly 'undefined'/g, ''); // ignore
        // fix newsletter usage
        content = content.replace(/if \(newsletter\.metadata/g, 'if (newsletter?.metadata');
        content = content.replace(/newsletter\.metadata\?/g, 'newsletter?.metadata?');
        content = content.replace(/newsletter\.metadata\./g, 'newsletter?.metadata?.');
        content = content.replace(/newsletter\.metrics/g, '(newsletter?.metrics || [])');
        content = content.replace(/m\.current_value > 0/g, '(Number(m?.current_value) > 0)');
        content = content.replace(/m\.current_value/g, 'm?.current_value');
    }

    if (filePath.includes('ingest-daily/sources/fred.ts')) {
        content = content.replace(/metric\.metric_key/g, 'metric.id');
    }

    if (filePath.includes('ingest-eurostat-debt/index.ts')) {
        content = content.replace(/parseFloat\(value\)/g, 'parseFloat(String(value))');
    }

    if (filePath.includes('ingest-gold-debt-coverage/index.ts')) {
        content = content.replace(/return \{ success: true, processed: processedRecords \};/g, 'return { rows_inserted: processedRecords };');
        content = content.replace(/return \{ success: false, processed: 0 \};/g, 'return { rows_inserted: 0 };');
    }

    if (filePath.includes('ingest-market-pulse/index.ts')) {
        content = content.replace(/runIngestion\(supabase,/g, 'runIngestion(supabase as any,');
    }

    if (filePath.includes('ingest-un-comtrade/index.ts')) {
        content = content.replace(/r => r\.partner_code/g, '(r: any) => r.partner_code');
    }

    if (filePath.includes('ingest-upi-autopay/index.ts')) {
        if (!content.includes('import { Buffer }')) {
            content = 'import { Buffer } from "node:buffer";\n' + content;
        }
    }

    if (filePath.includes('ingest-upi-credit/index.ts')) {
        content = content.replace(/const yoyGrowth = /g, 'const yoyGrowth: number = ');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
    }
});
