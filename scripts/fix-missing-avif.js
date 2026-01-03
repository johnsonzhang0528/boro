const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BLOG_DIR = 'blog';
const ASSETS_OG_DIR = 'assets/og';
const ASSETS_BLOG_DIR = 'assets/blog';

// Ensure directories exist
if (!fs.existsSync(ASSETS_OG_DIR)) fs.mkdirSync(ASSETS_OG_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_BLOG_DIR)) fs.mkdirSync(ASSETS_BLOG_DIR, { recursive: true });

// List of files created in the recent batch (excluding Rise of Olympus which is fixed)
const targetFiles = [
    'jhandi-munda-real-money-guide.md',
    'horse-racing-betting-guide-bangladesh.md',
    'book-of-dead-slot-review-strategy.md',
    'starburst-slot-review-strategy.md',
    'gonzos-quest-slot-review-strategy.md',
    'wolf-gold-slot-review-strategy.md',
    'reactoonz-slot-review-strategy.md',
    'fire-joker-slot-review-strategy.md',
    'legacy-of-dead-slot-review-strategy.md'
];

function moveFile(filename, destDir) {
    const sourcePath = filename; // Root
    const destPath = path.join(destDir, filename);

    if (fs.existsSync(sourcePath)) {
        console.log(`📦 Moving ${filename} to ${destDir}...`);
        // If destination exists, overwrite or skip? 
        // If it exists, it might be the unoptimized one we want to replace, or already optimized.
        // Let's overwrite to be safe, assuming root has the fresh generation.
        fs.renameSync(sourcePath, destPath);
        return true;
    } else if (fs.existsSync(destPath)) {
        console.log(`ℹ️  ${filename} is already in ${destDir}.`);
        return true;
    } else {
        // console.warn(`⚠️  Could not find ${filename} in root or ${destDir}.`);
        return false;
    }
}

function processFile(mdFilename) {
    const filePath = path.join(BLOG_DIR, mdFilename);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    console.log(`\n🔧 Processing ${mdFilename}...`);
    const content = fs.readFileSync(filePath, 'utf8');

    // 1. Find OG Image
    const ogMatch = content.match(/ogImage:\s*["']?([^"'\s\n]+)["']?/);
    if (ogMatch) {
        const ogFilename = ogMatch[1].trim();
        moveFile(ogFilename, ASSETS_OG_DIR);
    }

    // 2. Find Content Images
    // Matches: src="/assets/blog/filename.webp" or source srcset="..."
    const imgRegex = /(?:src|srcset)=["']\/assets\/blog\/([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
        const filename = match[1];
        // The filename in markdown might be -optimized.webp or .avif
        // We need to find the original source in root.
        // Usually the root file is "name.webp" (without -optimized)
        
        let sourceName = filename.replace('-optimized', '').replace('.avif', '.webp');
        
        // Try moving the source file
        moveFile(sourceName, ASSETS_BLOG_DIR);
    }

    // 3. Run Automate Publish
    try {
        console.log(`🚀 Running automate-publish.js for ${mdFilename}...`);
        execSync(`node scripts/automate-publish.js ${filePath}`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`❌ Failed to publish ${mdFilename}:`, e.message);
    }
}

// Main execution
console.log('🔍 Starting Batch Fix for Missing AVIFs...');
targetFiles.forEach(processFile);
console.log('\n✅ Batch Fix Complete!');
