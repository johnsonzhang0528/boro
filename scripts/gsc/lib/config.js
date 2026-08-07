const fs = require('fs');
const path = require('path');

const DEFAULT_PROPERTY = 'sc-domain:borojeetbd.com';
const DEFAULT_SEARCH_TYPE = 'web';
const DEFAULT_DATA_STATE = 'final';
const DEFAULT_ROW_LIMIT = 25000;
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

function requireEnv(name, env = process.env) {
  const value = env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

function resolveExternalPath(name, env = process.env) {
  const value = requireEnv(name, env);
  if (!path.isAbsolute(value)) {
    throw new Error(`${name} must be an absolute path.`);
  }
  return path.normalize(value);
}

function assertPathOutsideRepo(targetPath, repoRoot = path.resolve(__dirname, '../../..'), label = 'OAuth credential') {
  const absoluteTarget = path.resolve(targetPath);
  const absoluteRepo = path.resolve(repoRoot);
  const relative = path.relative(absoluteRepo, absoluteTarget);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error(`Refusing to use ${label} inside repository: ${absoluteTarget}`);
  }
  return absoluteTarget;
}

function assertCredentialPathsOutsideRepo(config, repoRoot) {
  assertPathOutsideRepo(config.clientFile, repoRoot, 'OAuth client credentials');
  assertPathOutsideRepo(config.tokenFile, repoRoot, 'OAuth token');
  return config;
}

function loadConfig(env = process.env) {
  return {
    property: (env.GSC_PROPERTY || DEFAULT_PROPERTY).trim(),
    searchType: (env.GSC_SEARCH_TYPE || DEFAULT_SEARCH_TYPE).trim(),
    dataState: (env.GSC_DATA_STATE || DEFAULT_DATA_STATE).trim(),
    clientFile: resolveExternalPath('GSC_OAUTH_CLIENT_FILE', env),
    tokenFile: resolveExternalPath('GSC_OAUTH_TOKEN_FILE', env),
    rowLimit: DEFAULT_ROW_LIMIT,
  };
}

function readJsonFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${filePath}`);
  }
}

module.exports = {
  DEFAULT_PROPERTY,
  DEFAULT_SEARCH_TYPE,
  DEFAULT_DATA_STATE,
  DEFAULT_ROW_LIMIT,
  GSC_SCOPE,
  requireEnv,
  resolveExternalPath,
  assertPathOutsideRepo,
  assertCredentialPathsOutsideRepo,
  loadConfig,
  readJsonFile,
};
