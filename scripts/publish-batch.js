const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_PROMPTS_FILE = path.join(ROOT_DIR, 'data', 'publishing', 'batch-prompts-100.json');
const TEMP_PROMPTS_FILE = path.join(ROOT_DIR, 'prompts.json');

function parseArgs(argv) {
    const options = {
        manifestPath: null,
        dryRun: false,
        resume: true,
        skipImageGeneration: false,
        push: false
    };

    for (const arg of argv) {
        if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--no-resume') {
            options.resume = false;
        } else if (arg === '--skip-image-generation') {
            options.skipImageGeneration = true;
        } else if (arg === '--push') {
            options.push = true;
        } else if (!options.manifestPath) {
            options.manifestPath = path.resolve(ROOT_DIR, arg);
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (!options.manifestPath) {
        throw new Error('Usage: node scripts/publish-batch.js <manifest.json> [--dry-run] [--no-resume] [--skip-image-generation] [--push]');
    }

    return options;
}

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildPromptLookup(tasks) {
    const promptLookup = new Map();

    for (const task of tasks) {
        const filename = String(task.filename || '').replace(/\\/g, '/');
        const blogMatch = filename.match(/^assets\/blog\/(.+)-(hero|detail)\.webp$/);
        const ogMatch = filename.match(/^assets\/og\/og-(.+)\.webp$/);
        const slug = blogMatch ? blogMatch[1] : ogMatch ? ogMatch[1] : null;

        if (!slug) {
            continue;
        }

        if (!promptLookup.has(slug)) {
            promptLookup.set(slug, []);
        }

        promptLookup.get(slug).push(task);
    }

    return promptLookup;
}

function isTracked(relativePath) {
    try {
        execFileSync('git', ['ls-files', '--error-unmatch', '--', relativePath], {
            cwd: ROOT_DIR,
            stdio: 'ignore'
        });
        return true;
    } catch (_error) {
        return false;
    }
}

function validateBatch(manifest, promptLookup) {
    const promptBacked = new Set(manifest.promptBackedArticles || []);

    for (const articleFile of manifest.articleFiles || []) {
        const absoluteArticlePath = path.join(ROOT_DIR, articleFile);
        if (!fs.existsSync(absoluteArticlePath)) {
            throw new Error(`Article file not found: ${articleFile}`);
        }

        if (promptBacked.has(articleFile)) {
            const slug = path.basename(articleFile, '.md');
            const tasks = promptLookup.get(slug) || [];
            if (tasks.length !== 3) {
                throw new Error(`Expected 3 prompt tasks for ${articleFile}, found ${tasks.length}.`);
            }
        }
    }
}

function validateSourceImages(articleFile) {
    const slug = path.basename(articleFile, '.md');
    const requiredImages = [
        `assets/blog/${slug}-hero.webp`,
        `assets/blog/${slug}-detail.webp`,
        `assets/og/og-${slug}.webp`
    ];

    for (const imagePath of requiredImages) {
        if (!fs.existsSync(path.join(ROOT_DIR, imagePath))) {
            throw new Error(`Missing source image for ${articleFile}: ${imagePath}`);
        }
    }
}

function writeTempPrompts(tasks) {
    fs.writeFileSync(TEMP_PROMPTS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

function runNodeScript(scriptPath, args = []) {
    execFileSync('node', [scriptPath, ...args], {
        cwd: ROOT_DIR,
        stdio: 'inherit'
    });
}

function cleanupTempPrompts() {
    if (fs.existsSync(TEMP_PROMPTS_FILE)) {
        fs.unlinkSync(TEMP_PROMPTS_FILE);
    }
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const manifest = loadJson(options.manifestPath);
    const promptsFile = path.resolve(ROOT_DIR, manifest.promptsFile || DEFAULT_PROMPTS_FILE);
    const promptTasks = loadJson(promptsFile);
    const promptLookup = buildPromptLookup(promptTasks);
    const promptBacked = new Set(manifest.promptBackedArticles || []);

    validateBatch(manifest, promptLookup);

    console.log(`📦 Batch: ${manifest.publishBatchName || path.basename(options.manifestPath)}`);
    console.log(`📝 Articles in manifest: ${(manifest.articleFiles || []).length}`);
    console.log(`🚦 Push mode: ${options.push ? 'push after each commit' : 'local commits only'}`);

    let completed = 0;
    let skipped = 0;

    for (const articleFile of manifest.articleFiles || []) {
        const slug = path.basename(articleFile, '.md');
        const alreadyTracked = isTracked(articleFile);
        const needsImages = promptBacked.has(articleFile) && !options.skipImageGeneration;

        if (options.resume && alreadyTracked) {
            console.log(`   - ${articleFile} (skip: already tracked)`);
            skipped += 1;
            continue;
        }

        if (options.skipImageGeneration) {
            validateSourceImages(articleFile);
        }

        console.log(`   - ${articleFile} (${needsImages ? 'generate-images stability-sdxl -> publish' : 'publish'})`);

        if (options.dryRun) {
            continue;
        }

        try {
            if (needsImages) {
                writeTempPrompts(promptLookup.get(slug));
                runNodeScript('scripts/generate-images.js', [articleFile, '--overwrite', '--with-optimized']);
            }

            runNodeScript('scripts/automate-publish.js', options.push ? [articleFile, '--push'] : [articleFile, '--no-push']);
            completed += 1;
        } finally {
            cleanupTempPrompts();
        }
    }

    if (options.dryRun) {
        console.log('✅ Dry run completed. No files were changed.');
        return;
    }

    console.log(`✅ Batch publish completed. Published: ${completed}, skipped: ${skipped}`);
}

main();