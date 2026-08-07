const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { assertPathOutsideRepo } = require('../../scripts/gsc/lib/config');
const { persistToken, loadAuthorizedClient } = require('../../scripts/gsc/lib/auth');

test('OAuth token path inside repository is rejected', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'));
  assert.throws(() => assertPathOutsideRepo(path.join(repo, 'token.json'), repo), /inside repository/);
  assert.throws(() => assertPathOutsideRepo(repo, repo), /inside repository/);
  assert.doesNotThrow(() => assertPathOutsideRepo(path.join(repo, '..', 'external', 'token.json'), repo));
});

test('bootstrap token persistence fails without refresh token and writes nothing', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'oauth-'));
  const repo = path.join(base, 'repo'); fs.mkdirSync(repo);
  const token = path.join(base, 'external', 'token.json');
  assert.throws(() => persistToken(token, { access_token: 'not-persisted' }, repo), /did not return a refresh_token/);
  assert.equal(fs.existsSync(token), false);
});

test('secret-not-found failure is clear', () => {
  const google = { auth: { OAuth2: class { setCredentials() {} } } };
  assert.throws(() => loadAuthorizedClient({ clientFile: '/missing/client.json', tokenFile: '/missing/token.json', googleOverride: google }), /OAuth client file not found/);
});
