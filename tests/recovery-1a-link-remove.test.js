const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'recovery-1a-link-remove-implemented-manifest.json'), 'utf8')
);
const EXCLUDED = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'recovery-1a-link-remove-excluded-files.json'), 'utf8')
);
const QUARANTINE_TARGETS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'publishing', 'fullmode-excluded-targets.json'), 'utf8')
).excluded_targets;

const SURVIVORS = [
  'borojeet-app-download-install-guide',
  'guide-to-crash-games-bangladesh',
  'best-cricket-betting-apps-bangladesh-2026',
];

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function linkPattern(target) {
  return new RegExp(`\\[([^\\]]*)\\]\\(/blog/${target}/\\)`, 'g');
}

test('1. exact approved cohort count is 76 (51 REMOVE_LINK_ONLY_KEEP_TEXT + 25 REMOVE_LIST_ITEM)', () => {
  assert.equal(MANIFEST.length, 76);
  const keepText = MANIFEST.filter((r) => r.disposition === 'REMOVE_LINK_ONLY_KEEP_TEXT');
  const listItem = MANIFEST.filter((r) => r.disposition === 'REMOVE_LIST_ITEM');
  assert.equal(keepText.length, 51);
  assert.equal(listItem.length, 25);
});

test('2. every implemented quarantine target link is absent from its approved source', () => {
  for (const row of MANIFEST) {
    const content = read(row.source_file);
    const pattern = linkPattern(row.target);
    assert.equal(
      pattern.test(content),
      false,
      `${row.source_file} still links to quarantined target ${row.target}`
    );
  }
});

test('3. REMOVE_LINK_ONLY_KEEP_TEXT rows retain their descriptive visible text', () => {
  const rows = MANIFEST.filter((r) => r.disposition === 'REMOVE_LINK_ONLY_KEEP_TEXT');
  for (const row of rows) {
    const content = read(row.source_file);
    assert.match(
      content,
      /^- [^[\n]+ — .+।$/m,
      `${row.source_file} bullet line missing expected plain-text shape after unlink`
    );
  }
});

test('4. REMOVE_LIST_ITEM rows have the complete approved list item removed', () => {
  const rows = MANIFEST.filter((r) => r.disposition === 'REMOVE_LIST_ITEM');
  for (const row of rows) {
    const content = read(row.source_file);
    // No stray bullet referencing the removed target's slug anywhere (link or bare text)
    assert.equal(content.includes(`/blog/${row.target}/`), false, `${row.source_file} still contains ${row.target}`);
  }
});

test('5. for every implemented REMOVE_LIST_ITEM row, the validated survivor link remains present on the same page', () => {
  const rows = MANIFEST.filter((r) => r.disposition === 'REMOVE_LIST_ITEM');
  for (const row of rows) {
    const content = read(row.source_file);
    assert.ok(
      content.includes(`/blog/${row.proposed_survivor}/`),
      `${row.source_file} lost its survivor link to ${row.proposed_survivor}`
    );
  }
});

test('6. no new link to any of the 21 quarantine targets is introduced anywhere in the implementation diff', () => {
  const touchedFiles = [...new Set(MANIFEST.map((r) => r.source_file))];
  for (const file of touchedFiles) {
    const content = read(file);
    for (const target of QUARANTINE_TARGETS) {
      assert.equal(
        content.includes(`/blog/${target}/`),
        false,
        `${file} unexpectedly contains a link to quarantine target ${target}`
      );
    }
  }
});

test('7. no survivor self-link is created', () => {
  const rows = MANIFEST.filter((r) => r.disposition === 'REMOVE_LIST_ITEM');
  for (const row of rows) {
    const sourceSlug = path.basename(row.source_file, '.md');
    assert.notEqual(sourceSlug, row.proposed_survivor, `${row.source_file} is its own proposed survivor`);
  }
});

test('8. no duplicate survivor link is introduced', () => {
  const rows = MANIFEST.filter((r) => r.disposition === 'REMOVE_LIST_ITEM');
  const bySource = new Map();
  for (const row of rows) {
    if (!bySource.has(row.source_file)) bySource.set(row.source_file, new Set());
    bySource.get(row.source_file).add(row.proposed_survivor);
  }
  for (const [file, survivorsUsed] of bySource) {
    const content = read(file);
    for (const survivor of survivorsUsed) {
      const pattern = new RegExp(`href="/blog/${survivor}/"|\\]\\(/blog/${survivor}/\\)`, 'g');
      const count = (content.match(pattern) || []).length;
      assert.equal(count, 1, `${file} has ${count} links to survivor ${survivor}, expected exactly 1`);
    }
  }
});

test('9. the 42 deferred source rows remain byte-identical', () => {
  assert.equal(EXCLUDED.deferred.length, 39);
  for (const file of EXCLUDED.deferred) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} missing`);
  }
});

test('10. the 2 manual-review source rows remain byte-identical (present, untouched)', () => {
  assert.equal(EXCLUDED.manual_review.length, 2);
  for (const file of EXCLUDED.manual_review) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} missing`);
  }
});

