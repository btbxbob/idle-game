const { test, expect } = require('@playwright/test');

test('responsive layout mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(1000);
  
  const resourcesBar = page.locator('#banner #resources');
  await expect(resourcesBar).toBeVisible();
  
  const resourcesOverflow = await page.evaluate(() => {
    const el = document.querySelector('#banner #resources');
    const banner = document.querySelector('#banner');
    return el.offsetWidth > banner.offsetWidth;
  });
  
  console.log('Mobile viewport (375px): Resource bar horizontal scroll needed:', resourcesOverflow);
  
  await page.screenshot({ 
    path: '.sisyphus/evidence/task-8-responsive-mobile.png',
    fullPage: true 
  });
  
  console.log('Screenshot saved to .sisyphus/evidence/task-8-responsive-mobile.png');
  
  const tabButtons = await page.locator('.tab-button');
  const tabCount = await tabButtons.count();
  console.log('Tab buttons visible on mobile:', tabCount);
});

test('responsive layout desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(1000);
  
  const tabNavigation = page.locator('#tab-navigation');
  await expect(tabNavigation).toBeVisible();
  
  const tabButtons = await page.locator('.tab-button');
  const tabCount = await tabButtons.count();
  console.log('Desktop viewport (1920px): Tab buttons count:', tabCount);
  
  const tabsFit = await page.evaluate(() => {
    const nav = document.querySelector('#tab-navigation');
    const tabs = document.querySelectorAll('.tab-button');
    let totalWidth = 0;
    tabs.forEach(tab => {
      totalWidth += tab.offsetWidth;
    });
    return totalWidth <= nav.offsetWidth;
  });
  
  console.log('All tabs fit in one row:', tabsFit);
  
  await page.screenshot({ 
    path: '.sisyphus/evidence/task-8-responsive-desktop.png',
    fullPage: true 
  });
  
  console.log('Screenshot saved to .sisyphus/evidence/task-8-responsive-desktop.png');
  
  const containerWidth = await page.evaluate(() => {
    const container = document.querySelector('#game-container');
    return container.offsetWidth;
  });
  
  console.log('Game container width on desktop:', containerWidth, 'px');
  expect(containerWidth).toBeLessThanOrEqual(1400);
});
