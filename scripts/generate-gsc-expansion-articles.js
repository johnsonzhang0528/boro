const fs = require('fs');
const path = require('path');
const { buildPremiumImagePrompt } = require('./premium-image-prompts');

const ROOT_DIR = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'blog');
const PUBLISHING_DIR = path.join(ROOT_DIR, 'data', 'publishing');
const TODAY = '2026-05-03';
const START_DATE = '2026-05-04';
const BATCH_ID = 'gsc-expansion-2026-05';
const PROMPTS_FILE = path.join(PUBLISHING_DIR, `${BATCH_ID}-prompts.json`);
const MANIFEST_FILE = path.join(PUBLISHING_DIR, `${BATCH_ID}-manifest.json`);
const PLAN_FILE = path.join(PUBLISHING_DIR, `${BATCH_ID}-plan.json`);
const SCHEDULE_FILE = path.join(PUBLISHING_DIR, `${BATCH_ID}-schedule.json`);

const keywordOpportunityBuckets = [
  {
    bucket: 'cricket-app-download',
    reason: 'GSC shows many cricket betting app / APK queries around positions 6-12 with meaningful impressions but low CTR; these are realistic near-term gains.',
    examples: ['cricket betting app', 'cricket betting apps', 'cricket betting app download', 'cricket betting apps in bangladesh', 'best cricket betting app']
  },
  {
    bucket: 'world-cup-football-2026',
    reason: 'FIFA World Cup 2026 starts within six weeks, creating a short but very large football betting demand window.',
    examples: ['world cup betting', 'football betting app', 'over under goals', 'correct score', 'bet builder']
  },
  {
    bucket: 'crash-aviator-crazy-time',
    reason: 'Crash, Aviator, Crazy Time and Funky Time queries have positions around 6-14 plus repeated Bengali intent; better topical depth can capture long-tail traffic.',
    examples: ['crash game tricks', 'aviator game tips and tricks', 'crazy time জেতার কৌশল', 'funky time strategy']
  },
  {
    bucket: 'casino-list-legal-bkash',
    reason: 'Casino list, legal, bKash/Nagad and low-deposit keywords show low clicks with broad impressions; these support commercial discovery traffic.',
    examples: ['legal online casino bangladesh', 'online casino games list', 'casino games list with pictures', 'casino bkash', '৫০ টাকা ডিপোজিট সাইট']
  },
  {
    bucket: 'betting-app-general',
    reason: 'Best betting app / sports betting app queries rank around page one to page two; focused comparison and install guides can lift CTR.',
    examples: ['best betting apps in bangladesh', 'best sports betting app', 'betting apps android', 'bd betting app download']
  },
  {
    bucket: 'bonus-terms-trust',
    reason: 'Wagering, rebate, legality and fake app trust queries help monetization and E-E-A-T while supporting conversion pages.',
    examples: ['wagering requirements meaning', 'daily betting rebate', 'is online gambling legal in bangladesh', 'fake betting apps']
  }
];

const eventCalendar = [
  {
    window: '2026-05-04 to 2026-05-25',
    focus: 'Cricket app/APK, IPL closing stretch, Champions League final prep, Eid al-Adha payment and bonus readiness',
    schedulingAction: 'Put app download, cricket app, UCL, payment and high-conversion comparison content first.'
  },
  {
    window: '2026-05-26 to 2026-06-10',
    focus: 'FIFA World Cup 2026 pre-tournament research and team/market preparation',
    schedulingAction: 'Publish World Cup evergreen explainers before the opening match.'
  },
  {
    window: '2026-06-11 to 2026-07-19',
    focus: 'FIFA World Cup 2026 live traffic window',
    schedulingAction: 'Keep World Cup, live football and high-intent football betting articles active through group and knockout stages.'
  },
  {
    window: '2026-07-20 to 2026-08-15',
    focus: 'Post-World-Cup evergreen capture, crash games, casino lists, app install and payment topics',
    schedulingAction: 'Move crash/casino/app evergreen terms after the football peak so rankings can build into Q3.'
  },
  {
    window: '2026-08-16 to 2026-09-15',
    focus: 'EPL/La Liga 2026-27 season start and Asia Cup cricket preparation',
    schedulingAction: 'Place football season previews and cricket tournament preparation content before late-August and September demand.'
  },
  {
    window: '2026-09-16 to 2026-11-03',
    focus: 'Asia Cup cricket, Durga Puja seasonal promotions, casino evergreen and bonus education',
    schedulingAction: 'Reserve remaining evergreen casino, bonus and trust pieces for sustained non-event traffic.'
  }
];

const clusterLinks = {
  cricketApp: [
    { title: 'Ultimate Guide to Cricket Betting in Bangladesh', url: '/blog/ultimate-guide-to-cricket-betting-in-bangladesh/' },
    { title: 'Best Cricket Betting Apps Bangladesh 2026', url: '/blog/best-cricket-betting-apps-bangladesh-2026/' },
    { title: 'Live Cricket Betting Tips Strategy', url: '/blog/live-cricket-betting-tips-strategy/' }
  ],
  worldCup: [
    { title: 'Football Betting Guide Bangladesh', url: '/blog/football-betting-guide-bangladesh/' },
    { title: 'Football Over Under Betting Guide', url: '/blog/football-over-under-betting-guide/' },
    { title: 'FIFA 2026 Qualifiers Analysis', url: '/blog/fifa-2026-qualifiers-analysis/' }
  ],
  crash: [
    { title: 'Guide to Crash Games Bangladesh', url: '/blog/guide-to-crash-games-bangladesh/' },
    { title: 'Aviator Cashout Myths Explained', url: '/blog/aviator-cashout-myths-rtp-volatility-explained/' },
    { title: 'Auto Cashout Mastery Crash Games', url: '/blog/auto-cashout-mastery-crash-games/' }
  ],
  casino: [
    { title: 'Ultimate Guide to Online Casino Games Bangladesh', url: '/blog/ultimate-guide-to-online-casino-games-bangladesh/' },
    { title: 'Online Casino Terminology Guide', url: '/blog/online-casino-terminology-guide/' },
    { title: 'How to Identify Fake Casino Sites Bangladesh', url: '/blog/how-to-identify-fake-casino-sites-bangladesh/' }
  ],
  bettingApp: [
    { title: 'BoroJeet App Download Install Guide', url: '/blog/borojeet-app-download-install-guide/' },
    { title: 'Beginner Guide to BoroJeet', url: '/blog/beginners-guide-to-borojeet/' },
    { title: 'Boro Jeet Registration Guide 2026', url: '/blog/boro-jeet-registration-guide-2026/' }
  ],
  bonusTrust: [
    { title: 'Understanding Wagering Requirements', url: '/blog/understanding-wagering-requirements/' },
    { title: 'BoroJeet Daily Bonus Guide', url: '/blog/borojeet-daily-bonus-guide-claim-free-200-bdt/' },
    { title: 'Guide to Responsible Gaming Bangladesh', url: '/blog/guide-to-responsible-gaming-bangladesh/' }
  ],
  payments: [
    { title: 'Online Casino Payments Bangladesh', url: '/blog/ultimate-guide-to-online-casino-payments-bangladesh/' },
    { title: 'bKash Deposit Guide', url: '/blog/bkash-limit-casino-deposit-guide/' },
    { title: 'Nagad vs bKash Casino Deposits', url: '/blog/nagad-vs-bkash-casino-deposits/' }
  ]
};

