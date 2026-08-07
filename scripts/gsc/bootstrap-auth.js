#!/usr/bin/env node
const path = require('path');
require('dotenv').config();
const { loadConfig, assertPathOutsideRepo } = require('./lib/config');
const { bootstrapAuth } = require('./lib/auth');

async function openBrowser(url) {
  const { spawn } = require('child_process');
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.unref();
  } catch (_) {
    console.log(`Open this URL in your browser to authorize GSC read-only access:\n${url}`);
  }
}

async function main(env = process.env) {
  const config = loadConfig(env);
  const repoRoot = path.resolve(__dirname, '../..');
  assertPathOutsideRepo(config.tokenFile, repoRoot);
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
