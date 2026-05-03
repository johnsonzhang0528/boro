const fs = require('fs');
const path = require('path');
const { buildPremiumImagePrompt } = require('./premium-image-prompts');

const ROOT_DIR = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'blog');
const PUBLISHING_DIR = path.join(ROOT_DIR, 'data', 'publishing');
const TODAY = '2026-05-03';
const START_DATE = '2026-05-04';
const BATCH_ID = 'gsc-expansion-2026-05-wave2';
const PROMPTS_FILE = path.join(PUBLISHING_DIR, `${BATCH_ID}-prompts.json`);
const MANIFEST_FILE = path.join(PUBLISHING_DIR, `${BATCH_ID}-manifest.json`);
const PLAN_FILE = path.join(PUBLISHING_DIR, `${BATCH_ID}-plan.json`);
const SCHEDULE_FILE = path.join(PUBLISHING_DIR, `${BATCH_ID}-schedule.json`);
const REPORT_FILE = path.join(PUBLISHING_DIR, `${BATCH_ID}-report.md`);

const keywordOpportunityBuckets = [
  {
    bucket: 'brand-app-apk-high-ctr',
    reason: 'GSC top rows show BoroJeet / Boro Jeet / APK / app download keywords with strong impressions and average positions around 2-4. These should be protected with exact-intent support pages and FAQ-style long tails.',
    examples: ['borojeet', 'boro jeet', 'borojeet apk', 'boro jeet app download apk', 'borojeet app', 'boroijt']
  },
  {
    bucket: 'cricket-baji-bengali-intent',
    reason: 'Bengali cricket betting app queries appear in top GSC rows and are realistic authority opportunities because the site already has cricket/app topical depth.',
    examples: ['ক্রিকেট বাজি ধরার অ্যাপ', 'ক্রিকেট বাজি অ্যাপস', 'সেরা ক্রিকেট betting site in bangladesh', 'online cricket betting bangladesh tips']
  },
  {
    bucket: 'world-cup-2026-event-window',
    reason: 'FIFA World Cup 2026 begins within the next six weeks. World Cup football pages need to be indexed before kickoff to capture pre-match and live traffic.',
    examples: ['world cup betting guide', 'world cup live odds', 'football betting app bangladesh', 'world cup asian handicap']
  },
  {
    bucket: 'low-rank-high-impression-commercial',
    reason: 'GSC shows low-click / low-rank queries such as best betting apps in Bangladesh, online gambling in Bangladesh, low-deposit sites and Bangladesh online casino game. These need better intent-matched landing pages.',
    examples: ['best betting apps in bangladesh', 'online gambling in bangladesh', '৫০ টাকা ডিপোজিট সাইট ইন বাংলাদেশ', 'bangladeshi online casino game']
  },
  {
    bucket: 'crash-cash-game-bengali',
    reason: 'Cash game / crash game Bengali queries show recurring impressions. New pages should answer rules and strategy while avoiding guaranteed-win claims.',
    examples: ['ক্যাশ গেম খেলার কৌশল', 'ক্যাসিনো ক্রাশ গেম', 'crash betting game bangladesh']
  },
  {
    bucket: 'payments-wallets-trust',
    reason: 'bKash / Nagad / Rocket and payment-logo queries can support conversion and trust pages if handled as safety and verification content rather than logo-download pages.',
    examples: ['bkash rocket nagad logo png', 'bkash nagad deposit', 'rocket payment betting sites']
  }
];

const eventCalendar = [
  {
    window: '2026-05-04 to 2026-05-20',
    focus: 'Brand APK/app, BoroJeet exact-match support, IPL late-season cricket app traffic, Champions/Europa finals prep',
    schedulingAction: 'Publish brand, app-download, APK safety and cricket app pages first to protect existing high-impression rankings.'
  },
  {
    window: '2026-05-21 to 2026-06-10',
    focus: 'FIFA World Cup 2026 pre-tournament search build-up plus Eid al-Adha payment/bonus planning',
    schedulingAction: 'Front-load World Cup setup, app, payment timing, bankroll and market explainers before kickoff.'
  },
  {
    window: '2026-06-11 to 2026-07-19',
    focus: 'FIFA World Cup 2026 live traffic: group stage, knockout, final, in-play football markets',
    schedulingAction: 'Keep World Cup betting market pages and live-odds explainers publishing during the tournament window.'
  },
  {
    window: '2026-07-20 to 2026-08-20',
    focus: 'Post-World-Cup evergreen: app download, casino legality, crash/cash games, safe payments',
    schedulingAction: 'Move evergreen casino/crash/payment pages after the football peak to build Q3 rankings.'
  },
  {
    window: '2026-08-21 to 2026-09-30',
    focus: 'European football season start and Asia Cup cricket preparation window',
    schedulingAction: 'Prioritize football season primers, Asia Cup cricket app guides and cricket market pages before tournament demand.'
  },
  {
    window: '2026-10-01 to 2026-11-03',
    focus: 'Durga Puja seasonal promotions, bonus education, trust/safety, casino evergreen demand',
    schedulingAction: 'Use promotion, wagering, VIP, legal and safety content for sustained conversion traffic.'
  }
];

const clusterConfig = {
  brandApp: {
    label: 'BoroJeet brand/app/APK',
    tags: ['borojeet', 'app', 'apk', 'guide'],
    links: [
      { title: 'BoroJeet App Download Install Guide', url: '/blog/borojeet-app-download-install-guide/' },
      { title: 'Boro Jeet App Download Official', url: '/blog/boro-jeet-app-download-official/' },
      { title: 'Boro Jeet Registration Guide 2026', url: '/blog/boro-jeet-registration-guide-2026/' }
    ]
  },
  cricket: {
    label: 'Cricket betting/app Bengali intent',
    tags: ['cricket', 'betting-apps', 'bangla', 'guide'],
    links: [
      { title: 'Ultimate Guide to Cricket Betting in Bangladesh', url: '/blog/ultimate-guide-to-cricket-betting-in-bangladesh/' },
      { title: 'Best Cricket Betting Apps Bangladesh 2026', url: '/blog/best-cricket-betting-apps-bangladesh-2026/' },
      { title: 'Cricket Betting App Download BD Android 2026', url: '/blog/cricket-betting-app-download-bd-android-2026/' }
    ]
  },
  worldCup: {
    label: 'FIFA World Cup 2026 football',
    tags: ['football', 'world-cup', 'strategy', 'guide'],
    links: [
      { title: 'FIFA World Cup 2026 Betting Guide Bangladesh', url: '/blog/fifa-world-cup-2026-betting-guide-bangladesh/' },
      { title: 'Football Betting Guide Bangladesh', url: '/blog/football-betting-guide-bangladesh/' },
      { title: 'World Cup 2026 Over/Under Goals Guide', url: '/blog/world-cup-2026-over-under-goals-guide/' }
    ]
  },
  casinoLegal: {
    label: 'Casino/legal/trust discovery',
    tags: ['casino', 'legal', 'safety', 'guide'],
    links: [
      { title: 'Legal Online Casino Bangladesh Guide', url: '/blog/legal-online-casino-bangladesh-guide/' },
      { title: 'Is Online Gambling Legal in Bangladesh', url: '/blog/is-online-gambling-legal-in-bangladesh-guide/' },
      { title: 'Online Casino Games List Bangladesh', url: '/blog/online-casino-games-list-bangladesh/' }
    ]
  },
  crashCash: {
    label: 'Crash and cash game Bengali intent',
    tags: ['crash-games', 'strategy', 'bangla', 'guide'],
    links: [
      { title: 'Guide to Crash Games Bangladesh', url: '/blog/guide-to-crash-games-bangladesh/' },
      { title: 'Crash Game Winning Tricks Bangla', url: '/blog/crash-game-winning-tricks-bangla/' },
      { title: 'Crazy Time খেলার নিয়ম Bangla', url: '/blog/crazy-time-khelar-niyom-bangla/' }
    ]
  },
  payments: {
    label: 'bKash/Nagad/Rocket payment trust',
    tags: ['payments', 'bkash', 'nagad', 'guide'],
    links: [
      { title: 'Online Casino Payments Bangladesh', url: '/blog/ultimate-guide-to-online-casino-payments-bangladesh/' },
      { title: 'Nagad vs bKash Casino Deposits', url: '/blog/nagad-vs-bkash-casino-deposits/' },
      { title: 'bKash Deposit Guide', url: '/blog/bkash-limit-casino-deposit-guide/' }
    ]
  },
  bonusTrust: {
    label: 'Bonus/wagering/seasonal trust',
    tags: ['bonus', 'wagering', 'trust', 'guide'],
    links: [
      { title: 'Understanding Wagering Requirements', url: '/blog/understanding-wagering-requirements/' },
      { title: 'BoroJeet VIP Bonus Rules Bangla', url: '/blog/borojeet-vip-bonus-rules-bangla/' },
      { title: 'Daily Betting Rebate Guide Bangladesh', url: '/blog/daily-betting-rebate-guide-bangladesh/' }
    ]
  }
};

