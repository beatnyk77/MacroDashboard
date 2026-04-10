/* eslint-disable no-undef */
export async function sendSlackAlert(text: string) {
  const url = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!url) {
    console.warn('SLACK_WEBHOOK_URL not set, skipping alert');
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Slack API returned ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}
