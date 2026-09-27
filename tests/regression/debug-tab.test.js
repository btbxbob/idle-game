const { test, expect } = require('../fixtures/coverage');

/**
 * Bug: Tab switching could leave more than one `.tab-content` panel active
 * (e.g. resources and buildings visible at the same time), or fail to move the
 * `.active` class off the previous tab button.
 *
 * Expected: after any switch, exactly one tab button and exactly one tab
 * content panel carry `.active`, and they correspond to the clicked tab.
 */
test('only one tab stays active after switching', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });

  await expect(page.locator('.tab-button.active')).toHaveCount(1);
  await expect(page.locator('.tab-content.active')).toHaveCount(1);

  await page.click('button[data-tab="settings"]');

  await expect(page.locator('button[data-tab="settings"]')).toHaveClass(/active/);
  await expect(page.locator('button[data-tab="resources"]')).not.toHaveClass(/active/);
  await expect(page.locator('#tab-settings')).toHaveClass(/active/);
  await expect(page.locator('#tab-resources')).not.toHaveClass(/active/);

  await expect(page.locator('.tab-button.active')).toHaveCount(1);
  await expect(page.locator('.tab-content.active')).toHaveCount(1);
});
