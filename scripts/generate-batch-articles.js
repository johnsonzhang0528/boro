const fs = require('fs');
const path = require('path');
const { buildPremiumImagePrompt } = require('./premium-image-prompts');

const ROOT_DIR = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'blog');
const PUBLISHING_DATA_DIR = path.join(ROOT_DIR, 'data', 'publishing');
const PROMPTS_FILE = path.join(PUBLISHING_DATA_DIR, 'batch-prompts-100.json');
const BASE_DATE = '2026-05-02';

const clusterLinks = {
    payments: [
        { title: 'Common Deposit Issues & Solutions', url: '/blog/common-deposit-issues-solutions-bangladesh/' },
        { title: 'Transaction ID Guide', url: '/blog/transaction-id-usage-guide/' },
        { title: 'How to Withdraw Winnings from BoroJeet', url: '/blog/how-to-withdraw-winnings-from-borojeet/' }
    ],
    account: [
        { title: 'Boro Jeet Registration Guide 2026', url: '/blog/boro-jeet-registration-guide-2026/' },
        { title: 'Boro Jeet Safety & Security', url: '/blog/boro-jeet-safety-security/' },
        { title: 'How to Secure Your Account with Two-Factor Authentication', url: '/blog/two-factor-authentication/' }
    ],
    sports: [
        { title: 'Football Betting Guide Bangladesh', url: '/blog/football-betting-guide-bangladesh/' },
        { title: 'Ultimate Guide to Cricket Betting in Bangladesh', url: '/blog/ultimate-guide-to-cricket-betting-in-bangladesh/' },
        { title: 'Scorecast & Wincast Betting Explained', url: '/blog/scorecast-wincast-betting/' }
    ],
    live: [
        { title: 'Live Baccarat Guide Bangladesh', url: '/blog/live-baccarat-guide-bangladesh/' },
        { title: 'Baccarat Roadmaps Explained', url: '/blog/baccarat-roadmaps-explained/' },
        { title: 'Monopoly Live Strategy Guide', url: '/blog/monopoly-live-strategy-guide/' }
    ],
    bonus: [
        { title: 'Bonus Wagering Verification', url: '/blog/bonus-wagering-verification/' },
        { title: 'BoroJeet VIP Program Guide', url: '/blog/borojeet-vip-program-guide-levels-rewards/' },
        { title: 'How to Claim Referral Bonus on BoroJeet', url: '/blog/how-to-claim-referral-bonus-borojeet/' }
    ],
    slots: [
        { title: 'Slot Volatility Explained', url: '/blog/slot-volatility-explained/' },
        { title: 'How to Read Slot Paytables', url: '/blog/how-to-read-slot-paytables/' },
        { title: 'Pragmatic Play Buy Feature Strategy', url: '/blog/pragmatic-play-buy-feature-strategy/' }
    ],
    comparison: [
        { title: 'BoroJeet vs JeetBuzz Comparison', url: '/blog/borojeet-vs-jeetbuzz-comparison/' },
        { title: 'Boro Jeet vs Nagad88 Review', url: '/blog/boro-jeet-vs-nagad88-review/' },
        { title: 'Boro Jeet vs Betvisa Bonus Reviews', url: '/blog/boro-jeet-vs-betvisa-bonus-reviews/' }
    ]
};

const clusterTags = {
    payments: ['payments', 'troubleshooting', 'guide'],
    account: ['account', 'security', 'guide'],
    sports: ['sports-betting', 'guide', 'strategy'],
    live: ['live-casino', 'guide', 'strategy'],
    bonus: ['bonus', 'guide', 'borojeet'],
    slots: ['slots', 'guide', 'strategy'],
    comparison: ['comparison', 'review', 'borojeet']
};

function topic(slug, title, cluster, tags = []) {
    return { slug, title, cluster, tags: [...new Set([...clusterTags[cluster], ...tags])] };
}

