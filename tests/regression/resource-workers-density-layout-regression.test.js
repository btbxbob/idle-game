const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage } = require('../fixtures/stage-helpers');

test('resources tab defaults to all resources and removes duplicate title block', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(500);

  await expect(page.locator('#tab-resources')).toHaveClass(/active/);
  await expect(page.locator('#resource-category-tabs .category-tab-button.active')).toHaveAttribute('data-tier', 'ALL');

  const state = await page.evaluate(() => {
    const panel = document.getElementById('resources-panel');
    const primary = document.getElementById('primary-resources');
    const secondary = document.getElementById('secondary-resources');
    const special = document.getElementById('special-resources');
    const header = document.getElementById('resources-header');
    const firstChildId = panel && panel.firstElementChild ? panel.firstElementChild.id : null;
    const primaryDisplay = primary ? getComputedStyle(primary).display : '';
    const secondaryDisplay = secondary ? getComputedStyle(secondary).display : '';
    const specialDisplay = special ? getComputedStyle(special).display : '';
    return { firstChildId, primaryDisplay, secondaryDisplay, specialDisplay, hasHeader: Boolean(header) };
  });

  expect(state.firstChildId).toBe('resource-category-tabs');
  expect(state.primaryDisplay).not.toBe('none');
  expect(state.secondaryDisplay).not.toBe('none');
  expect(state.specialDisplay).not.toBe('none');
  expect(state.hasHeader).toBe(false);
});

test('resources density and workers 3-column layout are compact', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true);
  await page.waitForTimeout(500);
  await unlockWorkersStage(page);

  const resourceDensity = await page.evaluate(() => {
    const grid = document.querySelector('#primary-resources .resource-grid');
    const item = document.querySelector('#primary-resources .resource-item');
    const amount = document.querySelector('#primary-resources .resource-item[data-resource="coins"] .resource-amount');
    if (!grid || !item) {
      return null;
    }
    const gridStyle = getComputedStyle(grid);
    const itemStyle = getComputedStyle(item);
    return {
      columns: gridStyle.gridTemplateColumns.split(' ').filter(Boolean).length,
      gap: parseFloat(gridStyle.gap || '0'),
      paddingTop: parseFloat(itemStyle.paddingTop || '0'),
      paddingBottom: parseFloat(itemStyle.paddingBottom || '0'),
      amountFits: amount ? amount.scrollWidth <= amount.clientWidth + 1 : false,
    };
  });

  expect(resourceDensity).not.toBeNull();
  expect(resourceDensity.columns).toBe(3);
  expect(resourceDensity.gap).toBeLessThanOrEqual(6);
  expect(resourceDensity.paddingTop).toBeLessThanOrEqual(10);
  expect(resourceDensity.paddingBottom).toBeLessThanOrEqual(10);
  expect(resourceDensity.amountFits).toBe(true);

  await page.click('button[data-tab="workers"]');
  await page.waitForTimeout(300);

  const workersLayout = await page.evaluate(() => {
    const grid = document.querySelector('#workers-grid');
    if (!grid) {
      return null;
    }
    const style = getComputedStyle(grid);
    const columns = style.gridTemplateColumns.split(' ').filter(Boolean).length;
    const gap = parseFloat(style.gap || '0');
    return { columns, gap };
  });

  expect(workersLayout).not.toBeNull();
  expect(workersLayout.columns).toBeGreaterThanOrEqual(3);
  expect(workersLayout.gap).toBeLessThanOrEqual(8);
});
