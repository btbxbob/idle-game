const { test, expect } = require('@playwright/test');

test('visual style should be white background with black text and ASCII art', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Check body background is white
  const bodyBackgroundColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  console.log('Body background:', bodyBackgroundColor);
  expect(bodyBackgroundColor).toBe('rgb(255, 255, 255)');
  
  // Check body text color is black
  const bodyTextColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).color;
  });
  console.log('Body text color:', bodyTextColor);
  expect(bodyTextColor).toBe('rgb(0, 0, 0)');
  
  // Check game container has black border
  const containerBorderColor = await page.evaluate(() => {
    const container = document.getElementById('game-container');
    return container ? window.getComputedStyle(container).borderTopColor : null;
  });
  console.log('Container border color:', containerBorderColor);
  expect(containerBorderColor).toBe('rgb(0, 0, 0)');
  
  // Check font family includes monospace (ASCII art style)
  const fontFamily = await page.evaluate(() => {
    return window.getComputedStyle(document.body).fontFamily;
  });
  console.log('Font family:', fontFamily);
  expect(fontFamily).toContain('monospace');
  
  // Check resource colors are applied
  const coinsElement = await page.locator('#coins');
  const coinsColor = await coinsElement.evaluate(el => 
    window.getComputedStyle(el).color
  );
  console.log('Coins color:', coinsColor);
  // Should be gold color (not black)
  expect(coinsColor).not.toBe('rgb(0, 0, 0)');
  
  // Check click area has black background
  const clickArea = await page.locator('#click-area');
  const clickAreaBg = await clickArea.evaluate(el => 
    window.getComputedStyle(el).backgroundColor
  );
  console.log('Click area background:', clickAreaBg);
  expect(clickAreaBg).toBe('rgb(0, 0, 0)');
  
  // Check coin display has gold color
  const coinDisplay = await page.locator('#coin-display');
  const coinDisplayColor = await coinDisplay.evaluate(el => 
    window.getComputedStyle(el).color
  );
  console.log('Coin display color:', coinDisplayColor);
  // Should be gold color
  expect(coinDisplayColor).not.toBe('rgb(0, 0, 0)');
});