require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const sharp = require('sharp');
const {
    DEFAULT_NEGATIVE_PROMPT,
    STABILITY_MODEL,
    buildPremiumImagePrompt,
    coreConceptFromTask
} = require('./premium-image-prompts');

const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({ default: fetchImpl }) => fetchImpl(...args)));

const ROOT_DIR = path.resolve(__dirname, '..');
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const BLOG_DIR = 'blog';
const API_HOST = 'https://api.stability.ai';
const DEFAULT_PROMPTS_FILE = path.join(ROOT_DIR, 'prompts.json');
const DEFAULT_ASPECT_RATIO = '9:16';
const DEFAULT_CFG_SCALE = 7;
const DEFAULT_STEPS = 30;
const DEFAULT_STYLE_PRESET = 'digital-art';
const MAX_OPTIMIZED_WIDTH = 1536;
const WEBP_QUALITY = 75;
const MAX_STABILITY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 30000;
const MAX_RETRY_DELAY_MS = 120000;
const AVIF_QUALITY = 50;
const SOURCE_WEBP_QUALITY = 90;

function stabilityEndpointForModel(model) {
    return `${API_HOST}/v1/generation/${model}/text-to-image`;
}

function parseArgs(argv) {
    const options = {
        targetFile: null,
        promptsFile: DEFAULT_PROMPTS_FILE,
        overwrite: false,
        firstOnly: false,
        withOptimized: false,
        limit: null,
        start: 1,
        model: STABILITY_MODEL,
        aspectRatio: DEFAULT_ASPECT_RATIO,
        negativePrompt: DEFAULT_NEGATIVE_PROMPT,
        cfgScale: DEFAULT_CFG_SCALE,
        steps: DEFAULT_STEPS,
        stylePreset: DEFAULT_STYLE_PRESET
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--prompts-file') {
            options.promptsFile = path.resolve(ROOT_DIR, argv[index + 1]);
            index += 1;
        } else if (arg === '--overwrite') {
            options.overwrite = true;
        } else if (arg === '--first-only') {
            options.firstOnly = true;
        } else if (arg === '--with-optimized') {
            options.withOptimized = true;
        } else if (arg === '--limit') {
            options.limit = Number.parseInt(argv[index + 1], 10);
            index += 1;
        } else if (arg === '--start') {
            options.start = Number.parseInt(argv[index + 1], 10);
            index += 1;
        } else if (arg === '--model') {
            options.model = argv[index + 1];
            index += 1;
        } else if (arg === '--aspect-ratio') {
            options.aspectRatio = argv[index + 1];
            index += 1;
        } else if (arg === '--negative-prompt') {
            options.negativePrompt = argv[index + 1];
            index += 1;
        } else if (arg === '--cfg-scale') {
            options.cfgScale = Number.parseFloat(argv[index + 1]);
            index += 1;
        } else if (arg === '--steps') {
            options.steps = Number.parseInt(argv[index + 1], 10);
            index += 1;
        } else if (arg === '--style-preset') {
            options.stylePreset = argv[index + 1];
            index += 1;
        } else if (!options.targetFile) {
            options.targetFile = arg;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (options.limit !== null && (!Number.isInteger(options.limit) || options.limit < 1)) {
        throw new Error('--limit must be a positive integer.');
    }

    if (!Number.isInteger(options.start) || options.start < 1) {
        throw new Error('--start must be a positive 1-based task index.');
    }

    if (!options.promptsFile) {
        throw new Error('Missing prompts file.');
    }

    if (!Number.isFinite(options.cfgScale) || options.cfgScale < 1 || options.cfgScale > 35) {
        throw new Error('--cfg-scale must be a number between 1 and 35.');
    }

    if (!Number.isInteger(options.steps) || options.steps < 10 || options.steps > 50) {
        throw new Error('--steps must be an integer between 10 and 50.');
    }

    return options;
}

function buildFormData(fields) {
    if (!globalThis.FormData) {
        throw new Error('This Node.js runtime does not provide FormData. Please use Node 18+ for Stability v2beta generation.');
    }

    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null && value !== '') {
            formData.append(key, String(value));
        }
    }

    return formData;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function retryDelayFromErrorText(errorText) {
    try {
        const parsed = JSON.parse(errorText);
        const retryAfter = Number(parsed.retry_after);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
            return Math.min(retryAfter * 1000, MAX_RETRY_DELAY_MS);
        }
    } catch (_error) {
        // Fall through to default retry delay.
    }

    return DEFAULT_RETRY_DELAY_MS;
}

