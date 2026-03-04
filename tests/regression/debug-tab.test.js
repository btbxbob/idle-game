const { test, expect } = require('../fixtures/coverage');

test('debug tab switching issue', async ({ page }) => {
  // Navigate to the game
  await page.goto('http://localhost:8080');
  
  // Wait for the game to be initialized
  await page.waitForFunction(() => window.gameInitialized === true);
  
  // Check initial state
  console.log('Initial active tab button:', await page.locator('.tab-button.active').textContent());
  console.log('Resources tab display:', await page.locator('#tab-resources').evaluate(el => window.getComputedStyle(el).display));
  console.log('Buildings tab display:', await page.locator('#tab-buildings').evaluate(el => window.getComputedStyle(el).display));
  
  await page.click('button[data-tab="buildings"]');
  
  // Check after click
  console.log('After click - active tab button:', await page.locator('.tab-button.active').textContent());
  console.log('Resources tab display:', await page.locator('#tab-resources').evaluate(el => window.getComputedStyle(el).display));
  console.log('Buildings tab display:', await page.locator('#tab-buildings').evaluate(el => window.getComputedStyle(el).display));
  
  // Check if both tabs have active class
  const resourcesActive = await page.locator('#tab-resources').getAttribute('class');
  const buildingsActive = await page.locator('#tab-buildings').getAttribute('class');
  console.log('Resources tab classes:', resourcesActive);
  console.log('Buildings tab classes:', buildingsActive);
});
