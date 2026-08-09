CREATE TABLE IF NOT EXISTS `borojeet.gsc_history.api_search_analytics_detail` (
  property STRING NOT NULL,
  search_type STRING NOT NULL,
  data_date DATE NOT NULL,
  query STRING,
  is_anonymized_query BOOL,
  page STRING NOT NULL,
  device STRING NOT NULL,
  country STRING NOT NULL,
  clicks INT64 NOT NULL,
  impressions INT64 NOT NULL,
  ctr FLOAT64 NOT NULL,
  position FLOAT64 NOT NULL,
  position_sum_1based FLOAT64 NOT NULL,
  data_state STRING NOT NULL,
  extracted_at TIMESTAMP NOT NULL,
  source_extraction_run_id STRING,
  run_id STRING NOT NULL,
  source_system STRING NOT NULL,
  source_quality STRING NOT NULL,
  loaded_at TIMESTAMP NOT NULL
)
PARTITION BY data_date
CLUSTER BY property, search_type, source_system, device
OPTIONS(
  require_partition_filter = TRUE,
  description = 'Current idempotent Search Console API detail partitions; never Native Bulk Export data'
);

CREATE TABLE IF NOT EXISTS `borojeet.gsc_history.api_search_analytics_daily_aggregate` (
  property STRING NOT NULL,
  search_type STRING NOT NULL,
  data_date DATE NOT NULL,
  clicks INT64 NOT NULL,
  impressions INT64 NOT NULL,
  ctr FLOAT64 NOT NULL,
  position FLOAT64,
  position_sum_1based FLOAT64 NOT NULL,
  data_state STRING NOT NULL,
  extracted_at TIMESTAMP NOT NULL,
  source_extraction_run_id STRING,
  run_id STRING NOT NULL,
  source_system STRING NOT NULL,
  source_quality STRING NOT NULL,
  loaded_at TIMESTAMP NOT NULL
)
PARTITION BY data_date
CLUSTER BY property, search_type, source_system
OPTIONS(
  require_partition_filter = TRUE,
  description = 'API property-level daily aggregates, including explicit successful empty dates'
);

CREATE TABLE IF NOT EXISTS `borojeet.gsc_history.api_backfill_runs` (
  run_id STRING NOT NULL,
  event_sequence INT64 NOT NULL,
  event_type STRING NOT NULL,
  status STRING NOT NULL,
  input_source STRING NOT NULL,
  load_mode STRING NOT NULL,
  source_system STRING NOT NULL,
  property STRING NOT NULL,
  search_type STRING NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cutover_date DATE NOT NULL,
  rows_extracted INT64 NOT NULL,
  pages_requested INT64 NOT NULL,
  dates_committed INT64 NOT NULL,
  range_clicks INT64,
  range_impressions INT64,
  range_ctr FLOAT64,
  range_position FLOAT64,
  range_position_sum_1based FLOAT64,
  github_run_id STRING,
  github_run_attempt STRING,
  git_ref STRING,
  git_sha STRING,
  actor STRING,
  reason STRING,
  error_code STRING,
  error_message STRING,
  event_at TIMESTAMP NOT NULL
)
PARTITION BY DATE(event_at)
CLUSTER BY run_id, status, source_system
OPTIONS(description = 'Append-only API backfill run events');

CREATE TABLE IF NOT EXISTS `borojeet.gsc_history.api_backfill_run_dates` (
  run_id STRING NOT NULL,
  data_date DATE NOT NULL,
  attempt INT64 NOT NULL,
  status STRING NOT NULL,
  source_system STRING NOT NULL,
  source_extraction_run_id STRING,
  rows_extracted INT64 NOT NULL,
  pages_requested INT64 NOT NULL,
  detail_sha256 STRING NOT NULL,
  extracted_at TIMESTAMP NOT NULL,
  committed_at TIMESTAMP,
  error_code STRING,
  error_message STRING
)
PARTITION BY data_date
CLUSTER BY run_id, status
OPTIONS(description = 'Append-only per-date backfill audit events');
