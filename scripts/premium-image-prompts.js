const STABILITY_MODEL = 'stable-diffusion-xl-1024-v1-0';

const PREMIUM_IMAGE_PROMPT_TEMPLATE = 'A high-quality flat 2D minimalist modern editorial poster illustration representing [CORE_CONCEPT], vertical 9:16 mobile SEO composition, one single centered symbolic scene, no panels, no collage, no people. If a smartphone appears, show exactly one front-view smartphone floating in space or resting on a clean office desk, never held by a hand. Use a calm premium tech-and-finance aesthetic, subtle gradients, crisp vector-like forms, generous negative space, no complex interface text, no readable words.';

const PREMIUM_IMAGE_PROMPT_PREFIX = 'A high-quality flat 2D minimalist modern editorial illustration representing ';
const PREMIUM_IMAGE_PROMPT_SUFFIX = ', vertical 9:16 mobile SEO composition, one single centered symbolic scene, no panels, no collage, no people. If a smartphone appears, show exactly one front-view smartphone floating in space or resting on a clean office desk, never held by a hand. Use a calm premium tech-and-finance aesthetic, subtle gradients, crisp vector-like forms, generous negative space, no complex interface text, no readable words.';

const LEGACY_PREMIUM_IMAGE_PROMPT_PREFIX = 'Create a high-end, premium 3D conceptual illustration representing the theme of ';
const LEGACY_PREMIUM_IMAGE_PROMPT_SUFFIX = '. The style should be a sophisticated modern editorial illustration, avoiding any flat, basic, or cheap clip-art looks. Use soft ambient occlusion, smooth textures, and cinematic studio lighting. The color palette should be professional, harmonious, and modern, utilizing subtle gradients and glowing accents. The composition must be clean, balanced, and centralized against a minimalist, uncluttered background. Include sleek, abstract geometric elements to elevate the aesthetic. Rendered in 8K resolution, masterpiece, highly detailed, Unreal Engine 5 and Octane Render style, premium corporate and tech aesthetic. Do not include any text or words in the image.';

const DEFAULT_NEGATIVE_PROMPT = 'typography, letters, alphabet, words, readable text, fake text, pseudo text, gibberish text, lorem ipsum, captions, labels, numbers, dates, UI text, menu labels, interface labels, tiny text, dense dashboard, scoreboard text, realistic app screen, social media icon, app icon, icon swarm, notification badge, people, person, human, small people, mini people, business people, athlete, player, player icon, miniature player, pawn marker, token person, silhouette, crowd, face, body, jersey, sports uniform, character, mascot, portrait, human hands, fingers, hand holding phone, person holding smartphone, multiple phones, many phones, extra phone, phone grid, device grid, second device, laptop, tablet, computer monitor, isometric, 3D render, three dimensional, photorealistic device, coin, coins, gold coin, coin pile, money pile, casino chip, gambling chip, token pile, shoe, shoes, boot, boots, cleats, glove, gloves, sportswear, tactic board, strategy board, formation diagram, field board, goalpost, stadium scene, scenic landscape, nature panorama, lake, boat, mountain, forest, panels, comic panels, collage, grid layout, split screen, multiple panels, storyboard, multiple scenes, multiple balls, duplicated balls, extra balls, watermark, logo, real brand marks, real team emblems, QR code, barcode, cash piles, clutter, bad anatomy, extra limbs, missing limbs, mutated hands, poorly drawn face, deformed, ugly, melted faces, messy lines, illogical architecture, photorealistic people, cheap clip art, low quality, jpeg artifacts, blurry, out of frame.';

