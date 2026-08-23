const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');

// P0 SITE-QUALITY INCIDENT CONTAINMENT (2026-08-23).
// Guards the central publishing kill switch added to .eleventy.js: no post
// dated after PUBLISHING_FREEZE_DATE may become indexable or enter the
// sitemap, no matter how far the real calendar (and the daily-rebuild cron)
// advances. This prevents the pre-scheduled GSC-expansion queue from
// auto-publishing without editorial review during the recovery program.

function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

const ELEVENTY_CONFIG = readSource('.eleventy.js');

test('.eleventy.js defines a PUBLISHING_FREEZE_DATE containment ceiling', () => {
  assert.match(ELEVENTY_CONFIG, /const PUBLISHING_FREEZE_DATE\s*=/);
});

test('now / publishedOnly / post collection all route through effectiveNow(), not a fresh DateTime.now()', () => {
  // The three call sites that used to compute `DateTime.now().plus({hours:6})`
  // independently must all defer to the capped effectiveNow() helper so a
  // single edit to the freeze date governs indexability everywhere.
  const liveNowCalls = ELEVENTY_CONFIG.match(/DateTime\.now\(\)\.plus\(\{\s*hours:\s*6\s*\}\)/g) || [];
  // Only effectiveNow() itself may compute a live "now"; addGlobalData("now"),
  // publishedOnly, and the post collection filter must not duplicate it.
  assert.equal(liveNowCalls.length, 1, 'expected exactly one live DateTime.now() computation, inside effectiveNow()');
  assert.match(ELEVENTY_CONFIG, /addGlobalData\("now",\s*\(\)\s*=>\s*\{\s*return effectiveNow\(\);/);
  assert.match(ELEVENTY_CONFIG, /addFilter\("publishedOnly"[\s\S]{0,200}effectiveNow\(\)/);
  assert.match(ELEVENTY_CONFIG, /addCollection\("post"[\s\S]{0,400}effectiveNow\(\)/);
});

function readGenerated(relPath) {
  const full = path.join(SITE, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function listFrontMatterDates() {
  const blogDir = path.join(ROOT, 'blog');
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
  const results = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
    const m = content.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
    if (m) results.push({ file, date: m[1] });
  }
  return results;
}

test('Generated: every future-dated post (relative to the freeze ceiling) is noindex,nofollow', { skip: !fs.existsSync(SITE) && 'run npm run build first' }, () => {
  const FREEZE_DATE = '2026-08-23';
  const posts = listFrontMatterDates().filter(p => p.date > FREEZE_DATE);
  assert.ok(posts.length > 0, 'expected at least one future-dated post fixture to exist for this assertion to be meaningful');

  let checked = 0;
  for (const post of posts) {
    const slug = post.file.replace(/\.md$/, '');
    const html = readGenerated(`blog/${slug}/index.html`);
    if (!html) continue;
    checked += 1;
    assert.match(
      html,
      /<meta name="?robots"? content="?noindex,\s*nofollow"?>/,
      `expected ${post.file} (dated ${post.date}, after freeze) to be noindex,nofollow`
    );
  }
  assert.ok(checked > 0, 'no generated future-dated post pages found to check — did the build run?');
});

test('Generated: sitemap.xml contains no URL for a future-dated post', { skip: !fs.existsSync(SITE) && 'run npm run build first' }, () => {
  const FREEZE_DATE = '2026-08-23';
  const sitemap = readGenerated('sitemap.xml');
  assert.ok(sitemap, 'sitemap.xml was not generated');

  const posts = listFrontMatterDates().filter(p => p.date > FREEZE_DATE);
  for (const post of posts) {
    const slug = post.file.replace(/\.md$/, '');
    assert.ok(
      !sitemap.includes(`/blog/${slug}/`),
      `sitemap.xml must not list future-dated post /blog/${slug}/ (dated ${post.date})`
    );
  }
});

test('Generated: a known past post remains indexable (freeze does not regress live content)', { skip: !fs.existsSync(SITE) && 'run npm run build first' }, () => {
  const html = readGenerated('blog/beginners-guide-to-borojeet/index.html');
  assert.ok(html, 'expected beginners-guide-to-borojeet to be built');
  assert.match(html, /<meta name="?robots"? content="?index, ?follow/);

  const sitemap = readGenerated('sitemap.xml');
  assert.ok(sitemap.includes('/blog/beginners-guide-to-borojeet/'), 'past post should remain in sitemap');
});
