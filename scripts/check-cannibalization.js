const fs = require('fs');
const glob = require('glob');
const path = require('path');

const BLOG_DIR = 'blog/**/*.md';
// Threshold: If two titles share more than 60% of their meaningful words, flag them.
const SIMILARITY_THRESHOLD = 0.6; 

function getTokens(str) {
    if (!str) return new Set();
    return new Set(
        str.toLowerCase()
           .replace(/[^\w\s\u0980-\u09FF]/g, '') // Keep English alphanumerics and Bengali characters
           .split(/\s+/)
           .filter(t => t.length > 2) // Filter out small words (is, at, to, etc.)
    );
}

function calculateJaccardIndex(setA, setB) {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

console.log('🔍 Starting Keyword Cannibalization Check...');

const files = glob.sync(BLOG_DIR, { ignore: 'blog/tags.njk' });
const articles = [];

// 1. Parsing
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fmMatch = content.match(/title:\s*"(.*?)"/);
    
    if (fmMatch) {
        const title = fmMatch[1];
        articles.push({
            file: path.basename(file),
            title: title,
            tokens: getTokens(title)
        });
    }
});

console.log(`📊 Analyzed ${articles.length} article titles.`);
let issuesFound = 0;

// 2. Pairwise Comparison
for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
        const art1 = articles[i];
        const art2 = articles[j];

        const score = calculateJaccardIndex(art1.tokens, art2.tokens);

        if (score >= SIMILARITY_THRESHOLD) {
            console.log('--------------------------------------------------');
            console.log(`⚠️  Potential Cannibalization Detected (Similarity: ${(score * 100).toFixed(0)}%)`);
            console.log(`   1. "${art1.title}"`);
            console.log(`      (${art1.file})`);
            console.log(`   2. "${art2.title}"`);
            console.log(`      (${art2.file})`);
            
            // Suggestion based on common tokens
            const common = [...art1.tokens].filter(x => art2.tokens.has(x));
            console.log(`   🔑 Common keywords: [${common.join(', ')}]`);
            
            issuesFound++;
        }
    }
}

console.log('\n==================================================');
if (issuesFound === 0) {
    console.log('✅ No significant keyword cannibalization detected.');
} else {
    console.log(`🚨 Found ${issuesFound} pairs of potential content risks.`);
    console.log('👉 Action: Review these pairs. If they target the exact same user intent, consider merging them using 301 redirects.');
}
