const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'blog');
const REPORT_DIR = path.join(ROOT_DIR, 'data', 'publishing');
const REPORT_FILE = path.join(REPORT_DIR, 'internal-linking-fullmode-2026-05-report.md');
const START_MARKER = '<!-- internal-links:fullmode:start -->';
const END_MARKER = '<!-- internal-links:fullmode:end -->';
const MAX_STANDARD_LINKS = 6;
const MAX_PILLAR_LINKS = 14;

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');

const clusters = {
  app: {
    label: 'App, APK ও account setup',
    pillar: 'borojeet-app-download-install-guide',
    regex: /\b(app|apk|android|ios|login|otp|account|register|registration|official|cache|storage|browser|install|download|play-store|permission|device|phone|email)\b|boro\s?jeet|borojeet|borojeetbd/i
  },
  cricket: {
    label: 'Cricket betting',
    pillar: 'ultimate-guide-to-cricket-betting-in-bangladesh',
    regex: /cricket|bpl|ipl|asia-cup|t20|odi|test-match|wicket|powerplay|toss|pitch|player-runs|session/i
  },
  football: {
    label: 'Football / World Cup betting',
    pillar: 'football-betting-guide-bangladesh',
    regex: /football|world-cup|fifa|epl|premier-league|champions-league|europa|la-liga|goal|corner|card|penalty|clean-sheet|half-time|outright/i
  },
  payments: {
    label: 'Payments, deposits ও withdrawals',
    pillar: 'ultimate-guide-to-online-casino-payments-bangladesh',
    regex: /bkash|nagad|rocket|upay|payment|deposit|withdrawal|wallet|cashout|cash-out|trxid|transaction|limit|fee|payout|cashier|agent-number|screenshot-proof/i
  },
  safety: {
    label: 'Legal, safety, scam ও responsible play',
    pillar: 'legal-online-casino-bangladesh-guide',
    secondaryPillar: 'safe-online-gaming-bangladesh-checklist',
    regex: /legal|law|jua|safe|safety|scam|fake|kyc|aml|responsible|underage|vpn|tax|risk|warning|licensed|license|verification|phishing|hacked|review|documents/i
  },
  crash: {
    label: 'Crash / Aviator / cash game',
    pillar: 'guide-to-crash-games-bangladesh',
    secondaryPillar: 'crash-betting-game-bangladesh-safe-guide',
    regex: /crash|aviator|cash-game|cash-or-crash|zeppelin|mines|auto-cashout|cashout|predictor|signal/i
  },
  casino: {
    label: 'Online casino games',
    pillar: 'ultimate-guide-to-online-casino-games-bangladesh',
    regex: /casino|slot|slots|roulette|blackjack|baccarat|sic-bo|teen-patti|andar-bahar|dragon-tiger|live-casino|crazy-time|monopoly|mega-ball|sweet-bonanza|game|games|provider|rtp|volatility|free-spin|bonus-buy/i
  },
  bonus: {
    label: 'Bonus, wagering ও promotions',
    pillar: 'understanding-wagering-requirements',
    secondaryPillar: 'best-betting-bonus-bangladesh-world-cup-2026',
    regex: /bonus|wagering|turnover|promotion|promo|cashback|rebate|vip|free-bonus|welcome|no-deposit|birthday|eid|durga|puja|referral/i
  },
  bettingSites: {
    label: 'Betting sites, comparisons ও trust lists',
    pillar: 'all-trusted-betting-sites-bangladesh-2026-list',
    regex: /betting-sites|betting-site|trusted|comparison|compare|vs-|top-10|best-betting|best-online|review|list|sera|low-deposit/i
  },
  responsible: {
    label: 'Responsible gambling support',
    pillar: 'guide-to-responsible-gaming-bangladesh',
    regex: /responsible|bankroll|budget|stop-loss|chasing-losses|psychology|tilt|self-exclusion|limit/i
  }
};

