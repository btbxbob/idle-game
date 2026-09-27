const { test, expect } = require('../fixtures/coverage');
const { unlockAdvancedIndustry } = require('../fixtures/stage-helpers');

const toFiniteNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const PERF_BUDGET_TICK_MS = toFiniteNumber(process.env.PERF_BUDGET_TICK_MS, 8);
const PERF_BUDGET_RENDER_MS = toFiniteNumber(process.env.PERF_BUDGET_RENDER_MS, 30);
const PERF_BUDGET_MIN_FPS = toFiniteNumber(process.env.PERF_BUDGET_MIN_FPS, 30);
const PERF_BUDGET_MAX_LONG_TASKS = toFiniteNumber(process.env.PERF_BUDGET_MAX_LONG_TASKS, 5);
const PERF_BUDGET_MAX_HEAP_GROWTH_MB = toFiniteNumber(process.env.PERF_BUDGET_MAX_HEAP_GROWTH_MB, 25);
const PERF_BUDGET_STARTUP_MS = toFiniteNumber(process.env.PERF_BUDGET_STARTUP_MS, 8000);
const PERF_STARTUP_RUNS = toFiniteNumber(process.env.PERF_STARTUP_RUNS, 3);
const PERF_BUDGET_TAB_MS = toFiniteNumber(process.env.PERF_BUDGET_TAB_MS, 200);
const PERF_TAB_ITERATIONS = toFiniteNumber(process.env.PERF_TAB_ITERATIONS, 3);