function isRetryableStabilityStatus(status) {
    return status === 429 || (status >= 500 && status <= 599);
}

function resolveTargetFile(targetFile) {
    if (!targetFile) {
        return null;
    }

    let resolved = targetFile;
    if (!fs.existsSync(path.resolve(ROOT_DIR, resolved))) {
        if (fs.existsSync(path.join(ROOT_DIR, BLOG_DIR, targetFile))) {
            resolved = path.join(BLOG_DIR, targetFile);
        } else if (fs.existsSync(path.join(ROOT_DIR, BLOG_DIR, `${targetFile}.md`))) {
            resolved = path.join(BLOG_DIR, `${targetFile}.md`);
        }
    }

    if (!fs.existsSync(path.resolve(ROOT_DIR, resolved))) {
        throw new Error(`Specified file not found: ${targetFile}`);
    }

    return resolved;
}

async function latestBlogFile() {
    const files = await glob(`${BLOG_DIR}/*.md`, { cwd: ROOT_DIR });
    if (files.length === 0) {
        return null;
    }

    return files
        .map(file => ({ file, mtime: fs.statSync(path.join(ROOT_DIR, file)).mtime }))
        .sort((a, b) => b.mtime - a.mtime)[0].file;
}

function loadTasks(promptsFile) {
    if (!fs.existsSync(promptsFile)) {
        throw new Error(`${path.relative(ROOT_DIR, promptsFile)} not found. Please create it with image tasks.`);
    }

    const parsed = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));
    const tasks = Array.isArray(parsed) ? parsed : parsed.tasks;

    if (!Array.isArray(tasks)) {
        throw new Error(`${path.relative(ROOT_DIR, promptsFile)} must be an array or an object with a tasks array.`);
    }

    return tasks;
}

function normalizeFilename(filename) {
    const normalized = String(filename || '').replace(/\\/g, '/');
    const ext = path.extname(normalized);

    if (!normalized) {
        throw new Error('Task is missing filename.');
    }

    if (ext !== '.webp') {
        return normalized.slice(0, normalized.length - ext.length) + '.webp';
    }

    return normalized;
}

function generationSizeForAspectRatio(aspectRatio) {
    if (aspectRatio !== '9:16') {
        throw new Error(`Unsupported aspect ratio: ${aspectRatio}. Mobile SEO production images must use 9:16.`);
    }

    return { width: 768, height: 1344 };
}

function sourceSizeForAspectRatio(aspectRatio) {
    if (aspectRatio !== '9:16') {
        throw new Error(`Unsupported aspect ratio: ${aspectRatio}. Mobile SEO production images must use 9:16.`);
    }

    return { width: 1080, height: 1920 };
}

function optimizedPathsForSource(filename) {
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const dirname = path.dirname(filename);

    return {
        webpPath: path.join(dirname, `${basename}-optimized.webp`),
        avifPath: path.join(dirname, `${basename}-optimized.avif`)
    };
}

async function writeOptimizedImages(filename) {
    const sourcePath = path.join(ROOT_DIR, filename);
    const { webpPath, avifPath } = optimizedPathsForSource(filename);
    const webpAbsolutePath = path.join(ROOT_DIR, webpPath);
    const avifAbsolutePath = path.join(ROOT_DIR, avifPath);
    const imageBuffer = fs.readFileSync(sourcePath);
    const metadata = await sharp(imageBuffer).metadata();

    let webpPipeline = sharp(imageBuffer);
    if (metadata.width > MAX_OPTIMIZED_WIDTH) {
        webpPipeline = webpPipeline.resize({ width: MAX_OPTIMIZED_WIDTH, kernel: sharp.kernel.lanczos3 });
    }
    await webpPipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(webpAbsolutePath);

    let avifPipeline = sharp(imageBuffer);
    if (metadata.width > MAX_OPTIMIZED_WIDTH) {
        avifPipeline = avifPipeline.resize({ width: MAX_OPTIMIZED_WIDTH, kernel: sharp.kernel.lanczos3 });
    }
    await avifPipeline.avif({ quality: AVIF_QUALITY }).toFile(avifAbsolutePath);

    return [webpPath, avifPath];
}

