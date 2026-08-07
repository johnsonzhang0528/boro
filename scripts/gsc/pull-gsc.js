#!/usr/bin/env node
const path = require('path');
require('dotenv').config();
const { parseArgs } = require('./lib/cli');
const { loadConfig } = require('./lib/config');
const { loadAuthorizedClient } = require('./lib/auth');
const { createSearchConsoleClient } = require('./lib/client');
const { extractRange } = require('./lib/extractor');
const { createRunId, createStorage, writeJson, writeJsonl, writeProcessedPartitionsAtomic } = require('./lib/storage');

async function main(argv = process.argv.slice(2), env = process.env) {
  const { start, end } = parseArgs(argv);
  const config = loadConfig(env);
  const rootDir = path.resolve(__dirname, '../..', 'data/gsc');
  const runId = createRunId();
  const startedAt = new Date().toISOString();
  const files = createStorage(rootDir, runId);
  const run = {
    run_id: runId,
    started_at: startedAt,
    finished_at: null,
    property: config.property,
    search_type: config.searchType,
    start_date: start,
    end_date: end,
    rows_extracted: 0,
    pages_requested: 0,
    status: 'failed',
    error: null,
  };
  writeJson(files.runLog, run);

  try {
    const auth = loadAuthorizedClient({ clientFile: config.clientFile, tokenFile: config.tokenFile });
    const searchConsole = createSearchConsoleClient(auth);
    const extractedAt = new Date().toISOString();
    const result = await extractRange({
      searchConsole,
      startDate: start,
      endDate: end,
      property: config.property,
      searchType: config.searchType,
      dataState: config.dataState,
      rowLimit: config.rowLimit,
      extractedAt,
      onPage: ({ count }) => {
        run.pages_requested += 1;
        run.rows_extracted += count;
        writeJson(files.runLog, run);
      },
    });

    writeJsonl(files.rawRows, result.rows);
    writeJson(files.aggregate, result.aggregate);
    writeJson(files.dailyAggregate, result.dailyAggregates);
    writeProcessedPartitionsAtomic(rootDir, result.dates, result.rows);

    run.rows_extracted = result.rows.length;
    run.pages_requested = result.pagesRequested;
    run.status = 'success';
    run.finished_at = new Date().toISOString();
    writeJson(files.runLog, run);
    console.log(`GSC extraction succeeded: ${result.rows.length} rows across ${result.dates.length} day(s).`);
    console.log(`Run ID: ${runId}`);
    return run;
  } catch (error) {
    run.status = run.pages_requested > 0 || run.rows_extracted > 0 ? 'partial' : 'failed';
    run.error = error.message;
    run.finished_at = new Date().toISOString();
    writeJson(files.runLog, run);
    throw error;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`GSC extraction failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { main };
