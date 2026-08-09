const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const sqlDir = path.resolve(__dirname, '../../scripts/gsc/sql');
const read = (name) => fs.readFileSync(path.join(sqlDir, name), 'utf8');

test('SQL never mutates Search Console vendor-managed raw tables', () => {
  const sql = fs.readdirSync(sqlDir)
    .filter((name) => name.endsWith('.sql'))
    .map(read)
    .join('\n');
  const nativeTarget = '`borojeet\\.searchconsole_borojeet\\.[^`]+`';
  const mutation = new RegExp(`\\b(?:ALTER\\s+TABLE(?:\\s+IF\\s+EXISTS)?|CREATE(?:\\s+OR\\s+REPLACE)?\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?|DROP\\s+TABLE(?:\\s+IF\\s+EXISTS)?|TRUNCATE\\s+TABLE|INSERT\\s+INTO|UPDATE|DELETE\\s+FROM|MERGE(?:\\s+INTO)?|LOAD\\s+DATA(?:\\s+OVERWRITE|\\s+INTO)?)\\s+${nativeTarget}`, 'i');
  assert.doesNotMatch(sql, mutation);
});

test('canonical URL detail uses an explicit non-overlapping cutover', () => {
  const sql = read('11_search_analytics_detail.sql');
  assert.match(sql, /data_date\s*>=\s*DATE\s+'2026-08-07'/);
  assert.match(sql, /data_date\s*<\s*DATE\s+'2026-08-07'/);
  assert.doesNotMatch(sql, /UNION\s+DISTINCT/i);
  assert.doesNotMatch(sql, /ROW_NUMBER\(\).*source_system/is);
});

test('native data is filtered to the latest ExportLog epoch', () => {
  const latest = read('10_latest_export_log.sql');
  assert.match(latest, /PARTITION BY namespace, data_date/);
  assert.match(latest, /ORDER BY epoch_version DESC, publish_time DESC/);
  assert.match(latest, /QUALIFY ROW_NUMBER\(\) OVER/);
  for (const name of ['11_search_analytics_detail.sql', '12_search_analytics_site_daily.sql']) {
    const sql = read(name);
    assert.match(sql, /latest_export_log/);
    assert.match(sql, /epoch_version/);
  }
});

test('position and CTR are impression-weighted and anonymous queries remain null', () => {
  const detail = read('11_search_analytics_detail.sql');
  const site = read('12_search_analytics_site_daily.sql');
  assert.match(detail, /SUM\(sum_position\) \+ SUM\(impressions\)/);
  assert.match(detail, /SAFE_DIVIDE\(position_sum_1based, impressions\) AS avg_position/);
  assert.match(site, /SUM\(sum_top_position\) \+ SUM\(impressions\)/);
  assert.match(site, /SAFE_DIVIDE\(position_sum_1based, impressions\) AS avg_position/);
  assert.match(detail, /SAFE_DIVIDE\(clicks, impressions\) AS ctr/);
  assert.match(detail, /WHEN COALESCE\(is_anonymized_query, FALSE\) THEN NULL/);
  assert.doesNotMatch(detail, /anonymous query|\(anonymous\)/i);
  assert.doesNotMatch(`${detail}\n${site}`, /AVG\s*\(\s*(?:position|ctr)/i);
});

test('site and URL canonical models stay separate', () => {
  const detail = read('11_search_analytics_detail.sql');
  const site = read('12_search_analytics_site_daily.sql');
  assert.match(detail, /searchdata_url_impression/);
  assert.doesNotMatch(detail, /searchdata_site_impression/);
  assert.match(site, /searchdata_site_impression/);
  assert.doesNotMatch(site, /searchdata_url_impression/);
});

test('API date replacement only targets self-owned history tables', () => {
  const sql = read('02_replace_api_day.sql');
  assert.match(sql, /@source_system = 'search_console_api' AND DATE\(@data_date\) < DATE '2026-08-07'/);
  assert.match(sql, /@source_system = 'search_console_api_fallback' AND DATE\(@data_date\) >= DATE '2026-08-07'/);
  assert.match(sql, /BEGIN TRANSACTION/);
  assert.match(sql, /`borojeet\.gsc_history\.api_search_analytics_detail`/);
  assert.match(sql, /`borojeet\.gsc_history\.api_search_analytics_daily_aggregate`/);
  assert.doesNotMatch(sql, /`borojeet\.searchconsole_borojeet\./);
});

test('source coverage generates the full expected calendar so missing empty dates remain visible', () => {
  const sql = read('13_source_coverage.sql');
  assert.match(sql, /DATE '2025-04-03' AS history_start_date/);
  assert.match(sql, /GENERATE_DATE_ARRAY/);
  assert.match(sql, /expected_native_through_date/);
});

test('deployment validation fixes the verified history and cutover acceptance totals', () => {
  const sql = read('20_validate_deployment.sql');
  assert.match(sql, /\) = 491 AS/);
  assert.match(sql, /\) = 18214 AS/);
  assert.match(sql, /clicks = 21 AND impressions = 2390/);
  assert.match(sql, /SUM\(clicks\) = 22 AND SUM\(impressions\) = 2606/);
  assert.match(sql, /COUNT\(\*\) = 149 AND COUNT\(DISTINCT url\) = 40/);
});
