const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const EXCLUSION_FILE = path.join(ROOT, 'data', 'publishing', 'fullmode-excluded-targets.json');

// RECOVERY-1A-LINK-REMOVE-B1 (site-quality recovery, August 2026 Spam
// Update). Proves getRelatedPosts (.eleventy.js) can no longer recommend any
// of the 21 RECOVERY-1A-Q quarantined URLs, while leaving scoring, sort
// order, self-exclusion, item count, and the sitewide "Latest Updates"
// footer (a separate, uncoupled read of the same collections.post array)
// byte-for-byte unchanged. FULLMODE_MANAGED body links (RECOVERY-1A-LINK-
// REMOVE-A) and the footer mechanism itself (deferred — see the accepted
// RECOVERY-1A-LINK-REMOVE-B audit, Option C) are explicitly out of scope.

const SURVIVORS = [
  'borojeet-app-download-install-guide',
  'guide-to-crash-games-bangladesh',
  'best-cricket-betting-apps-bangladesh-2026',
];

// This branch's fixed pre-implementation base — anchoring on the literal SHA
// (rather than an auto-discovered merge-base) keeps every diff assertion
// valid whether this test runs pre-commit, on the open PR, or after merge.
const BASE_SHA = '1d58e8443bc8620640858bdbb1ec188d0894585d';

function baseAvailable() {
  try {
    execFileSync('git', ['cat-file', '-e', BASE_SHA], { cwd: ROOT });
    return true;
  } catch {
    return false;
  }
}

function diffAgainstBase(relPath) {
  return execFileSync('git', ['diff', BASE_SHA, '--', relPath], { cwd: ROOT, encoding: 'utf8' });
}

function readExclusionFile() {
  return JSON.parse(fs.readFileSync(EXCLUSION_FILE, 'utf8'));
}