function topic(slug, title, cluster, primaryKeyword, gscSignal, angle, extraTags = []) {
  return {
    slug,
    title,
    cluster,
    primaryKeyword,
    gscSignal,
    angle,
    tags: [...new Set([...(clusterConfig[cluster]?.tags || ['guide']), ...extraTags])]
  };
}

const topics = [
  topic('borojeet-apk-download-bangladesh-2026', 'BoroJeet APK Download Bangladesh 2026: safe install checklist', 'brandApp', 'borojeet apk', '49 clicks / 4,615 impressions / avg position 2.1', 'Protect high-CTR APK intent with a safe install and official-source page.', ['download', 'security']),
  topic('boro-jeet-app-download-apk-safe-guide', 'Boro Jeet App Download APK Safe Guide: website first, app second', 'brandApp', 'boro jeet app download apk', '15 clicks / 385 impressions / avg position 2.1', 'Exact-match app download APK support page for brand demand.', ['download', 'android']),
  topic('borojeet-official-apk-vs-fake-apk', 'BoroJeet Official APK vs Fake APK: কীভাবে চিনবেন?', 'brandApp', 'borojeet official apk', 'Brand APK queries rank well but need anti-fake support.', 'Trust page to reduce fake APK and mirror-link risk.', ['security', 'scam-alert']),
  topic('boroijt-search-result-borojeet-guide', 'Boroijt Search Result Guide: ভুল spelling থেকেও official BoroJeet খুঁজুন', 'brandApp', 'boroijt', '41 clicks / 6,620 impressions / avg position 3.4', 'Capture misspelling traffic and redirect users to safe brand paths.', ['misspelling']),
  topic('borojeet-app-permissions-bangladesh', 'BoroJeet App Permissions Bangladesh: কোন permission safe?', 'brandApp', 'borojeet app', '8 clicks / 490 impressions / avg position 4.0', 'Support app download intent with Android permission education.', ['android', 'security']),
  topic('boro-jeet-app-download-without-play-store', 'Boro Jeet App Download without Play Store: Android user guide', 'brandApp', 'boro jeet app download', '7 clicks / 61 impressions / avg position 4.5', 'Long-tail APK install question for users who cannot find the app in stores.', ['android', 'download']),
  topic('borojeet-apk-update-checklist-2026', 'BoroJeet APK Update Checklist 2026: পুরোনো version বদলানোর আগে', 'brandApp', 'borojeet apk update', 'APK download topic extension from GSC brand traffic.', 'Avoid duplicate update article by focusing on APK version safety checklist.', ['update', 'apk']),
  topic('borojeet-mobile-otp-login-fix-bd', 'BoroJeet Mobile OTP Login Fix BD: code না এলে কী করবেন?', 'brandApp', 'borojeet login otp', 'Brand support long-tail from app/login cluster.', 'Troubleshooting page for login friction and conversion recovery.', ['login', 'otp']),
  topic('boro-jeet-app-install-from-website', 'Boro Jeet App Install from Website: bonus tracking ঠিক রাখার নিয়ম', 'brandApp', 'boro jeet app install website', 'Related to app download APK exact-match rows.', 'Reinforce website-first registration before app install.', ['install', 'bonus']),
  topic('borojeet-app-download-bonus-tracking', 'BoroJeet App Download Bonus Tracking: register first কেন জরুরি?', 'brandApp', 'borojeet app bonus', 'Brand app traffic has commercial conversion potential.', 'Protect affiliate tracking by explaining registration flow.', ['bonus', 'download']),
  topic('borojeet-safe-registration-bangladesh', 'BoroJeet Safe Registration Bangladesh: account খোলার আগে checklist', 'brandApp', 'borojeet registration', 'Brand navigational traffic is the strongest GSC bucket.', 'Support first-time signups with trust and KYC context.', ['registration', 'kyc']),
  topic('borojeet-official-link-bookmark-guide', 'BoroJeet Official Link Bookmark Guide: mirror confusion avoid করুন', 'brandApp', 'borojeet official link', 'Brand terms need anti-phishing support pages.', 'Reduce fake-link risk with bookmarking and official path guidance.', ['security', 'mirror']),
  topic('borojeet-app-cache-clear-login-fix', 'BoroJeet App Cache Clear Login Fix: stuck screen হলে কী করবেন?', 'brandApp', 'borojeet app not opening', 'App troubleshooting can recover high-intent users.', 'Practical Android troubleshooting for login/app errors.', ['troubleshooting', 'android']),
  topic('borojeet-app-low-storage-install-fix', 'BoroJeet App Low Storage Install Fix: space কম থাকলে solution', 'brandApp', 'borojeet app install problem', 'App installation support query extension.', 'Device-storage issue page for APK installation friction.', ['install', 'troubleshooting']),
  topic('borojeet-app-bangla-step-by-step', 'BoroJeet App Bangla Step-by-Step: register, deposit, play safely', 'brandApp', 'borojeet app bangla', 'Brand app traffic with Bengali-language support opportunity.', 'Bengali step-by-step hub aligned to high-impression brand/app terms.', ['bangla', 'how-to']),

  topic('cricket-baji-dhorar-app-bangladesh', 'ক্রিকেট বাজি ধরার অ্যাপ Bangladesh: safe app বাছার guide', 'cricket', 'ক্রিকেট বাজি ধরার অ্যাপ', '39 clicks / 358 impressions / avg position 4.2', 'Directly target the Bengali high-click cricket app query.', ['bengali-intent']),
  topic('cricket-baji-apps-bangladesh-guide', 'ক্রিকেট বাজি অ্যাপস Bangladesh: top features ও safety signals', 'cricket', 'ক্রিকেট বাজি অ্যাপস', '8 clicks / 147 impressions / avg position 3.3', 'Bengali plural app query with strong commercial relevance.', ['bengali-intent', 'apps']),
  topic('sera-cricket-betting-site-bangladesh', 'সেরা Cricket Betting Site in Bangladesh: কোন criteria দেখবেন?', 'cricket', 'সেরা ক্রিকেট betting site in bangladesh', '0 clicks / 3 impressions / avg position 71.0', 'Low-rank long-tail with clear improvement potential.', ['sites', 'comparison']),
  topic('online-cricket-betting-bangladesh-tips', 'Online Cricket Betting Bangladesh Tips: data দেখে decision নিন', 'cricket', 'online cricket betting bangladesh tips', '0 clicks / 31 impressions / avg position 67.7', 'High-rank-gap tips query with existing topical authority.', ['tips']),
  topic('cricket-betting-sites-bangladesh-bangla', 'Cricket Betting Sites Bangladesh Bangla Guide: site বাছার checklist', 'cricket', 'betting sites in bangladesh cricket', 'Bengali/English mixed site intent appears in GSC low-ranking rows.', 'Create a comparison-style page for site intent rather than only app intent.', ['sites', 'comparison']),
  topic('cricket-baji-korar-niyom-bangla', 'Cricket বাজি করার নিয়ম Bangla: beginner rules explained', 'cricket', 'cricket বাজি করার নিয়ম', 'Bengali cricket betting education supports app and site clusters.', 'Beginner education page for rule-based searchers.', ['beginner', 'rules']),
  topic('cricket-live-score-odds-bangladesh', 'Cricket Live Score Odds Bangladesh: score দেখে odds পড়ার নিয়ম', 'cricket', 'cricket live score odds', 'Live cricket betting topics are recurring site strengths.', 'Connect live score intent to responsible in-play decisions.', ['live-betting', 'odds']),
  topic('cricket-betting-app-bangla-review', 'Cricket Betting App Bangla Review: speed, market ও payment compare', 'cricket', 'cricket betting app bangla', 'Bengali app-intent expansion from GSC top rows.', 'Bangla review format for app selection intent.', ['review', 'apps']),
  topic('bangladesh-cricket-market-guide-2026', 'Bangladesh Cricket Market Guide 2026: runs, wickets ও innings market', 'cricket', 'Bangladesh cricket betting markets', 'Upcoming cricket calendar creates evergreen betting market demand.', 'Market-education page supporting Asia Cup and bilateral series.', ['markets']),
  topic('asia-cup-2026-cricket-betting-apps-bd', 'Asia Cup 2026 Cricket Betting Apps BD: tournament আগে setup', 'cricket', 'asia cup cricket betting app', 'Asia Cup is a likely Q3 cricket demand window.', 'Pre-build Asia Cup app traffic before September demand.', ['asia-cup', 'apps']),
  topic('asia-cup-2026-bangladesh-cricket-betting-guide', 'Asia Cup 2026 Bangladesh Cricket Betting Guide: match plan ও risk', 'cricket', 'asia cup 2026 betting guide', 'Upcoming cricket event opportunity.', 'Tournament guide for Bangladesh cricket fans.', ['asia-cup']),
  topic('cricket-betting-bonus-asia-cup-2026', 'Cricket Betting Bonus Asia Cup 2026: bonus terms আগে পড়ুন', 'cricket', 'cricket betting bonus asia cup', 'Seasonal bonus opportunity around cricket tournaments.', 'Bridge cricket event traffic with bonus-term education.', ['asia-cup', 'bonus']),
  topic('cricket-toss-betting-bangla-guide', 'Cricket Toss Betting Bangla Guide: toss market কি worth it?', 'cricket', 'cricket toss betting', 'Toss market long-tail supports cricket cluster.', 'Explain toss market variance and limits.', ['toss', 'markets']),
  topic('cricket-over-by-over-betting-bangladesh', 'Cricket Over-by-Over Betting Bangladesh: live over market guide', 'cricket', 'over by over cricket betting', 'Live cricket long-tail expansion.', 'Specific in-play market guide with stop-loss reminder.', ['live-betting', 'markets']),
  topic('cricket-player-performance-market-bangla', 'Cricket Player Performance Market Bangla: runs, wickets, catches', 'cricket', 'cricket player performance betting', 'Player props cricket cluster support.', 'Player-market education for higher-value long-tail traffic.', ['player-props']),

  topic('world-cup-2026-bangladesh-betting-calendar', 'World Cup 2026 Bangladesh Betting Calendar: কোন content আগে পড়বেন?', 'worldCup', 'world cup 2026 betting calendar', 'World Cup 2026 starts 2026-06-11.', 'Calendar hub to organize pre-event and live-event search demand.', ['calendar']),
  topic('world-cup-2026-opening-week-betting-plan-bd', 'World Cup 2026 Opening Week Betting Plan BD: first matches strategy', 'worldCup', 'world cup 2026 opening week betting', 'Pre-kickoff football demand window.', 'Opening-week planning page for early tournament traffic.', ['opening-week']),
  topic('world-cup-2026-opening-match-odds-guide', 'World Cup 2026 Opening Match Odds Guide: first game market explained', 'worldCup', 'world cup opening match odds', 'Opening match has peak search interest.', 'Target opening match odds and market rules.', ['odds', 'opening-match']),
  topic('world-cup-2026-knockout-bracket-betting-guide', 'World Cup 2026 Knockout Bracket Betting Guide: draw থেকে final', 'worldCup', 'world cup knockout betting', 'Knockout demand begins before group stage ends.', 'Prepare bracket and knockout-stage evergreen page.', ['knockout']),
  topic('world-cup-2026-penalty-shootout-betting-rules', 'World Cup 2026 Penalty Shootout Betting Rules: settlement কীভাবে হয়?', 'worldCup', 'penalty shootout betting rules', 'Penalty settlement questions spike during knockouts.', 'Rules page for settlement-intent traffic.', ['penalties', 'rules']),
  topic('world-cup-2026-corners-card-market-guide', 'World Cup 2026 Corners & Cards Market Guide: stats কীভাবে পড়বেন', 'worldCup', 'world cup corners cards betting', 'Corners/cards markets support football long-tail traffic.', 'Market page for stat-based bettors.', ['corners', 'cards']),
  topic('world-cup-2026-asian-handicap-guide-bangla', 'World Cup 2026 Asian Handicap Guide Bangla: line বুঝুন সহজে', 'worldCup', 'world cup asian handicap', 'Asian handicap is a competitive but high-value football topic.', 'Bangla explainer for handicap market.', ['asian-handicap']),
  topic('world-cup-2026-draw-no-bet-guide-bangladesh', 'World Cup 2026 Draw No Bet Guide Bangladesh: risk কমানোর market', 'worldCup', 'world cup draw no bet', 'Draw-no-bet is beginner-friendly and event-relevant.', 'Lower-risk football market education.', ['draw-no-bet']),
  topic('world-cup-2026-half-time-full-time-guide', 'World Cup 2026 Half-Time Full-Time Guide: HT/FT market explained', 'worldCup', 'world cup half time full time', 'HT/FT market long-tail for football event.', 'Explain high-risk score-state market.', ['ht-ft']),
  topic('world-cup-2026-live-odds-movement-guide', 'World Cup 2026 Live Odds Movement Guide: odds কেন বদলায়?', 'worldCup', 'world cup live odds', 'Live World Cup searches rise during matches.', 'In-play odds movement education.', ['live-betting', 'odds']),
  topic('world-cup-2026-team-news-injury-betting-guide', 'World Cup 2026 Team News Injury Betting Guide: lineup impact বুঝুন', 'worldCup', 'world cup team news betting', 'Team news and injury search spikes before matches.', 'Pre-match research checklist.', ['team-news']),
  topic('world-cup-2026-underdog-betting-strategy-bd', 'World Cup 2026 Underdog Betting Strategy BD: upset odds পড়ার নিয়ম', 'worldCup', 'world cup underdog betting', 'Underdog narratives drive tournament traffic.', 'Responsible longshot betting strategy.', ['underdog']),
  topic('world-cup-2026-favorites-accumulator-risk-guide', 'World Cup 2026 Favorites Accumulator Risk Guide: safe combo thinking', 'worldCup', 'world cup accumulator favorites', 'Accumulator traffic is common during major events.', 'Avoid overconfidence on favorites.', ['accumulator']),
  topic('world-cup-2026-mobile-betting-checklist-bd', 'World Cup 2026 Mobile Betting Checklist BD: app, data ও alerts', 'worldCup', 'world cup mobile betting', 'Mobile betting app demand likely during World Cup.', 'Mobile readiness page connecting app and football traffic.', ['mobile', 'apps']),
  topic('world-cup-2026-bkash-nagad-deposit-timing', 'World Cup 2026 bKash Nagad Deposit Timing: match আগে payment plan', 'worldCup', 'world cup bkash nagad deposit', 'Payment timing issues increase before matches.', 'Payment + event bridge with practical checklist.', ['payments', 'bkash', 'nagad']),
  topic('world-cup-2026-night-match-betting-bangladesh', 'World Cup 2026 Night Match Betting Bangladesh: time-zone ও bankroll', 'worldCup', 'world cup night match betting', 'Bangladesh time-zone creates late-night betting behavior.', 'Time-zone and bankroll safety guide.', ['time-zone']),
  topic('world-cup-2026-bangla-betting-terms-glossary', 'World Cup 2026 Bangla Betting Terms Glossary: odds, line, market', 'worldCup', 'world cup betting terms bangla', 'Beginner search grows around mega-events.', 'Glossary page for Bengali event searchers.', ['glossary', 'beginner']),
  topic('world-cup-2026-group-winner-outright-guide', 'World Cup 2026 Group Winner Outright Guide: futures market explained', 'worldCup', 'world cup group winner betting', 'Outright/futures demand is strongest before tournament start.', 'Pre-event futures market page.', ['outright']),
  topic('world-cup-2026-clean-sheet-market-guide', 'World Cup 2026 Clean Sheet Market Guide: defence stats কীভাবে পড়বেন', 'worldCup', 'clean sheet betting world cup', 'Clean-sheet long-tail supports football cluster.', 'Defensive stat market education.', ['clean-sheet']),
  topic('world-cup-2026-player-assists-betting-guide', 'World Cup 2026 Player Assists Betting Guide: creator stats explained', 'worldCup', 'player assists betting world cup', 'Player prop football traffic extension.', 'Assist market education.', ['player-props']),
  topic('world-cup-2026-yellow-card-betting-guide', 'World Cup 2026 Yellow Card Betting Guide: referee trend ও risk', 'worldCup', 'yellow card betting world cup', 'Cards markets spike during knockout football.', 'Referee/card market guide.', ['cards']),
  topic('world-cup-2026-betting-bankroll-plan-bd', 'World Cup 2026 Betting Bankroll Plan BD: 39-day tournament budget', 'worldCup', 'world cup betting bankroll', 'Long tournament requires bankroll education.', 'Responsible bankroll plan for World Cup period.', ['bankroll']),
  topic('fifa-world-cup-2026-app-notification-guide', 'FIFA World Cup 2026 App Notification Guide: odds alert ঠিক করুন', 'worldCup', 'world cup app notification', 'App notification queries support live-event traffic.', 'App alert setup guide.', ['apps', 'alerts']),
  topic('world-cup-2026-final-match-betting-checklist', 'World Cup 2026 Final Match Betting Checklist: final day market plan', 'worldCup', 'world cup final betting checklist', 'Final match traffic should be pre-indexed.', 'Final-day checklist page.', ['final']),

  topic('online-gambling-bangladesh-law-2026-bangla', 'Online Gambling Bangladesh Law 2026 Bangla: আইন ও practical risk', 'casinoLegal', 'online gambling in bangladesh', '0 clicks / 8 impressions / avg position 80.8', 'Create a better-matched Bengali legal-risk article for low-rank query.', ['law']),
  topic('bangladesh-online-gambling-risk-checklist', 'Bangladesh Online Gambling Risk Checklist: legal, payment ও scam', 'casinoLegal', 'bangladesh online gambling', 'Low-rank legal query family from GSC.', 'Practical checklist for broad gambling risk searches.', ['risk', 'checklist']),
  topic('online-jua-ain-bangladesh-guide', 'অনলাইন জুয়া আইন Bangladesh Guide: কী জানা জরুরি?', 'casinoLegal', 'অনলাইন জুয়া আইন', '0 clicks / 2 impressions / avg position 65.5', 'Exact Bengali legal query from screenshot.', ['bangla', 'law']),
  topic('best-betting-sites-in-bangladesh-bangla', 'Best Betting Sites in Bangladesh Bangla: site বাছার 10 signal', 'casinoLegal', 'best betting sites in bangladesh', '0 clicks / 13 impressions / avg position 69.5', 'Low-rank commercial query with strong upside.', ['comparison', 'sites']),
  topic('sera-betting-sites-bangladesh-guide', 'সেরা Betting Sites Bangladesh Guide: safe site কীভাবে চিনবেন?', 'casinoLegal', 'সেরা betting sites in bangladesh', '0 clicks / 3 impressions / avg position 73.0', 'Bengali best-site intent from screenshot.', ['bangla', 'sites']),
  topic('best-betting-apps-in-bangladesh-bangla-version', 'Best Betting Apps in Bangladesh Bangla Version: app compare সহজে', 'casinoLegal', 'best betting apps in bangladesh', '0 clicks / 13 impressions / avg position 69.5', 'Alternative Bengali-focused page for high-rank-gap best-app query.', ['apps', 'comparison']),
  topic('bangladeshi-online-casino-game-guide', 'Bangladeshi Online Casino Game Guide: popular game ও safety basics', 'casinoLegal', 'bangladeshi online casino game', '0 clicks / 46 impressions / avg position 59.9', 'High-impression low-rank casino game query.', ['games']),
  topic('online-casino-game-bangladesh-bangla', 'Online Casino Game Bangladesh Bangla: slot, table, live game explained', 'casinoLegal', 'online casino game bangladesh', 'Casino game list cluster support.', 'Bengali game-category explainer.', ['games', 'bangla']),
  topic('licensed-online-casino-bangladesh-checklist', 'Licensed Online Casino Bangladesh Checklist: license claim verify করুন', 'casinoLegal', 'licensed online casino bangladesh', 'Legal/trust related GSC opportunity.', 'Trust page for license and compliance claims.', ['license', 'trust']),
  topic('fake-online-casino-bd-red-flags', 'Fake Online Casino BD Red Flags: deposit করার আগে warning signs', 'casinoLegal', 'fake online casino bd', 'Trust and scam cluster supports conversions.', 'Scam-prevention page tied to legal and casino intent.', ['scam-alert']),
  topic('casino-crash-game-bangladesh-guide', 'Casino Crash Game Bangladesh Guide: crash market ও safe cashout', 'casinoLegal', 'ক্যাসিনো ক্রাশ গেম', '0 clicks / 142 impressions / avg position 63.8', 'Exact Bengali screenshot query with high impressions.', ['crash-games']),
  topic('online-casino-bangladesh-mobile-browser-guide', 'Online Casino Bangladesh Mobile Browser Guide: app ছাড়া কীভাবে?', 'casinoLegal', 'online casino bangladesh mobile', 'Mobile casino long-tail support.', 'Browser-first casino guide for low-storage users.', ['mobile', 'browser']),
  topic('casino-site-verification-bangladesh', 'Casino Site Verification Bangladesh: HTTPS, KYC ও payment proof', 'casinoLegal', 'casino site verification bangladesh', 'Trust and safety topic for casino discovery.', 'Verification checklist page.', ['verification']),
  topic('online-gambling-tax-risk-bangladesh', 'Online Gambling Tax Risk Bangladesh: withdrawal record রাখবেন কেন?', 'casinoLegal', 'online gambling tax bangladesh', 'Legal risk long-tail.', 'Financial-record and compliance-risk education.', ['tax', 'risk']),
  topic('safe-online-gaming-bangladesh-checklist', 'Safe Online Gaming Bangladesh Checklist: responsible play first', 'casinoLegal', 'safe online gaming bangladesh', 'Broad safer-gaming query support.', 'Safety hub page with responsible gambling framing.', ['responsible-gaming']),

  topic('cash-game-khelar-koushol-bangla', 'ক্যাশ গেম খেলার কৌশল Bangla: realistic strategy ও stop-loss', 'crashCash', 'ক্যাশ গেম খেলার কৌশল', '5 clicks / 359 impressions / avg position 6.8', 'Exact GSC Bengali cash-game query with traffic potential.', ['cash-game']),
  topic('cash-game-bangladesh-strategy-guide', 'Cash Game Bangladesh Strategy Guide: bankroll, timing ও risk', 'crashCash', 'cash game bangladesh', 'Cash game Bengali/English query family.', 'Broader cash-game strategy landing page.', ['cash-game']),
  topic('casino-crash-game-khelar-niyom', 'Casino Crash Game খেলার নিয়ম: multiplier, cashout ও risk', 'crashCash', 'ক্যাসিনো ক্রাশ গেম', '0 clicks / 142 impressions / avg position 63.8', 'Second exact-intent page focused on rules rather than guide.', ['rules']),
  topic('crash-betting-game-bangladesh-safe-guide', 'Crash Betting Game Bangladesh Safe Guide: prediction myth avoid করুন', 'crashCash', 'crash betting game bangladesh', '0 clicks / 20 impressions / avg position 62.8', 'Low-rank crash betting game query from screenshot.', ['safety']),
  topic('crash-betting-game-cashout-chart-bd', 'Crash Betting Game Cashout Chart BD: 1.3x, 1.5x, 2x risk map', 'crashCash', 'crash betting cashout chart', 'Crash strategy long-tail with practical value.', 'Cashout-level explainer page.', ['cashout']),
  topic('crash-game-bangla-prediction-myth', 'Crash Game Bangla Prediction Myth: pattern কি সত্যি কাজ করে?', 'crashCash', 'crash game prediction bangla', 'Prediction/scam long-tail from crash cluster.', 'Myth-busting page for unsafe predictor claims.', ['myths', 'scam-alert']),
  topic('aviator-betting-app-bangladesh-guide', 'Aviator Betting App Bangladesh Guide: app, cashout ও safety', 'crashCash', 'aviator betting app bangladesh', 'Aviator cluster has strong prior GSC opportunity.', 'App-focused Aviator guide.', ['aviator', 'apps']),
  topic('aviator-game-bangladesh-bkash-deposit', 'Aviator Game Bangladesh bKash Deposit: payment আগে checklist', 'crashCash', 'aviator game bkash deposit', 'Aviator + payment bridge query.', 'Crash game payment readiness page.', ['aviator', 'bkash']),
  topic('crazy-time-bangladesh-bonus-round-guide', 'Crazy Time Bangladesh Bonus Round Guide: pachinko, coin flip, cash hunt', 'crashCash', 'crazy time bonus round bangladesh', 'Crazy Time Bengali pages already show opportunity.', 'Bonus-round explainer for Crazy Time cluster.', ['crazy-time']),
  topic('crazy-time-bangla-bet-sizing-guide', 'Crazy Time Bangla Bet Sizing Guide: low-risk stake plan', 'crashCash', 'crazy time bet sizing', 'Strategy extension for Crazy Time traffic.', 'Stake sizing and bankroll article.', ['crazy-time', 'bankroll']),
  topic('funky-time-bangladesh-live-show-guide', 'Funky Time Bangladesh Live Show Guide: multiplier ও bonus explained', 'crashCash', 'funky time bangladesh', 'Funky Time strategy/rules pages need cluster depth.', 'Live-show game guide.', ['funky-time']),
  topic('crash-game-mobile-data-saving-guide', 'Crash Game Mobile Data Saving Guide: slow internet-এ smooth play', 'crashCash', 'crash game mobile data', 'Mobile performance angle supports crash app users.', 'Low-data crash game guide.', ['mobile', 'performance']),

  topic('bkash-rocket-nagad-logo-png-safe-use-guide', 'bKash Rocket Nagad Logo PNG Search: official logo চিনবেন কীভাবে?', 'payments', 'bkash rocket nagad logo png', '0 clicks / 3 impressions / avg position 58.7', 'Transform logo-search intent into payment-verification safety content.', ['rocket', 'logo']),
  topic('mobile-wallet-logo-check-betting-sites-bd', 'Mobile Wallet Logo Check on Betting Sites BD: fake logo warning', 'payments', 'mobile wallet logo betting sites', 'Related to bKash/Rocket/Nagad logo query.', 'Logo trust-signal page for payment safety.', ['logo', 'security']),
  topic('bkash-rocket-nagad-payment-method-comparison', 'bKash Rocket Nagad Payment Method Comparison: deposit কোনটা fast?', 'payments', 'bkash rocket nagad payment', 'Payment comparison can lift conversion intent.', 'Compare local wallet methods for Bangladesh users.', ['rocket', 'comparison']),
  topic('nagad-rocket-bkash-deposit-failed-checklist', 'Nagad Rocket bKash Deposit Failed Checklist: proof ও support steps', 'payments', 'deposit failed bkash nagad rocket', 'Deposit-failed support reduces user friction.', 'Troubleshooting page for payment failures.', ['rocket', 'troubleshooting']),
  topic('bkash-nagad-rocket-withdrawal-time-bd', 'bKash Nagad Rocket Withdrawal Time BD: pending হলে কী করবেন?', 'payments', 'bkash nagad rocket withdrawal time', 'Withdrawal time/payment support topic.', 'Payment timing article for local wallets.', ['rocket', 'withdrawal']),
  topic('mobile-wallet-proof-screenshot-betting-bd', 'Mobile Wallet Proof Screenshot Betting BD: support-এ কী পাঠাবেন?', 'payments', 'mobile wallet proof screenshot', 'Payment proof queries support trust and support flow.', 'Educate users on transaction proof without exposing private data.', ['support', 'safety']),
  topic('bkash-deposit-minimum-maximum-betting-guide', 'bKash Deposit Minimum Maximum Betting Guide: limit আগে জানুন', 'payments', 'bkash deposit minimum maximum betting', 'Deposit-limit searches are conversion-critical.', 'Limit and responsible deposit page.', ['bkash', 'limits']),
  topic('nagad-deposit-limit-online-gaming-bd', 'Nagad Deposit Limit Online Gaming BD: daily limit ও pending risk', 'payments', 'nagad deposit limit online gaming', 'Nagad payment cluster support.', 'Nagad limit explainer.', ['nagad', 'limits']),
  topic('rocket-payment-betting-sites-bangladesh', 'Rocket Payment Betting Sites Bangladesh: supported হলে কী check করবেন?', 'payments', 'rocket payment betting sites', 'Rocket has less competition than bKash/Nagad.', 'Payment method long-tail page.', ['rocket']),
  topic('payment-method-verification-borojeet-bd', 'Payment Method Verification BoroJeet BD: wallet name, number ও KYC', 'payments', 'borojeet payment verification', 'Brand + payment trust support.', 'Verification checklist for safer deposits/withdrawals.', ['borojeet', 'verification']),

  topic('borojeet-welcome-bonus-terms-bangla-2026', 'BoroJeet Welcome Bonus Terms Bangla 2026: wagering আগে বুঝুন', 'bonusTrust', 'borojeet welcome bonus terms', 'Bonus pages support conversion and E-E-A-T.', 'Bengali terms explainer for welcome bonus.', ['borojeet', 'welcome-bonus']),
  topic('best-betting-bonus-bangladesh-world-cup-2026', 'Best Betting Bonus Bangladesh World Cup 2026: terms compare করুন', 'bonusTrust', 'world cup betting bonus bangladesh', 'World Cup bonus searches will rise before kickoff.', 'Seasonal bonus comparison with responsible warnings.', ['world-cup', 'bonus']),
  topic('no-deposit-bonus-bd-risk-checklist', 'No Deposit Bonus BD Risk Checklist: free bonus সত্যি free?', 'bonusTrust', 'no deposit bonus bd', 'Free/no-deposit terms queries have conversion value.', 'Risk checklist for no-deposit bonus intent.', ['no-deposit']),
  topic('wagering-turnover-calculator-bangla-guide', 'Wagering Turnover Calculator Bangla Guide: কত খেলতে হবে?', 'bonusTrust', 'wagering turnover calculator', 'Wagering/turnover cluster already ranks; calculator intent can improve CTR.', 'Calculation-style article for bonus terms.', ['wagering', 'turnover']),
  topic('vip-cashback-vs-rebate-bangladesh', 'VIP Cashback vs Rebate Bangladesh: কোন reward বেশি useful?', 'bonusTrust', 'cashback vs rebate betting', 'VIP/rebate pages support retention and monetization.', 'Compare recurring reward types.', ['vip', 'cashback', 'rebate']),
  topic('bonus-abuse-warning-bangladesh', 'Bonus Abuse Warning Bangladesh: কোন কাজ account risk বাড়ায়?', 'bonusTrust', 'bonus abuse warning', 'Trust/support topic around bonus rules.', 'Explain risky bonus behavior and account safety.', ['warning']),
  topic('free-spin-bonus-bangladesh-slot-guide', 'Free Spin Bonus Bangladesh Slot Guide: eligible games ও wagering', 'bonusTrust', 'free spin bonus bangladesh', 'Slot/free-spin bonus long-tail.', 'Free-spin terms and slot eligibility guide.', ['slots', 'free-spins']),
  topic('eid-bonus-betting-bangladesh-2026', 'Eid Bonus Betting Bangladesh 2026: claim করার আগে terms পড়ুন', 'bonusTrust', 'eid betting bonus bangladesh', 'Eid al-Adha 2026 falls in late May, creating seasonal payment/bonus demand.', 'Seasonal Eid bonus guide.', ['eid', 'seasonal']),
  topic('durga-puja-betting-bonus-bangladesh-2026', 'Durga Puja Betting Bonus Bangladesh 2026: October promo checklist', 'bonusTrust', 'durga puja betting bonus', 'Durga Puja creates Q4 seasonal promotion searches.', 'Seasonal October promo guide.', ['durga-puja', 'seasonal'])
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
    heroBase: `${slug}-hero`,
    heroFile: `${slug}-hero.webp`,
    heroOptimizedWebp: `${slug}-hero-optimized.webp`,
    heroOptimizedAvif: `${slug}-hero-optimized.avif`,
    detailBase: `${slug}-detail`,
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
  const quoted = block.match(new RegExp(`^${key}:\\s*["'](.+?)["']\\s*$`, 'm'));
  if (quoted) return quoted[1].trim();
  const plain = block.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
  return plain ? plain[1].replace(/^"|"$/g, '').trim() : '';
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
    brandApp: `${topic.primaryKeyword} নিয়ে Bangladesh users-এর জন্য official BoroJeet app/APK, registration, bonus tracking, login safety এবং fake-link warning explained।`,
    cricket: `${topic.primaryKeyword} নিয়ে Bengali-focused cricket guide: app/site selection, live odds, market rules, payment safety এবং responsible bankroll checklist।`,
    worldCup: `${topic.primaryKeyword} নিয়ে FIFA World Cup 2026-এর আগে Bangladesh readers-এর জন্য football markets, app setup, payment timing এবং risk-control guide।`,
    casinoLegal: `${topic.primaryKeyword} নিয়ে Bangladesh online gaming context: legal risk, site trust, casino game basics, payment safety এবং scam warning।`,
    crashCash: `${topic.primaryKeyword} নিয়ে Bangla crash/cash-game guide: rules, cashout, bankroll, prediction myth এবং responsible play checklist।`,
    payments: `${topic.primaryKeyword} নিয়ে local wallet payment guide: bKash, Nagad, Rocket, verification, failed deposit, withdrawal timing এবং safety proof।`,
    bonusTrust: `${topic.primaryKeyword} নিয়ে Bangla bonus guide: wagering, turnover, reward terms, seasonal promo, account risk এবং responsible gambling checklist।`
  };
  return base[topic.cluster];
}