const clusterTags = {
  cricketApp: ['cricket', 'apps', 'apk', 'guide'],
  worldCup: ['football', 'world-cup', 'guide', 'strategy'],
  crash: ['crash-games', 'aviator', 'strategy', 'guide'],
  casino: ['casino', 'online-casino', 'guide'],
  bettingApp: ['betting-apps', 'android', 'guide'],
  bonusTrust: ['bonus', 'trust', 'guide'],
  payments: ['payments', 'bkash', 'nagad', 'guide']
};

function t(slug, title, cluster, primaryKeyword, metrics, angle, extraTags = []) {
  return {
    slug,
    title,
    cluster,
    primaryKeyword,
    metrics,
    angle,
    tags: [...new Set([...(clusterTags[cluster] || ['guide']), ...extraTags])]
  };
}

const topics = [
  t('cricket-betting-app-download-bd-android-2026', 'Cricket Betting App Download BD Android 2026: নিরাপদ APK গাইড', 'cricketApp', 'cricket betting app download', { impressions: 33, rank: 10.67 }, 'High-intent app download query with page-one/page-two ranking potential.', ['android']),
  t('cricket-betting-app-apk-bangladesh-safe-install', 'Cricket Betting App APK Bangladesh: safe install করার checklist', 'cricketApp', 'cricket betting app apk', { impressions: 6, rank: 8.17 }, 'APK install safety and trust angle for Android users.', ['security']),
  t('best-cricket-betting-app-for-android-bangladesh', 'Best Cricket Betting App for Android Bangladesh: কোন app ব্যবহার করবেন?', 'cricketApp', 'best cricket betting app', { impressions: 33, rank: 10.3 }, 'Commercial comparison for Android cricket bettors.', ['android', 'comparison']),
  t('cricket-betting-app-with-bkash-nagad-bd', 'Cricket Betting App with bKash Nagad BD: deposit-friendly app guide', 'cricketApp', 'cricket betting app bd', { impressions: 31, rank: 9.13 }, 'Connect cricket app intent with local payment methods.', ['bkash', 'nagad']),
  t('cricket-betting-app-for-pc-bangladesh-browser', 'Cricket Betting App for PC Bangladesh: browser দিয়ে কীভাবে খেলবেন?', 'cricketApp', 'cricket betting app for pc', { impressions: 28, rank: 7.64 }, 'PC/browser variant with lower competition.', ['pc', 'browser']),
  t('online-cricket-betting-app-download-guide', 'Online Cricket Betting App Download Guide: Bangladesh user checklist', 'cricketApp', 'online cricket betting app download', { impressions: 1, rank: 10 }, 'Long-tail app download tutorial.', ['download']),
  t('cricket-betting-apps-real-money-bangladesh', 'Cricket Betting Apps Real Money Bangladesh: safe play ও payment guide', 'cricketApp', 'cricket betting apps real money', { impressions: 33, rank: 9.7 }, 'Real-money intent with trust and responsible gambling.', ['real-money']),
  t('cricket-betting-app-for-ios-bangladesh', 'Cricket Betting App for iOS Bangladesh: iPhone user-দের জন্য guide', 'cricketApp', 'cricket betting apps for ios', { impressions: 3, rank: 10.33 }, 'iOS long-tail not covered deeply by Android-heavy content.', ['ios']),
  t('top-cricket-betting-apps-bangladesh-comparison', 'Top Cricket Betting Apps Bangladesh: speed, odds ও payment comparison', 'cricketApp', 'top cricket betting apps', { impressions: 11, rank: 9.18 }, 'Top-list intent with comparison framing.', ['comparison', 'top-list']),
  t('no-1-cricket-betting-app-bd', 'No 1 Cricket Betting App BD: কোন criteria দিয়ে সেরা app বাছবেন?', 'cricketApp', 'no 1 cricket betting app', { impressions: 8, rank: 10.38 }, 'Best/no.1 query with criteria-based answer.', ['best-app']),
  t('safest-cricket-betting-app-bangladesh', 'Safest Cricket Betting App Bangladesh: security signals কী দেখবেন?', 'cricketApp', 'safest cricket betting app', { impressions: 1, rank: 11 }, 'Safety/E-E-A-T support topic.', ['security']),
  t('low-data-cricket-betting-app-bangladesh', 'Low Data Cricket Betting App Bangladesh: slow internet-এ smooth betting', 'cricketApp', 'cricket betting software for android', { impressions: 21, rank: 6.76 }, 'Performance and low data angle for mobile users.', ['performance']),
  t('cricket-session-betting-app-bd-guide', 'Cricket Session Betting App BD: session market mobile guide', 'cricketApp', 'cricket session betting app', { impressions: 2, rank: 9 }, 'Session betting long-tail with app context.', ['session-betting']),
  t('live-cricket-betting-app-bangladesh-2026', 'Live Cricket Betting App Bangladesh 2026: in-play market guide', 'cricketApp', 'online cricket betting app', { impressions: 47, rank: 8.98 }, 'Live cricket betting app demand.', ['live-betting']),
  t('cricket-betting-tips-app-bd-guide', 'Cricket Betting Tips App BD: কোন data দেখে mobile bet নেবেন?', 'cricketApp', 'cricket betting tips app', { impressions: 3, rank: 9.33 }, 'Tips app query, converted into decision framework.', ['tips']),

  t('fifa-world-cup-2026-betting-guide-bangladesh', 'FIFA World Cup 2026 Betting Guide Bangladesh: match market plan', 'worldCup', 'world cup betting guide', { impressions: 0, rank: null }, 'Upcoming mega-event topic; publish before tournament.', ['fifa']),
  t('world-cup-2026-betting-app-bd', 'World Cup 2026 Betting App BD: football match bet করার setup', 'worldCup', 'football betting app world cup', { impressions: 0, rank: null }, 'Combine World Cup demand with app install intent.', ['apps']),
  t('world-cup-2026-match-winner-market-guide', 'World Cup 2026 Match Winner Market Guide: 1X2 odds বোঝার নিয়ম', 'worldCup', 'match winner betting', { impressions: 0, rank: null }, 'Core football market for new World Cup bettors.', ['match-winner']),
  t('world-cup-2026-group-stage-betting-strategy', 'World Cup 2026 Group Stage Betting Strategy: early matches কীভাবে পড়বেন', 'worldCup', 'world cup group stage betting', { impressions: 0, rank: null }, 'Group-stage tactical evergreen.', ['group-stage']),
  t('world-cup-2026-top-goalscorer-betting-guide', 'World Cup 2026 Top Goalscorer Betting Guide: outright market explained', 'worldCup', 'world cup top goalscorer betting', { impressions: 0, rank: null }, 'Outright traffic before and during tournament.', ['goalscorer']),
  t('world-cup-2026-over-under-goals-guide', 'World Cup 2026 Over/Under Goals Guide: totals market কীভাবে ধরবেন', 'worldCup', 'world cup over under goals', { impressions: 0, rank: null }, 'Over/under cluster support.', ['over-under']),
  t('world-cup-2026-btts-betting-guide', 'World Cup 2026 BTTS Betting Guide: both teams to score market', 'worldCup', 'world cup btts betting', { impressions: 0, rank: null }, 'BTTS-specific long-tail.', ['btts']),
  t('world-cup-2026-correct-score-betting-guide', 'World Cup 2026 Correct Score Betting Guide: high odds risk control', 'worldCup', 'correct score betting', { impressions: 0, rank: null }, 'High-odds football intent aligned to existing GSC high-odds cluster.', ['score-market']),
  t('world-cup-2026-argentina-brazil-betting-bd', 'Argentina Brazil World Cup 2026 Betting BD: fan bias avoid করার guide', 'worldCup', 'argentina brazil betting', { impressions: 0, rank: null }, 'Bangladesh football fan demand for Argentina/Brazil.', ['argentina', 'brazil']),
  t('world-cup-2026-england-france-betting-preview', 'England France World Cup 2026 Betting Preview: odds, squad ও market', 'worldCup', 'england france betting', { impressions: 0, rank: null }, 'High-profile national-team long-tail.', ['england', 'france']),
  t('fifa-world-cup-live-betting-tips-bangladesh', 'FIFA World Cup Live Betting Tips Bangladesh: in-play football checklist', 'worldCup', 'live football betting tips', { impressions: 4, rank: 87 }, 'Live football queries need pre-tournament pages.', ['live-betting']),
  t('world-cup-2026-betting-bonuses-bd', 'World Cup 2026 Betting Bonuses BD: bonus claim করার আগে terms দেখুন', 'worldCup', 'world cup betting bonus', { impressions: 0, rank: null }, 'Bonus/event commercial bridge.', ['bonus']),
  t('world-cup-2026-odds-explained-bangla', 'World Cup 2026 Odds Explained Bangla: decimal odds সহজ ভাষায়', 'worldCup', 'football odds explained', { impressions: 0, rank: null }, 'Beginner education before event.', ['odds']),
  t('world-cup-2026-bet-builder-guide', 'World Cup 2026 Bet Builder Guide: same match combo কীভাবে করবেন', 'worldCup', 'world cup bet builder', { impressions: 0, rank: null }, 'Bet builder long-tail.', ['bet-builder']),
  t('world-cup-2026-quarter-final-betting-strategy', 'World Cup 2026 Quarter Final Betting Strategy: knockout match plan', 'worldCup', 'world cup quarter final betting', { impressions: 0, rank: null }, 'Knockout-stage evergreen planned before event.', ['knockout']),
  t('champions-league-final-2026-betting-guide-bd', 'Champions League Final 2026 Betting Guide BD: May final market checklist', 'worldCup', 'champions league final betting', { impressions: 0, rank: null }, 'Near-term May football final traffic.', ['champions-league']),
  t('europa-final-2026-betting-market-guide', 'Europa Final 2026 Betting Market Guide: totals, corners ও cards', 'worldCup', 'europa final betting', { impressions: 0, rank: null }, 'European finals May traffic.', ['europa']),
  t('epl-2026-27-season-betting-preview-bd', 'EPL 2026/27 Season Betting Preview BD: August আগে কী প্রস্তুতি নেবেন', 'worldCup', 'epl betting preview', { impressions: 0, rank: null }, 'August football season start preparation.', ['epl']),
  t('la-liga-2026-27-betting-preview-bd', 'La Liga 2026/27 Betting Preview BD: Barcelona Real Madrid market guide', 'worldCup', 'la liga betting guide', { impressions: 0, rank: null }, 'August European football demand.', ['la-liga']),
  t('football-betting-app-bangladesh-world-cup', 'Football Betting App Bangladesh World Cup: mobile setup ও safety guide', 'worldCup', 'football betting app bangladesh', { impressions: 0, rank: null }, 'Football event + app commercial bridge.', ['apps']),

  t('crash-game-bangladesh-real-money-guide', 'Crash Game Bangladesh Real Money Guide: safe cashout ও bankroll plan', 'crash', 'crash game bangladesh', { impressions: 36, rank: 33.53 }, 'High impression but low ranking crash keyword.', ['real-money']),
  t('crash-game-winning-tricks-bangla', 'Crash Game Winning Tricks Bangla: কোন trick আসলে কাজ করে?', 'crash', 'crash game winning trick', { impressions: 15, rank: 9.73 }, 'Tricks query with myth-busting responsible framing.', ['tricks']),
  t('crash-game-pattern-myths-explained', 'Crash Game Pattern Myths Explained: pattern দেখে prediction করা যায়?', 'crash', 'crash game pattern', { impressions: 7, rank: 5.57 }, 'Pattern intent with scam prevention.', ['myths']),
  t('crash-game-app-bd-guide', 'Crash Game App BD Guide: mobile-এ crash game খেলার নিয়ম', 'crash', 'crash game app', { impressions: 21, rank: 4.81 }, 'App-focused crash query.', ['apps']),
  t('crash-game-signal-scam-alert-bangladesh', 'Crash Game Signal Scam Alert Bangladesh: paid signal কেন risky', 'crash', 'crash game signal', { impressions: 3, rank: 6.67 }, 'Trust/safety support topic.', ['scam-alert']),
  t('crash-game-strategy-for-beginners-bd', 'Crash Game Strategy for Beginners BD: 1.5x, 2x ও stop-loss plan', 'crash', 'crash game strategy', { impressions: 1, rank: 11 }, 'Beginner strategy cluster.', ['beginner']),
  t('aviator-game-tips-and-tricks-bangla', 'Aviator Game Tips and Tricks Bangla: auto cashout কীভাবে set করবেন', 'crash', 'aviator game tips and tricks', { impressions: 19, rank: 9.05 }, 'Aviator high-intent tips.', ['aviator']),
  t('aviator-game-winning-strategy-bd', 'Aviator Game Winning Strategy BD: realistic strategy বনাম myth', 'crash', 'aviator game winning strategy', { impressions: 4, rank: 9.5 }, 'Winning strategy query, responsibly framed.', ['aviator']),
  t('aviator-crash-game-tricks-explained', 'Aviator Crash Game Tricks Explained: cashout timing guide', 'crash', 'aviator crash game tricks', { impressions: 2, rank: 5 }, 'Aviator crash trick long-tail.', ['aviator']),
  t('aviator-game-how-to-play-bangladesh', 'Aviator Game How to Play Bangladesh: beginner rule guide', 'crash', 'aviator game how to play', { impressions: 3, rank: 4.67 }, 'How-to query with good ranking potential.', ['aviator', 'how-to']),
  t('aviator-game-predictor-scam-bd', 'Aviator Game Predictor Scam BD: predictor app সত্যি নাকি ফাঁদ?', 'crash', 'aviator predictor app', { impressions: 0, rank: null }, 'Protect users and support Aviator cluster.', ['aviator', 'scam-alert']),
  t('aviator-auto-cashout-settings-guide', 'Aviator Auto Cashout Settings Guide: low-risk multiplier plan', 'crash', 'aviator auto cashout', { impressions: 0, rank: null }, 'Actionable auto cashout support content.', ['aviator', 'auto-cashout']),
  t('plane-crash-betting-game-guide-bd', 'Plane Crash Betting Game Guide BD: plane game কীভাবে কাজ করে?', 'crash', 'plane crash betting game', { impressions: 4, rank: 7.5 }, 'Plane crash game query cluster.', ['plane-game']),
  t('lucky-jet-crash-game-guide-bangladesh', 'Lucky Jet Crash Game Guide Bangladesh: Aviator alternative explained', 'crash', 'lucky jet crash game', { impressions: 9, rank: 7 }, 'Alternative crash game query.', ['lucky-jet']),
  t('megapari-crash-game-alternatives-bd', 'Megapari Crash Game Alternatives BD: safe comparison checklist', 'crash', 'megapari crash game', { impressions: 7, rank: 6.29 }, 'Competitor/alternative query capture.', ['comparison']),
  t('funky-time-strategy-bangla', 'Funky Time Strategy Bangla: bonus rounds ও bet sizing guide', 'crash', 'strategy funky time', { impressions: 10, rank: 8.6 }, 'Funky Time strategy query.', ['funky-time']),
  t('funky-time-rules-bangladesh', 'Funky Time Rules Bangladesh: multiplier, bonus ও payout explained', 'crash', 'funky time rules', { impressions: 1, rank: 11 }, 'Rules query for game-show cluster.', ['funky-time']),
  t('crazy-time-khelar-niyom-bangla', 'Crazy Time খেলার নিয়ম Bangla: bonus wheel সহজ guide', 'crash', 'crazy time খেলার নিয়ম', { impressions: 113, rank: 10.38 }, 'Bengali Crazy Time rules with high impressions.', ['crazy-time']),
  t('crazy-time-jetar-koushol-bangla', 'Crazy Time জেতার কৌশল Bangla: risk control ও bonus round plan', 'crash', 'crazy time জেতার কৌশল', { impressions: 37, rank: 8.16 }, 'Bengali Crazy Time strategy query.', ['crazy-time']),
  t('cash-or-crash-game-bangladesh-guide', 'Cash or Crash Game Bangladesh Guide: collect নাকি cashout?', 'crash', 'cash or crash game', { impressions: 10, rank: 8.2 }, 'Cash or Crash long-tail.', ['cash-or-crash']),

  t('online-casino-games-list-bangladesh', 'Online Casino Games List Bangladesh: popular games এক নজরে', 'casino', 'online casino games list', { impressions: 2, rank: 4 }, 'Game list discovery page.', ['games-list']),
  t('casino-games-list-with-pictures-bd', 'Casino Games List with Pictures BD: slot, table ও live game guide', 'casino', 'casino games list with pictures', { impressions: 1, rank: 5 }, 'Visual list keyword support.', ['games-list']),
  t('casino-game-name-list-bangla', 'Casino Game Name List Bangla: কোন game কীভাবে খেলা হয়?', 'casino', 'casino game name list', { impressions: 5, rank: 1 }, 'Game name list query, currently high ranking but needs landing depth.', ['games-list']),
  t('best-online-casino-games-bangladesh-2026', 'Best Online Casino Games Bangladesh 2026: beginner-friendly picks', 'casino', 'best online casino games in bangladesh', { impressions: 2, rank: 1 }, 'Best casino game list with conversion potential.', ['best-games']),
  t('online-casino-guide-bangladesh-beginners', 'Online Casino Guide Bangladesh Beginners: account, game ও payment basics', 'casino', 'online casino guide', { impressions: 16, rank: 5.62 }, 'Guide query with decent position.', ['beginner']),
  t('online-casino-legit-check-bangladesh', 'Online Casino Legit Check Bangladesh: fake site চিনবেন কীভাবে?', 'casino', 'online casino legit', { impressions: 3, rank: 5.33 }, 'Trust query supporting E-E-A-T.', ['security']),
  t('legal-online-casino-bangladesh-guide', 'Legal Online Casino Bangladesh Guide: আইন, risk ও safety checklist', 'casino', 'legal online casino bangladesh', { impressions: 48, rank: 11.23 }, 'High impression legal keyword near page one.', ['legal']),
  t('online-gambling-in-bangladesh-explained', 'Online Gambling in Bangladesh Explained: কী legal, কী risky?', 'casino', 'online gambling in bangladesh', { impressions: 8, rank: 80.75 }, 'Broad low-rank informational topic.', ['legal']),
  t('casino-bkash-deposit-guide-bangladesh', 'Casino bKash Deposit Guide Bangladesh: step-by-step payment safety', 'payments', 'casino bkash', { impressions: 6, rank: 30 }, 'bKash casino deposit query.', ['casino']),
  t('bkash-casino-sites-bangladesh-guide', 'bKash Casino Sites Bangladesh Guide: deposit করার আগে কী দেখবেন', 'payments', 'bkash casino', { impressions: 2, rank: 30.5 }, 'bKash casino discovery and trust.', ['casino']),
  t('nagad-online-casino-guide-bangladesh', 'Nagad Online Casino Bangladesh Guide: deposit, cashout ও limits', 'payments', 'best nagad online casino', { impressions: 39, rank: 5.03 }, 'Nagad high-potential payment query.', ['casino']),
  t('50-taka-deposit-casino-sites-bd', '৫০ টাকা ডিপোজিট Casino Sites BD: low deposit খেললে কী risk?', 'payments', '৫০ টাকা ডিপোজিট সাইট ইন বাংলাদেশ', { impressions: 6, rank: 72.5 }, 'Bengali low-deposit query with high rank gap.', ['low-deposit']),
  t('low-deposit-betting-sites-bangladesh', 'সর্বনিম্ন ডিপোজিট Betting Sites Bangladesh: ছোট বাজেট guide', 'payments', 'সর্বনিম্ন ডিপোজিট বেটিং সাইট', { impressions: 5, rank: 45.6 }, 'Low-deposit betting intent.', ['low-deposit']),
  t('casino-games-online-real-money-bd', 'Casino Games Online Real Money BD: safe play ও bankroll basics', 'casino', 'casino games online for real money', { impressions: 22, rank: 4 }, 'Real-money casino query.', ['real-money']),
  t('real-cash-online-casino-bangladesh', 'Real Cash Online Casino Bangladesh: withdrawal-ready play guide', 'casino', 'real cash online casino', { impressions: 8, rank: 3 }, 'Real cash intent.', ['real-money']),
  t('online-slots-bangladesh-guide', 'Online Slots Bangladesh Guide: RTP, volatility ও bonus feature', 'casino', 'online slots bangladesh', { impressions: 35, rank: 2.77 }, 'Slots query with good position and zero clicks.', ['slots']),
  t('best-slot-game-in-bangladesh-2026', 'Best Slot Game in Bangladesh 2026: RTP, volatility ও theme comparison', 'casino', 'best slot game in bangladesh', { impressions: 3, rank: 10.33 }, 'Best slot game long-tail.', ['slots']),
  t('which-slot-game-is-easy-to-win-bangla', 'Which Slot Game is Easy to Win? Bangla realistic answer', 'casino', 'which slot game is easy to win', { impressions: 10, rank: 5.9 }, 'Easy-to-win query handled responsibly.', ['slots']),
  t('best-casino-slots-to-play-online-bd', 'Best Casino Slots to Play Online BD: beginner slot selection guide', 'casino', 'best casino slots to play online', { impressions: 5, rank: 2.2 }, 'Casino slots list query.', ['slots']),
  t('slot-game-bangladesh-beginners-guide', 'Slot Game Bangladesh Beginners Guide: reels, paylines ও free spins', 'casino', 'slot game bangladesh', { impressions: 16, rank: 8.31 }, 'Beginner slot keyword with existing impressions.', ['slots', 'beginner']),

  t('best-betting-apps-in-bangladesh-2026', 'Best Betting Apps in Bangladesh 2026: safety, payment ও odds comparison', 'bettingApp', 'best betting apps in bangladesh', { impressions: 13, rank: 69.46 }, 'High-rank-gap best app query.', ['comparison']),
  t('best-betting-app-bangladesh-download', 'Best Betting App Bangladesh Download: Android APK safe setup', 'bettingApp', 'best betting app bangladesh', { impressions: 4, rank: 60 }, 'Download-focused best betting app query.', ['download']),
  t('top-5-betting-apps-bangladesh', 'Top 5 Betting Apps Bangladesh: cricket, football ও casino comparison', 'bettingApp', 'top 5 betting apps', { impressions: 15, rank: 6.87 }, 'Top 5 list with page-one potential.', ['top-list']),
  t('bd-betting-app-download-guide', 'BD Betting App Download Guide: APK install, login ও payment setup', 'bettingApp', 'bd betting app download', { impressions: 2, rank: 67 }, 'BD app download long-tail.', ['download']),
  t('betting-app-apk-bangladesh-safe-install', 'Betting App APK Bangladesh: safe install করার আগে ৭টি checklist', 'bettingApp', 'betting app apk', { impressions: 3, rank: 9 }, 'APK safety commercial query.', ['apk', 'security']),
  t('betting-apps-android-bangladesh', 'Betting Apps Android Bangladesh: lightweight app কীভাবে বাছবেন?', 'bettingApp', 'betting apps android', { impressions: 8, rank: 7.75 }, 'Android betting app query.', ['android']),
  t('safest-betting-app-for-bangladesh', 'Safest Betting App for Bangladesh: license, KYC ও payment signal', 'bettingApp', 'safest betting app', { impressions: 1, rank: 11 }, 'Safety trust query.', ['security']),
  t('best-sports-betting-app-bangladesh-2026', 'Best Sports Betting App Bangladesh 2026: football ও cricket market guide', 'bettingApp', 'best sports betting app', { impressions: 31, rank: 8.19 }, 'Sports app query with decent impressions.', ['sports']),
  t('betting-app-with-bkash-nagad-bd', 'Betting App with bKash Nagad BD: local payment-friendly guide', 'bettingApp', 'betting app bd', { impressions: 12, rank: 8.92 }, 'Betting app + local payments bridge.', ['bkash', 'nagad']),
  t('betting-app-login-problems-fix-bangladesh', 'Betting App Login Problems Fix Bangladesh: OTP, cache ও device issue', 'bettingApp', 'betting app login', { impressions: 0, rank: null }, 'Support/app troubleshooting cluster.', ['login']),
  t('new-betting-apps-2026-bangladesh', 'New Betting Apps 2026 Bangladesh: নতুন app বাছার আগে সতর্কতা', 'bettingApp', 'new betting app 2025', { impressions: 6, rank: 7.17 }, 'New betting app query updated for 2026.', ['new-apps']),
  t('betting-app-bd-low-deposit-guide', 'Betting App BD Low Deposit Guide: ছোট বাজেটে safe start', 'bettingApp', 'bd betting app', { impressions: 10, rank: 9.7 }, 'Low-deposit app angle.', ['low-deposit']),
  t('international-betting-apps-bangladesh-guide', 'International Betting Apps Bangladesh Guide: local payment না থাকলে কী করবেন?', 'bettingApp', 'international betting apps', { impressions: 3, rank: 10.33 }, 'International app query for BD users.', ['international']),
  t('betting-apps-list-bangladesh', 'Betting Apps List Bangladesh: cricket, casino ও football apps একসাথে', 'bettingApp', 'betting apps list', { impressions: 2, rank: 10.5 }, 'List query support.', ['top-list']),
  t('top-betting-sites-cricket-bangladesh', 'Top Betting Sites for Cricket Bangladesh: odds, app ও payment comparison', 'bettingApp', 'top betting sites for cricket', { impressions: 1, rank: 108 }, 'High-rank-gap cricket site query.', ['cricket', 'comparison']),

  t('wagering-requirements-meaning-bangla', 'Wagering Requirements Meaning Bangla: bonus turnover সহজ ব্যাখ্যা', 'bonusTrust', 'wagering requirements meaning', { impressions: 3, rank: 5.67 }, 'Meaning query with conversion support.', ['wagering']),
  t('wagering-requirement-bonus-guide-bd', 'Wagering Requirement Bonus Guide BD: কত turnover লাগবে হিসাব করুন', 'bonusTrust', 'wagering requirement', { impressions: 1, rank: 1 }, 'Bonus education support topic.', ['wagering']),
  t('bonus-turnover-calculation-bangladesh', 'Bonus Turnover Calculation Bangladesh: wagering progress কীভাবে বুঝবেন', 'bonusTrust', 'bonus turnover', { impressions: 0, rank: null }, 'Turnover calculator-style educational topic.', ['turnover']),
  t('daily-betting-rebate-guide-bangladesh', 'Daily Betting Rebate Guide Bangladesh: 5% rebate claim করার আগে জানুন', 'bonusTrust', 'প্রতিদিনের বেটিং রিবেট', { impressions: 40, rank: 9.05 }, 'Bengali rebate query with impressions.', ['rebate']),
  t('free-bonus-without-deposit-bd-guide', 'Free Bonus Without Deposit BD Guide: ফ্রি বোনাসের real terms', 'bonusTrust', 'বিনামূল্যে বোনাস', { impressions: 2, rank: 55 }, 'Free bonus high-risk query with terms framing.', ['free-bonus']),
  t('borojeet-vip-bonus-rules-bangla', 'BoroJeet VIP Bonus Rules Bangla: level, cashback ও withdrawal impact', 'bonusTrust', 'borojeet vip', { impressions: 14, rank: 6.86 }, 'VIP query support.', ['vip']),
  t('online-betting-legal-bangladesh-explained', 'Online Betting Legal Bangladesh Explained: law, risk ও safe behavior', 'bonusTrust', 'is online betting legal in bangladesh', { impressions: 2, rank: 3 }, 'Legal betting query with responsible framing.', ['legal']),
  t('is-online-gambling-legal-in-bangladesh-guide', 'Is Online Gambling Legal in Bangladesh? Practical risk guide', 'bonusTrust', 'is online gambling legal in bangladesh', { impressions: 3, rank: 29.33 }, 'Broad legal gambling query.', ['legal']),
  t('fake-betting-apps-bangladesh-warning', 'Fake Betting Apps Bangladesh Warning: APK scam ও phishing চিনবেন কীভাবে', 'bonusTrust', 'fake betting apps', { impressions: 0, rank: null }, 'Trust/safety and scam prevention topic.', ['security'])
];

