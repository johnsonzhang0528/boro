const fs = require('fs');
const path = require('path');

const BLOG_DIR = 'blog';

// Map of New (Source) -> Old (Target/Destination)
// We want to move the content of New to Old, and then delete New.
const merges = [
    {
        newFile: 'crazy-time-live-game-guide-strategy.md',
        oldFile: 'crazy-time-live-game-guide.md'
    },
    {
        newFile: 'monopoly-live-game-guide.md',
        oldFile: 'monopoly-live-game-guide-strategy.md'
    },
    {
        newFile: 'lightning-roulette-strategy-guide.md',
        oldFile: 'lightning-roulette-game-guide-strategy.md'
    },
    {
        newFile: 'mega-ball-100x-strategy.md',
        oldFile: 'mega-ball-game-guide-strategy.md'
    },
    {
        newFile: 'deal-or-no-deal-live-guide.md',
        oldFile: 'deal-or-no-deal-live-guide-bangladesh.md'
    },
    {
        newFile: 'gonzos-treasure-hunt-guide.md',
        oldFile: 'gonzos-treasure-hunt-guide-strategy.md'
    }
];

function main() {
    console.log('🚀 Starting Content De-duplication & Merge...');

    merges.forEach(pair => {
        const newPath = path.join(BLOG_DIR, pair.newFile);
        const oldPath = path.join(BLOG_DIR, pair.oldFile);

        if (fs.existsSync(newPath) && fs.existsSync(oldPath)) {
            console.log(`🔄 Merging '${pair.newFile}' INTO '${pair.oldFile}'...`);

            // 1. Read New Content
            const newContent = fs.readFileSync(newPath, 'utf8');

            // 2. Overwrite Old File with New Content
            fs.writeFileSync(oldPath, newContent, 'utf8');
            console.log(`   ✅ Updated content of ${pair.oldFile}`);

            // 3. Delete New File
            fs.unlinkSync(newPath);
            console.log(`   🗑️  Deleted ${pair.newFile}`);
        } else {
            console.warn(`   ⚠️  Skipping pair: ${pair.newFile} -> ${pair.oldFile} (One or both files not found)`);
        }
    });

    console.log('\n✨ De-duplication complete! SEO cannibalization resolved.');
}

main();
