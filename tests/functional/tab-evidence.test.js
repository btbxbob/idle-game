const { test, expect } = require('@playwright/test');

test('tab structure evidence capture', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(1000);
  
  // Screenshot 1: Tab structure overview showing all 9 tabs
  await page.screenshot({ 
    path: '.sisyphus/evidence/task-7-tab-structure.png',
    fullPage: true 
  });
  
  // Click through each new tab and capture
  const tabs = [
    { button: 'button[data-tab="statistics"]', name: 'statistics' },
    { button: 'button[data-tab="achievements"]', name: 'achievements' },
    { button: 'button[data-tab="crafting"]', name: 'crafting' },
    { button: 'button[data-tab="unlocks"]', name: 'unlocks' }
  ];
  
  for (const tab of tabs) {
    await page.click(tab.button);
    await page.waitForTimeout(300);
  }
  
  // Screenshot 2: Tab switching - final state on unlocks tab
  await page.screenshot({ 
    path: '.sisyphus/evidence/task-7-tab-switching.png',
    fullPage: true 
  });
  
  console.log('Evidence screenshots saved to .sisyphus/evidence/');
});
