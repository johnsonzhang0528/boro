const { enumerateDates, parseIsoDate } = require('./cli');

const WAREHOUSE = Object.freeze({
  projectId: 'borojeet',
  location: 'US',
  property: 'sc-domain:borojeetbd.com',
  searchType: 'web',
  dataState: 'final',
  cutoverDate: '2026-08-07',
  nativeDataset: 'searchconsole_borojeet',
  historyDataset: 'gsc_history',
  analyticsDataset: 'gsc_analytics',
  nativeTables: Object.freeze({
    exportLog: 'ExportLog',
    site: 'searchdata_site_impression',
    url: 'searchdata_url_impression',
  }),
  historyTables: Object.freeze({
    detail: 'api_search_analytics_detail',
    dailyAggregate: 'api_search_analytics_daily_aggregate',
    runs: 'api_backfill_runs',
    runDates: 'api_backfill_run_dates',
  }),
  analyticsViews: Object.freeze({
    latestExportLog: 'latest_export_log',
    detail: 'search_analytics_detail',
    siteDaily: 'search_analytics_site_daily',
    sourceCoverage: 'source_coverage',
    bulkExportStatus: 'bulk_export_status',
  }),
  namespaces: Object.freeze({
    site: 'SEARCHDATA_SITE_IMPRESSION',
    url: 'SEARCHDATA_URL_IMPRESSION',
  }),
  maxBackfillDays: 92,
});

const HISTORY_TABLE_ALLOWLIST = new Set(Object.values(WAREHOUSE.historyTables));

function qualifiedTable(dataset, table) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(dataset) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
    throw new Error('Unsafe BigQuery dataset or table identifier.');
  }
  return `\`${WAREHOUSE.projectId}.${dataset}.${table}\``;
}

function assertSelfOwnedHistoryTable(table) {
  if (!HISTORY_TABLE_ALLOWLIST.has(table)) {
    throw new Error(`Refusing to write non-allowlisted BigQuery table: ${table}`);
  }
  return qualifiedTable(WAREHOUSE.historyDataset, table);
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`Expected boolean value, received: ${value}`);
}

function validateBackfillRequest({
  startDate,
  endDate,
  source = 'local-snapshot',
  mode = 'historical',
  dryRun = true,
  confirmation = '',
  reason = '',
  githubActions = false,
  githubRef = '',
}) {
  const start = parseIsoDate(startDate, '--start');
  const end = parseIsoDate(endDate, '--end');
  if (start > end) throw new Error('--start must be on or before --end.');

  const dates = enumerateDates(start, end);
  if (dates.length > WAREHOUSE.maxBackfillDays) {
    throw new Error(`Backfill range cannot exceed ${WAREHOUSE.maxBackfillDays} days.`);
  }
  if (!['local-snapshot', 'api'].includes(source)) {
    throw new Error('--source must be local-snapshot or api.');
  }
  if (!['historical', 'break_glass'].includes(mode)) {
    throw new Error('--mode must be historical or break_glass.');
  }
  if (source === 'local-snapshot' && mode !== 'historical') {
    throw new Error('Local snapshots may only be loaded as historical API data.');
  }

  const isDryRun = parseBoolean(dryRun, true);
  let sourceSystem;
  if (mode === 'historical') {
    if (end >= WAREHOUSE.cutoverDate) {
      throw new Error(`Historical API backfill must end before cutover ${WAREHOUSE.cutoverDate}.`);
    }
    if (!isDryRun && confirmation !== 'LOAD_API_HISTORY') {
      throw new Error('Historical writes require confirmation LOAD_API_HISTORY.');
    }
    sourceSystem = 'search_console_api';
  } else {
    if (start < WAREHOUSE.cutoverDate) {
      throw new Error(`Break-glass API fallback must start on or after ${WAREHOUSE.cutoverDate}.`);
    }
    if (!isDryRun && confirmation !== 'LOAD_API_FALLBACK') {
      throw new Error('Break-glass writes require confirmation LOAD_API_FALLBACK.');
    }
    if (!String(reason).trim()) throw new Error('Break-glass mode requires a non-empty reason.');
    sourceSystem = 'search_console_api_fallback';
  }

  if (githubActions && githubRef !== 'refs/heads/main') {
    throw new Error('GitHub warehouse backfill may run only from refs/heads/main.');
  }

  return {
    startDate: start,
    endDate: end,
    dates,
    source,
    mode,
    dryRun: isDryRun,
    reason: String(reason).trim(),
    sourceSystem,
  };
}

module.exports = {
  WAREHOUSE,
  HISTORY_TABLE_ALLOWLIST,
  qualifiedTable,
  assertSelfOwnedHistoryTable,
  parseBoolean,
  validateBackfillRequest,
};
