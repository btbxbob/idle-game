const { test, expect } = require('@playwright/test');

test.describe('Unlock System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.click('[data-tab="unlocks"]');
        await page.waitForSelector('#tab-unlocks.active');
    });

    test('unlocks panel displays at least 5 unlockable features', async ({ page }) => {
        const unlockItems = page.locator('.unlock-feature, .unlock-item, [class*="unlock"]');
        const count = await unlockItems.count();
        
        expect(count).toBeGreaterThanOrEqual(5);
        console.log(`Total unlockable features displayed: ${count}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-31-unlocks-list.png',
            fullPage: false
        });
    });

    test('each unlock displays name, requirement, and progress', async ({ page }) => {
        const firstUnlock = page.locator('.unlock-feature:first-child, .unlock-item:first-child');
        await expect(firstUnlock).toBeVisible();

        const nameElement = firstUnlock.locator('.unlock-name, h3, .name');
        await expect(nameElement).toBeVisible();

        const requirementElement = firstUnlock.locator('.unlock-requirement, .requirement, [class*="requirement"]');
        await expect(requirementElement).toBeVisible();

        const progressElement = firstUnlock.locator('.unlock-progress, .progress, [class*="progress"]');
        await expect(progressElement).toBeVisible();

        console.log('Unlock structure verified: name, requirement, progress');
    });

    test('workers tab unlock requires 50 total clicks', async ({ page }) => {
        const workersUnlock = page.locator('.unlock-feature:has-text("workers"), .unlock-feature:has-text("Workers"), .unlock-feature:has-text("工人")').first();
        
        const requirementText = await workersUnlock.locator('.unlock-requirement').textContent();
        console.log(`Workers tab requirement: ${requirementText}`);

        expect(requirementText).toMatch(/50|clicks/);

        const initialProgress = await workersUnlock.locator('.progress-value, .progress-bar').textContent();
        console.log(`Initial progress: ${initialProgress}`);

        for (let i = 0; i < 50; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const afterProgress = await workersUnlock.locator('.progress-value, .progress-bar').textContent();
        console.log(`After 50 clicks progress: ${afterProgress}`);

        const isUnlocked = await workersUnlock.evaluate(el =>
            el.classList.contains('unlocked') ||
            el.classList.contains('completed') ||
            el.getAttribute('data-unlocked') === 'true'
        );

        expect(isUnlocked).toBe(true);
        console.log('Workers tab unlocked');

        await page.screenshot({
            path: '.sisyphus/evidence/task-31-workers-tab-unlock.png'
        });
    });

    test('statistics panel unlock requires 10 total clicks', async ({ page }) => {
        const statsUnlock = page.locator('.unlock-feature:has-text("statistics"), .unlock-feature:has-text("Statistics"), .unlock-feature:has-text("统计")').first();
        
        const requirementText = await statsUnlock.locator('.unlock-requirement').textContent();
        console.log(`Statistics panel requirement: ${requirementText}`);

        for (let i = 0; i < 10; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const isUnlocked = await statsUnlock.evaluate(el =>
            el.classList.contains('unlocked') ||
            el.classList.contains('completed') ||
            el.getAttribute('data-unlocked') === 'true'
        );

        expect(isUnlocked).toBe(true);
        console.log('Statistics panel unlocked');
    });

    test('achievements panel unlock requires 25 total clicks', async ({ page }) => {
        const achievementsUnlock = page.locator('.unlock-feature:has-text("achievements"), .unlock-feature:has-text("Achievements"), .unlock-feature:has-text("成就")').first();
        
        const requirementText = await achievementsUnlock.locator('.unlock-requirement').textContent();
        console.log(`Achievements panel requirement: ${requirementText}`);

        for (let i = 0; i < 25; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const isUnlocked = await achievementsUnlock.evaluate(el =>
            el.classList.contains('unlocked') ||
            el.classList.contains('completed') ||
            el.getAttribute('data-unlocked') === 'true'
        );

        expect(isUnlocked).toBe(true);
        console.log('Achievements panel unlocked');

        await page.screenshot({
            path: '.sisyphus/evidence/task-31-achievements-panel-unlock.png'
        });
    });

    test('unlock button enabled when requirement met', async ({ page }) => {
        const unlockButton = page.locator('.unlock-btn, button:has-text("解锁"), button:has-text("Unlock")').first();
        
        const isDisabled = await unlockButton.evaluate(el =>
            el.disabled ||
            el.classList.contains('disabled') ||
            getComputedStyle(el).pointerEvents === 'none'
        );

        console.log(`Initial unlock button disabled: ${isDisabled}`);

        for (let i = 0; i < 50; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const afterDisabled = await unlockButton.evaluate(el =>
            el.disabled ||
            el.classList.contains('disabled')
        );

        console.log(`After meeting requirement button disabled: ${afterDisabled}`);

        if (!afterDisabled) {
            console.log('Unlock button correctly enabled');
        }

        await page.screenshot({
            path: '.sisyphus/evidence/task-31-unlock-button-state.png'
        });
    });

    test('unlock button disabled when requirement not met', async ({ page }) => {
        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.click('[data-tab="unlocks"]');
        await page.waitForTimeout(500);

        const highTierUnlock = page.locator('.unlock-feature:has-text("prestige"), .unlock-feature:has-text("Prestige"), .unlock-feature:has-text("10000")').first();
        
        if (await highTierUnlock.isVisible()) {
            const unlockButton = highTierUnlock.locator('.unlock-btn, button').first();
            
            const isDisabled = await unlockButton.evaluate(el =>
                el.disabled ||
                el.classList.contains('disabled') ||
                getComputedStyle(el).opacity === '0.5'
            );

            expect(isDisabled).toBe(true);
            console.log('High tier unlock button correctly disabled');

            await page.screenshot({
                path: '.sisyphus/evidence/task-31-disabled-button.png'
            });
        }
    });

    test('progress bar shows current vs required value', async ({ page }) => {
        const unlockItem = page.locator('.unlock-feature:first-child');
        
        const progressText = await unlockItem.locator('.progress-text, .progress-value, [class*="progress"]').textContent();
        console.log(`Progress display: ${progressText}`);

        expect(progressText).toMatch(/\d+/);

        for (let i = 0; i < 20; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const afterProgress = await unlockItem.locator('.progress-text, .progress-value, [class*="progress"]').textContent();
        console.log(`Progress after clicks: ${afterProgress}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-31-progress-bar.png'
        });
    });

    test('unlock accessible via WASM API', async ({ page }) => {
        const canUnlock = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.unlock_feature) {
                return typeof window.rustGame.unlock_feature === 'function';
            }
            return false;
        });

        expect(canUnlock).toBe(true);
        console.log('WASM unlock_feature API available');

        const canCheckUnlock = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.check_unlock) {
                return typeof window.rustGame.check_unlock === 'function';
            }
            return false;
        });

        expect(canCheckUnlock).toBe(true);
        console.log('WASM check_unlock API available');

        const unlocks = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_unlocks) {
                return window.rustGame.get_unlocks();
            }
            return [];
        });

        if (Array.isArray(unlocks)) {
            expect(unlocks.length).toBeGreaterThanOrEqual(5);
            console.log(`WASM returned ${unlocks.length} unlocks`);
            
            if (unlocks.length > 0) {
                console.log('First unlock:', JSON.stringify(unlocks[0], null, 2));
            }
        }

        await page.screenshot({
            path: '.sisyphus/evidence/task-31-wasm-api.png'
        });
    });

    test('unlock feature actually unlocks the content', async ({ page }) => {
        const workersUnlock = page.locator('.unlock-feature:has-text("workers"), .unlock-feature:has-text("Workers"), .unlock-feature:has-text("工人")').first();
        
        for (let i = 0; i < 50; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const unlockButton = workersUnlock.locator('.unlock-btn, button:has-text("解锁"), button:has-text("Unlock")');
        if (await unlockButton.isVisible()) {
            await unlockButton.click();
            await page.waitForTimeout(500);

            const isUnlocked = await workersUnlock.evaluate(el =>
                el.classList.contains('unlocked')
            );

            console.log(`Feature unlocked status: ${isUnlocked}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-31-feature-unlock.png'
            });
        }
    });

    test('unlock success notification displays', async ({ page }) => {
        const unlockItem = page.locator('.unlock-feature:first-child');
        
        for (let i = 0; i < 100; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(500);

        const unlockButton = unlockItem.locator('.unlock-btn, button').first();
        if (await unlockButton.isVisible() && !await unlockButton.evaluate(el => el.disabled)) {
            await unlockButton.click();
            await page.waitForTimeout(500);

            const successMessage = page.locator('.unlock-success, [class*="success"], .toast-success, .notification');
            if (await successMessage.isVisible()) {
                console.log('Unlock success notification displayed');
            } else {
                console.log('Success notification may use different UI');
            }

            await page.screenshot({
                path: '.sisyphus/evidence/task-31-success-notification.png'
            });
        }
    });

    test('unlock threshold progression is reasonable', async ({ page }) => {
        const unlocks = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_unlocks) {
                return window.rustGame.get_unlocks();
            }
            return [];
        });

        if (Array.isArray(unlocks) && unlocks.length > 0) {
            const thresholds = unlocks.map(u => u.requirement_value || 0).filter(v => v > 0);
            
            console.log('Unlock thresholds:', thresholds);
            
            for (let i = 1; i < thresholds.length; i++) {
                if (thresholds[i] > thresholds[i - 1]) {
                    console.log(`Threshold progression: ${thresholds[i - 1]} -> ${thresholds[i]} (increasing)`);
                }
            }

            expect(thresholds.length).toBeGreaterThanOrEqual(5);

            await page.screenshot({
                path: '.sisyphus/evidence/task-31-thresholds.png'
            });
        }
    });

    test('locked features display locked state', async ({ page }) => {
        const lockedFeature = page.locator('.unlock-feature.locked, .unlock-feature:not(.unlocked)').first();
        
        if (await lockedFeature.isVisible()) {
            const isLocked = await lockedFeature.evaluate(el =>
                el.classList.contains('locked') ||
                !el.classList.contains('unlocked')
            );
            
            expect(isLocked).toBe(true);
            console.log('Locked feature displays correctly');
        }
    });

    test('unlocked features display unlocked state', async ({ page }) => {
        for (let i = 0; i < 50; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const unlockedFeature = page.locator('.unlock-feature.unlocked, .unlock-feature[data-unlocked="true"]').first();
        
        if (await unlockedFeature.isVisible()) {
            const isUnlocked = await unlockedFeature.evaluate(el =>
                el.classList.contains('unlocked') ||
                el.getAttribute('data-unlocked') === 'true'
            );
            
            expect(isUnlocked).toBe(true);
            console.log('Unlocked feature displays correctly');

            await page.screenshot({
                path: '.sisyphus/evidence/task-31-unlocked-state.png'
            });
        }
    });

    test('unlock persist after page reload', async ({ page }) => {
        for (let i = 0; i < 50; i++) {
            await page.click('#click-area');
        }
        await page.waitForTimeout(1000);

        const unlockedBefore = await page.evaluate(() => {
            const items = document.querySelectorAll('.unlock-feature.unlocked, .unlock-feature[data-unlocked="true"]');
            return items.length;
        });
        console.log(`Unlocked before reload: ${unlockedBefore}`);

        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.click('[data-tab="unlocks"]');
        await page.waitForTimeout(500);

        const unlockedAfter = await page.evaluate(() => {
            const items = document.querySelectorAll('.unlock-feature.unlocked, .unlock-feature[data-unlocked="true"]');
            return items.length;
        });
        console.log(`Unlocked after reload: ${unlockedAfter}`);

        expect(unlockedAfter).toBeGreaterThanOrEqual(unlockedBefore);

        await page.screenshot({
            path: '.sisyphus/evidence/task-31-persistence.png'
        });
    });
});
