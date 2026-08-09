const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const workflowDir = path.resolve(__dirname, '../../.github/workflows');
const read = (name) => fs.readFileSync(path.join(workflowDir, name), 'utf8');

test('API backfill workflow is manual-only and validates before WIF authentication', () => {
  const yaml = read('gsc-api-backfill.yml');
  assert.match(yaml, /workflow_dispatch:/);
  assert.doesNotMatch(yaml, /^\s*schedule:/m);
  assert.match(yaml, /contents: read/);
  assert.match(yaml, /id-token: write/);
  assert.match(yaml, /GSC_BACKFILL_SOURCE: api/);
  assert.ok(yaml.indexOf('Validate guarded request') < yaml.indexOf('Authenticate to Google Cloud'));
  assert.doesNotMatch(yaml, /client_secret|refresh_token|token\.json|credentials\.json/i);
});

test('health workflow is read-only monitoring and never invokes API extraction', () => {
  const yaml = read('gsc-warehouse-health.yml');
  assert.match(yaml, /schedule:/);
  assert.match(yaml, /workflow_dispatch:/);
  assert.match(yaml, /contents: read/);
  assert.match(yaml, /id-token: write/);
  assert.match(yaml, /node scripts\/gsc\/check-bulk-export-health\.js/);
  assert.doesNotMatch(yaml, /gsc:pull|gsc:bq:backfill/);
  assert.doesNotMatch(yaml, /client_secret|refresh_token|token\.json|credentials\.json/i);
});
