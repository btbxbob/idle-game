const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test('tab structure evidence capture', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: '.sisyphus/evidence/task-7-tab-structure.png',
    fullPage: true 
  });
  
  await unlockWorkersStage(page);

  const tabs = [
    { button: 'button[data-tab="statistics"]', name: 'statistics' },
    { button: 'button[data-tab="achievements"]', name: 'achievements' },
    { button: 'button[data-tab="unlocks"]', name: 'unlocks' }
  ];
  
  for (const tab of tabs) {
    await page.click(tab.button);
    await page.waitForTimeout(300);
  }
  
  await page.screenshot({ 
    path: '.sisyphus/evidence/task-7-tab-switching.png',
    fullPage: true 
  });
  
  console.log('Evidence screenshots saved to .sisyphus/evidence/');
});
