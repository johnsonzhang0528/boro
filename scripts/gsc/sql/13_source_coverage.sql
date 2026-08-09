CREATE OR REPLACE VIEW `borojeet.gsc_analytics.source_coverage` AS
WITH parameters AS (
  SELECT
    DATE '2025-04-03' AS history_start_date,
    DATE '2026-08-07' AS cutover_date,
    DATE_SUB(CURRENT_DATE('America/Los_Angeles'), INTERVAL 3 DAY) AS expected_native_through_date
),
api AS (
  SELECT
    data_date,
    COUNT(*) AS aggregate_rows
  FROM `borojeet.gsc_history.api_search_analytics_daily_aggregate`
  WHERE data_date >= DATE '2025-04-03'
    AND data_date < DATE '2026-08-07'
    AND property = 'sc-domain:borojeetbd.com'
    AND search_type = 'web'
    AND source_system = 'search_console_api'
  GROUP BY data_date
),
native AS (
  SELECT
    data_date,
    MAX(IF(namespace = 'SEARCHDATA_SITE_IMPRESSION', epoch_version, NULL)) AS site_epoch_version,
    MAX(IF(namespace = 'SEARCHDATA_SITE_IMPRESSION', publish_time, NULL)) AS site_publish_time,
    MAX(IF(namespace = 'SEARCHDATA_URL_IMPRESSION', epoch_version, NULL)) AS url_epoch_version,
    MAX(IF(namespace = 'SEARCHDATA_URL_IMPRESSION', publish_time, NULL)) AS url_publish_time
  FROM `borojeet.gsc_analytics.latest_export_log`
  WHERE data_date >= DATE '2026-08-07'
  GROUP BY data_date
),
dates AS (
  SELECT data_date
  FROM parameters,
  UNNEST(GENERATE_DATE_ARRAY(
    history_start_date,
    GREATEST(DATE_SUB(cutover_date, INTERVAL 1 DAY), expected_native_through_date)
  )) AS data_date
)
SELECT
  d.data_date,
  IF(
    d.data_date < DATE '2026-08-07',
    'search_console_api',
    'search_console_bulk_export'
  ) AS expected_canonical_source,
  COALESCE(a.aggregate_rows, 0) = 1 AS api_daily_aggregate_present,
  n.site_epoch_version IS NOT NULL AS native_site_export_present,
  n.url_epoch_version IS NOT NULL AS native_url_export_present,
  n.site_epoch_version,
  n.site_publish_time,
  n.url_epoch_version,
  n.url_publish_time,
  IF(
    d.data_date < DATE '2026-08-07',
    COALESCE(a.aggregate_rows, 0) = 1,
    n.site_epoch_version IS NOT NULL
  ) AS canonical_site_complete,
  IF(
    d.data_date < DATE '2026-08-07',
    COALESCE(a.aggregate_rows, 0) = 1,
    n.url_epoch_version IS NOT NULL
  ) AS canonical_detail_complete
FROM dates d
LEFT JOIN api a USING (data_date)
LEFT JOIN native n USING (data_date);
