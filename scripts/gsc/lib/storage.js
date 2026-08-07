const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createRunId(now = new Date()) {
  return `${now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${crypto.randomBytes(4).toString('hex')}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeJsonl(filePath, rows) {
  ensureDir(path.dirname(filePath));
  const body = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, body ? `${body}\n` : '', 'utf8');
}

function writeProcessedPartitionsAtomic(rootDir, dates, rows) {
  const grouped = new Map(dates.map((date) => [date, []]));
  for (const row of rows) {
    if (!grouped.has(row.date)) grouped.set(row.date, []);
    grouped.get(row.date).push(row);
  }
  for (const [date, dailyRows] of grouped.entries()) {
    const partitionDir = path.join(rootDir, 'processed', `date=${date}`);
    ensureDir(partitionDir);
    const target = path.join(partitionDir, 'rows.jsonl');
    const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
    writeJsonl(temp, dailyRows);
    fs.renameSync(temp, target);
  }
}

function createStorage(rootDir, runId) {
  const rawDir = path.join(rootDir, 'raw', runId);
  const runsDir = path.join(rootDir, 'runs');
  ensureDir(rawDir);
  ensureDir(runsDir);
  return {
    rawRows: path.join(rawDir, 'rows.jsonl'),
    aggregate: path.join(rawDir, 'aggregate.json'),
    dailyAggregate: path.join(rawDir, 'daily-aggregate.json'),
    runLog: path.join(runsDir, `${runId}.json`),
  };
}

module.exports = { createRunId, ensureDir, writeJson, writeJsonl, writeProcessedPartitionsAtomic, createStorage };
