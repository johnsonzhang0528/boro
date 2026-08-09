const { GSC_SCOPE } = require('./config');
const { createSearchConsoleClient } = require('./client');
const { WAREHOUSE } = require('./warehouse-config');

function getGoogle(override) {
  if (override) return override;
  try {
    return require('googleapis').google;
  } catch (_) {
    throw new Error('googleapis dependency is required for API backfill.');
  }
}

function createAdcSearchConsoleClient(googleOverride) {
  const google = getGoogle(googleOverride);
  const auth = new google.auth.GoogleAuth({ scopes: [GSC_SCOPE] });
  return createSearchConsoleClient(auth, google);
}

function createBigQueryClient(BigQueryOverride) {
  let BigQuery = BigQueryOverride;
  if (!BigQuery) {
    try {
      ({ BigQuery } = require('@google-cloud/bigquery'));
    } catch (_) {
      throw new Error('@google-cloud/bigquery dependency is required for warehouse operations.');
    }
  }
  return new BigQuery({ projectId: WAREHOUSE.projectId });
}

module.exports = { createAdcSearchConsoleClient, createBigQueryClient };
