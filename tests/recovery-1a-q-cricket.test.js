const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');

// RECOVERY-1A-Q-CRICKET (site-quality recovery, August 2026 Spam Update).
// Quarantines 2 zero-observed-history, generated/query-expansion Cricket-app
// overlap-cluster URLs via explicit `robots: "noindex, follow"` frontmatter —
// indexation containment only. No body/title/description/date/canonical
// change, no internal-link change, no redirect, no deletion. Survivor
// (best-cricket-betting-apps-bangladesh-2026) and Homepage/Beginner Guide
// must remain fully unaffected.

const CANDIDATES = [
  'blog/asia-cup-2026-cricket-betting-apps-bd.md',
  'blog/cricket-baji-apps-bangladesh-guide.md',
];
const SURVIVOR_SRC = 'blog/best-cricket-betting-apps-bangladesh-2026.md';
const SURVIVOR_SLUG = 'best-cricket-betting-apps-bangladesh-2026';

function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readGenerated(relPath) {
  const full = path.join(SITE, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function slugOf(relPath) {
  return relPath.replace(/^blog\//, '').replace(/\.md$/, '');
}

// --- Source-level checks ---

for (const relPath of CANDIDATES) {
  test(`Source: ${relPath} exists and carries explicit robots: "noindex, follow"`, () => {
    assert.ok(fs.existsSync(path.join(ROOT, relPath)), `${relPath} must exist`);
    const src = readSource(relPath);
    assert.match(src, /^robots:\s*"noindex, follow"\s*$/m, `${relPath} must set robots: "noindex, follow" exactly`);
    // Must NOT use the noindex: true mechanism, which renders noindex,nofollow.
    assert.doesNotMatch(src, /^noindex:\s*true\s*$/m, `${relPath} must not use noindex: true (renders nofollow)`);
  });
}

test('Diff scope: candidate files changed only by a single robots: frontmatter line (no title/description/date/canonical/body change)', () => {
  const { execFileSync } = require('child_process');
  for (const relPath of CANDIDATES) {
    let diff;
    try {
      diff = execFileSync('git', ['diff', 'origin/main', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    } catch {
      diff = execFileSync('git', ['diff', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    }
    const addedLines = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
    const removedLines = diff.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---'));
    assert.equal(removedLines.length, 0, `${relPath}: expected zero removed lines, got ${removedLines.length}`);
    assert.equal(addedLines.length, 1, `${relPath}: expected exactly one added line, got ${addedLines.length}`);
    assert.match(addedLines[0], /^\+robots:\s*"noindex, follow"\s*$/, `${relPath}: the single added line must be the robots frontmatter`);
  }
});

// --- Generated HTML checks (require `npm run build` to have run) ---

const siteExists = fs.existsSync(SITE);

for (const relPath of CANDIDATES) {
  const slug = slugOf(relPath);
  test(`Generated: ${slug} renders noindex,follow (not nofollow) and self-canonical`, { skip: !siteExists && 'run npm run build first' }, () => {
    const html = readGenerated(`blog/${slug}/index.html`);
    assert.ok(html, `expected _site/blog/${slug}/index.html to exist (no 404 / build removal)`);
    assert.match(html, /<meta name="?robots"? content="?noindex, ?follow"?>/, 'expected noindex, follow robots meta');
    assert.doesNotMatch(html, /noindex,\s*nofollow/, 'must not render nofollow');
    assert.match(html, new RegExp(`<link rel="canonical" href="https://borojeetbd\\.com/blog/${slug}/">`), 'expected unchanged self-canonical');
  });

  test(`Generated: ${slug} is absent from sitemap.xml`, { skip: !siteExists && 'run npm run build first' }, () => {
    const sitemap = readGenerated('sitemap.xml');
    assert.ok(sitemap, 'sitemap.xml must be generated');
    assert.ok(!sitemap.includes(`/blog/${slug}/`), `sitemap.xml must not list quarantined /blog/${slug}/`);
  });
}

// --- Survivor control ---

test('Generated: survivor (best-cricket-betting-apps-bangladesh-2026) remains index,follow, self-canonical, and in sitemap', { skip: !siteExists && 'run npm run build first' }, () => {
  const html = readGenerated(`blog/${SURVIVOR_SLUG}/index.html`);
  assert.ok(html, 'expected survivor page to be built');
  assert.match(html, /<meta name="?robots"? content="?index, ?follow/, 'survivor must remain index, follow');
  assert.match(html, new RegExp(`<link rel="canonical" href="https://borojeetbd\\.com/blog/${SURVIVOR_SLUG}/">`));

  const sitemap = readGenerated('sitemap.xml');
  assert.ok(sitemap.includes(`/blog/${SURVIVOR_SLUG}/`), 'survivor must remain in sitemap.xml');
});

test('Source: survivor file is untouched by this PR', () => {
  const { execFileSync } = require('child_process');
  let diff;
  try {
    diff = execFileSync('git', ['diff', 'origin/main', '--', SURVIVOR_SRC], { cwd: ROOT, encoding: 'utf8' });
  } catch {
    diff = execFileSync('git', ['diff', '--', SURVIVOR_SRC], { cwd: ROOT, encoding: 'utf8' });
  }
  assert.equal(diff.trim(), '', 'survivor source file must have zero diff in this PR');
});

// --- Homepage / Beginner Guide regression guard ---

test('Source: Homepage (index.md) and Beginner Guide are untouched by this PR', () => {
  const { execFileSync } = require('child_process');
  for (const relPath of ['index.md', 'blog/beginners-guide-to-borojeet.md']) {
    let diff;
    try {
      diff = execFileSync('git', ['diff', 'origin/main', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    } catch {
      diff = execFileSync('git', ['diff', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    }
    assert.equal(diff.trim(), '', `${relPath} must have zero diff in this PR`);
  }
});

// --- No global template / FULLMODE change ---

test('Diff scope: no global template or FULLMODE engine file changed', () => {
  const { execFileSync } = require('child_process');
  const protectedFiles = ['.eleventy.js', '_includes/base.njk', 'sitemap.njk', 'scripts/internal-linking-fullmode.js'];
  for (const relPath of protectedFiles) {
    let diff;
    try {
      diff = execFileSync('git', ['diff', 'origin/main', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    } catch {
      diff = execFileSync('git', ['diff', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    }
    assert.equal(diff.trim(), '', `${relPath} must not be modified by RECOVERY-1A-Q-CRICKET`);
  }
});
