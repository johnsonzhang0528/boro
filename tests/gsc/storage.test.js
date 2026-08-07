const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { writeProcessedPartitionsAtomic } = require('../../scripts/gsc/lib/storage');

test('processed daily partitions overwrite idempotently including empty days', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsc-storage-'));
  const base = { property: 'sc-domain:borojeetbd.com', search_type: 'web', query: 'q', page: 'https://borojeetbd.com/', device: 'MOBILE', country: 'bgd', clicks: 1, impressions: 2, ctr: 0.5, position: 1, extracted_at: 'x' };
  writeProcessedPartitionsAtomic(root, ['2026-08-01', '2026-08-02'], [{ ...base, date: '2026-08-01' }]);
  writeProcessedPartitionsAtomic(root, ['2026-08-01', '2026-08-02'], [{ ...base, date: '2026-08-01', query: 'new' }]);
  const day1 = fs.readFileSync(path.join(root, 'processed/date=2026-08-01/rows.jsonl'), 'utf8');
  const day2 = fs.readFileSync(path.join(root, 'processed/date=2026-08-02/rows.jsonl'), 'utf8');
  assert.match(day1, /"query":"new"/);
  assert.doesNotMatch(day1, /"query":"q"/);
  assert.equal(day2, '');
});
