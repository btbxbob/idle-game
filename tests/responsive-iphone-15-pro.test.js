const { test, expect } = require('@playwright/test');

test('iPhone 15 Pro layout (393px) - no overlap', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Verify resource bar is visible
  const banner = page.locator('#banner');
  await expect(banner).toBeVisible();
  
  // Verify tab navigation is below banner (not overlapping)
  const tabNav = page.locator('#tab-navigation');
  const bannerBox = await banner.boundingBox();
  const tabBox = await tabNav.boundingBox();
  
  // Tab should start where banner ends (with small tolerance)
  expect(tabBox.y).toBeGreaterThanOrEqual(bannerBox.y + bannerBox.height - 2);
  
  // Verify all 8 tab buttons exist
  const tabButtons = page.locator('.tab-button');
  await expect(tabButtons).toHaveCount(8);
  
  // Verify resources container is visible
  const resources = page.locator('#resources');
  await expect(resources).toBeVisible();
  
  // Verify at least first 3 resources visible
  const coins = page.locator('#coins');
  const wood = page.locator('#wood');
  const stone = page.locator('#stone');
  await expect(coins).toBeVisible();
  await expect(wood).toBeVisible();
  await expect(stone).toBeVisible();
});

test('Medium phone layout (410px) - no overlap', async ({ page }) => {
  await page.setViewportSize({ width: 410, height: 893 });
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  
  const banner = page.locator('#banner');
  await expect(banner).toBeVisible();
  
  const tabNav = page.locator('#tab-navigation');
  const bannerBox = await banner.boundingBox();
  const tabBox = await tabNav.boundingBox();
  
  expect(tabBox.y).toBeGreaterThanOrEqual(bannerBox.y + bannerBox.height - 2);
  
  const tabButtons = page.locator('.tab-button');
  await expect(tabButtons).toHaveCount(8);
});
