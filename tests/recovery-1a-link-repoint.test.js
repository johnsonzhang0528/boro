const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');

// RECOVERY-1A-LINK-REPOINT (site-quality recovery, August 2026 Spam Update).
// Executes 5 of the 11 audited HIGH-confidence REPOINT_TO_SURVIVOR candidates
// from data/recovery/recovery-1a-link-repoint-candidates.csv. The other 6 were
// dropped after a pre-implementation drift recheck found each source already
// contained a separate, pre-existing contextual link to the same survivor —
// repointing would have created a duplicate same-page survivor link, which
// the original audit's duplicate check did not catch (it only compared
// quarantine-target links against each other, not against the full existing
// outbound link set). Executing 6 unverified rows was correctly refused.
//
// This suite proves: old quarantine-target links are gone, new survivor
// links exist with the approved anchors, no self-links/duplicates were
// introduced, all three survivors and the 21-slug quarantine/ENGINE
// invariants are unaffected, and no REMOVE/DEFER/MANUAL_REVIEW row was
// touched.

const MIGRATIONS = [
  { source: 'best-cricket-betting-odds-2026', oldTarget: 'asia-cup-2026-cricket-betting-apps-bd', newTarget: 'best-cricket-betting-apps-bangladesh-2026', anchor: 'ক্রিকেট বাজি ধরার সেরা অ্যাপ ২০২৬: bKash/Nagad সহ তুলনা' },
  { source: 'browser-vs-app-performance-borojeet', oldTarget: 'borojeet-apk-update-checklist-2026', newTarget: 'borojeet-app-download-install-guide', anchor: 'BoroJeet APK ডাউনলোড ও ইনস্টল গাইড (৩ ধাপে)' },
  { source: 'liquidity-in-cricket-markets', oldTarget: 'cricket-baji-apps-bangladesh-guide', newTarget: 'best-cricket-betting-apps-bangladesh-2026', anchor: 'ক্রিকেট বাজি ধরার সেরা অ্যাপ ২০২৬ (bKash/Nagad সহ)' },
  { source: 'live-casino-bangladesh-real-money-guide-2026', oldTarget: 'borojeet-apk-update-checklist-2026', newTarget: 'borojeet-app-download-install-guide', anchor: 'BoroJeet App/APK Install Guide: Android/iOS ৩ ধাপে' },
  { source: 'team-total-runs-cricket-guide', oldTarget: 'asia-cup-2026-cricket-betting-apps-bd', newTarget: 'best-cricket-betting-apps-bangladesh-2026', anchor: 'সেরা ৫ ক্রিকেট বাজি অ্যাপ ২০২৬: APK ও Deposit তুলনা' },
];

// The 6 audited HIGH-confidence candidates that were correctly EXCLUDED from
// this implementation due to drift (pre-existing duplicate survivor link
// found on re-verification) — must remain completely untouched.
const EXCLUDED_DUE_TO_DRIFT = [
  'aviator-auto-cashout-settings-guide',
  'bangladesh-cricket-market-guide-2026',
  'betting-app-with-bkash-nagad-bd',
  'cricket-betting-bonus-asia-cup-2026',
  'cricket-over-by-over-betting-bangladesh',
  'sera-cricket-betting-site-bangladesh',
];

const ALL_21_QUARANTINE = [
  'asia-cup-2026-cricket-betting-apps-bd', 'aviator-betting-app-bangladesh-guide', 'aviator-game-bangladesh-bkash-deposit',
  'boro-jeet-app-install-from-website', 'borojeet-apk-update-checklist-2026', 'borojeet-app-bangla-step-by-step',
  'borojeet-app-cache-clear-login-fix', 'borojeet-app-download-bonus-tracking', 'borojeet-app-low-storage-install-fix',
  'borojeet-app-permissions-bangladesh', 'casino-crash-game-bangladesh-guide', 'casino-crash-game-khelar-niyom',
  'crash-game-bangla-prediction-myth', 'crash-game-mobile-data-saving-guide', 'crazy-time-bangla-bet-sizing-guide',
  'crazy-time-bangladesh-bonus-round-guide', 'cricket-baji-apps-bangladesh-guide', 'cricket-baji-dhorar-app-bangladesh',
  'cricket-betting-app-bangla-review', 'fifa-world-cup-2026-app-notification-guide', 'funky-time-bangladesh-live-show-guide',
];

