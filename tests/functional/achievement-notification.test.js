const { test, expect } = require('../fixtures/coverage');

async function clickCoins(page, count) {
    const clickArea = page.locator('#coin-button');
    for (let i = 0; i < count; i++) {
        await clickArea.click();
    }
}

async function unlockNotification(page, count = 10) {
    await clickCoins(page, count);
    const notification = page.locator('#achievement-notification');
    await expect(notification).toBeVisible();
    return notification;
}

async function waitForNotificationHidden(page) {
    await page.waitForFunction(() => {
        const el = document.getElementById('achievement-notification');
        if (!el) return true;
        const style = getComputedStyle(el);
        return el.classList.contains('hide') || style.display === 'none' || style.opacity === '0';
    }, null, { timeout: 10000 });
}

test.describe('Achievement Notification System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
    });

    test('notification renders expected structure, styles, and animation when achievement unlocks', async ({ page }) => {
        const notification = await unlockNotification(page);

        await expect(notification.locator('.notification-title')).toBeVisible();
        await expect(notification.locator('.notification-name')).toBeVisible();
        await expect(notification.locator('.notification-description')).toBeVisible();

        const hasShowClass = await notification.evaluate(el => el.classList.contains('show'));
        expect(hasShowClass).toBe(true);
        
        const position = await notification.evaluate(el => getComputedStyle(el).position);
        expect(position).toBe('fixed');

        const borderColor = await notification.evaluate(el => getComputedStyle(el).borderColor);
        expect(borderColor).toBe('rgb(255, 215, 0)');

        const zIndex = await notification.evaluate(el => getComputedStyle(el).zIndex);
        expect(parseInt(zIndex)).toBeGreaterThanOrEqual(1000);

        const content = notification.locator('.notification-content');
        await expect(content).toBeVisible();

        const icon = content.locator('.notification-icon');
        await expect(icon).toBeVisible();
        const iconText = await icon.textContent();
        expect(iconText).toContain('🏆');

        const text = content.locator('.notification-text');
        await expect(text).toBeVisible();
    });

    test('notification auto-dismisses and leaves hidden state after timeout', async ({ page }) => {
        const notification = await unlockNotification(page);
        const exists = await notification.count();
        if (exists === 0) {
            test.skip(true, 'Notification may already be dismissed in current timing model.');
        }

        await waitForNotificationHidden(page);

        const remaining = await notification.count();
        if (remaining > 0) {
            const hiddenOrGone = await notification.evaluate(el =>
                el.classList.contains('hide') || getComputedStyle(el).display === 'none' || getComputedStyle(el).opacity === '0'
            );
            expect(hiddenOrGone).toBe(true);
        } else {
            expect(remaining).toBe(0);
        }
    });

    test('notification uses i18n for title', async ({ page }) => {
        await unlockNotification(page);

        const title = page.locator('#achievement-notification .notification-title');
        await expect(title).toContainText('成就解锁');

        await page.click('button[data-tab="settings"]');
        const languageSelect = page.locator('#language-select-setting');
        await languageSelect.selectOption('en');
        await expect(languageSelect).toHaveValue('en');

        await clickCoins(page, 90);
        const enTitle = page.locator('#achievement-notification .notification-title');
        await expect(enTitle).toBeVisible();
        await expect(enTitle).toContainText('Achievement Unlocked');
    });

    test('multiple achievements queue properly', async ({ page }) => {
        await clickCoins(page, 100);

        const notifications = page.locator('#achievement-notification');
        await expect(notifications).toBeVisible();

        const count = await notifications.count();
        expect(count).toBe(1);
    });
});
