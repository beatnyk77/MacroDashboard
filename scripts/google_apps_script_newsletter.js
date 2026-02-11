/**
 * GraphiQuestor Automated Monthly Newsletter
 * 
 * Triggers: Time-driven (1st of Month, 9 AM IST)
 * API Dependencies: Supabase (Data), Twitter/X (Social), Substack (Draft)
 */

// Configuration
const CONFIG = {
    SUPABASE_URL: 'https://debdriyzfcwvgrhzzzre.supabase.co', // Replace with your project URL
    // SUPABASE_FUNCTION_KEY: 'YOUR_ANON_KEY', // Store in Script Properties - INJECTED BELOW FOR EASE OF USE
    FUNCTION_ENDPOINT: '/functions/v1/get-newsletter-data',
    EMAIL_RECIPIENTS: ['graphiquestor@gmail.com'], // Add subscriber list logic here
    TWITTER_API_KEY: 'YOUR_TWITTER_KEY', // Store in Script Properties
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc'
};

/**
 * Main function to generate and send the newsletter.
 * Run this function manually to test, or set as a trigger.
 */
function generateAndSendNewsletter() {
    const data = fetchNewsletterData();
    if (!data) {
        Logger.log("Failed to fetch data via Supabase.");
        return;
    }

    const htmlBody = generateHtml(data);
    const subject = data.title;

    // 1. Send Email
    MailApp.sendEmail({
        to: CONFIG.EMAIL_RECIPIENTS.join(','),
        subject: subject,
        htmlBody: htmlBody,
        name: "GraphiQuestor Bot"
    });
    Logger.log("Email sent to " + CONFIG.EMAIL_RECIPIENTS.length + " recipients.");

    // 2. Post to Socials (Placeholder for API logic)
    // postToTwitter(data.summary);
}

/**
 * Fetches aggregated macro data from Supabase Edge Function.
 */
function fetchNewsletterData() {
    const url = CONFIG.SUPABASE_URL + CONFIG.FUNCTION_ENDPOINT;
    const options = {
        method: 'post',
        headers: {
            'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        },
        muteHttpExceptions: true
    };

    try {
        const response = UrlFetchApp.fetch(url, options);
        const code = response.getResponseCode();
        if (code === 200) {
            return JSON.parse(response.getContentText());
        } else {
            Logger.log("Error: " + code + " - " + response.getContentText());
            return null;
        }
    } catch (e) {
        Logger.log("Exception: " + e.toString());
        return null;
    }
}

/**
 * Generates the HTML content for the email.
 */
function generateHtml(data) {
    let metricsRows = '';
    if (data.metrics) {
        data.metrics.forEach(m => {
            const color = parseFloat(m.pctChange) >= 0 ? '#10b981' : '#ef4444';
            const arrow = parseFloat(m.pctChange) >= 0 ? '▲' : '▼';
            metricsRows += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #333;">${m.name}</td>
                <td style="padding: 12px; text-align: right;">${m.current.toLocaleString()}</td>
                <td style="padding: 12px; text-align: right; color: ${color}; font-weight: 600;">
                    ${arrow} ${m.pctChange}%
                </td>
                <td style="padding: 12px; font-size: 12px; color: #666;">${m.insight}</td>
            </tr>
          `;
        });
    }

    let eventsList = '';
    if (data.events && data.events.length > 0) {
        data.events.forEach(e => {
            eventsList += `<li style="margin-bottom: 8px;"><strong>${e.date}:</strong> ${e.event_name} <span style="color:#888;">(${e.impact_level || 'Medium'})</span></li>`;
        });
    } else {
        eventsList = '<li>No major events scheduled yet.</li>';
    }

    return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <!-- Header -->
      <div style="background-color: #0f172a; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">GraphiQuestor</h1>
        <p style="color: #94a3b8; margin: 5px 0 0; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Monthly Macro Observer</p>
      </div>

      <!-- Content -->
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">Market Pulse</h2>
        <p style="color: #475569; line-height: 1.6;">${data.summary}</p>

        <h3 style="color: #334155; margin-top: 25px;">Key Metric Shifts (MoM)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead style="background-color: #f8fafc;">
                <tr>
                    <th style="padding: 10px; text-align: left; color: #64748b;">Metric</th>
                    <th style="padding: 10px; text-align: right; color: #64748b;">Value</th>
                    <th style="padding: 10px; text-align: right; color: #64748b;">Change</th>
                    <th style="padding: 10px; text-align: left; color: #64748b;">Signal</th>
                </tr>
            </thead>
            <tbody>
                ${metricsRows}
            </tbody>
        </table>

        <h3 style="color: #334155; margin-top: 25px;">Horizon Scan (Next 30 Days)</h3>
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px;">
            <ul style="margin: 0; padding-left: 20px; color: #475569;">
                ${eventsList}
            </ul>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <a href="https://graphiquestor.com" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full Dashboard</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
        <p>&copy; 2026 GraphiQuestor. Built with ❤️ and Algo-Intelligence.</p>
        <p><a href="#" style="color: #94a3b8;">Unsubscribe</a></p>
      </div>
    </div>
  `;
}
