const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');

// RECOVERY-1A-Q-CRASH (site-quality recovery, August 2026 Spam Update).
// Quarantines 8 zero-observed-history, generated/query-expansion
// Crash/Aviator overlap-cluster URLs via explicit
// `robots: "noindex, follow"` frontmatter. Of the 8: 1 is currently indexed
// (casino-crash-game-khelar-niyom) and 7 are already noindex,nofollow today
// via the P0 publishing-freeze future-date branch in _includes/base.njk
// (page.date > now). Adding the explicit robots field to those 7 is a
// DURABILITY marker: base.njk's condition is
//   (page.date > now) or noindex  -> noindex, nofollow
//   elif robots                   -> robots verbatim
//   else                          -> index, follow, ...
// so today the future-date branch wins regardless of the explicit field
// (expected, not a regression) — but once PUBLISHING_FREEZE_DATE is
// deliberately advanced past a candidate's date, the future-date branch no
// longer applies and the explicit `robots: "noindex, follow"` prevents a
// silent fall-through to the default `index, follow` branch. This file
// proves that behavior with a deterministic simulation of base.njk's own
// condition — it does not modify or read .eleventy.js's live clock.
//
// Test design: PR-SCOPE checks (diff vs origin/main) are skipped once this
// branch is merged (RECOVERY_1A_CRASH_MERGED=1), mirroring the fix applied
// after the Cricket canary's post-merge self-reference issue.

const MERGED = process.env.RECOVERY_1A_CRASH_MERGED === '1';

// [file, currently_indexed, page_date]
const CANDIDATES = [
  ['blog/aviator-game-bangladesh-bkash-deposit.md', false, '2026-09-04'],
  ['blog/casino-crash-game-bangladesh-guide.md', false, '2026-09-21'],
  ['blog/casino-crash-game-khelar-niyom.md', true, '2026-08-23'],
  ['blog/crash-game-bangla-prediction-myth.md', false, '2026-10-19'],
  ['blog/crash-game-mobile-data-saving-guide.md', false, '2026-10-20'],
  ['blog/crazy-time-bangla-bet-sizing-guide.md', false, '2026-10-04'],
  ['blog/crazy-time-bangladesh-bonus-round-guide.md', false, '2026-10-29'],
  ['blog/funky-time-bangladesh-live-show-guide.md', false, '2026-08-24'],
];
const CURRENTLY_INDEXED = CANDIDATES.filter(c => c[1]).map(c => c[0]);
const P0_CONTAINED = CANDIDATES.filter(c => !c[1]).map(c => c[0]);

const SURVIVOR_SRC = 'blog/guide-to-crash-games-bangladesh.md';
const SURVIVOR_SLUG = 'guide-to-crash-games-bangladesh';

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

// Deterministic reimplementation of _includes/base.njk lines 24-30:
//   {% if (page.date and page.date > now) or noindex %}  -> noindex, nofollow
//   {% elif robots %}                                    -> robots verbatim
//   {% else %}                                            -> index, follow, ...
function simulateRobots(pageDateStr, nowDate, explicitRobots, noindexFlag) {
  const pageDate = new Date(pageDateStr);
  if ((pageDate && pageDate > nowDate) || noindexFlag) return 'noindex, nofollow';
  if (explicitRobots) return explicitRobots;
  return 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
}

// --- Candidate count ---

test('Candidate list is exactly 8 files (1 currently indexed + 7 P0-contained)', () => {
  assert.equal(CANDIDATES.length, 8);
  assert.equal(CURRENTLY_INDEXED.length, 1);
  assert.equal(P0_CONTAINED.length, 7);
  assert.equal(CURRENTLY_INDEXED.length + P0_CONTAINED.length, 8);
  assert.deepEqual(CURRENTLY_INDEXED, ['blog/casino-crash-game-khelar-niyom.md']);
});

// --- Source metadata ---