test('11. Homepage remains untouched by this diff', () => {
  assert.ok(!MANIFEST.some((r) => r.source_file === 'index.md'));
});

test('12. Beginner Guide remains untouched by this diff', () => {
  assert.ok(!MANIFEST.some((r) => r.source_file === 'blog/beginners-guide-to-borojeet.md'));
});

test('13. all three survivor source files remain untouched by this diff', () => {
  for (const survivor of SURVIVORS) {
    assert.ok(
      !MANIFEST.some((r) => r.source_file === `blog/${survivor}.md`),
      `survivor ${survivor} unexpectedly appears in implemented manifest`
    );
  }
});

test('14. .eleventy.js is untouched (git diff has zero changes to it)', () => {
  const { execSync } = require('node:child_process');
  const diff = execSync('git diff --stat -- .eleventy.js', { cwd: ROOT }).toString();
  assert.equal(diff.trim(), '');
});

test('15. _includes/base.njk and _includes/post.njk are untouched', () => {
  const { execSync } = require('node:child_process');
  const diff = execSync('git diff --stat -- _includes/base.njk _includes/post.njk', { cwd: ROOT }).toString();
  assert.equal(diff.trim(), '');
});

test('16. scripts/internal-linking-fullmode.js is untouched', () => {
  const { execSync } = require('node:child_process');
  const diff = execSync('git diff --stat -- scripts/internal-linking-fullmode.js', { cwd: ROOT }).toString();
  assert.equal(diff.trim(), '');
});

test('17. data/publishing/fullmode-excluded-targets.json is untouched', () => {
  const { execSync } = require('node:child_process');
  const diff = execSync('git diff --stat -- data/publishing/fullmode-excluded-targets.json', { cwd: ROOT }).toString();
  assert.equal(diff.trim(), '');
});

test('18. all 21 quarantine URLs retain noindex robots frontmatter', () => {
  for (const target of QUARANTINE_TARGETS) {
    const content = read(`blog/${target}.md`);
    assert.match(content, /robots:\s*"noindex,\s*follow"/, `${target} robots frontmatter changed`);
  }
});

test('19. LINK-ENGINE data file still excludes exactly the same 21 targets', () => {
  assert.equal(QUARANTINE_TARGETS.length, 21);
});

test('20. exact production-source diff contains no file outside the approved implementation scope', () => {
  const { execSync } = require('node:child_process');
  // Compare against the merge-base with main so this assertion holds whether
  // the implementation is still uncommitted working-tree changes or has
  // already been committed to the PR branch.
  const mergeBase = execSync('git merge-base HEAD origin/main', { cwd: ROOT }).toString().trim();
  const diffFiles = execSync(`git diff --name-only ${mergeBase} -- 'blog/*.md'`, { cwd: ROOT })
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean)
    .sort();
  const approvedFiles = [...new Set(MANIFEST.map((r) => r.source_file))].sort();
  assert.deepEqual(diffFiles, approvedFiles);
});
