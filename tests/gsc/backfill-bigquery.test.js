const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseArgs,
  sanitizeError,
  main,
} = require('../../scripts/gsc/backfill-bigquery');

function snapshotRow(date) {
  return {
    property: 'sc-domain:borojeetbd.com',
    search_type: 'web',
    data_state: 'final',
    date,
    query: 'example',
    page: 'https://borojeetbd.com/example/',
    country: 'bgd',
    device: 'MOBILE',
    clicks: 1,
    impressions: 2,
    ctr: 0.5,
    position: 3,
    extracted_at: '2026-08-08T00:00:00.000Z',
  };
}

function snapshotAggregate(date) {
  return {
    property: 'sc-domain:borojeetbd.com',
    search_type: 'web',
    data_state: 'final',
    start_date: date,
    end_date: date,
    clicks: 1,
    impressions: 2,
    ctr: 0.5,
    position: 3,
    extracted_at: '2026-08-08T00:00:00.000Z',
  };
}

test('workflow environment parsing keeps API source explicit', () => {
  const parsed = parseArgs(['--from-env'], {
    GSC_BACKFILL_START_DATE: '2026-08-04',
    GSC_BACKFILL_END_DATE: '2026-08-06',
    GSC_BACKFILL_SOURCE: 'api',
    GSC_BACKFILL_MODE: 'historical',
    GSC_BACKFILL_DRY_RUN: 'false',
    GSC_BACKFILL_CONFIRMATION: 'LOAD_API_HISTORY',
  });
  assert.equal(parsed.source, 'api');
  assert.equal(parsed.dryRun, false);
  assert.equal(parsed.confirmation, 'LOAD_API_HISTORY');
});

test('error sanitization redacts OAuth material', () => {
  const sanitized = sanitizeError(new Error('access_token=secret refresh_token: hidden client_secret = nope'));
  assert.equal(
    sanitized,
    'access_token=[REDACTED] refresh_token: [REDACTED] client_secret = [REDACTED]',
  );
  const json = sanitizeError(new Error(
    'request {"client_secret":"json-secret","authorization":"Bearer bearer-secret","access_token":"ya29.token"}',
  ));
  assert.doesNotMatch(json, /json-secret|bearer-secret|ya29\.token/);
});

test('local snapshot dry run validates date-by-date without creating BigQuery client', async () => {
  let bigQueryCreated = false;
  const logs = [];
  const result = await main([
    '--start', '2026-08-06',
    '--end', '2026-08-06',
    '--source', 'local-snapshot',
    '--mode', 'historical',
    '--dry-run', 'true',
  ], {}, {
    createRunId: () => 'warehouse-run-1',
    now: () => '2026-08-09T00:00:00.000Z',
    createBigQueryClient: () => { bigQueryCreated = true; },
    discoverSuccessfulSnapshots: () => [{
      runId: 'extract-run-1',
      date: '2026-08-06',
      extractedAt: '2026-08-08T00:00:00.000Z',
    }],
    loadSnapshotDay: () => ({
      rows: [snapshotRow('2026-08-06')],
      aggregate: snapshotAggregate('2026-08-06'),
      sha256: 'snapshot-sha',
    }),
    logger: { log: (message) => logs.push(message) },
  });

  assert.equal(bigQueryCreated, false);
  assert.deepEqual(result.counts, { rows: 1, pages: 0, dates: 1 });
  assert.equal(result.rangeAggregate.position, 3);
  assert.ok(logs.some((line) => line.includes('Validated 2026-08-06')));
});

test('successful empty snapshot is committed as a real date partition', async () => {
  const calls = [];
  const loader = {
    appendRunEvent: async (event) => calls.push({ type: 'event', event }),
    replaceDay: async (day) => calls.push({ type: 'day', day }),
  };
  const result = await main([
    '--start', '2025-04-03',
    '--end', '2025-04-03',
    '--source', 'local-snapshot',
    '--mode', 'historical',
    '--dry-run', 'false',
    '--confirmation', 'LOAD_API_HISTORY',
  ], {}, {
    createRunId: () => 'warehouse-run-empty',
    now: () => '2026-08-09T00:00:00.000Z',
    createBigQueryClient: () => ({}),
    adapter: {},
    loader,
    discoverSuccessfulSnapshots: () => [{
      runId: 'extract-run-empty',
      date: '2025-04-03',
      extractedAt: '2025-04-04T00:00:00.000Z',
    }],
    loadSnapshotDay: () => ({
      rows: [],
      aggregate: {
        ...snapshotAggregate('2025-04-03'),
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: null,
      },
      sha256: 'empty-sha',
    }),
    logger: { log: () => {} },
  });

  const day = calls.find((call) => call.type === 'day').day;
  assert.equal(day.date, '2025-04-03');
  assert.deepEqual(day.rows, []);
  assert.equal(day.aggregate.impressions, 0);
  assert.equal(result.counts.dates, 1);
  assert.deepEqual(calls.filter((call) => call.type === 'event').map((call) => call.event.status), [
    'running',
    'success',
  ]);
});
