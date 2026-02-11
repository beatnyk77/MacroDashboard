# GraphiQuestor Passive Operation & Maintenance Guide

This document outlines the setup for passive monitoring and maintenance of the GraphiQuestor dashboard.

## 1. Data Ingestion Cron Verification
Ensure all major data pipelines are scheduled in Supabase `pg_cron`. All schedules are in **UTC**.

| Function Name | Schedule | Frequency | Description |
|---------------|----------|-----------|-------------|
| `ingest-market-pulse` | `0 1 * * *` | Daily | Global market pulse and volatility indicators (Yahoo Finance). |
| `ingest-fred` | `0 6 * * *` | Daily | FRED macro series (Gold, UST, BoJ Assets, etc.). |
| `ingest-fiscaldata` | `30 6 * * *` | Daily | US Treasury fiscal and debt data. |
| `ingest-mospi` | `0 7 * * *` | Daily | MoSPI India Pulse (WPI, IIP, CPI, etc.). |
| `ingest-nyfed-markets` | `0 12 * * *` | Daily | NY Fed market data (RRP, TGA, SOFR). |
| `ingest-gold` | `0 18 * * *` | Daily | Precious metal pricing and depth tracking. |
| `ingest-precious-divergence` | `0 19 * * *` | Daily | Shanghai/London physical gold premium tracking. |
| `ingest-macro-events` | `0 8 * * *` | Daily | Upcoming economic calendar updates (Finnhub). |
| `ingest-oil-eia` | `0 9 * * 3` | Weekly | US Oil refining, imports, and SPR levels. |
| `ingest-ecb-balance-sheet` | `0 10 * * 1` | Weekly | ECB balance sheet updates. |
| `ingest-boj-balance-sheet` | `5 10 * * 1` | Weekly | BoJ balance sheet updates. |
| `ingest-institutional-loans` | `0 4 * * 1` | Weekly | Institutional credit creation tracking. |
| `ingest-macro-news-headlines` | `0 */6 * * *` | 6 Hours | Institutional news sentiment and event headlines. |
| `check-data-health` | `*/30 * * * *` | 30 Mins | Pipeline health and metric staleness check. |
| `ingest-energy` | `0 2 1 * *` | Monthly | India energy security and supplier vulnerability. |
| `ingest-china-macro` | `0 5 1 * *` | Monthly | China GDP, CPI, and Credit Impulse. |
| `ingest-imf-sdr` | `0 8 1 * *` | Monthly | IMF Special Drawing Rights (SDR) allocations. |
| `ingest-cofer` | `0 9 1 * *` | Monthly | IMF COFER currency composition tracking. |
| `ingest-brics` | `30 9 1 * *` | Monthly | BRICS+ gold and reserve tracking. |
| `ingest-tic-foreign-holders`| `0 10 15 * *` | Monthly | Treasury International Capital (TIC) flows. |
| `ingest-upi-autopay` | `15 4 1 * *` | Monthly | UPI Autopay and credit growth metrics. |
| `ingest-gfcf` | `0 2 1 * *` | Monthly | Gross Fixed Capital Formation tracking. |
| `ingest-oil-global` | `0 3 1 * *` | Monthly | Global oil refining (EU, UK, China, India). |
| `ingest-trade-global` | `0 5 1 * *` | Monthly | Global trade stats (Exports/Imports) by region. |
| `ingest-asi` | `0 3 1 8 *` | Annual | Annual Survey of Industries. |

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

## 6. Email Alert Setup (Resend)
The `check-data-health` function triggers an email if >10 issues (stale metrics or failed ingestions) are found.
1. **API Key**: Ensure `RESEND_API_KEY` is set in Supabase Secrets.
2. **Alert Threshold**: Fixed at > 10 issues total.
3. **Recipient**: `graphiquestor@gmail.com`.

## 5. RSS Feed Syndication
The RSS feed is available at `https://graphiquestor.com/rss.xml`. 
Use this to syndicate macro signals to news aggregators or Slack/Discord channels.
