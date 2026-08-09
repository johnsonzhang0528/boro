CREATE OR REPLACE VIEW `borojeet.gsc_analytics.search_analytics_site_daily` AS
WITH api_site AS (
  SELECT
    property,
    LOWER(search_type) AS search_type,
    data_date,
    clicks,
    impressions,
    position_sum_1based,
    source_system,
    source_quality,
    CAST(NULL AS INT64) AS source_epoch_version,
    CAST(NULL AS TIMESTAMP) AS source_publish_time,
    run_id AS source_run_id,
    loaded_at
  FROM `borojeet.gsc_history.api_search_analytics_daily_aggregate`
  WHERE data_date < DATE '2026-08-07'
    AND source_system = 'search_console_api'
),
native_site_aggregated AS (
  SELECT
    site_url AS property,
    LOWER(search_type) AS search_type,
    data_date,
    SUM(clicks) AS clicks,
    SUM(impressions) AS impressions,
    CAST(SUM(sum_top_position) + SUM(impressions) AS FLOAT64) AS position_sum_1based
  FROM `borojeet.searchconsole_borojeet.searchdata_site_impression`
  WHERE data_date >= DATE '2026-08-07'
  GROUP BY property, search_type, data_date
),
native_site AS (
  SELECT
    n.property,
    n.search_type,
    n.data_date,
    n.clicks,
    n.impressions,
    n.position_sum_1based,
    'search_console_bulk_export' AS source_system,
    'native_bulk' AS source_quality,
    l.epoch_version AS source_epoch_version,
    l.publish_time AS source_publish_time,
    CAST(NULL AS STRING) AS source_run_id,
    l.publish_time AS loaded_at
  FROM native_site_aggregated n
  INNER JOIN `borojeet.gsc_analytics.latest_export_log` l
    ON l.namespace = 'SEARCHDATA_SITE_IMPRESSION'
   AND l.data_date = n.data_date
)
SELECT
  property,
  search_type,
  data_date,
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
FROM api_site

UNION ALL

SELECT
  property,
  search_type,
  data_date,
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
FROM native_site;