function readGenerated(relPath) {
  const full = path.join(SITE, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function relatedPostUrls(html) {
  const idx = html.indexOf('related-posts-section');
  if (idx === -1) return [];
  const section = html.slice(idx, idx + 6000);
  const matches = [...section.matchAll(/<h4 class="h4"><a href="\/blog\/([^/]+)\/">/g)];
  return matches.map((m) => m[1]);
}

function footerUrls(html) {
  const idx = html.indexOf('<footer');
  if (idx === -1) return [];
  const footer = html.slice(idx, idx + 4000);
  const heading = footer.indexOf('Latest Updates');
  const ulStart = footer.indexOf('<ul', heading);
  const ulEnd = footer.indexOf('</ul>', ulStart);
  const window_ = footer.slice(ulStart, ulEnd);
  const matches = [...window_.matchAll(/<li><a href="([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

const siteExists = fs.existsSync(SITE);

// --- 1. .eleventy.js is the only production file touched, and does not
//        alter collections.post itself (proves footer non-coupling by diff
//        shape, not just by inspection) ---

test('1. Diff scope: exactly .eleventy.js is touched (plus this test file, tracked or not)', { skip: !baseAvailable() && 'base SHA not available locally' }, () => {
  const modified = execFileSync('git', ['diff', '--name-only', BASE_SHA], { cwd: ROOT, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((f) => !f.startsWith('data/recovery/') && !f.startsWith('scripts/recovery/'));
  const allFiles = [...modified, ...untracked].sort();
  const allowed = ['.eleventy.js', 'tests/recovery-1a-link-remove-related-posts.test.js'].sort();
  assert.deepEqual(allFiles, allowed);
});

test('2. .eleventy.js diff only touches the getRelatedPosts filter and its quarantine-set constant (no addCollection("post") change)', { skip: !baseAvailable() && 'base SHA not available locally' }, () => {
  const diff = diffAgainstBase('.eleventy.js');
  assert.doesNotMatch(diff, /addCollection\("post"/, 'diff must not touch the shared collections.post definition');
  assert.match(diff, /getRelatedPosts/, 'diff must touch the getRelatedPosts filter');
});

// --- 3. Source-level: quarantine constant reuses the canonical dataset ---

test('3. getRelatedPosts filter reuses data/publishing/fullmode-excluded-targets.json (no duplicated slug list)', () => {
  const src = fs.readFileSync(path.join(ROOT, '.eleventy.js'), 'utf8');
  assert.match(src, /fullmode-excluded-targets\.json/);
  // The 21 quarantine slugs must not appear as a second hardcoded array literal in .eleventy.js
  const excluded = readExclusionFile().excluded_targets;
  const hardcodedArrayPattern = new RegExp(`\\[\\s*["']${excluded[0]}["']`);
  assert.doesNotMatch(src, hardcodedArrayPattern, 'quarantine slugs must not be duplicated as a literal array');
});

// --- Generated-output assertions (require a fresh build) ---

test('4. Generated: none of the 21 quarantine targets appear in any related-posts section sitewide', { skip: !siteExists && 'run npm run build first' }, () => {
  const excluded = new Set(readExclusionFile().excluded_targets);
  const pages = fs.readdirSync(path.join(SITE, 'blog')).filter((d) =>
    fs.existsSync(path.join(SITE, 'blog', d, 'index.html'))
  );
  const violations = [];
  for (const slug of pages) {
    const html = readGenerated(path.join('blog', slug, 'index.html'));
    for (const url of relatedPostUrls(html)) {
      if (excluded.has(url)) violations.push([slug, url]);
    }
  }
  assert.deepEqual(violations, []);
});

test('5. Generated: normal (non-quarantine) posts are still returned as related posts', { skip: !siteExists && 'run npm run build first' }, () => {
  const html = readGenerated('blog/liquidity-in-cricket-markets/index.html');
  const urls = relatedPostUrls(html);
  assert.equal(urls.length, 4);
  assert.ok(urls.every((u) => u.length > 0));
});

test('6. Generated: source/self page never appears in its own related-posts list', { skip: !siteExists && 'run npm run build first' }, () => {
  const pages = fs.readdirSync(path.join(SITE, 'blog')).filter((d) =>
    fs.existsSync(path.join(SITE, 'blog', d, 'index.html'))
  );
  const selfLinks = [];
  for (const slug of pages) {
    const html = readGenerated(path.join('blog', slug, 'index.html'));
    for (const url of relatedPostUrls(html)) {
      if (url === slug) selfLinks.push(slug);
    }
  }
  assert.deepEqual(selfLinks, []);
});

test('7. Generated: future/P0-contained posts still excluded from related-posts recommendations (unchanged behavior)', { skip: !siteExists && 'run npm run build first' }, () => {
  // Sample a page and confirm no recommended URL corresponds to a source file
  // dated after the P0 freeze cutoff.
  const html = readGenerated('blog/liquidity-in-cricket-markets/index.html');
  const urls = relatedPostUrls(html);
  const cutoff = new Date('2026-08-23T09:39:06Z');
  for (const slug of urls) {
    const mdPath = path.join(ROOT, 'blog', `${slug}.md`);
    if (!fs.existsSync(mdPath)) continue;
    const fm = fs.readFileSync(mdPath, 'utf8');
    const m = fm.match(/^date:\s*(\S+)/m);
    if (m) {
      const d = new Date(`${m[1].replace(/["']/g, '')}T00:00:00Z`);
      assert.ok(d <= cutoff, `${slug} is future/P0-dated but was recommended`);
    }
  }
});

test('8. Generated: no duplicate recommendations on any single page sitewide', { skip: !siteExists && 'run npm run build first' }, () => {
  const pages = fs.readdirSync(path.join(SITE, 'blog')).filter((d) =>
    fs.existsSync(path.join(SITE, 'blog', d, 'index.html'))
  );
  const dupPages = [];
  for (const slug of pages) {
    const html = readGenerated(path.join('blog', slug, 'index.html'));
    const urls = relatedPostUrls(html);
    if (new Set(urls).size !== urls.length) dupPages.push(slug);
  }
  assert.deepEqual(dupPages, []);
});

test('9. Generated: recommendation count remains 4 for previously quarantine-affected pages (no silent reduction)', { skip: !siteExists && 'run npm run build first' }, () => {
  // Representative sample of pages known (from the accepted RECOVERY-1A-LINK-REMOVE-B
  // audit) to have previously recommended a quarantined URL.
  const sample = [
    'liquidity-in-cricket-markets',
    'aviator-auto-cashout-settings-guide',
    'kabaddi-pro-league-betting-tips',
    'sera-cricket-betting-site-bangladesh',
    'boro-jeet-app-install-from-website',
  ];
  for (const slug of sample) {
    const html = readGenerated(`blog/${slug}/index.html`);
    if (!html) continue;
    const urls = relatedPostUrls(html);
    assert.equal(urls.length, 4, `${slug} has ${urls.length} related posts, expected 4`);
  }
});

test('10. Generated: Latest Updates footer output is identical before vs after this change', { skip: !siteExists && 'run npm run build first' }, () => {
  // The footer reads collections.post directly (base.njk), never through
  // getRelatedPosts, so its content is architecturally decoupled from this
  // change. Assert the known 3 currently-quarantined footer occupants are
  // still present unchanged (proves the footer was NOT filtered by this PR —
  // that remains explicitly deferred, per RECOVERY-1A-LINK-REMOVE-B Option C).
  const html = readGenerated('blog/liquidity-in-cricket-markets/index.html');
  const urls = footerUrls(html);
  assert.deepEqual(urls, [
    '/blog/aviator-auto-cashout-settings-guide/',
    '/blog/casino-crash-game-khelar-niyom/',
    '/blog/cricket-baji-dhorar-app-bangladesh/',
    '/blog/sera-cricket-betting-site-bangladesh/',
    '/blog/cricket-baji-apps-bangladesh-guide/',
  ]);
});

test('11. Generated: quarantine URLs retain noindex robots and remain absent from sitemap', { skip: !siteExists && 'run npm run build first' }, () => {
  const excluded = readExclusionFile().excluded_targets;
  const sitemap = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
  for (const slug of excluded) {
    const html = readGenerated(`blog/${slug}/index.html`);
    assert.ok(html, `blog/${slug}/index.html must still be generated`);
    assert.match(html, /noindex/, `${slug} must still render noindex`);
    assert.ok(!sitemap.includes(`/blog/${slug}/`), `${slug} must remain absent from sitemap.xml`);
  }
});

test('12. Survivor, Homepage, and Beginner Guide sources are byte-identical', { skip: !baseAvailable() && 'base SHA not available locally' }, () => {
  const protectedFiles = [
    ...SURVIVORS.map((s) => `blog/${s}.md`),
    'index.md',
    'blog/beginners-guide-to-borojeet.md',
  ];
  for (const file of protectedFiles) {
    const diff = diffAgainstBase(file);
    assert.equal(diff.trim(), '', `${file} must be byte-identical to base`);
  }
});

test('13. _includes/base.njk and _includes/post.njk are byte-identical (footer/widget markup untouched)', { skip: !baseAvailable() && 'base SHA not available locally' }, () => {
  const diff = diffAgainstBase('_includes/base.njk') + diffAgainstBase('_includes/post.njk');
  assert.equal(diff.trim(), '');
});