function faq(topic) {
  return [
    [`${topic.primaryKeyword} search করলে প্রথমে কী দেখব?`, `প্রথমে official source, rules, payment method, এবং risk warning দেখুন। ${topic.primaryKeyword} topic-এ অনেক outdated বা exaggerated claim থাকতে পারে।`],
    ['এই guide কি guaranteed win শেখায়?', 'না। এখানে strategy বলতে rules বোঝা, risk কমানো, bankroll cap, এবং fake claim avoid করা বোঝানো হয়েছে।'],
    ['BoroJeet app ব্যবহার করলে tracking কীভাবে রাখব?', 'Register on the website first to claim your bonus, then download the app for the best experience.']
  ];
}

function howto(topic) {
  return [
    ['Search intent আলাদা করুন', `আপনি ${topic.primaryKeyword} দিয়ে app, rule, bonus, payment, নাকি legal answer খুঁজছেন তা আগে ঠিক করুন।`],
    ['Official path verify করুন', 'Mirror link, fake APK, copied logo, বা unsupported payment claim দেখলে আগে support page check করুন।'],
    ['Terms পড়ে তারপর action নিন', 'Bonus, withdrawal, odds settlement, or market rules না বুঝলে বড় stake নেবেন না।'],
    ['Limit set করুন', 'Session budget, stop-loss, এবং time limit আগে set করে responsible play বজায় রাখুন।']
  ];
}

