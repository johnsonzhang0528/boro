#!/usr/bin/env node
const path = require('path');
const { createRunId } = require('./lib/storage');
const { extractDaily, fetchAggregate } = require('./lib/extractor');
const { WAREHOUSE, validateBackfillRequest, parseBoolean } = require('./lib/warehouse-config');
const { createAdcSearchConsoleClient, createBigQueryClient } = require('./lib/warehouse-auth');
const { discoverSuccessfulSnapshots, loadSnapshotDay } = require('./lib/local-snapshot');
const {
  normalizeApiDetailRow,
  normalizeApiDailyAggregate,
  checksumRows,
} = require('./lib/warehouse-normalize');
const { GoogleBigQueryAdapter, WarehouseLoader } = require('./lib/bigquery-loader');

function requireOption(args, name) {
  const value = args[name];
  if (!value) throw new Error(`Missing required option: ${name}`);
  return value;
}

function parseArgs(argv, env = process.env) {
  const fromEnv = argv.includes('--from-env');
  const validateOnly = argv.includes('--validate-only');
  if (fromEnv) {
    return {
      startDate: env.GSC_BACKFILL_START_DATE,
      endDate: env.GSC_BACKFILL_END_DATE,
      source: env.GSC_BACKFILL_SOURCE || 'api',
      mode: env.GSC_BACKFILL_MODE || 'historical',
      dryRun: parseBoolean(env.GSC_BACKFILL_DRY_RUN, true),
      confirmation: env.GSC_BACKFILL_CONFIRMATION || '',
      reason: env.GSC_BACKFILL_REASON || '',
      validateOnly,
    };
  }

  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--validate-only') {
      args.validateOnly = true;
      continue;
    }
    if (!['--start', '--end', '--source', '--mode', '--dry-run', '--confirmation', '--reason'].includes(token)) {
      throw new Error(`Unknown argument: ${token}`);
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`${token} requires a value.`);
    args[token.slice(2)] = value;
    index += 1;
  }
  return {
    startDate: requireOption(args, 'start'),
    endDate: requireOption(args, 'end'),
    source: args.source || 'local-snapshot',
    mode: args.mode || 'historical',
    dryRun: parseBoolean(args['dry-run'], true),
    confirmation: args.confirmation || '',
    reason: args.reason || '',
    validateOnly: Boolean(args.validateOnly),
  };
}

