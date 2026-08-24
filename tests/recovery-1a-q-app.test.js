const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');

// RECOVERY-1A-Q-APP (site-quality recovery, August 2026 Spam Update).
// Quarantines 11 zero-observed-history, generated/query-expansion App/APK
// overlap-cluster URLs via explicit `robots: "noindex, follow"` frontmatter —
// indexation containment only. No body/title/description/date/canonical
// change, no internal-link change (the ~79 FULLMODE-managed inbound links
// into this cluster are a separate, unapproved RECOVERY-1A-LINK workstream),
// no redirect, no deletion. Survivor
// (borojeet-app-download-install-guide) and Homepage/Beginner Guide must
// remain fully unaffected.
//
// Test design note: this file separates two kinds of check —
//   (1) PR-SCOPE checks, valid only while this branch has NOT yet merged
//       into main (they diff the working tree against origin/main and are
//       structurally expected to go empty/inapplicable once merged — the
//       Cricket canary's test conflated this and produced a false "failure"
//       post-merge);
//   (2) DURABLE PRODUCTION checks, valid before and after merge (generated
//       output contracts, survivor/Homepage/Beginner source content).
// Skip PR-SCOPE checks with an explicit, named skip reason once this branch
// is merged, rather than letting them silently fail — set
// RECOVERY_1A_APP_MERGED=1 in the environment after merge if this file is
// still being run for regression purposes post-merge.

const MERGED = process.env.RECOVERY_1A_APP_MERGED === '1';

const CANDIDATES = [
  'blog/aviator-betting-app-bangladesh-guide.md',
  'blog/boro-jeet-app-install-from-website.md',
  'blog/borojeet-apk-update-checklist-2026.md',
  'blog/borojeet-app-bangla-step-by-step.md',
  'blog/borojeet-app-cache-clear-login-fix.md',
  'blog/borojeet-app-download-bonus-tracking.md',
  'blog/borojeet-app-low-storage-install-fix.md',
  'blog/borojeet-app-permissions-bangladesh.md',
  'blog/cricket-baji-dhorar-app-bangladesh.md',
  'blog/cricket-betting-app-bangla-review.md',
  'blog/fifa-world-cup-2026-app-notification-guide.md',
];
const SURVIVOR_SRC = 'blog/borojeet-app-download-install-guide.md';
const SURVIVOR_SLUG = 'borojeet-app-download-install-guide';

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

