// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Convert character offset to line number (1-indexed)
 */
function offsetToLine(source, offset) {
  return source.substring(0, offset).split('\n').length;
}

/**
 * Calculate line-level coverage from V8 coverage data
 */
function calculateLineCoverage(cov) {
  const source = cov.source || '';
  const totalLines = source.split('\n').length;
  
  // Track covered lines
  const coveredLines = new Set();
  
  for (const func of cov.functions || []) {
    for (const range of func.ranges || []) {
      if (range && range.count > 0) {
        const startOffset = Number(range.startOffset) || 0;
        const endOffset = Number(range.endOffset) || 0;
        
        // Mark all lines in this range as covered
        const startLine = offsetToLine(source, startOffset);
        const endLine = offsetToLine(source, Math.min(endOffset, source.length - 1));
        
        for (let line = startLine; line <= endLine; line++) {
          if (line > 0 && line <= totalLines) {
            coveredLines.add(line);
          }
        }
      }
    }
  }
  
  return {
    totalLines,
    coveredLines: coveredLines.size,
    percentage: totalLines > 0 ? ((coveredLines.size / totalLines) * 100).toFixed(1) : '0.0'
  };
}

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
  
  // Calculate line-level coverage per file
  const report = [];
  let grandTotalLines = 0;
  let grandCoveredLines = 0;
  
  for (const cov of coverage) {
    try {
      const url = new URL(cov.url);
      const filename = url.pathname.split('/').pop() || url.href;
      
      // Skip non-JS files and WASM generated code
      if (!filename.includes('.js') || filename.includes('idle_game_bg')) {
        continue;
      }
      
      const result = calculateLineCoverage(cov);
      
      report.push({
        file: filename,
        lines: result.totalLines,
        covered: result.coveredLines,
        pct: parseFloat(result.percentage)
      });
      
      grandTotalLines += result.totalLines;
      grandCoveredLines += result.coveredLines;
    } catch (e) {
      // Skip invalid URLs
    }
  }
  
  // Sort by coverage percentage
  report.sort((a, b) => b.pct - a.pct);
  
  const overallPct = grandTotalLines > 0 
    ? ((grandCoveredLines / grandTotalLines) * 100).toFixed(1) 
    : '0.0';
  
  console.log('\n=== Line-Level Coverage Report ===');
  console.log(`Overall JS Coverage: ${overallPct}% (${grandCoveredLines}/${grandTotalLines} lines)`);
  console.log('\nPer-file coverage:');
  for (const r of report) {
    console.log(`  ${r.file}: ${r.pct}% (${r.covered}/${r.lines})`);
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