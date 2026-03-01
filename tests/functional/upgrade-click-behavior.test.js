const { test, expect } = require('../fixtures/coverage');

test('better click upgrade increases click value', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);

  const cpcBefore = await page.textContent('#cpc');
  const before = parseFloat(((cpcBefore || '').match(/[\d.]+$/) || ['0'])[0]);

  for (let i = 0; i < 12; i++) {
    await page.click('#coin-button');
  }

  await page.click('button[data-tab="upgrades"]');
  await page.waitForTimeout(150);
  await page.click('#buy-upgrade-0');
  await page.waitForTimeout(250);

  const cpcAfter = await page.textContent('#cpc');
  const after = parseFloat(((cpcAfter || '').match(/[\d.]+$/) || ['0'])[0]);
  expect(after).toBeGreaterThan(before);
});
