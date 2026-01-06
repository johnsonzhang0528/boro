const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const BLOG_DIR = 'blog';

async function checkLinks() {
    console.log('🔍 Starting comprehensive link check...');
    
    // Get all markdown files
    const files = await glob('**/*.md', { ignore: 'node_modules/**' });
    let errorCount = 0;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Match standard markdown links [text](url) and html links href="url"
        const regex = /\[.*?\]\((.*?)\)|href=["'](.*?)["']/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const link = match[1] || match[2];
            
            // Focus on internal blog links
            if (link && link.startsWith('/blog/')) {
                const targetSlug = link.replace('/blog/', '').replace(/\/$/, '');
                // Check if target file exists as .md
                const targetFile = path.join(BLOG_DIR, targetSlug + '.md');
                
                // Allow matches if the file exists
                if (!fs.existsSync(targetFile)) {
                     // Check if it might be an asset or other
                     // But strictly for .md files in blog/
                     console.error(`❌ Broken link in ${file}: ${link}`);
                     console.error(`   Target file not found: ${targetFile}`);
                     errorCount++;
                }
            }
        }
    }

    if (errorCount === 0) {
        console.log('✅ No broken internal blog links found!');
    } else {
        console.log(`⚠️  Found ${errorCount} broken links.`);
    }
}

checkLinks();