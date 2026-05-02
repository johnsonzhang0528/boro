const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_PROMPTS_FILE = path.join(ROOT_DIR, 'data', 'publishing', 'batch-prompts-100.json');
const MAX_OPTIMIZED_WIDTH = 1536;
const WEBP_QUALITY = 75;
const AVIF_QUALITY = 50;

function parseArgs(argv) {
    const options = {
        manifestPath: null,
        overwrite: false,
        withOptimized: false,
        fromCommit: null,
        promptsFile: null
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--overwrite') {
            options.overwrite = true;
        } else if (arg === '--with-optimized') {
            options.withOptimized = true;
        } else if (arg === '--from-commit') {
            options.fromCommit = argv[index + 1];
            index += 1;
        } else if (arg === '--prompts-file') {
            options.promptsFile = path.resolve(ROOT_DIR, argv[index + 1]);
            index += 1;
        } else if (!options.manifestPath) {
            options.manifestPath = path.resolve(ROOT_DIR, arg);
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    if (!options.manifestPath && !options.fromCommit) {
        throw new Error('Usage: node scripts/generate-local-prompt-images.js <manifest.json> [--overwrite] [--with-optimized] OR --from-commit <sha> [--prompts-file <json>] [--overwrite] [--with-optimized]');
    }

    if (options.fromCommit && !/^[0-9a-f]{7,40}$/i.test(options.fromCommit)) {
        throw new Error(`Invalid commit hash: ${options.fromCommit}`);
    }

    return options;
}

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildManifestFromCommit(fromCommit, promptsFile) {
    const output = execFileSync('git', ['diff', '--name-only', `${fromCommit}^..HEAD`], {
        cwd: ROOT_DIR,
        encoding: 'utf8'
    });

    const articleFiles = [...new Set(output
        .split('\n')
        .map(line => line.trim())
        .filter(line => /^blog\/[^/]+\.md$/.test(line)))]
        .sort();

    if (articleFiles.length === 0) {
        throw new Error(`No blog articles found in commit range ${fromCommit}^..HEAD.`);
    }

    return {
        publishBatchName: `repair-contextual-images-from-${fromCommit.slice(0, 7)}`,
        promptsFile: path.relative(ROOT_DIR, promptsFile || DEFAULT_PROMPTS_FILE),
        articleFiles,
        promptBackedArticles: articleFiles
    };
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
    return variant === 'og'
        ? { width: 1200, height: 630 }
        : { width: 1600, height: 900 };
}

function extractQuotedFrontmatterValue(block, key) {
    const match = block.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
    return match ? match[1].replace(/^"|"$/g, '') : '';
}

function loadArticleContext(articleFile) {
    const absolutePath = path.join(ROOT_DIR, articleFile);
    const content = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    const block = frontmatter ? frontmatter[1] : '';
    const title = extractQuotedFrontmatterValue(block, 'title');
    const description = extractQuotedFrontmatterValue(block, 'description');
    const tagsMatch = block.match(/^tags:\s*\[(.+?)\]\s*$/m);
    const tags = tagsMatch ? tagsMatch[1].replace(/["']/g, '').split(',').map(tag => tag.trim()).filter(Boolean) : [];

    return { title, description, tags, raw: `${title} ${description} ${tags.join(' ')}` };
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

function matchesAny(value, words) {
    return words.some(word => value.includes(word));
}

function sceneForContext(slug, prompt, articleContext) {
    const text = `${slug} ${prompt} ${articleContext.raw || ''}`.toLowerCase();

    if (matchesAny(text, ['autoplay', 'slot', 'scatter', 'wild', 'cascading', 'buy feature', 'demo mode', 'hit frequency', 'multiplier wild'])) return 'slots';
    if (matchesAny(text, ['cricket', 'test match', 'wicket', 'toss winner', 'rain affected'])) return 'cricket';
    if (matchesAny(text, ['football', 'goal', 'extra time', 'full time', 'full-time', 'match betting', 'early cashout'])) return 'football';
    if (matchesAny(text, ['basketball', 'handicap', 'spread'])) return 'basketball';
    if (matchesAny(text, ['roulette', 'lightning'])) return 'roulette';
    if (matchesAny(text, ['blackjack', 'surrender', 'soft hands'])) return 'blackjack';
    if (matchesAny(text, ['baccarat', 'shoe length', 'banker', 'player commission'])) return 'baccarat';
    if (matchesAny(text, ['sic bo', 'big small', 'dice'])) return 'dice';
    if (matchesAny(text, ['teen patti'])) return 'teen-patti';
    if (matchesAny(text, ['dragon tiger'])) return 'dragon-tiger';
    if (matchesAny(text, ['monopoly', 'cash or crash'])) return 'game-show';
    if (matchesAny(text, ['withdrawal', 'payment', 'deposit', 'cashout', 'verification'])) return 'payment';
    if (matchesAny(text, ['bonus', 'promo', 'loyalty', 'cashback', 'birthday', 'reload'])) return 'bonus';

    return 'editorial';
}

function subtopicFor(slug, prompt, articleContext) {
    const text = `${slug} ${prompt} ${articleContext.raw || ''}`.toLowerCase();
    const checks = [
        ['rain', ['rain', 'affected']],
        ['wicket', ['wicket']],
        ['toss', ['toss']],
        ['session', ['session', 'test match']],
        ['extra-time', ['extra time']],
        ['collect-cashout', ['cash or crash', 'collect']],
        ['cashout', ['early cashout', 'cashout', 'cash out', 'full-time']],
        ['outrights', ['outrights']],
        ['goals', ['goal', 'over 1.5', 'over 2.5']],
        ['spread', ['spread', 'handicap']],
        ['multiplier-wilds', ['multiplier wild', 'wilds']],
        ['lightning', ['lightning roulette', 'lightning']],
        ['neighbor', ['neighbor']],
        ['soft-hands', ['soft hands']],
        ['surrender', ['surrender']],
        ['shoe', ['shoe length']],
        ['commission', ['commission', 'banker', 'player']],
        ['big-small', ['big small']],
        ['side-bets', ['side bets']],
        ['autoplay', ['autoplay']],
        ['cascading', ['cascading']],
        ['demo-real', ['demo mode', 'real money']],
        ['buy-feature', ['buy feature']],
        ['scatter-wild', ['scatter', 'wild']],
        ['hit-frequency', ['hit frequency']],
        ['birthday', ['birthday']],
        ['promo', ['promo code']],
        ['loyalty', ['loyalty']],
        ['reload', ['reload']],
        ['cashback', ['cashback']],
        ['no-bonus-withdrawal', ['no bonus', 'withdrawal speed']],
        ['monopoly-rolls', ['monopoly', 'rolls']]
    ];

    for (const [name, words] of checks) {
        if (matchesAny(text, words)) return name;
    }

    return 'general';
}

function paletteFor(scene, seed) {
    const palettes = {
        slots: ['#160724', '#351058', '#F5B942', '#20D6C7', '#E84D8A'],
        cricket: ['#041B16', '#0B6E4F', '#D8B35A', '#E33E58', '#59B6F9'],
        football: ['#062016', '#10723B', '#E5E7EB', '#F2B84B', '#2DD4BF'],
        basketball: ['#24120A', '#B45309', '#FDBA74', '#60A5FA', '#1E293B'],
        roulette: ['#0A0F1F', '#6D1227', '#D6B15D', '#22D3EE', '#111827'],
        blackjack: ['#071A12', '#12613F', '#F8FAFC', '#D8A84E', '#7C3AED'],
        baccarat: ['#071728', '#0F766E', '#F8FAFC', '#D6A94D', '#B91C1C'],
        dice: ['#111827', '#1D4ED8', '#F8FAFC', '#F97316', '#22D3EE'],
        'teen-patti': ['#1A0B1F', '#7C2D12', '#F8FAFC', '#F59E0B', '#A855F7'],
        'dragon-tiger': ['#180A0A', '#7F1D1D', '#F8FAFC', '#F59E0B', '#38BDF8'],
        'game-show': ['#130F2E', '#4C1D95', '#FBBF24', '#22D3EE', '#F472B6'],
        payment: ['#061425', '#0F2E4A', '#D8AC4F', '#41D7C7', '#86A7FF'],
        bonus: ['#130A24', '#5B21B6', '#FBBF24', '#FB7185', '#34D399'],
        editorial: ['#071226', '#15233F', '#D7AA46', '#4D9DFF', '#A070FF']
    };

    const base = palettes[scene] || palettes.editorial;
    const shift = seed % base.length;
    return base.slice(shift).concat(base.slice(0, shift));
}

function attrs(options) {
    return Object.entries(options)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}="${String(value)}"`)
        .join(' ');
}

function rect({ x, y, width, height, radius = 0, fill, opacity = 1, stroke, strokeWidth, filter }) {
    return `<rect ${attrs({ x, y, width, height, rx: radius, fill, opacity, stroke, 'stroke-width': strokeWidth, filter })}/>`;
}

function circle({ cx, cy, r, fill, opacity = 1, stroke, strokeWidth, filter }) {
    return `<circle ${attrs({ cx, cy, r, fill, opacity, stroke, 'stroke-width': strokeWidth, filter })}/>`;
}

function ellipse({ cx, cy, rx, ry, fill, opacity = 1, stroke, strokeWidth, filter }) {
    return `<ellipse ${attrs({ cx, cy, rx, ry, fill, opacity, stroke, 'stroke-width': strokeWidth, filter })}/>`;
}

function line({ x1, y1, x2, y2, stroke, strokeWidth = 3, opacity = 1 }) {
    return `<line ${attrs({ x1, y1, x2, y2, stroke, 'stroke-width': strokeWidth, opacity, 'stroke-linecap': 'round' })}/>`;
}

function pathElement({ d, fill = 'none', stroke, strokeWidth, opacity = 1, filter }) {
    return `<path ${attrs({ d, fill, stroke, 'stroke-width': strokeWidth, opacity, filter, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })}/>`;
}

function polygon({ points, fill, opacity = 1, stroke, strokeWidth, filter }) {
    return `<polygon ${attrs({ points, fill, opacity, stroke, 'stroke-width': strokeWidth, filter, 'stroke-linejoin': 'round' })}/>`;
}

function regularPolygonPoints(cx, cy, radius, sides, rotation = -90) {
    return Array.from({ length: sides }, (_, index) => {
        const angle = ((rotation + index * 360 / sides) * Math.PI) / 180;
        return `${Math.round(cx + Math.cos(angle) * radius)},${Math.round(cy + Math.sin(angle) * radius)}`;
    }).join(' ');
}

function starPoints(cx, cy, outerRadius, innerRadius, points = 5, rotation = -90) {
    return Array.from({ length: points * 2 }, (_, index) => {
        const angle = ((rotation + index * 180 / points) * Math.PI) / 180;
        const radius = index % 2 === 0 ? outerRadius : innerRadius;
        return `${Math.round(cx + Math.cos(angle) * radius)},${Math.round(cy + Math.sin(angle) * radius)}`;
    }).join(' ');
}

function wedge({ cx, cy, radius, start, end, fill, opacity = 1, stroke, strokeWidth }) {
    const startRad = (Math.PI / 180) * start;
    const endRad = (Math.PI / 180) * end;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = end - start > 180 ? 1 : 0;
    return pathElement({
        d: `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`,
        fill,
        opacity,
        stroke,
        strokeWidth
    });
}

function background({ width, height, colors, random }) {
    const [bg0, bg1, accent, glowA, glowB] = colors;
    const dust = Array.from({ length: 58 }, () => circle({
        cx: Math.round(random() * width),
        cy: Math.round(random() * height),
        r: (1 + random() * 3.2).toFixed(2),
        fill: '#FFFFFF',
        opacity: (0.08 + random() * 0.2).toFixed(2)
    })).join('\n  ');

    const ribbons = Array.from({ length: 6 }, (_, index) => {
        const y = Math.round(height * (0.12 + index * 0.14 + random() * 0.04));
        return pathElement({
            d: `M ${Math.round(width * -0.05)} ${y} C ${Math.round(width * 0.25)} ${y - height * (0.1 + random() * 0.12)}, ${Math.round(width * 0.58)} ${y + height * (0.08 + random() * 0.1)}, ${Math.round(width * 1.05)} ${y - height * (0.04 + random() * 0.12)}`,
            stroke: index % 2 ? glowA : accent,
            strokeWidth: 2,
            opacity: 0.1
        });
    }).join('\n  ');

    return `
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${Math.round(width * 0.14)}" cy="${Math.round(height * 0.84)}" r="${Math.round(width * 0.25)}" fill="${glowA}" opacity="0.14" filter="url(#blur)"/>
  <circle cx="${Math.round(width * 0.8)}" cy="${Math.round(height * 0.18)}" r="${Math.round(width * 0.21)}" fill="${accent}" opacity="0.14" filter="url(#blur)"/>
  <circle cx="${Math.round(width * 0.58)}" cy="${Math.round(height * 0.62)}" r="${Math.round(width * 0.18)}" fill="${glowB}" opacity="0.08" filter="url(#blur)"/>
  ${ribbons}
  ${dust}`;
}

function chartOverlay({ width, height, x, y, w, h, random, accent, gold }) {
    const bars = Array.from({ length: 7 }, (_, index) => {
        const bh = Math.round(h * (0.22 + random() * 0.65));
        return rect({ x: Math.round(x + w * (0.08 + index * 0.12)), y: Math.round(y + h - bh), width: Math.round(w * 0.055), height: bh, radius: 10, fill: index % 2 ? accent : gold, opacity: 0.48 });
    }).join('\n  ');
    const points = Array.from({ length: 6 }, (_, index) => [Math.round(x + w * (0.08 + index * 0.17)), Math.round(y + h * (0.25 + random() * 0.5))]);
    const path = points.map(([px, py], index) => `${index ? 'L' : 'M'} ${px} ${py}`).join(' ');
    return `${bars}\n  ${pathElement({ d: path, stroke: gold, strokeWidth: 7, opacity: 0.72 })}\n  ${points.map(([px, py]) => circle({ cx: px, cy: py, r: Math.round(width * 0.006), fill: accent, opacity: 0.9 })).join('\n  ')}`;
}

function card(x, y, w, h, angle, fill, accent, seed = 0) {
    const pip = seed % 3 === 0 ? circle({ cx: Math.round(x + w * 0.5), cy: Math.round(y + h * 0.5), r: Math.round(w * 0.09), fill: accent, opacity: 0.8 })
        : polygon({ points: regularPolygonPoints(x + w * 0.5, y + h * 0.5, Math.round(w * 0.12), seed % 2 ? 4 : 5, seed % 2 ? 45 : -90), fill: accent, opacity: 0.78 });
    return `<g transform="rotate(${angle} ${x + w / 2} ${y + h / 2})">
    ${rect({ x, y, width: w, height: h, radius: Math.round(w * 0.08), fill, opacity: 0.95, stroke: '#FFFFFF', strokeWidth: 2 })}
    ${circle({ cx: Math.round(x + w * 0.22), cy: Math.round(y + h * 0.18), r: Math.round(w * 0.045), fill: accent, opacity: 0.62 })}
    ${pip}
    ${rect({ x: Math.round(x + w * 0.22), y: Math.round(y + h * 0.73), width: Math.round(w * 0.56), height: Math.round(h * 0.035), radius: 8, fill: accent, opacity: 0.28 })}
  </g>`;
}

function diceFace(x, y, size, fill, accent, seed = 0) {
    const all = [[0.25, 0.25], [0.5, 0.25], [0.75, 0.25], [0.25, 0.5], [0.5, 0.5], [0.75, 0.5], [0.25, 0.75], [0.5, 0.75], [0.75, 0.75]];
    const count = 3 + (seed % 4);
    const chosen = all.filter((_, index) => (index + seed) % 2 === 0).slice(0, count);
    return `<g>
    ${rect({ x, y, width: size, height: size, radius: Math.round(size * 0.16), fill, opacity: 0.95, stroke: '#FFFFFF', strokeWidth: 2 })}
    ${chosen.map(([px, py]) => circle({ cx: Math.round(x + size * px), cy: Math.round(y + size * py), r: Math.round(size * 0.055), fill: accent, opacity: 0.88 })).join('\n    ')}
  </g>`;
}

function slotReel(x, y, w, h, colors, seed) {
    const [bg0, bg1, gold, accent, violet] = colors;
    const symbols = [
        circle({ cx: Math.round(x + w * 0.5), cy: Math.round(y + h * 0.18), r: Math.round(w * 0.16), fill: gold, opacity: 0.82 }),
        polygon({ points: starPoints(x + w * 0.5, y + h * 0.5, w * 0.18, w * 0.08), fill: accent, opacity: 0.82 }),
        polygon({ points: regularPolygonPoints(x + w * 0.5, y + h * 0.82, w * 0.16, 5, -90 + seed * 17), fill: violet, opacity: 0.8 })
    ];
    return `<g>
    ${rect({ x, y, width: w, height: h, radius: Math.round(w * 0.16), fill: '#FFFFFF', opacity: 0.1, stroke: '#FFFFFF', strokeWidth: 2 })}
    ${line({ x1: x + 6, y1: Math.round(y + h / 3), x2: x + w - 6, y2: Math.round(y + h / 3), stroke: '#FFFFFF', strokeWidth: 1, opacity: 0.16 })}
    ${line({ x1: x + 6, y1: Math.round(y + h * 2 / 3), x2: x + w - 6, y2: Math.round(y + h * 2 / 3), stroke: '#FFFFFF', strokeWidth: 1, opacity: 0.16 })}
    ${symbols.join('\n    ')}
  </g>`;
}

function renderSlots({ width, height, variant, colors, random, subtopic }) {
    const [bg0, bg1, gold, accent, violet] = colors;
    const machineX = Math.round(width * (variant === 'detail' ? 0.13 : 0.09));
    const machineY = Math.round(height * (variant === 'og' ? 0.14 : 0.12));
    const machineW = Math.round(width * (variant === 'og' ? 0.58 : 0.64));
    const machineH = Math.round(height * 0.72);
    const reelY = machineY + Math.round(machineH * 0.22);
    const reelH = Math.round(machineH * 0.48);
    const reelW = Math.round(machineW * 0.18);
    const reels = [0.2, 0.41, 0.62].map((pos, index) => slotReel(machineX + Math.round(machineW * pos), reelY, reelW, reelH, colors, index)).join('\n  ');
    const handle = line({ x1: machineX + machineW + Math.round(width * 0.035), y1: machineY + Math.round(machineH * 0.2), x2: machineX + machineW + Math.round(width * 0.08), y2: machineY + Math.round(machineH * 0.08), stroke: gold, strokeWidth: Math.round(width * 0.01), opacity: 0.78 });
    const base = `
  ${rect({ x: machineX, y: machineY, width: machineW, height: machineH, radius: 54, fill: '#0A1026', opacity: 0.9, stroke: gold, strokeWidth: 4, filter: 'url(#shadow)' })}
  ${rect({ x: machineX + Math.round(machineW * 0.1), y: machineY + Math.round(machineH * 0.08), width: Math.round(machineW * 0.38), height: Math.round(machineH * 0.08), radius: 18, fill: gold, opacity: 0.66 })}
  ${reels}
  ${handle}`;

    if (subtopic === 'autoplay') {
        const x = machineX + Math.round(machineW * 0.1);
        const y = machineY + Math.round(machineH * 0.76);
        return `${base}
  ${[0, 1, 2].map(i => `${rect({ x, y: y + i * Math.round(machineH * 0.07), width: Math.round(machineW * 0.46), height: Math.round(machineH * 0.04), radius: 14, fill: '#FFFFFF', opacity: 0.14 })}${circle({ cx: x + Math.round(machineW * (0.18 + i * 0.11)), cy: y + i * Math.round(machineH * 0.07) + Math.round(machineH * 0.02), r: Math.round(machineH * 0.025), fill: i % 2 ? accent : gold, opacity: 0.92 })}`).join('\n  ')}
  ${polygon({ points: regularPolygonPoints(machineX + Math.round(machineW * 0.82), machineY + Math.round(machineH * 0.8), Math.round(width * 0.055), 6), fill: accent, opacity: 0.5 })}`;
    }

    if (subtopic === 'cascading') {
        return `${base}
  ${Array.from({ length: 14 }, (_, i) => polygon({ points: regularPolygonPoints(machineX + Math.round(machineW * (0.18 + random() * 0.58)), machineY + Math.round(machineH * (0.18 + random() * 0.62)), Math.round(width * (0.014 + random() * 0.015)), 4, 45), fill: i % 2 ? accent : violet, opacity: 0.75 })).join('\n  ')}
  ${Array.from({ length: 5 }, (_, i) => pathElement({ d: `M ${machineX + Math.round(machineW * (0.25 + i * 0.1))} ${machineY + Math.round(machineH * 0.18)} L ${machineX + Math.round(machineW * (0.25 + i * 0.1))} ${machineY + Math.round(machineH * 0.76)}`, stroke: accent, strokeWidth: 4, opacity: 0.26 })).join('\n  ')}`;
    }

    if (subtopic === 'demo-real') {
        return `${base}
  ${rect({ x: machineX + Math.round(machineW * 0.07), y: machineY + Math.round(machineH * 0.74), width: Math.round(machineW * 0.38), height: Math.round(machineH * 0.12), radius: 20, fill: accent, opacity: 0.22 })}
  ${rect({ x: machineX + Math.round(machineW * 0.55), y: machineY + Math.round(machineH * 0.74), width: Math.round(machineW * 0.38), height: Math.round(machineH * 0.12), radius: 20, fill: violet, opacity: 0.24 })}
  ${line({ x1: machineX + Math.round(machineW * 0.5), y1: machineY + Math.round(machineH * 0.18), x2: machineX + Math.round(machineW * 0.5), y2: machineY + Math.round(machineH * 0.88), stroke: '#FFFFFF', strokeWidth: 3, opacity: 0.22 })}`;
    }

    if (subtopic === 'buy-feature') {
        return `${base}
  ${rect({ x: machineX + Math.round(machineW * 0.58), y: machineY + Math.round(machineH * 0.74), width: Math.round(machineW * 0.28), height: Math.round(machineH * 0.14), radius: 24, fill: gold, opacity: 0.72, stroke: '#FFFFFF', strokeWidth: 2 })}
  ${polygon({ points: starPoints(machineX + Math.round(machineW * 0.72), machineY + Math.round(machineH * 0.81), Math.round(width * 0.04), Math.round(width * 0.018)), fill: '#0A1026', opacity: 0.82 })}`;
    }

    if (subtopic === 'hit-frequency') {
        return `${base}
  ${chartOverlay({ width, height, x: machineX + Math.round(machineW * 0.08), y: machineY + Math.round(machineH * 0.72), w: Math.round(machineW * 0.72), h: Math.round(machineH * 0.16), random, accent, gold })}`;
    }

        if (subtopic === 'multiplier-wilds') {
                return `${base}
    ${Array.from({ length: 4 }, (_, i) => circle({ cx: machineX + Math.round(machineW * (0.18 + i * 0.18)), cy: machineY + Math.round(machineH * (0.78 + (i % 2) * 0.04)), r: Math.round(width * 0.035), fill: i % 2 ? accent : gold, opacity: 0.36, stroke: '#FFFFFF', strokeWidth: 2 })).join('\n  ')}
    ${Array.from({ length: 4 }, (_, i) => polygon({ points: starPoints(machineX + Math.round(machineW * (0.18 + i * 0.18)), machineY + Math.round(machineH * (0.78 + (i % 2) * 0.04)), Math.round(width * 0.025), Math.round(width * 0.011)), fill: i % 2 ? violet : gold, opacity: 0.82 })).join('\n  ')}
    ${pathElement({ d: `M ${machineX + Math.round(machineW * 0.13)} ${machineY + Math.round(machineH * 0.76)} C ${machineX + Math.round(machineW * 0.34)} ${machineY + Math.round(machineH * 0.58)}, ${machineX + Math.round(machineW * 0.58)} ${machineY + Math.round(machineH * 0.96)}, ${machineX + Math.round(machineW * 0.83)} ${machineY + Math.round(machineH * 0.7)}`, stroke: accent, strokeWidth: 8, opacity: 0.55 })}`;
        }

    return `${base}
  ${Array.from({ length: 5 }, (_, i) => polygon({ points: starPoints(machineX + Math.round(machineW * (0.16 + i * 0.16)), machineY + Math.round(machineH * 0.82), Math.round(width * 0.025), Math.round(width * 0.011)), fill: i % 2 ? accent : gold, opacity: 0.72 })).join('\n  ')}`;
}

function renderCricket({ width, height, variant, colors, random, subtopic }) {
    const [bg0, bg1, gold, accent, red] = colors;
    const fieldCx = Math.round(width * 0.48);
    const fieldCy = Math.round(height * (variant === 'og' ? 0.52 : 0.56));
    const fieldRx = Math.round(width * (variant === 'detail' ? 0.42 : 0.39));
    const fieldRy = Math.round(height * 0.36);
    const pitchW = Math.round(width * 0.12);
    const pitchH = Math.round(height * 0.54);
    const pitchX = fieldCx - Math.round(pitchW / 2);
    const pitchY = fieldCy - Math.round(pitchH / 2);
    const stumps = (y) => Array.from({ length: 3 }, (_, i) => line({ x1: pitchX + Math.round(pitchW * (0.35 + i * 0.15)), y1: y - 24, x2: pitchX + Math.round(pitchW * (0.35 + i * 0.15)), y2: y + 24, stroke: '#FFFFFF', strokeWidth: 5, opacity: 0.8 })).join('\n  ');
    const ballX = subtopic === 'wicket' ? pitchX + Math.round(pitchW * 0.75) : fieldCx + Math.round(fieldRx * (0.34 + random() * 0.18));
    const ballY = subtopic === 'rain' ? fieldCy - Math.round(fieldRy * 0.08) : fieldCy - Math.round(fieldRy * (0.2 + random() * 0.25));
    let special = '';

    if (subtopic === 'rain') {
        special = `${Array.from({ length: 18 }, (_, i) => line({ x1: Math.round(width * (0.12 + random() * 0.72)), y1: Math.round(height * (0.08 + random() * 0.28)), x2: Math.round(width * (0.1 + random() * 0.72)), y2: Math.round(height * (0.2 + random() * 0.36)), stroke: '#9BD7FF', strokeWidth: 3, opacity: 0.5 })).join('\n  ')}
  ${ellipse({ cx: Math.round(width * 0.26), cy: Math.round(height * 0.18), rx: Math.round(width * 0.12), ry: Math.round(height * 0.055), fill: '#CBD5E1', opacity: 0.22 })}
  ${ellipse({ cx: Math.round(width * 0.36), cy: Math.round(height * 0.16), rx: Math.round(width * 0.13), ry: Math.round(height * 0.06), fill: '#CBD5E1', opacity: 0.18 })}`;
    } else if (subtopic === 'toss') {
        special = `${polygon({ points: `${fieldCx - Math.round(fieldRx * 0.42)},${fieldCy - Math.round(fieldRy * 0.2)} ${fieldCx - Math.round(fieldRx * 0.22)},${fieldCy - Math.round(fieldRy * 0.29)} ${fieldCx - Math.round(fieldRx * 0.22)},${fieldCy - Math.round(fieldRy * 0.1)}`, fill: accent, opacity: 0.7 })}
  ${polygon({ points: `${fieldCx + Math.round(fieldRx * 0.42)},${fieldCy - Math.round(fieldRy * 0.2)} ${fieldCx + Math.round(fieldRx * 0.22)},${fieldCy - Math.round(fieldRy * 0.29)} ${fieldCx + Math.round(fieldRx * 0.22)},${fieldCy - Math.round(fieldRy * 0.1)}`, fill: gold, opacity: 0.7 })}
  ${pathElement({ d: `M ${fieldCx - fieldRx * 0.2} ${fieldCy - fieldRy * 0.35} C ${fieldCx} ${fieldCy - fieldRy * 0.55}, ${fieldCx + fieldRx * 0.2} ${fieldCy - fieldRy * 0.35}, ${fieldCx + fieldRx * 0.02} ${fieldCy - fieldRy * 0.22}`, stroke: gold, strokeWidth: 8, opacity: 0.58 })}`;
    } else if (subtopic === 'session') {
        special = chartOverlay({ width, height, x: fieldCx - Math.round(fieldRx * 0.72), y: fieldCy + Math.round(fieldRy * 0.18), w: Math.round(fieldRx * 1.2), h: Math.round(fieldRy * 0.28), random, accent, gold });
    }

    return `
  ${ellipse({ cx: fieldCx, cy: fieldCy, rx: fieldRx, ry: fieldRy, fill: '#0B6E4F', opacity: 0.55, stroke: '#FFFFFF', strokeWidth: 3, filter: 'url(#shadow)' })}
  ${ellipse({ cx: fieldCx, cy: fieldCy, rx: Math.round(fieldRx * 0.63), ry: Math.round(fieldRy * 0.62), fill: 'none', opacity: 0.35, stroke: '#FFFFFF', strokeWidth: 2 })}
  ${rect({ x: pitchX, y: pitchY, width: pitchW, height: pitchH, radius: 24, fill: gold, opacity: 0.46 })}
  ${stumps(pitchY + 22)}
  ${stumps(pitchY + pitchH - 22)}
  ${pathElement({ d: `M ${fieldCx - fieldRx * 0.5} ${fieldCy + fieldRy * 0.3} C ${fieldCx - fieldRx * 0.16} ${fieldCy + fieldRy * 0.06}, ${fieldCx + fieldRx * 0.18} ${fieldCy - fieldRy * 0.18}, ${ballX} ${ballY}`, stroke: gold, strokeWidth: 10, opacity: 0.68 })}
  ${circle({ cx: ballX, cy: ballY, r: Math.round(width * 0.018), fill: red, opacity: 0.95 })}
  ${special}`;
}

function renderFootball({ width, height, variant, colors, random, subtopic }) {
    const [bg0, green, lineColor, gold, accent] = colors;
    const x = Math.round(width * 0.08);
    const y = Math.round(height * 0.17);
    const w = Math.round(width * 0.76);
    const h = Math.round(height * 0.66);
    const field = `
  ${rect({ x, y, width: w, height: h, radius: 42, fill: green, opacity: 0.64, stroke: lineColor, strokeWidth: 3, filter: 'url(#shadow)' })}
  ${line({ x1: x + w / 2, y1: y + 18, x2: x + w / 2, y2: y + h - 18, stroke: lineColor, strokeWidth: 3, opacity: 0.45 })}
  ${ellipse({ cx: x + w / 2, cy: y + h / 2, rx: Math.round(w * 0.08), ry: Math.round(h * 0.16), fill: 'none', stroke: lineColor, strokeWidth: 3, opacity: 0.52 })}
  ${rect({ x: x + 22, y: y + Math.round(h * 0.32), width: Math.round(w * 0.12), height: Math.round(h * 0.36), radius: 10, fill: 'none', stroke: lineColor, strokeWidth: 3, opacity: 0.55 })}
  ${rect({ x: x + w - Math.round(w * 0.12) - 22, y: y + Math.round(h * 0.32), width: Math.round(w * 0.12), height: Math.round(h * 0.36), radius: 10, fill: 'none', stroke: lineColor, strokeWidth: 3, opacity: 0.55 })}`;
    const ball = `${circle({ cx: Math.round(x + w * 0.62), cy: Math.round(y + h * 0.48), r: Math.round(width * 0.025), fill: '#F8FAFC', opacity: 0.94 })}
  ${polygon({ points: regularPolygonPoints(x + w * 0.62, y + h * 0.48, Math.round(width * 0.011), 5), fill: '#111827', opacity: 0.76 })}`;

    if (subtopic === 'extra-time') {
        return `${field}
  ${ball}
  ${circle({ cx: Math.round(x + w * 0.82), cy: Math.round(y + h * 0.2), r: Math.round(width * 0.08), fill: '#0F172A', opacity: 0.74, stroke: gold, strokeWidth: 6 })}
  ${line({ x1: Math.round(x + w * 0.82), y1: Math.round(y + h * 0.2), x2: Math.round(x + w * 0.82), y2: Math.round(y + h * 0.13), stroke: '#FFFFFF', strokeWidth: 5, opacity: 0.82 })}
  ${line({ x1: Math.round(x + w * 0.82), y1: Math.round(y + h * 0.2), x2: Math.round(x + w * 0.87), y2: Math.round(y + h * 0.2), stroke: '#FFFFFF', strokeWidth: 5, opacity: 0.82 })}`;
    }

    if (subtopic === 'cashout') {
        return `${field}
  ${pathElement({ d: `M ${x + w * 0.14} ${y + h * 0.78} C ${x + w * 0.32} ${y + h * 0.38}, ${x + w * 0.58} ${y + h * 0.72}, ${x + w * 0.86} ${y + h * 0.28}`, stroke: gold, strokeWidth: 10, opacity: 0.72 })}
  ${[0.14, 0.34, 0.58, 0.86].map((p, i) => circle({ cx: Math.round(x + w * p), cy: Math.round(y + h * (i % 2 ? 0.46 : 0.72 - i * 0.11)), r: Math.round(width * 0.018), fill: i === 3 ? accent : gold, opacity: 0.9 })).join('\n  ')}
  ${rect({ x: Math.round(x + w * 0.64), y: Math.round(y + h * 0.62), width: Math.round(w * 0.24), height: Math.round(h * 0.12), radius: 20, fill: accent, opacity: 0.26 })}`;
    }

    if (subtopic === 'outrights') {
        return `${field}
  ${pathElement({ d: `M ${x + w * 0.35} ${y + h * 0.75} L ${x + w * 0.43} ${y + h * 0.55} L ${x + w * 0.57} ${y + h * 0.55} L ${x + w * 0.65} ${y + h * 0.75}`, stroke: gold, strokeWidth: 12, opacity: 0.74 })}
  ${rect({ x: Math.round(x + w * 0.42), y: Math.round(y + h * 0.34), width: Math.round(w * 0.16), height: Math.round(h * 0.22), radius: 22, fill: gold, opacity: 0.68 })}
  ${ellipse({ cx: x + w * 0.5, cy: y + h * 0.34, rx: Math.round(w * 0.14), ry: Math.round(h * 0.08), fill: gold, opacity: 0.5 })}
  ${ball}`;
    }

    return `${field}
  ${ball}
  ${Array.from({ length: 4 }, (_, i) => pathElement({ d: `M ${x + w * (0.18 + i * 0.14)} ${y + h * (0.24 + random() * 0.42)} Q ${x + w * (0.26 + i * 0.14)} ${y + h * 0.16}, ${x + w * (0.36 + i * 0.12)} ${y + h * (0.3 + random() * 0.34)}`, stroke: i % 2 ? gold : accent, strokeWidth: 7, opacity: 0.54 })).join('\n  ')}`;
}

function renderBasketball({ width, height, colors, random }) {
    const [bg0, court, wood, blue, dark] = colors;
    const x = Math.round(width * 0.08);
    const y = Math.round(height * 0.14);
    const w = Math.round(width * 0.78);
    const h = Math.round(height * 0.68);
    const ballCx = Math.round(x + w * 0.25);
    const ballCy = Math.round(y + h * 0.57);
    return `
  ${rect({ x, y, width: w, height: h, radius: 38, fill: court, opacity: 0.68, stroke: wood, strokeWidth: 4, filter: 'url(#shadow)' })}
  ${Array.from({ length: 7 }, (_, i) => line({ x1: x + Math.round(w * (0.08 + i * 0.13)), y1: y + 10, x2: x + Math.round(w * (0.08 + i * 0.13)), y2: y + h - 10, stroke: wood, strokeWidth: 2, opacity: 0.24 })).join('\n  ')}
  ${line({ x1: x + w / 2, y1: y + 12, x2: x + w / 2, y2: y + h - 12, stroke: '#FFFFFF', strokeWidth: 3, opacity: 0.36 })}
  ${ellipse({ cx: x + w / 2, cy: y + h / 2, rx: Math.round(w * 0.11), ry: Math.round(h * 0.22), fill: 'none', stroke: '#FFFFFF', strokeWidth: 3, opacity: 0.42 })}
  ${circle({ cx: ballCx, cy: ballCy, r: Math.round(width * 0.055), fill: court, opacity: 0.96, stroke: '#431407', strokeWidth: 4 })}
  ${pathElement({ d: `M ${ballCx - width * 0.05} ${ballCy} C ${ballCx - width * 0.02} ${ballCy - height * 0.05}, ${ballCx + width * 0.02} ${ballCy - height * 0.05}, ${ballCx + width * 0.05} ${ballCy}`, stroke: '#431407', strokeWidth: 3, opacity: 0.66 })}
  ${pathElement({ d: `M ${ballCx - width * 0.05} ${ballCy} C ${ballCx - width * 0.02} ${ballCy + height * 0.05}, ${ballCx + width * 0.02} ${ballCy + height * 0.05}, ${ballCx + width * 0.05} ${ballCy}`, stroke: '#431407', strokeWidth: 3, opacity: 0.66 })}
  ${rect({ x: Math.round(x + w * 0.7), y: Math.round(y + h * 0.22), width: Math.round(w * 0.14), height: Math.round(h * 0.24), radius: 10, fill: '#FFFFFF', opacity: 0.22, stroke: blue, strokeWidth: 4 })}
  ${ellipse({ cx: Math.round(x + w * 0.77), cy: Math.round(y + h * 0.5), rx: Math.round(w * 0.09), ry: Math.round(h * 0.05), fill: 'none', stroke: wood, strokeWidth: 8, opacity: 0.74 })}
  ${pathElement({ d: `M ${x + w * 0.2} ${y + h * 0.76} C ${x + w * 0.4} ${y + h * 0.28}, ${x + w * 0.66} ${y + h * 0.64}, ${x + w * 0.82} ${y + h * 0.28}`, stroke: blue, strokeWidth: 9, opacity: 0.54 })}`;
}

function renderRoulette({ width, height, variant, colors, random, subtopic }) {
    const [bg0, red, gold, cyan, black] = colors;
    const cx = Math.round(width * (variant === 'detail' ? 0.38 : 0.36));
    const cy = Math.round(height * 0.52);
    const radius = Math.round(Math.min(width, height) * (variant === 'og' ? 0.3 : 0.32));
    const segments = Array.from({ length: 24 }, (_, index) => wedge({
        cx,
        cy,
        radius,
        start: index * 15,
        end: (index + 1) * 15,
        fill: index % 3 === 0 ? red : index % 3 === 1 ? black : gold,
        opacity: 0.82,
        stroke: '#FFFFFF',
        strokeWidth: 0.5
    })).join('\n  ');
    const table = rect({ x: Math.round(width * 0.1), y: Math.round(height * 0.18), width: Math.round(width * 0.78), height: Math.round(height * 0.66), radius: 54, fill: '#12352B', opacity: 0.55, stroke: gold, strokeWidth: 3, filter: 'url(#shadow)' });
    const bolts = subtopic === 'lightning'
        ? Array.from({ length: 5 }, (_, index) => polygon({ points: `${Math.round(width * (0.62 + index * 0.055))},${Math.round(height * (0.18 + random() * 0.1))} ${Math.round(width * (0.58 + index * 0.055))},${Math.round(height * 0.42)} ${Math.round(width * (0.65 + index * 0.055))},${Math.round(height * 0.38)} ${Math.round(width * (0.59 + index * 0.055))},${Math.round(height * 0.67)}`, fill: index % 2 ? cyan : gold, opacity: 0.64 })).join('\n  ')
        : Array.from({ length: 4 }, (_, index) => pathElement({ d: `M ${cx} ${cy} A ${radius + index * 18} ${radius + index * 18} 0 0 1 ${cx + radius * 0.95} ${cy - radius * 0.28}`, stroke: index % 2 ? cyan : gold, strokeWidth: 5, opacity: 0.42 })).join('\n  ');

    return `
  ${table}
  ${segments}
  ${circle({ cx, cy, r: Math.round(radius * 0.64), fill: '#050816', opacity: 0.92 })}
  ${circle({ cx, cy, r: Math.round(radius * 0.24), fill: gold, opacity: 0.7 })}
  ${circle({ cx: cx + Math.round(radius * 0.58), cy: cy - Math.round(radius * 0.2), r: Math.round(radius * 0.055), fill: '#FFFFFF', opacity: 0.96 })}
  ${Array.from({ length: 12 }, (_, index) => line({ x1: cx, y1: cy, x2: Math.round(cx + Math.cos(index * Math.PI / 6) * radius), y2: Math.round(cy + Math.sin(index * Math.PI / 6) * radius), stroke: '#FFFFFF', strokeWidth: 1, opacity: 0.24 })).join('\n  ')}
  ${bolts}
  ${rect({ x: Math.round(width * 0.62), y: Math.round(height * 0.54), width: Math.round(width * 0.23), height: Math.round(height * 0.12), radius: 18, fill: cyan, opacity: 0.16 })}`;
}

function renderCasinoCards({ width, height, variant, colors, random, scene, subtopic }) {
    const [bg0, felt, white, gold, red] = colors;
    const tableCx = Math.round(width * 0.48);
    const tableCy = Math.round(height * 0.58);
    const tableRx = Math.round(width * (variant === 'og' ? 0.39 : 0.42));
    const tableRy = Math.round(height * 0.34);
    const base = `
  ${ellipse({ cx: tableCx, cy: tableCy, rx: tableRx, ry: tableRy, fill: felt, opacity: 0.62, stroke: gold, strokeWidth: 4, filter: 'url(#shadow)' })}
  ${ellipse({ cx: tableCx, cy: tableCy, rx: Math.round(tableRx * 0.74), ry: Math.round(tableRy * 0.62), fill: 'none', stroke: '#FFFFFF', strokeWidth: 2, opacity: 0.18 })}`;

    if (scene === 'baccarat') {
        const shoeX = Math.round(width * 0.1);
        const shoeY = Math.round(height * 0.23);
        const beads = Array.from({ length: subtopic === 'shoe' ? 28 : 18 }, (_, index) => circle({
            cx: Math.round(width * (0.62 + (index % 7) * 0.035)),
            cy: Math.round(height * (0.24 + Math.floor(index / 7) * 0.075)),
            r: Math.round(width * 0.012),
            fill: index % 3 === 0 ? red : index % 3 === 1 ? gold : '#FFFFFF',
            opacity: 0.72
        })).join('\n  ');
        const scale = subtopic === 'commission'
            ? `${line({ x1: Math.round(width * 0.72), y1: Math.round(height * 0.5), x2: Math.round(width * 0.72), y2: Math.round(height * 0.72), stroke: gold, strokeWidth: 8, opacity: 0.62 })}
  ${line({ x1: Math.round(width * 0.62), y1: Math.round(height * 0.52), x2: Math.round(width * 0.82), y2: Math.round(height * 0.52), stroke: gold, strokeWidth: 7, opacity: 0.62 })}
  ${ellipse({ cx: Math.round(width * 0.62), cy: Math.round(height * 0.62), rx: Math.round(width * 0.06), ry: Math.round(height * 0.035), fill: red, opacity: 0.42 })}
  ${ellipse({ cx: Math.round(width * 0.82), cy: Math.round(height * 0.62), rx: Math.round(width * 0.06), ry: Math.round(height * 0.035), fill: gold, opacity: 0.42 })}` : '';
        return `${base}
  ${rect({ x: shoeX, y: shoeY, width: Math.round(width * 0.2), height: Math.round(height * 0.18), radius: 24, fill: '#0F172A', opacity: 0.82, stroke: gold, strokeWidth: 3 })}
  ${rect({ x: shoeX + Math.round(width * 0.045), y: shoeY + Math.round(height * 0.035), width: Math.round(width * 0.14), height: Math.round(height * 0.06), radius: 10, fill: white, opacity: 0.18 })}
  ${card(Math.round(width * 0.32), Math.round(height * 0.42), Math.round(width * 0.11), Math.round(height * 0.26), -8, white, red, 1)}
  ${card(Math.round(width * 0.45), Math.round(height * 0.39), Math.round(width * 0.11), Math.round(height * 0.26), 6, white, gold, 2)}
  ${beads}
  ${scale}`;
    }

    if (scene === 'teen-patti') {
        return `${base}
  ${card(Math.round(width * 0.22), Math.round(height * 0.38), Math.round(width * 0.12), Math.round(height * 0.28), -12, white, red, 2)}
  ${card(Math.round(width * 0.36), Math.round(height * 0.35), Math.round(width * 0.12), Math.round(height * 0.28), 1, '#0B1222', gold, 3)}
  ${card(Math.round(width * 0.5), Math.round(height * 0.38), Math.round(width * 0.12), Math.round(height * 0.28), 12, white, gold, 4)}
  ${rect({ x: Math.round(width * 0.68), y: Math.round(height * 0.35), width: Math.round(width * 0.17), height: Math.round(height * 0.24), radius: 34, fill: '#0B1222', opacity: 0.72, stroke: gold, strokeWidth: 3 })}
  ${circle({ cx: Math.round(width * 0.735), cy: Math.round(height * 0.44), r: Math.round(width * 0.015), fill: gold, opacity: 0.82 })}
  ${circle({ cx: Math.round(width * 0.785), cy: Math.round(height * 0.44), r: Math.round(width * 0.015), fill: gold, opacity: 0.82 })}`;
    }

    if (scene === 'dragon-tiger') {
        return `${base}
  ${card(Math.round(width * 0.23), Math.round(height * 0.35), Math.round(width * 0.13), Math.round(height * 0.3), -8, white, red, 0)}
  ${card(Math.round(width * 0.62), Math.round(height * 0.35), Math.round(width * 0.13), Math.round(height * 0.3), 8, white, gold, 1)}
  ${pathElement({ d: `M ${width * 0.16} ${height * 0.3} C ${width * 0.24} ${height * 0.2}, ${width * 0.34} ${height * 0.26}, ${width * 0.42} ${height * 0.18}`, stroke: red, strokeWidth: 12, opacity: 0.54 })}
  ${Array.from({ length: 5 }, (_, index) => line({ x1: Math.round(width * (0.68 + index * 0.022)), y1: Math.round(height * 0.21), x2: Math.round(width * (0.72 + index * 0.022)), y2: Math.round(height * 0.32), stroke: gold, strokeWidth: 5, opacity: 0.58 })).join('\n  ')}`;
    }

    const surrender = subtopic === 'surrender';
    return `${base}
  ${card(Math.round(width * 0.28), Math.round(height * 0.36), Math.round(width * 0.13), Math.round(height * 0.3), -12, white, red, subtopic === 'soft-hands' ? 1 : 2)}
  ${card(Math.round(width * 0.42), Math.round(height * 0.34), Math.round(width * 0.13), Math.round(height * 0.3), 4, white, gold, subtopic === 'soft-hands' ? 0 : 3)}
  ${surrender ? `${pathElement({ d: `M ${width * 0.66} ${height * 0.36} L ${width * 0.78} ${height * 0.48} L ${width * 0.66} ${height * 0.6}`, stroke: red, strokeWidth: 14, opacity: 0.62 })}${rect({ x: Math.round(width * 0.6), y: Math.round(height * 0.62), width: Math.round(width * 0.24), height: Math.round(height * 0.08), radius: 18, fill: red, opacity: 0.24 })}` : `${circle({ cx: Math.round(width * 0.72), cy: Math.round(height * 0.46), r: Math.round(width * 0.075), fill: gold, opacity: 0.24, stroke: gold, strokeWidth: 5 })}${polygon({ points: starPoints(width * 0.72, height * 0.46, width * 0.045, width * 0.02), fill: gold, opacity: 0.68 })}`}`;
}

function renderDice({ width, height, colors, random }) {
    const [bg0, blue, white, orange, cyan] = colors;
    const table = rect({ x: Math.round(width * 0.08), y: Math.round(height * 0.16), width: Math.round(width * 0.78), height: Math.round(height * 0.66), radius: 52, fill: blue, opacity: 0.5, stroke: cyan, strokeWidth: 3, filter: 'url(#shadow)' });
    const size = Math.round(width * 0.12);
    return `${table}
  ${diceFace(Math.round(width * 0.24), Math.round(height * 0.33), size, white, '#111827', 1)}
  ${diceFace(Math.round(width * 0.39), Math.round(height * 0.27), size, white, orange, 2)}
  ${diceFace(Math.round(width * 0.52), Math.round(height * 0.42), size, white, cyan, 3)}
  ${ellipse({ cx: Math.round(width * 0.72), cy: Math.round(height * 0.38), rx: Math.round(width * 0.1), ry: Math.round(height * 0.08), fill: orange, opacity: 0.32 })}
  ${ellipse({ cx: Math.round(width * 0.72), cy: Math.round(height * 0.58), rx: Math.round(width * 0.1), ry: Math.round(height * 0.08), fill: cyan, opacity: 0.28 })}
  ${Array.from({ length: 9 }, (_, index) => circle({ cx: Math.round(width * (0.16 + random() * 0.68)), cy: Math.round(height * (0.22 + random() * 0.52)), r: Math.round(width * 0.008), fill: index % 2 ? orange : cyan, opacity: 0.48 })).join('\n  ')}`;
}

function renderGameShow({ width, height, colors, random, subtopic }) {
    const [bg0, purple, gold, cyan, pink] = colors;
    const wheelCx = Math.round(width * 0.35);
    const wheelCy = Math.round(height * 0.52);
    const radius = Math.round(Math.min(width, height) * 0.29);
    const wheel = Array.from({ length: 16 }, (_, index) => wedge({ cx: wheelCx, cy: wheelCy, radius, start: index * 22.5, end: (index + 1) * 22.5, fill: index % 4 === 0 ? gold : index % 4 === 1 ? cyan : index % 4 === 2 ? pink : purple, opacity: 0.75, stroke: '#FFFFFF', strokeWidth: 0.8 })).join('\n  ');
    const ladder = Array.from({ length: 6 }, (_, index) => rect({ x: Math.round(width * 0.65), y: Math.round(height * (0.18 + index * 0.1)), width: Math.round(width * (0.08 + index * 0.02)), height: Math.round(height * 0.055), radius: 14, fill: index % 2 ? cyan : gold, opacity: 0.32 + index * 0.05 })).join('\n  ');
    return `
  ${rect({ x: Math.round(width * 0.07), y: Math.round(height * 0.13), width: Math.round(width * 0.8), height: Math.round(height * 0.72), radius: 50, fill: purple, opacity: 0.42, stroke: gold, strokeWidth: 3, filter: 'url(#shadow)' })}
  ${wheel}
  ${circle({ cx: wheelCx, cy: wheelCy, r: Math.round(radius * 0.22), fill: '#0B1020', opacity: 0.9 })}
  ${polygon({ points: regularPolygonPoints(wheelCx + Math.round(radius * 1.16), wheelCy, Math.round(radius * 0.14), 3, 180), fill: '#FFFFFF', opacity: 0.82 })}
  ${ladder}
  ${subtopic === 'collect-cashout' ? pathElement({ d: `M ${width * 0.56} ${height * 0.74} C ${width * 0.68} ${height * 0.55}, ${width * 0.74} ${height * 0.68}, ${width * 0.84} ${height * 0.4}`, stroke: pink, strokeWidth: 9, opacity: 0.52 }) : ''}`;
}

function renderBonus({ width, height, colors, random, subtopic }) {
    const [bg0, purple, gold, pink, green] = colors;
    const boxX = Math.round(width * 0.28);
    const boxY = Math.round(height * 0.38);
    const boxW = Math.round(width * 0.3);
    const boxH = Math.round(height * 0.28);
    const calendar = subtopic === 'birthday' || subtopic === 'reload';
    const puzzle = subtopic === 'promo';
    const ring = subtopic === 'loyalty' || subtopic === 'cashback';
    return `
  ${rect({ x: Math.round(width * 0.1), y: Math.round(height * 0.16), width: Math.round(width * 0.76), height: Math.round(height * 0.66), radius: 50, fill: purple, opacity: 0.46, stroke: gold, strokeWidth: 3, filter: 'url(#shadow)' })}
  ${ring ? `${circle({ cx: Math.round(width * 0.67), cy: Math.round(height * 0.46), r: Math.round(width * 0.11), fill: 'none', stroke: green, strokeWidth: 14, opacity: 0.62 })}${circle({ cx: Math.round(width * 0.67), cy: Math.round(height * 0.46), r: Math.round(width * 0.065), fill: gold, opacity: 0.3 })}` : ''}
  ${calendar ? `${rect({ x: Math.round(width * 0.62), y: Math.round(height * 0.28), width: Math.round(width * 0.18), height: Math.round(height * 0.28), radius: 20, fill: '#FFFFFF', opacity: 0.18, stroke: pink, strokeWidth: 3 })}${Array.from({ length: 9 }, (_, i) => circle({ cx: Math.round(width * (0.65 + (i % 3) * 0.045)), cy: Math.round(height * (0.37 + Math.floor(i / 3) * 0.055)), r: Math.round(width * 0.009), fill: i === 4 ? gold : '#FFFFFF', opacity: i === 4 ? 0.8 : 0.38 })).join('\n  ')}` : ''}
  ${puzzle ? `${Array.from({ length: 6 }, (_, i) => rect({ x: Math.round(width * (0.6 + (i % 3) * 0.075)), y: Math.round(height * (0.32 + Math.floor(i / 3) * 0.11)), width: Math.round(width * 0.065), height: Math.round(height * 0.085), radius: 12, fill: i % 2 ? pink : green, opacity: 0.46 })).join('\n  ')}` : ''}
  ${rect({ x: boxX, y: boxY, width: boxW, height: boxH, radius: 28, fill: gold, opacity: 0.72, stroke: '#FFFFFF', strokeWidth: 3 })}
  ${rect({ x: boxX + Math.round(boxW * 0.43), y: boxY, width: Math.round(boxW * 0.14), height: boxH, radius: 8, fill: pink, opacity: 0.82 })}
  ${rect({ x: boxX, y: boxY + Math.round(boxH * 0.34), width: boxW, height: Math.round(boxH * 0.16), radius: 8, fill: pink, opacity: 0.82 })}
  ${pathElement({ d: `M ${boxX + boxW * 0.46} ${boxY} C ${boxX + boxW * 0.2} ${boxY - boxH * 0.45}, ${boxX + boxW * 0.02} ${boxY - boxH * 0.12}, ${boxX + boxW * 0.32} ${boxY + boxH * 0.04}`, stroke: green, strokeWidth: 10, opacity: 0.74 })}
  ${pathElement({ d: `M ${boxX + boxW * 0.56} ${boxY} C ${boxX + boxW * 0.84} ${boxY - boxH * 0.44}, ${boxX + boxW * 0.98} ${boxY - boxH * 0.1}, ${boxX + boxW * 0.68} ${boxY + boxH * 0.04}`, stroke: green, strokeWidth: 10, opacity: 0.74 })}
  ${Array.from({ length: 14 }, (_, index) => polygon({ points: starPoints(width * (0.12 + random() * 0.74), height * (0.16 + random() * 0.66), width * 0.012, width * 0.005), fill: index % 2 ? green : gold, opacity: 0.52 })).join('\n  ')}`;
}

function renderPayment({ width, height, colors, random, subtopic }) {
    const [bg0, blue, gold, teal, violet] = colors;
    const walletX = Math.round(width * 0.18);
    const walletY = Math.round(height * 0.34);
    const walletW = Math.round(width * 0.38);
    const walletH = Math.round(height * 0.3);
    const route = `M ${walletX + walletW * 0.15} ${walletY - height * 0.12} C ${walletX + walletW * 0.45} ${walletY - height * 0.32}, ${walletX + walletW * 0.86} ${walletY - height * 0.18}, ${walletX + walletW * 1.25} ${walletY + height * 0.02}`;
    return `
  ${rect({ x: Math.round(width * 0.09), y: Math.round(height * 0.15), width: Math.round(width * 0.78), height: Math.round(height * 0.68), radius: 54, fill: blue, opacity: 0.44, stroke: teal, strokeWidth: 3, filter: 'url(#shadow)' })}
  ${rect({ x: walletX, y: walletY, width: walletW, height: walletH, radius: 34, fill: '#0F172A', opacity: 0.9, stroke: gold, strokeWidth: 4 })}
  ${rect({ x: walletX + Math.round(walletW * 0.56), y: walletY + Math.round(walletH * 0.28), width: Math.round(walletW * 0.28), height: Math.round(walletH * 0.25), radius: 18, fill: '#FFFFFF', opacity: 0.12, stroke: teal, strokeWidth: 3 })}
  ${circle({ cx: walletX + Math.round(walletW * 0.7), cy: walletY + Math.round(walletH * 0.4), r: Math.round(width * 0.016), fill: teal, opacity: 0.88 })}
  ${pathElement({ d: route, stroke: teal, strokeWidth: 10, opacity: 0.62 })}
  ${polygon({ points: `${walletX + Math.round(walletW * 1.25)},${walletY + Math.round(height * 0.02)} ${walletX + Math.round(walletW * 1.16)},${walletY - Math.round(height * 0.04)} ${walletX + Math.round(walletW * 1.19)},${walletY + Math.round(height * 0.09)}`, fill: teal, opacity: 0.72 })}
  ${circle({ cx: Math.round(width * 0.72), cy: Math.round(height * 0.55), r: Math.round(width * 0.08), fill: subtopic === 'no-bonus-withdrawal' ? gold : teal, opacity: 0.28, stroke: '#FFFFFF', strokeWidth: 3 })}
  ${subtopic === 'no-bonus-withdrawal' ? `${pathElement({ d: `M ${width * 0.68} ${height * 0.55} L ${width * 0.72} ${height * 0.6} L ${width * 0.8} ${height * 0.48}`, stroke: '#FFFFFF', strokeWidth: 9, opacity: 0.82 })}` : `${line({ x1: Math.round(width * 0.72), y1: Math.round(height * 0.55), x2: Math.round(width * 0.72), y2: Math.round(height * 0.47), stroke: '#FFFFFF', strokeWidth: 6, opacity: 0.82 })}${line({ x1: Math.round(width * 0.72), y1: Math.round(height * 0.55), x2: Math.round(width * 0.77), y2: Math.round(height * 0.55), stroke: '#FFFFFF', strokeWidth: 6, opacity: 0.82 })}`}
  ${Array.from({ length: 4 }, (_, index) => rect({ x: Math.round(width * 0.62), y: Math.round(height * (0.2 + index * 0.09)), width: Math.round(width * (0.12 + random() * 0.08)), height: Math.round(height * 0.035), radius: 12, fill: index % 2 ? violet : gold, opacity: 0.28 })).join('\n  ')}`;
}

function renderEditorial({ width, height, colors, random }) {
    const [bg0, bg1, gold, accent, violet] = colors;
    return `
  ${rect({ x: Math.round(width * 0.12), y: Math.round(height * 0.18), width: Math.round(width * 0.72), height: Math.round(height * 0.62), radius: 48, fill: '#FFFFFF', opacity: 0.06, stroke: gold, strokeWidth: 3, filter: 'url(#shadow)' })}
  ${chartOverlay({ width, height, x: Math.round(width * 0.2), y: Math.round(height * 0.32), w: Math.round(width * 0.46), h: Math.round(height * 0.32), random, accent, gold })}
  ${Array.from({ length: 5 }, (_, index) => rect({ x: Math.round(width * 0.62), y: Math.round(height * (0.26 + index * 0.08)), width: Math.round(width * (0.11 + random() * 0.12)), height: Math.round(height * 0.04), radius: 12, fill: index % 2 ? accent : violet, opacity: 0.32 })).join('\n  ')}`;
}

function renderScene(args) {
    switch (args.scene) {
        case 'slots': return renderSlots(args);
        case 'cricket': return renderCricket(args);
        case 'football': return renderFootball(args);
        case 'basketball': return renderBasketball(args);
        case 'roulette': return renderRoulette(args);
        case 'blackjack': return renderCasinoCards(args);
        case 'baccarat': return renderCasinoCards(args);
        case 'teen-patti': return renderCasinoCards(args);
        case 'dragon-tiger': return renderCasinoCards(args);
        case 'dice': return renderDice(args);
        case 'game-show': return renderGameShow(args);
        case 'bonus': return renderBonus(args);
        case 'payment': return renderPayment(args);
        default: return renderEditorial(args);
    }
}

function buildSvg(task, articleContext) {
    const variant = deriveVariant(task.filename);
    const slug = deriveSlug(task.filename);
    const { width, height } = imageSizeForVariant(variant);
    const seed = hashString(`${task.filename}:${task.prompt}:${articleContext.raw || ''}`);
    const random = createRandom(seed);
    const scene = sceneForContext(slug, task.prompt || '', articleContext);
    const subtopic = subtopicFor(slug, task.prompt || '', articleContext);
    const colors = paletteFor(scene, seed);
    const [bg0, bg1] = colors;
    const sceneMarkup = renderScene({ width, height, variant, colors, random, scene, subtopic, slug });
    const safeLabel = escapeXml(`${scene} visual for ${slug}`);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${safeLabel}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg0}"/>
      <stop offset="0.58" stop-color="${bg1}"/>
      <stop offset="1" stop-color="#030712"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="24"/></filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="26" stdDeviation="26" flood-color="#000000" flood-opacity="0.42"/>
    </filter>
  </defs>
  ${background({ width, height, colors, random })}
  ${sceneMarkup}
</svg>`;
}

async function writeImage(task, overwrite, articleContext) {
    const outputPath = path.join(ROOT_DIR, task.filename);

    if (!overwrite && fs.existsSync(outputPath)) {
        return 'skipped';
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const svg = buildSvg(task, articleContext);
    await sharp(Buffer.from(svg))
        .webp({ quality: 88, effort: 6 })
        .toFile(outputPath);

    return 'created';
}

async function writeOptimizedImages(filename) {
    const sourcePath = path.join(ROOT_DIR, filename);
    const ext = path.extname(sourcePath);
    const basename = path.basename(sourcePath, ext);
    const dirname = path.dirname(sourcePath);
    const webpPath = path.join(dirname, `${basename}-optimized.webp`);
    const avifPath = path.join(dirname, `${basename}-optimized.avif`);
    const imageBuffer = fs.readFileSync(sourcePath);
    const metadata = await sharp(imageBuffer).metadata();

    let webpPipeline = sharp(imageBuffer);
    if (metadata.width > MAX_OPTIMIZED_WIDTH) {
        webpPipeline = webpPipeline.resize({ width: MAX_OPTIMIZED_WIDTH, kernel: sharp.kernel.lanczos3 });
    }
    await webpPipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(webpPath);

    let avifPipeline = sharp(imageBuffer);
    if (metadata.width > MAX_OPTIMIZED_WIDTH) {
        avifPipeline = avifPipeline.resize({ width: MAX_OPTIMIZED_WIDTH, kernel: sharp.kernel.lanczos3 });
    }
    await avifPipeline.avif({ quality: AVIF_QUALITY }).toFile(avifPath);

    return [path.relative(ROOT_DIR, webpPath), path.relative(ROOT_DIR, avifPath)];
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const manifest = options.fromCommit
        ? buildManifestFromCommit(options.fromCommit, options.promptsFile)
        : loadJson(options.manifestPath);
    const promptsFile = options.promptsFile || path.resolve(ROOT_DIR, manifest.promptsFile || DEFAULT_PROMPTS_FILE);
    const promptTasks = loadJson(promptsFile);
    const promptLookup = buildPromptLookup(promptTasks);

    let created = 0;
    let skipped = 0;
    let optimized = 0;

    console.log(`🎨 Contextual local image generation for ${manifest.publishBatchName || path.basename(options.manifestPath)}`);
    console.log(`   Articles: ${(manifest.articleFiles || []).length}`);
    console.log(`   Prompts: ${path.relative(ROOT_DIR, promptsFile)}`);

    for (const articleFile of manifest.articleFiles || []) {
        const slug = path.basename(articleFile, '.md');
        const articleContext = loadArticleContext(articleFile);
        const tasks = promptLookup.get(slug) || [];

        if (tasks.length !== 3) {
            throw new Error(`Expected 3 prompt tasks for ${articleFile}, found ${tasks.length}.`);
        }

        for (const task of tasks) {
            const result = await writeImage(task, options.overwrite, articleContext);
            const scene = sceneForContext(slug, task.prompt || '', articleContext);
            const subtopic = subtopicFor(slug, task.prompt || '', articleContext);

            if (result === 'created') {
                created += 1;
                console.log(`   ✅ ${task.filename} (${scene}/${subtopic})`);
            } else {
                skipped += 1;
                console.log(`   ⏭️  ${task.filename} (${scene}/${subtopic})`);
            }

            if (options.withOptimized) {
                const [webpPath, avifPath] = await writeOptimizedImages(task.filename);
                optimized += 2;
                console.log(`      ⚙️  ${webpPath} + ${avifPath}`);
            }
        }
    }

    console.log(`✅ Contextual local images ready. Created: ${created}, skipped: ${skipped}, optimized files written: ${optimized}`);
}

main().catch(error => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
});