function body(topic) {
  const cfg = clusterConfig[topic.cluster];
  const links = cfg.links;
  const images = imageNames(topic.slug);
  const faqs = faq(topic);
  const steps = howto(topic);
  const l = label(topic);
  const relatedLinks = links.map(item => `[${item.title}](${item.url})`).join(', ');

  return `---
layout: "post.njk"
lang: "bn-BD"
title: ${escapeFrontmatter(topic.title)}
description: ${escapeFrontmatter(description(topic))}
date: ${START_DATE}
lastUpdated: ${START_DATE}
ogImage: ${escapeFrontmatter(images.ogOptimizedWebp)}
ogImageAlt: ${escapeFrontmatter(`${l} visual guide for Bangladesh readers`)}
tags: [${['"post"', ...topic.tags.map(tag => escapeFrontmatter(tag))].join(', ')}]
review:
  itemReviewed: ${escapeFrontmatter(topic.primaryKeyword)}
  ratingValue: 4.3
  bestRating: 5
faq:
${faqs.map(([question, answer]) => `  - question: ${escapeFrontmatter(question)}\n    answer: ${escapeFrontmatter(answer)}`).join('\n')}
howto:
  name: ${escapeFrontmatter(`${l} workflow`)}
  description: ${escapeFrontmatter(`${topic.primaryKeyword} topic নিয়ে safe decision নেওয়ার practical workflow।`)}
  steps:
${steps.map(([name, text]) => `    - name: ${escapeFrontmatter(name)}\n      text: ${escapeFrontmatter(text)}`).join('\n')}
---

<p class="lead">${l} নিয়ে search demand বাড়ছে কারণ Bangladesh user-রা এখন app, payment, bonus, legal risk এবং live market একসাথে compare করতে চায়। এই guide ${topic.primaryKeyword} query-র exact intent ধরে practical checklist দেয়, যাতে আপনি hype নয়—rules, safety এবং timing দেখে সিদ্ধান্ত নিতে পারেন।</p>

<picture class="content-image" data-critical="true">
  <source srcset="/assets/blog/${images.heroBase}-optimized.avif" type="image/avif">
  <source srcset="/assets/blog/${images.heroBase}-optimized.webp" type="image/webp">
  <img src="/assets/blog/${images.heroBase}-optimized.webp" alt="${l} hero visual" width="800" height="450" loading="eager" fetchpriority="high" decoding="async">
</picture>

## Search intent ও keyword opportunity

Google Search Console signal অনুযায়ী এই cluster-এ opportunity আছে: ${topic.gscSignal}। এর মানে হলো user interest আছে, কিন্তু page intent, title match, internal links এবং topic coverage আরও precise করলে ranking ও CTR উন্নত হতে পারে।

এই page-এর angle: ${topic.angle} Related background দরকার হলে ${relatedLinks} পড়ুন।

## Quick answer

${topic.primaryKeyword} নিয়ে decision নেওয়ার সময় তিনটি বিষয় আগে check করুন: official source, payment / bonus terms, এবং risk limit। শুধু app download বা high-odds headline দেখেই action নিলে fake APK, wrong payment path, বা bonus tracking হারানোর risk থাকে।

## Practical checklist

- Official website থেকে শুরু করুন; copied link বা random APK avoid করুন।
- Register on the website first to claim your bonus, then download the app for the best experience.
- Payment method ব্যবহার করলে transaction ID, amount, time, এবং wallet number মিলিয়ে রাখুন।
- Bonus claim করলে wagering / turnover / expiry / eligible game আগে পড়ুন।
- Live sports বা crash-style game হলে pre-set stop-loss ছাড়া session শুরু করবেন না।

<picture class="content-image">
  <source srcset="/assets/blog/${images.detailBase}-optimized.avif" type="image/avif">
  <source srcset="/assets/blog/${images.detailBase}-optimized.webp" type="image/webp">
  <img src="/assets/blog/${images.detailBase}-optimized.webp" alt="${l} checklist visual" width="800" height="450" loading="lazy" decoding="async">
</picture>

## Common mistakes

প্রথম mistake হলো viral trick, signal, বা guaranteed return claim বিশ্বাস করা। Betting এবং casino-style game probability-based entertainment; long-term profit guarantee নয়। দ্বিতীয় mistake হলো payment বা bonus terms না পড়ে deposit করা। তৃতীয় mistake হলো wrong app source বা fake logo দেখে trust ধরে নেওয়া।

## When to publish / use this guide

এই topic ${cfg.label} cluster-এর অংশ। Upcoming events, app updates, seasonal bonuses, World Cup football, Asia Cup cricket, এবং local wallet maintenance window-এর আগে এই page organic search traffic capture করতে সাহায্য করবে।

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
      coreConcept: `${l}, premium editorial hero scene for Bangladesh digital gaming search intent, central symbolic smartphone and analytics dashboard`,
      prompt: buildPremiumImagePrompt(`${l}, premium editorial hero scene for Bangladesh digital gaming search intent, central symbolic smartphone and analytics dashboard`)
    },
    {
      filename: `assets/blog/${topic.slug}-detail.webp`,
      coreConcept: `${l}, close-up decision checklist interface with safe mobile wallet, probability, and risk-control visual elements`,
      prompt: buildPremiumImagePrompt(`${l}, close-up decision checklist interface with safe mobile wallet, probability, and risk-control visual elements`)
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

  for (const item of topics) {
    if (seen.has(item.slug)) {
      throw new Error(`Duplicate new topic slug: ${item.slug}`);
    }
    seen.add(item.slug);

    if (existing.has(item.slug)) {
      throw new Error(`Topic slug already exists in blog/: ${item.slug}`);
    }
  }
}

function inferClusterFromMeta(item) {
  const text = `${item.slug} ${item.title} ${item.tags || ''}`.toLowerCase();
  if (/world-cup|fifa|football|epl|la-liga|champions|europa|goal|corner|btts|score|asian-handicap|penalty/.test(text)) return 'worldCup';
  if (/cricket|ipl|bpl|asia-cup|wicket|powerplay|session|toss|odi|test-match|baji/.test(text)) return 'cricket';
  if (/borojeet|boro-jeet|app|apk|login|download|account|otp|browser|device|kyc|registration/.test(text)) return 'brandApp';
  if (/crash|aviator|jetx|funky|crazy|cash-game|cash-or-crash|plane/.test(text)) return 'crashCash';
  if (/bkash|nagad|rocket|deposit|withdraw|cashout|payment|wallet|logo/.test(text)) return 'payments';
  if (/bonus|promo|vip|cashback|rebate|wagering|turnover|eid|puja/.test(text)) return 'bonusTrust';
  if (/casino|slot|roulette|baccarat|blackjack|legal|gambling|jua|safe|scam|license/.test(text)) return 'casinoLegal';
  return 'casinoLegal';
}

function priorityFor(item) {
  const text = `${item.slug} ${item.title} ${item.tags || ''}`.toLowerCase();
  const isNew = item.source === BATCH_ID;
  let base = 900;

  if (/borojeet|boro-jeet|apk|app-download|official|registration|otp|install|login/.test(text)) base = 10;
  if (/cricket|baji|asia-cup|toss|wicket|over-by-over/.test(text)) base = Math.min(base, 22);
  if (/champions|europa/.test(text)) base = Math.min(base, 24);
  if (/world-cup|fifa|football|asian-handicap|penalty|corner|yellow-card|final-match|opening/.test(text)) base = Math.min(base, 30);
  if (/bkash|nagad|rocket|payment|deposit|withdrawal|wallet/.test(text)) base = Math.min(base, 42);
  if (/crash|cash-game|aviator|crazy-time|funky-time/.test(text)) base = Math.min(base, 52);
  if (/online-gambling|jua|legal|casino|slot|licensed|fake/.test(text)) base = Math.min(base, 62);
  if (/bonus|wagering|rebate|vip|eid|durga|free-spin/.test(text)) base = Math.min(base, 72);
  if (isNew) base -= 4;
  if (/world-cup-2026/.test(text)) base -= 5;
  if (/avg position (5|6|7|8|9|[1-9][0-9])/.test(item.gscSignal || '')) base -= 3;

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

function writeReport(newTopicDetails, scheduled) {
  const byDate = scheduled.map(item => `| ${item.date} | ${item.slot} | ${item.source === BATCH_ID ? 'wave2-new' : 'existing-unpublished'} | ${item.cluster} | ${item.slug} | ${item.title.replace(/\|/g, '\\|')} |`).join('\n');
  const newRows = newTopicDetails.map(item => `| ${item.scheduledDate || ''} | ${item.cluster} | ${item.slug} | ${item.primaryKeyword.replace(/\|/g, '\\|')} | ${item.gscSignal.replace(/\|/g, '\\|')} | ${item.angle.replace(/\|/g, '\\|')} |`).join('\n');
  const eventRows = eventCalendar.map(item => `| ${item.window} | ${item.focus.replace(/\|/g, '\\|')} | ${item.schedulingAction.replace(/\|/g, '\\|')} |`).join('\n');

  const report = `# GSC Expansion Wave 2 Report\n\nGenerated: ${TODAY}\n\n## Strategy\n\nThis wave adds 100 new articles based on the latest GSC screenshot evidence: brand/app/APK terms ranking well but needing SERP protection, Bengali cricket app terms with clicks, and low-ranking but visible commercial/legal/crash/payment queries. The schedule prioritizes brand/app and cricket pages first, then World Cup 2026 football before kickoff, followed by payment, crash, casino/legal, Asia Cup cricket, and seasonal bonus windows.\n\n## Event Calendar Used\n\n| Window | Focus | Scheduling action |\n|---|---|---|\n${eventRows}\n\n## New 100 Topics\n\n| Scheduled date | Cluster | Slug | Primary keyword | GSC signal | Angle |\n|---|---|---|---|---|---|\n${newRows}\n\n## All Unpublished / Future-Dated Topics After Reschedule\n\nMax posts per day: 2\n\n| Date | Slot | Source | Cluster | Slug | Title |\n|---|---:|---|---|---|---|\n${byDate}\n`;

  fs.writeFileSync(REPORT_FILE, report, 'utf8');
}

