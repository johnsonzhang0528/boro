const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { glob } = require('glob');

const BLOG_DIR = 'blog';
const ASSETS_OG_DIR = 'assets/og';
const ASSETS_BLOG_DIR = 'assets/blog';

// Utility to verify if optimized versions exist
async function ensureOptimized(sourcePath, outputDir, basename) {
    const webpPath = path.join(outputDir, `${basename}-optimized.webp`);
    const avifPath = path.join(outputDir, `${basename}-optimized.avif`);
    let generated = false;

    if (!fs.existsSync(sourcePath)) {
        console.warn(`⚠️ Source file missing: ${sourcePath}`);
        return false;
    }

    if (!fs.existsSync(webpPath)) {
        console.log(`⚡ Generating WebP for ${basename}...`);
        await sharp(sourcePath)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toFile(webpPath);
        generated = true;
    }

    if (!fs.existsSync(avifPath)) {
        console.log(`⚡ Generating AVIF for ${basename}...`);
        await sharp(sourcePath)
            .resize({ width: 1200, withoutEnlargement: true })
            .avif({ quality: 60 })
            .toFile(avifPath);
        generated = true;
    }

    return true; // Return true if optimized files are now available (or were already)
}

async function main() {
    console.log('🚀 Starting Global Image Check & Fix...');
    const files = await glob(`${BLOG_DIR}/*.md`);

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        console.log(`\n📄 Checking: ${file}`);

        // --- 1. Fix Frontmatter OG Image ---
        // Regex to capture ogImage: value
        // We look for lines starting with ogImage:
        const ogRegex = /^ogImage:\s*["']?([^"'\s\n]+)["']?$/m;
        const ogMatch = content.match(ogRegex);

        if (ogMatch) {
            const currentOg = ogMatch[1];
            if (!currentOg.includes('-optimized')) {
                // Needs optimization
                const sourcePath = path.join(ASSETS_OG_DIR, currentOg);
                const basename = path.parse(currentOg).name;
                
                const success = await ensureOptimized(sourcePath, ASSETS_OG_DIR, basename);
                if (success) {
                    const newOg = `${basename}-optimized.webp`;
                    content = content.replace(ogMatch[0], `ogImage: ${newOg}`);
                    console.log(`✅ Updated OG Image: ${newOg}`);
                    modified = true;
                }
            }
        }

        // --- 2. Fix Content Images ---
        // We look for standard <img> tags. <picture> tags usually mean it's already done, 
        // but we should check if they point to valid files? 
        // For now, let's focus on upgrading raw <img> tags or pure Markdown images to <picture>.
        // Actually, the previous scripts might have left raw <img> tags if they failed.
        // Or if I wrote manual markdown with ![alt](path).

        // Pattern A: <img src="/assets/blog/foo.webp" ...> (that is NOT inside a picture tag?)
        // It's hard to regex context-free. 
        // Simplest strategy: iterate all <img> src.
        
        // Find all img tags
        const imgTagRegex = /<img\s+[^>]*src=["'](\/assets\/[^"']+)["'][^>]*>/g;
        let match;
        
        // We use string replacement with a callback or loop.
        // To avoid messing up existing <picture> tags, we should check if the img is wrapped in picture.
        // But scanning line-by-line or sophisticated parsing is needed.
        
        // Hack: The SOP says we use <picture> for optimized images. 
        // If we see <img src="..."> that does NOT have -optimized, it definitely needs fixing.
        // If we see <img src="...-optimized..." > but NO <source> siblings, it's also suboptimal but "ok" for visual.
        // Let's target strictly un-optimized paths first.

        const matches = [...content.matchAll(imgTagRegex)];
        for (const m of matches) {
            const fullTag = m[0];
            const srcPath = m[1]; // /assets/blog/file.ext
            
            if (srcPath.includes('-optimized')) continue;

            const relativePath = srcPath.startsWith('/') ? srcPath.slice(1) : srcPath; // assets/blog/file.ext
            if (!fs.existsSync(relativePath)) {
                console.warn(`⚠️ Content image missing: ${relativePath}`);
                continue;
            }

            const dir = path.dirname(relativePath); // assets/blog
            const ext = path.extname(relativePath);
            const basename = path.basename(relativePath, ext);

            // Verify/Generate optimized
            await ensureOptimized(relativePath, dir, basename);

            // Construct new <picture> block
            // Preserve attributes (alt, width, height, etc.)
            // We can just reuse the full tag but replace the src.
            
            const optimizedWebP = `${path.dirname(srcPath)}/${basename}-optimized.webp`;
            const optimizedAvif = `${path.dirname(srcPath)}/${basename}-optimized.avif`;
            
            // Extract attributes from original tag to preserve them
            // This is a bit loose but works for standard attributes
            const cleanTag = fullTag
                .replace(srcPath, optimizedWebP) // update src to webp
                .replace(/\s*\/?>$/, '>'); // ensure it ends cleanly
            
            const pictureBlock = `
<picture class="content-image">
  <source srcset="${optimizedAvif}" type="image/avif">
  <source srcset="${optimizedWebP}" type="image/webp">
  ${cleanTag}
</picture>`;

            // Replace in content
            content = content.replace(fullTag, pictureBlock.trim());
            console.log(`✅ Upgraded content image to <picture>: ${basename}`);
            modified = true;
        }
        
        // --- 3. Fix Markdown Syntax Images ![alt](/path) ---
        const mdImgRegex = /!\[(.*?)\]\((.*?)\)/g;
        // Logic: Convert these to <picture> tags too.
        const mdMatches = [...content.matchAll(mdImgRegex)];
        for (const m of mdMatches) {
             const fullMd = m[0];
             const alt = m[1];
             const src = m[2];
             
             if (src.includes('-optimized')) continue; // Assume handled if optimized?
             
             // Check if it's a local asset
             if (!src.startsWith('/assets/') && !src.startsWith('assets/')) continue;
             
             const relativePath = src.startsWith('/') ? src.slice(1) : src;
             if (!fs.existsSync(relativePath)) continue;

             const dir = path.dirname(relativePath);
             const ext = path.extname(relativePath);
             const basename = path.basename(relativePath, ext);
             
             await ensureOptimized(relativePath, dir, basename);
             
             const optimizedWebP = `/${dir}/${basename}-optimized.webp`; 
             const optimizedAvif = `/${dir}/${basename}-optimized.avif`;
             
             const pictureBlock = `
<picture class="content-image">
  <source srcset="${optimizedAvif}" type="image/avif">
  <source srcset="${optimizedWebP}" type="image/webp">
  <img src="${optimizedWebP}" alt="${alt}" loading="lazy" decoding="async">
</picture>`;

            content = content.replace(fullMd, pictureBlock.trim());
            console.log(`✅ Converted Markdown image to <picture>: ${basename}`);
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`💾 Saved changes to ${file}`);
        }
    }
    console.log('\n✨ Global check completed.');
}

main();