const TOPIC_PROMPT_PROFILES = [
    {
        id: 'mobile_app_account',
        label: 'mobile app, APK, login, account access',
        keywords: ['app', 'mobile', 'browser', 'website', 'android', 'apk', 'download', 'login', 'register', 'registration', 'account', 'password', 'otp', 'verification', 'install', 'cache', 'storage'],
        scene: 'exactly one large flat front-view smartphone floating in open space on a clean abstract gradient background, with a completely blank solid-color screen and one oversized shield icon beside it',
        objects: 'exactly one front-view floating smartphone with blank solid screen, one shield icon, one checkmark symbol, one update arrow, simple abstract background shapes',
        palette: 'royal blue, teal, pearl white, muted gold accents',
        avoid: 'no hand holding phone, no extra phones, no device grid, no people, no mini people, no app-store badges, no social media icons, no app icons, no readable passwords, no app interface text, no crowded settings screen, no isometric 3D scene'
    },
    {
        id: 'payments_wallets',
        label: 'mobile wallet payments and transaction safety',
        keywords: ['bkash', 'nagad', 'rocket', 'payment', 'deposit', 'withdraw', 'withdrawal', 'wallet', 'trxid', 'cash out', 'fee', 'low deposit', '50 taka'],
        scene: 'exactly one large flat front-view smartphone floating above a clean desk with a completely blank solid-color screen, one abstract wallet shape, one lock shape, and a few simple transaction dots',
        objects: 'exactly one front-view floating smartphone with blank solid screen, one generic wallet shape, one lock, one checkmark symbol, receipt silhouette without text, simple slider',
        palette: 'emerald, magenta accent, warm gold, graphite, clean white',
        avoid: 'no real wallet logos, no QR code, no account number, no coins, no piles of money, no readable receipt text, no extra phones, no people, no mini people, no app icons, no app interface text, no isometric 3D scene'
    },
    {
        id: 'cricket_strategy',
        label: 'cricket sports analytics and match strategy',
        keywords: ['cricket', 'bpl', 'ipl', 'asia cup', 'wicket', 'innings', 'toss', 'over', 'run rate', 'powerplay', 'six', 'player performance'],
        scene: 'a clean still-life cricket analytics poster with exactly one oversized cricket ball only on a plain abstract gradient background, two soft probability arcs, and one subtle geometric wicket marker, no pitch map, no tactics board, no players',
        objects: 'exactly one cricket ball, soft probability arcs, one abstract wicket-like marker, simple geometric dots, blank rounded cards without text',
        palette: 'stadium green, midnight blue, ivory, amber highlights',
        avoid: 'no real team logos, no player likenesses, no athletes, no silhouettes, no player icons, no tactical board, no jerseys, no shoes, no equipment clutter, no readable scoreboard, no duplicated balls, no extra balls'
    },
    {
        id: 'football_strategy',
        label: 'football sports analytics and tournament planning',
        keywords: ['football', 'soccer', 'world cup', 'fifa', 'goal', 'corner', 'over under', 'extra time', 'half-time', 'full-time', 'yellow card', 'clean sheet'],
        scene: 'a clean still-life football analytics poster with exactly one oversized football only on a plain abstract gradient background, two soft probability arcs, and subtle geometric dots, no pitch lines, no goal frame, no tactics board, no players',
        objects: 'exactly one football, soft probability arcs, simple geometric dots, blank rounded match cards without text',
        palette: 'grass green, electric blue, graphite, stadium gold',
        avoid: 'no federation logo, no national flag, no player likeness, no athletes, no silhouettes, no player icons, no tactics board, no formation markers, no jerseys, no shoes, no boots, no readable match score, no multiple balls, no extra balls'
    },
    {
        id: 'basketball_strategy',
        label: 'basketball line analysis and court geometry',
        keywords: ['basketball', 'nba', 'spread', 'handicap', 'quarter', 'points line', 'player points'],
        scene: 'a clean still-life basketball analysis poster with exactly one oversized basketball only on a plain abstract gradient background, simple probability rings, and a clean blank comparison card, no court diagram, no players',
        objects: 'exactly one basketball, soft probability rings, simple slider, blank rounded cards without text',
        palette: 'burnt orange, midnight navy, cream, teal accent',
        avoid: 'no league logos, no player likeness, no athletes, no silhouettes, no player icons, no tactic board, no jerseys, no shoes, no duplicated balls, no extra balls, no text-heavy chart'
    },
    {
        id: 'slots_games',
        label: 'slot mechanics and game selection education',
        keywords: ['slot', 'slots', 'scatter', 'wild', 'free spins', 'rtp', 'volatility', 'demo mode', 'provider', 'max win', 'cascading'],
        scene: 'a minimal abstract game mechanics poster with clean reel shapes, volatility gauge, reward icons, and a simple budget-control bar, all icon-only',
        objects: 'abstract blank reels without symbols, gem-like icons, gauge without numbers, clean budget bar, soft geometric blocks',
        palette: 'violet, black glass, neon cyan, soft gold',
        avoid: 'no jackpot numbers, no brand logos, no coin explosion, no guarantee symbols, no readable reel labels'
    },
    {
        id: 'live_table_games',
        label: 'live table game rules and probability education',
        keywords: ['roulette', 'blackjack', 'baccarat', 'sic bo', 'teen patti', 'andar bahar', 'dragon tiger', 'monopoly live', 'mega ball', 'dream catcher', 'live casino'],
        scene: 'a refined tabletop probability poster with one central game object, clean rule markers, and restrained safety controls, no dealer or people',
        objects: 'roulette wheel or card deck or dice based on context, small neutral marker shapes, boundary markers, blank probability cards without text',
        palette: 'deep emerald, burgundy, black glass, warm studio gold',
        avoid: 'no dealer faces, no readable card labels, no excessive tokens, no coins, no money piles, no crowded casino floor'
    },
    {
        id: 'bonus_rewards',
        label: 'bonus terms, turnover, rebate, VIP and reward rules',
        keywords: ['bonus', 'wagering', 'turnover', 'rebate', 'vip', 'free bonus', 'no deposit', 'promotion', 'cashback', 'reward', 'loyalty'],
        scene: 'a minimal reward-terms poster with layered blank cards, progress ring, checklist icons, and a locked terms panel without text',
        objects: 'blank reward card, progress ring without numbers, checklist icons, lock, calendar icon without date, safe wallet icon',
        palette: 'indigo, gold, emerald, pearl white',
        avoid: 'no readable bonus amount, no gift spam, no fake guarantee, no coupon collage, no coins, no money piles'
    },
    {
        id: 'legal_safety',
        label: 'legal risk, safety, scam warning and responsible use',
        keywords: ['legal', 'law', 'safe', 'safety', 'scam', 'fake', 'warning', 'responsible', 'risk', 'kyc', 'aml', 'security', 'hacked', 'phishing'],
        scene: 'a serious trust-and-safety poster with shield, blank document shapes, warning marker, lock, and verification seal shapes',
        objects: 'shield, lock, alert triangle, blank document stack without text, verification stamp shape without letters, simple risk meter without numbers',
        palette: 'slate blue, dark graphite, white, restrained red warning accent',
        avoid: 'no courtroom drama, no police scene, no threatening imagery, no readable legal text'
    },
    {
        id: 'comparison_guide',
        label: 'comparison, review, guide and decision checklist',
        keywords: ['best', 'top', 'list', 'guide', 'comparison', 'review', 'sites', 'platform', 'strategy', 'explained', 'checklist'],
        scene: 'a vertical mobile-first decision checklist with exactly one flat front-view floating smartphone, a completely blank solid-color screen, two blank comparison cards, and a trust shield',
        objects: 'exactly one front-view floating smartphone with blank solid screen, two blank comparison cards without text, shield, simple analytics markers, checklist shapes',
        palette: 'midnight blue, teal, soft gold, clean white highlights',
        avoid: 'no readable rankings, no brand logos, no text blocks, no collage layout, no hand holding phone, no extra phones, no people, no mini people, no app icons, no app interface text, no isometric 3D scene'
    }
];

