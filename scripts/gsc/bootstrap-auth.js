#!/usr/bin/env node
const path = require('path');
require('dotenv').config();
const { loadConfig, assertCredentialPathsOutsideRepo } = require('./lib/config');
const { bootstrapAuth } = require('./lib/auth');

function browserLaunchSpec(url, platform = process.platform) {
  if (platform === 'darwin') return { command: 'open', args: [url] };
  if (platform === 'win32') {
    return {
      command: 'rundll32.exe',
      args: ['url.dll,FileProtocolHandler', url],
    };
  }
  return { command: 'xdg-open', args: [url] };
}

async function openBrowser(url, spawnImpl = require('child_process').spawn, platform = process.platform) {
  const { command, args } = browserLaunchSpec(url, platform);

  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnImpl(command, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        shell: false,
      });
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

module.exports = { main, openBrowser, browserLaunchSpec };
