# SEC corporate evidence ingestion

Required function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `SEC_USER_AGENT`, using an identifiable GraphiQuestor name and contact email

The worker reads active issuers from `sec_corporate_issuers`, fetches submissions and XBRL company facts from `data.sec.gov`, and upserts `sec_filing_evidence` by `(cik, accession_number, section_name, evidence_kind)`. It uses at most four issuer workers and the SEC client retries 429 and 5xx responses with bounded backoff.

Apply the migration before deploying the function. Seed the curated issuer registry before the first scheduled run. Monitor `ingestion_logs` and rows with `freshness_status = 'unavailable'`.
