const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_PROMPTS_FILE = path.join(ROOT_DIR, 'batch-prompts-100.json');

function parseArgs(argv) {
    const options = {
        promptsFile: DEFAULT_PROMPTS_FILE,
        outputFile: path.join(ROOT_DIR, 'remaining-batch-selection.json'),
        batchSize: null,
        start: 0,
        includeTracked: false,
        batchName: 'remaining-batch'
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        const next = argv[index + 1];

        if (arg === '--prompts' && next) {
            options.promptsFile = path.resolve(ROOT_DIR, next);
            index += 1;
        } else if (arg === '--output' && next) {
            options.outputFile = path.resolve(ROOT_DIR, next);
            index += 1;
        } else if (arg === '--batch-size' && next) {
            options.batchSize = Number.parseInt(next, 10);
            index += 1;
        } else if (arg === '--start' && next) {
            options.start = Number.parseInt(next, 10);
            index += 1;
        } else if (arg === '--name' && next) {
            options.batchName = next;
            index += 1;
        } else if (arg === '--include-tracked') {
            options.includeTracked = true;
        } else {
            throw new Error(`Unknown or incomplete argument: ${arg}`);
        }
    }

    if (!Number.isInteger(options.start) || options.start < 0) {
        throw new Error('--start must be a non-negative integer.');
    }

    if (options.batchSize !== null && (!Number.isInteger(options.batchSize) || options.batchSize <= 0)) {
        throw new Error('--batch-size must be a positive integer.');
    }

    return options;
}

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function derivePromptSlugs(tasks) {
    const seen = new Set();
    const slugs = [];

    for (const task of tasks) {
        const filename = String(task.filename || '').replace(/\\/g, '/');
        const blogMatch = filename.match(/^assets\/blog\/(.+)-(hero|detail)\.webp$/);
        const ogMatch = filename.match(/^assets\/og\/og-(.+)\.webp$/);
        const slug = blogMatch ? blogMatch[1] : ogMatch ? ogMatch[1] : null;

        if (slug && !seen.has(slug)) {
            seen.add(slug);
            slugs.push(slug);
        }
    }

    return slugs;
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

function buildManifest(options) {
    const promptTasks = loadJson(options.promptsFile);
    const promptSlugs = derivePromptSlugs(promptTasks);
    const articleFiles = [];

    for (const slug of promptSlugs) {
        const articleFile = `blog/${slug}.md`;
        const absoluteArticlePath = path.join(ROOT_DIR, articleFile);

        if (!fs.existsSync(absoluteArticlePath)) {
            continue;
        }

        if (!options.includeTracked && isTracked(articleFile)) {
            continue;
        }

        articleFiles.push(articleFile);
    }

    const selectedArticles = articleFiles.slice(
        options.start,
        options.batchSize === null ? undefined : options.start + options.batchSize
    );

    return {
        publishBatchName: `${options.batchName}-${String(options.start).padStart(3, '0')}`,
        promptsFile: path.relative(ROOT_DIR, options.promptsFile),
        articleFiles: selectedArticles,
        promptBackedArticles: [...selectedArticles],
        generationSummary: {
            totalPromptSlugs: promptSlugs.length,
            eligibleArticles: articleFiles.length,
            selectedArticles: selectedArticles.length,
            start: options.start,
            batchSize: options.batchSize
        }
    };
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const manifest = buildManifest(options);

    fs.writeFileSync(options.outputFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    console.log(`✅ Wrote manifest: ${path.relative(ROOT_DIR, options.outputFile)}`);
    console.log(`📦 Batch: ${manifest.publishBatchName}`);
    console.log(`📝 Selected articles: ${manifest.articleFiles.length}`);

    for (const articleFile of manifest.articleFiles) {
        console.log(`   - ${articleFile}`);
    }
}

main();