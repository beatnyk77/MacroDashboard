import fs from 'fs';

// Reject TLS errors globally for our proxy environment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const token = 'sbp_3d20e0f87ca734184e687a78a6c967b9ee5b4bb3';
const projectRef = 'debdriyzfcwvgrhzzzre';
const functionName = 'ingest-oil-spread';
const filePath = './supabase/functions/ingest-oil-spread/index.ts';

async function deploy() {
    console.log(`[deploy] Reading function code from ${filePath}...`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    console.log(`[deploy] Preparing FormData...`);
    const formData = new FormData();
    
    // Metadata string containing entrypoint and other properties
    const metadata = {
        entrypoint_path: 'index.ts',
        name: functionName,
        verify_jwt: true
    };
    formData.append('metadata', JSON.stringify(metadata));

    // Append file content
    const blob = new Blob([fileContent], { type: 'text/plain' });
    formData.append('file', blob, 'index.ts');

    const url = `https://api.supabase.com/v1/projects/${projectRef}/functions/deploy?slug=${functionName}`;
    console.log(`[deploy] Sending POST request to ${url}...`);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    console.log(`[deploy] Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`[deploy] Response:`, text);

    if (res.ok) {
        console.log(`[deploy] Success! Function ${functionName} deployed successfully.`);
    } else {
        console.error(`[deploy] Failed to deploy function.`);
        process.exit(1);
    }
}

deploy().catch(console.error);
