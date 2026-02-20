const { test, expect } = require('@playwright/test');

test('workers panel UI renders correctly', async ({ page }) => {
  await page.goto('http://localhost:8080');
  
  await page.waitForFunction(() => window.gameInitialized === true);
  
  await page.waitForTimeout(500);
  
  await page.click('[data-tab="workers"]');
  
  await page.waitForFunction(() => {
    const tab = document.getElementById('tab-workers');
    return tab && tab.classList.contains('active');
  });
  
  await page.screenshot({ 
    path: '.sisyphus/evidence/task-22-workers-panel-initial.png',
    fullPage: false
  });
  
  const workersList = await page.$('#workers-list');
  expect(workersList).toBeTruthy();
  
  const workersGrid = await page.$('.workers-grid');
  const placeholder = await page.$('#workers-placeholder');
  
  expect(workersGrid || placeholder).toBeTruthy();
  
  const workersListHTML = await page.$eval('#workers-list', el => el.innerHTML);
  console.log('Workers list HTML:', workersListHTML);
  
  if (workersGrid) {
    const gridDisplay = await page.$eval('.workers-grid', el => 
      getComputedStyle(el).display
    );
    expect(gridDisplay).toBe('grid');
    
    const workerCards = await page.$$('.worker-card');
    if (workerCards.length > 0) {
      const firstCardHeader = await page.$('.worker-header');
      expect(firstCardHeader).toBeTruthy();
      
      const firstCardBody = await page.$('.worker-body');
      expect(firstCardBody).toBeTruthy();
      
      const firstCardFooter = await page.$('.worker-footer');
      expect(firstCardFooter).toBeTruthy();
      
      const xpProgressBar = await page.$('.xp-progress-bar');
      expect(xpProgressBar).toBeTruthy();
      
      const assignButton = await page.$('.worker-assign-btn');
      expect(assignButton).toBeTruthy();
      
      await page.screenshot({ 
        path: '.sisyphus/evidence/task-22-worker-card-detail.png',
        fullPage: false
      });
    }
  }
  
  const modalStyles = await page.evaluate(() => {
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const rules = styleSheets[i].cssRules;
        for (let j = 0; j < rules.length; j++) {
          if (rules[j].selectorText && rules[j].selectorText.includes('modal-overlay')) {
            return true;
          }
        }
      } catch (e) {
      }
    }
    return false;
  });
  expect(modalStyles).toBeTruthy();
  
  console.log('Workers panel UI test completed successfully!');
});
