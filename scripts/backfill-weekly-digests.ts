/**
 * Backfill weekly regime digests for all missing weeks
 * This script fills in missing digests from April 19, 2026 to present
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://debdriyzfcwvgrhzzzre.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Generate array of Sunday dates from April 19, 2026 onwards
function getSundayDates(): string[] {
  const dates: string[] = [];

  // Start from April 19, 2026 (which is a Saturday) - get the Sunday after
  let current = new Date('2026-04-19');
  current.setUTCDate(current.getUTCDate() + 1); // Move to April 20 (Sunday)

  const today = new Date();

  while (current <= today) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);

    // Move to next Sunday
    current.setUTCDate(current.getUTCDate() + 7);
  }

  return dates;
}

async function backfillDigests() {
  const weeks = getSundayDates();

  console.log(`📊 Backfilling ${weeks.length} weeks of digests...`);
  console.log(`   From: ${weeks[0]} to ${weeks[weeks.length - 1]}\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const weekDate of weeks) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-weekly-regime-digest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ week_ending_date: weekDate }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${weekDate}: ${data.digest?.executive_summary?.substring(0, 60)}...`);
        successCount++;
      } else {
        const error = await response.text();
        console.error(`❌ ${weekDate}: ${response.status} - ${error}`);
        failureCount++;
      }
    } catch (error) {
      console.error(`❌ ${weekDate}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failureCount++;
    }

    // Rate limiting - pause between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📈 Results: ${successCount} succeeded, ${failureCount} failed`);

  if (failureCount > 0) {
    process.exit(1);
  }
}

backfillDigests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
