-- Read-only post-deployment acceptance checks for the verified initial load.
-- Run after the history tables and all analytical views have been deployed.

ASSERT (
  SELECT COUNT(*)
  FROM `borojeet.gsc_history.api_search_analytics_daily_aggregate`
  WHERE data_date BETWEEN DATE '2025-04-03' AND DATE '2026-08-06'
    AND property = 'sc-domain:borojeetbd.com'
    AND search_type = 'web'
    AND source_system = 'search_console_api'
) = 491 AS 'Expected one API daily aggregate for each of 491 historical dates';

ASSERT (
  SELECT COUNT(*)
  FROM `borojeet.gsc_history.api_search_analytics_detail`
  WHERE data_date BETWEEN DATE '2025-04-03' AND DATE '2026-08-06'
    AND property = 'sc-domain:borojeetbd.com'
    AND search_type = 'web'
    AND source_system = 'search_console_api'
) = 18214 AS 'Expected 18,214 visible historical API detail rows';

ASSERT (
  SELECT COALESCE(SUM(clicks), 0) = 0 AND COALESCE(SUM(impressions), 0) = 0
  FROM `borojeet.gsc_history.api_search_analytics_daily_aggregate`
  WHERE data_date BETWEEN DATE '2025-04-03' AND DATE '2025-09-30'
    AND property = 'sc-domain:borojeetbd.com'
    AND search_type = 'web'
    AND source_system = 'search_console_api'
) AS 'Expected the 181 validated early historical dates to have zero aggregate traffic';

ASSERT (
  SELECT COUNT(*)
  FROM `borojeet.gsc_analytics.source_coverage`
  WHERE data_date BETWEEN DATE '2025-04-03' AND DATE '2026-08-06'
    AND (NOT canonical_site_complete OR NOT canonical_detail_complete)
) = 0 AS 'Historical canonical coverage has missing dates';

ASSERT (
  SELECT COUNT(*)
  FROM `borojeet.gsc_analytics.latest_export_log`
  WHERE data_date = DATE '2026-08-07'
    AND namespace IN ('SEARCHDATA_SITE_IMPRESSION', 'SEARCHDATA_URL_IMPRESSION')
    AND epoch_version = 0
) = 2 AS 'Expected both verified Native namespaces at epoch 0 on cutover day';

ASSERT (
  SELECT clicks = 21 AND impressions = 2390
  FROM `borojeet.gsc_analytics.search_analytics_site_daily`
  WHERE data_date = DATE '2026-08-07'
    AND property = 'sc-domain:borojeetbd.com'
    AND search_type = 'web'
    AND source_system = 'search_console_bulk_export'
) AS 'Cutover-day Native site totals differ from the verified export';

ASSERT (
  SELECT SUM(clicks) = 22 AND SUM(impressions) = 2606
  FROM `borojeet.gsc_analytics.search_analytics_detail`
  WHERE data_date = DATE '2026-08-07'
    AND property = 'sc-domain:borojeetbd.com'
    AND search_type = 'web'
    AND source_system = 'search_console_bulk_export'
) AS 'Cutover-day Native URL totals differ from the verified export';

ASSERT (
  SELECT COUNT(*) = 149 AND COUNT(DISTINCT url) = 40
  FROM `borojeet.searchconsole_borojeet.searchdata_url_impression`
  WHERE data_date = DATE '2026-08-07'
    AND site_url = 'sc-domain:borojeetbd.com'
    AND LOWER(search_type) = 'web'
) AS 'Cutover-day Native raw URL shape differs from the verified export';

ASSERT (
  SELECT COUNT(*)
  FROM `borojeet.gsc_analytics.search_analytics_detail`
  WHERE (data_date < DATE '2026-08-07' AND source_system != 'search_console_api')
     OR (data_date >= DATE '2026-08-07' AND source_system != 'search_console_bulk_export')
) = 0 AS 'Canonical detail source violates the explicit date policy';
