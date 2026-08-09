CREATE OR REPLACE VIEW `borojeet.gsc_analytics.search_analytics_detail` AS
WITH api_history AS (
  SELECT
    property,
    LOWER(search_type) AS search_type,
    data_date,
    NULLIF(query, '') AS query,
    is_anonymized_query,
    page,
    UPPER(device) AS device,
    LOWER(country) AS country,
    CAST(NULL AS BOOL) AS is_anonymized_discover,
    clicks,
    impressions,
    position_sum_1based,
    source_system,
    source_quality,
    CAST(NULL AS INT64) AS source_epoch_version,
    CAST(NULL AS TIMESTAMP) AS source_publish_time,
    run_id AS source_run_id,
    loaded_at
  FROM `borojeet.gsc_history.api_search_analytics_detail`
  WHERE data_date < DATE '2026-08-07'
    AND source_system = 'search_console_api'
),
native_url_aggregated AS (
  SELECT
    site_url AS property,
    LOWER(search_type) AS search_type,
    data_date,
    CASE
      WHEN COALESCE(is_anonymized_query, FALSE) THEN NULL
      ELSE NULLIF(query, '')
    END AS query,
    is_anonymized_query,
    url AS page,
    UPPER(device) AS device,
    LOWER(country) AS country,
    is_anonymized_discover,
    SUM(clicks) AS clicks,
    SUM(impressions) AS impressions,
    CAST(SUM(sum_position) + SUM(impressions) AS FLOAT64) AS position_sum_1based
  FROM `borojeet.searchconsole_borojeet.searchdata_url_impression`
  WHERE data_date >= DATE '2026-08-07'
  GROUP BY
    property, search_type, data_date, query, is_anonymized_query,
    page, device, country, is_anonymized_discover
),
native_url AS (
  SELECT
    n.property,
    n.search_type,
    n.data_date,
    n.query,
    n.is_anonymized_query,
    n.page,
    n.device,
    n.country,
    n.is_anonymized_discover,
    n.clicks,
    n.impressions,
    n.position_sum_1based,
    'search_console_bulk_export' AS source_system,
    'native_bulk' AS source_quality,
    l.epoch_version AS source_epoch_version,
    l.publish_time AS source_publish_time,
    CAST(NULL AS STRING) AS source_run_id,
    l.publish_time AS loaded_at
  FROM native_url_aggregated n
  INNER JOIN `borojeet.gsc_analytics.latest_export_log` l
    ON l.namespace = 'SEARCHDATA_URL_IMPRESSION'
   AND l.data_date = n.data_date
)
SELECT
  property,
  search_type,
  data_date,
  query,
  is_anonymized_query,
  page,
  device,
  country,
  is_anonymized_discover,
  clicks,
  impressions,
  SAFE_DIVIDE(clicks, impressions) AS ctr,
  position_sum_1based,
  SAFE_DIVIDE(position_sum_1based, impressions) AS avg_position,
  source_system,
  source_quality,
  source_epoch_version,
  source_publish_time,
  source_run_id,
  loaded_at
FROM api_history

UNION ALL

SELECT
  property,
  search_type,
  data_date,
  query,
  is_anonymized_query,
  page,
  device,
  country,
  is_anonymized_discover,
  clicks,
  impressions,
  SAFE_DIVIDE(clicks, impressions) AS ctr,
  position_sum_1based,
  SAFE_DIVIDE(position_sum_1based, impressions) AS avg_position,
  source_system,
  source_quality,
  source_epoch_version,
  source_publish_time,
  source_run_id,
  loaded_at
FROM native_url;
