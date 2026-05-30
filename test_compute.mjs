import dotenv from 'dotenv';
dotenv.config();

const url = `${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}/functions/v1/compute-daily-macro-signal`;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
    console.log(`Calling ${url}...`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });
        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

run();
