const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { glob } = require('glob');
const { DateTime } = require('luxon');
const { execSync } = require('child_process');

// Configuration
const BLOG_DIR = 'blog';
const ASSETS_DIR = 'assets';
const MAX_WIDTH = 1536;
const WEBP_QUALITY = 75;
const AVIF_QUALITY = 50;

async function main() {
    console.log('🚀 Starting automation script...');

    // 1. Identify the target file (most recently modified markdown file in blog/)
    const files = await glob(`${BLOG_DIR}/*.md`);
    if (files.length === 0) {
        console.error('❌ No markdown files found in blog directory.');
        process.exit(1);
    }

    const targetFile = files
        .map(file => ({ file, mtime: fs.statSync(file).mtime }))
        .sort((a, b) => b.mtime - a.mtime)[0].file;

    console.log(`📝 Target file identified: ${targetFile}`);

    let content = fs.readFileSync(targetFile, 'utf8');

    // 2. Image Processing
    console.log('🖼️  Processing images...');
    
    // Regex to find images. Matches:
    // 1. Markdown: ![alt](path)
    // 2. HTML: src="path" or srcset="path"
    // 3. Frontmatter: ogImage: "path" (Note: SOP says ogImage is filename only, path is assets/og/)
    
    // We need to handle full paths in content and filename-only in ogImage
    const imageRegex = /(?:!\[.*?\]\((.*?)\))|(?:src=["'](.*?)["'])|(?:srcset=["'](.*?)["'])|(?:ogImage:\s*["']?(.*?)["']?)/g;
    let match;
    const imagesToProcess = new Set();

    // Extract all potential image paths
    while ((match = imageRegex.exec(content)) !== null) {
        // match[1] -> markdown path
        // match[2] -> src path
        // match[3] -> srcset path
        // match[4] -> ogImage filename
        
        let imgPath = match[1] || match[2] || match[3];
        let isOgImage = false;

        if (match[4]) {
            // It's an OG image in frontmatter
            imgPath = `assets/og/${match[4].trim()}`;
            isOgImage = true;
        }

        if (imgPath && !imgPath.includes('-optimized') && !imgPath.startsWith('http')) {
            // Normalize path. If it starts with /, remove it for local file check
            let localPath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
            
            // Handle cases where path might be relative or absolute in the project
            // SOP says assets are in assets/blog/ or assets/og/
            // If the path doesn't start with assets/, we might need to guess or skip
            // But usually they are /assets/...
            
            if (fs.existsSync(localPath)) {
                imagesToProcess.add({ originalPath: localPath, isOgImage, originalString: match[0], capturedPath: match[1] || match[2] || match[3] || match[4] });
            }
        }
    }

    for (const img of imagesToProcess) {
        const ext = path.extname(img.originalPath);
        const basename = path.basename(img.originalPath, ext);
        const dirname = path.dirname(img.originalPath);
        
        const optimizedBase = `${basename}-optimized`;
        const webpPath = path.join(dirname, `${optimizedBase}.webp`);
        const avifPath = path.join(dirname, `${optimizedBase}.avif`);

        console.log(`   Processing: ${img.originalPath}`);

        try {
            const imageBuffer = fs.readFileSync(img.originalPath);
            const metadata = await sharp(imageBuffer).metadata();

            // Resize and Convert to WebP
            let pipeline = sharp(imageBuffer);
            
            if (metadata.width > MAX_WIDTH) {
                pipeline = pipeline.resize({ width: MAX_WIDTH, kernel: sharp.kernel.lanczos3 });
            }

            await pipeline
                .webp({ quality: WEBP_QUALITY, effort: 4 })
                .toFile(webpPath);

            // Convert to AVIF
            // Re-use pipeline or start fresh? Sharp instances are immutable-ish in chain, but let's start fresh to be safe or clone
            let avifPipeline = sharp(imageBuffer);
            if (metadata.width > MAX_WIDTH) {
                avifPipeline = avifPipeline.resize({ width: MAX_WIDTH, kernel: sharp.kernel.lanczos3 });
            }
            await avifPipeline
                .avif({ quality: AVIF_QUALITY })
                .toFile(avifPath);

            console.log(`   ✅ Created: ${webpPath} & ${avifPath}`);

            // Update Content
            // If it was OG Image (filename only in frontmatter)
            if (img.isOgImage) {
                // Replace the filename in the content
                // Regex for ogImage line specifically to be safe
                const ogRegex = new RegExp(`(ogImage:\\s*["']?)(${escapeRegExp(img.capturedPath)})(["']?)`);
                content = content.replace(ogRegex, `$1${optimizedBase}.webp$3`);
            } else {
                // Replace the path in the content
                // We replace the extension with .webp and add -optimized
                // The user wants to use the optimized version in the src
                
                // Simple string replacement for the path might be risky if same string appears elsewhere
                // But paths are usually unique enough
                const newPath = img.capturedPath.replace(basename + ext, optimizedBase + '.webp');
                content = content.split(img.capturedPath).join(newPath);
            }

        } catch (error) {
            console.error(`   ❌ Error processing ${img.originalPath}:`, error);
        }
    }

    // 3. Date Scheduling
    console.log('📅 Scheduling post...');
    
    // Find the latest date among all OTHER posts
    let maxDate = DateTime.now().minus({ days: 1 }); // Default to yesterday if no posts
    
    for (const file of files) {
        if (file === targetFile) continue; // Skip the current file being edited
        
        const fileContent = fs.readFileSync(file, 'utf8');
        const dateMatch = fileContent.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            const date = DateTime.fromISO(dateMatch[1]);
            if (date > maxDate) {
                maxDate = date;
            }
        }
    }

    const newDate = maxDate.plus({ days: 1 });
    const newDateStr = newDate.toISODate();
    console.log(`   Latest existing post: ${maxDate.toISODate()}`);
    console.log(`   New post date: ${newDateStr}`);

    // Update Frontmatter
    content = content.replace(/date:\s*(\d{4}-\d{2}-\d{2})/, `date: ${newDateStr}`);
    // If lastUpdated exists, update it too, or add it? SOP says update it.
    if (content.match(/lastUpdated:\s*(\d{4}-\d{2}-\d{2})/)) {
        content = content.replace(/lastUpdated:\s*(\d{4}-\d{2}-\d{2})/, `lastUpdated: ${newDateStr}`);
    } else {
        // Insert after date if not exists (optional, but good practice)
        content = content.replace(/(date:.*\n)/, `$1lastUpdated: ${newDateStr}\n`);
    }

    // Write updated content back to file
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('✅ File updated with new paths and date.');

    // 4. Git Operations
    console.log('octocat Git operations...');
    try {
        execSync('git add .', { stdio: 'inherit' });
        execSync(`git commit -m "post ${newDateStr}"`, { stdio: 'inherit' });
        console.log('   Committed.');
        
        console.log('   Pushing to remote...');
        execSync('git push', { stdio: 'inherit' });
        console.log('✅ Successfully pushed to Vercel!');
    } catch (error) {
        console.error('❌ Git operation failed:', error.message);
        process.exit(1);
    }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

main();