function slugToFile(slug) {
  return path.join(BLOG_DIR, `${slug}.md`);
}

function datePlus(startDate, days) {
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function imageNames(slug) {
  return {
    heroFile: `${slug}-hero.webp`,
    heroOptimizedWebp: `${slug}-hero-optimized.webp`,
    heroOptimizedAvif: `${slug}-hero-optimized.avif`,
    detailFile: `${slug}-detail.webp`,
    detailOptimizedWebp: `${slug}-detail-optimized.webp`,
    detailOptimizedAvif: `${slug}-detail-optimized.avif`,
    ogFile: `og-${slug}.webp`,
    ogOptimizedWebp: `og-${slug}-optimized.webp`
  };
}

function escapeFrontmatter(value) {
  return JSON.stringify(value);
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
}

function frontmatterValue(block, key) {
  const match = block.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return match ? match[1].replace(/^"|"$/g, '') : '';
}

function existingArticleMeta(file) {
  const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
  const block = extractFrontmatter(content);
  return {
    file: `blog/${file}`,
    slug: file.replace(/\.md$/, ''),
    title: frontmatterValue(block, 'title') || file.replace(/\.md$/, ''),
    date: frontmatterValue(block, 'date'),
    tags: frontmatterValue(block, 'tags'),
    source: 'existing-unpublished'
  };
}

function label(topic) {
  return topic.title.replace(/[:?].*$/, '').trim();
}

function description(topic) {
  const base = {
    cricketApp: `${topic.primaryKeyword} নিয়ে Bangladesh users-এর জন্য app download, APK safety, bKash/Nagad payment এবং live cricket betting setup explained।`,
    worldCup: `${topic.primaryKeyword} নিয়ে FIFA World Cup 2026-এর আগে Bangladesh bettor-দের জন্য odds, market rules, bankroll এবং live betting checklist।`,
    crash: `${topic.primaryKeyword} নিয়ে Bangla guide: rules, cashout timing, scam warning, bankroll plan এবং realistic crash game strategy।`,
    casino: `${topic.primaryKeyword} নিয়ে Bangladesh-focused guide: game types, legal risk, payment safety, RTP basics এবং responsible play checklist।`,
    bettingApp: `${topic.primaryKeyword} নিয়ে Bangladesh user guide: Android APK, safe login, payment methods, app speed এবং trust signals compare করুন।`,
    bonusTrust: `${topic.primaryKeyword} নিয়ে সহজ Bangla explanation: terms, turnover, legal risk, scam warning এবং responsible gambling checklist।`,
    payments: `${topic.primaryKeyword} নিয়ে local payment guide: bKash/Nagad deposit, limits, screenshot proof, safety এবং support checklist।`
  };
  return base[topic.cluster];
}

function faq(topic) {
  return [
    [`${topic.primaryKeyword} beginners-দের জন্য suitable?`, `হ্যাঁ, তবে আগে rules, payment terms, এবং risk বুঝে নেওয়া জরুরি। এই guide ${topic.primaryKeyword} topic-কে Bangladesh context-এ explain করে।`],
    ['সবচেয়ে বড় mistake কী?', 'Headline bonus, high odds, বা viral trick দেখে blind decision নেওয়া। আগে terms, bankroll, এবং safety signal check করুন।'],
    ['BoroJeet ব্যবহার করলে কীভাবে শুরু করব?', 'Bonus tracking ঠিক রাখতে আগে website-এ register করুন, তারপর app বা mobile browser ব্যবহার করুন।']
  ];
}

function howto(topic) {
  return [
    ['Search intent বুঝুন', `${topic.primaryKeyword} query-র পেছনে user আসলে app, rule, bonus, payment, নাকি strategy খুঁজছে তা ঠিক করুন।`],
    ['Core rule পড়ুন', 'Market বা game rule না বুঝে bet নেবেন না; settlement এবং withdrawal impact আগে check করুন।'],
    ['Safety signal check করুন', 'Official link, HTTPS, KYC rules, payment method, এবং support availability verify করুন।'],
    ['Small stake দিয়ে শুরু করুন', 'প্রথম session-এ small stake, stop-loss, এবং responsible gambling limit ব্যবহার করুন।']
  ];
}

function body(topic) {
  const links = clusterLinks[topic.cluster] || clusterLinks.casino;
  const images = imageNames(topic.slug);
  const faqs = faq(topic);
  const steps = howto(topic);
  const l = label(topic);
  const pillarLinks = links.map(item => `[${item.title}](${item.url})`).join(', ');

  return `---
layout: "post.njk"
lang: "bn-BD"
title: ${escapeFrontmatter(topic.title)}
description: ${escapeFrontmatter(description(topic))}
date: ${START_DATE}
lastUpdated: ${START_DATE}
ogImage: ${escapeFrontmatter(images.ogOptimizedWebp)}
ogImageAlt: ${escapeFrontmatter(`${l} visual guide for Bangladesh users`)}
tags: [${['"post"', ...topic.tags.map(tag => escapeFrontmatter(tag))].join(', ')}]
faq:
${faqs.map(([question, answer]) => `  - question: ${escapeFrontmatter(question)}\n    answer: ${escapeFrontmatter(answer)}`).join('\n')}
howto:
  name: ${escapeFrontmatter(`${l} checklist`)}
  description: ${escapeFrontmatter(`${topic.primaryKeyword} topic নিয়ে safe decision নেওয়ার short workflow।`)}
  steps:
${steps.map(([name, text]) => `    - name: ${escapeFrontmatter(name)}\n      text: ${escapeFrontmatter(text)}`).join('\n')}
---

<p class="lead">${l} নিয়ে Bangladesh search demand বাড়ছে, কিন্তু অনেক user শুধু headline দেখে decision নেয়। এই guide-এ ${topic.primaryKeyword} topic-কে practical, Bengali-dominant এবং risk-awareভাবে explain করা হয়েছে, যাতে আপনি blind guess না করে informed action নিতে পারেন।</p>

<picture class="content-image" data-critical="true">
  <source srcset="/assets/blog/${images.heroOptimizedAvif}" type="image/avif">
  <source srcset="/assets/blog/${images.heroOptimizedWebp}" type="image/webp">
  <img src="/assets/blog/${images.heroOptimizedWebp}" alt="${l} guide visual" width="800" height="450" loading="eager" fetchpriority="high" decoding="async">
</picture>

## কেন এই topic এখন গুরুত্বপূর্ণ

Google Search Console data অনুযায়ী ${topic.primaryKeyword} cluster-এ impression আছে, কিন্তু ranking বা CTR এখনো পুরো potential capture করছে না। তাই এই article-এর লক্ষ্য হলো user intent পরিষ্কার করা, related pillar content-এর সাথে internal linking তৈরি করা, এবং Bangladesh user-এর বাস্তব সমস্যা—app download, payment, rules, bonus terms, বা safe play—এক জায়গায় explain করা।

এই topic broader cluster-এর সাথে যুক্ত। আরও context দরকার হলে ${pillarLinks} পড়ুন।

## Quick decision framework

${topic.angle} এই angle থেকে decision নিতে হলে আগে তিনটি প্রশ্নের উত্তর বের করুন:

1. আপনার intent কি information, comparison, download, নাকি immediate play?
2. Payment, KYC, বা bonus terms কি decision-এ প্রভাব ফেলবে?
3. এই topic-এ কোনো viral trick, fake APK, বা unrealistic winning claim আছে কি?

যদি উত্তর পরিষ্কার না হয়, তাহলে বড় stake নেওয়ার আগে guide, rules এবং support page check করুন।

## Step-by-step checklist

- Official website বা trusted page থেকে শুরু করুন।
- Register on the website first to claim your bonus, then download the app for the best experience.
- APK বা app install করলে permission, source, এবং update notice verify করুন।
- bKash, Nagad, Rocket বা অন্য payment method ব্যবহার করলে transaction proof সংরক্ষণ করুন।
- Bonus claim করলে wagering requirement, expiry, eligible games, এবং withdrawal limit আগে পড়ুন।
- Sports বা casino market হলে bankroll cap এবং stop-loss আগে set করুন।

<picture class="content-image">
  <source srcset="/assets/blog/${images.detailOptimizedAvif}" type="image/avif">
  <source srcset="/assets/blog/${images.detailOptimizedWebp}" type="image/webp">
  <img src="/assets/blog/${images.detailOptimizedWebp}" alt="${l} checklist interface" width="800" height="450" loading="lazy" decoding="async">
</picture>

## Common mistakes avoid করুন

সবচেয়ে common mistake হলো high ranking keyword বা viral phrase দেখে guaranteed win ধরে নেওয়া। ${topic.primaryKeyword} search করলে অনেক সময় aggressive claim, fake signal, বা outdated APK দেখা যায়। এগুলো avoid করতে official source, updated terms, এবং responsible gambling limit ব্যবহার করুন।

দ্বিতীয় mistake হলো এক article থেকে সব answer পাওয়ার আশা করা। Related topic হলে pillar guide এবং comparison article পড়া দরকার। এই কারণেই এই page থেকে relevant internal links দেওয়া হয়েছে।

## Responsible play reminder

Betting এবং casino game entertainment হিসেবে দেখা উচিত, guaranteed income হিসেবে নয়। ১৮+ user ছাড়া কেউ খেলবেন না। Loss chase করবেন না, ধার করা টাকা ব্যবহার করবেন না, এবং session limit আগে নির্ধারণ করুন।

<p style="margin-top: 2em; text-align: center;">
  <a class="cta" href="/go/borojeet" rel="sponsored nofollow" target="_blank">BoroJeet official page দেখুন</a>
</p>
`;
}

function promptTasksFor(topic) {
  const l = label(topic);
  return [
    {
      filename: `assets/blog/${topic.slug}-hero.webp`,
      coreConcept: `${l}, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard`,
      prompt: buildPremiumImagePrompt(`${l}, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard`)
    },
    {
      filename: `assets/blog/${topic.slug}-detail.webp`,
      coreConcept: `${l}, close-up decision checklist interface with safe payment, odds, and risk-control visual elements`,
      prompt: buildPremiumImagePrompt(`${l}, close-up decision checklist interface with safe payment, odds, and risk-control visual elements`)
    },
    {
      filename: `assets/og/og-${topic.slug}.webp`,
      coreConcept: `${l}, wide social sharing composition with one central symbolic object and clean negative space`,
      prompt: buildPremiumImagePrompt(`${l}, wide social sharing composition with one central symbolic object and clean negative space`)
    }
  ];
}

function assertUniqueTopics() {
  if (topics.length !== 100) {
    throw new Error(`Expected 100 topics, found ${topics.length}.`);
  }

  const seen = new Set();
  const existing = new Set(fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.md')).map(file => file.replace(/\.md$/, '')));

  for (const topic of topics) {
    if (seen.has(topic.slug)) {
      throw new Error(`Duplicate new topic slug: ${topic.slug}`);
    }
    seen.add(topic.slug);

    if (existing.has(topic.slug)) {
      throw new Error(`Topic slug already exists in blog/: ${topic.slug}`);
    }
  }
}

function inferClusterFromMeta(item) {
  const text = `${item.slug} ${item.title} ${item.tags || ''}`.toLowerCase();
  if (/world-cup|fifa|football|epl|la-liga|champions|europa|goal|corner|btts|score/.test(text)) return 'worldCup';
  if (/cricket|ipl|bpl|wicket|powerplay|session|toss|odi|test-match/.test(text)) return 'cricketApp';
  if (/app|apk|login|download|account|otp|browser|device|security|kyc/.test(text)) return 'bettingApp';
  if (/crash|aviator|jetx|funky|crazy|spaceman|rocket-game|cash-or-crash/.test(text)) return 'crash';
  if (/bkash|nagad|rocket|deposit|withdraw|cashout|payment/.test(text)) return 'payments';
  if (/bonus|promo|vip|cashback|rebate|wagering|legal|trust|scam/.test(text)) return 'bonusTrust';
  if (/casino|slot|roulette|baccarat|blackjack|teen-patti|andar|sic-bo|live|jili|pragmatic|table/.test(text)) return 'casino';
  return 'casino';
}

function priorityFor(item) {
  const text = `${item.slug} ${item.title} ${item.tags || ''}`.toLowerCase();
  const isNew = item.source === BATCH_ID;
  let base = 900;

  if (/cricket.*app|betting.*app|app.*download|apk|android|ios|pc|login/.test(text)) base = 20;
  if (/champions|europa/.test(text)) base = 25;
  if (/world-cup|fifa|football|epl|la-liga|goal|btts|correct-score|over-under|bet-builder/.test(text)) base = 35;
  if (/ipl|cricket|asia-cup|wicket|powerplay|session|toss/.test(text)) base = Math.min(base, 45);
  if (/crash|aviator|crazy-time|funky-time|cash-or-crash|plane/.test(text)) base = Math.min(base, 55);
  if (/legal|casino|slot|games-list|bkash|nagad|deposit|low-deposit|real-money/.test(text)) base = Math.min(base, 65);
  if (/bonus|rebate|wagering|vip|promo|cashback|trust|scam/.test(text)) base = Math.min(base, 75);
  if (/comparison|vs-/.test(text)) base += 8;
  if (isNew) base -= 5;

  const newTopic = topics.find(topic => topic.slug === item.slug);
  const rank = newTopic && newTopic.metrics && typeof newTopic.metrics.rank === 'number' ? newTopic.metrics.rank : null;
  const impressions = newTopic && newTopic.metrics && typeof newTopic.metrics.impressions === 'number' ? newTopic.metrics.impressions : null;

  if (rank !== null && rank >= 8) base -= 4;
  if (impressions !== null && impressions >= 20) base -= 3;
  if (impressions !== null && impressions >= 40) base -= 3;

  return base;
}

function collectUnpublishedMeta() {
  return fs.readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.md'))
    .map(existingArticleMeta)
    .filter(item => item.date && item.date > TODAY)
    .map(item => ({ ...item, cluster: inferClusterFromMeta(item), priority: priorityFor(item) }));
}

function updateDateFrontmatter(articleFile, newDate) {
  const absolutePath = path.join(ROOT_DIR, articleFile);
  let content = fs.readFileSync(absolutePath, 'utf8');

  if (/^date:\s*\d{4}-\d{2}-\d{2}/m.test(content)) {
    content = content.replace(/^date:\s*\d{4}-\d{2}-\d{2}/m, `date: ${newDate}`);
  } else {
    content = content.replace(/^---\n/, `---\ndate: ${newDate}\n`);
  }

  if (/^lastUpdated:\s*\d{4}-\d{2}-\d{2}/m.test(content)) {
    content = content.replace(/^lastUpdated:\s*\d{4}-\d{2}-\d{2}/m, `lastUpdated: ${newDate}`);
  } else {
    content = content.replace(/^date:\s*\d{4}-\d{2}-\d{2}\n/m, `date: ${newDate}\nlastUpdated: ${newDate}\n`);
  }

  fs.writeFileSync(absolutePath, content, 'utf8');
}

function applySchedule() {
  const items = collectUnpublishedMeta()
    .sort((a, b) => priorityFor(a) - priorityFor(b) || a.title.localeCompare(b.title));

  const scheduled = items.map((item, index) => {
    const newDate = datePlus(START_DATE, Math.floor(index / 2));
    updateDateFrontmatter(item.file, newDate);
    return {
      date: newDate,
      slot: (index % 2) + 1,
      file: item.file,
      slug: item.slug,
      title: item.title,
      cluster: item.cluster,
      source: item.source,
      priority: priorityFor(item)
    };
  });

  fs.writeFileSync(SCHEDULE_FILE, `${JSON.stringify({ generatedAt: TODAY, maxPostsPerDay: 2, scheduledCount: scheduled.length, eventCalendar, scheduled }, null, 2)}\n`, 'utf8');
  return scheduled;
}

function main() {
  fs.mkdirSync(PUBLISHING_DIR, { recursive: true });
  assertUniqueTopics();

  const prompts = [];
  const articleFiles = [];

  for (const topic of topics) {
    const target = slugToFile(topic.slug);
    fs.writeFileSync(target, body(topic), 'utf8');
    articleFiles.push(`blog/${topic.slug}.md`);
    prompts.push(...promptTasksFor(topic));
  }

  fs.writeFileSync(PROMPTS_FILE, `${JSON.stringify(prompts, null, 2)}\n`, 'utf8');
  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify({
    publishBatchName: BATCH_ID,
    promptsFile: path.relative(ROOT_DIR, PROMPTS_FILE),
    articleFiles,
    promptBackedArticles: articleFiles,
    generationSummary: {
      totalArticles: articleFiles.length,
      totalPromptTasks: prompts.length,
      source: 'Google Search Console opportunity expansion, Bangladesh gambling/betting keywords, May 2026'
    }
  }, null, 2)}\n`, 'utf8');

  const scheduled = applySchedule();
  const newTopicDetails = topics.map(topic => ({
    slug: topic.slug,
    file: `blog/${topic.slug}.md`,
    title: topic.title,
    cluster: topic.cluster,
    primaryKeyword: topic.primaryKeyword,
    gscMetrics: topic.metrics,
    angle: topic.angle,
    scheduledDate: scheduled.find(item => item.slug === topic.slug)?.date || null
  }));

  fs.writeFileSync(PLAN_FILE, `${JSON.stringify({
    generatedAt: TODAY,
    batchId: BATCH_ID,
    strategySummary: {
      objective: 'Create 100 new, non-duplicative Bengali-dominant articles based on high-impression / low-ranking GSC opportunities and upcoming Bangladesh betting demand windows.',
      newArticleCount: topics.length,
      unpublishedScheduledCount: scheduled.length,
      maxPostsPerDay: 2
    },
    keywordOpportunityBuckets,
    eventCalendar,
    newTopics: newTopicDetails,
    unpublishedTopics: scheduled.map(({ date, slot, file, slug, title, cluster, source }) => ({ date, slot, file, slug, title, cluster, source }))
  }, null, 2)}\n`, 'utf8');

  console.log(`✅ Created ${articleFiles.length} GSC expansion articles.`);
  console.log(`🖼️  Wrote ${prompts.length} prompt tasks: ${path.relative(ROOT_DIR, PROMPTS_FILE)}`);
  console.log(`📦 Wrote manifest: ${path.relative(ROOT_DIR, MANIFEST_FILE)}`);
  console.log(`🗓️  Rescheduled ${scheduled.length} unpublished articles with max 2/day.`);
  console.log(`📊 Wrote plan: ${path.relative(ROOT_DIR, PLAN_FILE)}`);
}

main();
