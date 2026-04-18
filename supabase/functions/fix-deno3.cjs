const fs = require('fs');
const path = require('path');

// 1. Delete deno.d.ts if it exists
const denoDts = path.join(__dirname, 'deno.d.ts');
if (fs.existsSync(denoDts)) {
    fs.unlinkSync(denoDts);
    console.log('Deleted deno.d.ts');
}

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

    // api-auth-middleware
    if (filePath.includes('api-auth-middleware/index.ts')) {
        content = content.replace(/catch \(err\)/g, 'catch (err: any)');
    }

    // generate-weekly-regime-digest
    if (filePath.includes('generate-weekly-regime-digest/index.ts')) {
        content = content.replace(/holistic_narrative\n/g, 'holisticNarrative\n');
        content = content.replace(/holistic_narrative,/g, 'holisticNarrative,');
    }

    // get-newsletter-data
    if (filePath.includes('get-newsletter-data/index.ts')) {
        content = content.replace(/\(Number\(m\?\.current_value\) > 0\)/g, '(m && Number(m.current_value) > 0)');
        content = content.replace(/m\?\.current_value/g, '(m ? m.current_value : 0)');
    }

    // ingest-cofer
    if (filePath.includes('ingest-cofer/index.ts')) {
        content = content.replace(/const val = row\[field\];/g, 'const val = row[field as keyof typeof row];');
    }

    // ingest-gold-debt-coverage
    if (filePath.includes('ingest-gold-debt-coverage/index.ts')) {
        content = content.replace(/\{ success: true, processed: processedRecords \}/g, '{ rows_inserted: processedRecords }');
        content = content.replace(/\{ success: false, processed: 0 \}/g, '{ rows_inserted: 0 }');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
    }
});
