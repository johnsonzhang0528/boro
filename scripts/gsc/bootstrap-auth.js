#!/usr/bin/env node
const path = require('path');
require('dotenv').config();
const { loadConfig, assertCredentialPathsOutsideRepo } = require('./lib/config');
const { bootstrapAuth } = require('./lib/auth');

async function openBrowser(url, spawnImpl = require('child_process').spawn) {
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];

  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnImpl(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
    } catch (error) {
      reject(error);
      return;
    }
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}

async function main(env = process.env) {
  const config = loadConfig(env);
  const repoRoot = path.resolve(__dirname, '../..');
  assertCredentialPathsOutsideRepo(config, repoRoot);
  await bootstrapAuth({
    clientFile: config.clientFile,
    tokenFile: config.tokenFile,
    repoRoot,
    openBrowser,
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`GSC OAuth bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { main, openBrowser };
