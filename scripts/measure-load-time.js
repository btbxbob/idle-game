const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');

const DEFAULT_PORT = Number(process.env.PW_TEST_PORT || '8080');
const DEFAULT_RUNS = Number.parseInt(process.env.LOAD_TIME_RUNS || '5', 10);
const DEFAULT_TIMEOUT = Number.parseInt(process.env.LOAD_TIME_TIMEOUT_MS || '30000', 10);
const DEFAULT_SERVER_TIMEOUT = Number.parseInt(process.env.LOAD_TIME_SERVER_TIMEOUT_MS || '30000', 10);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildServerCommands(port) {
    return [
        { command: 'python3', args: ['server.py', '--quiet', '--port', String(port)] },
        { command: 'python', args: ['server.py', '--quiet', '--port', String(port)] },
        { command: 'py', args: ['-3', 'server.py', '--quiet', '--port', String(port)] }
    ];
}

async function waitForHttpReady(url, timeoutMs) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        try {
            const response = await fetch(url, { method: 'GET' });
            if (response.ok) {
                return;
            }
        } catch (error) {
        }

        await sleep(250);
    }

    throw new Error(`Timed out waiting for server: ${url}`);
}

async function startServer(port, timeoutMs) {
    try {
        await waitForHttpReady(`http://127.0.0.1:${port}`, 1000);
        return null;
    } catch (error) {
    }

    const commands = buildServerCommands(port);
    let lastError = null;

    for (const entry of commands) {
        try {
            const child = spawn(entry.command, entry.args, {
                cwd: process.cwd(),
                stdio: 'ignore',
                shell: false
            });

            await Promise.race([
                waitForHttpReady(`http://127.0.0.1:${port}`, timeoutMs),
                new Promise((_, reject) => {
                    child.once('exit', (code) => {
                        reject(new Error(`Server process exited early with code ${code}`));
                    });
                })
            ]);

            return child;
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Failed to start local server');
}

function summarize(values) {
    if (!values.length) {
        return { min: 0, max: 0, avg: 0, p95: 0 };
    }

    const sorted = [...values].sort((left, right) => left - right);
    const total = sorted.reduce((sum, value) => sum + value, 0);
    const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);

    return {
        min: Number(sorted[0].toFixed(2)),
        max: Number(sorted[sorted.length - 1].toFixed(2)),
        avg: Number((total / sorted.length).toFixed(2)),
        p95: Number(sorted[p95Index].toFixed(2))
    };
}

async function measureRun(page, url, timeoutMs) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: timeoutMs });
    await page.waitForFunction(() => {
        return window.gameLoadMetrics && Number.isFinite(window.gameLoadMetrics.totalVisibleLoadDuration);
    }, null, { timeout: timeoutMs });

    return await page.evaluate(() => {
        const metrics = window.gameLoadMetrics || {};
        const navigationEntry = performance.getEntriesByType('navigation')[0];

        return {
            domContentLoadedTime: metrics.domContentLoadedTime ?? null,
            wasmModuleLoadedTime: metrics.wasmModuleLoadedTime ?? null,
            coreInitializedTime: metrics.coreInitializedTime ?? null,
            saveLoadedTime: metrics.saveLoadedTime ?? null,
            managersConnectedTime: metrics.managersConnectedTime ?? null,
            uiReadyTime: metrics.uiReadyTime ?? null,
            loadingHiddenTime: metrics.loadingHiddenTime ?? null,
            totalInitDuration: metrics.totalInitDuration ?? null,
            totalVisibleLoadDuration: metrics.totalVisibleLoadDuration ?? null,
            browserDomContentLoaded: navigationEntry ? navigationEntry.domContentLoadedEventEnd : null,
            browserLoadEventEnd: navigationEntry ? navigationEntry.loadEventEnd : null
        };
    });
}

function printSummary(results) {
    const initValues = results.map((result) => result.totalInitDuration).filter(Number.isFinite);
    const visibleValues = results.map((result) => result.totalVisibleLoadDuration).filter(Number.isFinite);

    const summary = {
        runs: results.length,
        init: summarize(initValues),
        visible: summarize(visibleValues),
        perRun: results
    };

    if (process.env.LOAD_TIME_OUTPUT_FILE) {
        fs.writeFileSync(process.env.LOAD_TIME_OUTPUT_FILE, JSON.stringify(summary, null, 2));
    }

    console.log('Load time summary');
    console.log(`- runs: ${summary.runs}`);
    console.log(`- init avg/min/max/p95: ${summary.init.avg} / ${summary.init.min} / ${summary.init.max} / ${summary.init.p95} ms`);
    console.log(`- visible avg/min/max/p95: ${summary.visible.avg} / ${summary.visible.min} / ${summary.visible.max} / ${summary.visible.p95} ms`);
    console.log(JSON.stringify(summary, null, 2));
}

async function main() {
    const runs = Number.isInteger(DEFAULT_RUNS) && DEFAULT_RUNS > 0 ? DEFAULT_RUNS : 5;
    const timeoutMs = Number.isInteger(DEFAULT_TIMEOUT) && DEFAULT_TIMEOUT > 0 ? DEFAULT_TIMEOUT : 30000;
    const serverTimeoutMs = Number.isInteger(DEFAULT_SERVER_TIMEOUT) && DEFAULT_SERVER_TIMEOUT > 0 ? DEFAULT_SERVER_TIMEOUT : 30000;
    const baseUrl = process.env.LOAD_TIME_BASE_URL || `http://127.0.0.1:${DEFAULT_PORT}`;
    const shouldStartServer = process.env.LOAD_TIME_START_SERVER !== '0';

    let serverProcess = null;
    const browser = await chromium.launch({ headless: true });

    try {
        if (shouldStartServer) {
            serverProcess = await startServer(DEFAULT_PORT, serverTimeoutMs);
        } else {
            await waitForHttpReady(baseUrl, serverTimeoutMs);
        }

        const page = await browser.newPage();
        const results = [];

        for (let index = 0; index < runs; index += 1) {
            const result = await measureRun(page, baseUrl, timeoutMs);
            results.push(result);
            console.log(`run ${index + 1}: init=${result.totalInitDuration}ms visible=${result.totalVisibleLoadDuration}ms`);
            await page.evaluate(() => {
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                } catch (error) {
                }
            });
            await page.goto('about:blank');
        }

        printSummary(results);
    } finally {
        await browser.close();
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

main().catch((error) => {
    console.error('Failed to measure load time:', error);
    process.exitCode = 1;
});
