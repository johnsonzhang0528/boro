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

The bootstrap requests only `https://www.googleapis.com/auth/webmasters.readonly`, requires a refresh token, refuses to write the token inside this repository, and never prints tokens or client secrets. The token target directory is created with restrictive permissions where supported.

## Extraction

```bash
npm run gsc:pull -- --start 2026-08-01 --end 2026-08-05
```

The CLI enumerates the requested dates. Each date is queried independently with `startDate === endDate`, `rowLimit=25000`, and `startRow` pagination reset to zero for the next day. This is intentional to maximize retention of daily fine-grained rows exposed by the API.

Raw and processed local data live under `data/gsc/` and are gitignored. Processed partitions are validated, deduplicated, and atomically overwritten by date for idempotent reruns. CTR is retained at row level; downstream aggregation must calculate `SUM(clicks) / SUM(impressions)`. Position remains row-level and is not averaged by this ingestion layer.

Each run stores a range aggregate plus daily aggregates for sanity comparison with Search Console UI. Do not assert that detail-row sums equal aggregate totals.

## Tests

```bash
npm run test:gsc
```

Tests are fully mocked and do not call the real Search Console API.
