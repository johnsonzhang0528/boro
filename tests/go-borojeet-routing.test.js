const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const DESTINATION = 'https://www.borojeetagent.com/?pid=JS168';

function matchesOptionalTrailingSlash(source, pathname) {
  assert.match(source, /\(\/\)\?$/);
  const base = source.slice(0, -4);
  return pathname === base || pathname === `${base}/`;
}

test('affiliate redirect covers slash and non-slash paths under trailingSlash normalization', () => {
  assert.equal(config.trailingSlash, true);

  const routes = config.redirects.filter((redirect) => redirect.destination === DESTINATION);
  assert.equal(routes.length, 1);

  const [route] = routes;
  assert.equal(route.source, '/go/borojeet(/)?');
  assert.equal(route.statusCode, 301);
  assert.equal(matchesOptionalTrailingSlash(route.source, '/go/borojeet'), true);
  assert.equal(matchesOptionalTrailingSlash(route.source, '/go/borojeet/'), true);
});

test('affiliate destination preserves the exact JS168 URL as a single query parameter', () => {
  const route = config.redirects.find((redirect) => redirect.source === '/go/borojeet(/)?');
  assert.ok(route);
  assert.equal(route.destination, DESTINATION);

  const destination = new URL(route.destination);
  assert.equal(destination.protocol, 'https:');
  assert.equal(destination.hostname, 'www.borojeetagent.com');
  assert.deepEqual([...destination.searchParams.entries()], [['pid', 'JS168']]);
});