function diffAgainstOriginMain(relPath) {
  try {
    return execFileSync('git', ['diff', 'origin/main', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
  } catch {
    return execFileSync('git', ['diff', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
  }
}

// --- A. Candidate count ---

test('A. Candidate list is exactly 11 files', () => {
  assert.equal(CANDIDATES.length, 11);
  const unique = new Set(CANDIDATES);
  assert.equal(unique.size, 11, 'no duplicate candidates');
});

// --- B/C. Source metadata ---

for (const relPath of CANDIDATES) {
  test(`B/C. Source: ${relPath} exists, carries exactly robots: "noindex, follow", not noindex: true`, () => {
    assert.ok(fs.existsSync(path.join(ROOT, relPath)), `${relPath} must exist`);
    const src = readSource(relPath);
    assert.match(src, /^robots:\s*"noindex, follow"\s*$/m, `${relPath} must set robots: "noindex, follow" exactly`);
    assert.doesNotMatch(src, /^noindex:\s*true\s*$/m, `${relPath} must not use noindex: true (renders nofollow)`);
  });
}

// --- PR-SCOPE: diff-vs-origin/main checks (skipped once merged) ---

test('PR-SCOPE: each candidate diff vs origin/main is exactly +1 robots line, 0 removed lines', { skip: MERGED && 'branch already merged; origin/main now contains this change, diff is structurally empty by design' }, () => {
  for (const relPath of CANDIDATES) {
    const diff = diffAgainstOriginMain(relPath);
    const added = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
    const removed = diff.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---'));
    assert.equal(removed.length, 0, `${relPath}: expected zero removed lines, got ${removed.length}`);
    assert.equal(added.length, 1, `${relPath}: expected exactly one added line, got ${added.length}`);
    assert.match(added[0], /^\+robots:\s*"noindex, follow"\s*$/, `${relPath}: the single added line must be the robots frontmatter`);
  }
});

test('PR-SCOPE: survivor source has zero diff vs origin/main', { skip: MERGED && 'branch already merged; diff vs origin/main is structurally empty by design' }, () => {
  const diff = diffAgainstOriginMain(SURVIVOR_SRC);
  assert.equal(diff.trim(), '', 'survivor source file must have zero diff in this PR');
});

test('PR-SCOPE: Homepage and Beginner Guide have zero diff vs origin/main', { skip: MERGED && 'branch already merged; diff vs origin/main is structurally empty by design' }, () => {
  for (const relPath of ['index.md', 'blog/beginners-guide-to-borojeet.md']) {
    const diff = diffAgainstOriginMain(relPath);
    assert.equal(diff.trim(), '', `${relPath} must have zero diff in this PR`);
  }
});

test('PR-SCOPE: no global template or FULLMODE engine file changed vs origin/main', { skip: MERGED && 'branch already merged; diff vs origin/main is structurally empty by design' }, () => {
  const protectedFiles = ['.eleventy.js', '_includes/base.njk', 'sitemap.njk', 'scripts/internal-linking-fullmode.js'];
  for (const relPath of protectedFiles) {
    const diff = diffAgainstOriginMain(relPath);
    assert.equal(diff.trim(), '', `${relPath} must not be modified by RECOVERY-1A-Q-APP`);
  }
});

// --- DURABLE: generated-output contracts (valid before and after merge) ---

const siteExists = fs.existsSync(SITE);

for (const relPath of CANDIDATES) {
  const slug = slugOf(relPath);

  test(`D/E/G. Generated: ${slug} renders noindex,follow, retains self-canonical, and exists`, { skip: !siteExists && 'run npm run build first' }, () => {
    const html = readGenerated(`blog/${slug}/index.html`);
    assert.ok(html, `expected _site/blog/${slug}/index.html to exist (no 404 / build removal)`);
    assert.match(html, /<meta name="?robots"? content="?noindex, ?follow"?>/, 'expected noindex, follow robots meta');
    assert.doesNotMatch(html, /noindex,\s*nofollow/, 'must not render nofollow');
    assert.match(html, new RegExp(`<link rel="canonical" href="https://borojeetbd\\.com/blog/${slug}/">`), 'expected unchanged self-canonical');
  });

  test(`F. Generated: ${slug} is absent from sitemap.xml`, { skip: !siteExists && 'run npm run build first' }, () => {
    const sitemap = readGenerated('sitemap.xml');
    assert.ok(sitemap, 'sitemap.xml must be generated');
    assert.ok(!sitemap.includes(`/blog/${slug}/`), `sitemap.xml must not list quarantined /blog/${slug}/`);
  });
}

// --- H/I. Survivor control ---

test('H. Generated: survivor (borojeet-app-download-install-guide) remains index,follow, self-canonical, and in sitemap', { skip: !siteExists && 'run npm run build first' }, () => {
  const html = readGenerated(`blog/${SURVIVOR_SLUG}/index.html`);
  assert.ok(html, 'expected survivor page to be built');
  assert.match(html, /<meta name="?robots"? content="?index, ?follow/, 'survivor must remain index, follow');
  assert.match(html, new RegExp(`<link rel="canonical" href="https://borojeetbd\\.com/blog/${SURVIVOR_SLUG}/">`));

  const sitemap = readGenerated('sitemap.xml');
  assert.ok(sitemap.includes(`/blog/${SURVIVOR_SLUG}/`), 'survivor must remain in sitemap.xml');
});

test('I. Source: survivor file content is unchanged (no robots/quarantine field added)', () => {
  const src = readSource(SURVIVOR_SRC);
  assert.doesNotMatch(src, /^robots:\s*"noindex, follow"\s*$/m, 'survivor must not receive quarantine metadata');
  assert.doesNotMatch(src, /^noindex:\s*true\s*$/m, 'survivor must not receive quarantine metadata');
});

// --- J/K. Homepage / Beginner protection (durable — checks current content, not diff) ---

test('J/K. Source: Homepage and Beginner Guide carry no quarantine metadata and are present', () => {
  for (const relPath of ['index.md', 'blog/beginners-guide-to-borojeet.md']) {
    assert.ok(fs.existsSync(path.join(ROOT, relPath)), `${relPath} must exist`);
    const src = readSource(relPath);
    assert.doesNotMatch(src, /^robots:\s*"noindex, follow"\s*$/m, `${relPath} must not receive quarantine metadata`);
  }
});
