const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { glob } = require('glob');

// Configuration
const BLOG_DIR = 'blog';
const MAX_WIDTH = 1536;
const WEBP_QUALITY = 75;
const AVIF_QUALITY = 50;

async function main() {
    console.log('🚀 Starting BATCH image optimization script...');

    // 1. Identify all markdown files in blog/
    const files = await glob(`${BLOG_DIR}/*.md`);
    if (files.length === 0) {
        console.error('❌ No markdown files found in blog directory.');
        process.exit(1);
    }

    console.log(`📝 Found ${files.length} markdown files to process.`);

    for (const targetFile of files) {
        console.log(`\n--------------------------------------------------`);
        console.log(`📂 Processing file: ${targetFile}`);
        
        let content = fs.readFileSync(targetFile, 'utf8');
        let isContentModified = false;

        // 2. Image Processing Logic (Extracted from automate-publish.js)
        
        // Regex to find images. Matches:
        // 1. Markdown: ![alt](path)
        // 2. HTML: src="path" or srcset="path"
        // 3. Frontmatter: ogImage: "path"
        const imageRegex = /(?:!\[.*?\]\((.*?)\))|(?:src=["'](.*?)["'])|(?:srcset=["'](.*?)["'])|(?:ogImage:\s*["']?([^"'\s\n]+)["']?)/g;
        let match;
        const imagesToProcess = new Set();

        // Extract all potential image paths
        while ((match = imageRegex.exec(content)) !== null) {
            let imgPath = match[1] || match[2] || match[3];
            let isOgImage = false;

            if (match[4]) {
                // It's an OG image in frontmatter
                imgPath = `assets/og/${match[4].trim()}`;
                isOgImage = true;
            }

            if (imgPath && !imgPath.includes('-optimized') && !imgPath.startsWith('http')) {
                let localPath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
                
                if (fs.existsSync(localPath)) {
                    imagesToProcess.add({ 
                        originalPath: localPath, 
                        isOgImage, 
                        capturedPath: match[1] || match[2] || match[3] || match[4] 
                    });
                }
            } else if (imgPath && imgPath.includes('-optimized') && !imgPath.startsWith('http')) {
                 // Case: Markdown already has -optimized path, but we need to ensure the optimized file exists.
                 let localPath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
                 
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
                             imagesToProcess.add({ 
                                 originalPath: sourcePath, 
                                 isOgImage, 
                                 capturedPath: match[1] || match[2] || match[3] || match[4] 
                             });
                             break;
                         }
                     }
                 }
            }
        }

        const processedImages = new Set();
        for (const img of imagesToProcess) {
            const ext = path.extname(img.originalPath);
            const basename = path.basename(img.originalPath, ext);
            const dirname = path.dirname(img.originalPath);
            
            const optimizedBase = `${basename}-optimized`;
            const webpPath = path.join(dirname, `${optimizedBase}.webp`);
            const avifPath = path.join(dirname, `${optimizedBase}.avif`);

            // Image Optimization (Resize & Convert)
            if (!processedImages.has(img.originalPath)) {
                processedImages.add(img.originalPath);
                
                // Check if optimized files already exist to save time
                if (fs.existsSync(webpPath) && fs.existsSync(avifPath)) {
                    // console.log(`   ⏭️  Optimized images already exist for: ${basename}`);
                } else {
                    console.log(`   🖼️  Optimizing: ${img.originalPath}`);
                    try {
                        const imageBuffer = fs.readFileSync(img.originalPath);
                        const metadata = await sharp(imageBuffer).metadata();

                        // Resize and Convert to WebP
                        let pipeline = sharp(imageBuffer);
                        if (metadata.width > MAX_WIDTH) {
                            pipeline = pipeline.resize({ width: MAX_WIDTH, kernel: sharp.kernel.lanczos3 });
                        }
                        await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(webpPath);

                        // Convert to AVIF
                        let avifPipeline = sharp(imageBuffer);
                        if (metadata.width > MAX_WIDTH) {
                            avifPipeline = avifPipeline.resize({ width: MAX_WIDTH, kernel: sharp.kernel.lanczos3 });
                        }
                        await avifPipeline.avif({ quality: AVIF_QUALITY }).toFile(avifPath);

                        console.log(`      ✅ Created WebP & AVIF`);
                    } catch (error) {
                        console.error(`      ❌ Error processing ${img.originalPath}:`, error.message);
                        continue; // Skip content update if processing failed
                    }
                }
            }

            // Update Content
            const escapedPath = escapeRegExp(img.capturedPath);
            let newContent = content;

            if (img.isOgImage) {
                const ogRegex = new RegExp(`(ogImage:\\s*["']?)(${escapedPath})(["']?)`);
                if (!img.capturedPath.includes('-optimized')) {
                    newContent = newContent.replace(ogRegex, `$1${optimizedBase}.webp$3`);
                }
            } else {
                // Handle src/srcset
                const pathRegex = new RegExp(`(src|srcset)=["']${escapedPath}["']`, 'g');
                newContent = newContent.replace(pathRegex, (match, attr, offset, string) => {
                    const tagStart = string.lastIndexOf('<', offset);
                    const tagEnd = string.indexOf('>', offset + match.length);
                    
                    if (tagStart !== -1 && tagEnd !== -1) {
                        const tagContent = string.slice(tagStart, tagEnd);
                        if (attr === 'srcset' && tagContent.includes('type="image/avif"')) {
                             return `${attr}="${path.dirname(img.capturedPath)}/${optimizedBase}.avif"`;
                        }
                    }
                    return `${attr}="${path.dirname(img.capturedPath)}/${optimizedBase}.webp"`;
                });

                // Handle Markdown Syntax
                const mdRegex = new RegExp(`(!\\[.*?\\]\\()${escapedPath}(\\))`, 'g');
                newContent = newContent.replace(mdRegex, `$1${path.dirname(img.capturedPath)}/${optimizedBase}.webp$2`);
                
                // Handle corresponding .avif reference if current is .webp
                if (path.extname(img.capturedPath) === '.webp') {
                    const avifPathStr = img.capturedPath.replace(/\.webp$/, '.avif');
                    const escapedAvifPath = escapeRegExp(avifPathStr);
                    const avifRegex = new RegExp(`(src|srcset)=["']${escapedAvifPath}["']`, 'g');
                    newContent = newContent.replace(avifRegex, (match, attr) => {
                        return `${attr}="${path.dirname(img.capturedPath)}/${optimizedBase}.avif"`;
                    });
                }
            }

            if (newContent !== content) {
                content = newContent;
                isContentModified = true;
            }
        }

        if (isContentModified) {
            fs.writeFileSync(targetFile, content, 'utf8');
            console.log(`   💾 Updated file content references.`);
        } else {
            console.log(`   ✨ No content changes needed.`);
        }
    }
    
    console.log('\n✅ Batch optimization complete!');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
