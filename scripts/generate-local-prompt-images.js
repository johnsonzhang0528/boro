const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_PROMPTS_FILE = path.join(ROOT_DIR, 'data', 'publishing', 'batch-prompts-100.json');

function parseArgs(argv) {
    const options = {
        manifestPath: null,
        overwrite: false
    };

    for (const arg of argv) {
        if (arg === '--overwrite') {
            options.overwrite = true;
        } else if (!options.manifestPath) {
            options.manifestPath = path.resolve(ROOT_DIR, arg);
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (!options.manifestPath) {
        throw new Error('Usage: node scripts/generate-local-prompt-images.js <manifest.json> [--overwrite]');
    }

    return options;
}

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function createRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state += 0x6D2B79F5;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function deriveVariant(filename) {
    if (filename.includes('/og/')) return 'og';
    if (filename.includes('-detail.webp')) return 'detail';
    return 'hero';
}

function deriveSlug(filename) {
    const normalized = filename.replace(/\\/g, '/');
    const blogMatch = normalized.match(/^assets\/blog\/(.+)-(hero|detail)\.webp$/);
    const ogMatch = normalized.match(/^assets\/og\/og-(.+)\.webp$/);
    return blogMatch ? blogMatch[1] : ogMatch ? ogMatch[1] : path.basename(normalized, '.webp');
}

function imageSizeForVariant(variant) {
    if (variant === 'og') {
        return { width: 1200, height: 630 };
    }

    return { width: 1600, height: 900 };
}

function paletteForPrompt(prompt) {
    const lower = prompt.toLowerCase();

    if (lower.includes('slot')) {
        return ['#081426', '#15294A', '#D6A742', '#77B7FF', '#5F3DC4'];
    }

    if (lower.includes('casino') || lower.includes('roulette') || lower.includes('baccarat') || lower.includes('blackjack')) {
        return ['#070D1C', '#15213D', '#CBA24D', '#7C3AED', '#24D3EE'];
    }

    if (lower.includes('cricket') || lower.includes('football') || lower.includes('basketball')) {
        return ['#061826', '#123A4A', '#D9B45F', '#42E6A4', '#4EA1FF'];
    }

    if (lower.includes('payment') || lower.includes('withdrawal') || lower.includes('deposit')) {
        return ['#061425', '#13243C', '#D8AC4F', '#41D7C7', '#86A7FF'];
    }

    return ['#071226', '#15233F', '#D7AA46', '#4D9DFF', '#A070FF'];
}

function rect({ x, y, width, height, radius, fill, opacity = 1, stroke = 'none', strokeWidth = 0, filter = '' }) {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" opacity="${opacity}" stroke="${stroke}" stroke-width="${strokeWidth}" ${filter}/>`;
}

function circle({ cx, cy, r, fill, opacity = 1, filter = '' }) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}" ${filter}/>`;
}

function line({ x1, y1, x2, y2, stroke, strokeWidth = 3, opacity = 1 }) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round"/>`;
}

