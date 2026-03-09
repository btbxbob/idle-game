const { test, expect } = require('../fixtures/coverage');

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
  
  // Verify tab buttons exist
  const tabButtons = page.locator('.tab-button');
  await expect(tabButtons).toHaveCount(11);
  
  // Verify resources container is visible
  const resources = page.locator('#resources');
  await expect(resources).toBeVisible();
  
  const clickYield = page.locator('#cpc');
  await expect(clickYield).toHaveCount(0);
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
  await expect(tabButtons).toHaveCount(11);
});
