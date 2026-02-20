const { test, expect } = require('@playwright/test');

test.describe('Achievement Notification System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
    });

    test('notification appears when achievement unlocks', async ({ page }) => {
        const clickArea = page.locator('#click-area');
        for (let i = 0; i < 10; i++) {
            await clickArea.click();
        }

        await page.waitForTimeout(500);

        const notification = page.locator('#achievement-notification');
        await expect(notification).toBeVisible();

        await expect(notification.locator('.notification-title')).toBeVisible();
        await expect(notification.locator('.notification-name')).toBeVisible();
        await expect(notification.locator('.notification-description')).toBeVisible();
    });

    test('notification auto-dismisses after 5 seconds', async ({ page }) => {
        const clickArea = page.locator('#click-area');
        for (let i = 0; i < 10; i++) {
            await clickArea.click();
        }

        await page.waitForTimeout(500);
        const notification = page.locator('#achievement-notification');
        await expect(notification).toBeVisible();

        await page.waitForTimeout(5500);

        await expect(notification).not.toBeVisible();
    });

    test('notification uses i18n for title', async ({ page }) => {
        const clickArea = page.locator('#click-area');
        for (let i = 0; i < 10; i++) {
            await clickArea.click();
        }

        await page.waitForTimeout(500);

        const title = page.locator('#achievement-notification .notification-title');
        await expect(title).toContainText('成就解锁');

        const languageSelect = page.locator('#language-select');
        await languageSelect.selectOption('en');
        await page.waitForTimeout(200);

        for (let i = 0; i < 90; i++) {
            await clickArea.click();
        }
        await page.waitForTimeout(500);

        const enTitle = page.locator('#achievement-notification .notification-title');
        await expect(enTitle).toContainText('Achievement Unlocked');
    });

    test('notification has slide-in animation class', async ({ page }) => {
        const clickArea = page.locator('#click-area');
        for (let i = 0; i < 10; i++) {
            await clickArea.click();
        }

        await page.waitForTimeout(100);

        const notification = page.locator('#achievement-notification');
        const hasShowClass = await notification.evaluate(el => el.classList.contains('show'));
        expect(hasShowClass).toBe(true);
    });

    test('notification CSS styles are applied', async ({ page }) => {
        const clickArea = page.locator('#click-area');
        for (let i = 0; i < 10; i++) {
            await clickArea.click();
        }

        await page.waitForTimeout(500);

        const notification = page.locator('#achievement-notification');
        
        const position = await notification.evaluate(el => getComputedStyle(el).position);
        expect(position).toBe('fixed');

        const borderColor = await notification.evaluate(el => getComputedStyle(el).borderColor);
        expect(borderColor).toBe('rgb(255, 215, 0)');

        const zIndex = await notification.evaluate(el => getComputedStyle(el).zIndex);
        expect(parseInt(zIndex)).toBeGreaterThanOrEqual(1000);
    });

    test('notification content structure is correct', async ({ page }) => {
        const clickArea = page.locator('#click-area');
        for (let i = 0; i < 10; i++) {
            await clickArea.click();
        }

        await page.waitForTimeout(500);

        const notification = page.locator('#achievement-notification');
        const content = notification.locator('.notification-content');
        await expect(content).toBeVisible();

        const icon = content.locator('.notification-icon');
        await expect(icon).toBeVisible();
        const iconText = await icon.textContent();
        expect(iconText).toContain('🏆');

        const text = content.locator('.notification-text');
        await expect(text).toBeVisible();
    });

    test('multiple achievements queue properly', async ({ page }) => {
        const clickArea = page.locator('#click-area');
        for (let i = 0; i < 100; i++) {
            await clickArea.click();
        }

        await page.waitForTimeout(500);

        const notifications = page.locator('#achievement-notification');
        await expect(notifications).toBeVisible();

        const count = await notifications.count();
        expect(count).toBe(1);
    });

    test('notification hide class added on dismiss', async ({ page }) => {
        const clickArea = page.locator('#click-area');
        for (let i = 0; i < 10; i++) {
            await clickArea.click();
        }

        await page.waitForTimeout(500);

        await page.waitForTimeout(5000);

        const notification = page.locator('#achievement-notification');
        const hasHideClass = await notification.evaluate(el => el.classList.contains('hide'));
        expect(hasHideClass).toBe(true);
    });
});
