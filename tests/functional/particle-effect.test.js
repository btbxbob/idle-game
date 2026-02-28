const { test, expect } = require('@playwright/test');

test('particle effect appears on coin button click', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Wait for game initialization
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Get coin button
  const coinButton = page.locator('#coin-button');
  await expect(coinButton).toBeVisible();
  
  // Get initial particle count
  const initialParticles = await page.locator('.coin-particle').count();
  expect(initialParticles).toBe(0);
  
  // Click the coin button
  await coinButton.click();
  
  // Wait for particles to appear (they should be created immediately)
  await page.waitForSelector('.coin-particle', { timeout: 1000 });
  
  // Verify particles are created
  const particles = await page.locator('.coin-particle').count();
  expect(particles).toBeGreaterThan(0);
  
  // Wait for particles to disappear (animation is 600ms)
  await page.waitForTimeout(700);
  
  // Verify particles are cleaned up
  const finalParticles = await page.locator('.coin-particle').count();
  expect(finalParticles).toBe(0);
});

test('particle effect works in dark theme', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  // Wait for game initialization
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Switch to settings tab to access theme selector
  await page.click('button[data-tab="settings"]');
  await page.waitForTimeout(100);
  
  // Switch to dark theme
  const themeSelect = page.locator('#theme-select-setting');
  await themeSelect.selectOption('dark');
  
  // Wait for theme to apply
  await page.waitForTimeout(100);
  
  // Verify dark theme is active
  const bodyClass = await page.locator('body').getAttribute('class');
  expect(bodyClass).toContain('dark-theme');
  
  // Click the coin button (visible in header regardless of tab)
  const coinButton = page.locator('#coin-button');
  await coinButton.click();
  
  // Wait for particles to appear
  await page.waitForSelector('.coin-particle', { timeout: 1000 });
  
  // Verify particles have correct color for dark theme (white to gray gradient)
  const particle = page.locator('.coin-particle').first();
  const bgColor = await particle.evaluate(el => 
    getComputedStyle(el).background
  );
  expect(bgColor).toContain('255, 255, 255'); // White for dark theme
});
