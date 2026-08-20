const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readGenerated(relPath) {
  const full = path.join(ROOT, '_site', relPath);
  if (!fs.existsSync(full)) return null;
  const source = path.join(ROOT, TARGET_SRC);
  if (fs.statSync(full).mtimeMs < fs.statSync(source).mtimeMs) return null;
  return fs.readFileSync(full, 'utf8');
}

function frontmatter(src) {
  return src.split(/^---\s*$/m)[1] || '';
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function htmlEncode(str) {
  return str.replace(/&/g, '&amp;');
}

function gitBlobSha(content) {
  const body = Buffer.from(content.replace(/\r\n/g, '\n'), 'utf8');
  const header = Buffer.from(`blob ${body.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header, body])).digest('hex');
}

function parseJsonLd(html) {
  const blocks = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    blocks.push(JSON.parse(match[1].trim()));
  }
  return blocks;
}

function findHeadings(html, level, expectedText) {
  const headings = [];
  const re = new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)<\\/h${level}>`, 'g');
  let match;
  while ((match = re.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text === expectedText) headings.push({ index: match.index, html: match[0] });
  }
  return headings;
}

const TARGET_SRC = 'blog/best-cricket-betting-apps-bangladesh-2026.md';
const TARGET_URL = '/blog/best-cricket-betting-apps-bangladesh-2026/';
const TARGET_CANONICAL = `https://borojeetbd.com${TARGET_URL}`;
const TARGET_TITLE = 'ক্রিকেট বাজি ধরার অ্যাপ ২০২৬: সেরা ৫ APK (bKash/Nagad সহ)';
const TARGET_DESCRIPTION = 'বাংলাদেশে ক্রিকেট বাজি খেলার সেরা ৫টি অ্যাপ ২০২৬ — APK ডাউনলোড লিংক, bKash/Nagad ডিপোজিট, বোনাস ও নিরাপত্তা তুলনা। কোন অ্যাপ আপনার জন্য সেরা, দেখে নিন...';
const TARGET_H2 = 'বাংলাদেশে সেরা Cricket Betting Apps — 2026 তুলনা';
const COMPARISON_H3 = 'তুলনামূলক সারণী';
const REVIEW_H2 = 'জনপ্রিয় ক্রিকেট বেটিং অ্যাপের পর্যালোচনা (App Reviews)';
const FAQ_1 = 'বাংলাদেশে cricket betting app বাছার সময় কী কী compare করবেন?';
const FAQ_2 = 'Best cricket betting app বাছার জন্য কোন criteria সবচেয়ে গুরুত্বপূর্ণ?';

const SUPPORTING = [
  {
    file: 'blog/cricket-betting-app-bangla-review.md',
    title: 'Cricket Betting App Bangla Review: speed, market ও payment compare',
    anchor: 'বাংলাদেশে cricket betting app তুলনা'
  },
  {
    file: 'blog/cricket-betting-tips-app-bd-guide.md',
    title: 'Cricket Betting Tips App BD: কোন data দেখে mobile bet নেবেন?',
    anchor: 'cricket betting app BD comparison'
  },
  {
    file: 'blog/no-1-cricket-betting-app-bd.md',
    title: 'No 1 Cricket Betting App BD: কোন criteria দিয়ে সেরা app বাছবেন?',
    anchor: 'সেরা cricket betting apps'
  },
  {
    file: 'blog/asia-cup-2026-cricket-betting-apps-bd.md',
    title: 'Asia Cup 2026 Cricket Betting Apps BD: tournament আগে setup',
    anchor: 'Cricket Betting Apps Bangladesh'
  }
];

const PROTECTED_BLOBS = {
  'index.md': 'a34cab7a4a0011d9fa7bd9eb0101418188d3a680',
  'blog/beginners-guide-to-borojeet.md': '9a398b2b0532b2036459e21557710ff8bff2c028',
  'scripts/internal-linking-fullmode.js': 'fe3f6d68ef2b63b245b85e511d457cfe6da1dac7'
};

test('Target source: URL contract remains filename-derived with no permalink/canonical override', () => {
  const fm = frontmatter(readSource(TARGET_SRC));
  assert.doesNotMatch(fm, /^permalink:/m);
  assert.doesNotMatch(fm, /^canonicalUrl:/m);
  assert.doesNotMatch(fm, /^canonical:/m);
});

test('Target source: title and description remain exact', () => {
  const fm = frontmatter(readSource(TARGET_SRC));
  assert.match(fm, new RegExp(`^title:\\s*"${escapeRegExp(TARGET_TITLE)}"$`, 'm'));
  assert.match(fm, new RegExp(`^description:\\s*"${escapeRegExp(TARGET_DESCRIPTION)}"$`, 'm'));
});

test('Target source: approved comparison H2 exists exactly once', () => {
  const src = readSource(TARGET_SRC);
  assert.equal((src.match(new RegExp(`^## ${escapeRegExp(TARGET_H2)}$`, 'gm')) || []).length, 1);
});

test('Target source: old duplicate comparison H2 is absent and comparison H3 exists once', () => {
  const src = readSource(TARGET_SRC);
  assert.equal((src.match(/^## তুলনামূলক সারণী$/gm) || []).length, 0);
  assert.equal((src.match(/^### তুলনামূলক সারণী$/gm) || []).length, 1);
});

test('Target source: early answer block order is comparison H2 -> criteria H3 -> comparison H3 -> reviews H2', () => {
  const src = readSource(TARGET_SRC);
  const h2 = src.indexOf(`## ${TARGET_H2}`);
  const criteria = src.indexOf('### সেরা অ্যাপ বেছে নেওয়ার জন্য আমাদের মানদণ্ড (Our Criteria)');
  const comparison = src.indexOf(`### ${COMPARISON_H3}`);
  const reviews = src.indexOf(`## ${REVIEW_H2}`);
  assert.ok(h2 !== -1 && criteria !== -1 && comparison !== -1 && reviews !== -1);
  assert.ok(h2 < criteria && criteria < comparison && comparison < reviews);
  assert.match(src.slice(comparison, reviews), /\| বৈশিষ্ট্য \| BoroJeet অ্যাপ \| Bet365 অ্যাপ \| 1xBet অ্যাপ \|/);
});

test('Target source: FAQ count remains six and exactly the two approved replacement questions exist', () => {
  const fm = frontmatter(readSource(TARGET_SRC));
  assert.equal((fm.match(/^\s*- question:/gm) || []).length, 6);
  assert.match(fm, new RegExp(`question:\\s*"${escapeRegExp(FAQ_1)}"`));
  assert.match(fm, new RegExp(`question:\\s*"${escapeRegExp(FAQ_2)}"`));
  assert.doesNotMatch(fm, /What should I look for in a cricket betting app\?/);
  assert.doesNotMatch(fm, /Which is the best cricket betting app for users in Bangladesh\?/);
});

test('Target source: new FAQ answers stay inside approved comparison criteria scope', () => {
  const fm = frontmatter(readSource(TARGET_SRC));
  const firstTwo = fm.split('  - question:').slice(1, 3).join('\n');
  ['usability', 'cricket market', 'mobile performance', 'payment compatibility', 'terms', 'risk'].forEach((term) => {
    assert.match(firstTwo.toLowerCase(), new RegExp(escapeRegExp(term)));
  });
  assert.doesNotMatch(firstTwo, /guaranteed|100% safe|safest|fastest|official|encryption/i);
});

test('Supporting pages: approved anchors point to the exact target in normal contextual content', () => {
  for (const item of SUPPORTING) {
    const src = readSource(item.file);
    const contextual = src.split('<!-- internal-links:fullmode:start -->')[0];
    const expected = `[${item.anchor}](${TARGET_URL})`;
    assert.match(contextual, new RegExp(escapeRegExp(expected)), `${item.file} missing approved contextual anchor`);
    assert.equal((contextual.match(new RegExp(escapeRegExp(TARGET_URL), 'g')) || []).length, 1, `${item.file} should have exactly one contextual target link`);
  }
});

test('Supporting pages: modifier ownership title, URL derivation and canonical behavior remain unchanged', () => {
  for (const item of SUPPORTING) {
    const fm = frontmatter(readSource(item.file));
    assert.match(fm, new RegExp(`^title:\\s*"${escapeRegExp(item.title)}"$`, 'm'));
    assert.doesNotMatch(fm, /^permalink:/m);
    assert.doesNotMatch(fm, /^canonicalUrl:/m);
    assert.doesNotMatch(fm, /^canonical:/m);
  }
});

test('Experiment isolation: Homepage, Beginner and FULLMODE generator match approved main blobs', () => {
  for (const [file, expectedSha] of Object.entries(PROTECTED_BLOBS)) {
    assert.equal(gitBlobSha(readSource(file)), expectedSha, `${file} drifted from approved main baseline`);
  }
});

// Generated HTML checks are intentionally skipped before a fresh build and become
// mandatory when this test is rerun after npm run build.
test('Generated target: title, H1 and canonical remain exact', (t) => {
  const html = readGenerated('blog/best-cricket-betting-apps-bangladesh-2026/index.html');
  if (!html) {
    t.skip('generated target not found; run npm run build first');
    return;
  }
  assert.match(html, new RegExp(`<title>${escapeRegExp(htmlEncode(TARGET_TITLE))}</title>`));
  assert.match(html, new RegExp(`<h1 class="h1">${escapeRegExp(TARGET_TITLE)}</h1>`));
  assert.match(html, new RegExp(`<link rel="canonical" href="${escapeRegExp(TARGET_CANONICAL)}">`));
  assert.match(html, /<meta name="description" content="বাংলাদেশে ক্রিকেট বাজি খেলার সেরা ৫টি অ্যাপ ২০২৬/);
});

test('Generated target: early comparison block renders once before detailed reviews', (t) => {
  const html = readGenerated('blog/best-cricket-betting-apps-bangladesh-2026/index.html');
  if (!html) {
    t.skip('generated target not found; run npm run build first');
    return;
  }
  const targetH2s = findHeadings(html, 2, TARGET_H2);
  const oldComparisonH2s = findHeadings(html, 2, COMPARISON_H3);
  const comparisonH3s = findHeadings(html, 3, COMPARISON_H3);
  const reviewH2s = findHeadings(html, 2, REVIEW_H2);
  assert.equal(targetH2s.length, 1);
  assert.equal(oldComparisonH2s.length, 0);
  assert.equal(comparisonH3s.length, 1);
  assert.equal(reviewH2s.length, 1);
  const comparison = comparisonH3s[0].index;
  const reviews = reviewH2s[0].index;
  assert.ok(comparison < reviews);
  assert.match(html.slice(comparison, reviews), /<table/);
});

test('Generated target: FAQPage JSON-LD parses with six entries and the two approved questions', (t) => {
  const html = readGenerated('blog/best-cricket-betting-apps-bangladesh-2026/index.html');
  if (!html) {
    t.skip('generated target not found; run npm run build first');
    return;
  }
  const blocks = parseJsonLd(html);
  const faq = blocks.find((block) => block && !Array.isArray(block) && block['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage JSON-LD not found');
  assert.equal(faq.mainEntity.length, 6);
  const questions = faq.mainEntity.map((item) => item.name);
  assert.ok(questions.includes(FAQ_1));
  assert.ok(questions.includes(FAQ_2));
});
