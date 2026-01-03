const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BLOG_DIR = 'blog';

const filesToRestore = [
    'crazy-time-live-game-guide.md',
    'monopoly-live-game-guide-strategy.md',
    'lightning-roulette-game-guide-strategy.md',
    'mega-ball-game-guide-strategy.md',
    'deal-or-no-deal-live-guide-bangladesh.md',
    'gonzos-treasure-hunt-guide-strategy.md'
];

function main() {
    console.log('🕰️  Restoring original publish dates...');

    filesToRestore.forEach(filename => {
        const filePath = path.join(BLOG_DIR, filename);
        
        try {
            // 1. Get old content from git (HEAD~1 is the commit before the merge)
            // We need to use forward slashes for git path even on Windows usually, but let's try standard
            const gitPath = `${BLOG_DIR}/${filename}`;
            const oldContent = execSync(`git show HEAD~1:${gitPath}`, { encoding: 'utf8' });
            
            // 2. Extract old date
            const dateMatch = oldContent.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
            
            if (dateMatch) {
                const oldDate = dateMatch[1];
                console.log(`   📄 ${filename}: Found original date ${oldDate}`);

                // 3. Read current content
                let currentContent = fs.readFileSync(filePath, 'utf8');

                // 4. Replace date
                // We replace the current date with the old date
                // We also ensure lastUpdated is set to the NEW date (which is likely already there from the previous step)
                // or we can leave lastUpdated as is (which is the new date set by magic.js)
                
                if (currentContent.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m)) {
                    currentContent = currentContent.replace(/^date:\s*(\d{4}-\d{2}-\d{2})/m, `date: ${oldDate}`);
                    fs.writeFileSync(filePath, currentContent, 'utf8');
                    console.log(`      ✅ Restored date to ${oldDate}`);
                } else {
                    console.warn(`      ⚠️  Could not find date field in current file.`);
                }

            } else {
                console.warn(`   ⚠️  Could not find date in old version of ${filename}`);
            }

        } catch (error) {
            console.error(`   ❌ Error processing ${filename}:`, error.message);
        }
    });

    console.log('\n✨ Date restoration complete!');
}

main();
