const { test, expect } = require('../fixtures/coverage');

test.describe('AchievementManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('update, render, formatting, and global panel branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.AchievementManager) {
                return { ok: false, reason: 'missing class' };
            }

            const originalWarn = console.warn;
            const warnings = [];
            console.warn = (...args) => warnings.push(args.map(String).join(' '));

            const noGameManager = new window.AchievementManager(null);
            const noGame = noGameManager.update();

            const throwingManager = new window.AchievementManager({
                get_achievements: () => {
                    throw new Error('boom-achievements');
                },
            });
            const throwingResult = throwingManager.update();

            const sampleAchievements = [
                {
                    id: 'click-1',
                    name: '点击新手',
                    description: '完成首次点击',
                    category: 'clicks',
                    unlocked: false,
                    progress: 3,
                    requirement: 10,
                },
                {
                    id: 'resource-1',
                    name: '资源大师',
                    description: '积累资源',
                    category: 'resources',
                    unlocked: true,
                    progress: 100,
                    requirement: 100,
                    unlock_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                },
            ];

            const tempPanel = document.createElement('div');
            tempPanel.id = 'achievement-test-panel';
            document.body.appendChild(tempPanel);

            const renderManager = new window.AchievementManager({
                get_achievements: () => sampleAchievements,
            });
            renderManager.checkNewUnlocks = () => {};
            renderManager.renderAchievements('achievement-test-panel');

            const renderedItems = tempPanel.querySelectorAll('.achievement-item').length;
            const renderedCategories = tempPanel.querySelectorAll('.achievement-category').length;
            const progressText = tempPanel.querySelector('.progress-text')?.textContent || '';
            const unlockedTimeText = tempPanel.querySelector('.achievement-unlocked-time')?.textContent || '';

            renderManager.renderAchievements('missing-achievements-panel');

            const emptyManager = new window.AchievementManager({
                get_achievements: () => [],
            });
            emptyManager.renderAchievements('achievement-test-panel');
            const placeholderText = tempPanel.textContent || '';

            const originalLanguage = window.i18n ? window.i18n.currentLanguage : null;
            if (window.i18n) {
                window.i18n.currentLanguage = 'en';
            }
            const categoryEn = renderManager.getCategoryName('clicks');
            if (window.i18n) {
                window.i18n.currentLanguage = 'zh-CN';
            }
            const categoryZh = renderManager.getCategoryName('resources');
            const unknownCategory = renderManager.getCategoryName('mystery');

            const justNow = renderManager.formatUnlockTime(new Date().toISOString());
            const minutesAgo = renderManager.formatUnlockTime(new Date(Date.now() - 5 * 60 * 1000).toISOString());
            const daysAgo = renderManager.formatUnlockTime(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());
            const invalidTime = renderManager.formatUnlockTime('not-a-date');
            const emptyTime = renderManager.formatUnlockTime('');

            let notifiedId = null;
            renderManager.showNotification = (achievement) => {
                notifiedId = achievement.id;
            };
            renderManager.notifyAchievement('resource-1');
            renderManager.notifyAchievement('missing-id');

            const originalManager = window.achievementManager;
            const originalTab = document.getElementById('tab-achievements');
            const wasActive = originalTab ? originalTab.classList.contains('active') : false;
            let updateCalls = 0;
            let renderCalls = 0;
            let checkCalls = 0;

            window.achievementManager = {
                update: () => {
                    updateCalls += 1;
                    return sampleAchievements;
                },
                renderAchievements: () => {
                    renderCalls += 1;
                },
                checkNewUnlocks: () => {
                    checkCalls += 1;
                },
            };

            if (originalTab) {
                originalTab.classList.remove('active');
            }
            window.updateAchievementsPanel();

            if (originalTab) {
                originalTab.classList.add('active');
            }
            window.updateAchievementsPanel();

            if (originalTab) {
                originalTab.classList.toggle('active', wasActive);
            }
            window.achievementManager = originalManager;

            if (window.i18n && originalLanguage) {
                window.i18n.currentLanguage = originalLanguage;
            }

            tempPanel.remove();
            console.warn = originalWarn;

            return {
                ok: true,
                noGameLength: noGame.length,
                throwingLength: throwingResult.length,
                renderedItems,
                renderedCategories,
                progressText,
                unlockedTimeText,
                placeholderText,
                categoryEn,
                categoryZh,
                unknownCategory,
                justNow,
                minutesAgo,
                daysAgo,
                invalidTime,
                emptyTime,
                notifiedId,
                updateCalls,
                renderCalls,
                checkCalls,
                warnings,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.noGameLength).toBe(0);
        expect(result.throwingLength).toBe(0);
        expect(result.renderedItems).toBe(2);
        expect(result.renderedCategories).toBe(2);
        expect(result.progressText).toContain('3 / 10');
        expect(result.unlockedTimeText.length).toBeGreaterThan(0);
        expect(
            result.placeholderText === 'achievementsPlaceholder'
            || result.placeholderText.includes('暂无成就数据')
            || result.placeholderText.includes('No achievement data available yet')
        ).toBe(true);
        expect(result.categoryEn).toBe('Clicks');
        expect(result.categoryZh).toBe('资源');
        expect(result.unknownCategory).toBe('mystery');
        expect(result.justNow).toBe('刚刚');
        expect(result.minutesAgo).toContain('5');
        expect(result.daysAgo).toContain('2');
        expect(result.invalidTime === '' || result.invalidTime === 'Invalid Date').toBe(true);
        expect(result.emptyTime).toBe('');
        expect(result.notifiedId).toBe('resource-1');
        expect(result.updateCalls).toBe(3);
        expect(result.renderCalls).toBe(1);
        expect(result.checkCalls).toBe(1);
        expect(result.warnings.some((warning) => warning.includes('Achievements container "missing-achievements-panel" not found'))).toBe(true);
    });
});
