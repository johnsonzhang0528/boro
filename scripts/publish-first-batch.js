const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SELECTION_FILE = path.join(ROOT_DIR, 'first-batch-selection.json');

execFileSync('node', ['scripts/publish-batch.js', path.relative(ROOT_DIR, SELECTION_FILE), ...process.argv.slice(2)], {
    cwd: ROOT_DIR,
    stdio: 'inherit'
});