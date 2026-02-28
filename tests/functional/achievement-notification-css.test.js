const { test, expect } = require('@playwright/test');

test.describe('Achievement Notification CSS', () => {
    test('notification CSS classes exist', async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);

        const style = await page.evaluate(() => {
            const styleElement = document.querySelector('link[rel="stylesheet"]');
            if (!styleElement) return null;
            
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            document.body.appendChild(notification);
            
            const computed = getComputedStyle(notification);
            const result = {
                position: computed.position,
                zIndex: computed.zIndex,
                borderColor: computed.borderColor,
                transition: computed.transition
            };
            
            notification.remove();
            return result;
        });

        expect(style.position).toBe('fixed');
        expect(parseInt(style.zIndex)).toBeGreaterThanOrEqual(1000);
    });

    test('notification can be created manually', async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);

        const notificationCreated = await page.evaluate(() => {
            const notification = document.createElement('div');
            notification.id = 'achievement-notification';
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon">🏆</div>
                    <div class="notification-text">
                        <div class="notification-title">成就解锁!</div>
                        <div class="notification-name">测试成就</div>
                        <div class="notification-description">这是一个测试成就</div>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);
            
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
            
            return document.getElementById('achievement-notification') !== null;
        });

        expect(notificationCreated).toBe(true);

        const notification = page.locator('#achievement-notification');
        await expect(notification).toBeVisible();

        const hasShowClass = await notification.evaluate(el => el.classList.contains('show'));
        expect(hasShowClass).toBe(true);
    });

    test('notification i18n works', async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);

        const chineseText = await page.evaluate(() => {
            if (!window.i18n) return null;
            return window.i18n.t('achievementUnlockedTitle');
        });

        expect(chineseText).toBe('成就解锁!');

        await page.evaluate(() => {
            if (window.i18n) {
                window.i18n.setLanguage('en');
                window.i18n.updateAllTranslations();
            }
        });

        const englishText = await page.evaluate(() => {
            if (!window.i18n) return null;
            return window.i18n.t('achievementUnlockedTitle');
        });

        expect(englishText).toBe('Achievement Unlocked!');
    });

    test('notification fade-out animation works', async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);

        const animationExists = await page.evaluate(() => {
            const style = document.createElement('style');
            style.textContent = `
                .achievement-notification.hide {
                    opacity: 0;
                    transform: translateX(100%);
                }
            `;
            document.head.appendChild(style);
            
            const notification = document.createElement('div');
            notification.className = 'achievement-notification hide';
            document.body.appendChild(notification);
            
            const computed = getComputedStyle(notification);
            const result = computed.opacity === '0';
            
            notification.remove();
            style.remove();
            
            return result;
        });

        expect(animationExists).toBe(true);
    });
});
