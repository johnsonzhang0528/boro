const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const BLOG_DIR = 'blog/**/*.md';
const MIN_DESC_LEN = 120;
const MAX_DESC_LEN = 170;

async function validateSEO() {
  console.log('🔍 Starting SEO Validation Scan...');
  
  const files = glob.sync(BLOG_DIR, { ignore: 'blog/tags.njk' });
  let issues = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Robust regex for frontmatter (handles Windows CRLF and potential BOM)
    const frontmatterMatch = content.match(/^-{3,}\s*[\r\n]+([\s\S]*?)[\r\n]+-{3,}/);
    
    if (!frontmatterMatch) {
      console.warn(`⚠️  No frontmatter found in: ${file}`);
      return;
    }

    const fm = frontmatterMatch[1];
    const titleMatch = fm.match(/title:\s*"(.*?)"/);
    const descMatch = fm.match(/description:\s*"(.*?)"/);
    const lastUpdatedMatch = fm.match(/lastUpdated:\s*(\d{4}-\d{2}-\d{2})/);
    const dateMatch = fm.match(/date:\s*(\d{4}-\d{2}-\d{2})/);

    const fileName = path.basename(file);

    // Check 1: lastUpdated
    if (!lastUpdatedMatch) {
      // It's okay if it's a new post, but for old posts we want lastUpdated
      // console.warn(`ℹ️  [${fileName}] Missing 'lastUpdated'. Google prefers fresh content signals.`);
    }

    // Check 2: Description Length
    if (descMatch) {
      const desc = descMatch[1];
      if (desc.length < MIN_DESC_LEN || desc.length > MAX_DESC_LEN) {
        console.warn(`⚠️  [${fileName}] Description length is ${desc.length} chars. Recommended: 150-160.`);
        issues++;
      }
    } else {
      console.error(`❌ [${fileName}] Missing 'description'.`);
      issues++;
    }

    // Check 3: Title
    if (!titleMatch) {
      console.error(`❌ [${fileName}] Missing 'title'.`);
      issues++;
    }
  });

  console.log('\n--------------------------------------------------');
  if (issues === 0) {
    console.log('✅ SEO Validation Passed! Content looks optimized for crawling.');
  } else {
    console.log(`⚠️  Found ${issues} potential SEO issues.`);
    console.log('   Fixing these helps Google understand your content quality.');
  }
  console.log('--------------------------------------------------');
  console.log('💡 TIP: Google deprecated the "Ping" service in 2023.');
  console.log('   The best way to get crawled is to keep "lastUpdated" accurate');
  console.log('   and ensure your sitemap.xml is error-free.');
}

validateSEO();
