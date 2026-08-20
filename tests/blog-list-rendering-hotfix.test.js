const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const indexTemplate = read('blog/index.njk');
const tagsTemplate = read('blog/tags.njk');

function frontmatterHasOgImage(relativePath) {
  const source = read(relativePath);
  const frontmatter = source.split('---')[1] || '';
  return /^ogImage\s*:/m.test(frontmatter);
}

test('blog and tag card images are guarded when ogImage is missing', () => {
  for (const template of [indexTemplate, tagsTemplate]) {
    assert.match(template, /{% if post\.data\.ogImage %}[\s\S]*?<picture>[\s\S]*?{% endif %}/);
  }

  // These current production posts reproduce the reported broken-card case.
  assert.equal(frontmatterHasOgImage('blog/back-bet-explained.md'), false);
  assert.equal(frontmatterHasOgImage('blog/scalping-strategy.md'), false);
  assert.equal(frontmatterHasOgImage('blog/trading-a-t20-match.md'), false);
});

test('blog pagination is windowed instead of rendering every page number', () => {
  assert.doesNotMatch(indexTemplate, /for pageEntry in pagination\.pages/);
  assert.match(indexTemplate, /currentPageNumber = pagination\.pageNumber \+ 1/);
  assert.match(indexTemplate, /totalPageCount = pagination\.hrefs \| length/);
  assert.match(indexTemplate, /currentPageNumber - 2/);
  assert.match(indexTemplate, /currentPageNumber \+ 2/);
  assert.match(indexTemplate, /&hellip;/);
  assert.match(indexTemplate, /pagination\.href\.previous/);
  assert.match(indexTemplate, /pagination\.href\.next/);
  assert.match(indexTemplate, /flex-wrap: wrap/);
});

test('hotfix does not introduce pagination indexation or canonical policy changes', () => {
  assert.doesNotMatch(indexTemplate, /noindex/);
  assert.doesNotMatch(indexTemplate, /canonical/);
});

test('fresh generated blog HTML has no empty og-image URL when available', () => {
  const generated = path.join(ROOT, '_site', 'blog', 'index.html');
  if (!fs.existsSync(generated)) return;

  const html = fs.readFileSync(generated, 'utf8');
  assert.doesNotMatch(html, /(?:src|srcset)="\/assets\/og\/"/);
  assert.match(html, /aria-label="Pagination"/);
});
