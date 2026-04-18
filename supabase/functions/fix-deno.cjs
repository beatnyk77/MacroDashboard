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

    // Remove @ts-expect-error Deno globals
    content = content.replace(/\/\/\s*@ts-expect-error: Deno globals and third-party types: Deno is available in Supabase Edge Functions\n/g, '');
    content = content.replace(/\/\/\s*@ts-expect-error\n/g, '');

    // Replace catch (error) with catch (error: any)
    content = content.replace(/catch \((error|e)\) \{/g, 'catch ($1: any) {');
    
    // Replace Cannot find name 'executive_summary' in generate-weekly-regime-digest
    if (filePath.includes('generate-weekly-regime-digest/index.ts')) {
        content = content.replace(/executive_summary/g, 'executiveSummary');
        content = content.replace(/catch \(error: any\)/g, 'catch (error: any)');
    }
    
    // Fix get-newsletter-data
    if (filePath.includes('get-newsletter-data/index.ts')) {
        content = content.replace(/const newsletters = data\.newsletters;/g, 'const newsletters = data;');
        content = content.replace(/const newsletter = newsletters\[0\];/g, 'const newsletter = newsletters?.[0];');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
    }
});
