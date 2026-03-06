const { test, expect } = require('../fixtures/coverage');

async function assertBannerNotCoveredByTabs(page) {
  const layout = await page.evaluate(() => {
    const banner = document.querySelector('#banner');
    const tabNav = document.querySelector('#tab-navigation');
    if (!banner || !tabNav) {
      return null;
    }

    const bannerRect = banner.getBoundingClientRect();
    const tabRect = tabNav.getBoundingClientRect();

    return {
      bannerBottom: bannerRect.bottom,
      tabTop: tabRect.top,
      bannerClientHeight: banner.clientHeight,
      bannerScrollHeight: banner.scrollHeight
    };
  });

  expect(layout).not.toBeNull();
  expect(layout.tabTop).toBeGreaterThanOrEqual(layout.bannerBottom);
  expect(layout.bannerScrollHeight).toBeLessThanOrEqual(layout.bannerClientHeight + 1);
}

async function getTabNavLayout(page) {
  return page.evaluate(() => {
    const banner = document.querySelector('#banner');
    const tabNav = document.querySelector('#tab-navigation');
    if (!banner || !tabNav) {
      return null;
    }

    const bannerRect = banner.getBoundingClientRect();
    const tabRect = tabNav.getBoundingClientRect();
    return {
      bannerBottom: bannerRect.bottom,
      tabTop: tabRect.top,
      tabHeight: tabRect.height
    };
  });
}

async function assertTabContentNotCoveringTabBar(page) {
  const occlusion = await page.evaluate(() => {
    const tabNav = document.querySelector('#tab-navigation');
    const activeContent = document.querySelector('.tab-content.active');
    if (!tabNav || !activeContent) {
      return null;
    }

    const navRect = tabNav.getBoundingClientRect();
    const contentRect = activeContent.getBoundingClientRect();

    const sampleX = Math.min(window.innerWidth - 2, Math.max(2, navRect.left + navRect.width / 2));
    const sampleY = Math.max(2, navRect.bottom - 2);
    const topEl = document.elementFromPoint(sampleX, sampleY);
    const insideTabNav = !!(topEl && topEl.closest('#tab-navigation'));

    return {
      tabBottom: navRect.bottom,
      contentTop: contentRect.top,
      insideTabNav,
      topId: topEl ? topEl.id : null,
      topClass: topEl ? topEl.className : null
    };
  });

  expect(occlusion).not.toBeNull();
  expect(occlusion.contentTop).toBeGreaterThanOrEqual(occlusion.tabBottom - 1);
  expect(occlusion.insideTabNav).toBeTruthy();
}

test.describe('banner-tab overlap regression', () => {
  test('375px viewport keeps tab bar below resource banner under stress', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await page.waitForTimeout(600);

    await expect(page.locator('#banner')).toBeVisible();
    await expect(page.locator('#tab-navigation')).toBeVisible();

    await assertBannerNotCoveredByTabs(page);

    await page.evaluate(() => {
      const cards = document.querySelectorAll('#banner .header-resource-card');
      cards.forEach((card, index) => {
        card.style.display = 'grid';

        const amount = card.querySelector('.header-resource-amount');
        const rate = card.querySelector('.header-resource-rate');

        if (amount) {
          amount.textContent = `资源${index + 1}: 9999999`;
        }
        if (rate) {
          rate.textContent = '+999.9/s';
        }
      });
    });

    await page.waitForTimeout(150);
    await assertBannerNotCoveredByTabs(page);
  });

  test('393px viewport keeps tab bar below banner after tab switching', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
    await page.waitForTimeout(600);

    await expect(page.locator('#banner')).toBeVisible();
    await expect(page.locator('#tab-navigation')).toBeVisible();

    const baselineLayout = await getTabNavLayout(page);
    expect(baselineLayout).not.toBeNull();

    const tabSequence = ['workers', 'technology', 'resources', 'statistics', 'resources'];
    for (const tabName of tabSequence) {
      await page.click(`button[data-tab="${tabName}"]`);
      await page.waitForTimeout(120);

      const currentLayout = await getTabNavLayout(page);
      expect(currentLayout).not.toBeNull();
      expect(currentLayout.tabTop).toBeGreaterThanOrEqual(currentLayout.bannerBottom);
      expect(Math.abs(currentLayout.tabHeight - baselineLayout.tabHeight)).toBeLessThanOrEqual(1);

      await assertTabContentNotCoveringTabBar(page);

      await assertBannerNotCoveredByTabs(page);
    }
  });
});
