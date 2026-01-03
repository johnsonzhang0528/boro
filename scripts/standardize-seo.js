const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BLOG_DIR = 'blog/**/*.md';

function cleanValue(val) {
  if (!val) return '';
  val = val.trim();
  // Remove surrounding quotes if present
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  // Escape double quotes inside
  val = val.replace(/"/g, '\\"');
  return val;
}

const files = glob.sync(BLOG_DIR, { ignore: 'blog/tags.njk' });
let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Match frontmatter block
  const fmMatch = content.match(/^(-{3,})\s*[\r\n]+([\s\S]*?)[\r\n]+(-{3,})/);
  
  if (fmMatch) {
    let originalFm = fmMatch[2];
    let newFm = originalFm;
    let modified = false;
    
    // Keys to standardize
    const keysToFix = ['title', 'description', 'lastUpdated'];

    keysToFix.forEach(key => {
        const regex = new RegExp(`^${key}:\\s*(.*)$`, 'gm');
        const matches = [...newFm.matchAll(regex)];
        
        if (matches.length > 0) {
            // Get the last value (most recent/added one)
            let lastVal = matches[matches.length - 1][1];
            
            // Clean the value (remove quotes, etc)
            // For dates, don't quote if it looks like a date, but title/desc should be quoted
            let finalVal = lastVal.trim();
            
            if (key === 'title' || key === 'description') {
                finalVal = `"${cleanValue(lastVal)}"`;
            } else {
                // For dates, keep as is (usually unquoted is fine, or quoted)
                // But let's just clean it to be safe
                finalVal = cleanValue(lastVal);
            }

            // Remove ALL occurrences of this key
            const removeRegex = new RegExp(`^${key}:.*$[\r\n]*`, 'gm');
            newFm = newFm.replace(removeRegex, '');
            
            // Insert at the top of the frontmatter
            newFm = `${key}: ${finalVal}\n` + newFm;
            modified = true;
        }
    });
    
    // Remove extra newlines created by prepending
    newFm = newFm.replace(/^\s*[\r\n]/gm, '');

    if (modified && newFm.trim() !== originalFm.trim()) {
        content = content.replace(originalFm, newFm);
        fs.writeFileSync(file, content);
        fixedCount++;
        console.log(`✨ Standardized: ${path.basename(file)}`);
    }
  }
});

console.log(`\n🎉 Standardization Complete! Processed ${fixedCount} files.`);
