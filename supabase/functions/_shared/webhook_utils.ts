/**
 * Utilities for sending alerts to a Discord Webhook.
 * Expects the environment variable SUPABASE_DISCORD_WEBHOOK_URL to be set.
 */

/* eslint-disable no-undef */
export async function sendDiscordAlert(title: string, description: string, isError: boolean = true) {
  const webhookUrl = Deno.env.get('SUPABASE_DISCORD_WEBHOOK_URL');
  
  if (!webhookUrl) {
    console.warn('SUPABASE_DISCORD_WEBHOOK_URL is not set. Skipping alert:', title);
    return;
  }

  const payload = {
    username: "MacroDashboard Alerts",
    embeds: [
      {
        title: title,
        description: description,
        color: isError ? 16711680 : 65280, // Red for error, Green for success
        timestamp: new Date().toISOString(),
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`Failed to send Discord alert, status: ${response.status}`);
    }
  } catch (err) {
    console.error('Exception sending Discord alert', err);
  }
}
