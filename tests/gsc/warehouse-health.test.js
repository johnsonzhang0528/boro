const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeBoolean, main } = require('../../scripts/gsc/check-bulk-export-health');

function row(namespace, healthy = true) {
  return {
    namespace,
    expected_through_date: '2026-08-06',
    latest_data_date: '2026-08-06',
    latest_epoch_version: 0,
    latest_publish_time: '2026-08-08T00:00:00Z',
    missing_finalized_dates: 0,
    is_healthy: healthy,
  };
}

test('health boolean normalization accepts BigQuery-compatible values', () => {
  assert.equal(normalizeBoolean(true), true);
  assert.equal(normalizeBoolean('true'), true);
  assert.equal(normalizeBoolean(1), true);
  assert.equal(normalizeBoolean(false), false);
});

test('health succeeds only when both native namespaces are healthy', async () => {
  const queries = [];
  const rows = [
    row('SEARCHDATA_SITE_IMPRESSION'),
    row('SEARCHDATA_URL_IMPRESSION'),
  ];
  const result = await main({
    bigquery: { query: async (options) => { queries.push(options); return [rows]; } },
    logger: { log: () => {} },
  });
  assert.equal(result.length, 2);
  assert.equal(queries[0].location, 'US');
  assert.match(queries[0].query, /`borojeet\.gsc_analytics\.bulk_export_status`/);
});

test('health fails for an unhealthy namespace', async () => {
  await assert.rejects(() => main({
    bigquery: { query: async () => [[
      row('SEARCHDATA_SITE_IMPRESSION'),
      row('SEARCHDATA_URL_IMPRESSION', false),
    ]] },
    logger: { log: () => {} },
  }), /SEARCHDATA_URL_IMPRESSION/);
});

test('health fails closed when either namespace is missing', async () => {
  await assert.rejects(() => main({
    bigquery: { query: async () => [[row('SEARCHDATA_SITE_IMPRESSION')]] },
    logger: { log: () => {} },
  }), /expected 2 namespace rows/);
});
