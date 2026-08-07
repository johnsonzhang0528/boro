const { URL } = require('url');

function propertyDomain(property) {
  if (!property.startsWith('sc-domain:')) {
    throw new Error(`Only sc-domain properties are supported by v1 hostname validation: ${property}`);
  }
  return property.slice('sc-domain:'.length).toLowerCase();
}

function validateRow(row, { property, expectedDate }) {
  const errors = [];
  if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errors.push('date is missing or invalid');
  if (expectedDate && row.date !== expectedDate) errors.push(`date ${row.date} does not match requested date ${expectedDate}`);

  for (const field of ['clicks', 'impressions', 'ctr', 'position']) {
    if (typeof row[field] !== 'number' || !Number.isFinite(row[field])) errors.push(`${field} must be a finite number`);
  }
  if (Number.isFinite(row.clicks) && row.clicks < 0) errors.push('clicks must be >= 0');
  if (Number.isFinite(row.impressions) && row.impressions < 0) errors.push('impressions must be >= 0');
  if (Number.isFinite(row.clicks) && Number.isFinite(row.impressions) && row.impressions < row.clicks) errors.push('impressions must be >= clicks');
  if (Number.isFinite(row.ctr) && (row.ctr < 0 || row.ctr > 1)) errors.push('ctr must be between 0 and 1');
  if (Number.isFinite(row.position) && row.position <= 0) errors.push('position must be > 0');
  if (!row.device || !String(row.device).trim()) errors.push('device must be non-empty');
  if (!row.country || !String(row.country).trim()) errors.push('country must be non-empty');

  try {
    const host = new URL(row.page).hostname.toLowerCase();
    const domain = propertyDomain(property);
    if (host !== domain && !host.endsWith(`.${domain}`)) errors.push(`page hostname is outside ${domain}`);
  } catch (_) {
    errors.push('page must be a valid URL');
  }
  return errors;
}

function normalizeApiRow(apiRow, metadata, expectedDate) {
  if (!apiRow || !Array.isArray(apiRow.keys) || apiRow.keys.length !== 5) {
    throw new Error('Malformed GSC row: expected exactly five dimension keys.');
  }
  const [date, query, page, device, country] = apiRow.keys;
  const row = {
    property: metadata.property,
    search_type: metadata.searchType,
    data_state: metadata.dataState,
    date,
    query: query ?? '',
    page,
    device,
    country,
    clicks: Number(apiRow.clicks),
    impressions: Number(apiRow.impressions),
    ctr: Number(apiRow.ctr),
    position: Number(apiRow.position),
    extracted_at: metadata.extractedAt,
  };
  const errors = validateRow(row, { property: metadata.property, expectedDate });
  if (errors.length) throw new Error(`Invalid GSC row: ${errors.join('; ')}`);
  return row;
}

function logicalKey(row) {
  return [row.property, row.search_type, row.date, row.query, row.page, row.device, row.country].join('\u001f');
}

function dedupeRows(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = logicalKey(row);
    const prior = map.get(key);
    if (!prior) {
      map.set(key, row);
      continue;
    }
    const metrics = ['clicks', 'impressions', 'ctr', 'position'];
    if (metrics.some((field) => prior[field] !== row[field])) {
      throw new Error(`Conflicting duplicate logical key: ${key}`);
    }
  }
  return [...map.values()];
}

module.exports = { propertyDomain, validateRow, normalizeApiRow, logicalKey, dedupeRows };