const topics = [
    topic('bkash-withdrawal-pending-after-approval', 'bKash Withdrawal Pending After Approval: কী করবেন?', 'payments', ['bkash', 'withdrawal']),
    topic('nagad-wrong-number-withdrawal-recovery', 'Nagad Wrong Number Withdrawal Recovery: ভুল নম্বর গেলে সমাধান কী?', 'payments', ['nagad', 'withdrawal']),
    topic('rocket-cashout-pending-after-midnight', 'Rocket Cashout Pending After Midnight: রাতের পরে দেরি হলে কী বুঝবেন?', 'payments', ['rocket', 'cashout']),
    topic('payment-method-hidden-after-login', 'Payment Method Hidden After Login: Deposit Option হঠাৎ উধাও হলে', 'payments', ['deposit']),
    topic('duplicate-deposit-request-problem', 'Duplicate Deposit Request Problem: একই ডিপোজিট দুইবার গেলে কী করবেন?', 'payments', ['deposit']),
    topic('change-withdrawal-method-after-request', 'Change Withdrawal Method After Request: Request দেওয়ার পরে method বদলানো যায়?', 'payments', ['withdrawal']),
    topic('missing-bonus-after-first-deposit', 'Missing Bonus After First Deposit: বোনাস না এলে কোথায় দেখবেন?', 'payments', ['bonus', 'deposit']),
    topic('withdrawal-under-review-meaning', 'Withdrawal Under Review Meaning: এই status আসলে কী বোঝায়?', 'payments', ['withdrawal']),
    topic('daily-withdrawal-limit-reset-time', 'Daily Withdrawal Limit Reset Time: limit কখন reset হয়?', 'payments', ['withdrawal', 'limits']),
    topic('payment-name-mismatch-fix', 'Payment Name Mismatch Fix: account name না মিললে সমাধান', 'payments', ['kyc']),
    topic('bkash-cash-out-fee-calculator-guide', 'bKash Cash Out Fee Calculator Guide: আসল net amount কীভাবে বুঝবেন', 'payments', ['bkash', 'fees']),
    topic('nagad-cash-out-fee-calculator-guide', 'Nagad Cash Out Fee Calculator Guide: payout হাতে কত পাবেন?', 'payments', ['nagad', 'fees']),
    topic('rocket-vs-bkash-withdrawal-speed', 'Rocket vs bKash Withdrawal Speed: কোন method দ্রুত?', 'payments', ['rocket', 'bkash', 'comparison']),
    topic('screenshot-proof-for-payment-support', 'Screenshot Proof for Payment Support: support-এ কী screenshot পাঠাবেন?', 'payments', ['support']),
    topic('manual-deposit-verification-time', 'Manual Deposit Verification Time: manual approve হতে কতক্ষণ লাগে?', 'payments', ['deposit']),
    topic('withdrawal-reversal-to-wallet-explained', 'Withdrawal Reversal to Wallet Explained: টাকা wallet-এ ফেরত এলে মানে কী?', 'payments', ['withdrawal']),
    topic('bonus-balance-vs-cash-balance-withdrawal', 'Bonus Balance vs Cash Balance Withdrawal: কোন টাকা আগে withdraw হবে?', 'payments', ['bonus', 'withdrawal']),
    topic('failed-payment-after-network-timeout', 'Failed Payment After Network Timeout: টাকা কাটা গেলেও update না এলে', 'payments', ['network', 'deposit']),
    topic('pending-deposit-after-trxid-submission', 'Pending Deposit After TrxID Submission: TrxID দেওয়ার পরেও pending কেন?', 'payments', ['trxid', 'deposit']),
    topic('payment-history-not-showing-fix', 'Payment History Not Showing Fix: transaction history ফাঁকা হলে কী করবেন?', 'payments', ['history']),

    topic('change-registered-email-borojeet', 'Change Registered Email on BoroJeet: email বদলাতে কী লাগে?', 'account', ['email']),
    topic('login-from-new-device-security-check', 'Login From New Device Security Check: নতুন device-এ login করলে কী হয়?', 'account', ['login', 'security']),
    topic('account-under-review-how-long', 'Account Under Review: কতক্ষণ লাগে এবং কী প্রস্তুত রাখবেন?', 'account', ['review']),
    topic('session-expired-login-fix', 'Session Expired Login Fix: বারবার logout হলে সমাধান', 'account', ['login']),
    topic('app-crashing-after-update-fix', 'App Crashing After Update Fix: update-এর পরে app crash হলে', 'account', ['app']),
    topic('apk-signature-mismatch-fix', 'APK Signature Mismatch Fix: install error এলে কী করবেন?', 'account', ['apk', 'app']),
    topic('browser-vs-app-performance-borojeet', 'Browser vs App Performance on BoroJeet: কোনটা দ্রুত?', 'account', ['app', 'browser']),
    topic('clear-app-storage-without-losing-account', 'Clear App Storage Without Losing Account: data clear করলেও account থাকবে?', 'account', ['app']),
    topic('suspicious-login-alert-what-to-do', 'Suspicious Login Alert: alert এলে সঙ্গে সঙ্গে কী করবেন?', 'account', ['security', 'alert']),
    topic('email-otp-not-received-borojeet', 'Email OTP Not Received on BoroJeet: mail না এলে fix কী?', 'account', ['otp', 'email']),
    topic('sms-otp-delay-bangladesh-fix', 'SMS OTP Delay Bangladesh Fix: OTP দেরি হলে workaround', 'account', ['otp', 'sms']),
    topic('password-reset-link-expired-fix', 'Password Reset Link Expired Fix: link মেয়াদ শেষ হলে', 'account', ['password']),
    topic('multiple-device-login-policy', 'Multiple Device Login Policy: এক account কত device-এ ব্যবহার করা যায়?', 'account', ['policy']),
    topic('identity-verification-selfie-rejected', 'Identity Verification Selfie Rejected: selfie reject হলে কী বদলাবেন?', 'account', ['kyc', 'selfie']),
    topic('kyc-address-proof-guide', 'KYC Address Proof Guide: address proof হিসেবে কী accepted?', 'account', ['kyc']),
    topic('uninstall-reinstall-borojeet-app', 'Uninstall and Reinstall BoroJeet App: clean reinstall guide', 'account', ['app']),
    topic('play-without-app-mobile-browser', 'Play Without App on Mobile Browser: app ছাড়াই full site ব্যবহার', 'account', ['browser', 'app']),
    topic('push-notifications-not-working-borojeet', 'Push Notifications Not Working on BoroJeet: notification fix guide', 'account', ['notifications', 'app']),
    topic('account-login-location-mismatch', 'Account Login Location Mismatch: location alert কেন আসে?', 'account', ['security', 'login']),
    topic('secure-shared-phone-login-guide', 'Secure Shared Phone Login Guide: shared phone-এ safe login কীভাবে করবেন?', 'account', ['security']),

    topic('asian-total-goals-betting-guide', 'Asian Total Goals Betting Guide: Over/Under-এর advanced version', 'sports', ['football', 'asian-total']),
    topic('draw-no-bet-vs-double-chance', 'Draw No Bet vs Double Chance: কোন market বেশি practical?', 'sports', ['football', 'comparison']),
    topic('correct-score-betting-bankroll-tips', 'Correct Score Betting Bankroll Tips: high-odds market কীভাবে খেলবেন', 'sports', ['football', 'high-odds']),
    topic('first-goalscorer-vs-anytime-goalscorer', 'First Goalscorer vs Anytime Goalscorer: value কোথায় বেশি?', 'sports', ['football', 'goalscorer']),
    topic('player-props-cricket-betting-guide', 'Player Props Cricket Betting Guide: batter ও bowler props কীভাবে ধরবেন', 'sports', ['cricket', 'player-props']),
    topic('sixes-market-cricket-betting-guide', 'Sixes Market Cricket Betting Guide: total sixes market বোঝার নিয়ম', 'sports', ['cricket', 'totals']),
    topic('corners-over-under-live-betting', 'Corners Over/Under Live Betting: live match-এ corner market analysis', 'sports', ['football', 'corners']),
    topic('both-halves-over-0-5-goals', 'Both Halves Over 0.5 Goals: market logic ও match selection', 'sports', ['football', 'goals']),
    topic('team-total-runs-cricket-guide', 'Team Total Runs Cricket Guide: innings line পড়ার সহজ পদ্ধতি', 'sports', ['cricket', 'team-total']),
    topic('test-match-session-betting-guide', 'Test Match Session Betting Guide: session বাজারে value খোঁজার নিয়ম', 'sports', ['cricket', 'session-betting']),
    topic('toss-winner-vs-match-winner-correlation', 'Toss Winner vs Match Winner Correlation: correlation কতটা real?', 'sports', ['cricket', 'toss']),
    topic('over-1-5-goals-vs-over-2-5-goals', 'Over 1.5 Goals vs Over 2.5 Goals: কোন line safer?', 'sports', ['football', 'over-under']),
    topic('handicap-vs-spread-betting-basketball', 'Handicap vs Spread Betting in Basketball: line বুঝবেন কীভাবে', 'sports', ['basketball', 'spread']),
    topic('player-points-line-shopping-guide', 'Player Points Line Shopping Guide: NBA props-এ line compare কেন জরুরি', 'sports', ['basketball', 'player-props']),
    topic('outrights-vs-match-betting-football', 'Outrights vs Match Betting Football: long-term নাকি short-term market?', 'sports', ['football', 'outrights']),
    topic('early-cashout-vs-full-time-value', 'Early Cashout vs Full-Time Value: cash out করলে value হারাচ্ছেন?', 'sports', ['cashout', 'education']),
    topic('extra-time-betting-rules-guide', 'Extra Time Betting Rules Guide: 90 মিনিট নাকি 120 মিনিট গণনা হবে?', 'sports', ['football', 'rules']),
    topic('rain-affected-match-betting-rules', 'Rain-Affected Match Betting Rules: DLS হলে bet settle কীভাবে হয়?', 'sports', ['cricket', 'rules']),
    topic('powerplay-betting-cricket-guide', 'Powerplay Betting Cricket Guide: প্রথম ৬ ওভারের market analysis', 'sports', ['cricket', 'powerplay']),
    topic('wicket-method-betting-explained', 'Wicket Method Betting Explained: caught, bowled, lbw market কী?', 'sports', ['cricket', 'special-markets']),

    topic('banker-player-commission-explained', 'Banker Player Commission Explained: Baccarat-এ commission কেন কাটা হয়?', 'live', ['baccarat']),
    topic('baccarat-shoe-length-explained', 'Baccarat Shoe Length Explained: shoe count result-এ effect ফেলে?', 'live', ['baccarat']),
    topic('roulette-neighbor-bets-guide', 'Roulette Neighbor Bets Guide: racetrack bet বোঝার সহজ নিয়ম', 'live', ['roulette']),
    topic('lightning-roulette-multiplier-risk-guide', 'Lightning Roulette Multiplier Risk Guide: multiplier chase করা কি ঠিক?', 'live', ['roulette', 'lightning-roulette']),
    topic('dragon-tiger-side-bets-explained', 'Dragon Tiger Side Bets Explained: Tie ও suited bet-এর risk কত?', 'live', ['dragon-tiger']),
    topic('sic-bo-big-small-best-bet-guide', 'Sic Bo Big/Small Best Bet Guide: low-risk bet কোনটি?', 'live', ['sic-bo']),
    topic('teen-patti-seen-vs-blind-guide', 'Teen Patti Seen vs Blind Guide: decision timing কীভাবে বুঝবেন', 'live', ['teen-patti']),
    topic('andar-bahar-first-card-probability', 'Andar Bahar First Card Probability: first card দেখে edge পাওয়া যায়?', 'live', ['andar-bahar']),
    topic('monopoly-live-2-rolls-vs-4-rolls', 'Monopoly Live 2 Rolls vs 4 Rolls: কোন bonus segment বেশি value?', 'live', ['monopoly-live']),
    topic('cash-or-crash-collect-vs-cashout', 'Cash or Crash Collect vs Cashout: collect strategy কবে better?', 'live', ['cash-or-crash']),
    topic('blackjack-soft-hands-guide', 'Blackjack Soft Hands Guide: soft 17 থেকে soft 20 decision chart', 'live', ['blackjack']),
    topic('blackjack-surrender-guide', 'Blackjack Surrender Guide: surrender option কবে ব্যবহার করবেন?', 'live', ['blackjack']),
    topic('dream-catcher-top-slot-probability', 'Dream Catcher Top Slot Probability: top slot কতটা rare?', 'live', ['dream-catcher']),
    topic('mega-ball-bonus-ticket-explained', 'Mega Ball Bonus Ticket Explained: bonus card ও payout কীভাবে কাজ করে', 'live', ['mega-ball']),
    topic('live-casino-latency-fairness-guide', 'Live Casino Latency Fairness Guide: delay মানেই unfair নাকি network issue?', 'live', ['fairness']),

    topic('reload-bonus-vs-cashback-guide', 'Reload Bonus vs Cashback Guide: কোন reward model বেশি useful?', 'bonus', ['reload-bonus', 'cashback']),
    topic('free-spin-bonus-terms-explained', 'Free Spin Bonus Terms Explained: free spins claim করার আগে কী দেখবেন', 'bonus', ['free-spins']),
    topic('vip-rakeback-vs-cashback', 'VIP Rakeback vs Cashback: long-term player-এর জন্য কোনটা ভালো?', 'bonus', ['vip', 'cashback']),
    topic('referral-link-not-tracking-fix', 'Referral Link Not Tracking Fix: referral click track না হলে কী করবেন?', 'bonus', ['referral']),
    topic('no-bonus-withdrawal-speed-guide', 'No Bonus Withdrawal Speed Guide: bonus ছাড়া খেললে payout দ্রুত হয়?', 'bonus', ['withdrawal']),
    topic('bonus-abuse-what-counts', 'Bonus Abuse: আসলে কোন কাজগুলো abuse হিসেবে ধরা হয়?', 'bonus', ['bonus-abuse']),
    topic('weekend-reload-bonus-guide', 'Weekend Reload Bonus Guide: reload claim করার smart checklist', 'bonus', ['reload-bonus']),
    topic('birthday-bonus-eligibility-guide', 'Birthday Bonus Eligibility Guide: birthday reward পেতে কী লাগে?', 'bonus', ['birthday-bonus']),
    topic('promo-code-not-working-fix', 'Promo Code Not Working Fix: code invalid দেখালে কী করবেন?', 'bonus', ['promo-code']),
    topic('loyalty-points-conversion-guide', 'Loyalty Points Conversion Guide: points কখন cash এ convert করবেন?', 'bonus', ['loyalty-points']),

    topic('scatter-vs-wild-symbols-explained', 'Scatter vs Wild Symbols Explained: slot symbol mechanics সহজ ভাষায়', 'slots', ['slot-mechanics']),
    topic('cascading-slots-for-beginners', 'Cascading Slots for Beginners: tumbling reels কীভাবে কাজ করে?', 'slots', ['cascading']),
    topic('multiplier-wilds-explained', 'Multiplier Wilds Explained: wild multiplier effect কতটা strong?', 'slots', ['wilds']),
    topic('demo-mode-vs-real-money-slots', 'Demo Mode vs Real Money Slots: RTP কি একই থাকে?', 'slots', ['demo-mode']),
    topic('autoplay-safety-settings-slots', 'Autoplay Safety Settings in Slots: autoplay চালু করলে কী limit দেবেন?', 'slots', ['autoplay']),
    topic('slot-hit-frequency-check-guide', 'Slot Hit Frequency Check Guide: RTP ছাড়াও কী metric দেখবেন?', 'slots', ['hit-frequency']),
    topic('volatility-vs-max-win-slots', 'Volatility vs Max Win in Slots: high max win মানেই কি high volatility?', 'slots', ['volatility']),
    topic('buy-feature-house-edge-explained', 'Buy Feature House Edge Explained: feature buy-এর hidden cost কী?', 'slots', ['buy-feature']),
    topic('bonus-hunt-explained-beginners', 'Bonus Hunt Explained for Beginners: bonus hunt safe কি না?', 'slots', ['bonus-hunt']),
    topic('slot-session-budget-planning', 'Slot Session Budget Planning: session bankroll আগে কীভাবে সেট করবেন', 'slots', ['bankroll']),

    topic('borojeet-vs-jeetbuzz-withdrawal-speed', 'BoroJeet vs JeetBuzz Withdrawal Speed: cashout কে দ্রুত দেয়?', 'comparison', ['withdrawal-speed']),
    topic('borojeet-vs-linebet-app-safety', 'BoroJeet vs Linebet App Safety: app permission ও security তুলনা', 'comparison', ['app-safety']),
    topic('borojeet-vs-melbet-bonus-terms', 'BoroJeet vs Melbet Bonus Terms: turnover কোনখানে সহজ?', 'comparison', ['bonus-terms']),
    topic('borojeet-vs-betvisa-cashout-limits', 'BoroJeet vs Betvisa Cashout Limits: payout cap কোথায় practical?', 'comparison', ['cashout-limits']),
    topic('borojeet-vs-nagad88-customer-support', 'BoroJeet vs Nagad88 Customer Support: support quality কোথায় ভালো?', 'comparison', ['customer-support'])
];

