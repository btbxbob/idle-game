const fs = require('fs');
const path = require('path');
const MCR = require('monocart-coverage-reports');

const root = path.resolve(__dirname, '..');
const rawDir = path.join(root, 'coverage-report', 'raw');
const outDir = path.join(root, 'coverage-report', 'e2e-merged');
const summaryFile = path.join(outDir, 'coverage-summary.json');

const isGeneratedEntry = (entryPath) => {
  return typeof entryPath === 'string' && /\/pkg\/idle_game(?:\.v[^/]+)?\.js/i.test(entryPath);
};

const recomputeTotals = (summaryData) => {
  const metrics = ['lines', 'statements', 'functions', 'branches'];
  const entries = Object.entries(summaryData).filter(([entryPath]) => entryPath !== 'total' && !isGeneratedEntry(entryPath));

  const total = Object.fromEntries(metrics.map((metric) => [metric, {
    total: 0,
    covered: 0,
    skipped: 0,
    pct: 0
  }]));

  for (const [, entry] of entries) {
    metrics.forEach((metric) => {
      const bucket = entry?.[metric];
      if (!bucket) {
        return;
      }
      total[metric].total += Number(bucket.total || 0);
      total[metric].covered += Number(bucket.covered || 0);
      total[metric].skipped += Number(bucket.skipped || 0);
    });
  }

  metrics.forEach((metric) => {
    const metricTotal = total[metric].total;
    total[metric].pct = metricTotal > 0
      ? Number(((total[metric].covered / metricTotal) * 100).toFixed(2))
      : 100;
  });

  const filtered = Object.fromEntries(entries);
  filtered.total = total;
  return filtered;
};

const parseThreshold = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid threshold value for ${name}: ${raw}`);
  }
  return parsed;
};

const thresholds = {
  lines: parseThreshold('E2E_COVERAGE_MIN_LINES', 20),
  statements: parseThreshold('E2E_COVERAGE_MIN_STATEMENTS', 20),
  functions: parseThreshold('E2E_COVERAGE_MIN_FUNCTIONS', 15),
  branches: parseThreshold('E2E_COVERAGE_MIN_BRANCHES', 10)
};

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
  reports: ['json-summary', 'console-summary', 'lcovonly'],
  entryFilter: {
    '**/node_modules/**': false,
    '**/*': true
  },
  sourceFilter: {
    '**/node_modules/**': false,
    '**/js/**': true,
    '**/*': false
  }
});

(async () => {
  let addedFiles = 0;
  let skippedEmptyFiles = 0;

  for (const file of files) {
    const fullPath = path.join(rawDir, file);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    if (Array.isArray(data) && data.length === 0) {
      skippedEmptyFiles += 1;
      continue;
    }

    await mcr.add(data);
    addedFiles += 1;
  }
  await mcr.generate();
  if (!fs.existsSync(summaryFile)) {
    console.error(`Coverage summary missing: ${summaryFile}`);
    process.exit(1);
  }

  const rawSummaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  const summaryData = recomputeTotals(rawSummaryData);
  fs.writeFileSync(summaryFile, `${JSON.stringify(summaryData, null, 2)}\n`, 'utf8');
  const total = summaryData.total;
  if (!total) {
    console.error(`Coverage summary file has no total section: ${summaryFile}`);
    process.exit(1);
  }

  const failures = [];
  for (const [metric, threshold] of Object.entries(thresholds)) {
    const value = total[metric]?.pct;
    if (typeof value !== 'number') {
      failures.push(`${metric}: missing metric in ${summaryFile}`);
      continue;
    }
    if (value < threshold) {
      failures.push(`${metric}: ${value.toFixed(2)}% < ${threshold.toFixed(2)}%`);
    }
  }

  if (failures.length > 0) {
    console.error('Coverage thresholds failed:');
    failures.forEach((failure) => {
      console.error(`- ${failure}`);
    });
    process.exit(1);
  }

  console.log('Coverage thresholds passed:', thresholds);
  if (skippedEmptyFiles > 0) {
    console.log(`Skipped ${skippedEmptyFiles} empty raw coverage files`);
  }
  console.log(`Merged ${addedFiles} raw files -> ${outDir}`);
})();
