const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
    DEFAULT_NEGATIVE_PROMPT,
    PREMIUM_IMAGE_PROMPT_TEMPLATE,
    STABILITY_MODEL,
    buildPremiumImagePrompt,
    coreConceptFromTask
} = require('./premium-image-prompts');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_PROMPTS_FILE = path.join(ROOT_DIR, 'data', 'publishing', 'batch-prompts-100.json');
const DEFAULT_OUTPUT_FILE = path.join(ROOT_DIR, 'data', 'publishing', 'stability-repair-02867e8-tasks.json');

function parseArgs(argv) {
    const options = {
        fromCommit: null,
        promptsFile: DEFAULT_PROMPTS_FILE,
        outputFile: DEFAULT_OUTPUT_FILE
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--from-commit') {
            options.fromCommit = argv[index + 1];
            index += 1;
        } else if (arg === '--prompts-file') {
            options.promptsFile = path.resolve(ROOT_DIR, argv[index + 1]);
            index += 1;
        } else if (arg === '--output') {
            options.outputFile = path.resolve(ROOT_DIR, argv[index + 1]);
            index += 1;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (!options.fromCommit) {
        throw new Error('Usage: node scripts/build-stability-repair-tasks.js --from-commit <sha> [--prompts-file <json>] [--output <json>]');
    }

    if (!/^[0-9a-f]{7,40}$/i.test(options.fromCommit)) {
        throw new Error(`Invalid commit hash: ${options.fromCommit}`);
    }

    return options;
}

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function deriveSlug(filename) {
    const normalized = String(filename || '').replace(/\\/g, '/');
    const blogMatch = normalized.match(/^assets\/blog\/(.+)-(hero|detail)\.webp$/);
    const ogMatch = normalized.match(/^assets\/og\/og-(.+)\.webp$/);
    return blogMatch ? blogMatch[1] : ogMatch ? ogMatch[1] : null;
}

function deriveVariant(filename) {
    const normalized = String(filename || '').replace(/\\/g, '/');
    if (/^assets\/og\/og-.+\.webp$/.test(normalized)) return 'og';
    if (/-detail\.webp$/.test(normalized)) return 'detail';
    return 'hero';
}

function buildPromptLookup(promptTasks) {
    const lookup = new Map();

    for (const task of promptTasks) {
        const slug = deriveSlug(task.filename);
        if (!slug) continue;

        if (!lookup.has(slug)) {
            lookup.set(slug, []);
        }
        lookup.get(slug).push(task);
    }

    for (const tasks of lookup.values()) {
        tasks.sort((a, b) => {
            const order = { hero: 0, detail: 1, og: 2 };
            return order[deriveVariant(a.filename)] - order[deriveVariant(b.filename)];
        });
    }

    return lookup;
}

function affectedArticlesFromCommitRange(fromCommit) {
    const commits = execFileSync('git', ['log', '--reverse', '--format=%H', `${fromCommit}^..HEAD`], {
        cwd: ROOT_DIR,
        encoding: 'utf8'
    }).trim().split('\n').filter(Boolean);

    const seen = new Set();
    const articleFiles = [];

    for (const commit of commits) {
        const files = execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', commit], {
            cwd: ROOT_DIR,
            encoding: 'utf8'
        }).split('\n').map(line => line.trim()).filter(Boolean);

        for (const file of files) {
            if (!/^blog\/[^/]+\.md$/.test(file) || seen.has(file)) continue;
            seen.add(file);
            articleFiles.push(file);
        }
    }

    if (articleFiles.length === 0) {
        throw new Error(`No blog articles found in commit range ${fromCommit}^..HEAD.`);
    }

    return articleFiles;
}

function variantConceptSuffix(variant) {
    if (variant === 'detail') {
        return 'close-up detail composition with one clear symbolic focal object and refined abstract interface-inspired geometry';
    }

    if (variant === 'og') {
        return 'wide hero composition with one central symbolic focal object and generous negative space for social sharing';
    }

    return 'premium article hero composition with one central symbolic focal object and contextual abstract elements';
}

function buildTask(articleFile, task, index) {
    const filename = String(task.filename || '').replace(/\\/g, '/');
    const variant = deriveVariant(filename);
    const coreConcept = `${coreConceptFromTask(task)}, ${variantConceptSuffix(variant)}`;

    return {
        id: index + 1,
        status: index === 0 ? 'sample_pending_generation' : 'pending_after_sample_approval',
        articleFile,
        filename,
        variant,
        model: STABILITY_MODEL,
        aspectRatio: '16:9',
        coreConcept,
        positivePrompt: buildPremiumImagePrompt(coreConcept),
        negativePrompt: DEFAULT_NEGATIVE_PROMPT
    };
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const promptTasks = loadJson(options.promptsFile);
    const promptLookup = buildPromptLookup(promptTasks);
    const articleFiles = affectedArticlesFromCommitRange(options.fromCommit);
    const tasks = [];

    for (const articleFile of articleFiles) {
        const slug = path.basename(articleFile, '.md');
        const articleTasks = promptLookup.get(slug) || [];

        if (articleTasks.length !== 3) {
            throw new Error(`Expected 3 prompt tasks for ${articleFile}, found ${articleTasks.length}.`);
        }

        for (const task of articleTasks) {
            tasks.push(buildTask(articleFile, task, tasks.length));
        }
    }

    const output = {
        batchName: `stability-repair-from-${options.fromCommit.slice(0, 7)}`,
        status: 'awaiting_first_sample_generation',
        generator: 'Stability AI v2beta stable-image/generate/sd3',
        model: STABILITY_MODEL,
        startCommit: options.fromCommit,
        promptsFile: path.relative(ROOT_DIR, options.promptsFile),
        positivePromptTemplate: PREMIUM_IMAGE_PROMPT_TEMPLATE,
        negativePrompt: DEFAULT_NEGATIVE_PROMPT,
        firstTaskFilename: tasks[0].filename,
        articleCount: articleFiles.length,
        taskCount: tasks.length,
        articleFiles,
        tasks
    };

    fs.mkdirSync(path.dirname(options.outputFile), { recursive: true });
    fs.writeFileSync(options.outputFile, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

    console.log(`✅ Wrote ${tasks.length} Stability AI repair tasks for ${articleFiles.length} articles.`);
    console.log(`   Output: ${path.relative(ROOT_DIR, options.outputFile)}`);
    console.log(`   First task: ${tasks[0].filename}`);
}

main();