function buildDescription(topic) {
    const label = extractLabel(topic.title);
    const map = {
        payments: `${label} নিয়ে সমস্যায় আছেন? এই Bengali guide-এ reasons, fix steps, waiting time, এবং support message template জানুন।`,
        account: `${label} সমস্যা কীভাবে সমাধান করবেন, কোন security check normal, আর কখন support-এ যেতে হবে তা এই guide-এ explained।`,
        sports: `${label} market কীভাবে কাজ করে, কোন data analyse করবেন, এবং কোন mistakes avoid করবেন তা এই Bengali guide-এ জানুন।`,
        live: `${label} rules, payout logic, risk points এবং practical strategy এই guide-এ সহজ ভাষায় ব্যাখ্যা করা হয়েছে।`,
        bonus: `${label} claim, terms, turnover impact এবং common errors সম্পর্কে Bengali dominant explanation এখানে পাবেন।`,
        slots: `${label} mechanic কী, RTP বা volatility-এর সাথে এর সম্পর্ক কী, আর bankroll কীভাবে manage করবেন তা জানুন।`,
        comparison: `${label} comparison-এ bonus, payments, trust, support এবং user fit বিশ্লেষণ করা হয়েছে যাতে choice নেওয়া সহজ হয়।`
    };

    return map[topic.cluster];
}

