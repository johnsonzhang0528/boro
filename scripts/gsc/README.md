# GSC Extraction Pipeline v1

Local, testable Search Console Search Analytics extraction for `sc-domain:borojeetbd.com`.

## Scope

This v1 extracts GSC API-exposed Search Analytics data only. Google documents that Search Analytics is subject to internal data limits and does not guarantee all rows, so this pipeline must not be described as a complete Google query log. It does not attribute GSC queries or landing pages deterministically to affiliate players or revenue.

## Authentication

Create a Google OAuth client with Search Console access, keep the client JSON outside the repository (recommended: `~/.borojeet-gsc/credentials.json`), then configure absolute paths in a local `.env`:

```text
GSC_PROPERTY=sc-domain:borojeetbd.com
GSC_SEARCH_TYPE=web
GSC_DATA_STATE=final
GSC_OAUTH_CLIENT_FILE=/home/you/.borojeet-gsc/credentials.json
GSC_OAUTH_TOKEN_FILE=/home/you/.borojeet-gsc/token.json
```

Run:

```bash
npm run gsc:auth
```

The bootstrap requests only `https://www.googleapis.com/auth/webmasters.readonly`, requires a refresh token, refuses both the OAuth client credentials path and token path when they are inside this repository, and never prints tokens or client secrets. The token target directory is created with restrictive permissions where supported. The authorization URL is always printed so browser auto-launch failure is recoverable, and the local callback server times out after 10 minutes instead of waiting indefinitely.

## Extraction

```bash
npm run gsc:pull -- --start 2026-08-01 --end 2026-08-05
```

The CLI enumerates the requested dates. Each date is queried independently with `startDate === endDate`, `rowLimit=25000`, and `startRow` pagination reset to zero for the next day. This is intentional to maximize retention of daily fine-grained rows exposed by the API.

Data is persisted date by date so range memory remains bounded to approximately one daily partition. Each successfully completed date is written as a **raw extraction snapshot** under `data/gsc/raw/<run_id>/date=YYYY-MM-DD/rows.jsonl`. These snapshots preserve the normalized, validated, deduplicated Search Analytics row semantics used by this pipeline; they are not claimed to be untouched Google API response payloads.

Processed partitions are not changed while detail extraction is still in progress. After the entire requested range and its sanity aggregate complete successfully, the completed daily raw snapshots are atomically copied into `data/gsc/processed/date=YYYY-MM-DD/rows.jsonl`. This preserves idempotent reruns, allows a successful empty date to overwrite stale rows with an empty partition, and prevents an incomplete day from replacing a previously successful processed partition. Raw run snapshots and run logs remain as audit information. All `data/gsc/` data is gitignored.

CTR is retained at row level; downstream aggregation must calculate `SUM(clicks) / SUM(impressions)`. Position remains row-level and is not averaged by this ingestion layer.

Each run stores a range aggregate plus daily aggregates for sanity comparison with Search Console UI. Do not assert that detail-row sums equal aggregate totals.

## Tests

```bash
npm run test:gsc
```

Tests are fully mocked and do not call the real Search Console API.

## BigQuery warehouse foundation

Production Search Console ingestion now comes from Google's Native Bulk Export, not a scheduled API pull:

```text
Search Console -> borojeet.searchconsole_borojeet -> canonical analytics views
```

The PR #1 API extractor remains available only for historical backfill, reconciliation, explicit break-glass fallback, and local regression testing. There is deliberately no daily API ingestion schedule.

The canonical source rule is fixed and non-overlapping:

```text
date <  2026-08-07 -> Search Console API history
date >= 2026-08-07 -> Native Bulk Export
```

`borojeet.searchconsole_borojeet.ExportLog`, `searchdata_site_impression`, and `searchdata_url_impression` are Google-managed raw contracts. Repository SQL may only read them. Never alter their schemas or write, merge, update, or delete data in them. Repository-owned data lives in the US-location datasets `borojeet.gsc_history` and `borojeet.gsc_analytics`.

Run the SQL in this order with an authorized administrator identity:

1. `scripts/gsc/sql/00_create_datasets.sql`
2. `scripts/gsc/sql/01_create_history_tables.sql`
3. `scripts/gsc/sql/10_latest_export_log.sql`
4. `scripts/gsc/sql/11_search_analytics_detail.sql`
5. `scripts/gsc/sql/12_search_analytics_site_daily.sql`
6. `scripts/gsc/sql/13_source_coverage.sql`
7. `scripts/gsc/sql/14_bulk_export_status.sql`

