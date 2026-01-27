# Frequency & Staleness Handling Strategy

This document details how the Macro Intelligence Dashboard handles data with different update cadences (Daily vs Monthly vs Quarterly) and how it communicates data freshness to the user.

## The Challenge

Macroeconomic data arrives at different speeds:
*   **Market Data (SPX, Gold, Yields)**: Daily / Real-time
*   **Treasury Data (Issuance, SOMA)**: Daily to Weekly
*   **Macro Data (CPI, M2, GDP)**: Monthly or Quarterly
*   **Structural Data (IMF Reserves)**: Quarterly with 2-3 month lag

Mixing these on a single dashboard requires a robust strategy to avoid misleading comparisons (e.g., comparing today's Gold price to last quarter's M2).

## Core Concepts

### 1. Frequency Definitions

We track two types of frequency for every metric in the `metrics` table:

*   **`native_frequency`**: The immutable reality of the data source.
    *   *Values*: `daily`, `weekly`, `monthly`, `quarterly`, `annual`
    *   *Usage*: Determines the `expected_interval_days` for staleness checks.

*   **`display_frequency`**: How the user expects to see it on a chart.
    *   *Values*: Same as above.
    *   *Usage*: A monthly metric (e.g., CPI) might be displayed on a daily chart by "striding" (repeating the value) or effectively joining it against a daily date spine, but visually valid only at the sample points.

### 2. Staleness Logic

We classify every observation into one of three states. This logic is embedded in the `vw_latest_metrics` view.

| Status | Condition (Logic) | UI Representation |
| :--- | :--- | :--- |
| **Fresh** | `Time Since Update <= Expected Interval` | No badge (Default) |
| **Lagged** | `Expected Interval < Time Since Update <= 2x Interval` | Warning Badge (Yellow) "Updated 5d ago" |
| **Very Lagged** | `Time Since Update > 2x Interval` | Error Badge (Red) "Stale (>90d)" |

**Example:**
*   **US_CPI_YOY** (Monthly, Expected: ~35 days to account for release lag)
    *   *Day 1-30*: Fresh
    *   *Day 31-70*: Fresh (still within reasonable release window)
    *   *Day 70+*: Lagged (missed a release)

### 3. Idempotent Upserts & Versioning

To ensure data consistency when re-processing history:

1.  **Primary Key**: `(metric_id, as_of_date)` prevents duplicates.
2.  **Conflict Strategy**: `ON CONFLICT DO UPDATE SET value = EXCLUDED.value`.
3.  **Composite Versioning**: The `composite_version` column allows us to flag observations calculated with an older algorithm. If we update the "Liquidity Index" formula, we increment the version in code. The DB then holds mixed versions until backfill is complete, and the UI can preferentially select `MAX(composite_version)`.

## Implementation Details

### SQL View Logic
Computed dynamically in `vw_latest_metrics`:

```sql
CASE 
  WHEN EXTRACT(EPOCH FROM (NOW() - last_updated_at)) / 86400 <= expected_interval_days THEN 'fresh'
  WHEN EXTRACT(EPOCH FROM (NOW() - last_updated_at)) / 86400 <= expected_interval_days * 2 THEN 'lagged'
  ELSE 'very_lagged'
END AS staleness_flag
```

### UI Component Contract
The frontend `StateCard` component receives:
```typescript
interface MetricSnapshot {
  value: number;
  staleness_flag: 'fresh' | 'lagged' | 'very_lagged';
  last_updated_at: string;
  native_frequency: string;
}
```
If `staleness_flag !== 'fresh'`, it renders a tooltip with `last_updated_at`.
