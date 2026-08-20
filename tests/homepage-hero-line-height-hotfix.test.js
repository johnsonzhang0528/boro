const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const home = fs.readFileSync('index.md', 'utf8');
const base = fs.readFileSync('_includes/base.njk', 'utf8');

test('homepage hero content overrides legacy zero line-height image-column rule', () => {
  assert.match(base, /\.hero\s*>\s*div:last-child[\s\S]*?line-height:\s*0;/);
  assert.match(home, /<section class="hero"[^>]*>[\s\S]*?<div style="line-height:\s*1\.6;">/);
});