function extractLabel(title) {
    return title.replace(/[:?].*$/, '').trim();
}

function buildFaq(topic) {
    const label = extractLabel(topic.title);
    const clusterFaq = {
        payments: [
            [`${label} problem-এর সবচেয়ে common কারণ কী?`, `${label} issue সাধারণত pending review, name mismatch, wrong method, অথবা network delay-এর কারণে দেখা যায়।`],
            ['আমি support-এ কী পাঠাব?', 'Amount, time, payment method, request ID বা TrxID, এবং relevant screenshot পাঠানো সবচেয়ে কার্যকর।'],
            ['কতক্ষণ wait করলে support-এ যাব?', 'যদি expected waiting window পেরিয়ে যায় বা status আটকে থাকে, তখন live chat support-এ যোগাযোগ করুন।']
        ],
        account: [
            [`${label} issue কি account block-এর লক্ষণ?`, 'সবসময় না। অনেক সময় এটি security verification, OTP delay, বা cached app data-এর কারণে হয়।'],
            ['কোন তথ্য আগে verify করব?', 'Registered email, phone, last login time, device details, এবং security settings আগে check করুন।'],
            ['কখন support-এ ticket খুলব?', 'Self-fix steps কাজ না করলে এবং একই error বারবার এলে support-এ structured ticket খুলুন।']
        ],
        sports: [
            [`${label} market beginners-দের জন্য suitable?`, 'শুরুতে suitable হতে পারে, তবে market rules এবং settlement logic আগে বুঝে নেওয়া জরুরি।'],
            ['সবচেয়ে বড় mistake কী?', 'Single stat দেখে bet নেওয়া। Team news, pace, venue, and line movement একসাথে দেখতে হয়।'],
            ['Bankroll কীভাবে manage করব?', 'Flat stake বা low-risk percentage model ব্যবহার করুন, high-variance market-এ chase করবেন না।']
        ],
        live: [
            [`${label} খেলায় house edge কি গুরুত্বপূর্ণ?`, 'হ্যাঁ। RTP বা house edge long-term ফলাফলে বড় প্রভাব ফেলে, তাই payout chart আগে দেখা উচিত।'],
            ['কোন ভুল সবচেয়ে common?', 'Pattern chasing, tilt betting, আর payout দেখে risk underestimate করা সবচেয়ে common ভুল।'],
            ['Live table delay কি normal?', 'হালকা streaming delay normal, তবে repeated lag হলে connection বা device side check করতে হবে।']
        ],
        bonus: [
            [`${label} claim করার আগে কী check করব?`, 'Eligibility, turnover, expiry time, eligible games, এবং withdrawal impact আগে check করুন।'],
            ['Bonus cancel করলে কী হবে?', 'অনেক ক্ষেত্রে bonus funds বা related winnings forfeit হতে পারে, তাই terms আগে পড়া দরকার।'],
            ['Support-এ গেলে কোন proof লাগবে?', 'Promo code, deposit time, bonus page screenshot, এবং account ID দিলে resolution দ্রুত হয়।']
        ],
        slots: [
            [`${label} কি RTP-এর বিকল্প metric?`, 'পুরোপুরি বিকল্প নয়, তবে hit frequency, feature rate, variance, এবং max win context বোঝা জরুরি।'],
            ['Demo mode থেকে real money result predict করা যায়?', 'না। Mechanics একই থাকতে পারে, কিন্তু bankroll pressure এবং decision-making real mode-এ আলাদা হয়।'],
            ['Session limit রাখা কেন জরুরি?', 'Slots high-variance হতে পারে, তাই pre-set budget এবং stop-loss ছাড়া খেলা risk বাড়ায়।']
        ],
        comparison: [
            [`${label} comparison-এ শুধু bonus দেখলেই হবে?`, 'না। Withdrawal speed, limits, support quality, এবং trust signals একসাথে দেখা উচিত।'],
            ['সব user-এর জন্য একই winner হবে?', 'না। Low-stakes user, bonus hunter, high-volume bettor, আর fast-cashout user-এর চাহিদা আলাদা।'],
            ['Payment speed verify করার best way কী?', 'Published limits, user reports, pending rules, এবং support response quality একসাথে compare করুন।']
        ]
    };

    return clusterFaq[topic.cluster];
}

