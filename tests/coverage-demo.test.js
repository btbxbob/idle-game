// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('collect and save coverage report', async ({ page }) => {
  // Start coverage collection
  await page.coverage.startJSCoverage();
  
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Click a few times
  for (let i = 0; i < 5; i++) {
    await page.click('#coin-button');
    await page.waitForTimeout(100);
  }
  
  // Stop coverage and get results
  const coverage = await page.coverage.stopJSCoverage();
  
  // Calculate coverage per file
  const report = [];
  let totalStatements = 0;
  let coveredStatements = 0;
  
  for (const cov of coverage) {
    try {
      const url = new URL(cov.url);
      const filename = url.pathname.split('/').pop() || url.href;
      
      // Count total lines
      const lines = cov.source ? cov.source.split('\n').length : 0;
      
      // Count covered lines using ranges (use startOffset/endOffset)
      let executedLines = 0;
      for (const func of cov.functions || []) {
        for (const range of func.ranges || []) {
          if (range && range.count > 0) {
            const start = Number(range.startOffset) || 0;
            const end = Number(range.endOffset) || 0;
            executedLines += (end - start);
          }
        }
      }
      
      const pct = (lines > 0 && executedLines > 0) ? ((executedLines / lines) * 100).toFixed(1) : '0.0';
      
      if (filename.includes('.js') && !filename.includes('idle_game_bg')) {
        report.push({ file: filename, lines, executedLines, pct: parseFloat(pct) });
        totalStatements += lines;
        coveredStatements += executedLines;
      }
    } catch (e) {
      // Skip invalid URLs
    }
  }
  
  // Sort by coverage percentage
  report.sort((a, b) => b.pct - a.pct);
  
  const overallPct = (totalStatements > 0 && coveredStatements > 0) 
    ? ((coveredStatements / totalStatements) * 100).toFixed(1) 
    : '0.0';
  
  console.log('\n=== Coverage Report ===');
  console.log(`Overall JS Coverage: ${overallPct}%`);
  console.log('\nPer-file coverage:');
  for (const r of report) {
    console.log(`  ${r.file}: ${r.pct}% (${r.executedLines}/${r.lines})`);
  }
  
  // Save JSON report
  const outputDir = path.join(__dirname, '..', 'coverage-report');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'coverage.json'),
    JSON.stringify({ overall: overallPct, files: report }, null, 2)
  );
  console.log(`\nCoverage report saved to: ${outputDir}/coverage.json`);
});