function stripManagedSection(content) {
  const pattern = new RegExp(`\\n?${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}\\n?`, 'g');
  return content.replace(pattern, '\n').replace(/\n{4,}/g, '\n\n\n');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugToTitle(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map(part => part.length <= 3 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function parseTitle(content, slug) {
  const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  if (titleMatch) return titleMatch[1].trim().replace(/^['"]|['"]$/g, '');
  return slugToTitle(slug);
}

function parseTags(content) {
  const inline = content.match(/^tags:\s*\[(.*?)\]\s*$/m);
  if (inline) return inline[1].split(',').map(tag => tag.replace(/["'\s]/g, '').trim()).filter(Boolean);
  return [];
}

function parseDate(content) {
  const match = content.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m);
  return match ? match[1] : '';
}

function extractLinks(content) {
  const links = new Set();
  const markdownRe = /\]\(\/blog\/([^/)#]+)\/?(?:#[^)]+)?\)/g;
  const htmlRe = /href=["']\/blog\/([^/"'#]+)\/?(?:#[^"']*)?["']/g;
  let match;
  while ((match = markdownRe.exec(content))) links.add(match[1]);
  while ((match = htmlRe.exec(content))) links.add(match[1]);
  return links;
}

function classifyArticle(article) {
  const haystack = `${article.slug} ${article.title} ${article.tags.join(' ')}`;
  const hits = [];
  for (const [id, cluster] of Object.entries(clusters)) {
    if (cluster.regex.test(haystack)) hits.push(id);
  }

  // More specific clusters should override broad app/casino matches.
  const priority = ['football', 'cricket', 'payments', 'safety', 'crash', 'bonus', 'bettingSites', 'responsible', 'casino', 'app'];
  return priority.find(id => hits.includes(id)) || 'app';
}

function loadArticles() {
  const files = fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.md')).sort();
  return files.map(file => {
    const slug = file.replace(/\.md$/, '');
    const filePath = path.join(BLOG_DIR, file);
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const content = stripManagedSection(originalContent);
    const title = parseTitle(content, slug);
    const tags = parseTags(content);
    const date = parseDate(content);
    const outgoing = extractLinks(content);
    return { slug, filePath, originalContent, content, title, tags, date, outgoing, cluster: null };
  });
}

function buildIncoming(articles) {
  const existing = new Set(articles.map(article => article.slug));
  const incoming = new Map(articles.map(article => [article.slug, 0]));
  const inboundSources = new Map(articles.map(article => [article.slug, new Set()]));

  for (const article of articles) {
    for (const target of article.outgoing) {
      if (!existing.has(target) || target === article.slug) continue;
      incoming.set(target, (incoming.get(target) || 0) + 1);
      inboundSources.get(target).add(article.slug);
    }
  }

  return { incoming, inboundSources };
}

function addLink(additions, source, target, reason) {
  if (!target || target.slug === source.slug) return false;
  if (source.outgoing.has(target.slug)) return false;
  if (additions[source.slug].some(item => item.slug === target.slug)) return false;
  additions[source.slug].push({ slug: target.slug, title: target.title, cluster: target.cluster, reason });
  source.outgoing.add(target.slug);
  return true;
}

function buildLinkPlan(articles) {
  const bySlug = new Map(articles.map(article => [article.slug, article]));
  const byCluster = new Map();
  for (const article of articles) {
    article.cluster = classifyArticle(article);
    if (!byCluster.has(article.cluster)) byCluster.set(article.cluster, []);
    byCluster.get(article.cluster).push(article);
  }

  const before = buildIncoming(articles);
  const simulatedIncoming = new Map(before.incoming);
  const additions = Object.fromEntries(articles.map(article => [article.slug, []]));

  function bump(slug) {
    simulatedIncoming.set(slug, (simulatedIncoming.get(slug) || 0) + 1);
  }

  function candidateSort(source) {
    return (a, b) => {
      const aIncoming = simulatedIncoming.get(a.slug) || 0;
      const bIncoming = simulatedIncoming.get(b.slug) || 0;
      const aBacklinkCycle = a.outgoing.has(source.slug) ? 1 : 0;
      const bBacklinkCycle = b.outgoing.has(source.slug) ? 1 : 0;
      return aIncoming - bIncoming || aBacklinkCycle - bBacklinkCycle || b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);
    };
  }

  const sources = [...articles].sort((a, b) => a.outgoing.size - b.outgoing.size || a.slug.localeCompare(b.slug));

  for (const source of sources) {
    const cluster = clusters[source.cluster];
    const maxLinks = Object.values(clusters).some(item => item.pillar === source.slug) ? MAX_PILLAR_LINKS : MAX_STANDARD_LINKS;

    const pillar = cluster && bySlug.get(cluster.pillar);
    if (pillar && addLink(additions, source, pillar, 'pillar')) bump(pillar.slug);

    const secondary = cluster && cluster.secondaryPillar && bySlug.get(cluster.secondaryPillar);
    if (secondary && additions[source.slug].length < maxLinks && addLink(additions, source, secondary, 'secondary-pillar')) bump(secondary.slug);

    const sameCluster = (byCluster.get(source.cluster) || [])
      .filter(target => target.slug !== source.slug)
      .sort(candidateSort(source));

    for (const target of sameCluster) {
      if (additions[source.slug].length >= maxLinks) break;
      if (addLink(additions, source, target, 'same-cluster-low-incoming')) bump(target.slug);
    }
  }

  // Second pass: force remaining orphan pages to receive at least one contextual link.
  for (const target of articles.sort((a, b) => (simulatedIncoming.get(a.slug) || 0) - (simulatedIncoming.get(b.slug) || 0) || a.slug.localeCompare(b.slug))) {
    if ((simulatedIncoming.get(target.slug) || 0) > 0) continue;
    const sourcePool = [
      ...(byCluster.get(target.cluster) || []),
      ...articles
    ].filter(source => source.slug !== target.slug);

    const source = sourcePool
      .filter(source => !source.outgoing.has(target.slug))
      .sort((a, b) => additions[a.slug].length - additions[b.slug].length || a.outgoing.size - b.outgoing.size || a.slug.localeCompare(b.slug))[0];

    if (source && addLink(additions, source, target, 'orphan-rescue')) bump(target.slug);
  }

  const afterIncoming = simulatedIncoming;
  return { additions, before, afterIncoming, bySlug, byCluster };
}

function renderManagedBlock(article, additions) {
  const links = additions[article.slug];
  if (!links.length) return '';

  const lines = [
    START_MARKER,
    '## আরও পড়ুন: related guide',
    '',
    'এই topic-এর সাথে সম্পর্কিত আরও কিছু guide নিচে দেওয়া হলো, যাতে আপনি একই cluster-এর pillar page, checklist এবং practical next step দ্রুত খুঁজে নিতে পারেন।',
    ''
  ];

  for (const link of links) {
    const clusterLabel = clusters[link.cluster]?.label || 'related topic';
    const reasonText = link.reason === 'pillar'
      ? `${clusterLabel} pillar context।`
      : link.reason === 'orphan-rescue'
        ? `${clusterLabel} cluster-এর কম-linked guide।`
        : `${clusterLabel} সম্পর্কিত practical checklist।`;
    lines.push(`- [${link.title}](/blog/${link.slug}/) — ${reasonText}`);
  }

  lines.push('', END_MARKER, '');
  return lines.join('\n');
}

function applyPlan(articles, additions) {
  let modified = 0;
  for (const article of articles) {
    const block = renderManagedBlock(article, additions);
    if (!block) continue;
    const nextContent = `${article.content.trimEnd()}\n\n${block}`;
    if (nextContent !== article.originalContent) {
      fs.writeFileSync(article.filePath, `${nextContent.trimEnd()}\n`, 'utf8');
      modified += 1;
    }
  }
  return modified;
}

function validateLinks(articles, additions) {
  const slugs = new Set(articles.map(article => article.slug));
  const broken = [];
  for (const [source, links] of Object.entries(additions)) {
    for (const link of links) {
      if (!slugs.has(link.slug)) broken.push({ source, target: link.slug });
    }
  }
  return broken;
}

function report(articles, plan, modifiedCount) {
  const beforeOrphans = articles.filter(article => (plan.before.incoming.get(article.slug) || 0) === 0);
  const afterOrphans = articles.filter(article => (plan.afterIncoming.get(article.slug) || 0) === 0);
  const rowsByCluster = {};
  let totalAdded = 0;

  for (const article of articles) {
    const id = article.cluster;
    rowsByCluster[id] = rowsByCluster[id] || {
      label: clusters[id]?.label || id,
      articles: 0,
      beforeOrphans: 0,
      afterOrphans: 0,
      addedLinks: 0
    };
    rowsByCluster[id].articles += 1;
    if ((plan.before.incoming.get(article.slug) || 0) === 0) rowsByCluster[id].beforeOrphans += 1;
    if ((plan.afterIncoming.get(article.slug) || 0) === 0) rowsByCluster[id].afterOrphans += 1;
    const added = plan.additions[article.slug].length;
    rowsByCluster[id].addedLinks += added;
    totalAdded += added;
  }

  const topTargets = [...articles]
    .map(article => ({
      slug: article.slug,
      title: article.title,
      before: plan.before.incoming.get(article.slug) || 0,
      after: plan.afterIncoming.get(article.slug) || 0,
      gained: (plan.afterIncoming.get(article.slug) || 0) - (plan.before.incoming.get(article.slug) || 0),
      cluster: article.cluster
    }))
    .sort((a, b) => b.gained - a.gained || a.before - b.before || a.slug.localeCompare(b.slug))
    .slice(0, 40);

  const lines = [];
  lines.push('# Internal Linking FULLMODE Report — 2026-05');
  lines.push('');
  lines.push(`Mode: ${APPLY ? 'applied' : 'dry-run'}`);
  lines.push(`Articles scanned: ${articles.length}`);
  lines.push(`Articles modified: ${modifiedCount}`);
  lines.push(`Internal links added/planned: ${totalAdded}`);
  lines.push(`Orphan pages before: ${beforeOrphans.length}`);
  lines.push(`Orphan pages after: ${afterOrphans.length}`);
  lines.push('');
  lines.push('## Strategy');
  lines.push('');
  lines.push('- Applied the Pillar-Cluster model from `_sop/internal-linking-optimization-sop.md`.');
  lines.push('- Added managed `আরও পড়ুন: related guide` blocks without changing `lastUpdated`.');
  lines.push('- Prioritized pillar links, same-cluster low-incoming targets, then orphan rescue links.');
  lines.push('- Generated links use standard `/blog/<slug>/` internal URL format.');
  lines.push('');
  lines.push('## Cluster Summary');
  lines.push('');
  lines.push('| Cluster | Articles | Orphans before | Orphans after | Links added | Pillar |');
  lines.push('|---|---:|---:|---:|---:|---|');
  for (const [id, item] of Object.entries(rowsByCluster).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`| ${item.label} | ${item.articles} | ${item.beforeOrphans} | ${item.afterOrphans} | ${item.addedLinks} | ${clusters[id]?.pillar || ''} |`);
  }
  lines.push('');
  lines.push('## Top Link Equity Gains');
  lines.push('');
  lines.push('| Gained | Before | After | Cluster | Slug | Title |');
  lines.push('|---:|---:|---:|---|---|---|');
  for (const row of topTargets) {
    lines.push(`| ${row.gained} | ${row.before} | ${row.after} | ${clusters[row.cluster]?.label || row.cluster} | ${row.slug} | ${row.title.replace(/\|/g, '\\|')} |`);
  }
  lines.push('');
  lines.push('## Remaining Orphans');
  lines.push('');
  if (afterOrphans.length === 0) {
    lines.push('None.');
  } else {
    for (const article of afterOrphans) lines.push(`- ${article.slug} — ${article.title}`);
  }
  lines.push('');

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${lines.join('\n')}\n`, 'utf8');

  return {
    articles: articles.length,
    modifiedCount,
    totalAdded,
    beforeOrphans: beforeOrphans.length,
    afterOrphans: afterOrphans.length,
    reportFile: path.relative(ROOT_DIR, REPORT_FILE)
  };
}

function main() {
  const articles = loadArticles();
  for (const article of articles) article.cluster = classifyArticle(article);
  const plan = buildLinkPlan(articles);
  const broken = validateLinks(articles, plan.additions);
  if (broken.length) {
    console.error(JSON.stringify({ broken: broken.slice(0, 20), count: broken.length }, null, 2));
    process.exit(1);
  }

  const modifiedCount = APPLY ? applyPlan(articles, plan.additions) : 0;
  const summary = report(articles, plan, modifiedCount);
  console.log(JSON.stringify(summary, null, 2));
}

main();
