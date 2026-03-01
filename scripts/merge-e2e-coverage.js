const fs = require('fs');
const path = require('path');
const MCR = require('monocart-coverage-reports');

const root = path.resolve(__dirname, '..');
const rawDir = path.join(root, 'coverage-report', 'raw');
const outDir = path.join(root, 'coverage-report', 'e2e-merged');

const files = fs.existsSync(rawDir)
  ? fs.readdirSync(rawDir).filter((f) => f.endsWith('.json'))
  : [];

if (!files.length) {
  console.error('No raw coverage files found in coverage-report/raw');
  process.exit(1);
}

const mcr = MCR({
  name: 'Playwright E2E Coverage (Merged)',
  outputDir: outDir,
  reports: ['v8', 'json-summary', 'console-summary', 'lcovonly'],
  entryFilter: {
    '**/node_modules/**': false,
    '**/*': true
  },
  sourceFilter: {
    '**/node_modules/**': false,
    '**/js/**': true,
    '**/pkg/idle_game.js': true,
    '**/*': false
  }
});

(async () => {
  for (const file of files) {
    const fullPath = path.join(rawDir, file);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    await mcr.add(data);
  }
  await mcr.generate();
  console.log(`Merged ${files.length} raw files -> ${outDir}`);
})();
