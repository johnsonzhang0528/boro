#!/usr/bin/env node
const { WAREHOUSE, qualifiedTable } = require('./lib/warehouse-config');
const { createBigQueryClient } = require('./lib/warehouse-auth');

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

async function main(dependencies = {}) {
  const logger = dependencies.logger || console;
  const bigquery = dependencies.bigquery || (dependencies.createBigQueryClient || createBigQueryClient)();
  const statusView = qualifiedTable(WAREHOUSE.analyticsDataset, WAREHOUSE.analyticsViews.bulkExportStatus);
  const query = `
SELECT
  namespace,
  expected_through_date,
  latest_data_date,
  latest_epoch_version,
  latest_publish_time,
  missing_finalized_dates,
  is_healthy
FROM ${statusView}
ORDER BY namespace`;
  const [rows] = await bigquery.query({ query, location: WAREHOUSE.location });
  if (!Array.isArray(rows) || rows.length !== 2) {
    throw new Error(`Bulk export health expected 2 namespace rows, received ${rows?.length || 0}.`);
  }
  const unhealthy = rows.filter((row) => !normalizeBoolean(row.is_healthy));
  for (const row of rows) {
    logger.log([
      row.namespace,
      `latest=${row.latest_data_date || 'missing'}`,
      `expected=${row.expected_through_date}`,
      `epoch=${row.latest_epoch_version ?? 'missing'}`,
      `missing_dates=${row.missing_finalized_dates}`,
      `healthy=${normalizeBoolean(row.is_healthy)}`,
    ].join(' '));
  }
  if (unhealthy.length) {
    throw new Error(`Bulk export health failed for: ${unhealthy.map((row) => row.namespace).join(', ')}`);
  }
  logger.log('GSC Native Bulk Export health check succeeded.');
  return rows;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`GSC warehouse health failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { normalizeBoolean, main };