const percentile95 = (values) => {
    if (!Array.isArray(values) || values.length === 0) {
        return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
    return sorted[index];
};

const average = (values) => {
    if (!Array.isArray(values) || values.length === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
};

test.describe('Performance Budget - 性能预算', () => {
    test.setTimeout(120000);

    test('hot path p95 stays within budget', async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
        await page.waitForTimeout(500);

        const stats = await page.evaluate((iters) => {
            const sample = (fn, n) => {
                const deltas = [];
                for (let i = 0; i < n; i++) {
                    const start = performance.now();
                    fn();
                    deltas.push(performance.now() - start);
                }
                return deltas;
            };
            const safe = (fn) => (typeof fn === 'function' ? fn : () => {});
            const game = window.rustGame;
            const gameLoop = () => {
                if (game && typeof game.game_loop === 'function') {
                    game.game_loop();
                }
            };
            const updateResourcePanel = safe(window.updateResourcePanel);
            const updateBuildingDisplay = safe(window.updateBuildingDisplay);

            const tick = sample(gameLoop, iters.tick);
            const renderResource = sample(() => updateResourcePanel(), iters.render);
            const renderBuildings = sample(() => updateBuildingDisplay(), iters.render);

            let workers = 0;
            try {
                if (window.rustGame && typeof window.rustGame.get_workers === 'function') {
                    const list = window.rustGame.get_workers();
                    workers = Array.isArray(list) ? list.length : 0;
                }
            } catch (_err) {
                workers = 0;
            }

            return { tick, renderResource, renderBuildings, workers };
        }, { tick: 100, render: 20 });

        const tickP95 = percentile95(stats.tick);
        const tickAvg = average(stats.tick);
        const renderResourceP95 = percentile95(stats.renderResource);
        const renderResourceAvg = average(stats.renderResource);
        const renderBuildingsP95 = percentile95(stats.renderBuildings);
        const renderBuildingsAvg = average(stats.renderBuildings);

        console.log(`工人数：${stats.workers}`);
        console.log(`tick p95=${tickP95.toFixed(2)}ms avg=${tickAvg.toFixed(2)}ms`);
        console.log(`renderResource p95=${renderResourceP95.toFixed(2)}ms avg=${renderResourceAvg.toFixed(2)}ms`);
        console.log(`renderBuildings p95=${renderBuildingsP95.toFixed(2)}ms avg=${renderBuildingsAvg.toFixed(2)}ms`);

        expect(tickP95).toBeLessThan(PERF_BUDGET_TICK_MS);
        expect(renderResourceP95).toBeLessThan(PERF_BUDGET_RENDER_MS);
        expect(renderBuildingsP95).toBeLessThan(PERF_BUDGET_RENDER_MS);
    });

    test('idle stays smooth and heap stays stable', async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });

        await page.evaluate(() => {
            window.__perfBudgetLongTasks = [];
            try {
                if (typeof PerformanceObserver === 'function') {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            window.__perfBudgetLongTasks.push(entry.duration);
                        }
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                }
            } catch (_err) {
                window.__perfBudgetLongTasks = [];
            }
        });

        const fpsResult = await page.evaluate(() => new Promise((resolve) => {
            const gaps = [];
            const duration = 3000;
            let last = performance.now();
            const start = last;
            const onFrame = (now) => {
                gaps.push(now - last);
                last = now;
                if (now - start >= duration) {
                    resolve({ gaps });
                    return;
                }
                requestAnimationFrame(onFrame);
            };
            requestAnimationFrame(onFrame);
        }));

        const gaps = fpsResult.gaps || [];
        const avgGap = average(gaps);
        const avgFps = avgGap > 0 ? 1000 / avgGap : 0;
        const longestFrameMs = gaps.length > 0 ? Math.max(...gaps) : 0;
        const longFrameCount = gaps.filter((gap) => gap > 50).length;

        const longTasks = await page.evaluate(() => window.__perfBudgetLongTasks || []);
        const longTaskCount = longTasks.length;

        console.log(`平均 FPS=${avgFps.toFixed(2)} 最长帧=${longestFrameMs.toFixed(2)}ms >50ms 帧数=${longFrameCount}`);
        console.log(`长任务数=${longTaskCount}`);

        expect(longTaskCount).toBeLessThanOrEqual(PERF_BUDGET_MAX_LONG_TASKS);
        expect(avgFps).toBeGreaterThanOrEqual(PERF_BUDGET_MIN_FPS);

        const heapResult = await page.evaluate(() => new Promise((resolve) => {
            const memory = performance.memory;
            if (!memory || !Number.isFinite(memory.usedJSHeapSize)) {
                resolve({ available: false });
                return;
            }
            const startBytes = memory.usedJSHeapSize;
            setTimeout(() => {
                const endBytes = performance.memory.usedJSHeapSize;
                resolve({ available: true, growthBytes: endBytes - startBytes });
            }, 4000);
        }));

        if (heapResult.available) {
            console.log(`堆增长=${(heapResult.growthBytes / (1024 * 1024)).toFixed(2)}MB`);
            expect(heapResult.growthBytes).toBeLessThan(PERF_BUDGET_MAX_HEAP_GROWTH_MB * 1024 * 1024);
        } else {
            console.log('堆内存检测跳过：performance.memory 不可用');
        }
    });

    test('startup load stays within budget', async ({ page }) => {
        const startupDurations = [];

        for (let run = 0; run < PERF_STARTUP_RUNS; run++) {
            await page.goto('about:blank');
            await page.evaluate(() => {
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                } catch (e) {}
            });
            await page.goto('http://localhost:8080');
            await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
            await page.waitForFunction(
                () => window.gameLoadMetrics && Number.isFinite(window.gameLoadMetrics.totalVisibleLoadDuration),
                null,
                { timeout: 60000 }
            );

            const duration = await page.evaluate(() => window.gameLoadMetrics.totalVisibleLoadDuration);
            startupDurations.push(duration);
            console.log(`启动耗时 run${run + 1}=${Number(duration).toFixed(2)}ms`);
        }

        const startupP95 = percentile95(startupDurations);
        console.log(`启动耗时 p95=${startupP95.toFixed(2)}ms`);

        expect(startupP95).toBeGreaterThan(0);
        expect(startupP95).toBeLessThan(PERF_BUDGET_STARTUP_MS);
    });

    test('tab switching re-renders within budget', async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });

        let unlockedAllTabs = false;
        try {
            await unlockAdvancedIndustry(page);
            await page.evaluate(() => {
                if (window.rustGame && typeof window.rustGame.update_ui === 'function') window.rustGame.update_ui();
                if (window.updateUnlocksPanel) window.updateUnlocksPanel();
            });
            await page.waitForTimeout(500);
            unlockedAllTabs = true;
        } catch (error) {
            console.log(`解锁全阶段失败，改用当前可见 tab：${error.message}`);
        }

        if (unlockedAllTabs) {
            await page.waitForFunction(() => document.querySelectorAll('.tab-button').length >= 8, null, { timeout: 5000 }).catch(() => {});
        }

        const visibleCount = await page.evaluate(() => Array.from(document.querySelectorAll('.tab-button')).filter((b) => b.offsetParent !== null).length);
        console.log(`可见 tab 数：${visibleCount}`);

        const tabStats = await page.evaluate(async (iters) => {
            const buttons = Array.from(document.querySelectorAll('.tab-button')).filter((b) => b.offsetParent !== null);
            if (buttons.length < 2) {
                return { skipped: true, perTab: {}, overall: [] };
            }

            if (buttons.length) {
                buttons[buttons.length - 1].click();
                await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            }

            const perTab = {};
            for (let pass = 0; pass < iters; pass++) {
                for (const btn of buttons) {
                    const name = btn.getAttribute('data-tab');
                    const t0 = performance.now();
                    btn.click();
                    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
                    if (!perTab[name]) {
                        perTab[name] = [];
                    }
                    perTab[name].push(performance.now() - t0);
                }
            }

            return { skipped: false, perTab, overall: Object.values(perTab).flat() };
        }, PERF_TAB_ITERATIONS);

        if (tabStats.skipped) {
            console.log('标签页切换检测跳过：可见标签不足 2 个');
            return;
        }

        const overallP95 = percentile95(tabStats.overall);
        for (const name of Object.keys(tabStats.perTab)) {
            const tabP95 = percentile95(tabStats.perTab[name]);
            console.log(`标签 ${name}=${tabP95.toFixed(2)}ms`);
        }
        console.log(`标签切换总体 p95=${overallP95.toFixed(2)}ms`);

        expect(overallP95).toBeGreaterThan(0);
        expect(overallP95).toBeLessThan(PERF_BUDGET_TAB_MS);
    });
});
