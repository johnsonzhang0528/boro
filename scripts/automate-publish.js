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
    // Fix: ogImage regex needs to be greedy enough or character class based to capture the filename
    const imageRegex = /(?:!\[.*?\]\((.*?)\))|(?:src=["'](.*?)["'])|(?:srcset=["'](.*?)["'])|(?:ogImage:\s*["']?([^"'\s\n]+)["']?)/g;
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
            console.log(`   🔍 Found OG Image: ${imgPath}`);
        } else if (imgPath) {
             console.log(`   🔍 Found Content Image: ${imgPath}`);
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
        } else if (imgPath && imgPath.includes('-optimized') && !imgPath.startsWith('http')) {
             // Case: Markdown already has -optimized path, but we need to ensure the optimized file exists.
             // If it doesn't exist, we look for the source file (without -optimized) to generate it.
             
             let localPath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
             
             // If the optimized file already exists, we might skip or re-process. 
             // But if it's missing (which is the issue here), we must find the source.
             if (!fs.existsSync(localPath)) {
                 const dir = path.dirname(localPath);
                 const ext = path.extname(localPath);
                 const basename = path.basename(localPath, ext); // e.g. image-optimized
                 const originalBasename = basename.replace('-optimized', ''); // e.g. image
                 
                 // Look for source file with common extensions
                 const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];
                 for (const srcExt of extensions) {
                     const sourcePath = path.join(dir, originalBasename + srcExt);
                     if (fs.existsSync(sourcePath)) {
                         // Found the source! Add it to processing list.
                         // The script will generate the optimized versions from this source.
                         imagesToProcess.add({ 
                             originalPath: sourcePath, 
                             isOgImage, 
                             originalString: match[0], 
                             capturedPath: match[1] || match[2] || match[3] || match[4] 
                         });
                         break;
                     }
                 }
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
                    // Find the boundaries of the current tag to ensure we check the correct context
                    const tagStart = string.lastIndexOf('<', offset);
                    const tagEnd = string.indexOf('>', offset + match.length);
                    
                    if (tagStart !== -1 && tagEnd !== -1) {
                        const tagContent = string.slice(tagStart, tagEnd);
                        // Check if it belongs to a <source> tag with type="image/avif"
                        if (attr === 'srcset' && tagContent.includes('type="image/avif"')) {
                             return `${attr}="${path.dirname(img.capturedPath)}/${optimizedBase}.avif"`;
                        }
                    }
                    
                    // Default to WebP for img src, source type="image/webp", or markdown syntax
                    return `${attr}="${path.dirname(img.capturedPath)}/${optimizedBase}.webp"`;
                });

                // 3. Handle Markdown Syntax ![alt](path) - Always WebP
                // The regex above handles HTML attributes. We need another pass for Markdown if mixed.
                const mdRegex = new RegExp(`(!\\[.*?\\]\\()${escapedPath}(\\))`, 'g');
                content = content.replace(mdRegex, `$1${path.dirname(img.capturedPath)}/${optimizedBase}.webp$2`);

                // 4. Handle corresponding .avif reference if the current file is .webp
                // This fixes the issue where <source srcset="...avif"> is not updated because the .avif file doesn't exist yet
                if (path.extname(img.capturedPath) === '.webp') {
                    const avifPathStr = img.capturedPath.replace(/\.webp$/, '.avif');
                    const escapedAvifPath = escapeRegExp(avifPathStr);
                    const avifRegex = new RegExp(`(src|srcset)=["']${escapedAvifPath}["']`, 'g');
                    
                    content = content.replace(avifRegex, (match, attr) => {
                        return `${attr}="${path.dirname(img.capturedPath)}/${optimizedBase}.avif"`;
                    });
                }
            }

        } catch (error) {
            console.error(`   ❌ Error processing ${img.originalPath}:`, error);
        }
    }

    // 3. Date Scheduling
    console.log('📅 Scheduling post...');
    
    const allFiles = await glob(`${BLOG_DIR}/*.md`);
    const dateCounts = {};
    let maxDate = null;

    for (const file of allFiles) {
        if (file === targetFile) continue; // Skip the current file being edited
        
        const fileContent = fs.readFileSync(file, 'utf8');
        const dateMatch = fileContent.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            const dateStr = dateMatch[1];
            const date = DateTime.fromISO(dateStr);
            
            dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;

            if (!maxDate || date > maxDate) {
                maxDate = date;
            }
        }
    }

    const today = DateTime.now().startOf('day');
    let newDate;
    const MAX_POSTS_PER_DAY = 2;

    if (!maxDate || maxDate < today) {
        // If no posts or last post is in the past, check today's slots
        const todayStr = today.toISODate();
        const todayCount = dateCounts[todayStr] || 0;
        
        if (todayCount < MAX_POSTS_PER_DAY) {
            newDate = today;
        } else {
            newDate = today.plus({ days: 1 });
        }
    } else {
        // Last post is today or future
        const maxDateStr = maxDate.toISODate();
        const maxDateCount = dateCounts[maxDateStr] || 0;

        if (maxDateCount < MAX_POSTS_PER_DAY) {
            newDate = maxDate;
        } else {
            newDate = maxDate.plus({ days: 1 });
        }
    }

    const newDateStr = newDate.toISODate();
    console.log(`   Latest existing post: ${maxDate ? maxDate.toISODate() : 'None'}`);
    console.log(`   New post date: ${newDateStr} (Daily Limit: ${MAX_POSTS_PER_DAY})`);

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
