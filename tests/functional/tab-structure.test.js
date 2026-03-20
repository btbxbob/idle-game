const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test.describe('Tab structure and navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
  });

  test('genesis tabs and unlocked navigation remain consistent', async ({ page }) => {
    const initialVisibleTabs = await page.locator('.tab-button:visible').allTextContents();
    expect(initialVisibleTabs).toEqual(expect.arrayContaining(['资源', '建筑', '解锁', '设置']));
    expect(initialVisibleTabs).not.toContain('工人');
    expect(initialVisibleTabs).not.toContain('统计');

    await expect(page.locator('button[data-tab="resources"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-resources')).toHaveClass(/active/);

    await page.click('button[data-tab="buildings"]');
    await expect(page.locator('button[data-tab="buildings"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-buildings')).toHaveClass(/active/);
    await expect(page.locator('#building-list')).toBeVisible();

    await page.click('button[data-tab="settings"]');
    await expect(page.locator('button[data-tab="settings"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-settings')).toHaveClass(/active/);
    await expect(page.locator('#reset-game')).toBeVisible();
    await expect(page.locator('#language-select-setting')).toBeVisible();

    await page.screenshot({
      path: '.sisyphus/evidence/tab-structure-genesis.png',
      fullPage: true,
    });

    await unlockWorkersStage(page);

    const statisticsButton = page.locator('button[data-tab="statistics"]');
    const achievementsButton = page.locator('button[data-tab="achievements"]');
    const unlocksButton = page.locator('button[data-tab="unlocks"]');
    const workersButton = page.locator('button[data-tab="workers"]');
    const craftingButton = page.locator('button[data-tab="crafting"]');

    await expect(workersButton).toBeVisible();
    await expect(statisticsButton).toBeVisible();
    await expect(achievementsButton).toBeVisible();
    await expect(unlocksButton).toBeVisible();
    await expect(craftingButton).toHaveCount(0);

    expect(await statisticsButton.textContent()).toBe('统计');
    expect(await achievementsButton.textContent()).toBe('成就');
    expect(await unlocksButton.textContent()).toBe('解锁');

    await expect(page.locator('#tab-statistics')).toHaveCount(1);
    await expect(page.locator('#tab-achievements')).toHaveCount(1);
    await expect(page.locator('#tab-unlocks')).toHaveCount(1);
    await expect(page.locator('#tab-crafting')).toHaveCount(0);

    expect(await page.locator('.tab-content').count()).toBe(12);

    await workersButton.click();
    await expect(page.locator('.tab-button.active')).toHaveText('工人');
    await expect(page.locator('#tab-workers')).toHaveClass(/active/);
    await expect(page.locator('#workers-list')).toBeVisible();

    await statisticsButton.click();
    await expect(page.locator('.tab-button.active')).toHaveText('统计');
    await expect(page.locator('#tab-statistics')).toHaveClass(/active/);

    await achievementsButton.click();
    await expect(page.locator('.tab-button.active')).toHaveText('成就');
    await expect(page.locator('#tab-achievements')).toHaveClass(/active/);

    await unlocksButton.click();
    await expect(page.locator('.tab-button.active')).toHaveText('解锁');
    await expect(page.locator('#tab-unlocks')).toHaveClass(/active/);

    await page.screenshot({
      path: '.sisyphus/evidence/tab-structure-unlocked.png',
      fullPage: true,
    });
  });
});