function buildHowTo(topic) {
    const label = extractLabel(topic.title);
    const map = {
        payments: [
            ['Transaction status খুলুন', 'Wallet বা cashier section থেকে relevant request-এর status, time, এবং method check করুন।'],
            ['Mismatch খুঁজুন', 'Amount, account name, payment number, TrxID বা request ID ঠিক আছে কিনা verify করুন।'],
            ['Support-ready proof নিন', 'Screenshot, time, এবং payment reference একসাথে লিখে রাখুন।'],
            ['Structured message পাঠান', `${label} issue clear language-এ live chat বা support-এ পাঠান।`]
        ],
        account: [
            ['Login context check করুন', 'Current device, browser, app version, OTP channel, এবং network state note করুন।'],
            ['Basic reset করুন', 'App relaunch, cache clear, বা browser refresh দিয়ে issue reproduce করুন।'],
            ['Identity info verify করুন', 'Email, phone, KYC name, and security settings মিলে কিনা check করুন।'],
            ['Escalate করুন', 'Repeated failure থাকলে exact error message সহ support-এ যান।']
        ],
        sports: [
            ['Market rules পড়ুন', `${label} market settle কীভাবে হয় তা আগে বুঝে নিন।`],
            ['Context data দেখুন', 'Lineups, venue, pace, form, and odds movement একসাথে analyse করুন।'],
            ['Stake plan ঠিক করুন', 'High-variance market হলে flat stake বা reduced stake ব্যবহার করুন।'],
            ['Result review করুন', 'Bet শেষে process review করে model refine করুন।']
        ],
        live: [
            ['Rules বুঝুন', `${label} game-এর payout, commission, বা segment logic আগে পড়ুন।`],
            ['Low-risk angle বেছে নিন', 'Table বা wheel structure দেখে conservative option identify করুন।'],
            ['Session limit দিন', 'Time limit, loss limit, এবং target outcome আগে সেট করুন।'],
            ['Result log রাখুন', 'Short session notes রাখলে pattern chasing কমে।']
        ],
        bonus: [
            ['Offer details খুলুন', 'Bonus page থেকে expiry, turnover, eligible games, এবং cap check করুন।'],
            ['Claim timing ঠিক করুন', 'Deposit, code entry, বা VIP eligibility timing মিস করবেন না।'],
            ['Progress track করুন', 'Wagering বা reward dashboard regular check করুন।'],
            ['Withdrawal impact বুঝুন', 'Bonus active থাকলে cashout rule কী হবে তা আগেই দেখুন।']
        ],
        slots: [
            ['Mechanic identify করুন', `${label} আসলে base game নাকি bonus feature-এ বেশি active তা বুঝুন।`],
            ['Variance accept করুন', 'Short session result দিয়ে long-term expectation judge করবেন না।'],
            ['Bankroll cap দিন', 'Spin size এবং stop-loss আগে সেট করুন।'],
            ['Notes রাখুন', 'Feature rate বা session cost লিখে রাখলে decision improve হয়।']
        ],
        comparison: [
            ['Criteria সেট করুন', 'Bonus, payments, support, trust, and usability weighted list তৈরি করুন।'],
            ['Hard data compare করুন', 'Published limits, waiting times, and promo terms compare করুন।'],
            ['User fit ভাবুন', 'আপনি fast payout, low turnover, নাকি better app চান তা আগে ঠিক করুন।'],
            ['Decision lock করুন', 'One-size-fits-all answer না ধরে আপনার use case অনুযায়ী final choice নিন।']
        ]
    };

    return map[topic.cluster];
}

