const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeApiQuery,
  normalizeApiDetailRow,
  normalizeApiDailyAggregate,
} = require('../../scripts/gsc/lib/warehouse-normalize');

const metadata = {
  runId: 'warehouse-run',
  sourceSystem: 'search_console_api',
  sourceExtractionRunId: 'local-run',
  loadedAt: '2026-08-09T00:00:00.000Z',
};

function detail(overrides = {}) {
  return {
    property: 'sc-domain:borojeetbd.com', search_type: 'web', data_state: 'final',
    date: '2026-08-06', query: 'borojeet', page: 'https://borojeetbd.com/',
    device: 'mobile', country: 'BGD', clicks: 1, impressions: 4,
    ctr: 0.25, position: 2.5, extracted_at: '2026-08-07T00:00:00.000Z',
    ...overrides,
  };
}

test('API detail becomes additive weighted warehouse data', () => {
  const row = normalizeApiDetailRow(detail(), metadata);
  assert.equal(row.position_sum_1based, 10);
  assert.equal(row.device, 'MOBILE');
  assert.equal(row.country, 'bgd');
  assert.equal(row.source_quality, 'api_detail_limited');
});

test('blank API query becomes null without inventing anonymized semantics', () => {
  assert.deepEqual(normalizeApiQuery(''), { query: null, is_anonymized_query: null });
  assert.deepEqual(normalizeApiQuery(null), { query: null, is_anonymized_query: null });
  assert.deepEqual(normalizeApiQuery('x'), { query: 'x', is_anonymized_query: false });
});

test('successful empty daily aggregate remains explicit and additive', () => {
  const row = normalizeApiDailyAggregate(
    { clicks: 0, impressions: 0, ctr: 0, position: null },
    {
      ...metadata, property: 'sc-domain:borojeetbd.com', searchType: 'web',
      dataState: 'final', date: '2025-04-03', extractedAt: '2025-04-04T00:00:00.000Z',
    },
  );
  assert.equal(row.position, null);
  assert.equal(row.position_sum_1based, 0);
  assert.equal(row.ctr, 0);
});

test('warehouse normalization rejects unsafe metric shapes', () => {
  assert.throws(() => normalizeApiDetailRow(detail({ clicks: 5, impressions: 4 }), metadata), /cannot exceed/);
  assert.throws(() => normalizeApiDetailRow(detail({ clicks: 0.5 }), metadata), /safe integer/);
});
