const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const { GSC_SCOPE, readJsonFile, assertPathOutsideRepo } = require('./config');

const DEFAULT_OAUTH_TIMEOUT_MS = 10 * 60 * 1000;

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

function loadAuthorizedClient({ clientFile, tokenFile, repoRoot, googleOverride }) {
  if (repoRoot) {
    assertPathOutsideRepo(clientFile, repoRoot, 'OAuth client credentials');
    assertPathOutsideRepo(tokenFile, repoRoot, 'OAuth token');
  }
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
  const safePath = assertPathOutsideRepo(tokenFile, repoRoot, 'OAuth token');
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

function closeServer(server) {
  return new Promise((resolve) => {
    try {
      server.close(() => resolve());
    } catch (_) {
      resolve();
    }
  });
}

async function bootstrapAuth({
  clientFile,
  tokenFile,
  repoRoot,
  googleOverride,
  openBrowser,
  serverFactory = http.createServer,
  timeoutMs = DEFAULT_OAUTH_TIMEOUT_MS,
  logger = console,
}) {
  assertPathOutsideRepo(clientFile, repoRoot, 'OAuth client credentials');
  assertPathOutsideRepo(tokenFile, repoRoot, 'OAuth token');
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

  let settled = false;
  const codePromise = new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      if (settled) return;
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
        settled = true;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('BoroJeet GSC authorization complete. You may close this window.');
        resolve(code);
      } catch (error) {
        settled = true;
        reject(error);
      }
    });
  });

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      settled = true;
      const minutes = Math.round(timeoutMs / 60000);
      reject(new Error(`OAuth authorization timed out after ${minutes || '<1'} minute(s). Run npm run gsc:auth again.`));
    }, timeoutMs);
  });

  try {
    logger.log(`Open this URL in your browser:\n${authUrl}`);
    if (openBrowser) {
      try {
        await openBrowser(authUrl);
      } catch (_) {
        logger.warn('Automatic browser launch failed. Open the URL above manually.');
      }
    }

    const code = await Promise.race([codePromise, timeoutPromise]);
    const response = await oauth2Client.getToken(code);
    const tokens = response.tokens || response;
    persistToken(tokenFile, tokens, repoRoot);
    logger.log(`OAuth token saved securely to configured external path: ${tokenFile}`);
    return tokenFile;
  } finally {
    clearTimeout(timeoutId);
    await closeServer(server);
  }
}

module.exports = {
  DEFAULT_OAUTH_TIMEOUT_MS,
  getGoogle,
  getOAuthClientDefinition,
  createOAuthClient,
  loadAuthorizedClient,
  persistToken,
  bootstrapAuth,
};
