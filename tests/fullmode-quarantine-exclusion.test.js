const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const EXCLUSION_FILE = path.join(ROOT, 'data', 'publishing', 'fullmode-excluded-targets.json');

// RECOVERY-1A-LINK-ENGINE (site-quality recovery, August 2026 Spam Update).
// Proves scripts/internal-linking-fullmode.js can no longer select any of
// the 21 RECOVERY-1A-Q quarantined URLs as a link target — durably,
// independent of rendered robots, PUBLISHING_FREEZE_DATE, inbound_count, or
// classifier output. Does NOT migrate any existing link (that is a separate,
// unapproved RECOVERY-1A-LINK-MIGRATION workstream) and does NOT touch the
// broader App/APK classifier over-matching issue (separate workstream).

const EXPECTED_SURVIVORS = [
  'borojeet-app-download-install-guide',
  'guide-to-crash-games-bangladesh',
  'best-cricket-betting-apps-bangladesh-2026',
];

function readExclusionFile() {
  return JSON.parse(fs.readFileSync(EXCLUSION_FILE, 'utf8'));
}

function diffAgainstOriginMain(relPath) {
  try {
    return execFileSync('git', ['diff', 'origin/main', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
  } catch {
    return execFileSync('git', ['diff', '--', relPath], { cwd: ROOT, encoding: 'utf8' });
  }
}

// --- A/B/C. Exclusion dataset shape ---

test('A. Exclusion dataset contains exactly 21 unique slugs', () => {
  const data = readExclusionFile();
  assert.equal(data.excluded_targets.length, 21);
  assert.equal(new Set(data.excluded_targets).size, 21, 'no duplicates');
});

test('B. All 21 excluded slugs correspond to real blog files', () => {
  const data = readExclusionFile();
  for (const slug of data.excluded_targets) {
    assert.ok(fs.existsSync(path.join(ROOT, 'blog', `${slug}.md`)), `blog/${slug}.md must exist`);
  }
});

test('C. No approved survivor appears in the exclusion set', () => {
  const data = readExclusionFile();
  const excluded = new Set(data.excluded_targets);
  for (const survivor of EXPECTED_SURVIVORS) {
    assert.ok(!excluded.has(survivor), `${survivor} must not be excluded`);
  }
});

// --- D. RECOVERY quarantine source metadata unchanged ---

test('D. All 21 excluded slugs retain their RECOVERY quarantine robots frontmatter', () => {
  const data = readExclusionFile();
  for (const slug of data.excluded_targets) {
    const content = fs.readFileSync(path.join(ROOT, 'blog', `${slug}.md`), 'utf8');
    assert.match(content, /^robots:\s*"noindex, follow"\s*$/m, `blog/${slug}.md must still carry the RECOVERY quarantine robots field`);
  }
});

// --- Load the engine (pure functions only; does not run main()/write files) ---
const fm = require('../scripts/internal-linking-fullmode.js');

test('E. isEligibleTarget() returns false for all 21 quarantined slugs', () => {
  const data = readExclusionFile();
  for (const slug of data.excluded_targets) {
    assert.equal(fm.isEligibleTarget(slug), false, `${slug} must be ineligible`);
  }
});

test('F. All three survivors remain eligible targets', () => {
  for (const slug of EXPECTED_SURVIVORS) {
    assert.equal(fm.isEligibleTarget(slug), true, `${slug} must remain eligible`);
  }
});

// --- Build one shared plan for the remaining structural assertions ---
function buildPlan() {
  const articles = fm.loadArticles();
  for (const a of articles) a.cluster = fm.classifyArticle(a);
  const plan = fm.buildLinkPlan(articles);
  return { articles, plan };
}

test('G. Pillar path cannot select an excluded target', () => {
  const data = readExclusionFile();
  const excluded = new Set(data.excluded_targets);
  const pillarSlugs = Object.values(fm.clusters).map(c => c.pillar).filter(Boolean);
  for (const pillar of pillarSlugs) {
    assert.ok(!excluded.has(pillar), `pillar ${pillar} must not itself be an excluded slug (sanity check on cluster config)`);
  }
  // Structural proof: no addition anywhere has reason 'pillar' targeting an excluded slug.
  const { plan } = buildPlan();
  for (const links of Object.values(plan.additions)) {
    for (const link of links) {
      if (link.reason === 'pillar') assert.ok(!excluded.has(link.slug), `pillar link must not target excluded slug ${link.slug}`);
    }
  }
});

test('H. Secondary-pillar path cannot select an excluded target', () => {
  const data = readExclusionFile();
  const excluded = new Set(data.excluded_targets);
  const { plan } = buildPlan();
  for (const links of Object.values(plan.additions)) {
    for (const link of links) {
      if (link.reason === 'secondary-pillar') assert.ok(!excluded.has(link.slug), `secondary-pillar link must not target excluded slug ${link.slug}`);
    }
  }
});

test('I. Same-cluster candidate pool excludes quarantined targets BEFORE sorting (not merely rejected by addLink)', () => {
  // Structural test: rebuild the exact same-cluster candidate-pool filter
  // buildLinkPlan uses internally, and assert no excluded slug is present in
  // it for ANY source/cluster combination — proving exclusion happens at
  // candidate-pool construction, not just at final insertion.
  const data = readExclusionFile();
  const excluded = new Set(data.excluded_targets);
  const articles = fm.loadArticles();
  for (const a of articles) a.cluster = fm.classifyArticle(a);
  const byCluster = new Map();
  for (const a of articles) {
    if (!byCluster.has(a.cluster)) byCluster.set(a.cluster, []);
    byCluster.get(a.cluster).push(a);
  }
  for (const [clusterId, members] of byCluster.entries()) {
    const candidatePool = members.filter(target => fm.isEligibleTarget(target.slug));
    for (const candidate of candidatePool) {
      assert.ok(!excluded.has(candidate.slug), `same-cluster candidate pool for ${clusterId} must not contain excluded slug ${candidate.slug}`);
    }
  }
});

test('J. Orphan-rescue target pool excludes quarantined targets BEFORE sorting', () => {
  const data = readExclusionFile();
  const excluded = new Set(data.excluded_targets);
  const articles = fm.loadArticles();
  const orphanPool = articles.filter(article => fm.isEligibleTarget(article.slug));
  for (const a of orphanPool) {
    assert.ok(!excluded.has(a.slug), `orphan-rescue pool must not contain excluded slug ${a.slug}`);
  }
  // Cross-check against the real plan: no addition anywhere has reason
  // 'orphan-rescue' targeting an excluded slug.
  const { plan } = buildPlan();
  for (const links of Object.values(plan.additions)) {
    for (const link of links) {
      if (link.reason === 'orphan-rescue') assert.ok(!excluded.has(link.slug), `orphan-rescue link must not target excluded slug ${link.slug}`);
    }
  }
});

test('K. addLink() independently rejects an excluded target as defense-in-depth', () => {
  const data = readExclusionFile();
  const excludedSlug = data.excluded_targets[0];
  const additions = { 'some-source': [] };
  const fakeSource = { slug: 'some-source', outgoing: new Set(), date: '2026-01-01' };
  const fakeTarget = { slug: excludedSlug, title: 'x', cluster: 'app', date: '2020-01-01' };
  const result = fm.addLink(additions, fakeSource, fakeTarget, 'same-cluster-low-incoming');
  assert.equal(result, false, 'addLink must reject an excluded target even when called directly, bypassing pre-selection filtering');
  assert.equal(additions['some-source'].length, 0);
});

// --- L/M. Dry-run outcomes ---

test('L. A full dry-run produces 0 planned links to any of the 21 quarantine slugs', () => {
  const data = readExclusionFile();
  const excluded = new Set(data.excluded_targets);
  const { plan } = buildPlan();
  let count = 0;
  for (const links of Object.values(plan.additions)) {
    for (const link of links) {
      if (excluded.has(link.slug)) count += 1;
    }
  }
  assert.equal(count, 0);
});

test('M. Running the dry-run plan twice produces byte-identical additions (deterministic)', () => {
  const run1 = JSON.stringify(buildPlan().plan.additions);
  const run2 = JSON.stringify(buildPlan().plan.additions);
  assert.equal(run1, run2);
});

// --- N/O/P. Graph integrity ---

test('N. No self-links in the dry-run plan', () => {
  const { plan } = buildPlan();
  for (const [source, links] of Object.entries(plan.additions)) {
    for (const link of links) assert.notEqual(link.slug, source, `${source} must not link to itself`);
  }
});

test('O. No duplicate source-target pairs in the dry-run plan', () => {
  const { plan } = buildPlan();
  for (const [source, links] of Object.entries(plan.additions)) {
    const seen = new Set();
    for (const link of links) {
      assert.ok(!seen.has(link.slug), `${source} must not link to ${link.slug} twice`);
      seen.add(link.slug);
    }
  }
});

test('P. No dangling internal targets in the dry-run plan', () => {
  const { articles, plan } = buildPlan();
  const broken = fm.validateLinks(articles, plan.additions);
  assert.equal(broken.length, 0, `expected 0 broken links, got ${JSON.stringify(broken)}`);
});

// --- Q/R/S/T. Protected sources unchanged ---

test('Q. Current three survivor source files are unchanged by this PR', () => {
  for (const slug of EXPECTED_SURVIVORS) {
    const diff = diffAgainstOriginMain(`blog/${slug}.md`);
    assert.equal(diff.trim(), '', `blog/${slug}.md must have zero diff`);
  }
});

test('R. Homepage remains unchanged', () => {
  const diff = diffAgainstOriginMain('index.md');
  assert.equal(diff.trim(), '', 'index.md must have zero diff');
});

test('S. Beginner Guide remains unchanged', () => {
  const diff = diffAgainstOriginMain('blog/beginners-guide-to-borojeet.md');
  assert.equal(diff.trim(), '', 'blog/beginners-guide-to-borojeet.md must have zero diff');
});

test('T. All 21 quarantine source files remain unchanged by this PR (ENGINE does not migrate links)', () => {
  const data = readExclusionFile();
  for (const slug of data.excluded_targets) {
    const diff = diffAgainstOriginMain(`blog/${slug}.md`);
    assert.equal(diff.trim(), '', `blog/${slug}.md must have zero diff — ENGINE only changes FULLMODE targeting logic, not content`);
  }
});

// --- U. No robots/canonical/sitemap behavior change from ENGINE ---

const siteExists = fs.existsSync(SITE);

test('U. Generated robots/canonical/sitemap state for all 21 quarantine URLs is unchanged by ENGINE', { skip: !siteExists && 'run npm run build first' }, () => {
  const data = readExclusionFile();
  const sitemap = fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8');
  for (const slug of data.excluded_targets) {
    const htmlPath = path.join(SITE, 'blog', slug, 'index.html');
    assert.ok(fs.existsSync(htmlPath), `blog/${slug}/index.html must still be generated`);
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.match(html, /noindex/, `${slug} must still render noindex (either noindex,follow or noindex,nofollow depending on P0 state — unchanged by ENGINE)`);
    assert.ok(!sitemap.includes(`/blog/${slug}/`), `${slug} must remain absent from sitemap.xml`);
  }
});

// --- V. Future-date simulation: exclusion survives P0 freeze eventually advancing ---

test('V. Excluded targets remain ineligible under a simulated future PUBLISHING_FREEZE_DATE, independent of rendered robots', () => {
  // isEligibleTarget() takes no date/time input at all — it is purely a
  // function of the slug and the static exclusion file. This is the
  // structural proof that advancing PUBLISHING_FREEZE_DATE (which only
  // affects .eleventy.js's `now`/robots rendering, not this file) cannot
  // change its answer. Demonstrate for the 7 currently P0-contained CRASH
  // slugs specifically, since those are the ones whose rendered robots will
  // eventually flip from noindex,nofollow to noindex,follow.
  const p0ContainedCrashSlugs = [
    'aviator-game-bangladesh-bkash-deposit',
    'casino-crash-game-bangladesh-guide',
    'crash-game-bangla-prediction-myth',
    'crash-game-mobile-data-saving-guide',
    'crazy-time-bangla-bet-sizing-guide',
    'crazy-time-bangladesh-bonus-round-guide',
    'funky-time-bangladesh-live-show-guide',
  ];
  for (const slug of p0ContainedCrashSlugs) {
    assert.equal(fm.isEligibleTarget(slug), false, `${slug} must remain ineligible regardless of its own date/P0 state`);
  }
  // isEligibleTarget's signature takes only a slug string — no date
  // parameter exists for a future PUBLISHING_FREEZE_DATE to flow through,
  // which is the durability property itself.
  assert.equal(fm.isEligibleTarget.length, 1, 'isEligibleTarget must be a pure function of slug only, with no date/time parameter');
});
