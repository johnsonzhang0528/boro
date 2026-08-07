const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, enumerateDates } = require('../../scripts/gsc/lib/cli');

test('date range arguments parse and enumerate inclusively', () => {
  assert.deepEqual(parseArgs(['--start', '2026-08-01', '--end', '2026-08-03']), { start: '2026-08-01', end: '2026-08-03' });
  assert.deepEqual(enumerateDates('2026-08-01', '2026-08-03'), ['2026-08-01', '2026-08-02', '2026-08-03']);
});

test('invalid date range arguments fail', () => {
  assert.throws(() => parseArgs(['--start', '2026-08-03', '--end', '2026-08-01']), /on or before/);
  assert.throws(() => parseArgs(['--start', '2026-02-30', '--end', '2026-03-01']), /valid calendar date/);
  assert.throws(() => parseArgs(['--start', '2026-08-01']), /Both/);
});
