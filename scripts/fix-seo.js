const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BLOG_DIR = 'blog/**/*.md';
const TODAY = '2026-01-03';

function toTitleCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractDescription(content) {
  // Remove frontmatter
  let body = content.replace(/^-{3,}[\s\S]*?-{3,}/, '').trim();
  
  // Remove markdown headings
  body = body.replace(/^#+\s+.*$/gm, '');
  
  // Remove images and pictures
  body = body.replace(/!\[.*?\]\(.*?\)/g, '');
  body = body.replace(/<picture>[\s\S]*?<\/picture>/g, '');
  body = body.replace(/<[^>]*>/g, ''); // Remove other HTML
  
  // Remove links but keep text
  body = body.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove special chars
  body = body.replace(/[*_`]/g, '');
  
  // Collapse whitespace
  body = body.replace(/\s+/g, ' ').trim();
  
  // Find the first sentence or chunk
  if (body.length > 160) {
    // Try to cut at the last space before 157 chars
    let cut = body.substring(0, 157);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 0) {
        cut = cut.substring(0, lastSpace);
    }
    return cut + '...';
  }
  return body;
}

const files = glob.sync(BLOG_DIR, { ignore: 'blog/tags.njk' });
let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Parse frontmatter
  const fmMatch = content.match(/^(-{3,})\s*[\r\n]+([\s\S]*?)[\r\n]+(-{3,})/);
  
  if (!fmMatch) {
    // CASE: No Frontmatter
    console.log(`🔧 Adding frontmatter to: ${path.basename(file)}`);
    const title = toTitleCase(path.basename(file, '.md'));
    const desc = extractDescription(content);
    const newFm = `---
layout: post.njk
title: "${title}"
description: "${desc}"
date: ${TODAY}
lastUpdated: ${TODAY}
tags: [post]
---
`;
    content = newFm + content;
  } else {
    // CASE: Existing Frontmatter
    let fm = fmMatch[2];
    let body = content.replace(fmMatch[0], '');
    let modified = false;

    // 1. Fix Missing Title
    if (!fm.match(/^title:/m)) {
      const title = toTitleCase(path.basename(file, '.md'));
      fm += `\ntitle: "${title}"`;
      modified = true;
    }

    // 2. Fix Description
    const descMatch = fm.match(/^description:\s*"(.*?)"/m);
    if (!descMatch) {
      // Missing description
      const desc = extractDescription(body);
      fm += `\ndescription: "${desc}"`;
      modified = true;
    } else {
      // Check description length
      let desc = descMatch[1];
      
      // If too long (> 165), truncate
      if (desc.length > 165) {
        let newDesc = desc.substring(0, 157);
        const lastSpace = newDesc.lastIndexOf(' ');
        if (lastSpace > 0) newDesc = newDesc.substring(0, lastSpace);
        newDesc += '...';
        
        fm = fm.replace(/^description:.*$/m, `description: "${newDesc}"`);
        modified = true;
      } 
      // If too short (< 120), try to re-extract from body if body yields a better length
      else if (desc.length < 120) {
         const extracted = extractDescription(body);
         // Only replace if extracted is longer and within reasonable limits
         if (extracted.length > desc.length && extracted.length <= 165) {
             fm = fm.replace(/^description:.*$/m, `description: "${extracted}"`);
             modified = true;
         }
      }
    }

    // 3. Update lastUpdated if modified
    if (modified) {
        if (fm.match(/^lastUpdated:/m)) {
            fm = fm.replace(/^lastUpdated:.*$/m, `lastUpdated: ${TODAY}`);
        } else {
            fm += `\nlastUpdated: ${TODAY}`;
        }
        
        // Reconstruct content
        content = `${fmMatch[1]}\n${fm}\n${fmMatch[3]}${body}`;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    fixedCount++;
    console.log(`✅ Fixed: ${path.basename(file)}`);
  }
});

console.log(`\n🎉 Optimization Complete! Fixed ${fixedCount} files.`);
