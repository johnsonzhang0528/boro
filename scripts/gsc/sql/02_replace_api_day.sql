ASSERT @source_system IN ('search_console_api', 'search_console_api_fallback')
  AS 'Unsupported source system';
ASSERT (
  (@source_system = 'search_console_api' AND DATE(@data_date) < DATE '2026-08-07')
  OR
  (@source_system = 'search_console_api_fallback' AND DATE(@data_date) >= DATE '2026-08-07')
) AS 'API source violates the explicit 2026-08-07 cutover policy';

BEGIN TRANSACTION;

DELETE FROM `borojeet.gsc_history.api_search_analytics_detail`
WHERE data_date = DATE(@data_date)
  AND property = @property
  AND search_type = @search_type
  AND source_system = @source_system;

INSERT INTO `borojeet.gsc_history.api_search_analytics_detail` (
  property, search_type, data_date, query, is_anonymized_query, page,
  device, country, clicks, impressions, ctr, position,
  position_sum_1based, data_state, extracted_at,
  source_extraction_run_id, run_id, source_system, source_quality, loaded_at
)
SELECT
  property, search_type, data_date, query, is_anonymized_query, page,
  device, country, clicks, impressions, ctr, position,
  position_sum_1based, data_state, extracted_at,
  source_extraction_run_id, run_id, source_system, source_quality, loaded_at
FROM {{STAGING_TABLE}};

DELETE FROM `borojeet.gsc_history.api_search_analytics_daily_aggregate`
WHERE data_date = DATE(@data_date)
  AND property = @property
  AND search_type = @search_type
  AND source_system = @source_system;

INSERT INTO `borojeet.gsc_history.api_search_analytics_daily_aggregate` (
  property, search_type, data_date, clicks, impressions, ctr, position,
  position_sum_1based, data_state, extracted_at,
  source_extraction_run_id, run_id, source_system, source_quality, loaded_at
)
VALUES (
  @property, @search_type, DATE(@data_date), @aggregate_clicks,
  @aggregate_impressions, @aggregate_ctr,
  IF(@aggregate_has_position, @aggregate_position, NULL),
  @aggregate_position_sum_1based, @data_state, TIMESTAMP(@extracted_at),
  NULLIF(@source_extraction_run_id, ''), @run_id, @source_system,
  @source_quality, TIMESTAMP(@loaded_at)
);

INSERT INTO `borojeet.gsc_history.api_backfill_run_dates` (
  run_id, data_date, attempt, status, source_system,
  source_extraction_run_id, rows_extracted, pages_requested,
  detail_sha256, extracted_at, committed_at, error_code, error_message
)
VALUES (
  @run_id, DATE(@data_date), 1, 'committed', @source_system,
  NULLIF(@source_extraction_run_id, ''), @rows_extracted, @pages_requested,
  @detail_sha256, TIMESTAMP(@extracted_at), CURRENT_TIMESTAMP(), NULL, NULL
);

COMMIT TRANSACTION;