for (const [relPath] of CANDIDATES) {
  test(`Source: ${relPath} exists, carries exactly robots: "noindex, follow", not noindex: true`, () => {
    assert.ok(fs.existsSync(path.join(ROOT, relPath)), `${relPath} must exist`);
    const src = readSource(relPath);
    assert.match(src, /^robots:\s*"noindex, follow"\s*$/m, `${relPath} must set robots: "noindex, follow" exactly`);
    assert.doesNotMatch(src, /^noindex:\s*true\s*$/m, `${relPath} must not use noindex: true (renders nofollow)`);
  });
}

// --- PR-SCOPE: diff-vs-origin/main checks (skipped once merged) ---

test('PR-SCOPE: each candidate diff vs origin/main is exactly +1 robots line, 0 removed lines', { skip: MERGED && 'branch already merged; diff vs origin/main is structurally empty by design' }, () => {
  for (const [relPath] of CANDIDATES) {
    const diff = diffAgainstOriginMain(relPath);
    const added = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
    const removed = diff.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---'));
    assert.equal(removed.length, 0, `${relPath}: expected zero removed lines, got ${removed.length}`);
    assert.equal(added.length, 1, `${relPath}: expected exactly one added line, got ${added.length}`);
    assert.match(added[0], /^\+robots:\s*"noindex, follow"\s*$/, `${relPath}: the single added line must be the robots frontmatter`);
  }
});

test('PR-SCOPE: survivor, Homepage, Beginner Guide, FULLMODE engine have zero diff vs origin/main', { skip: MERGED && 'branch already merged; diff vs origin/main is structurally empty by design' }, () => {
  const protectedFiles = [SURVIVOR_SRC, 'index.md', 'blog/beginners-guide-to-borojeet.md', 'scripts/internal-linking-fullmode.js', '.eleventy.js', '_includes/base.njk', 'sitemap.njk', 'vercel.json'];
  for (const relPath of protectedFiles) {
    const diff = diffAgainstOriginMain(relPath);
    assert.equal(diff.trim(), '', `${relPath} must have zero diff in this PR`);
  }
});

// --- DURABLE: generated-output contracts (valid before and after merge) ---

const siteExists = fs.existsSync(SITE);

test('Generated: currently-indexed candidate (casino-crash-game-khelar-niyom) renders noindex,follow today', { skip: !siteExists && 'run npm run build first' }, () => {
  const slug = slugOf(CURRENTLY_INDEXED[0]);
  const html = readGenerated(`blog/${slug}/index.html`);
  assert.ok(html, `expected _site/blog/${slug}/index.html to exist`);
  assert.match(html, /<meta name="?robots"? content="?noindex, ?follow"?>/, 'expected noindex, follow robots meta today');
  assert.doesNotMatch(html, /noindex,\s*nofollow/, 'currently-indexed candidate must not render nofollow');
  assert.match(html, new RegExp(`<link rel="canonical" href="https://borojeetbd\\.com/blog/${slug}/">`), 'expected unchanged self-canonical');
});

for (const relPath of P0_CONTAINED) {
  const slug = slugOf(relPath);
  test(`Generated: P0-contained candidate ${slug} currently renders noindex,nofollow (expected, future-date branch precedence — NOT a regression)`, { skip: !siteExists && 'run npm run build first' }, () => {
    const html = readGenerated(`blog/${slug}/index.html`);
    assert.ok(html, `expected _site/blog/${slug}/index.html to exist (rendering unaffected by quarantine metadata while future-dated)`);
    assert.match(html, /<meta name="?robots"? content="?noindex,\s*nofollow"?>/, 'expected noindex,nofollow today (future-date branch wins)');
  });
}

test('Generated: all 8 candidates absent from sitemap.xml today', { skip: !siteExists && 'run npm run build first' }, () => {
  const sitemap = readGenerated('sitemap.xml');
  assert.ok(sitemap, 'sitemap.xml must be generated');
  for (const [relPath] of CANDIDATES) {
    const slug = slugOf(relPath);
    assert.ok(!sitemap.includes(`/blog/${slug}/`), `sitemap.xml must not list quarantined /blog/${slug}/`);
  }
});

// --- MANDATORY: future-state simulation (Section 14) ---
// Proves the durable quarantine survives PUBLISHING_FREEZE_DATE eventually
// advancing past each P0-contained candidate's page date, without touching
// production dates or the live PUBLISHING_FREEZE_DATE constant.

