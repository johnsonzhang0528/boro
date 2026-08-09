const crypto = require('crypto');

function assertNonNegativeInteger(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer.`);
  }
}

function normalizeApiQuery(value) {
  if (value === null || value === undefined || value === '') {
    return { query: null, is_anonymized_query: null };
  }
  return { query: String(value), is_anonymized_query: false };
}

function positionSum1Based(position, impressions) {
  if (typeof position !== 'number' || !Number.isFinite(position) || position <= 0) {
    throw new Error('position must be a finite number greater than zero.');
  }
  assertNonNegativeInteger(impressions, 'impressions');
  return position * impressions;
}

function normalizeApiDetailRow(row, metadata) {
  assertNonNegativeInteger(row.clicks, 'clicks');
  assertNonNegativeInteger(row.impressions, 'impressions');
  if (row.clicks > row.impressions) throw new Error('clicks cannot exceed impressions.');
  if (typeof row.ctr !== 'number' || !Number.isFinite(row.ctr) || row.ctr < 0 || row.ctr > 1) {
    throw new Error('ctr must be between zero and one.');
  }
  const normalizedQuery = normalizeApiQuery(row.query);
  return {
    property: row.property,
    search_type: String(row.search_type).toLowerCase(),
    data_date: row.date,
    ...normalizedQuery,
    page: row.page,
    device: String(row.device).toUpperCase(),
    country: String(row.country).toLowerCase(),
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
    position_sum_1based: positionSum1Based(row.position, row.impressions),
    data_state: row.data_state,
    extracted_at: row.extracted_at,
    source_extraction_run_id: metadata.sourceExtractionRunId || null,
    run_id: metadata.runId,
    source_system: metadata.sourceSystem,
    source_quality: 'api_detail_limited',
    loaded_at: metadata.loadedAt,
  };
}

function normalizeApiDailyAggregate(aggregate, metadata) {
  const clicks = Number(aggregate?.clicks || 0);
  const impressions = Number(aggregate?.impressions || 0);
  assertNonNegativeInteger(clicks, 'aggregate clicks');
  assertNonNegativeInteger(impressions, 'aggregate impressions');
  if (clicks > impressions) throw new Error('aggregate clicks cannot exceed impressions.');

  const position = aggregate?.position === null || aggregate?.position === undefined
    ? null
    : Number(aggregate.position);
  if (impressions > 0 && (position === null || !Number.isFinite(position) || position <= 0)) {
    throw new Error('aggregate position must be present and positive when impressions are non-zero.');
  }
  const ctr = impressions === 0 ? 0 : clicks / impressions;
  return {
    property: metadata.property,
    search_type: metadata.searchType.toLowerCase(),
    data_date: metadata.date,
    clicks,
    impressions,
    ctr,
    position,
    position_sum_1based: position === null ? 0 : position * impressions,
    data_state: metadata.dataState,
    extracted_at: metadata.extractedAt,
    source_extraction_run_id: metadata.sourceExtractionRunId || null,
    run_id: metadata.runId,
    source_system: metadata.sourceSystem,
    source_quality: 'api_detail_limited',
    loaded_at: metadata.loadedAt,
  };
}

function checksumRows(rows) {
  const hash = crypto.createHash('sha256');
  for (const row of rows) hash.update(`${JSON.stringify(row)}\n`);
  return hash.digest('hex');
}

module.exports = {
  normalizeApiQuery,
  positionSum1Based,
  normalizeApiDetailRow,
  normalizeApiDailyAggregate,
  checksumRows,
};
