const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readGenerated(relPath) {
  const full = path.join(ROOT, '_site', relPath);
  if (!fs.existsSync(full)) {
    return null;
  }
  return fs.readFileSync(full, 'utf8');
}

// Generated HTML is minified and HTML-entity-encodes "&" as "&amp;"; build
// regexes against the decoded string so exact-text assertions survive minification.
function htmlEncode(str) {
  return str.replace(/&/g, '&amp;');
}

const HOMEPAGE_SRC = 'index.md';
const BEGINNER_SRC = 'blog/beginners-guide-to-borojeet.md';
const BASE_TEMPLATE_SRC = '_includes/base.njk';
const POST_TEMPLATE_SRC = '_includes/post.njk';

const HOMEPAGE_SEO_TITLE = 'BoroJeet Bangladesh | Guides, Access & Account Information';
const HOMEPAGE_SEO_DESCRIPTION = 'Find BoroJeet guides for account access, app and APK information, registration, payments and getting started in Bangladesh. Choose the guide that matches what you need.';
const HOMEPAGE_H1 = 'BoroJeet in Bangladesh';

const BEGINNER_SEO_TITLE = 'BoroJeet Beginner Guide: How to Get Started';
const BEGINNER_SEO_DESCRIPTION = 'New to BoroJeet? Follow this beginner guide to understand registration, login, app access, payments and the main steps before you get started.';
const BEGINNER_H1 = 'How to Get Started with BoroJeet: A Beginner Guide';

const LOGIN_URL = '/borojeet-login/';
const APP_GUIDE_URL = '/blog/borojeet-app-download-install-guide/';
const REGISTRATION_URL = '/blog/boro-jeet-registration-guide-2026/';
const PAYMENTS_URL = '/blog/ultimate-guide-to-online-casino-payments-bangladesh/';
const BEGINNER_URL_PATH = '/blog/beginners-guide-to-borojeet/';
const APK_URL = '/borojeet-apk-download/';

test('Homepage source: seoTitle exact', () => {
  const src = readSource(HOMEPAGE_SRC);
  assert.match(src, new RegExp(`^seoTitle:\\s*"${HOMEPAGE_SEO_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"$`, 'm'));
});

test('Homepage source: seoDescription exact', () => {
  const src = readSource(HOMEPAGE_SRC);
  assert.match(src, new RegExp(`^seoDescription:\\s*"${HOMEPAGE_SEO_DESCRIPTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"$`, 'm'));
});

