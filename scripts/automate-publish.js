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

    let targetFile;
    const argFile = process.argv[2];

    if (argFile) {
        targetFile = argFile;
        // Try to resolve path if it doesn't exist directly
        if (!fs.existsSync(targetFile)) {
            if (fs.existsSync(path.join(BLOG_DIR, argFile))) {
                targetFile = path.join(BLOG_DIR, argFile);
            } else if (fs.existsSync(path.join(BLOG_DIR, `${argFile}.md`))) {
                targetFile = path.join(BLOG_DIR, `${argFile}.md`);
            }
        }

        if (!fs.existsSync(targetFile)) {
            console.error(`❌ Error: Specified file not found: ${argFile}`);
            process.exit(1);
        }
        console.log(`📝 Target file specified: ${targetFile}`);
    } else {
        // 1. Identify the target file (most recently modified markdown file in blog/)
        const files = await glob(`${BLOG_DIR}/*.md`);
        if (files.length === 0) {
            console.error('❌ No markdown files found in blog directory.');
            process.exit(1);
        }

        targetFile = files
            .map(file => ({ file, mtime: fs.statSync(file).mtime }))
            .sort((a, b) => b.mtime - a.mtime)[0].file;

        console.log(`📝 Target file identified (latest): ${targetFile}`);
    }

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
        } else if (imgPath && imgPath.includes('-optimized') === false && !imgPath.startsWith('http')) {
             // Special case: User manually wrote .avif or .webp but forgot -optimized
             // We need to check if the base file exists (e.g. user wrote image.avif, but only image.png exists)
             // OR if the user actually has image.avif and wants it optimized to image-optimized.avif
             
             let localPath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
             if (fs.existsSync(localPath)) {
                 imagesToProcess.add({ originalPath: localPath, isOgImage, originalString: match[0], capturedPath: match[1] || match[2] || match[3] || match[4] });
             }
        }
    }

    const processedFiles = new Set();
    for (const img of imagesToProcess) {
        const ext = path.extname(img.originalPath);
        const basename = path.basename(img.originalPath, ext);
        const dirname = path.dirname(img.originalPath);
        
        const optimizedBase = `${basename}-optimized`;
        const webpPath = path.join(dirname, `${optimizedBase}.webp`);
        const avifPath = path.join(dirname, `${optimizedBase}.avif`);

        // 1. Image Processing (Once per file)
        if (!processedFiles.has(img.originalPath)) {
            processedFiles.add(img.originalPath);
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
                let avifPipeline = sharp(imageBuffer);
                if (metadata.width > MAX_WIDTH) {
                    avifPipeline = avifPipeline.resize({ width: MAX_WIDTH, kernel: sharp.kernel.lanczos3 });
                }
                await avifPipeline
                    .avif({ quality: AVIF_QUALITY })
                    .toFile(avifPath);

                console.log(`   ✅ Created: ${webpPath} & ${avifPath}`);
            } catch (error) {
                console.error(`   ❌ Error processing ${img.originalPath}:`, error);
            }
        }

        try {

            // Update Content with Context Awareness
            // We use a regex that matches the specific path to replace it correctly based on context
            
            // Escape the path for regex
            const escapedPath = escapeRegExp(img.capturedPath);
            
            // 1. Handle OG Image (Frontmatter) - Always WebP
            if (img.isOgImage) {
                const ogRegex = new RegExp(`(ogImage:\\s*["']?)(${escapedPath})(["']?)`);
                content = content.replace(ogRegex, `$1${optimizedBase}.webp$3`);
            } else {
                // 2. Handle Content Images
                // We iterate through all occurrences of this image path in the content
                // and check the surrounding context to decide extension
                
                // Regex to find the path within src or srcset attributes
                // We capture the attribute name to help with context, but mostly we look at the full match
                const pathRegex = new RegExp(`(src|srcset)=["']${escapedPath}["']`, 'g');
                
                content = content.replace(pathRegex, (match, attr, offset, string) => {
                    // Look at the surrounding context (e.g., +/- 100 chars) to find type="image/avif"
                    // We look backwards and forwards to cover <source type="..." srcset="..."> and <source srcset="..." type="...">
                    const contextStart = Math.max(0, offset - 100);
                    const contextEnd = Math.min(string.length, offset + match.length + 100);
                    const context = string.slice(contextStart, contextEnd);
                    
                    // Check if it belongs to a <source> tag with type="image/avif"
                    // Simple heuristic: if "image/avif" appears nearby and we are in a srcset
                    if (attr === 'srcset' && context.includes('image/avif')) {
                         // Verify it's the same tag? 
                         // A simplified check: if 'type="image/avif"' is closer to this match than another tag start/end
                         return `${attr}="${path.dirname(img.capturedPath)}/${optimizedBase}.avif"`;
                    }
                    
                    // Default to WebP for img src, source type="image/webp", or markdown syntax (handled separately if needed)
                    return `${attr}="${path.dirname(img.capturedPath)}/${optimizedBase}.webp"`;
                });

                // 3. Handle Markdown Syntax ![alt](path) - Always WebP
                // The regex above handles HTML attributes. We need another pass for Markdown if mixed.
                const mdRegex = new RegExp(`(!\\[.*?\\]\\()${escapedPath}(\\))`, 'g');
                content = content.replace(mdRegex, `$1${path.dirname(img.capturedPath)}/${optimizedBase}.webp$2`);
            }

        } catch (error) {
            console.error(`   ❌ Error processing ${img.originalPath}:`, error);
        }
    }

    // 3. Date Scheduling
    console.log('📅 Scheduling post...');
    
    // Find the latest date among all OTHER posts
    let maxDate = DateTime.now().minus({ days: 1 }); // Default to yesterday if no posts
    
    // Ensure 'files' is defined. If we used argFile, 'files' might not be populated yet.
    const allFiles = await glob(`${BLOG_DIR}/*.md`);

    for (const file of allFiles) {
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

    // 4. Cleanup
    console.log('🧹 Cleaning up...');
    if (fs.existsSync('prompts.json')) {
        fs.unlinkSync('prompts.json');
        console.log('   🗑️  Deleted prompts.json');
    }

    // 5. Git Operations
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