const VARIANT_PROMPTS = {
    hero: 'Hero image: strong vertical mobile cover composition, one clear central subject, generous negative space, instantly understandable at thumbnail size, no typography.',
    detail: 'Detail/body image: close-up symbolic explainer composition, one concrete concept, oversized icon shapes, no labels and no typography.',
    og: 'Social preview image: bold vertical mobile preview composition, high contrast central object, one symbolic object, no small details and no typography.'
};

function isPremiumImagePrompt(prompt) {
    return typeof prompt === 'string'
        && (
            prompt.trim().startsWith(PREMIUM_IMAGE_PROMPT_PREFIX)
            || prompt.trim().startsWith(LEGACY_PREMIUM_IMAGE_PROMPT_PREFIX)
        );
}

function stripPromptBoilerplate(value) {
    return String(value || '')
        .replace(/--no\s+.+$/i, '')
        .replace(/,?\s*photorealistic,?\s*masterpiece,?\s*best quality,?\s*highly detailed,?\s*8k resolution,?\s*HDR,?\s*professional photography,?\s*cinematic lighting,?\s*sharp focus\s*$/i, '')
        .replace(/,?\s*masterpiece,?\s*best quality,?\s*highly detailed,?\s*8k resolution,?\s*HDR,?\s*professional photography,?\s*cinematic lighting,?\s*sharp focus\s*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function conceptFromLegacyTaskPrompt(prompt) {
    const text = stripPromptBoilerplate(prompt);
    const patterns = [
        /illustrating\s+(.+?)(?:,|$)/i,
        /visual\s+about\s+(.+?)(?:,|$)/i,
        /centered\s+on\s+(.+?)(?:,|$)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return text;
}

function normalizeCoreConcept(coreConcept) {
    return stripPromptBoilerplate(coreConcept)
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\.+$/, '');
}

function compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function deriveVariant(filename) {
    const normalized = String(filename || '').replace(/\\/g, '/');
    if (normalized.includes('/og/')) return 'og';
    if (normalized.includes('-detail.webp')) return 'detail';
    return 'hero';
}

function includesKeyword(text, keyword) {
    return text.includes(keyword.toLowerCase());
}

function primaryConcept(value) {
    return compactText(String(value || '').split(',')[0]);
}

function topicSignalText(coreConcept, context = {}) {
    const task = context.task || {};

    return compactText([
        context.filename,
        primaryConcept(coreConcept),
        primaryConcept(task.coreConcept)
    ].filter(Boolean).join(' ')).toLowerCase();
}

function detectPromptProfile(coreConcept, context = {}) {
    const text = topicSignalText(coreConcept, context);

    const byId = id => TOPIC_PROMPT_PROFILES.find(profile => profile.id === id);

    if (/bkash|nagad|rocket|payment|deposit|withdraw|withdrawal|wallet|trxid|cash out|fee/.test(text)) {
        return byId('payments_wallets');
    }

    if (/apk|android|login|register|registration|account|password|otp|verification|install|cache|storage/.test(text)) {
        return byId('mobile_app_account');
    }

    if (/cricket|bpl|ipl|asia cup|wicket|innings|toss|powerplay|run rate/.test(text)) {
        return byId('cricket_strategy');
    }

    if (/world cup|fifa|football|soccer|goal|corner|clean sheet|yellow card|penalty/.test(text)) {
        return byId('football_strategy');
    }

    if (/basketball|nba|spread|quarter|points line|player points/.test(text)) {
        return byId('basketball_strategy');
    }

    let bestProfile = TOPIC_PROMPT_PROFILES[TOPIC_PROMPT_PROFILES.length - 1];
    let bestScore = -1;

    for (const profile of TOPIC_PROMPT_PROFILES) {
        let score = 0;
        for (const keyword of profile.keywords) {
            if (includesKeyword(text, keyword)) score += 1;
        }

        if (score > bestScore) {
            bestScore = score;
            bestProfile = profile;
        }
    }

    return bestProfile;
}

function shouldUsePhoneRule(profile, coreConcept, context = {}) {
    if (['mobile_app_account', 'payments_wallets', 'comparison_guide'].includes(profile.id)) {
        return true;
    }

    return /smartphone|mobile app|mobile browser|android|apk|wallet|payment|deposit|withdraw|login|register|account/i.test(topicSignalText(coreConcept, context));
}

function profileCompositionRule(profile) {
    const sportProfiles = new Set(['cricket_strategy', 'football_strategy', 'basketball_strategy']);

    if (sportProfiles.has(profile.id)) {
        return 'Composition rule: still-life poster only, exactly one large centered ball on a plain abstract gradient background, no pitch layout, no court layout, no goal frame, no field board, no tactic board, no formation diagram, no player icons, no extra balls, no shoes, no boots, no human figure, no athletes, no jerseys, no silhouettes, no crowds, no multi-panel layout, no collage, no storyboard, no scenic landscape.';
    }

    return 'Composition rule: one poster only, one single scene only, one centered primary symbolic object, no multi-panel layout, no collage, no storyboard, no scenic landscape, no people, no athletes, no silhouettes, no crowds.';
}

function visualSubjectForProfile(profile) {
    switch (profile.id) {
        case 'mobile_app_account':
            return 'secure mobile app access and account verification concept';
        case 'payments_wallets':
            return 'mobile wallet payment verification and transaction safety concept';
        case 'cricket_strategy':
            return 'cricket match analysis and responsible decision-making concept';
        case 'football_strategy':
            return 'international football tournament analysis and responsible decision-making concept';
        case 'basketball_strategy':
            return 'basketball court analysis and responsible decision-making concept';
        case 'slots_games':
            return 'abstract game mechanics, volatility, and budget-control education concept';
        case 'live_table_games':
            return 'table game probability and rule education concept';
        case 'bonus_rewards':
            return 'bonus terms, reward progress, and budget-control education concept';
        case 'legal_safety':
            return 'trust, safety, compliance, and unsafe-app warning education concept';
        default:
            return 'safe comparison and decision checklist education concept';
    }
}

function truncateForStability(value, maxLength = 1900) {
    const text = compactText(value);
    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}.`;
}

function sanitizeCoreConceptForImage(value) {
    return compactText(value)
        .replace(/\b20\d{2}\b/g, '')
        .replace(/\bBD\b/gi, '')
        .replace(/Bangladesh/gi, 'South Asian')
        .replace(/World Cup/gi, 'international football tournament')
        .replace(/FIFA/gi, 'international football')
        .replace(/guide|checklist|plan|calendar|rules|explained|review|list/gi, 'education')
        .replace(/premium editorial hero scene for Bangladesh digital gaming search intent,?/gi, 'mobile-first educational poster,')
        .replace(/central symbolic smartphone and analytics dashboard/gi, 'one floating smartphone with blank screen and simple geometric indicators')
        .replace(/close-up decision checklist interface/gi, 'icon-only decision checklist')
        .replace(/wide social sharing composition/gi, 'clean vertical mobile poster composition')
        .replace(/analytics dashboard/gi, 'simple geometric indicator board')
        .replace(/dashboard/gi, 'blank geometric indicator board')
        .replace(/interface/gi, 'icon-only layout')
        .replace(/checklist/gi, 'icon checklist')
        .replace(/social sharing/gi, 'mobile preview')
        .replace(/online betting/gi, 'sports analytics')
        .replace(/sports betting/gi, 'sports analytics')
        .replace(/betting/gi, 'analytics')
        .replace(/online gambling/gi, 'regulated gaming literacy')
        .replace(/gambling/gi, 'gaming literacy')
        .replace(/casino/gi, 'game platform')
        .replace(/wagering requirements?/gi, 'bonus terms')
        .replace(/wagering/gi, 'bonus terms')
        .replace(/odds/gi, 'probability')
        .replace(/bankroll/gi, 'budget')
        .replace(/jackpot/gi, 'reward')
        .replace(/profit/gi, 'outcome');
}

function buildPremiumImagePrompt(coreConcept, context = {}) {
    const original = String(coreConcept || '').trim();

    if (isPremiumImagePrompt(original)) {
        return original;
    }

    const rawConcept = normalizeCoreConcept(coreConcept);
    let normalized = sanitizeCoreConceptForImage(rawConcept);
    const filename = context.filename || (context.task && context.task.filename) || '';
    const variant = deriveVariant(filename);
    const profile = detectPromptProfile(rawConcept, context);
    const usePhoneRule = shouldUsePhoneRule(profile, rawConcept, { ...context, filename });
    if (!usePhoneRule) {
        normalized = normalized
            .replace(/one floating smartphone with blank screen and simple geometric indicators/gi, 'one central symbolic object with simple geometric indicators')
            .replace(/central symbolic smartphone/gi, 'central symbolic object')
            .replace(/smartphone/gi, 'symbolic object')
            .replace(/mobile app/gi, 'educational')
            .replace(/mobile-first educational poster/gi, 'educational poster');
    }
    const phoneRule = usePhoneRule
        ? 'Phone rule: show exactly one smartphone only; the phone must be floating in space or lying flat on a clean office desk; never show a hand holding a phone and avoid visible fingers entirely; keep the screen completely blank or solid-color with no app UI, no letters, no numbers, no menu labels, and no extra devices.'
        : 'Do not include smartphones, tablets, laptops, or handheld devices unless explicitly required by the core subject.';

    return truncateForStability([
        `${PREMIUM_IMAGE_PROMPT_PREFIX}${visualSubjectForProfile(profile)}.`,
        `Topic style: ${profile.label}.`,
        `Scene: ${profile.scene}.`,
        `Key objects: ${profile.objects}.`,
        `Color palette: ${profile.palette}.`,
        VARIANT_PROMPTS[variant],
        profileCompositionRule(profile),
        'Style: flat 2D minimalist modern illustration, premium editorial cover art, crisp vector-like edges, subtle gradients, balanced vertical composition, clean empty background, mobile-first 9:16 framing, not 3D, not isometric.',
        phoneRule,
        'Interface rule: use only blank rounded rectangles, dots, icons, and geometric lines; screens must be blank or solid-color; do not draw complex interface text, readable letters, pseudo-letters, glyphs, tiny labels, numbers, dates, paragraphs, logos, brand marks, QR codes, or realistic app screens.',
        `Avoid: ${profile.avoid}.`,
        'Responsible educational tone, calm and practical, no hype, no promise of winning or guaranteed outcomes.'
    ].filter(Boolean).join(' '));
}

function extractCoreConceptFromPremiumPrompt(prompt) {
    const normalized = String(prompt || '').trim();

    if (normalized.startsWith(LEGACY_PREMIUM_IMAGE_PROMPT_PREFIX)) {
        const withoutPrefix = normalized.slice(LEGACY_PREMIUM_IMAGE_PROMPT_PREFIX.length);
        const suffixIndex = withoutPrefix.indexOf(LEGACY_PREMIUM_IMAGE_PROMPT_SUFFIX);
        return suffixIndex === -1 ? withoutPrefix : withoutPrefix.slice(0, suffixIndex).trim();
    }

    if (!normalized.startsWith(PREMIUM_IMAGE_PROMPT_PREFIX)) {
        return conceptFromLegacyTaskPrompt(normalized);
    }

    const withoutPrefix = normalized.slice(PREMIUM_IMAGE_PROMPT_PREFIX.length);
    const suffixIndex = withoutPrefix.indexOf(PREMIUM_IMAGE_PROMPT_SUFFIX);

    if (suffixIndex === -1) {
        return withoutPrefix;
    }

    return withoutPrefix.slice(0, suffixIndex).trim();
}

function coreConceptFromTask(task) {
    return normalizeCoreConcept(task.coreConcept || extractCoreConceptFromPremiumPrompt(task.prompt));
}

module.exports = {
    DEFAULT_NEGATIVE_PROMPT,
    PREMIUM_IMAGE_PROMPT_TEMPLATE,
    STABILITY_MODEL,
    buildPremiumImagePrompt,
    coreConceptFromTask,
    extractCoreConceptFromPremiumPrompt,
    isPremiumImagePrompt,
    sanitizeCoreConceptForImage
};