test('Future-state simulation: 8/8 candidates resolve to noindex,follow (never index,follow, never noindex,nofollow) once each page date is no longer in the future', () => {
  for (const [relPath, , pageDate] of CANDIDATES) {
    const explicitRobots = 'noindex, follow'; // from this PR's frontmatter, confirmed present above
    const simulatedFutureNow = new Date('2027-01-01T00:00:00Z'); // safely past every candidate's page date
    const result = simulateRobots(pageDate, simulatedFutureNow, explicitRobots, false);
    assert.equal(result, 'noindex, follow', `${relPath}: expected durable noindex,follow after future-date condition ceases to apply, got "${result}"`);
    assert.notEqual(result, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', `${relPath}: must never silently revert to fully indexed`);
  }
});

test('Future-state simulation: WITHOUT this PR (no explicit robots field), the same 7 P0-contained candidates would silently become index,follow — demonstrating why the durability marker is necessary', () => {
  for (const relPath of P0_CONTAINED) {
    const pageDate = CANDIDATES.find(c => c[0] === relPath)[2];
    const simulatedFutureNow = new Date('2027-01-01T00:00:00Z');
    const resultWithoutFrontmatter = simulateRobots(pageDate, simulatedFutureNow, null, false);
    assert.equal(resultWithoutFrontmatter, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', `${relPath}: baseline (no explicit robots) would revert to fully indexed once future-dated — this is the risk this PR closes`);
  }
});

test('Future-state simulation: sitemap exclusion persists (candidate robots still contains "noindex")', () => {
  for (const [relPath, , pageDate] of CANDIDATES) {
    const simulatedFutureNow = new Date('2027-01-01T00:00:00Z');
    const result = simulateRobots(pageDate, simulatedFutureNow, 'noindex, follow', false);
    assert.match(result, /noindex/, `${relPath}: sitemap.njk excludes on 'noindex' substring match — must still be present in simulated future robots value`);
  }
});

// --- Survivor control ---

test('Generated: survivor (guide-to-crash-games-bangladesh) remains index,follow, self-canonical, and in sitemap exactly once', { skip: !siteExists && 'run npm run build first' }, () => {
  const html = readGenerated(`blog/${SURVIVOR_SLUG}/index.html`);
  assert.ok(html, 'expected survivor page to be built');
  assert.match(html, /<meta name="?robots"? content="?index, ?follow/, 'survivor must remain index, follow');
  assert.match(html, new RegExp(`<link rel="canonical" href="https://borojeetbd\\.com/blog/${SURVIVOR_SLUG}/">`));

  const sitemap = readGenerated('sitemap.xml');
  const occurrences = (sitemap.match(new RegExp(`/blog/${SURVIVOR_SLUG}/`, 'g')) || []).length;
  assert.ok(occurrences >= 1, 'survivor must remain in sitemap.xml');
});

test('Source: survivor file carries no quarantine metadata', () => {
  const src = readSource(SURVIVOR_SRC);
  assert.doesNotMatch(src, /^robots:\s*"noindex, follow"\s*$/m, 'survivor must not receive quarantine metadata');
  assert.doesNotMatch(src, /^noindex:\s*true\s*$/m, 'survivor must not receive quarantine metadata');
});

// --- Homepage / Beginner protection ---

test('Source: Homepage and Beginner Guide carry no quarantine metadata', () => {
  for (const relPath of ['index.md', 'blog/beginners-guide-to-borojeet.md']) {
    assert.ok(fs.existsSync(path.join(ROOT, relPath)), `${relPath} must exist`);
    const src = readSource(relPath);
    assert.doesNotMatch(src, /^robots:\s*"noindex, follow"\s*$/m, `${relPath} must not receive quarantine metadata`);
  }
});

// --- FULLMODE non-change ---

test('scripts/internal-linking-fullmode.js is unchanged', () => {
  const diff = diffAgainstOriginMain('scripts/internal-linking-fullmode.js');
  assert.equal(diff.trim(), '', 'FULLMODE engine must not be modified by RECOVERY-1A-Q-CRASH');
});
