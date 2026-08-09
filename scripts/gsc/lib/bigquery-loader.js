const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const {
  WAREHOUSE,
  qualifiedTable,
  assertSelfOwnedHistoryTable,
} = require('./warehouse-config');

const DETAIL_COLUMNS = Object.freeze([
  'property',
  'search_type',
  'data_date',
  'query',
  'is_anonymized_query',
  'page',
  'device',
  'country',
  'clicks',
  'impressions',
  'ctr',
  'position',
  'position_sum_1based',
  'data_state',
  'extracted_at',
  'source_extraction_run_id',
  'run_id',
  'source_system',
  'source_quality',
  'loaded_at',
]);

const DETAIL_SCHEMA = Object.freeze([
  { name: 'property', type: 'STRING', mode: 'REQUIRED' },
  { name: 'search_type', type: 'STRING', mode: 'REQUIRED' },
  { name: 'data_date', type: 'DATE', mode: 'REQUIRED' },
  { name: 'query', type: 'STRING', mode: 'NULLABLE' },
  { name: 'is_anonymized_query', type: 'BOOL', mode: 'NULLABLE' },
  { name: 'page', type: 'STRING', mode: 'REQUIRED' },
  { name: 'device', type: 'STRING', mode: 'REQUIRED' },
  { name: 'country', type: 'STRING', mode: 'REQUIRED' },
  { name: 'clicks', type: 'INT64', mode: 'REQUIRED' },
  { name: 'impressions', type: 'INT64', mode: 'REQUIRED' },
  { name: 'ctr', type: 'FLOAT64', mode: 'REQUIRED' },
  { name: 'position', type: 'FLOAT64', mode: 'REQUIRED' },
  { name: 'position_sum_1based', type: 'FLOAT64', mode: 'REQUIRED' },
  { name: 'data_state', type: 'STRING', mode: 'REQUIRED' },
  { name: 'extracted_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  { name: 'source_extraction_run_id', type: 'STRING', mode: 'NULLABLE' },
  { name: 'run_id', type: 'STRING', mode: 'REQUIRED' },
  { name: 'source_system', type: 'STRING', mode: 'REQUIRED' },
  { name: 'source_quality', type: 'STRING', mode: 'REQUIRED' },
  { name: 'loaded_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
]);

const NATIVE_MUTATION_PATTERN = /\b(?:ALTER\s+TABLE(?:\s+IF\s+EXISTS)?|CREATE(?:\s+OR\s+REPLACE)?\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?|DROP\s+TABLE(?:\s+IF\s+EXISTS)?|TRUNCATE\s+TABLE|INSERT\s+INTO|UPDATE|DELETE\s+FROM|MERGE(?:\s+INTO)?|LOAD\s+DATA(?:\s+OVERWRITE|\s+INTO)?)\s+`borojeet\.searchconsole_borojeet\.[^`]+`/i;

function assertNoNativeTableMutation(sql) {
  if (NATIVE_MUTATION_PATTERN.test(sql)) {
    throw new Error('Refusing SQL that mutates a Search Console vendor-managed raw table.');
  }
  return sql;
}

function stageTableName(runId, date) {
  const digest = crypto.createHash('sha256').update(runId).digest('hex').slice(0, 16);
  return `_stg_api_detail_${digest}_${date.replaceAll('-', '')}`;
}

function assertStageTableName(table) {
  if (!/^_stg_api_detail_[a-f0-9]{16}_\d{8}$/.test(table)) {
    throw new Error(`Unsafe BigQuery staging table name: ${table}`);
  }
  return table;
}

class GoogleBigQueryAdapter {
  constructor(bigquery) {
    this.bigquery = bigquery;
  }

  async stageRows(tableName, rows) {
    assertStageTableName(tableName);
    const dataset = this.bigquery.dataset(WAREHOUSE.historyDataset);
    const table = dataset.table(tableName);
    const expirationTime = String(Date.now() + (24 * 60 * 60 * 1000));

    if (rows.length === 0) {
      await dataset.createTable(tableName, {
        schema: { fields: DETAIL_SCHEMA },
        expirationTime,
      });
      return;
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boro-gsc-bq-'));
    const tempFile = path.join(tempDir, 'rows.jsonl');
    try {
      fs.writeFileSync(tempFile, rows.map((row) => JSON.stringify(row)).join('\n') + '\n', 'utf8');
      const [job] = await table.load(tempFile, {
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        schema: { fields: DETAIL_SCHEMA },
        writeDisposition: 'WRITE_TRUNCATE',
        location: WAREHOUSE.location,
      });
      const [metadata] = await job.getMetadata();
      if (metadata.status?.errorResult) {
        throw new Error(`BigQuery staging load failed: ${metadata.status.errorResult.message}`);
      }
      await table.setMetadata({ expirationTime });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  async query(options) {
    const [rows] = await this.bigquery.query({ location: WAREHOUSE.location, ...options });
    return rows;
  }

  async dropStage(tableName) {
    assertStageTableName(tableName);
    try {
      await this.bigquery.dataset(WAREHOUSE.historyDataset).table(tableName).delete();
    } catch (error) {
      if (error?.code !== 404) throw error;
    }
  }
}

function stagingValidationSql(stage) {
  return `
WITH duplicate_keys AS (
  SELECT 1
  FROM ${stage}
  GROUP BY
    property, search_type, data_date, query, page, device, country, source_system
  HAVING COUNT(*) > 1
)
SELECT
  (SELECT COUNT(*) FROM ${stage}) AS row_count,
  (SELECT COUNT(*) FROM duplicate_keys) AS duplicate_key_count,
  (SELECT COUNTIF(
    data_date != DATE(@data_date)
    OR property != @property
    OR search_type != @search_type
    OR source_system != @source_system
  ) FROM ${stage}) AS invalid_scope_count
`;
}

class WarehouseLoader {
  constructor({ adapter, replaceSql, now = () => new Date().toISOString() }) {
    this.adapter = adapter;
    this.now = now;
    this.replaceSql = replaceSql || fs.readFileSync(
      path.resolve(__dirname, '../sql/02_replace_api_day.sql'),
      'utf8',
    );
    assertNoNativeTableMutation(this.replaceSql);
    assertSelfOwnedHistoryTable(WAREHOUSE.historyTables.detail);
    assertSelfOwnedHistoryTable(WAREHOUSE.historyTables.dailyAggregate);
    assertSelfOwnedHistoryTable(WAREHOUSE.historyTables.runs);
    assertSelfOwnedHistoryTable(WAREHOUSE.historyTables.runDates);
  }

  async appendRunEvent(event) {
    const target = assertSelfOwnedHistoryTable(WAREHOUSE.historyTables.runs);
    const query = `
INSERT INTO ${target} (
  run_id, event_sequence, event_type, status, input_source, load_mode,
  source_system, property, search_type, start_date, end_date, cutover_date,
  rows_extracted, pages_requested, dates_committed,
  range_clicks, range_impressions, range_ctr, range_position,
  range_position_sum_1based, github_run_id, github_run_attempt, git_ref,
  git_sha, actor, reason, error_code, error_message, event_at
)
VALUES (
  @run_id, @event_sequence, @event_type, @status, @input_source, @load_mode,
  @source_system, @property, @search_type, DATE(@start_date), DATE(@end_date), DATE(@cutover_date),
  @rows_extracted, @pages_requested, @dates_committed,
  IF(@has_range, @range_clicks, NULL), IF(@has_range, @range_impressions, NULL),
  IF(@has_range, @range_ctr, NULL),
  IF(@has_range AND @range_has_position, @range_position, NULL),
  IF(@has_range, @range_position_sum_1based, NULL),
  NULLIF(@github_run_id, ''), NULLIF(@github_run_attempt, ''), NULLIF(@git_ref, ''),
  NULLIF(@git_sha, ''), NULLIF(@actor, ''), NULLIF(@reason, ''),
  NULLIF(@error_code, ''), NULLIF(@error_message, ''), TIMESTAMP(@event_at)
)`;
    const range = event.rangeAggregate || {};
    await this.adapter.query({
      query,
      params: {
        run_id: event.runId,
        event_sequence: event.eventSequence,
        event_type: event.eventType,
        status: event.status,
        input_source: event.inputSource,
        load_mode: event.loadMode,
        source_system: event.sourceSystem,
        property: WAREHOUSE.property,
        search_type: WAREHOUSE.searchType,
        start_date: event.startDate,
        end_date: event.endDate,
        cutover_date: WAREHOUSE.cutoverDate,
        rows_extracted: event.rowsExtracted || 0,
        pages_requested: event.pagesRequested || 0,
        dates_committed: event.datesCommitted || 0,
        has_range: Boolean(event.rangeAggregate),
        range_has_position: Boolean(
          event.rangeAggregate
          && range.position !== null
          && range.position !== undefined
        ),
        range_clicks: range.clicks || 0,
        range_impressions: range.impressions || 0,
        range_ctr: range.ctr || 0,
        range_position: range.position ?? 0,
        range_position_sum_1based: range.position_sum_1based || 0,
        github_run_id: event.githubRunId || '',
        github_run_attempt: event.githubRunAttempt || '',
        git_ref: event.gitRef || '',
        git_sha: event.gitSha || '',
        actor: event.actor || '',
        reason: event.reason || '',
        error_code: event.errorCode || '',
        error_message: event.errorMessage || '',
        event_at: event.eventAt || this.now(),
      },
    });
  }

  async replaceDay({ runId, date, rows, aggregate, pagesRequested, checksum, sourceExtractionRunId }) {
    const stageName = stageTableName(runId, date);
    const stage = qualifiedTable(WAREHOUSE.historyDataset, assertStageTableName(stageName));
    let primaryError;
    try {
      await this.adapter.stageRows(stageName, rows);
      const validationRows = await this.adapter.query({
        query: stagingValidationSql(stage),
        params: {
          data_date: date,
          property: WAREHOUSE.property,
          search_type: WAREHOUSE.searchType,
          source_system: aggregate.source_system,
        },
      });
      const validation = validationRows[0] || {};
      if (Number(validation.row_count) !== rows.length) {
        throw new Error(`Staging row count mismatch for ${date}.`);
      }
      if (Number(validation.duplicate_key_count) !== 0) {
        throw new Error(`Staging contains duplicate logical keys for ${date}.`);
      }
      if (Number(validation.invalid_scope_count) !== 0) {
        throw new Error(`Staging contains rows outside the requested scope for ${date}.`);
      }

      const query = this.replaceSql.replaceAll('{{STAGING_TABLE}}', stage);
      if (query.includes('{{STAGING_TABLE}}')) throw new Error('Unresolved staging table placeholder.');
      await this.adapter.query({
        query: assertNoNativeTableMutation(query),
        params: {
          data_date: date,
          property: WAREHOUSE.property,
          search_type: WAREHOUSE.searchType,
          source_system: aggregate.source_system,
          aggregate_clicks: aggregate.clicks,
          aggregate_impressions: aggregate.impressions,
          aggregate_ctr: aggregate.ctr,
          aggregate_position: aggregate.position || 0,
          aggregate_has_position: aggregate.position !== null,
          aggregate_position_sum_1based: aggregate.position_sum_1based,
          data_state: aggregate.data_state,
          extracted_at: aggregate.extracted_at,
          source_extraction_run_id: sourceExtractionRunId || '',
          run_id: runId,
          source_quality: aggregate.source_quality,
          loaded_at: aggregate.loaded_at,
          rows_extracted: rows.length,
          pages_requested: pagesRequested,
          detail_sha256: checksum,
        },
      });
    } catch (error) {
      primaryError = error;
      throw error;
    } finally {
      try {
        await this.adapter.dropStage(stageName);
      } catch (cleanupError) {
        if (!primaryError) throw cleanupError;
      }
    }
  }
}

module.exports = {
  DETAIL_COLUMNS,
  DETAIL_SCHEMA,
  assertNoNativeTableMutation,
  stageTableName,
  assertStageTableName,
  stagingValidationSql,
  GoogleBigQueryAdapter,
  WarehouseLoader,
};
