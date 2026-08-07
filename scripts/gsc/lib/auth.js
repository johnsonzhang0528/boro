const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const { GSC_SCOPE, readJsonFile, assertPathOutsideRepo } = require('./config');

function getGoogle(override) {
  if (override) return override;
  try {
    return require('googleapis').google;
  } catch (error) {
    throw new Error('googleapis dependency is required. Run npm install before using GSC auth/extraction.');
  }
}

function getOAuthClientDefinition(clientJson) {
  const definition = clientJson.installed || clientJson.web;
  if (!definition || !definition.client_id || !definition.client_secret) {
    throw new Error('OAuth client JSON must contain installed or web client_id/client_secret.');
  }
  return definition;
}

function createOAuthClient(clientFile, redirectUri, googleOverride) {
  const google = getGoogle(googleOverride);
  const definition = getOAuthClientDefinition(readJsonFile(clientFile, 'OAuth client file'));
  return new google.auth.OAuth2(definition.client_id, definition.client_secret, redirectUri);
}

function loadAuthorizedClient({ clientFile, tokenFile, googleOverride }) {
  const google = getGoogle(googleOverride);
  const definition = getOAuthClientDefinition(readJsonFile(clientFile, 'OAuth client file'));
  const token = readJsonFile(tokenFile, 'OAuth token file');
  if (!token.refresh_token) {
    throw new Error('OAuth token file does not contain a refresh_token. Re-run npm run gsc:auth.');
  }
  const client = new google.auth.OAuth2(definition.client_id, definition.client_secret);
  client.setCredentials(token);
  return client;
}

function persistToken(tokenFile, tokens, repoRoot) {
  const safePath = assertPathOutsideRepo(tokenFile, repoRoot);
  if (!tokens || !tokens.refresh_token) {
    throw new Error('OAuth bootstrap did not return a refresh_token; token file was not written. Revoke prior consent if needed and retry with consent prompt.');
  }
  fs.mkdirSync(path.dirname(safePath), { recursive: true, mode: 0o700 });
  const payload = {
    refresh_token: tokens.refresh_token,
    scope: tokens.scope || GSC_SCOPE,
    token_type: tokens.token_type || 'Bearer',
  };
  if (tokens.expiry_date) payload.expiry_date = tokens.expiry_date;
  fs.writeFileSync(safePath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600, flag: 'w' });
  try { fs.chmodSync(safePath, 0o600); } catch (_) { /* best effort on non-POSIX */ }
  return safePath;
}

async function bootstrapAuth({ clientFile, tokenFile, repoRoot, googleOverride, openBrowser, serverFactory = http.createServer }) {
  assertPathOutsideRepo(tokenFile, repoRoot);
  const google = getGoogle(googleOverride);
  const definition = getOAuthClientDefinition(readJsonFile(clientFile, 'OAuth client file'));

  const server = serverFactory();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const redirectUri = `http://127.0.0.1:${address.port}`;
  const oauth2Client = new google.auth.OAuth2(definition.client_id, definition.client_secret, redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: [GSC_SCOPE] });

  const codePromise = new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      try {
        const requestUrl = new URL(req.url, redirectUri);
        const code = requestUrl.searchParams.get('code');
        const error = requestUrl.searchParams.get('error');
        if (error) throw new Error(`Google OAuth returned error: ${error}`);
        if (!code) {
          res.statusCode = 400;
          res.end('Missing authorization code.');
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('BoroJeet GSC authorization complete. You may close this window.');
        resolve(code);
      } catch (error) {
        reject(error);
      }
    });
  });

  try {
    if (openBrowser) await openBrowser(authUrl);
    else console.log(`Open this URL in your browser to authorize GSC read-only access:\n${authUrl}`);
    const code = await codePromise;
    const response = await oauth2Client.getToken(code);
    const tokens = response.tokens || response;
    persistToken(tokenFile, tokens, repoRoot);
    console.log(`OAuth token saved securely to configured external path: ${tokenFile}`);
    return tokenFile;
  } finally {
    await new Promise((resolve) => server.close(() => resolve()));
  }
}

module.exports = {
  getGoogle,
  getOAuthClientDefinition,
  createOAuthClient,
  loadAuthorizedClient,
  persistToken,
  bootstrapAuth,
};