const SURVIVORS = ['borojeet-app-download-install-guide', 'guide-to-crash-games-bangladesh', 'best-cricket-betting-apps-bangladesh-2026'];

function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}
function readGenerated(relPath) {
  const full = path.join(SITE, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

// --- 1. Exact implemented migration count ---
test('1. Exactly 5 migrations implemented (6 of the 11 audited candidates were correctly excluded due to drift)', () => {
  assert.equal(MIGRATIONS.length, 5);
});

// --- 2/3/4. Old link absent, new link present, expected anchor present ---
for (const m of MIGRATIONS) {
  test(`2/3/4. ${m.source}: old target absent, new survivor link present with approved anchor`, () => {
    const src = readSource(`blog/${m.source}.md`);
    assert.doesNotMatch(src, new RegExp(`/blog/${m.oldTarget}/`), `${m.source} must no longer link to ${m.oldTarget}`);
    assert.match(src, new RegExp(`\\[${m.anchor.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\]\\(/blog/${m.newTarget}/\\)`), `${m.source} must contain the approved anchor pointing to ${m.newTarget}`);
  });
}

// --- 5. No self-links introduced ---
test('5. No migration creates a self-link', () => {
  for (const m of MIGRATIONS) {
    assert.notEqual(m.source, m.newTarget, `${m.source} must not link to itself`);
  }
});

// --- 6. No duplicate same-page survivor links introduced ---
test('6. No source file contains the survivor link more than once', () => {
  for (const m of MIGRATIONS) {
    const src = readSource(`blog/${m.source}.md`);
    const count = (src.match(new RegExp(`/blog/${m.newTarget}/`, 'g')) || []).length;
    assert.equal(count, 1, `${m.source} must link to ${m.newTarget} exactly once, found ${count}`);
  }
});

// --- 7. All new targets exist ---
test('7. All 3 new survivor targets exist as real files', () => {
  for (const slug of new Set(MIGRATIONS.map(m => m.newTarget))) {
    assert.ok(fs.existsSync(path.join(ROOT, 'blog', `${slug}.md`)), `blog/${slug}.md must exist`);
  }
});

// --- 8/9/10. Survivors remain indexable, self-canonical, in sitemap ---
const siteExists = fs.existsSync(SITE);

for (const slug of SURVIVORS) {
  test(`8/9/10. Survivor ${slug} remains indexable, self-canonical, in sitemap`, { skip: !siteExists && 'run npm run build first' }, () => {
    const html = readGenerated(`blog/${slug}/index.html`);
    assert.ok(html, `expected ${slug} to be built`);
    assert.match(html, /<meta name="?robots"? content="?index, ?follow/, `${slug} must remain index, follow`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://borojeetbd\\.com/blog/${slug}/">`));
    const sitemap = readGenerated('sitemap.xml');
    assert.ok(sitemap.includes(`/blog/${slug}/`), `${slug} must remain in sitemap.xml`);
  });
}

test('16. Survivor source files are completely unchanged by this PR', () => {
  for (const slug of SURVIVORS) {
    let diff;
    try {
      diff = execFileSync('git', ['diff', 'origin/main', '--', `blog/${slug}.md`], { cwd: ROOT, encoding: 'utf8' });
    } catch {
      diff = execFileSync('git', ['diff', '--', `blog/${slug}.md`], { cwd: ROOT, encoding: 'utf8' });
    }
    assert.equal(diff.trim(), '', `blog/${slug}.md must have zero diff — survivors are never edited by REPOINT`);
  }
});

// --- 11/12. All 21 quarantine URLs retain quarantine state, remain excluded by ENGINE ---
test('11. All 21 quarantine URLs retain their robots: "noindex, follow" source frontmatter, unchanged', () => {
  for (const slug of ALL_21_QUARANTINE) {
    const src = readSource(`blog/${slug}.md`);
    assert.match(src, /^robots:\s*"noindex, follow"\s*$/m, `blog/${slug}.md must retain RECOVERY quarantine robots field`);
  }
});

test('12. All 21 quarantine slugs remain excluded by LINK-ENGINE', () => {
  const fm = require('../scripts/internal-linking-fullmode.js');
  for (const slug of ALL_21_QUARANTINE) {
    assert.equal(fm.isEligibleTarget(slug), false, `${slug} must remain ineligible`);
  }
  for (const slug of SURVIVORS) {
    assert.equal(fm.isEligibleTarget(slug), true, `${slug} must remain eligible`);
  }
});

// --- 13. FULLMODE dry-run still produces 0 links into quarantine targets ---
test('13. FULLMODE dry-run still plans 0 links into any of the 21 quarantine targets', () => {
  const fm = require('../scripts/internal-linking-fullmode.js');
  const articles = fm.loadArticles();
  for (const a of articles) a.cluster = fm.classifyArticle(a);
  const plan = fm.buildLinkPlan(articles);
  let count = 0;
  for (const links of Object.values(plan.additions)) {
    for (const link of links) {
      if (fm.EXCLUDED_TARGETS.has(link.slug)) count += 1;
    }
  }
  assert.equal(count, 0);
});

// --- 14/15. Homepage / Beginner Guide unchanged ---
test('14/15. Homepage and Beginner Guide are unchanged by this PR', () => {
  for (const relPath of ['index.md', 'blog/beginners-guide-to-borojeet.md']) {
    let diff;
    try {
      diff = execFileSync('git', ['diff', 'origin/main', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    } catch {
      diff = execFileSync('git', ['diff', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    }
    assert.equal(diff.trim(), '', `${relPath} must have zero diff`);
  }
});

// --- 17. No REMOVE / DEFER / MANUAL_REVIEW rows were modified ---
test('17. The 6 excluded-due-to-drift candidate sources retain their original quarantine-target links, untouched', () => {
  const oldTargetsBySource = {
    'aviator-auto-cashout-settings-guide': 'casino-crash-game-khelar-niyom',
    'bangladesh-cricket-market-guide-2026': 'asia-cup-2026-cricket-betting-apps-bd',
    'betting-app-with-bkash-nagad-bd': 'aviator-betting-app-bangladesh-guide',
    'cricket-betting-bonus-asia-cup-2026': 'asia-cup-2026-cricket-betting-apps-bd',
    'cricket-over-by-over-betting-bangladesh': 'asia-cup-2026-cricket-betting-apps-bd',
    'sera-cricket-betting-site-bangladesh': 'cricket-baji-apps-bangladesh-guide',
  };
  for (const slug of EXCLUDED_DUE_TO_DRIFT) {
    let diff;
    try {
      diff = execFileSync('git', ['diff', 'origin/main', '--', `blog/${slug}.md`], { cwd: ROOT, encoding: 'utf8' });
    } catch {
      diff = execFileSync('git', ['diff', '--', `blog/${slug}.md`], { cwd: ROOT, encoding: 'utf8' });
    }
    assert.equal(diff.trim(), '', `blog/${slug}.md must be completely untouched (excluded due to drift, not part of this implementation)`);
    const src = readSource(`blog/${slug}.md`);
    assert.match(src, new RegExp(`/blog/${oldTargetsBySource[slug]}/`), `blog/${slug}.md must still contain its original (unmigrated) quarantine-target link`);
  }
});

// --- Diff scope: no ENGINE / template / unrelated file touched ---
test('Diff scope: ENGINE, templates, and unrelated production files are untouched', () => {
  const protectedFiles = [
    '.eleventy.js', '_includes/base.njk', 'sitemap.njk',
    'scripts/internal-linking-fullmode.js', 'data/publishing/fullmode-excluded-targets.json',
  ];
  for (const relPath of protectedFiles) {
    let diff;
    try {
      diff = execFileSync('git', ['diff', 'origin/main', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    } catch {
      diff = execFileSync('git', ['diff', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
    }
    assert.equal(diff.trim(), '', `${relPath} must not be modified by RECOVERY-1A-LINK-REPOINT`);
  }
});

test('Diff scope: exactly the 5 migration source files are the only blog/*.md changes', () => {
  let changedBlogFiles;
  try {
    changedBlogFiles = execFileSync('git', ['diff', 'origin/main', '--name-only', '--', 'blog/'], { cwd: ROOT, encoding: 'utf8' });
  } catch {
    changedBlogFiles = execFileSync('git', ['diff', '--name-only', '--', 'blog/'], { cwd: ROOT, encoding: 'utf8' });
  }
  const files = changedBlogFiles.trim().split('\n').filter(Boolean).sort();
  const expected = MIGRATIONS.map(m => `blog/${m.source}.md`).sort();
  assert.deepEqual(files, expected, `expected exactly the 5 migration source files changed, got: ${files.join(', ')}`);
});
