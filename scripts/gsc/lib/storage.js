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
  const fd = fs.openSync(filePath, 'w');
  try {
    for (const row of rows) {
      fs.writeSync(fd, `${JSON.stringify(row)}\n`, null, 'utf8');
    }
  } finally {
    fs.closeSync(fd);
  }
}

function rawDailyRowsPath(rawDir, date) {
  return path.join(rawDir, `date=${date}`, 'rows.jsonl');
}

function writeRawDailySnapshot(rawDir, date, rows) {
  const target = rawDailyRowsPath(rawDir, date);
  writeJsonl(target, rows);
  return target;
}

function commitRawPartitionsAtomic(rootDir, rawDir, dates) {
  const sources = dates.map((date) => ({ date, source: rawDailyRowsPath(rawDir, date) }));
  for (const { date, source } of sources) {
    if (!fs.existsSync(source)) {
      throw new Error(`Missing completed raw daily snapshot for ${date}; processed partitions were not updated.`);
    }
  }

  for (const { date, source } of sources) {
    const partitionDir = path.join(rootDir, 'processed', `date=${date}`);
    ensureDir(partitionDir);
    const target = path.join(partitionDir, 'rows.jsonl');
    const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
    fs.copyFileSync(source, temp);
    try {
      fs.renameSync(temp, target);
    } finally {
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
    }
  }
}

function createStorage(rootDir, runId) {
  const rawDir = path.join(rootDir, 'raw', runId);
  const runsDir = path.join(rootDir, 'runs');
  ensureDir(rawDir);
  ensureDir(runsDir);
  return {
    rawDir,
    aggregate: path.join(rawDir, 'aggregate.json'),
    dailyAggregate: path.join(rawDir, 'daily-aggregate.json'),
    runLog: path.join(runsDir, `${runId}.json`),
  };
}

module.exports = {
  createRunId,
  ensureDir,
  writeJson,
  writeJsonl,
  rawDailyRowsPath,
  writeRawDailySnapshot,
  commitRawPartitionsAtomic,
  createStorage,
};