function sanitizeError(error) {
  return String(error?.message || error || 'Unknown error')
    .replace(/(["']?(?:access_token|refresh_token|client_secret)["']?\s*[=:]\s*["']?)[^"',\s&}]+/gi, '$1[REDACTED]')
    .replace(/(authorization["']?\s*[=:]\s*["']?bearer\s+)[^"',\s&}]+/gi, '$1[REDACTED]')
    .replace(/\bya29\.[A-Za-z0-9._~-]+/g, '[REDACTED]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 500);
}

function addAggregate(total, aggregate) {
  total.clicks += aggregate.clicks;
  total.impressions += aggregate.impressions;
  total.position_sum_1based += aggregate.position_sum_1based;
}

function finishAggregate(total) {
  return {
    clicks: total.clicks,
    impressions: total.impressions,
    ctr: total.impressions === 0 ? 0 : total.clicks / total.impressions,
    position: total.impressions === 0 ? null : total.position_sum_1based / total.impressions,
    position_sum_1based: total.position_sum_1based,
  };
}

function runEventBase({ runId, request, counts, env }) {
  return {
    runId,
    inputSource: request.source,
    loadMode: request.mode,
    sourceSystem: request.sourceSystem,
    startDate: request.startDate,
    endDate: request.endDate,
    rowsExtracted: counts.rows,
    pagesRequested: counts.pages,
    datesCommitted: counts.dates,
    githubRunId: env.GITHUB_RUN_ID,
    githubRunAttempt: env.GITHUB_RUN_ATTEMPT,
    gitRef: env.GITHUB_REF,
    gitSha: env.GITHUB_SHA,
    actor: env.GITHUB_ACTOR,
    reason: request.reason,
  };
}

async function main(argv = process.argv.slice(2), env = process.env, dependencies = {}) {
  const parsed = parseArgs(argv, env);
  const request = validateBackfillRequest({
    ...parsed,
    githubActions: env.GITHUB_ACTIONS === 'true',
    githubRef: env.GITHUB_REF || '',
  });
  const logger = dependencies.logger || console;
  if (parsed.validateOnly) {
    logger.log(`Validated ${request.mode} ${request.source} request: ${request.startDate} to ${request.endDate}.`);
    return { request, validated: true };
  }

  const runId = (dependencies.createRunId || createRunId)();
  const loadedAt = (dependencies.now || (() => new Date().toISOString()))();
  const counts = { rows: 0, pages: 0, dates: 0 };
  const compositeAggregate = { clicks: 0, impressions: 0, position_sum_1based: 0 };
  let loader;

  if (!request.dryRun) {
    const bigquery = (dependencies.createBigQueryClient || createBigQueryClient)();
    const adapter = dependencies.adapter || new GoogleBigQueryAdapter(bigquery);
    loader = dependencies.loader || new WarehouseLoader({ adapter });
    await loader.appendRunEvent({
      ...runEventBase({ runId, request, counts, env }),
      eventSequence: 1,
      eventType: 'started',
      status: 'running',
      eventAt: loadedAt,
    });
  }

  try {
    let snapshots;
    let searchConsole;
    if (request.source === 'local-snapshot') {
      const rootDir = path.resolve(__dirname, '../../data/gsc');
      snapshots = (dependencies.discoverSuccessfulSnapshots || discoverSuccessfulSnapshots)(
        rootDir,
        request.startDate,
        request.endDate,
      );
    } else {
      searchConsole = (dependencies.createSearchConsoleClient || createAdcSearchConsoleClient)();
    }

    for (let index = 0; index < request.dates.length; index += 1) {
      const date = request.dates[index];
      let sourceRows;
      let sourceAggregate;
      let pagesRequested;
      let extractedAt;
      let sourceExtractionRunId = null;
      let checksum;

      if (request.source === 'local-snapshot') {
        const snapshot = snapshots[index];
        const loaded = (dependencies.loadSnapshotDay || loadSnapshotDay)(snapshot);
        sourceRows = loaded.rows;
        sourceAggregate = loaded.aggregate;
        pagesRequested = 0;
        extractedAt = sourceRows[0]?.extracted_at
          || sourceAggregate.extracted_at
          || snapshot.extractedAt;
        sourceExtractionRunId = snapshot.runId;
        checksum = loaded.sha256;
      } else {
        extractedAt = (dependencies.now || (() => new Date().toISOString()))();
        const daily = await (dependencies.extractDaily || extractDaily)({
          searchConsole,
          date,
          property: WAREHOUSE.property,
          searchType: WAREHOUSE.searchType,
          dataState: WAREHOUSE.dataState,
          rowLimit: 25000,
          extractedAt,
        });
        sourceRows = daily.rows;
        pagesRequested = daily.pagesRequested;
        sourceAggregate = await (dependencies.fetchAggregate || fetchAggregate)({
          searchConsole,
          startDate: date,
          endDate: date,
          property: WAREHOUSE.property,
          searchType: WAREHOUSE.searchType,
          dataState: WAREHOUSE.dataState,
        });
      }

      const metadata = {
        runId,
        sourceSystem: request.sourceSystem,
        sourceExtractionRunId,
        loadedAt,
      };
      const rows = sourceRows.map((row) => normalizeApiDetailRow(row, metadata));
      if (!checksum) checksum = checksumRows(rows);
      const aggregate = normalizeApiDailyAggregate(sourceAggregate, {
        ...metadata,
        property: WAREHOUSE.property,
        searchType: WAREHOUSE.searchType,
        dataState: WAREHOUSE.dataState,
        date,
        extractedAt,
      });

      counts.rows += rows.length;
      counts.pages += pagesRequested;
      addAggregate(compositeAggregate, aggregate);
      if (!request.dryRun) {
        await loader.replaceDay({
          runId,
          date,
          rows,
          aggregate,
          pagesRequested,
          checksum,
          sourceExtractionRunId,
        });
      }
      counts.dates += 1;
      logger.log(`${request.dryRun ? 'Validated' : 'Committed'} ${date}: ${rows.length} detail row(s).`);
    }

    let rangeAggregate = finishAggregate(compositeAggregate);
    if (request.source === 'api') {
      const apiRange = await (dependencies.fetchAggregate || fetchAggregate)({
        searchConsole,
        startDate: request.startDate,
        endDate: request.endDate,
        property: WAREHOUSE.property,
        searchType: WAREHOUSE.searchType,
        dataState: WAREHOUSE.dataState,
      });
      rangeAggregate = normalizeApiDailyAggregate(apiRange, {
        property: WAREHOUSE.property,
        searchType: WAREHOUSE.searchType,
        dataState: WAREHOUSE.dataState,
        date: request.endDate,
        extractedAt: loadedAt,
        runId,
        sourceSystem: request.sourceSystem,
        loadedAt,
      });
    }

    if (!request.dryRun) {
      await loader.appendRunEvent({
        ...runEventBase({ runId, request, counts, env }),
        eventSequence: 2,
        eventType: 'completed',
        status: 'success',
        rangeAggregate,
      });
    }
    logger.log(`Backfill ${request.dryRun ? 'dry run' : 'load'} succeeded: ${counts.rows} rows across ${counts.dates} date(s).`);
    logger.log(`Run ID: ${runId}`);
    return { runId, request, counts, rangeAggregate };
  } catch (error) {
    const message = sanitizeError(error);
    if (!request.dryRun && loader) {
      try {
        await loader.appendRunEvent({
          ...runEventBase({ runId, request, counts, env }),
          eventSequence: 2,
          eventType: 'failed',
          status: counts.dates > 0 ? 'partial' : 'failed',
          errorCode: 'BACKFILL_FAILED',
          errorMessage: message,
        });
      } catch (_) {
        // Preserve the original failure if audit persistence is also unavailable.
      }
    }
    throw new Error(message);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`GSC BigQuery backfill failed: ${sanitizeError(error)}`);
    process.exitCode = 1;
  });
}

module.exports = { parseArgs, sanitizeError, addAggregate, finishAggregate, main };