function registrationNote(topic) {
    if (/(app|apk|install|browser)/i.test(topic.slug)) {
        return 'নতুন user হলে bonus track ঠিক রাখতে আগে website-এ register করুন, তারপর app install বা mobile browser login ব্যবহার করুন।';
    }

    return '';
}

function bodyTemplate(topic, images) {
    const links = clusterLinks[topic.cluster];
    const label = extractLabel(topic.title);
    const faq = buildFaq(topic);
    const howto = buildHowTo(topic);
    const note = registrationNote(topic);

    const firstLink = `[${links[0].title}](${links[0].url})`;
    const secondLink = `[${links[1].title}](${links[1].url})`;
    const thirdLink = `[${links[2].title}](${links[2].url})`;

    const clusterSections = {
        payments: `## ${label} কেন হয়

${label} issue সাধারণত তিন ধরনের root cause থেকে আসে: payment method mismatch, queue delay, অথবা compliance check. এই তিনটা আলাদা না করলে user ভুল action নেয়, আর resolution time আরও বেড়ে যায়। ${firstLink} আর ${secondLink} আগে দেখলে workflow clearer হয়。

## কীভাবে দ্রুত diagnose করবেন

প্রথমে status, amount, method, আর account name একসাথে মিলিয়ে দেখুন। অনেক সময় user শুধু pending বা failed label দেখে react করে, কিন্তু actual mismatch থাকে payment number, TrxID, বা method selection-এ। যদি withdrawal context হয়, তাহলে ${thirdLink} related rules-ও check করুন。

## Step-by-step fix

1. Wallet বা cashier history খুলুন
2. Request time এবং amount note করুন
3. Payment method, number, name, এবং status মিলিয়ে দেখুন
4. Screenshot নিন
5. Support-এ short but structured message পাঠান

<picture class="content-image">
  <source srcset="/assets/blog/${images.detailBase}.avif" type="image/avif">
  <source srcset="/assets/blog/${images.detailBase}.webp" type="image/webp">
  <img src="/assets/blog/${images.detailBase}.webp" alt="A mobile payment history interface representing ${label}" width="800" height="450" loading="lazy" decoding="async">
</picture>

## কোন ভুলগুলো avoid করবেন

সবচেয়ে common mistake হলো একই issue-র জন্য multiple requests পাঠানো। দ্বিতীয় ভুল হলো incomplete support message। তৃতীয় ভুল হলো অপেক্ষা না করে নতুন payment attempt দিয়ে আরও conflict তৈরি করা。

## Final takeaway

${label} issue resolve করতে speed-এর চেয়ে clarity বেশি গুরুত্বপূর্ণ। Exact status, proof, আর context একসাথে দিলে support resolution অনেক দ্রুত হয়।`,
        account: `## ${label} issue সাধারণত কোথা থেকে শুরু হয়

Account বা app-related সমস্যা সবসময় serious breach না। অনেক সময় session cache, OTP delay, device switch, বা security review-এর কারণে issue দেখা যায়। ${firstLink}, ${secondLink}, এবং ${thirdLink} এই cluster-এ strong reference point। ${note}

## Root cause identify করার shortcut

প্রথমে দেখুন problem কি login layer-এ, app layer-এ, নাকি identity verification layer-এ। একই error message হলেও fix path আলাদা হতে পারে। App crash হলে version and storage দেখবেন; OTP না এলে delivery path দেখবেন; security alert হলে recent login history দেখবেন。

## Recovery workflow

1. Error reproduce করুন
2. Device, app version, browser, network note করুন
3. Cache clear বা relogin try করুন
4. Registered email ও phone verify করুন
5. প্রয়োজন হলে support-এ exact message পাঠান

<picture class="content-image">
  <source srcset="/assets/blog/${images.detailBase}.avif" type="image/avif">
  <source srcset="/assets/blog/${images.detailBase}.webp" type="image/webp">
  <img src="/assets/blog/${images.detailBase}.webp" alt="A secure account settings screen representing ${label}" width="800" height="450" loading="lazy" decoding="async">
</picture>

## Security-first approach

যদি issue security related হয়, password change, 2FA check, এবং recent sessions review আগে করুন। Shared phone বা new device use করলে extra verification normal হতে পারে。

## Final takeaway

${label} issue fix করার সময় blind retry না করে context collect করুন। এতে account safe থাকে এবং resolution faster হয়।`,
        sports: `## ${label} market কী

${label} market বা angle বোঝার আগে settlement rule বুঝতে হবে। অনেক bettor odds দেখে market নেয়, কিন্তু rule nuance না বোঝার কারণে bad expectation তৈরি হয়। ${firstLink}, ${secondLink}, এবং ${thirdLink} থেকে broader betting context মিলিয়ে নিলে decision quality ভালো হয়。

## Analysis framework

এই ধরনের market analyse করতে line movement, team news, venue profile, tempo, এবং historical fit একসাথে দেখতে হয়। Single stat-driven bet long term-এ টেকে না। Value আসলে price আর probability-এর gap থেকে আসে。

## Practical betting approach

1. Market rule confirm করুন
2. Pre-match context note করুন
3. Odds compare করুন
4. Flat stake model ব্যবহার করুন
5. Result review করে assumption লিখে রাখুন

<picture class="content-image">
  <source srcset="/assets/blog/${images.detailBase}.avif" type="image/avif">
  <source srcset="/assets/blog/${images.detailBase}.webp" type="image/webp">
  <img src="/assets/blog/${images.detailBase}.webp" alt="A sports betting dashboard representing ${label}" width="800" height="450" loading="lazy" decoding="async">
</picture>

## Common traps

Recency bias, fan bias, এবং cashout temptation এই cluster-এ সবচেয়ে common trap। High-odds market হলে bankroll discipline আরও গুরুত্বপূর্ণ হয়。

## Final takeaway

${label} profitable হতে পারে, কিন্তু rule clarity আর disciplined staking ছাড়া না। Market বুঝে, line compare করে, then execution নিন।`,
        live: `## ${label} বোঝার মূল জায়গা

Live casino market বা game-এ outcome random হলেও structure random না। Payout, commission, segment distribution, আর decision timing আগে বুঝলে user mistakes কমে। ${firstLink}, ${secondLink}, এবং ${thirdLink} এই cluster-এ ভালো companion reading। 

## কোথায় edge নেই, কোথায় control আছে

এই ধরনের গেমে mathematical edge সাধারণত platform-এর পক্ষেই থাকে। User control থাকে mainly bet selection, session length, এবং risk sizing-এ। তাই strategy মানে prediction না, বরং exposure control。

## Practical play checklist

1. Rules আবার পড়ুন
2. Lowest-risk segments identify করুন
3. Session loss limit set করুন
4. Fast chasing avoid করুন
5. Tilt start হলে session stop করুন

<picture class="content-image">
  <source srcset="/assets/blog/${images.detailBase}.avif" type="image/avif">
  <source srcset="/assets/blog/${images.detailBase}.webp" type="image/webp">
  <img src="/assets/blog/${images.detailBase}.webp" alt="A live casino table interface representing ${label}" width="800" height="450" loading="lazy" decoding="async">
</picture>

## কোন ক্ষেত্রে এই market skip করবেন

যদি rule fully না বোঝেন, payout deceptive লাগে, বা session already loss heavy হয়, তাহলে এই market skip করা better. Entertainment value আর expected value আলাদা জিনিস。

## Final takeaway

${label} উপভোগ করতে চাইলে rules first, bankroll second, emotion last রাখুন। তাহলেই session more controlled হবে।`,
        bonus: `## ${label} আসলে কী দেয়

Bonus-related offer দেখতে attractive হলেও real value depend করে turnover, expiry, cap, eligible games, এবং withdrawal rules-এর উপর। তাই শুধু headline bonus দেখে claim করা practical না। ${firstLink}, ${secondLink}, এবং ${thirdLink} আগে পড়লে context clear হবে。

## Claim করার আগে checklist

Offer claim করার আগে eligibility, minimum deposit, promo code, game contribution, এবং expiry time check করুন। অনেক user reward claim করে পরে বুঝে যে withdraw-ready balance তৈরি হয়নি。

## Smart usage workflow

1. Offer terms খুলুন
2. Goal ঠিক করুন: volume, cashback, fast withdrawal, নাকি VIP progress
3. Eligible games confirm করুন
4. Wagering progress track করুন
5. Exit condition আগে ঠিক করুন

<picture class="content-image">
  <source srcset="/assets/blog/${images.detailBase}.avif" type="image/avif">
  <source srcset="/assets/blog/${images.detailBase}.webp" type="image/webp">
  <img src="/assets/blog/${images.detailBase}.webp" alt="A rewards dashboard representing ${label}" width="800" height="450" loading="lazy" decoding="async">
</picture>

## Common mistakes

Promo code ভুল দেওয়া, expiry miss করা, wrong game-এ play করা, আর bonus balance vs cash balance না বোঝা সবচেয়ে common ভুল。

## Final takeaway

${label} useful হতে পারে, যদি terms আগে বুঝে use করেন। Bonus value headline-এ না, actual convertibility-তে।`,
        slots: `## ${label} কেন গুরুত্বপূর্ণ

Slot mechanics বুঝলে শুধু entertainment না, bankroll control-ও better হয়। অনেক player RTP জানে, কিন্তু mechanic, feature rate, আর variance context বোঝে না। ${firstLink}, ${secondLink}, এবং ${thirdLink} এই cluster-এ useful companion guide। 

## কীভাবে evaluate করবেন

এই topic evaluate করতে RTP, hit frequency, bonus frequency, max win narrative, আর session cost একসাথে ভাবুন। Demo mode helpful, কিন্তু real-money pressure absent থাকায় execution difference থাকে。

## Practical session method

1. Mechanic identify করুন
2. Bet size bankroll অনুযায়ী set করুন
3. Session target fix করুন
4. Feature chase avoid করুন
5. Result note করুন

<picture class="content-image">
  <source srcset="/assets/blog/${images.detailBase}.avif" type="image/avif">
  <source srcset="/assets/blog/${images.detailBase}.webp" type="image/webp">
  <img src="/assets/blog/${images.detailBase}.webp" alt="A slot analysis interface representing ${label}" width="800" height="450" loading="lazy" decoding="async">
</picture>

## Player psychology trap

Near-miss, feature anticipation, আর session extension tendency slot play-এ common trap। Pre-set budget ছাড়া mechanic knowledge-ও যথেষ্ট না。

## Final takeaway

${label} বুঝলে better decision হয়, কিন্তু it does not create guaranteed wins. Goal হওয়া উচিত informed play, not false certainty。`,
        comparison: `## ${label} comparison কীভাবে দেখা উচিত

Comparison article-এর biggest mistake হলো only one metric দেখে verdict দেওয়া। Practical comparison করতে bonus terms, withdrawal speed, app safety, support quality, trust signals, and user fit একসাথে দেখতে হয়। ${firstLink}, ${secondLink}, এবং ${thirdLink} এই comparison cluster-এ useful reference। 

## Comparison framework

একজন low-stakes user আর একজন fast-withdrawal-focused user একই winner বেছে নাও নিতে পারে। তাই comparison-এর আগে নিজের priority list বানান। Payment friction, identity checks, promo flexibility, আর support responsiveness often decide the real winner。

## Decision workflow

1. আপনার top priority লিখুন
2. Bonus terms compare করুন
3. Payment rules compare করুন
4. Trust and support compare করুন
5. Final choice নিজের use case অনুযায়ী নিন

<picture class="content-image">
  <source srcset="/assets/blog/${images.detailBase}.avif" type="image/avif">
  <source srcset="/assets/blog/${images.detailBase}.webp" type="image/webp">
  <img src="/assets/blog/${images.detailBase}.webp" alt="A comparison dashboard representing ${label}" width="800" height="450" loading="lazy" decoding="async">
</picture>

## Final takeaway

${label} comparison-এ best answer universal না। আপনার priority যদি speed, safety, bonus simplicity, বা app experience হয়, verdict সেটার উপর depend করবে।`
    };

    return `---
layout: "post.njk"
lang: "bn-BD"
title: ${JSON.stringify(topic.title)}
description: ${JSON.stringify(buildDescription(topic))}
date: ${BASE_DATE}
lastUpdated: ${BASE_DATE}
ogImage: ${JSON.stringify(images.ogFile)}
ogImageAlt: ${JSON.stringify(`${extractLabel(topic.title)} visual for BoroJeet readers`)}
tags: [${['"post"', ...topic.tags.map(tag => JSON.stringify(tag))].join(', ')}]
faq:
${faq.map(([question, answer]) => `  - question: ${JSON.stringify(question)}\n    answer: ${JSON.stringify(answer)}`).join('\n')}
howto:
  name: ${JSON.stringify(`${extractLabel(topic.title)} workflow`)}
  description: ${JSON.stringify(`${extractLabel(topic.title)} topic দ্রুত বুঝে action নেওয়ার short workflow।`)}
  steps:
${howto.map(([name, text]) => `    - name: ${JSON.stringify(name)}\n      text: ${JSON.stringify(text)}`).join('\n')}
---

<p class="lead">${extractLabel(topic.title)} নিয়ে confusion থাকা স্বাভাবিক, কারণ এই topic-এ rule, risk, timing, আর expectation একসাথে কাজ করে। এই guide-এর লক্ষ্য হলো jargon কমিয়ে practical decision framework দেওয়া, যাতে আপনি blind guess না করে informed action নিতে পারেন।</p>

<picture class="content-image" data-critical="true">
  <source srcset="/assets/blog/${images.heroBase}.avif" type="image/avif">
  <source srcset="/assets/blog/${images.heroBase}.webp" type="image/webp">
  <img src="/assets/blog/${images.heroBase}.webp" alt="A featured visual representing ${extractLabel(topic.title)}" width="800" height="450" loading="eager" fetchpriority="high" decoding="async">
</picture>

${clusterSections[topic.cluster]}
`;
}