function pathElement({ d, stroke, strokeWidth = 5, opacity = 1, fill = 'none' }) {
    return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function buildSvg(task) {
    const variant = deriveVariant(task.filename);
    const slug = deriveSlug(task.filename);
    const { width, height } = imageSizeForVariant(variant);
    const seed = hashString(`${task.filename}:${task.prompt}`);
    const random = createRandom(seed);
    const [bg0, bg1, gold, accent, violet] = paletteForPrompt(task.prompt || '');
    const safeSlug = escapeXml(slug);

    const uiCards = [];
    const cardCount = variant === 'detail' ? 9 : 7;

    for (let index = 0; index < cardCount; index += 1) {
        const cardWidth = Math.round(width * (0.12 + random() * 0.16));
        const cardHeight = Math.round(height * (0.06 + random() * 0.12));
        const x = Math.round(width * (0.12 + random() * 0.68));
        const y = Math.round(height * (0.16 + random() * 0.62));
        const fill = index % 3 === 0 ? '#FFFFFF' : index % 3 === 1 ? accent : gold;
        uiCards.push(rect({
            x,
            y,
            width: cardWidth,
            height: cardHeight,
            radius: 24,
            fill,
            opacity: index % 3 === 0 ? 0.08 : 0.12,
            stroke: '#FFFFFF',
            strokeWidth: 1
        }));
    }

    const phoneX = Math.round(width * (variant === 'detail' ? 0.56 : 0.58));
    const phoneY = Math.round(height * 0.12);
    const phoneW = Math.round(width * (variant === 'og' ? 0.24 : 0.22));
    const phoneH = Math.round(height * 0.72);

    const chartBaseX = Math.round(width * 0.14);
    const chartBaseY = Math.round(height * 0.62);
    const chartPoints = Array.from({ length: 7 }, (_, index) => {
        const x = chartBaseX + Math.round(index * width * 0.055);
        const y = chartBaseY - Math.round(random() * height * 0.26);
        return [x, y];
    });
    const chartPath = chartPoints.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');

    const barGroup = Array.from({ length: 8 }, (_, index) => {
        const barHeight = Math.round(height * (0.07 + random() * 0.2));
        const x = Math.round(width * 0.14 + index * width * 0.045);
        const y = Math.round(height * 0.76 - barHeight);
        return rect({ x, y, width: Math.round(width * 0.018), height: barHeight, radius: 10, fill: index % 2 ? accent : gold, opacity: 0.42 });
    });

    const sparkles = Array.from({ length: 42 }, () => {
        const cx = Math.round(random() * width);
        const cy = Math.round(random() * height);
        const r = (1 + random() * 3).toFixed(2);
        return circle({ cx, cy, r, fill: '#FFFFFF', opacity: 0.12 + random() * 0.2 });
    });

    const orbitalLines = Array.from({ length: 5 }, (_, index) => {
        const y = Math.round(height * (0.24 + index * 0.1));
        return pathElement({
            d: `M ${Math.round(width * 0.08)} ${y} C ${Math.round(width * 0.35)} ${y - 90}, ${Math.round(width * 0.62)} ${y + 120}, ${Math.round(width * 0.92)} ${y - 35}`,
            stroke: index % 2 ? accent : gold,
            strokeWidth: 2,
            opacity: 0.11
        });
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Prompt-derived visual for ${safeSlug}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg0}"/>
      <stop offset="0.58" stop-color="${bg1}"/>
      <stop offset="1" stop-color="#030712"/>
    </linearGradient>
    <radialGradient id="goldGlow" cx="72%" cy="20%" r="55%">
      <stop offset="0" stop-color="${gold}" stop-opacity="0.46"/>
      <stop offset="0.42" stop-color="${gold}" stop-opacity="0.13"/>
      <stop offset="1" stop-color="${gold}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="accentGlow" cx="20%" cy="84%" r="55%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.36"/>
      <stop offset="0.48" stop-color="${accent}" stop-opacity="0.1"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#goldGlow)"/>
  <rect width="${width}" height="${height}" fill="url(#accentGlow)"/>
  ${sparkles.join('\n  ')}
  ${orbitalLines.join('\n  ')}
  ${circle({ cx: Math.round(width * 0.78), cy: Math.round(height * 0.2), r: Math.round(width * 0.13), fill: gold, opacity: 0.12, filter: 'filter="url(#blur)"' })}
  ${circle({ cx: Math.round(width * 0.18), cy: Math.round(height * 0.82), r: Math.round(width * 0.15), fill: accent, opacity: 0.13, filter: 'filter="url(#blur)"' })}
  ${rect({ x: Math.round(width * 0.08), y: Math.round(height * 0.14), width: Math.round(width * 0.44), height: Math.round(height * 0.66), radius: 42, fill: '#FFFFFF', opacity: 0.06, stroke: '#FFFFFF', strokeWidth: 1, filter: 'filter="url(#softShadow)"' })}
  ${rect({ x: Math.round(width * 0.11), y: Math.round(height * 0.19), width: Math.round(width * 0.23), height: Math.round(height * 0.055), radius: 18, fill: gold, opacity: 0.5 })}
  ${rect({ x: Math.round(width * 0.11), y: Math.round(height * 0.28), width: Math.round(width * 0.33), height: Math.round(height * 0.035), radius: 14, fill: '#FFFFFF', opacity: 0.13 })}
  ${rect({ x: Math.round(width * 0.11), y: Math.round(height * 0.34), width: Math.round(width * 0.27), height: Math.round(height * 0.028), radius: 12, fill: '#FFFFFF', opacity: 0.09 })}
  ${barGroup.join('\n  ')}
  ${pathElement({ d: chartPath, stroke: gold, strokeWidth: 8, opacity: 0.78 })}
  ${pathElement({ d: chartPath, stroke: '#FFFFFF', strokeWidth: 2, opacity: 0.55 })}
  ${chartPoints.map(([cx, cy]) => circle({ cx, cy, r: 8, fill: accent, opacity: 0.95 })).join('\n  ')}
  ${rect({ x: phoneX, y: phoneY, width: phoneW, height: phoneH, radius: 54, fill: '#07111F', opacity: 0.95, stroke: '#FFFFFF', strokeWidth: 3, filter: 'filter="url(#softShadow)"' })}
  ${rect({ x: phoneX + Math.round(phoneW * 0.08), y: phoneY + Math.round(phoneH * 0.08), width: Math.round(phoneW * 0.84), height: Math.round(phoneH * 0.84), radius: 34, fill: '#0D2038', opacity: 1 })}
  ${rect({ x: phoneX + Math.round(phoneW * 0.18), y: phoneY + Math.round(phoneH * 0.14), width: Math.round(phoneW * 0.42), height: Math.round(phoneH * 0.055), radius: 14, fill: gold, opacity: 0.64 })}
  ${rect({ x: phoneX + Math.round(phoneW * 0.18), y: phoneY + Math.round(phoneH * 0.24), width: Math.round(phoneW * 0.64), height: Math.round(phoneH * 0.12), radius: 20, fill: '#FFFFFF', opacity: 0.09 })}
  ${rect({ x: phoneX + Math.round(phoneW * 0.18), y: phoneY + Math.round(phoneH * 0.4), width: Math.round(phoneW * 0.26), height: Math.round(phoneH * 0.18), radius: 18, fill: accent, opacity: 0.28 })}
  ${rect({ x: phoneX + Math.round(phoneW * 0.52), y: phoneY + Math.round(phoneH * 0.4), width: Math.round(phoneW * 0.3), height: Math.round(phoneH * 0.18), radius: 18, fill: violet, opacity: 0.25 })}
  ${rect({ x: phoneX + Math.round(phoneW * 0.18), y: phoneY + Math.round(phoneH * 0.64), width: Math.round(phoneW * 0.64), height: Math.round(phoneH * 0.06), radius: 16, fill: '#FFFFFF', opacity: 0.11 })}
  ${rect({ x: phoneX + Math.round(phoneW * 0.18), y: phoneY + Math.round(phoneH * 0.74), width: Math.round(phoneW * 0.5), height: Math.round(phoneH * 0.05), radius: 14, fill: '#FFFFFF', opacity: 0.08 })}
  ${uiCards.join('\n  ')}
  ${line({ x1: Math.round(width * 0.68), y1: Math.round(height * 0.1), x2: Math.round(width * 0.88), y2: Math.round(height * 0.05), stroke: gold, strokeWidth: 2, opacity: 0.2 })}
  ${line({ x1: Math.round(width * 0.08), y1: Math.round(height * 0.9), x2: Math.round(width * 0.36), y2: Math.round(height * 0.84), stroke: accent, strokeWidth: 2, opacity: 0.18 })}
</svg>`;
}

function buildPromptLookup(tasks) {
    const promptLookup = new Map();

    for (const task of tasks) {
        const slug = deriveSlug(task.filename || '');
        if (!promptLookup.has(slug)) {
            promptLookup.set(slug, []);
        }
        promptLookup.get(slug).push(task);
    }

    return promptLookup;
}

async function writeImage(task, overwrite) {
    const outputPath = path.join(ROOT_DIR, task.filename);

    if (!overwrite && fs.existsSync(outputPath)) {
        return 'skipped';
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const svg = buildSvg(task);
    await sharp(Buffer.from(svg))
        .webp({ quality: 88, effort: 6 })
        .toFile(outputPath);

    return 'created';
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const manifest = loadJson(options.manifestPath);
    const promptsFile = path.resolve(ROOT_DIR, manifest.promptsFile || DEFAULT_PROMPTS_FILE);
    const promptTasks = loadJson(promptsFile);
    const promptLookup = buildPromptLookup(promptTasks);

    let created = 0;
    let skipped = 0;

    console.log(`🎨 Local prompt image generation for ${manifest.publishBatchName || path.basename(options.manifestPath)}`);

    for (const articleFile of manifest.articleFiles || []) {
        const slug = path.basename(articleFile, '.md');
        const tasks = promptLookup.get(slug) || [];

        if (tasks.length !== 3) {
            throw new Error(`Expected 3 prompt tasks for ${articleFile}, found ${tasks.length}.`);
        }

        for (const task of tasks) {
            const result = await writeImage(task, options.overwrite);
            if (result === 'created') {
                created += 1;
                console.log(`   ✅ ${task.filename}`);
            } else {
                skipped += 1;
                console.log(`   ⏭️  ${task.filename}`);
            }
        }
    }

    console.log(`✅ Local images ready. Created: ${created}, skipped: ${skipped}`);
}

main().catch(error => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
});