function main() {
  fs.mkdirSync(PUBLISHING_DIR, { recursive: true });
  assertUniqueTopics();

  const prompts = [];
  const articleFiles = [];

  for (const item of topics) {
    const target = slugToFile(item.slug);
    fs.writeFileSync(target, body(item), 'utf8');
    articleFiles.push(`blog/${item.slug}.md`);
    prompts.push(...promptTasksFor(item));
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
      source: 'Google Search Console Wave 2 opportunity expansion, Bangladesh betting/gaming keywords, May 2026'
    }
  }, null, 2)}\n`, 'utf8');

  const scheduled = applySchedule();
  const newTopicDetails = topics.map(item => ({
    slug: item.slug,
    file: `blog/${item.slug}.md`,
    title: item.title,
    cluster: item.cluster,
    primaryKeyword: item.primaryKeyword,
    gscSignal: item.gscSignal,
    angle: item.angle,
    scheduledDate: scheduled.find(scheduleItem => scheduleItem.slug === item.slug)?.date || null
  }));

  const unpublishedTopics = scheduled.map(({ date, slot, file, slug, title, cluster, source }) => ({ date, slot, file, slug, title, cluster, source }));

  fs.writeFileSync(PLAN_FILE, `${JSON.stringify({
    generatedAt: TODAY,
    batchId: BATCH_ID,
    strategySummary: {
      objective: 'Create 100 new, non-duplicative articles using GSC opportunity data and reschedule all unpublished topics around the next six months of Bangladesh betting demand.',
      newArticleCount: topics.length,
      unpublishedScheduledCount: scheduled.length,
      maxPostsPerDay: 2
    },
    keywordOpportunityBuckets,
    eventCalendar,
    newTopics: newTopicDetails,
    unpublishedTopics
  }, null, 2)}\n`, 'utf8');

  writeReport(newTopicDetails, scheduled);

  console.log(`✅ Created ${articleFiles.length} GSC expansion wave 2 articles.`);
  console.log(`🖼️  Wrote ${prompts.length} prompt tasks: ${path.relative(ROOT_DIR, PROMPTS_FILE)}`);
  console.log(`📦 Wrote manifest: ${path.relative(ROOT_DIR, MANIFEST_FILE)}`);
  console.log(`🗓️  Rescheduled ${scheduled.length} unpublished/future-dated articles with max 2/day.`);
  console.log(`📊 Wrote plan/report: ${path.relative(ROOT_DIR, PLAN_FILE)} / ${path.relative(ROOT_DIR, REPORT_FILE)}`);
}

main();
