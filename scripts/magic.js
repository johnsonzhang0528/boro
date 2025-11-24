const { execSync } = require('child_process');

const target = process.argv[2] || '';

try {
    console.log(`🔮 Casting Magic Spell... ${target ? `on ${target}` : '(auto-detect)'}`);
    
    // Run generate-images
    console.log('\n--- Step 1: Generate Images ---');
    execSync(`node scripts/generate-images.js "${target}"`, { stdio: 'inherit' });
    
    // Run automate-publish
    console.log('\n--- Step 2: Publish & Optimize ---');
    execSync(`node scripts/automate-publish.js "${target}"`, { stdio: 'inherit' });
    
    console.log('\n✨ Magic complete!');
} catch (error) {
    console.error('\n❌ Magic failed.');
    process.exit(1);
}
