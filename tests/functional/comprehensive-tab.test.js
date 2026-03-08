const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test('comprehensive tab switching and functionality test', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);

  await expect(page.locator('button[data-tab="resources"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-resources')).toHaveClass(/active/);

  await page.click('button[data-tab="buildings"]');

  await expect(page.locator('button[data-tab="buildings"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-buildings')).toHaveClass(/active/);

  const buildingList = await page.locator('#building-list');
  const buildingCount = await buildingList.locator('.building-item').count();
  expect(buildingCount).toBeGreaterThan(0);

  await unlockWorkersStage(page);

  await page.click('button[data-tab="workers"]');

  await expect(page.locator('button[data-tab="workers"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-workers')).toHaveClass(/active/);
  await expect(page.locator('#workers-list')).toBeVisible();

  const workersPanel = await page.locator('#workers-list');
  expect(await workersPanel.isVisible()).toBe(true);

  await page.click('button[data-tab="settings"]');

  await expect(page.locator('button[data-tab="settings"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-settings')).toHaveClass(/active/);

  const resetButton = await page.locator('#reset-game');
  const languageSelect = await page.locator('#language-select-setting');
  expect(await resetButton.isVisible()).toBe(true);
  expect(await languageSelect.isVisible()).toBe(true);

  await page.click('button[data-tab="resources"]');

  await expect(page.locator('button[data-tab="resources"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-resources')).toHaveClass(/active/);

  await page.click('#coin-button');
  await expect.poll(() => page.evaluate(() => window.rustGame.get_coins())).toBeGreaterThanOrEqual(1);

  const coinDisplay = await page.textContent('#coins');
  const coinsVal = parseFloat((coinDisplay || '0').split(':').pop().trim());
  expect(coinsVal).toBeGreaterThanOrEqual(1);
});
