const { test, expect } = require('../fixtures/coverage');

test('comprehensive tab switching and functionality test', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(500);

  await expect(page.locator('button[data-tab="resources"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-resources')).toHaveClass(/active/);

  await page.click('button[data-tab="buildings"]');
  await page.waitForTimeout(100);

  await expect(page.locator('button[data-tab="buildings"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-buildings')).toHaveClass(/active/);

  const buildingList = await page.locator('#building-list');
  const buildingCount = await buildingList.locator('.building-item').count();
  expect(buildingCount).toBeGreaterThan(0);

  await page.click('button[data-tab="workers"]');
  await page.waitForTimeout(100);

  await expect(page.locator('button[data-tab="workers"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-workers')).toHaveClass(/active/);

  const workersPanel = await page.locator('#workers-list');
  expect(await workersPanel.isVisible()).toBe(true);

  await page.click('button[data-tab="settings"]');
  await page.waitForTimeout(100);

  await expect(page.locator('button[data-tab="settings"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-settings')).toHaveClass(/active/);

  const resetButton = await page.locator('#reset-game');
  const languageSelect = await page.locator('#language-select-setting');
  expect(await resetButton.isVisible()).toBe(true);
  expect(await languageSelect.isVisible()).toBe(true);

  await page.click('button[data-tab="resources"]');
  await page.waitForTimeout(100);

  await expect(page.locator('button[data-tab="resources"]')).toHaveClass(/active/);
  await expect(page.locator('#tab-resources')).toHaveClass(/active/);

  await page.click('#coin-button');
  await page.waitForTimeout(300);

  const coinDisplay = await page.textContent('#coins');
  const coinsVal = parseFloat((coinDisplay || '0').split(':').pop().trim());
  expect(coinsVal).toBeGreaterThanOrEqual(1);
});
