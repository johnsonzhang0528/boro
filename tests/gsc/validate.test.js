const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeApiRow, dedupeRows } = require('../../scripts/gsc/lib/validate');

const metadata = { property: 'sc-domain:borojeetbd.com', searchType: 'web', dataState: 'final', extractedAt: 'x' };
function validApiRow() { return { keys: ['2026-08-01', 'q', 'https://www.borojeetbd.com/a', 'MOBILE', 'bgd'], clicks: 1, impressions: 2, ctr: 0.5, position: 1.5 }; }

test('validates and normalizes a row', () => {
  const result = normalizeApiRow(validApiRow(), metadata, '2026-08-01');
  assert.equal(result.property, metadata.property);
});

test('rejects invalid metrics and hostname', () => {
  const row = validApiRow(); row.clicks = 3; row.impressions = 2;
  assert.throws(() => normalizeApiRow(row, metadata, '2026-08-01'), /impressions must be >= clicks/);
  const outside = validApiRow(); outside.keys[2] = 'https://example.com/';
  assert.throws(() => normalizeApiRow(outside, metadata, '2026-08-01'), /outside borojeetbd.com/);
});

test('malformed row fails', () => {
  const row = validApiRow(); row.keys = ['2026-08-01'];
  assert.throws(() => normalizeApiRow(row, metadata, '2026-08-01'), /five dimension keys/);
});

test('duplicate rows dedupe, conflicting duplicate metrics fail', () => {
  const a = normalizeApiRow(validApiRow(), metadata, '2026-08-01');
  const b = { ...a };
  assert.equal(dedupeRows([a, b]).length, 1);
  const c = { ...a, clicks: 0 };
  assert.throws(() => dedupeRows([a, c]), /Conflicting duplicate/);
});
