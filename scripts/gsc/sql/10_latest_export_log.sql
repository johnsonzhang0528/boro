CREATE OR REPLACE VIEW `borojeet.gsc_analytics.latest_export_log` AS
SELECT
  agenda,
  namespace,
  data_date,
  epoch_version,
  publish_time
FROM `borojeet.searchconsole_borojeet.ExportLog`
WHERE agenda = 'SEARCHDATA'
  AND namespace IN (
    'SEARCHDATA_SITE_IMPRESSION',
    'SEARCHDATA_URL_IMPRESSION'
  )
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY namespace, data_date
  ORDER BY epoch_version DESC, publish_time DESC
) = 1;
