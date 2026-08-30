# Corporate signal computation

This worker reads normalized SEC evidence and writes versioned component observations to `sec_corporate_signals`. Version `v1.0.0` currently covers cash runway and capex impulse. Signals are issuer-relative observations with evidence IDs and comparison windows. The worker does not emit an aggregate investment score or recommendation.

Run it after `ingest-sec-corporate` so the latest filing evidence is available. Missing facts produce no signal rather than a placeholder value.
