const test = require('node:test');
const assert = require('node:assert/strict');
const { extractDaily, extractRange } = require('../../scripts/gsc/lib/extractor');

function row(date, query = 'borojeet') {
  return { keys: [date, query, 'https://borojeetbd.com/', 'MOBILE', 'bgd'], clicks: 1, impressions: 10, ctr: 0.1, position: 2 };
}

test('pagination advances startRow by row count until short page', async () => {
  const calls = [];
  const searchConsole = { searchanalytics: { query: async ({ requestBody }) => {
    calls.push(requestBody.startRow);
    const rows = requestBody.startRow === 0 ? Array.from({ length: 3 }, (_, i) => row('2026-08-01', `q${i}`)) : [row('2026-08-01', 'q3')];
    return { data: { rows } };
  } } };
  const result = await extractDaily({ searchConsole, date: '2026-08-01', property: 'sc-domain:borojeetbd.com', searchType: 'web', dataState: 'final', rowLimit: 3, extractedAt: '2026-08-08T00:00:00.000Z' });
  assert.deepEqual(calls, [0, 3]);
  assert.equal(result.rows.length, 4);
  assert.equal(result.pagesRequested, 2);
});

test('empty response succeeds with zero rows', async () => {
  const searchConsole = { searchanalytics: { query: async () => ({ data: {} }) } };
  const result = await extractDaily({ searchConsole, date: '2026-08-01', property: 'sc-domain:borojeetbd.com', searchType: 'web', dataState: 'final', extractedAt: 'x' });
  assert.equal(result.rows.length, 0);
  assert.equal(result.pagesRequested, 1);
});

test('multi-day orchestration sends one-day detail requests, never a range detail request', async () => {
  const detailCalls = [];
  const searchConsole = { searchanalytics: { query: async ({ requestBody }) => {
    if (requestBody.dimensions.length === 5) detailCalls.push([requestBody.startDate, requestBody.endDate, requestBody.startRow]);
    return { data: { rows: requestBody.dimensions.length === 5 ? [row(requestBody.startDate)] : [{ clicks: 1, impressions: 10, ctr: 0.1, position: 2 }] } };
  } } };
  const result = await extractRange({ searchConsole, startDate: '2026-08-01', endDate: '2026-08-03', property: 'sc-domain:borojeetbd.com', searchType: 'web', dataState: 'final', rowLimit: 25000, extractedAt: 'x' });
  assert.deepEqual(detailCalls, [
    ['2026-08-01', '2026-08-01', 0],
    ['2026-08-02', '2026-08-02', 0],
    ['2026-08-03', '2026-08-03', 0],
  ]);
  assert.equal(result.rows.length, 3);
  assert.deepEqual(Object.keys(result.dailyAggregates), ['2026-08-01', '2026-08-02', '2026-08-03']);
});

test('API retry handles transient error then succeeds', async () => {
  let attempts = 0;
  const searchConsole = { searchanalytics: { query: async () => {
    attempts += 1;
    if (attempts === 1) { const error = new Error('temporary'); error.response = { status: 503 }; throw error; }
    return { data: { rows: [] } };
  } } };
  await extractDaily({ searchConsole, date: '2026-08-01', property: 'sc-domain:borojeetbd.com', searchType: 'web', dataState: 'final', extractedAt: 'x', retryOptions: { sleep: async () => {}, random: () => 0.5 } });
  assert.equal(attempts, 2);
});

test('network transport errors are retried', async () => {
  let attempts = 0;
  const searchConsole = { searchanalytics: { query: async () => {
    attempts += 1;
    if (attempts === 1) { const error = new Error('reset'); error.code = 'ECONNRESET'; throw error; }
    return { data: { rows: [] } };
  } } };
  await extractDaily({ searchConsole, date: '2026-08-01', property: 'sc-domain:borojeetbd.com', searchType: 'web', dataState: 'final', extractedAt: 'x', retryOptions: { sleep: async () => {}, random: () => 0.5 } });
  assert.equal(attempts, 2);
});