test('Homepage source: H1 exact', () => {
  const src = readSource(HOMEPAGE_SRC);
  assert.match(src, new RegExp(`<h1 class="h1">${HOMEPAGE_H1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
});

test('Homepage source: hero opening exists', () => {
  const src = readSource(HOMEPAGE_SRC);
  assert.match(src, /Looking for information about BoroJeet\?/);
  assert.match(src, /independent guides to help you find the right next step/);
});

test('Homepage source: required hero CTA IDs exist', () => {
  const src = readSource(HOMEPAGE_SRC);
  assert.match(src, /data-cta-id="home_hero_choose"/);
  assert.match(src, /data-cta-id="home_hero_beginner"/);
});

test('Homepage source: required task navigation CTA IDs exist', () => {
  const src = readSource(HOMEPAGE_SRC);
  ['home_task_login', 'home_task_app', 'home_task_registration', 'home_task_beginner', 'home_task_payment'].forEach((id) => {
    assert.match(src, new RegExp(`data-cta-id="${id}"`), `missing CTA id ${id}`);
  });
});

test('Homepage source: task destinations are exact approved URLs', () => {
  const src = readSource(HOMEPAGE_SRC);
  assert.match(src, new RegExp(`data-cta-id="home_task_login"[^>]*data-destination="${LOGIN_URL.replace(/\//g, '\\/')}"`));
  assert.match(src, new RegExp(`data-cta-id="home_task_app"[^>]*data-destination="${APP_GUIDE_URL.replace(/\//g, '\\/')}"`));
  assert.match(src, new RegExp(`data-cta-id="home_task_registration"[^>]*data-destination="${REGISTRATION_URL.replace(/\//g, '\\/')}"`));
  assert.match(src, new RegExp(`data-cta-id="home_task_beginner"[^>]*data-destination="${BEGINNER_URL_PATH.replace(/\//g, '\\/')}"`));
  assert.match(src, new RegExp(`data-cta-id="home_task_payment"[^>]*data-destination="${PAYMENTS_URL.replace(/\//g, '\\/')}"`));
});

test('Homepage negative: App task route does not point to /borojeet-apk-download/', () => {
  const src = readSource(HOMEPAGE_SRC);
  const appLineMatch = src.match(/data-cta-id="home_task_app"[^>]*data-destination="([^"]+)"/);
  assert.ok(appLineMatch, 'home_task_app CTA not found');
  assert.notEqual(appLineMatch[1], APK_URL);
});

test('Homepage negative: hero primary CTA does not link directly to /go/borojeet', () => {
  const src = readSource(HOMEPAGE_SRC);
  const heroSection = src.split('<!-- HERO -->')[1]?.split('<!-- TASK NAVIGATION -->')[0] || '';
  assert.doesNotMatch(heroSection, /href="\/go\/borojeet"/);
});

test('Homepage negative: no softwareApp frontmatter block', () => {
  const src = readSource(HOMEPAGE_SRC);
  const frontmatter = src.split('---')[1] || '';
  assert.doesNotMatch(frontmatter, /softwareApp:/);
});

test('Homepage negative: unsupported claims removed from body', () => {
  const src = readSource(HOMEPAGE_SRC);
  const body = src.split(/^---$/m).slice(2).join('---');
  assert.doesNotMatch(body, /অফিসিয়াল APK/);
  assert.doesNotMatch(body, /১০০% সুরক্ষিত/);
  assert.doesNotMatch(body, /400%/);
  assert.doesNotMatch(body, /official APK/i);
  assert.doesNotMatch(body, /100% secure/i);
});

test('Homepage negative: no primary aggressive bonus positioning section', () => {
  const src = readSource(HOMEPAGE_SRC);
  assert.doesNotMatch(src, /newbie-bonus-heading/);
  assert.doesNotMatch(src, /more-promos/);
});

test('Homepage frontmatter: hideHeaderCta and hideStickyCta set', () => {
  const src = readSource(HOMEPAGE_SRC);
  const frontmatter = src.split('---')[1] || '';
  assert.match(frontmatter, /hideHeaderCta:\s*true/);
  assert.match(frontmatter, /hideStickyCta:\s*true/);
});

test('Homepage source: affiliate disclosure present', () => {
  const src = readSource(HOMEPAGE_SRC);
  assert.match(src, /independent affiliate information site/);
  assert.match(src, /does not operate BoroJeet/);
});

test('Beginner source: seoTitle exact', () => {
  const src = readSource(BEGINNER_SRC);
  assert.match(src, new RegExp(`seoTitle:\\s*"${BEGINNER_SEO_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
});

test('Beginner source: seoDescription exact', () => {
  const src = readSource(BEGINNER_SRC);
  assert.match(src, new RegExp(`seoDescription:\\s*"${BEGINNER_SEO_DESCRIPTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
});

test('Beginner source: title (H1 source) exact', () => {
  const src = readSource(BEGINNER_SRC);
  assert.match(src, new RegExp(`title:\\s*"${BEGINNER_H1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
});

test('Beginner source: seoTitle differs from title/H1', () => {
  assert.notEqual(BEGINNER_SEO_TITLE, BEGINNER_H1);
});

test('Beginner frontmatter: hideHeaderCta, hideStickyCta, hidePostPromo set', () => {
  const src = readSource(BEGINNER_SRC);
  const frontmatter = src.split('---')[1] || '';
  assert.match(frontmatter, /hideHeaderCta:\s*true/);
  assert.match(frontmatter, /hideStickyCta:\s*true/);
  assert.match(frontmatter, /hidePostPromo:\s*true/);
});

test('Beginner source: required CTA IDs exist', () => {
  const src = readSource(BEGINNER_SRC);
  ['beginner_registration', 'beginner_login', 'beginner_app', 'beginner_payment', 'beginner_login_problem'].forEach((id) => {
    assert.match(src, new RegExp(`data-cta-id="${id}"`), `missing CTA id ${id}`);
  });
});

test('Beginner source: CTA destinations exact', () => {
  const src = readSource(BEGINNER_SRC);
  assert.match(src, new RegExp(`data-cta-id="beginner_registration"[^>]*data-destination="${REGISTRATION_URL.replace(/\//g, '\\/')}"`));
  assert.match(src, new RegExp(`data-cta-id="beginner_login"[^>]*data-destination="${LOGIN_URL.replace(/\//g, '\\/')}"`));
  assert.match(src, new RegExp(`data-cta-id="beginner_app"[^>]*data-destination="${APP_GUIDE_URL.replace(/\//g, '\\/')}"`));
  assert.match(src, new RegExp(`data-cta-id="beginner_payment"[^>]*data-destination="${PAYMENTS_URL.replace(/\//g, '\\/')}"`));
  assert.match(src, new RegExp(`data-cta-id="beginner_login_problem"[^>]*data-destination="${LOGIN_URL.replace(/\//g, '\\/')}"`));
});

test('Beginner negative: opening does not link directly to /go/borojeet', () => {
  const src = readSource(BEGINNER_SRC);
  const body = src.split(/^---$/m).slice(2).join('---');
  const firstParagraph = body.trim().split('\n\n')[0];
  assert.doesNotMatch(firstParagraph, /\/go\/borojeet/);
});

test('Beginner negative: generic "What is BoroJeet?" primary section removed', () => {
  const src = readSource(BEGINNER_SRC);
  assert.doesNotMatch(src, /BoroJeet কী\? \(What is BoroJeet\?\)/);
  assert.doesNotMatch(src, /What is BoroJeet\?/);
});

test('Beginner negative: managed internal-links fullmode block removed', () => {
  const src = readSource(BEGINNER_SRC);
  assert.doesNotMatch(src, /internal-links:fullmode:start/);
  assert.doesNotMatch(src, /internal-links:fullmode:end/);
});

test('Beginner negative: no aggressive 400% bonus CTA', () => {
  const src = readSource(BEGINNER_SRC);
  assert.doesNotMatch(src, /400%/);
});

test('Beginner negative: no "official website" affiliate wording', () => {
  const src = readSource(BEGINNER_SRC);
  assert.doesNotMatch(src, /অফিসিয়াল ওয়েবসাইট/);
  assert.doesNotMatch(src, /official website/i);
});

test('Base template: seoTitle/seoDescription override implemented, backward compatible', () => {
  const src = readSource(BASE_TEMPLATE_SRC);
  assert.match(src, /if seoTitle/);
  assert.match(src, /if seoDescription/);
  // Fallback branch (existing behavior) must remain present
  assert.match(src, /title \| length > 45/);
  assert.match(src, /truncate\(160\)/);
});

test('Base template: hideHeaderCta opt-out implemented, default-on', () => {
  const src = readSource(BASE_TEMPLATE_SRC);
  assert.match(src, /if not hideHeaderCta/);
  assert.match(src, /Get Bonus/);
});

test('Post template: hidePostPromo opt-out implemented, default-on', () => {
  const src = readSource(POST_TEMPLATE_SRC);
  assert.match(src, /if not hidePostPromo/);
  assert.match(src, /Ready to Win Big/);
});

test('Control page frontmatter unaffected: no Batch A opt-outs on a normal post', () => {
  const src = readSource('blog/borojeet-app-download-install-guide.md');
  const frontmatter = src.split('---')[1] || '';
  assert.doesNotMatch(frontmatter, /hideHeaderCta/);
  assert.doesNotMatch(frontmatter, /hideStickyCta/);
  assert.doesNotMatch(frontmatter, /hidePostPromo/);
  assert.doesNotMatch(frontmatter, /seoTitle/);
  assert.doesNotMatch(frontmatter, /seoDescription/);
});

// --- Generated HTML checks (skipped gracefully if _site is not built) ---

test('Generated: Homepage HTML checks', (t) => {
  const html = readGenerated('index.html');
  if (!html) {
    t.skip('_site/index.html not found; run npm run build first');
    return;
  }
  assert.match(html, new RegExp(`<title>${htmlEncode(HOMEPAGE_SEO_TITLE).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`));
  assert.match(html, new RegExp(`<meta name="description" content="${htmlEncode(HOMEPAGE_SEO_DESCRIPTION).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<h1 class="h1">${HOMEPAGE_H1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
  assert.match(html, /id="task-navigation"/);
  assert.doesNotMatch(html, /"@type":\s*"SoftwareApplication"/);
  assert.doesNotMatch(html, /"@type":\s*"AggregateRating"/);
  // Header affiliate CTA must not render
  const headerSection = html.split('<header>')[1]?.split('</header>')[0] || '';
  assert.doesNotMatch(headerSection, /Get Bonus/);
  // sitewide sticky must not render (id stickyCta), page-specific sticky must
  assert.doesNotMatch(html, /id="stickyCta"/);
  assert.match(html, /id="homeInfoSticky"/);
});

test('Generated: Beginner HTML checks', (t) => {
  const html = readGenerated('blog/beginners-guide-to-borojeet/index.html');
  if (!html) {
    t.skip('_site/blog/beginners-guide-to-borojeet/index.html not found; run npm run build first');
    return;
  }
  assert.match(html, new RegExp(`<title>${htmlEncode(BEGINNER_SEO_TITLE).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`));
  assert.match(html, new RegExp(`<meta name="description" content="${htmlEncode(BEGINNER_SEO_DESCRIPTION).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, new RegExp(`<h1 class="h1">${BEGINNER_H1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
  const headerSection = html.split('<header>')[1]?.split('</header>')[0] || '';
  assert.doesNotMatch(headerSection, /Get Bonus/);
  assert.doesNotMatch(html, /id="stickyCta"/);
  assert.doesNotMatch(html, /Ready to Win Big/);
  assert.doesNotMatch(html, /internal-links:fullmode/);
});

test('Generated: control page still has Header CTA, sticky, and post promo', (t) => {
  const html = readGenerated('blog/borojeet-app-download-install-guide/index.html');
  if (!html) {
    t.skip('_site control page not found; run npm run build first');
    return;
  }
  const headerSection = html.split('<header>')[1]?.split('</header>')[0] || '';
  assert.match(headerSection, /Get Bonus/);
  assert.match(html, /id="stickyCta"/);
  assert.match(html, /Ready to Win Big/);
});

// --- Tracking taxonomy static checks ---

test('Tracking: universal-performance.js reads Batch A taxonomy fields', () => {
  const src = readSource('assets/universal-performance.js');
  ['cta_id', 'cta_type', 'cta_position', 'destination', 'destination_role', 'page_role', 'search_intent', 'experiment_id', 'cta_text'].forEach((field) => {
    assert.match(src, new RegExp(field), `tracking script missing field ${field}`);
  });
  // Existing generic /go/borojeet tracker must remain untouched
  assert.match(src, /trackCTAClicks/);
  assert.match(src, /cta_click/);
});

// --- Reliability fixes: gtag global exposure + delegated click resolution ---

test('base.njk: gtag is exposed as a global window.gtag, not a local function', () => {
  const src = readSource(BASE_TEMPLATE_SRC);
  assert.match(src, /window\.gtag\s*=\s*window\.gtag\s*\|\|\s*function/);
  assert.doesNotMatch(src, /function gtag\(\)/);
  // Existing multi-load guard must still key off window.gtag
  assert.match(src, /if \(window\.gtag\) return/);
  // Calls inside loadGoogleAnalytics must use the global, not a bare identifier
  assert.match(src, /window\.gtag\('js', new Date\(\)\)/);
  assert.match(src, /window\.gtag\('config', 'G-P6KSF9FS0T'/);
});

test('universal-performance.js: click handler resolves nested elements via closest()', () => {
  const src = readSource('assets/universal-performance.js');
  assert.match(src, /e\.target\.closest/);
  assert.match(src, /closest\(['"]\.cta, \[data-track="true"\]['"]\)/);
  // Must not rely solely on e.target for the important-click check anymore
  assert.doesNotMatch(src, /e\.target\.classList\.contains\('cta'\) \|\| e\.target\.dataset\.track === 'true'/);
});

// --- Homepage mobile task-flow structure ---

test('Homepage source: hero image block removed', () => {
  const src = readSource(HOMEPAGE_SRC);
  const heroSection = src.split('<!-- HERO -->')[1]?.split('<!-- TASK NAVIGATION -->')[0] || '';
  assert.doesNotMatch(heroSection, /hero-image/);
  assert.doesNotMatch(heroSection, /borojeet-bangladesh-bonus-bkash-nagad/);
  assert.doesNotMatch(heroSection, /<picture/);
});

test('Homepage source: task navigation immediately follows hero (no image block between)', () => {
  const src = readSource(HOMEPAGE_SRC);
  const heroIdx = src.indexOf('<!-- HERO -->');
  const taskNavIdx = src.indexOf('<!-- TASK NAVIGATION -->');
  assert.ok(heroIdx !== -1 && taskNavIdx !== -1 && taskNavIdx > heroIdx);
  const between = src.slice(heroIdx, taskNavIdx);
  assert.doesNotMatch(between, /<picture/);
  assert.doesNotMatch(between, /img-frame/);
});

test('Homepage source: task cards use scoped compact min-height, global .card untouched', () => {
  const src = readSource(HOMEPAGE_SRC);
  const taskNavSection = src.split('<!-- TASK NAVIGATION -->')[1]?.split('<!-- INDEPENDENT INFORMATION SITE EXPLANATION -->')[0] || '';
  const cardCount = (taskNavSection.match(/<li class="card"/g) || []).length;
  const compactCount = (taskNavSection.match(/<li class="card" style="min-height: 0;">/g) || []).length;
  assert.equal(cardCount, 5);
  assert.equal(compactCount, 5);
});

test('base.njk: global .card min-height rule is unmodified', () => {
  const src = readSource(BASE_TEMPLATE_SRC);
  assert.match(src, /min-height:\s*300px;\s*\/\* Prevent card height shifts \*\//);
});

test('Generated: Homepage hero image absent and task-navigation directly follows CTAs', (t) => {
  const html = readGenerated('index.html');
  if (!html) {
    t.skip('_site/index.html not found; run npm run build first');
    return;
  }
  const heroChoiceIdx = html.indexOf('home_hero_choose');
  const heroBeginnerIdx = html.indexOf('home_hero_beginner');
  const taskNavIdx = html.indexOf('id="task-navigation"');
  assert.ok(heroChoiceIdx !== -1 && heroBeginnerIdx !== -1 && taskNavIdx !== -1);
  assert.ok(heroChoiceIdx < heroBeginnerIdx);
  assert.ok(heroBeginnerIdx < taskNavIdx);
  const betweenCtasAndTaskNav = html.slice(heroBeginnerIdx, taskNavIdx);
  assert.doesNotMatch(betweenCtasAndTaskNav, /<picture/);
  assert.doesNotMatch(betweenCtasAndTaskNav, /borojeet-bangladesh-bonus-bkash-nagad/);
});