After the historical load, run `scripts/gsc/sql/20_validate_deployment.sql`. It is read-only and fixes the agreed acceptance totals for the 491 historical dates plus the verified 2026-08-07 Native cutover rows.

The canonical URL-detail and site-daily models are intentionally separate. Native epochs are selected from the latest `ExportLog` row for each namespace/date. CTR and position are impression-weighted. Native zero-based position sums are converted to one-based position; anonymous native query rows stay `NULL` and carry an anonymity flag instead of receiving a synthetic query label.

## Historical snapshot load

The safest initial import uses the immutable local snapshots already created by PR #1. It does not call Search Console again:

```bash
npm run gsc:bq:backfill -- --start 2025-04-03 --end 2026-08-06 --source local-snapshot --dry-run true
```

Loads are intentionally limited to 92 days per invocation, so run the validated historical ranges separately. To commit one range after reviewing its dry run:

```bash
npm run gsc:bq:backfill -- --start 2026-08-04 --end 2026-08-06 --source local-snapshot --dry-run false --confirmation LOAD_API_HISTORY
```

Use these exact seven bounded ranges for the initial import:

| Range | Expected visible detail rows |
| --- | ---: |
| 2025-04-03 to 2025-06-30 | 0 |
| 2025-07-01 to 2025-09-30 | 0 |
| 2025-10-01 to 2025-12-31 | 266 |
| 2026-01-01 to 2026-03-31 | 6,414 |
| 2026-04-01 to 2026-06-30 | 7,763 |
| 2026-07-01 to 2026-08-03 | 3,462 |
| 2026-08-04 to 2026-08-06 | 309 |

Each date is validated and transactionally replaced in repository-owned tables. A successful empty day deletes any stale detail rows and records a zero-valued daily partition. Failed or incomplete staging never replaces the existing partition. Rerunning the same date is idempotent, and append-only run events preserve the audit trail.

The initial validated history is expected to cover 2025-04-03 through 2026-08-06, including 181 successful zero-detail dates and 18,214 visible detail rows. Validate these totals and the stored daily/range aggregates in production; do not assume detail sums equal Search Console aggregate totals.

## Manual API backfill and break-glass use

`.github/workflows/gsc-api-backfill.yml` is `workflow_dispatch` only. Historical mode refuses any date on or after 2026-08-07 and requires the exact confirmation `LOAD_API_HISTORY`. Break-glass mode accepts only dates on or after the cutover, requires `LOAD_API_FALLBACK` plus a reason, and stores the rows as noncanonical fallback evidence. The canonical views continue to select Native Bulk Export after the cutover.

Local snapshot loading requires the interactive user's Application Default Credentials to write only repository-owned BigQuery tables. Manual API extraction additionally requires that identity to have Search Console permission for `sc-domain:borojeetbd.com` and uses only `https://www.googleapis.com/auth/webmasters.readonly`.

GitHub Actions uses Workload Identity Federation, never service-account JSON keys or OAuth token files. Configure environment variables `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_GSC_BACKFILL_SERVICE_ACCOUNT`, and `GCP_GSC_HEALTH_SERVICE_ACCOUNT`. Keep separate service accounts:

- Backfill: BigQuery job creation plus write access to `gsc_history`; Native raw access only if validation requires it.
- Health: BigQuery job creation plus read-only access to the analytics views and Native raw dataset.

Neither identity should have permissions that allow modifying `searchconsole_borojeet`.

## Native export health

`.github/workflows/gsc-warehouse-health.yml` runs the read-only health query daily and can also be started manually. It fails closed unless both the site and URL namespaces are present, latest-epoch coverage reaches the finalized expectation, the recent finalized window has no missing dates, and publishing is not stale. A failure is an operational signal to investigate ExportLog/Search Console; it does not automatically switch canonical production data to the API.

## Rollback

The repository never changes the Native raw tables, so rollback does not touch or restore vendor data. Disable the two workflows, redeploy the previous analytics view SQL from git, and revoke the two WIF service-account bindings if automation must be stopped. Repository-owned historical partitions remain auditable and can be reloaded date by date; do not drop datasets or delete Native tables as a rollback step.
