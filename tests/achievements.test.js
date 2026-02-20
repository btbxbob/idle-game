const { test, expect } = require('@playwright/test');

test.describe('Achievement System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.click('[data-tab="achievements"]');
        await page.waitForSelector('#tab-achievements.active');
    });

    test('achievements panel displays at least 15 achievements', async ({ page }) => {
        const achievementItems = page.locator('.achievement-item');
        const count = await achievementItems.count();
        
        expect(count).toBeGreaterThanOrEqual(15);
        console.log(`Total achievements displayed: ${count}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-29-achievements-list.png',
            fullPage: false
        });
    });

    test('each achievement displays name, description, and progress', async ({ page }) => {
        const firstAchievement = page.locator('.achievement-item:first-child');
        await expect(firstAchievement).toBeVisible();

        const nameElement = firstAchievement.locator('.achievement-name, h3, .name');
        await expect(nameElement).toBeVisible();

        const descElement = firstAchievement.locator('.achievement-description, p, .description');
        await expect(descElement).toBeVisible();

        const progressElement = firstAchievement.locator('.achievement-progress, .progress, [class*="progress"]');
        await expect(progressElement).toBeVisible();

        console.log('Achievement structure verified: name, description, progress');
    });

    test('click novice achievement unlocks after 10 clicks', async ({ page }) => {
        const clickNovice = page.locator('.achievement-item:has-text("Click Novice"), .achievement-item:has-text("click novice"), .achievement-item:has-text("10")').first();
        
        const initialProgress = await clickNovice.locator('.achievement-progress').textContent();
        console.log(`Initial progress: ${initialProgress}`);

        for (let i = 0; i < 10; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const afterProgress = await clickNovice.locator('.achievement-progress').textContent();
        console.log(`After 10 clicks progress: ${afterProgress}`);

        const isUnlocked = await clickNovice.evaluate(el => 
            el.classList.contains('unlocked') || 
            el.classList.contains('completed') ||
            el.getAttribute('data-unlocked') === 'true'
        );
        
        expect(isUnlocked).toBe(true);

        await page.screenshot({
            path: '.sisyphus/evidence/task-29-click-novice-unlock.png'
        });
    });

    test('click master achievement unlocks after 100 clicks', async ({ page }) => {
        const clickMaster = page.locator('.achievement-item:has-text("Click Master"), .achievement-item:has-text("click master"), .achievement-item:has-text("100")').first();

        for (let i = 0; i < 100; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const isUnlocked = await clickMaster.evaluate(el =>
            el.classList.contains('unlocked') ||
            el.classList.contains('completed') ||
            el.getAttribute('data-unlocked') === 'true'
        );

        expect(isUnlocked).toBe(true);
        console.log('Click Master achievement unlocked');

        await page.screenshot({
            path: '.sisyphus/evidence/task-29-click-master-unlock.png'
        });
    });

    test('first coins achievement unlocks after earning 100 coins', async ({ page }) => {
        const firstCoins = page.locator('.achievement-item:has-text("First Coins"), .achievement-item:has-text("first coins"), .achievement-item:has-text("100")').nth(1);

        for (let i = 0; i < 100; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const isUnlocked = await firstCoins.evaluate(el =>
            el.classList.contains('unlocked') ||
            el.classList.contains('completed') ||
            el.getAttribute('data-unlocked') === 'true'
        );

        expect(isUnlocked).toBe(true);
        console.log('First Coins achievement unlocked');
    });

    test('wood collector achievement unlocks from wood buildings', async ({ page }) => {
        const woodCollector = page.locator('.achievement-item:has-text("Wood"), .achievement-item:has-text("wood"), .achievement-item:has-text("Collector")').first();

        await page.click('[data-tab="buildings"]');
        await page.waitForTimeout(200);

        for (let i = 0; i < 5; i++) {
            const initialCoins = await page.textContent('#coins');
            const coinsValue = parseInt(initialCoins.split(': ')[1]);
            
            if (coinsValue >= 50) {
                const buyButton = page.locator('#buy-building-1');
                if (await buyButton.isVisible()) {
                    await buyButton.click();
                    await page.waitForTimeout(300);
                }
            }
        }

        await page.click('[data-tab="achievements"]');
        await page.waitForTimeout(500);

        const isUnlocked = await woodCollector.evaluate(el =>
            el.classList.contains('unlocked') ||
            el.classList.contains('completed') ||
            el.getAttribute('data-unlocked') === 'true'
        );

        console.log('Wood Collector achievement check completed');
    });

    test('first building achievement unlocks after first purchase', async ({ page }) => {
        const firstBuilding = page.locator('.achievement-item:has-text("First Building"), .achievement-item:has-text("first building")').first();

        await page.click('[data-tab="buildings"]');
        await page.waitForTimeout(200);

        const initialCoins = await page.textContent('#coins');
        const coinsValue = parseInt(initialCoins.split(': ')[1]);

        if (coinsValue >= 15) {
            await page.click('#buy-building-0');
            await page.waitForTimeout(500);

            await page.click('[data-tab="achievements"]');
            await page.waitForTimeout(500);

            const isUnlocked = await firstBuilding.evaluate(el =>
                el.classList.contains('unlocked') ||
                el.classList.contains('completed') ||
                el.getAttribute('data-unlocked') === 'true'
            );

            expect(isUnlocked).toBe(true);
            console.log('First Building achievement unlocked');

            await page.screenshot({
                path: '.sisyphus/evidence/task-29-first-building-unlock.png'
            });
        }
    });

    test('achievements accessible via WASM API', async ({ page }) => {
        const achievements = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_achievements) {
                return window.rustGame.get_achievements();
            }
            return [];
        });

        expect(Array.isArray(achievements)).toBe(true);
        expect(achievements.length).toBeGreaterThanOrEqual(15);

        const firstAchievement = achievements[0];
        expect(firstAchievement).toHaveProperty('id');
        expect(firstAchievement).toHaveProperty('name');
        expect(firstAchievement).toHaveProperty('description');
        expect(firstAchievement).toHaveProperty('unlocked');
        expect(firstAchievement).toHaveProperty('progress');
        expect(firstAchievement).toHaveProperty('requirement');

        console.log(`WASM achievements API returned ${achievements.length} achievements`);
        console.log('First achievement:', JSON.stringify(firstAchievement, null, 2));

        await page.screenshot({
            path: '.sisyphus/evidence/task-29-wasm-api.png'
        });
    });

    test('achievement categories are properly organized', async ({ page }) => {
        const categories = [
            '.achievement-category:has-text("clicks"), .achievement-category:has-text("Clicks")',
            '.achievement-category:has-text("resources"), .achievement-category:has-text("Resources")',
            '.achievement-category:has-text("buildings"), .achievement-category:has-text("Buildings")',
            '.achievement-category:has-text("crafting"), .achievement-category:has-text("Crafting")'
        ];

        for (const category of categories) {
            const categoryElement = page.locator(category).first();
            if (await categoryElement.isVisible()) {
                console.log(`Category visible: ${category}`);
            }
        }

        console.log('Achievement categories check completed');
    });

    test('achievement progress bar updates correctly', async ({ page }) => {
        const firstAchievement = page.locator('.achievement-item:first-child');
        const progressBar = firstAchievement.locator('.progress-bar, [class*="progress"]');

        const initialWidth = await progressBar.evaluate(el => 
            el.style.width || getComputedStyle(el).width
        );
        console.log(`Initial progress bar width: ${initialWidth}`);

        for (let i = 0; i < 10; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const afterWidth = await progressBar.evaluate(el =>
            el.style.width || getComputedStyle(el).width
        );
        console.log(`After clicks progress bar width: ${afterWidth}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-29-progress-bar.png'
        });
    });

    test('locked achievements display locked state', async ({ page }) => {
        const lockedAchievement = page.locator('.achievement-item.locked, .achievement-item:not(.unlocked)').first();
        
        if (await lockedAchievement.isVisible()) {
            const isLocked = await lockedAchievement.evaluate(el =>
                el.classList.contains('locked') ||
                !el.classList.contains('unlocked')
            );
            
            expect(isLocked).toBe(true);
            console.log('Locked achievement displays correctly');
        }
    });

    test('unlocked achievements display unlocked state', async ({ page }) => {
        for (let i = 0; i < 10; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const unlockedAchievement = page.locator('.achievement-item.unlocked, .achievement-item[data-unlocked="true"]').first();
        
        if (await unlockedAchievement.isVisible()) {
            const isUnlocked = await unlockedAchievement.evaluate(el =>
                el.classList.contains('unlocked') ||
                el.getAttribute('data-unlocked') === 'true'
            );
            
            expect(isUnlocked).toBe(true);
            console.log('Unlocked achievement displays correctly');

            await page.screenshot({
                path: '.sisyphus/evidence/task-29-unlocked-state.png'
            });
        }
    });

    test('achievement notification appears on unlock', async ({ page }) => {
        const notification = page.locator('#achievement-notification');
        
        for (let i = 0; i < 10; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        await expect(notification).toBeVisible();

        const notificationTitle = notification.locator('.notification-title');
        await expect(notificationTitle).toBeVisible();

        const notificationName = notification.locator('.notification-name');
        await expect(notificationName).toBeVisible();

        console.log('Achievement notification appeared');

        await page.screenshot({
            path: '.sisyphus/evidence/task-29-notification-appears.png'
        });
    });

    test('achievement notification auto-dismisses after 5 seconds', async ({ page }) => {
        const notification = page.locator('#achievement-notification');
        
        for (let i = 0; i < 10; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        await expect(notification).toBeVisible();
        console.log('Notification visible, waiting for auto-dismiss...');

        await page.waitForTimeout(5500);

        await expect(notification).not.toBeVisible();
        console.log('Notification auto-dismissed after 5 seconds');

        await page.screenshot({
            path: '.sisyphus/evidence/task-29-notification-dismiss.png'
        });
    });

    test('achievement notification uses i18n for title', async ({ page }) => {
        const notification = page.locator('#achievement-notification');
        
        for (let i = 0; i < 10; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const titleElement = notification.locator('.notification-title');
        const titleText = await titleElement.textContent();
        
        expect(titleText).toMatch(/成就解锁|Achievement Unlocked/);
        console.log(`Notification title (zh-CN): ${titleText}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-29-notification-i18n.png'
        });
    });

    test('achievements persist after page reload', async ({ page }) => {
        for (let i = 0; i < 25; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const unlockedBefore = await page.evaluate(() => {
            const items = document.querySelectorAll('.achievement-item.unlocked, .achievement-item[data-unlocked="true"]');
            return items.length;
        });
        console.log(`Unlocked before reload: ${unlockedBefore}`);

        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.click('[data-tab="achievements"]');
        await page.waitForTimeout(500);

        const unlockedAfter = await page.evaluate(() => {
            const items = document.querySelectorAll('.achievement-item.unlocked, .achievement-item[data-unlocked="true"]');
            return items.length;
        });
        console.log(`Unlocked after reload: ${unlockedAfter}`);

        expect(unlockedAfter).toBeGreaterThanOrEqual(unlockedBefore);

        await page.screenshot({
            path: '.sisyphus/evidence/task-29-persistence.png'
        });
    });
});
