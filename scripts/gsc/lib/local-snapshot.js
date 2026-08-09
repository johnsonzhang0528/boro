const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { enumerateDates } = require('./cli');

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    throw new Error(`${label} is missing or invalid JSON: ${filePath}`);
  }
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Snapshot rows file not found: ${filePath}`);
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.trim()) return { rows: [], sha256: crypto.createHash('sha256').update(text).digest('hex') };
  const rows = text.trimEnd().split(/\r?\n/).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (_) {
      throw new Error(`Invalid JSONL at ${filePath}:${index + 1}`);
    }
  });
  return { rows, sha256: crypto.createHash('sha256').update(text).digest('hex') };
}

function discoverSuccessfulSnapshots(rootDir, startDate, endDate) {
  const runsDir = path.join(rootDir, 'runs');
  if (!fs.existsSync(runsDir)) throw new Error(`GSC runs directory not found: ${runsDir}`);
  const requestedDates = enumerateDates(startDate, endDate);
  const selected = new Map();

  for (const entry of fs.readdirSync(runsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const run = readJson(path.join(runsDir, entry.name), 'GSC run log');
    if (run.status !== 'success' || !run.run_id || !run.finished_at) continue;
    if (!/^[A-Za-z0-9-]+$/.test(run.run_id)) throw new Error(`Unsafe source run ID: ${run.run_id}`);

    const rawDir = path.join(rootDir, 'raw', run.run_id);
    const aggregatePath = path.join(rawDir, 'daily-aggregate.json');
    if (!fs.existsSync(aggregatePath)) continue;
    const dailyAggregates = readJson(aggregatePath, 'Daily aggregate snapshot');

    for (const date of requestedDates) {
      if (date < run.start_date || date > run.end_date) continue;
      const rowsPath = path.join(rawDir, `date=${date}`, 'rows.jsonl');
      if (!fs.existsSync(rowsPath) || !Object.hasOwn(dailyAggregates, date)) continue;
      const prior = selected.get(date);
      if (!prior || run.finished_at > prior.finishedAt) {
        selected.set(date, {
          date,
          runId: run.run_id,
          extractedAt: run.started_at,
          finishedAt: run.finished_at,
          rowsPath,
          aggregate: dailyAggregates[date],
        });
      }
    }
  }

  const missing = requestedDates.filter((date) => !selected.has(date));
  if (missing.length) {
    throw new Error(`Missing successful local snapshot for ${missing.length} date(s): ${missing.slice(0, 5).join(', ')}`);
  }
  return requestedDates.map((date) => selected.get(date));
}

function loadSnapshotDay(snapshot) {
  return { ...readJsonl(snapshot.rowsPath), aggregate: snapshot.aggregate };
}

module.exports = { readJsonl, discoverSuccessfulSnapshots, loadSnapshotDay };
