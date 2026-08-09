const test = require('node:test');
const assert = require('node:assert/strict');
const {
  stageTableName,
  assertStageTableName,
  assertNoNativeTableMutation,
  WarehouseLoader,
} = require('../../scripts/gsc/lib/bigquery-loader');

class FakeAdapter {
  constructor(validation = {}) {
    this.validation = validation;
    this.staged = [];
    this.queries = [];
    this.dropped = [];
  }
  async stageRows(table, rows) { this.staged.push({ table, rows }); }
  async query(options) {
    this.queries.push(options);
    if (options.query.includes('duplicate_keys')) {
      return [{
        row_count: this.staged.at(-1).rows.length,
        duplicate_key_count: 0,
        invalid_scope_count: 0,
        ...this.validation,
      }];
    }
    return [];
  }
  async dropStage(table) { this.dropped.push(table); }
}

function aggregate() {
  return {
    clicks: 0, impressions: 0, ctr: 0, position: null, position_sum_1based: 0,
    data_state: 'final', extracted_at: '2025-04-04T00:00:00Z',
    source_system: 'search_console_api', source_quality: 'api_detail_limited',
    loaded_at: '2026-08-09T00:00:00Z',
  };
}

test('staging names are deterministic and cannot target arbitrary tables', () => {
  const name = stageTableName('run-1', '2026-08-06');
  assert.match(name, /^_stg_api_detail_[a-f0-9]{16}_20260806$/);
  assert.equal(assertStageTableName(name), name);
  assert.throws(() => assertStageTableName('searchdata_url_impression'), /Unsafe/);
});

test('runtime SQL guard rejects mutations of every vendor-managed raw table', () => {
  for (const table of ['ExportLog', 'searchdata_site_impression', 'searchdata_url_impression']) {
    assert.throws(
      () => assertNoNativeTableMutation(`DELETE FROM \`borojeet.searchconsole_borojeet.${table}\` WHERE TRUE`),
      /vendor-managed raw table/,
    );
  }
  assert.doesNotThrow(() => assertNoNativeTableMutation(
    'SELECT * FROM `borojeet.searchconsole_borojeet.ExportLog`',
  ));
  assert.throws(
    () => assertNoNativeTableMutation(
      'CREATE TABLE IF NOT EXISTS `borojeet.searchconsole_borojeet.custom` (x INT64)',
    ),
    /vendor-managed raw table/,
  );
});

test('empty successful date executes transaction and then drops staging', async () => {
  const adapter = new FakeAdapter();
  const loader = new WarehouseLoader({ adapter });
  await loader.replaceDay({
    runId: 'run-1', date: '2025-04-03', rows: [], aggregate: aggregate(),
    pagesRequested: 0, checksum: 'abc', sourceExtractionRunId: 'source-run',
  });
  assert.equal(adapter.staged[0].rows.length, 0);
  const transaction = adapter.queries.find((call) => call.query.includes('BEGIN TRANSACTION'));
  assert.ok(transaction);
  assert.match(transaction.query, /DELETE FROM `borojeet\.gsc_history\.api_search_analytics_detail`/);
  assert.doesNotMatch(transaction.query, /DELETE FROM `borojeet\.searchconsole_borojeet/);
  assert.equal(adapter.dropped.length, 1);
});

test('invalid staging data never executes target transaction', async () => {
  const adapter = new FakeAdapter({ duplicate_key_count: 1 });
  const loader = new WarehouseLoader({ adapter });
  await assert.rejects(() => loader.replaceDay({
    runId: 'run-1', date: '2025-04-03', rows: [{}], aggregate: aggregate(),
    pagesRequested: 1, checksum: 'abc', sourceExtractionRunId: null,
  }), /duplicate logical keys/);
  assert.equal(adapter.queries.some((call) => call.query.includes('BEGIN TRANSACTION')), false);
  assert.equal(adapter.dropped.length, 1);
});

test('staging cleanup is attempted even when staging creation fails', async () => {
  const adapter = new FakeAdapter();
  adapter.stageRows = async () => { throw new Error('load failed'); };
  const loader = new WarehouseLoader({ adapter });
  await assert.rejects(() => loader.replaceDay({
    runId: 'run-1', date: '2025-04-03', rows: [], aggregate: aggregate(),
    pagesRequested: 0, checksum: 'abc', sourceExtractionRunId: null,
  }), /load failed/);
  assert.equal(adapter.dropped.length, 1);
});

test('empty range audit preserves null position instead of inventing zero', async () => {
  const adapter = new FakeAdapter();
  const loader = new WarehouseLoader({ adapter });
  await loader.appendRunEvent({
    runId: 'run-empty', eventSequence: 2, eventType: 'completed', status: 'success',
    inputSource: 'local-snapshot', loadMode: 'historical', sourceSystem: 'search_console_api',
    startDate: '2025-04-03', endDate: '2025-04-03', rowsExtracted: 0,
    pagesRequested: 0, datesCommitted: 1,
    rangeAggregate: { clicks: 0, impressions: 0, ctr: 0, position: null, position_sum_1based: 0 },
  });
  const params = adapter.queries[0].params;
  assert.equal(params.has_range, true);
  assert.equal(params.range_has_position, false);
  assert.equal(params.range_position, 0);
  assert.match(adapter.queries[0].query, /@has_range AND @range_has_position/);
});
