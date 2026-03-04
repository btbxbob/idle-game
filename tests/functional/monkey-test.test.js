const { test, expect } = require('../fixtures/coverage');

async function waitForGameInitialization(page) {
  await page.goto('http://localhost:8080');
  await page.waitForFunction(() => window.gameInitialized === true, { timeout: 10000 });
}

async function assertCoreStateValid(page) {
  const [coinsText, woodText, stoneText, cpcText] = await Promise.all([
    page.textContent('#coins'),
    page.textContent('#wood'),
    page.textContent('#stone'),
    page.textContent('#cpc'),
  ]);

  const coins = parseFloat((coinsText || '0').split(':').pop().trim());
  const wood = parseFloat((woodText || '0').split(':').pop().trim());
  const stone = parseFloat((stoneText || '0').split(':').pop().trim());
  const cpc = parseFloat((cpcText || '0').split(':').pop().trim());

  expect(Number.isFinite(coins)).toBe(true);
  expect(Number.isFinite(wood)).toBe(true);
  expect(Number.isFinite(stone)).toBe(true);
  expect(Number.isFinite(cpc)).toBe(true);
  expect(coins).toBeGreaterThanOrEqual(0);
  expect(wood).toBeGreaterThanOrEqual(0);
  expect(stone).toBeGreaterThanOrEqual(0);
  expect(cpc).toBeGreaterThanOrEqual(1);

  const buildingListContent = await page.textContent('#building-list').catch(() => '');
  expect(buildingListContent).not.toContain('undefined');
}

test.describe('Monkey Test Suite', () => {
  test('rapid mixed interactions remain stable', async ({ page }) => {
    await waitForGameInitialization(page);

    for (let i = 0; i < 250; i++) {
      const roll = Math.random();

      if (roll < 0.55) {
        await page.click('#coin-button').catch(() => {});
      } else if (roll < 0.8) {
        await page.click('button[data-tab="buildings"]').catch(() => {});
        await page.click('#buy-building-0').catch(() => {});
      } else {
        await page.click('button[data-tab="resources"]').catch(() => {});
      }

      if (i % 25 === 0) {
        await page.waitForTimeout(80);
        await assertCoreStateValid(page);
      }
    }

    await page.waitForTimeout(200);
    await assertCoreStateValid(page);
  });

  test('invalid WASM calls are safely rejected', async ({ page }) => {
    await waitForGameInitialization(page);

    const results = await page.evaluate(() => {
      const safeBuyBuilding999 = window.rustGame?.buy_building?.(999) ?? false;
      const safeBuyBuilding1000 = window.rustGame?.buy_building?.(1000) ?? false;
      const coinsBefore = window.rustGame?.get_coins?.() ?? 0;
      return { safeBuyBuilding999, safeBuyBuilding1000, coinsBefore };
    });

    expect(results.safeBuyBuilding999).toBe(false);
    expect(results.safeBuyBuilding1000).toBe(false);

    const coinsAfter = await page.evaluate(() => window.rustGame?.get_coins?.() ?? 0);
    expect(coinsAfter).toBeGreaterThanOrEqual(0);
    expect(coinsAfter).toBe(results.coinsBefore);
  });

  test('building purchase can increase click power', async ({ page }) => {
    await waitForGameInitialization(page);

    for (let i = 0; i < 20; i++) {
      await page.click('#coin-button');
    }

    const cpcBefore = parseFloat(((await page.textContent('#cpc')) || '0').split(':').pop().trim());

    await page.click('button[data-tab="buildings"]');
    await page.click('#buy-building-0').catch(() => {});
    await page.waitForTimeout(300);

    const cpcAfter = parseFloat(((await page.textContent('#cpc')) || '0').split(':').pop().trim());
    expect(cpcAfter).toBeGreaterThanOrEqual(cpcBefore);
  });
});
