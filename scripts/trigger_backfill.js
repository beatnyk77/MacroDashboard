const SUPABASE_URL = 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-nse-flows';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc';

async function runBackfill() {
    // Starting from 2016-07-01 since previous run processed up to June 2016
    const startDate = new Date('2016-07-01');
    const endDate = new Date('2026-02-14');
    let current = new Date(startDate);

    while (current < endDate) {
        // Define batch start/end (1 month)
        const batchStart = new Date(current);
        const batchEnd = new Date(current);
        batchEnd.setMonth(batchEnd.getMonth() + 1);
        batchEnd.setDate(batchEnd.getDate() - 1); // Last day of month

        // Cap at global endDate
        if (batchEnd > endDate) {
            batchEnd.setTime(endDate.getTime());
        }

        const startStr = batchStart.toISOString().split('T')[0];
        const endStr = batchEnd.toISOString().split('T')[0];

        console.log(`Processing batch: ${startStr} to ${endStr}...`);

        try {
            const response = await fetch(SUPABASE_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startDate: startStr,
                    endDate: endStr
                })
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`Status ${response.status}: ${text}`);
            } else {
                const data = await response.json();
                console.log(`Success batch ${startStr}: Processed ${data.processedDates} dates`);
            }

        } catch (error) {
            console.error(`Error in batch ${startStr}:`, error.message);
        }

        // Move to next month (first day)
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);

        // Wait 2s between batches to be safe
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log('Backfill complete!');
}

runBackfill();
