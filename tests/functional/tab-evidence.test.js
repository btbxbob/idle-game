const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test('tab structure evidence capture', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await expect(page.locator('#tab-resources')).toHaveClass(/active/);
  
  // Screenshot 1: Tab structure overview showing all 9 tabs
  await page.screenshot({ 
    path: '.sisyphus/evidence/task-7-tab-structure.png',
    fullPage: true 
  });
  
  await unlockWorkersStage(page);

  const tabs = [
    { button: 'button[data-tab="statistics"]', name: 'statistics' },
    { button: 'button[data-tab="achievements"]', name: 'achievements' },
    { button: 'button[data-tab="crafting"]', name: 'crafting' },
    { button: 'button[data-tab="unlocks"]', name: 'unlocks' }
  ];
  
  for (const tab of tabs) {
    await page.click(tab.button);
    await expect(page.locator(tab.button)).toHaveClass(/active/);
  }
  
  // Screenshot 2: Tab switching - final state on unlocks tab
  await page.screenshot({ 
    path: '.sisyphus/evidence/task-7-tab-switching.png',
    fullPage: true 
  });
  
  console.log('Evidence screenshots saved to .sisyphus/evidence/');
});
