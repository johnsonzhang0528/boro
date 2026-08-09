const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  discoverSuccessfulSnapshots,
  loadSnapshotDay,
} = require('../../scripts/gsc/lib/local-snapshot');

function writeRun(root, run) {
  fs.mkdirSync(path.join(root, 'runs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'raw', run.run_id, `date=${run.start_date}`), { recursive: true });
  fs.writeFileSync(path.join(root, 'runs', `${run.run_id}.json`), JSON.stringify(run));
  fs.writeFileSync(
    path.join(root, 'raw', run.run_id, 'daily-aggregate.json'),
    JSON.stringify({ [run.start_date]: { clicks: 0, impressions: 0, ctr: 0, position: null } }),
  );
  fs.writeFileSync(path.join(root, 'raw', run.run_id, `date=${run.start_date}`, 'rows.jsonl'), '');
}

test('local snapshot discovery selects the newest successful immutable run', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsc-local-snapshot-'));
  writeRun(root, {
    run_id: 'older', status: 'success', start_date: '2025-04-03', end_date: '2025-04-03',
    started_at: '2025-04-04T00:00:00Z', finished_at: '2025-04-04T00:01:00Z',
  });
  writeRun(root, {
    run_id: 'newer', status: 'success', start_date: '2025-04-03', end_date: '2025-04-03',
    started_at: '2025-04-05T00:00:00Z', finished_at: '2025-04-05T00:01:00Z',
  });
  const snapshots = discoverSuccessfulSnapshots(root, '2025-04-03', '2025-04-03');
  assert.equal(snapshots[0].runId, 'newer');
  const loaded = loadSnapshotDay(snapshots[0]);
  assert.deepEqual(loaded.rows, []);
  assert.equal(loaded.aggregate.impressions, 0);
  assert.match(loaded.sha256, /^[a-f0-9]{64}$/);
});

test('missing successful dates fail before any warehouse write', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsc-local-missing-'));
  fs.mkdirSync(path.join(root, 'runs'));
  assert.throws(
    () => discoverSuccessfulSnapshots(root, '2025-04-03', '2025-04-03'),
    /Missing successful local snapshot/,
  );
});
