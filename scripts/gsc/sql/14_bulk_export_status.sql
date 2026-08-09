CREATE OR REPLACE VIEW `borojeet.gsc_analytics.bulk_export_status` AS
WITH parameters AS (
  SELECT
    DATE '2026-08-07' AS cutover_date,
    DATE_SUB(CURRENT_DATE('America/Los_Angeles'), INTERVAL 3 DAY) AS expected_through_date
),
required_namespaces AS (
  SELECT namespace
  FROM UNNEST([
    'SEARCHDATA_SITE_IMPRESSION',
    'SEARCHDATA_URL_IMPRESSION'
  ]) AS namespace
),
recent_dates AS (
  SELECT data_date
  FROM parameters,
  UNNEST(IF(
    expected_through_date >= cutover_date,
    GENERATE_DATE_ARRAY(
      GREATEST(cutover_date, DATE_SUB(expected_through_date, INTERVAL 6 DAY)),
      expected_through_date
    ),
    ARRAY<DATE>[]
  )) AS data_date
),
latest_by_namespace AS (
  SELECT
    namespace,
    data_date AS latest_data_date,
    epoch_version AS latest_epoch_version,
    publish_time AS latest_publish_time
  FROM `borojeet.gsc_analytics.latest_export_log`
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY namespace
    ORDER BY data_date DESC, epoch_version DESC, publish_time DESC
  ) = 1
),
missing AS (
  SELECT
    r.namespace,
    COUNTIF(l.data_date IS NULL) AS missing_finalized_dates
  FROM required_namespaces r
  CROSS JOIN recent_dates d
  LEFT JOIN `borojeet.gsc_analytics.latest_export_log` l
    ON l.namespace = r.namespace
   AND l.data_date = d.data_date
  GROUP BY r.namespace
)
SELECT
  r.namespace,
  p.expected_through_date,
  l.latest_data_date,
  l.latest_epoch_version,
  l.latest_publish_time,
  COALESCE(m.missing_finalized_dates, 0) AS missing_finalized_dates,
  l.latest_data_date IS NOT NULL
    AND l.latest_data_date >= p.expected_through_date
    AND l.latest_epoch_version IS NOT NULL
    AND l.latest_epoch_version >= 0
    AND l.latest_publish_time IS NOT NULL
    AND TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), l.latest_publish_time, HOUR) <= 96
    AND COALESCE(m.missing_finalized_dates, 0) = 0 AS is_healthy
FROM required_namespaces r
CROSS JOIN parameters p
LEFT JOIN latest_by_namespace l USING (namespace)
LEFT JOIN missing m USING (namespace);
