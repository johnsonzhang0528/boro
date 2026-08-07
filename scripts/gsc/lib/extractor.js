const { enumerateDates } = require('./cli');
const { withRetry } = require('./client');
const { normalizeApiRow, dedupeRows } = require('./validate');

const DIMENSIONS = ['date', 'query', 'page', 'device', 'country'];

async function queryApi(searchConsole, siteUrl, requestBody, retryOptions) {
  return withRetry(async () => {
    const response = await searchConsole.searchanalytics.query({ siteUrl, requestBody });
    return response.data || response;
  }, retryOptions);
}

async function extractDaily({ searchConsole, date, property, searchType, dataState, rowLimit = 25000, extractedAt, retryOptions, onPage }) {
  const rows = [];
  let startRow = 0;
  let pagesRequested = 0;
  while (true) {
    const requestBody = {
      startDate: date,
      endDate: date,
      dimensions: DIMENSIONS,
      type: searchType,
      dataState,
      rowLimit,
      startRow,
    };
    const data = await queryApi(searchConsole, property, requestBody, retryOptions);
    pagesRequested += 1;
    const apiRows = Array.isArray(data.rows) ? data.rows : [];
    if (onPage) onPage({ date, startRow, count: apiRows.length });
    for (const apiRow of apiRows) {
      rows.push(normalizeApiRow(apiRow, { property, searchType, dataState, extractedAt }, date));
    }
    if (apiRows.length === 0 || apiRows.length < rowLimit) break;
    startRow += apiRows.length;
  }
  return { rows: dedupeRows(rows), pagesRequested };
}

async function fetchAggregate({ searchConsole, startDate, endDate, property, searchType, dataState, retryOptions }) {
  const data = await queryApi(searchConsole, property, {
    startDate,
    endDate,
    dimensions: [],
    type: searchType,
    dataState,
    rowLimit: 1,
    startRow: 0,
  }, retryOptions);
  const row = Array.isArray(data.rows) ? data.rows[0] : null;
  return row ? {
    clicks: Number(row.clicks), impressions: Number(row.impressions), ctr: Number(row.ctr), position: Number(row.position),
  } : { clicks: 0, impressions: 0, ctr: 0, position: null };
}

async function extractRange(options) {
  const dates = enumerateDates(options.startDate, options.endDate);
  const allRows = [];
  const dailyAggregates = {};
  let pagesRequested = 0;

  for (const date of dates) {
    const daily = await extractDaily({ ...options, date });
    allRows.push(...daily.rows);
    pagesRequested += daily.pagesRequested;
    dailyAggregates[date] = await fetchAggregate({ ...options, startDate: date, endDate: date });
  }

  const aggregate = await fetchAggregate({ ...options, startDate: options.startDate, endDate: options.endDate });
  return { dates, rows: dedupeRows(allRows), pagesRequested, aggregate, dailyAggregates };
}

module.exports = { DIMENSIONS, queryApi, extractDaily, fetchAggregate, extractRange };
