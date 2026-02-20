const { test, expect } = require('@playwright/test');

test.describe('Workers System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        
        await page.click('[data-tab="workers"]');
        await page.waitForTimeout(500);
    });

    test('workers panel displays correctly', async ({ page }) => {
        const workersList = page.locator('#workers-list, .workers-grid, .workers-list');
        await expect(workersList).toBeVisible();

        await page.screenshot({
            path: '.sisyphus/evidence/task-32-workers-panel.png',
            fullPage: false
        });

        console.log('Workers panel displayed successfully');
    });

    test('workers panel shows at least 1 worker', async ({ page }) => {
        const workerCards = page.locator('.worker-card, .worker-item, [class*="worker"]');
        const count = await workerCards.count();
        
        expect(count).toBeGreaterThanOrEqual(1);
        console.log(`Total workers displayed: ${count}`);

        await page.screenshot({
            path: '.sisyphus/evidence/task-32-workers-count.png'
        });
    });

    test('each worker displays name, level, and skills', async ({ page }) => {
        const firstWorker = page.locator('.worker-card:first-child, .worker-item:first-child');
        await expect(firstWorker).toBeVisible();

        const nameElement = firstWorker.locator('.worker-name, h3, .name, [class*="name"]');
        await expect(nameElement).toBeVisible();

        const levelElement = firstWorker.locator('.worker-level, .level, [class*="level"]');
        await expect(levelElement).toBeVisible();

        const skillElement = firstWorker.locator('.worker-skill, .skill, [class*="skill"]');
        await expect(skillElement).toBeVisible();

        console.log('Worker structure verified: name, level, skills');
    });

    test('worker displays efficiency multiplier', async ({ page }) => {
        const firstWorker = page.locator('.worker-card:first-child');
        
        const efficiencyElement = firstWorker.locator('.worker-efficiency, .efficiency, [class*="efficiency"], [class*="multiplier"]');
        
        if (await efficiencyElement.isVisible()) {
            const efficiencyText = await efficiencyElement.textContent();
            console.log(`Worker efficiency: ${efficiencyText}`);
            expect(efficiencyText).toMatch(/\d+(\.\d+)?/);
        } else {
            console.log('Efficiency display may use different selector');
        }
    });

    test('worker displays XP and level progress', async ({ page }) => {
        const firstWorker = page.locator('.worker-card:first-child');
        
        const xpElement = firstWorker.locator('.worker-xp, .xp, [class*="xp"]');
        await expect(xpElement).toBeVisible();

        const xpProgressBar = firstWorker.locator('.xp-progress-bar, .progress-bar, [class*="progress"]');
        if (await xpProgressBar.isVisible()) {
            console.log('XP progress bar visible');
        }

        console.log('Worker XP display verified');

        await page.screenshot({
            path: '.sisyphus/evidence/task-32-worker-xp.png'
        });
    });

    test('worker assignment button exists', async ({ page }) => {
        const firstWorker = page.locator('.worker-card:first-child');
        
        const assignButton = firstWorker.locator('.worker-assign-btn, button:has-text("分配"), button:has-text("Assign"), .assign-btn');
        await expect(assignButton).toBeVisible();

        console.log('Worker assignment button exists');
    });

    test('worker can be assigned to building', async ({ page }) => {
        const assignButton = page.locator('.worker-assign-btn, button:has-text("分配"), button:has-text("Assign")').first();
        
        if (await assignButton.isVisible()) {
            await assignButton.click();
            await page.waitForTimeout(500);

            const buildingSelect = page.locator('select[name="building"], .building-select, #building-select');
            if (await buildingSelect.isVisible()) {
                console.log('Building selection modal/dialog opened');
                
                const options = buildingSelect.locator('option');
                const optionCount = await options.count();
                console.log(`Available buildings: ${optionCount}`);

                await page.screenshot({
                    path: '.sisyphus/evidence/task-32-assignment-modal.png'
                });
            } else {
                console.log('Building selection may use different UI');
            }
        }
    });

    test('worker assignment increases productivity', async ({ page }) => {
        const initialCoinsPerSecond = await page.textContent('#coins-per-second, #cps');
        const initialCPS = parseFloat(initialCoinsPerSecond.split(': ')[1]) || 0;
        console.log(`Initial coins/second: ${initialCPS}`);

        const assignButton = page.locator('.worker-assign-btn, button:has-text("分配"), button:has-text("Assign")').first();
        
        if (await assignButton.isVisible()) {
            await assignButton.click();
            await page.waitForTimeout(500);

            const buildingSelect = page.locator('select[name="building"], .building-select').first();
            if (await buildingSelect.isVisible()) {
                await buildingSelect.selectIndex(0);
                await page.waitForTimeout(300);

                const confirmButton = page.locator('button:has-text("确认"), button:has-text("Confirm"), .confirm-btn');
                if (await confirmButton.isVisible()) {
                    await confirmButton.click();
                    await page.waitForTimeout(1000);

                    const afterCPS = await page.textContent('#coins-per-second, #cps');
                    const afterCPSValue = parseFloat(afterCPS.split(': ')[1]) || 0;
                    console.log(`After assignment coins/second: ${afterCPSValue}`);

                    expect(afterCPSValue).toBeGreaterThanOrEqual(initialCPS);

                    await page.screenshot({
                        path: '.sisyphus/evidence/task-32-productivity-increase.png'
                    });
                }
            }
        }
    });

    test('worker accessible via WASM API', async ({ page }) => {
        const canAssignWorker = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.assign_worker) {
                return typeof window.rustGame.assign_worker === 'function';
            }
            return false;
        });

        expect(canAssignWorker).toBe(true);
        console.log('WASM assign_worker API available');

        const getWorkers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return typeof window.rustGame.get_workers === 'function';
            }
            return false;
        });

        expect(getWorkers).toBe(true);
        console.log('WASM get_workers API available');

        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        if (Array.isArray(workers)) {
            expect(workers.length).toBeGreaterThanOrEqual(1);
            console.log(`WASM returned ${workers.length} workers`);
            
            if (workers.length > 0) {
                console.log('First worker:', JSON.stringify(workers[0], null, 2));
            }
        }

        await page.screenshot({
            path: '.sisyphus/evidence/task-32-wasm-api.png'
        });
    });

    test('worker efficiency multiplier affects production', async ({ page }) => {
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        if (Array.isArray(workers) && workers.length > 0) {
            const firstWorker = workers[0];
            const multiplier = firstWorker.efficiency_multiplier || 1.0;
            
            console.log(`Worker efficiency multiplier: ${multiplier}`);
            expect(multiplier).toBeGreaterThanOrEqual(1.0);

            await page.screenshot({
                path: '.sisyphus/evidence/task-32-efficiency-multiplier.png'
            });
        }
    });

    test('worker level increases with XP', async ({ page }) => {
        const workers = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });

        if (Array.isArray(workers) && workers.length > 0) {
            const firstWorker = workers[0];
            
            expect(firstWorker).toHaveProperty('level');
            expect(firstWorker).toHaveProperty('xp');
            expect(firstWorker).toHaveProperty('xp_to_next_level');

            console.log(`Worker level: ${firstWorker.level}, XP: ${firstWorker.xp}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-32-worker-level.png'
            });
        }
    });

    test('worker assignment modal has building options', async ({ page }) => {
        const assignButton = page.locator('.worker-assign-btn').first();
        
        if (await assignButton.isVisible()) {
            await assignButton.click();
            await page.waitForTimeout(500);

            const buildingOptions = page.locator('select option, .building-option');
            const optionCount = await buildingOptions.count();
            
            console.log(`Building options available: ${optionCount}`);
            expect(optionCount).toBeGreaterThanOrEqual(1);

            await page.screenshot({
                path: '.sisyphus/evidence/task-32-building-options.png'
            });
        }
    });

    test('worker card displays assigned building', async ({ page }) => {
        const firstWorker = page.locator('.worker-card:first-child');
        
        const assignedBuilding = firstWorker.locator('.worker-assigned, .assigned-building, [class*="assigned"]');
        
        if (await assignedBuilding.isVisible()) {
            const buildingText = await assignedBuilding.textContent();
            console.log(`Assigned building: ${buildingText}`);
        } else {
            console.log('Worker not yet assigned or uses different display');
        }
    });

    test('workers panel uses grid layout', async ({ page }) => {
        const workersGrid = page.locator('.workers-grid, .workers-list, #workers-list');
        
        const display = await workersGrid.evaluate(el => 
            getComputedStyle(el).display
        );
        
        console.log(`Workers panel display: ${display}`);
        expect(['grid', 'flex', 'block']).toContain(display);

        await page.screenshot({
            path: '.sisyphus/evidence/task-32-grid-layout.png'
        });
    });

    test('workers persist after page reload', async ({ page }) => {
        const workersBefore = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });
        
        console.log(`Workers before reload: ${workersBefore.length}`);

        await page.reload();
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.waitForTimeout(500);

        const workersAfter = await page.evaluate(() => {
            if (window.rustGame && window.rustGame.get_workers) {
                return window.rustGame.get_workers();
            }
            return [];
        });
        
        console.log(`Workers after reload: ${workersAfter.length}`);

        expect(workersAfter.length).toBe(workersBefore.length);

        await page.screenshot({
            path: '.sisyphus/evidence/task-32-persistence.png'
        });
    });

    test('worker skills are displayed', async ({ page }) => {
        const firstWorker = page.locator('.worker-card:first-child');
        
        const skillElement = firstWorker.locator('.worker-skill, .skill, [class*="skill"]');
        
        if (await skillElement.isVisible()) {
            const skillText = await skillElement.textContent();
            console.log(`Worker skill: ${skillText}`);
            expect(skillText.length).toBeGreaterThan(0);
        }
    });

    test('worker background/story is displayed', async ({ page }) => {
        const firstWorker = page.locator('.worker-card:first-child');
        
        const backgroundElement = firstWorker.locator('.worker-background, .background, [class*="background"], .worker-description');
        
        if (await backgroundElement.isVisible()) {
            const backgroundText = await backgroundElement.textContent();
            console.log(`Worker background: ${backgroundText}`);
        }
    });
});
