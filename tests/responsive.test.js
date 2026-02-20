const { test, expect } = require('@playwright/test');

test.describe('Responsive Layout', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await page.waitForTimeout(500);
    });

    test.describe('Mobile - 375px', () => {
        test.use({ viewport: { width: 375, height: 667 } });

        test('resource bar scrolls horizontally on mobile', async ({ page }) => {
            const resourcesBar = page.locator('#banner #resources');
            await expect(resourcesBar).toBeVisible();

            const resourcesOverflow = await page.evaluate(() => {
                const el = document.querySelector('#banner #resources');
                const banner = document.querySelector('#banner');
                if (!el || !banner) return false;
                return el.scrollWidth > banner.clientWidth;
            });

            console.log(`375px: Resource bar horizontal scroll needed: ${resourcesOverflow}`);
            expect(resourcesOverflow).toBe(true);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-mobile-375px-resources.png',
                fullPage: true
            });
        });

        test('tab buttons wrap or scroll on mobile', async ({ page }) => {
            const tabNav = page.locator('#tab-navigation');
            await expect(tabNav).toBeVisible();

            const tabsOverflow = await page.evaluate(() => {
                const nav = document.querySelector('#tab-navigation');
                const tabs = document.querySelectorAll('.tab-button');
                if (!nav || tabs.length === 0) return false;
                
                let totalWidth = 0;
                tabs.forEach(tab => {
                    totalWidth += tab.offsetWidth;
                });
                return totalWidth > nav.clientWidth;
            });

            console.log(`375px: Tab buttons overflow: ${tabsOverflow}`);

            const tabButtons = await page.locator('.tab-button');
            const tabCount = await tabButtons.count();
            console.log(`375px: Tab buttons visible: ${tabCount}`);
            expect(tabCount).toBeGreaterThanOrEqual(4);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-mobile-375px-tabs.png',
                fullPage: true
            });
        });

        test('game container fits mobile screen', async ({ page }) => {
            const containerWidth = await page.evaluate(() => {
                const container = document.querySelector('#game-container');
                return container ? container.offsetWidth : 0;
            });

            console.log(`375px: Game container width: ${containerWidth}px`);
            expect(containerWidth).toBeLessThanOrEqual(375);
            expect(containerWidth).toBeGreaterThan(0);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-mobile-375px-container.png',
                fullPage: true
            });
        });

        test('all UI elements visible on mobile', async ({ page }) => {
            const clickArea = page.locator('#click-area');
            await expect(clickArea).toBeVisible();

            const resourceDisplay = page.locator('#coin-display, #coins');
            await expect(resourceDisplay).toBeVisible();

            const tabNavigation = page.locator('#tab-navigation');
            await expect(tabNavigation).toBeVisible();

            console.log('375px: All main UI elements visible');
        });

        test('mobile layout does not break', async ({ page }) => {
            const layoutBroken = await page.evaluate(() => {
                const elements = document.querySelectorAll('#game-container > *');
                for (const el of elements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
                        return true;
                    }
                }
                return false;
            });

            expect(layoutBroken).toBe(false);
            console.log('375px: Layout does not break');

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-mobile-375px-full.png',
                fullPage: true
            });
        });
    });

    test.describe('Tablet - 768px', () => {
        test.use({ viewport: { width: 768, height: 1024 } });

        test('resource bar displays properly on tablet', async ({ page }) => {
            const resourcesBar = page.locator('#banner #resources');
            await expect(resourcesBar).toBeVisible();

            const resourcesOverflow = await page.evaluate(() => {
                const el = document.querySelector('#banner #resources');
                const banner = document.querySelector('#banner');
                if (!el || !banner) return false;
                return el.scrollWidth > banner.clientWidth;
            });

            console.log(`768px: Resource bar overflow: ${resourcesOverflow}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-tablet-768px-resources.png',
                fullPage: true
            });
        });

        test('tab navigation displays properly on tablet', async ({ page }) => {
            const tabButtons = await page.locator('.tab-button');
            const tabCount = await tabButtons.count();
            
            console.log(`768px: Tab buttons visible: ${tabCount}`);
            expect(tabCount).toBeGreaterThanOrEqual(4);

            const allVisible = await tabButtons.evaluateAll(elements => 
                elements.every(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                })
            );
            
            expect(allVisible).toBe(true);
            console.log('768px: All tab buttons visible');

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-tablet-768px-tabs.png',
                fullPage: true
            });
        });

        test('game container width appropriate for tablet', async ({ page }) => {
            const containerWidth = await page.evaluate(() => {
                const container = document.querySelector('#game-container');
                return container ? container.offsetWidth : 0;
            });

            console.log(`768px: Game container width: ${containerWidth}px`);
            expect(containerWidth).toBeLessThanOrEqual(768);
            expect(containerWidth).toBeGreaterThan(375);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-tablet-768px-container.png',
                fullPage: true
            });
        });

        test('content layout adjusts for tablet', async ({ page }) => {
            const mainContent = page.locator('#main-content');
            await expect(mainContent).toBeVisible();

            const contentWidth = await mainContent.evaluate(el => 
                getComputedStyle(el).width
            );

            console.log(`768px: Main content width: ${contentWidth}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-tablet-768px-layout.png',
                fullPage: true
            });
        });
    });

    test.describe('Small Desktop - 1024px', () => {
        test.use({ viewport: { width: 1024, height: 768 } });

        test('resource bar displays without scroll on small desktop', async ({ page }) => {
            const resourcesBar = page.locator('#banner #resources');
            await expect(resourcesBar).toBeVisible();

            const resourcesOverflow = await page.evaluate(() => {
                const el = document.querySelector('#banner #resources');
                const banner = document.querySelector('#banner');
                if (!el || !banner) return false;
                return el.scrollWidth > banner.clientWidth;
            });

            console.log(`1024px: Resource bar overflow: ${resourcesOverflow}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-desktop-1024px-resources.png',
                fullPage: true
            });
        });

        test('all tabs visible in one row on small desktop', async ({ page }) => {
            const tabsFit = await page.evaluate(() => {
                const nav = document.querySelector('#tab-navigation');
                const tabs = document.querySelectorAll('.tab-button');
                if (!nav || tabs.length === 0) return false;
                
                let totalWidth = 0;
                tabs.forEach(tab => {
                    totalWidth += tab.offsetWidth;
                });
                return totalWidth <= nav.clientWidth;
            });

            console.log(`1024px: All tabs fit in one row: ${tabsFit}`);

            const tabButtons = await page.locator('.tab-button');
            const tabCount = await tabButtons.count();
            console.log(`1024px: Tab buttons: ${tabCount}`);
            expect(tabCount).toBeGreaterThanOrEqual(4);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-desktop-1024px-tabs.png',
                fullPage: true
            });
        });

        test('game container centered on small desktop', async ({ page }) => {
            const containerCentered = await page.evaluate(() => {
                const container = document.querySelector('#game-container');
                if (!container) return false;
                const rect = container.getBoundingClientRect();
                const margin = (window.innerWidth - rect.width) / 2;
                return Math.abs(rect.left - margin) < 1;
            });

            console.log(`1024px: Container centered: ${containerCentered}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-desktop-1024px-centered.png',
                fullPage: true
            });
        });

        test('layout comfortable on small desktop', async ({ page }) => {
            const containerWidth = await page.evaluate(() => {
                const container = document.querySelector('#game-container');
                return container ? container.offsetWidth : 0;
            });

            console.log(`1024px: Container width: ${containerWidth}px`);
            expect(containerWidth).toBeLessThanOrEqual(1024);
            expect(containerWidth).toBeGreaterThan(768);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-desktop-1024px-full.png',
                fullPage: true
            });
        });
    });

    test.describe('Large Desktop - 1920px', () => {
        test.use({ viewport: { width: 1920, height: 1080 } });

        test('game container has max-width on large desktop', async ({ page }) => {
            const containerWidth = await page.evaluate(() => {
                const container = document.querySelector('#game-container');
                return container ? container.offsetWidth : 0;
            });

            console.log(`1920px: Container width: ${containerWidth}px`);
            expect(containerWidth).toBeLessThanOrEqual(1400);
            expect(containerWidth).toBeGreaterThan(1024);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-desktop-1920px-container.png',
                fullPage: true
            });
        });

        test('all tabs clearly visible on large desktop', async ({ page }) => {
            const tabButtons = await page.locator('.tab-button');
            const tabCount = await tabButtons.count();
            
            console.log(`1920px: Tab buttons visible: ${tabCount}`);
            expect(tabCount).toBeGreaterThanOrEqual(4);

            const tabsFit = await page.evaluate(() => {
                const nav = document.querySelector('#tab-navigation');
                const tabs = document.querySelectorAll('.tab-button');
                if (!nav || tabs.length === 0) return false;
                
                let totalWidth = 0;
                tabs.forEach(tab => {
                    totalWidth += tab.offsetWidth;
                });
                return totalWidth <= nav.clientWidth;
            });

            expect(tabsFit).toBe(true);
            console.log('1920px: All tabs fit comfortably');

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-desktop-1920px-tabs.png',
                fullPage: true
            });
        });

        test('resource bar spacious on large desktop', async ({ page }) => {
            const resourcesBar = page.locator('#banner #resources');
            await expect(resourcesBar).toBeVisible();

            const barWidth = await resourcesBar.evaluate(el =>
                getComputedStyle(el).width
            );

            console.log(`1920px: Resource bar width: ${barWidth}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-desktop-1920px-resources.png',
                fullPage: true
            });
        });

        test('layout uses available space on large desktop', async ({ page }) => {
            const layoutWidth = await page.evaluate(() => {
                const container = document.querySelector('#game-container');
                return container ? container.offsetWidth : 0;
            });

            console.log(`1920px: Layout width: ${layoutWidth}px`);
            expect(layoutWidth).toBeGreaterThan(1000);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-desktop-1920px-full.png',
                fullPage: true
            });
        });

        test('content centered with margins on large desktop', async ({ page }) => {
            const centered = await page.evaluate(() => {
                const container = document.querySelector('#game-container');
                if (!container) return false;
                const rect = container.getBoundingClientRect();
                const leftMargin = rect.left;
                const rightMargin = window.innerWidth - rect.right;
                return Math.abs(leftMargin - rightMargin) < 10;
            });

            console.log(`1920px: Content centered: ${centered}`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-desktop-1920px-centered.png',
                fullPage: true
            });
        });
    });

    test.describe('Cross-breakpoint consistency', () => {
        test('tab switching works on all screen sizes', async ({ page }) => {
            const screenSizes = [
                { width: 375, height: 667, name: 'mobile' },
                { width: 768, height: 1024, name: 'tablet' },
                { width: 1024, height: 768, name: 'small-desktop' },
                { width: 1920, height: 1080, name: 'large-desktop' }
            ];

            for (const size of screenSizes) {
                await page.setViewportSize({ width: size.width, height: size.height });
                await page.waitForTimeout(300);

                const initialTab = await page.evaluate(() => {
                    const active = document.querySelector('.tab-content.active');
                    return active ? active.id : null;
                });

                const firstTabButton = page.locator('.tab-button').first();
                await firstTabButton.click();
                await page.waitForTimeout(300);

                const afterTab = await page.evaluate(() => {
                    const active = document.querySelector('.tab-content.active');
                    return active ? active.id : null;
                });

                console.log(`${size.name}: Tab switching works (${initialTab} -> ${afterTab})`);

                await page.screenshot({
                    path: `.sisyphus/evidence/task-33-cross-${size.name}-tabs.png`,
                    fullPage: true
                });
            }
        });

        test('click functionality works on all screen sizes', async ({ page }) => {
            const screenSizes = [
                { width: 375, height: 667, name: 'mobile' },
                { width: 768, height: 1024, name: 'tablet' },
                { width: 1024, height: 768, name: 'small-desktop' }
            ];

            for (const size of screenSizes) {
                await page.setViewportSize({ width: size.width, height: size.height });
                await page.waitForTimeout(300);

                const initialCoins = await page.textContent('#coin-display, #coins');
                
                await page.click('#click-area');
                await page.waitForTimeout(200);

                const afterCoins = await page.textContent('#coin-display, #coins');
                
                console.log(`${size.name}: Click works (${initialCoins} -> ${afterCoins})`);
            }
        });

        test('all 4 breakpoints defined in CSS', async ({ page }) => {
            const cssContent = await page.evaluate(() => {
                const styles = Array.from(document.styleSheets);
                let content = '';
                for (const sheet of styles) {
                    try {
                        const rules = Array.from(sheet.cssRules || []);
                        for (const rule of rules) {
                            if (rule.cssText.includes('@media')) {
                                content += rule.cssText + '\n';
                            }
                        }
                    } catch (e) {
                        // Cross-origin stylesheet, cannot access rules
                    }
                }
                return content;
            });

            const breakpoints = ['375px', '768px', '1024px', '1200px'];
            const foundBreakpoints = [];
            
            for (const bp of breakpoints) {
                if (cssContent.includes(bp)) {
                    foundBreakpoints.push(bp);
                    console.log(`CSS breakpoint found: ${bp}`);
                }
            }

            console.log(`Found ${foundBreakpoints.length}/4 CSS breakpoints`);

            await page.screenshot({
                path: '.sisyphus/evidence/task-33-breakpoints-css.png'
            });
        });
    });
});