function buildPrompt(topic, filename, variant) {
    const label = extractLabel(topic.title);
    const sceneMap = {
        hero: `${label}, premium article hero composition with one central symbolic focal object and contextual abstract elements`,
        detail: `${label}, close-up detail composition with one clear symbolic focal object and refined abstract interface-inspired geometry`,
        og: `${label}, wide hero composition with one central symbolic focal object and generous negative space for social sharing`
    };
    const coreConcept = sceneMap[variant];

    return {
        filename,
        coreConcept,
        prompt: buildPremiumImagePrompt(coreConcept)
    };
}

function imageNames(slug) {
    return {
        heroFile: `${slug}-hero.webp`,
        heroBase: `${slug}-hero`,
        detailFile: `${slug}-detail.webp`,
        detailBase: `${slug}-detail`,
        ogFile: `og-${slug}.webp`,
        ogBase: `og-${slug}`
    };
}

function ensureUniqueSlugs(topicList) {
    const seen = new Set();
    for (const item of topicList) {
        if (seen.has(item.slug)) {
            throw new Error(`Duplicate slug detected: ${item.slug}`);
        }
        seen.add(item.slug);
    }
}

function main() {
    ensureUniqueSlugs(topics);
    fs.mkdirSync(PUBLISHING_DATA_DIR, { recursive: true });

    const prompts = [];
    let created = 0;
    let skipped = 0;

    for (const item of topics) {
        const targetPath = path.join(BLOG_DIR, `${item.slug}.md`);
        if (fs.existsSync(targetPath)) {
            skipped += 1;
            continue;
        }

        const images = imageNames(item.slug);
        const body = bodyTemplate(item, images);
        fs.writeFileSync(targetPath, body, 'utf8');

        prompts.push(buildPrompt(item, `assets/blog/${images.heroFile}`, 'hero'));
        prompts.push(buildPrompt(item, `assets/blog/${images.detailFile}`, 'detail'));
        prompts.push(buildPrompt(item, `assets/og/${images.ogFile}`, 'og'));

        created += 1;
    }

    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2), 'utf8');

    console.log(`✅ Created ${created} article drafts.`);
    console.log(`⏭️  Skipped ${skipped} existing files.`);
    console.log(`📝 Wrote ${prompts.length} prompts to ${path.basename(PROMPTS_FILE)}.`);
}

main();