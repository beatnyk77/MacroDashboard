# GraphiQuestor Passive Operation & Maintenance Guide

This document outlines the setup for passive monitoring and maintenance of the GraphiQuestor dashboard.

## 1. Data Ingestion Cron Verification
Ensure all major data pipelines are scheduled in Supabase `pg_cron`.

| Function | Schedule | Description |
|----------|----------|-------------|
| `ingest-fred` | `0 6 * * *` | Daily macro data (Gold, UST, BoJ) |
| `ingest-fiscaldata` | `30 6 * * *` | US Treasury data |
| `ingest-mospi` | `0 7 * * *` | India Macro Pulse data |
| `ingest-asi` | `0 1 * 1 *` | Annual Survey of Industries (Monthly/Yearly) |
| `check-data-health` | `*/30 * * * *` | Heartbeat & Staleness check |

## 2. Uptime Monitoring (UptimeRobot)
To ensure the site is always live and responsive:
- **Service**: [UptimeRobot](https://uptimerobot.com/) (Free Tier)
- **Target URL**: `https://graphiquestor.com`
- **Interval**: 5 minutes
- **Alerts**: Email to `graphiquestor@gmail.com`

## 3. CDN & Caching (Cloudflare)
Cloudflare is used for edge caching and global performance.
- **Plan**: Free Tier
- **Optimization**:
  - Enable **Auto Minify** (JS, CSS, HTML).
  - Enable **Brotli** compression.
  - Set **Browser Cache TTL** to 1 month.
  - Enable **India PoP** (Default in Free tier near major cities).
- **Security**:
  - Enable **Always Use HTTPS**.
  - Enable **WAF** managed rules (Basic).

## 4. Error Monitoring & Notifications
All Edge Functions log their status to the `ingestion_logs` table.
To receive email alerts on failure, use the `notify_on_failure` Edge Function (requires SendGrid/Resend API Key).

### SQL for Manual Health Check
```sql
SELECT function_name, status, error_message, start_time 
FROM ingestion_logs 
WHERE status = 'failed' 
ORDER BY start_time DESC 
LIMIT 10;
```

## 5. RSS Feed Syndication
The RSS feed is available at `https://graphiquestor.com/rss.xml`. 
Use this to syndicate macro signals to news aggregators or Slack/Discord channels.
