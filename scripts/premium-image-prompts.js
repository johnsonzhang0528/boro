const STABILITY_MODEL = 'sd3.5-large-turbo';

const PREMIUM_IMAGE_PROMPT_TEMPLATE = 'A high-end 3D conceptual editorial illustration representing [CORE_CONCEPT], single unified scene, perfect human anatomy, accurate physics, strict logical structure. Sophisticated modern style, cinematic studio lighting, soft ambient occlusion, smooth textures. Professional harmonious color palette, minimalist uncluttered background, centered clean composition. 8K resolution, masterpiece, ultra-detailed, Unreal Engine 5, Octane Render style, premium corporate aesthetic, trending on ArtStation.';

const PREMIUM_IMAGE_PROMPT_PREFIX = 'A high-end 3D conceptual editorial illustration representing ';
const PREMIUM_IMAGE_PROMPT_SUFFIX = ', single unified scene, perfect human anatomy, accurate physics, strict logical structure. Sophisticated modern style, cinematic studio lighting, soft ambient occlusion, smooth textures. Professional harmonious color palette, minimalist uncluttered background, centered clean composition. 8K resolution, masterpiece, ultra-detailed, Unreal Engine 5, Octane Render style, premium corporate aesthetic, trending on ArtStation.';

const LEGACY_PREMIUM_IMAGE_PROMPT_PREFIX = 'Create a high-end, premium 3D conceptual illustration representing the theme of ';
const LEGACY_PREMIUM_IMAGE_PROMPT_SUFFIX = '. The style should be a sophisticated modern editorial illustration, avoiding any flat, basic, or cheap clip-art looks. Use soft ambient occlusion, smooth textures, and cinematic studio lighting. The color palette should be professional, harmonious, and modern, utilizing subtle gradients and glowing accents. The composition must be clean, balanced, and centralized against a minimalist, uncluttered background. Include sleek, abstract geometric elements to elevate the aesthetic. Rendered in 8K resolution, masterpiece, highly detailed, Unreal Engine 5 and Octane Render style, premium corporate and tech aesthetic. Do not include any text or words in the image.';

const DEFAULT_NEGATIVE_PROMPT = 'bad anatomy, extra limbs, missing limbs, mutated hands, poorly drawn face, deformed, ugly, melted faces, floating objects, multiple balls, extra equipment, duplicated items, collage, grid layout, split screen, multiple panels, messy lines, illogical architecture, text, watermark, worst quality, low quality, jpeg artifacts, blurry, out of frame.';

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

function buildPremiumImagePrompt(coreConcept) {
    const original = String(coreConcept || '').trim();

    if (isPremiumImagePrompt(original)) {
        return original;
    }

    const normalized = normalizeCoreConcept(coreConcept);

    return `${PREMIUM_IMAGE_PROMPT_PREFIX}${normalized}${PREMIUM_IMAGE_PROMPT_SUFFIX}`;
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
    isPremiumImagePrompt
};