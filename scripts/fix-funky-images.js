const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const files = [
    { name: 'funky-time-live-game-show-guide.webp', dest: 'assets/og' },
    { name: 'funky-time-live-studio-action.webp', dest: 'assets/blog' },
    { name: 'funky-time-bonus-rounds-explained.webp', dest: 'assets/blog' }
];

async function main() {
    for (const file of files) {
        const srcPath = file.name; // Root
        const destDir = file.dest;
        const destPath = path.join(destDir, file.name);
        const avifPath = path.join(destDir, file.name.replace('.webp', '.avif'));

        if (fs.existsSync(srcPath)) {
            console.log(`Moving ${srcPath} to ${destPath}...`);
            
            // Move file
            fs.renameSync(srcPath, destPath);
            
            // Generate AVIF
            console.log(`Generating AVIF for ${destPath}...`);
            try {
                await sharp(destPath)
                    .avif({ quality: 50 })
                    .toFile(avifPath);
                console.log(`✅ Created ${avifPath}`);
            } catch (err) {
                console.error(`❌ Error creating AVIF: ${err.message}`);
            }
        } else {
            console.log(`⚠️ Source file ${srcPath} not found (maybe already moved?)`);
            // If already moved, try to generate AVIF if missing
            if (fs.existsSync(destPath) && !fs.existsSync(avifPath)) {
                 console.log(`Generating missing AVIF for ${destPath}...`);
                 await sharp(destPath)
                    .avif({ quality: 50 })
                    .toFile(avifPath);
                 console.log(`✅ Created ${avifPath}`);
            }
        }
    }
}

main();
