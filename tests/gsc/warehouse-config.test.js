const test = require('node:test');
const assert = require('node:assert/strict');
const {
  WAREHOUSE,
  assertSelfOwnedHistoryTable,
  validateBackfillRequest,
} = require('../../scripts/gsc/lib/warehouse-config');

test('warehouse production identifiers and cutover are fixed', () => {
  assert.equal(WAREHOUSE.projectId, 'borojeet');
  assert.equal(WAREHOUSE.location, 'US');
  assert.equal(WAREHOUSE.nativeDataset, 'searchconsole_borojeet');
  assert.equal(WAREHOUSE.cutoverDate, '2026-08-07');
  assert.equal(WAREHOUSE.property, 'sc-domain:borojeetbd.com');
});

test('historical and break-glass requests cannot cross the cutover', () => {
  const historical = validateBackfillRequest({
    startDate: '2026-08-04', endDate: '2026-08-06', dryRun: true,
  });
  assert.equal(historical.sourceSystem, 'search_console_api');
  assert.throws(() => validateBackfillRequest({
    startDate: '2026-08-06', endDate: '2026-08-07', dryRun: true,
  }), /must end before cutover/);
  const fallback = validateBackfillRequest({
    startDate: '2026-08-07', endDate: '2026-08-07', source: 'api',
    mode: 'break_glass', dryRun: false, confirmation: 'LOAD_API_FALLBACK', reason: 'reconciliation',
  });
  assert.equal(fallback.sourceSystem, 'search_console_api_fallback');
});

test('writes require explicit confirmation and GitHub runs require main', () => {
  assert.throws(() => validateBackfillRequest({
    startDate: '2026-08-01', endDate: '2026-08-01', dryRun: false,
  }), /LOAD_API_HISTORY/);
  assert.throws(() => validateBackfillRequest({
    startDate: '2026-08-01', endDate: '2026-08-01', dryRun: true,
    githubActions: true, githubRef: 'refs/heads/feature',
  }), /only from refs\/heads\/main/);
});

test('range is capped at 92 days and local snapshots cannot be break-glass', () => {
  assert.throws(() => validateBackfillRequest({
    startDate: '2026-01-01', endDate: '2026-04-03', dryRun: true,
  }), /cannot exceed 92 days/);
  assert.throws(() => validateBackfillRequest({
    startDate: '2026-08-07', endDate: '2026-08-07', source: 'local-snapshot',
    mode: 'break_glass', dryRun: true, reason: 'x',
  }), /only be loaded as historical/);
});

test('write allowlist rejects every Native vendor-managed table', () => {
  for (const table of Object.values(WAREHOUSE.nativeTables)) {
    assert.throws(() => assertSelfOwnedHistoryTable(table), /non-allowlisted/);
  }
  assert.match(assertSelfOwnedHistoryTable(WAREHOUSE.historyTables.detail), /gsc_history/);
});