async function generateStabilityImage(task, options) {
    const filename = normalizeFilename(task.filename);
    const outputPath = path.join(ROOT_DIR, filename);

    if (!options.overwrite && fs.existsSync(outputPath)) {
        console.log(`⚠️  File ${filename} already exists. Skipping generation.`);
        return 'skipped';
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const coreConcept = coreConceptFromTask(task);
    const prompt = buildPremiumImagePrompt(coreConcept, { task, filename });
    const generationSize = generationSizeForAspectRatio(options.aspectRatio);
    const sourceSize = sourceSizeForAspectRatio(options.aspectRatio);
    const endpoint = stabilityEndpointForModel(options.model);

    console.log(`🎨 Generating: ${filename}`);
    console.log(`   Model: ${options.model}`);
    console.log(`   Ratio: ${options.aspectRatio} (${sourceSize.width}x${sourceSize.height} source)`);
    console.log(`   Core concept: ${coreConcept.slice(0, 140)}${coreConcept.length > 140 ? '...' : ''}`);

    let payload;
    for (let attempt = 1; attempt <= MAX_STABILITY_ATTEMPTS; attempt += 1) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${STABILITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text_prompts: [
                    { text: prompt, weight: 1 },
                    { text: options.negativePrompt, weight: -1 }
                ],
                cfg_scale: options.cfgScale,
                height: generationSize.height,
                width: generationSize.width,
                samples: 1,
                steps: options.steps,
                style_preset: options.stylePreset
            })
        });
        const responseText = await response.text();

        if (response.ok) {
            payload = JSON.parse(responseText);
            break;
        }

        if (isRetryableStabilityStatus(response.status) && attempt < MAX_STABILITY_ATTEMPTS) {
            const waitMs = retryDelayFromErrorText(responseText);
            console.warn(`   ⚠️  Stability API ${response.status}; retry ${attempt + 1}/${MAX_STABILITY_ATTEMPTS} in ${Math.round(waitMs / 1000)}s.`);
            await delay(waitMs);
            continue;
        }

        throw new Error(`Non-200 response after ${attempt} attempt${attempt === 1 ? '' : 's'}: ${responseText}`);
    }

    const base64Image = payload.artifacts && payload.artifacts[0] && payload.artifacts[0].base64;

    if (!base64Image) {
        throw new Error(`Stability response did not include an image artifact: ${JSON.stringify(payload).slice(0, 500)}`);
    }

    const imageBuffer = Buffer.from(base64Image, 'base64');

    await sharp(imageBuffer)
        .resize(sourceSize.width, sourceSize.height, { fit: 'cover', position: 'center' })
        .webp({ quality: SOURCE_WEBP_QUALITY })
        .toFile(outputPath);

    console.log(`   ✅ Saved source ${sourceSize.width}x${sourceSize.height}: ${filename}`);

    if (options.withOptimized) {
        const [webpPath, avifPath] = await writeOptimizedImages(filename);
        console.log(`   ⚙️  Saved optimized: ${webpPath} + ${avifPath}`);
    }

    return 'created';
}

async function main() {
    if (!STABILITY_API_KEY) {
        throw new Error('STABILITY_API_KEY environment variable is not set.');
    }

    const options = parseArgs(process.argv.slice(2));
    const resolvedTargetFile = resolveTargetFile(options.targetFile) || await latestBlogFile();

    console.log('🚀 Starting image generation script (Stability AI)...');
    console.log(`🧠 Model: ${options.model}`);
    console.log(`🌐 Endpoint: ${stabilityEndpointForModel(options.model)}`);
    console.log(`📱 Forced mobile SEO aspect ratio: ${options.aspectRatio}`);
    if (resolvedTargetFile) {
        console.log(`📝 Context file: ${resolvedTargetFile}`);
    }
    console.log(`📋 Tasks file: ${path.relative(ROOT_DIR, options.promptsFile)}`);

    const tasks = loadTasks(options.promptsFile);
    const startIndex = options.start - 1;
    const selectedTasks = options.firstOnly
        ? tasks.slice(startIndex, startIndex + 1)
        : options.limit
            ? tasks.slice(startIndex, startIndex + options.limit)
            : tasks.slice(startIndex);

    if (selectedTasks.length === 0) {
        console.log('✅ No image generation tasks found.');
        return;
    }

    let created = 0;
    let skipped = 0;

    for (const task of selectedTasks) {
        const result = await generateStabilityImage(task, options);
        if (result === 'created') {
            created += 1;
        } else {
            skipped += 1;
        }
    }

    console.log(`✨ Stability AI image generation completed. Created: ${created}, skipped: ${skipped}`);
}

main().catch(error => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
});
