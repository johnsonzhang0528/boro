const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const markdownItDir = path.join(ROOT_DIR, 'node_modules', 'markdown-it');
const indexFile = path.join(markdownItDir, 'index.js');
const distFile = path.join(markdownItDir, 'dist', 'markdown-it.js');

if (!fs.existsSync(markdownItDir)) {
  process.exit(0);
}

if (fs.existsSync(indexFile)) {
  process.exit(0);
}

if (!fs.existsSync(distFile)) {
  console.warn('markdown-it dist build not found; cannot create CommonJS entry fallback.');
  process.exit(0);
}

fs.writeFileSync(
  indexFile,
  "'use strict';\n\nmodule.exports = require('./dist/markdown-it.js');\n",
  'utf8'
);

console.log('Patched markdown-it CommonJS entry fallback.');
