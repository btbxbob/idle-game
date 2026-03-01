// @ts-check
const fs = require('fs');
const path = require('path');
const base = require('@playwright/test');

const RAW_DIR = path.join(__dirname, '..', '..', 'coverage-report', 'raw');

const safeName = (value) => value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);

const test = base.test.extend({
  page: async ({ page }, use, testInfo) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    try {
      await use(page);
    } finally {
      let jsCoverage = [];
      try {
        jsCoverage = await page.coverage.stopJSCoverage();
      } catch (_err) {
        jsCoverage = [];
      }

      fs.mkdirSync(RAW_DIR, { recursive: true });
      const fileName = safeName(`${testInfo.workerIndex}-${testInfo.repeatEachIndex}-${testInfo.titlePath.join('__')}.json`);
      fs.writeFileSync(path.join(RAW_DIR, fileName), JSON.stringify(jsCoverage));
    }
  }
});

module.exports = {
  test,
  expect: base.expect
};
