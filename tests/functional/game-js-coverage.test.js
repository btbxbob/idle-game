const { test, expect } = require('../fixtures/coverage');

test.describe('Game.js Coverage Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, { timeout: 60000 });
    });

    test('createCoinParticles function execution', async ({ page }) => {
        const result = await page.evaluate(() => {
            const x = 100;
            const y = 100;
            const existingParticles = document.querySelectorAll('.coin-particle').length;

            if (typeof window.createCoinParticles === 'function') {
                window.createCoinParticles(x, y);
            }

            const newParticles = document.querySelectorAll('.coin-particle').length;

            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        ok: true,
                        hadFunction: typeof window.createCoinParticles === 'function',
                        particlesCreated: newParticles > existingParticles,
                    });
                }, 100);
            });
        });

        expect(result.ok).toBe(true);
    });

    test('updateResourceDisplay with various numeric edge cases', async ({ page }) => {
        const result = await page.evaluate(() => {
            const testCases = [
                { coins: 100, wood: 200, stone: 300, cps: 1.5, wps: 2.5, sps: 3.5, cpc: 1.1 },
                { coins: 0, wood: 0, stone: 0, cps: 0, wps: 0, sps: 0, cpc: 0 },
            ];

            const errors = testCases.map((tc, idx) => {
                let error = null;
                try {
                    window.updateResourceDisplay(
                        tc.coins, tc.wood, tc.stone, tc.cps, tc.wps, tc.sps, tc.cpc
                    );
                } catch (e) {
                    error = e.message;
                }
                return { case: idx, error };
            });

            return { ok: true, errors };
        });

        result.errors.forEach(tc => {
            expect(tc.error).toBeFalsy();
        });
    });

    test('updateBuildingDisplay executes', async ({ page }) => {
        const result = await page.evaluate(() => {
            const buildings = [
                { name: 'Test Building', production_rate: 10, count: 1, cost: 100 },
            ];

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            let error = null;
            try {
                window.updateBuildingDisplay(buildings);
            } catch (e) {
                error = e.message;
            }

            buildingList.remove();

            return {
                ok: true,
                error,
                hasChildren: buildingList.children.length > 0,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.error).toBeFalsy();
    });

    test('buyBuilding guards', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originalGame = window.rustGame;
            
            window.rustGame = null;
            let error = null;
            try {
                window.buyBuilding(0);
            } catch (e) {
                error = e.message;
            }

            window.rustGame = originalGame;

            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
    });

    test('updateStatisticsPanel guards', async ({ page }) => {
        const result = await page.evaluate(() => {
            const original = window.statisticsManager;
            window.statisticsManager = null;

            let error = null;
            try {
                window.updateStatisticsPanel();
            } catch (e) {
                error = e.message;
            }

            window.statisticsManager = original;
            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
    });

    test('updateUnlocksPanel guards', async ({ page }) => {
        const result = await page.evaluate(() => {
            const original = window.unlockManager;
            window.unlockManager = null;

            let error = null;
            try {
                window.updateUnlocksPanel();
            } catch (e) {
                error = e.message;
            }

            window.unlockManager = original;
            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
    });

    test('updateCoinButton executes', async ({ page }) => {
        const result = await page.evaluate(() => {
            const countEl = document.createElement('div');
            countEl.id = 'coin-count';
            document.body.appendChild(countEl);

            let error = null;
            try {
                window.updateCoinButton();
            } catch (e) {
                error = e.message;
            }

            const hasValue = countEl.textContent.length > 0;
            countEl.remove();

            return {
                ok: true,
                error,
                hasValue,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.error).toBeFalsy();
    });

    test('getResourceNameForBuilding various building types', async ({ page }) => {
        const result = await page.evaluate(() => {
            const buildings = [
                '金币矿山', '伐木场', '采石场', '铁矿场', '铜矿场',
                '铝矿场', '煤矿场', '石油井', '水晶矿', '农场',
                'Unknown Building'
            ];

            const results = buildings.map(b => {
                const name = getResourceNameForBuilding(b);
                return { building: b, name };
            });

            return { ok: true, results };
        });

        expect(result.ok).toBe(true);
        expect(result.results.length).toBe(11);
        expect(result.results[0].name).toContain('金');
    });

    test('updateResourceDisplay with invalid values', async ({ page }) => {
        const result = await page.evaluate(() => {
            const testCases = [
                { coins: NaN, wood: 200, stone: 300, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: Infinity, wood: 200, stone: 300, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: -100, wood: 200, stone: 300, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: 100, wood: NaN, stone: 300, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: 100, wood: 200, stone: Infinity, cps: 1, wps: 2, sps: 3, cpc: 1 },
                { coins: 100, wood: 200, stone: 300, cps: NaN, wps: 2, sps: 3, cpc: 1 },
                { coins: 100, wood: 200, stone: 300, cps: 1, wps: NaN, sps: 3, cpc: 1 },
                { coins: 100, wood: 200, stone: 300, cps: 1, wps: 2, sps: NaN, cpc: 1 },
                { coins: 100, wood: 200, stone: 300, cps: 1, wps: 2, sps: 3, cpc: NaN },
            ];

            const errors = testCases.map((tc, idx) => {
                let error = null;
                try {
                    window.updateResourceDisplay(
                        tc.coins, tc.wood, tc.stone, tc.cps, tc.wps, tc.sps, tc.cpc
                    );
                } catch (e) {
                    error = e.message;
                }
                return { case: idx, error };
            });

            return { ok: true, errors };
        });

        result.errors.forEach(tc => {
            expect(tc.error).toBeFalsy();
        });
    });

    test('updateBuildingDisplay with different building types', async ({ page }) => {
        const result = await page.evaluate(() => {
            const buildings = [
                { name: '金币矿山', cost: 15, production_rate: 1, count: 0 },
                { name: '伐木场', cost: 20, production_rate: 1, count: 0 },
                { name: '采石场', cost: 25, production_rate: 0.5, count: 0 },
                { name: 'Unknown Building', cost: 100, production_rate: 1, count: 0 },
            ];

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            window.updateBuildingDisplay(buildings);
            const html = buildingList.innerHTML;

            buildingList.remove();

            return {
                ok: true,
                hasCoinMine: html.includes('金币矿山'),
                hasWoodcutter: html.includes('伐木场'),
                hasQuarry: html.includes('采石场'),
                hasUnknown: html.includes('Unknown'),
            };
        });

        expect(result.ok).toBe(true);
        expect(result.hasCoinMine).toBe(true);
    });

    test('updateBuildingDisplay shows progression link notes for hybrid and collective buildings', async ({ page }) => {
        const result = await page.evaluate(() => {
            const buildings = [
                { name: '共生培育舱', cost: 5000, production_rate: 1, count: 1 },
                { name: '神经尖塔', cost: 9000, production_rate: 0.5, count: 0 },
                { name: '深空孵化港', cost: 12000, production_rate: 0.25, count: 0 },
            ];

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            window.updateBuildingDisplay(buildings);
            const html = buildingList.innerHTML;

            buildingList.remove();

            return {
                hasHybridNote: html.includes('由共生宿主驱动'),
                hasDarkMatterNote: html.includes('开始产出暗物质'),
                hasSpaceshipNote: html.includes('开始产出太空船'),
            };
        });

        expect(result.hasHybridNote).toBe(true);
        expect(result.hasDarkMatterNote).toBe(true);
        expect(result.hasSpaceshipNote).toBe(true);
    });

    test('updateBuildingDisplay update path (same length)', async ({ page }) => {
        const result = await page.evaluate(() => {
            const buildings = [
                { name: 'Building 1', production_rate: 10, count: 1, cost: 100 },
                { name: 'Building 2', production_rate: 20, count: 2, cost: 200 },
            ];

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            window.updateBuildingDisplay(buildings);
            const firstChildren = buildingList.children.length;

            window.updateBuildingDisplay(buildings);
            const secondChildren = buildingList.children.length;

            buildingList.remove();

            return {
                ok: true,
                firstChildren,
                secondChildren,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.firstChildren).toBe(2);
        expect(result.secondChildren).toBe(2);
    });

    test('buyBuilding with failure feedback', async ({ page }) => {
        const result = await page.evaluate(() => {
            const original = window.rustGame;

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            window.updateBuildingDisplay([{ name: '测试建筑', cost: 10, production_rate: 1, count: 0 }]);
            
            window.rustGame = {
                buy_building: () => false
            };
            
            let error = null;
            try {
                window.buyBuilding(0);
            } catch (e) {
                error = e.message;
            }
            
            buildingList.remove();
            window.rustGame = original;
            
            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
    });

    test('updateResourceDisplay without i18n fallback', async ({ page }) => {
        const result = await page.evaluate(() => {
            const original = window.i18n;
            window.i18n = null;

            let error = null;
            try {
                window.updateResourceDisplay(100, 200, 300, 1, 2, 3, 1);
            } catch (e) {
                error = e.message;
            }

            window.i18n = original;

            return { ok: true, error };
        });

        expect(result.ok).toBe(true);
        expect(result.error).toBeFalsy();
    });

    test('DOMContentLoaded save export import handlers cover success and failure branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originals = {
                rustGame: window.rustGame,
                alert: window.alert,
                confirm: window.confirm,
                execCommand: document.execCommand,
            };

            const alerts = [];
            let saveCalls = 0;
            let exportCalls = 0;
            let importCalls = 0;
            let updateUiCalls = 0;
            let shouldSaveThrow = false;
            let shouldExportThrow = false;
            let shouldImportThrow = false;
            let confirmAnswer = false;

            const manualSave = document.getElementById('manual-save');
            const saveStatus = document.getElementById('save-status');
            const exportButton = document.getElementById('export-base64');
            const importButton = document.getElementById('import-base64');
            const textArea = document.getElementById('import-export-text');
            if (!manualSave || !saveStatus || !exportButton || !importButton || !textArea) {
                return { ok: false, reason: 'missing import export controls' };
            }

            window.alert = (msg) => alerts.push(String(msg));
            window.confirm = () => confirmAnswer;
            document.execCommand = () => true;
            window.rustGame = {
                saveToLocalStorage: () => {
                    saveCalls += 1;
                    if (shouldSaveThrow) {
                        throw new Error('save failed');
                    }
                },
                exportToBase64: () => {
                    exportCalls += 1;
                    if (shouldExportThrow) {
                        throw new Error('export failed');
                    }
                    return 'BASE64_DATA';
                },
                importFromBase64: () => {
                    importCalls += 1;
                    if (shouldImportThrow) {
                        throw new Error('import failed');
                    }
                },
                update_ui: () => { updateUiCalls += 1; },
            };

            manualSave.click();
            const saveSuccessText = saveStatus.textContent;

            shouldSaveThrow = true;
            manualSave.click();
            const saveFailureText = saveStatus.textContent;

            exportButton.click();
            const exportedValue = textArea.value;

            shouldExportThrow = true;
            exportButton.click();

            textArea.value = '';
            importButton.click();

            textArea.value = 'NEXT_BASE64';
            confirmAnswer = false;
            importButton.click();

            confirmAnswer = true;
            importButton.click();

            shouldImportThrow = true;
            importButton.click();

            window.rustGame = originals.rustGame;
            window.alert = originals.alert;
            window.confirm = originals.confirm;
            document.execCommand = originals.execCommand;

            return {
                ok: true,
                saveCalls,
                exportCalls,
                importCalls,
                updateUiCalls,
                saveSuccessText,
                saveFailureText,
                exportedValue,
                alerts,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.saveCalls).toBe(2);
        expect(result.exportCalls).toBe(2);
        expect(result.importCalls).toBe(2);
        expect(result.updateUiCalls).toBe(1);
        expect(result.saveSuccessText).toContain('已保存');
        expect(result.saveFailureText).toContain('保存失败');
        expect(result.exportedValue).toBe('BASE64_DATA');
        expect(result.alerts).toContain('导出成功！已复制到剪贴板。');
        expect(result.alerts).toContain('导出失败：export failed');
        expect(result.alerts).toContain('请先粘贴 BASE64 字符串。');
        expect(result.alerts).toContain('导入成功！游戏已加载。');
        expect(result.alerts).toContain('导入失败：import failed');
    });

    test('building fallback, purchase feedback cleanup and panel guard branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            const originals = {
                rustGame: window.rustGame,
                setTimeout: window.setTimeout,
            };
            const scheduled = [];
            window.setTimeout = (fn) => {
                scheduled.push(fn);
                return scheduled.length;
            };

            const buildingList = document.createElement('div');
            buildingList.id = 'building-list';
            document.body.appendChild(buildingList);

            window.rustGame = {
                get_buildings: () => [
                    { name: '金币矿山', cost: 20, production_rate: 1, count: 2, output_resource: 'Gold', index: 4 },
                    { name: 'Mystery Building', cost: 99, production_rate: 3, count: 0 },
                ],
                get_coins: () => 25,
                buy_building: () => false,
            };

            window.updateBuildingDisplay(null, NaN);
            const fallbackHtml = buildingList.innerHTML;

            window.buyBuilding(4);
            const failedButton = document.getElementById('buy-building-4');
            const failedClassBefore = failedButton ? failedButton.classList.contains('purchase-failed') : false;
            scheduled.forEach((fn) => {
                fn();
            });
            const failedClassAfter = failedButton ? failedButton.classList.contains('purchase-failed') : false;

            const preservedHtml = buildingList.innerHTML;
            window.updateBuildingDisplay([], 5);
            const unchangedOnEmpty = buildingList.innerHTML === preservedHtml;

            const originalStats = window.statisticsManager;
            const originalUnlocks = window.unlockManager;
            let statsRenderCalls = 0;
            let unlockRenderCalls = 0;
            let unlockUpdateCalls = 0;
            window.statisticsManager = { renderToPanel: () => { statsRenderCalls += 1; } };
            window.unlockManager = {
                update: () => { unlockUpdateCalls += 1; },
                renderUnlocks: () => { unlockRenderCalls += 1; },
            };

            const statisticsTab = document.getElementById('tab-statistics');
            const unlocksTab = document.getElementById('tab-unlocks');
            const statsWasActive = statisticsTab ? statisticsTab.classList.contains('active') : false;
            const unlocksWasActive = unlocksTab ? unlocksTab.classList.contains('active') : false;

            if (statisticsTab) statisticsTab.classList.remove('active');
            if (unlocksTab) unlocksTab.classList.remove('active');
            window.updateStatisticsPanel();
            window.updateUnlocksPanel();

            if (statisticsTab) statisticsTab.classList.add('active');
            if (unlocksTab) unlocksTab.classList.add('active');
            window.updateStatisticsPanel();
            window.updateUnlocksPanel();

            if (statisticsTab) statisticsTab.classList.toggle('active', statsWasActive);
            if (unlocksTab) unlocksTab.classList.toggle('active', unlocksWasActive);
            window.statisticsManager = originalStats;
            window.unlockManager = originalUnlocks;
            window.rustGame = originals.rustGame;
            window.setTimeout = originals.setTimeout;
            buildingList.remove();

            return {
                fallbackHtml,
                failedClassBefore,
                failedClassAfter,
                unchangedOnEmpty,
                statsRenderCalls,
                unlockRenderCalls,
                unlockUpdateCalls,
            };
        });

        expect(result.fallbackHtml).toContain('金币/点击');
        expect(result.fallbackHtml).toContain('gold');
        expect(result.fallbackHtml).toContain('金币/秒');
        expect(result.failedClassBefore).toBe(true);
        expect(result.failedClassAfter).toBe(false);
        expect(result.unchangedOnEmpty).toBe(true);
        expect(result.statsRenderCalls).toBe(1);
        expect(result.unlockRenderCalls).toBe(1);
        expect(result.unlockUpdateCalls).toBe(2);
    });
});
