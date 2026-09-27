#!/usr/bin/env node
/**
 * Runtime performance measurement for the idle game.
 *
 * Collects startup + steady-state metrics (tick cost, WASM query cost, UI
 * render cost), idle FPS / long tasks, JS heap trend, and a V8 CPU profile.
 * Emits human-observable artifacts:
 *   - perf-report/game-perf.json          raw + summarized metrics
 *   - perf-report/game-perf.html          self-contained chart report
 *   - perf-report/game-perf-flamegraph.svg  static flamegraph (SVG)
 *   - perf-report/game-perf.cpuprofile    openable in Chrome DevTools
 *   - perf-report/game-perf.speedscope.json  interactive flamegraph (speedscope.app)
 *
 * Usage:
 *   node scripts/measure-game-perf.js
 *
 * Env:
 *   PW_TEST_PORT         server port (default 8080)
 *   PERF_BASE_URL        use an existing server instead of spawning one
 *   PERF_START_SERVER=0  do not spawn the local server
 *   PERF_ITERATIONS      hot-path sampling iterations (default 120)
 *   PERF_PROFILE_LOOPS   stress loops captured into the CPU profile (default 300)
 *   PERF_IDLE_MS         idle sampling window for FPS/heap (default 4000)
 *   PERF_STARTUP_RUNS    cold-startup measurement runs (default 3)
 *   PERF_TAB_ITERATIONS  tab-switch passes over visible tabs (default 3)
 *   PERF_OUTPUT_DIR      output directory (default perf-report)
 */

const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { unlockAdvancedIndustry } = require('../tests/fixtures/stage-helpers');

const DEFAULT_PORT = Number(process.env.PW_TEST_PORT || '8080');
const ITERATIONS = clampInt(process.env.PERF_ITERATIONS, 120, 10);
const PROFILE_LOOPS = clampInt(process.env.PERF_PROFILE_LOOPS, 150, 10);
const IDLE_MS = clampInt(process.env.PERF_IDLE_MS, 4000, 500);
const STARTUP_RUNS = clampInt(process.env.PERF_STARTUP_RUNS, 3, 1);
const TAB_ITERATIONS = clampInt(process.env.PERF_TAB_ITERATIONS, 3, 1);
const OUTPUT_DIR = process.env.PERF_OUTPUT_DIR || 'perf-report';
const SERVER_TIMEOUT_MS = clampInt(process.env.PERF_SERVER_TIMEOUT_MS, 30000, 1000);

function clampInt(value, fallback, min) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= min ? parsed : fallback;
}

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
            if (response.ok) return;
        } catch (error) {
            // server not ready yet
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
        // not already running
    }

    let lastError = null;
    for (const entry of buildServerCommands(port)) {
        try {
            const child = spawn(entry.command, entry.args, { cwd: process.cwd(), stdio: 'ignore', shell: false });
            await Promise.race([
                waitForHttpReady(`http://127.0.0.1:${port}`, timeoutMs),
                new Promise((_, reject) => {
                    child.once('exit', (code) => reject(new Error(`Server exited early with code ${code}`)));
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
    const clean = (values || []).filter(Number.isFinite);
    if (!clean.length) return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0 };
    const sorted = [...clean].sort((a, b) => a - b);
    const total = sorted.reduce((sum, value) => sum + value, 0);
    const at = (q) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * q) - 1)];
    return {
        count: sorted.length,
        min: round(sorted[0]),
        max: round(sorted[sorted.length - 1]),
        avg: round(total / sorted.length),
        p50: round(at(0.5)),
        p95: round(at(0.95))
    };
}

function round(value) {
    return Number(value.toFixed(3));
}

async function collectStartup(page) {
    return page.evaluate(() => {
        const metrics = window.gameLoadMetrics || {};
        const nav = performance.getEntriesByType('navigation')[0];
        const wasm = performance.getEntriesByType('resource').find((r) => /\.wasm(\?|$)/.test(r.name));
        return {
            totalInitDuration: metrics.totalInitDuration ?? null,
            totalVisibleLoadDuration: metrics.totalVisibleLoadDuration ?? null,
            wasmTransferBytes: wasm ? wasm.transferSize : null,
            wasmDecodedBytes: wasm ? wasm.decodedBodySize : null,
            domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
            loadEventEndMs: nav ? Math.round(nav.loadEventEnd) : null
        };
    });
}

async function collectStartupRuns(page, baseUrl, runs) {
    const perRun = [];
    for (let i = 0; i < runs; i++) {
        await page.goto('about:blank');
        await page.evaluate(() => {
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (error) {
                // storage unavailable
            }
        });
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
        await page.waitForFunction(() => window.gameLoadMetrics && Number.isFinite(window.gameLoadMetrics.totalVisibleLoadDuration), null, { timeout: 60000 });
        perRun.push(await collectStartup(page));
    }
    return {
        runs,
        perRun,
        init: summarize(perRun.map((run) => run.totalInitDuration)),
        visible: summarize(perRun.map((run) => run.totalVisibleLoadDuration))
    };
}

async function ensureAllTabsUnlocked(page) {
    if (process.env.PERF_UNLOCK_ALL_TABS === '0') return false;
    try {
        await unlockAdvancedIndustry(page);
        await page.evaluate(() => {
            if (window.rustGame && typeof window.rustGame.update_ui === 'function') window.rustGame.update_ui();
            if (window.updateUnlocksPanel) window.updateUnlocksPanel();
        });
        await page.waitForFunction(() => document.querySelectorAll('.tab-button').length >= 8, null, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(300);
        return true;
    } catch (error) {
        console.warn(`[measure-game-perf] unlock all tabs failed, measuring visible tabs only: ${error.message}`);
        return false;
    }
}

async function collectTabSwitches(page, iterations) {
    const raw = await page.evaluate(async (iters) => {
        const buttons = Array.from(document.querySelectorAll('.tab-button')).filter((b) => b.offsetParent !== null);
        if (buttons.length < 1) return { tabNames: [], tabCount: 0 };
        const samples = {};
        const overall = [];
        for (const btn of buttons) {
            const name = btn.getAttribute('data-tab') || '(unnamed)';
            samples[name] = samples[name] || [];
        }
        buttons[buttons.length - 1].click();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        for (let pass = 0; pass < iters; pass++) {
            for (const btn of buttons) {
                const name = btn.getAttribute('data-tab') || '(unnamed)';
                const t0 = performance.now();
                btn.click();
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const elapsed = performance.now() - t0;
                samples[name].push(elapsed);
                overall.push(elapsed);
            }
        }
        return { perTab: samples, overall, tabNames: buttons.map((b) => b.getAttribute('data-tab') || '(unnamed)'), tabCount: buttons.length };
    }, iterations);

    if (!raw || !raw.perTab) return { perTab: {}, overall: summarize([]), tabNames: [], tabCount: 0 };
    const perTab = {};
    for (const [name, values] of Object.entries(raw.perTab)) {
        perTab[name] = summarize(values);
    }
    return { perTab, overall: summarize(raw.overall || []), tabNames: raw.tabNames || [], tabCount: raw.tabCount || 0 };
}

async function collectHotPaths(page, iterations) {
    return page.evaluate((iters) => {
        const game = window.rustGame;
        const sample = (fn, n) => {
            const out = [];
            for (let i = 0; i < n; i++) {
                const start = performance.now();
                fn();
                out.push(performance.now() - start);
            }
            return out;
        };
        const safe = (fn) => (typeof fn === 'function' ? fn : () => {});
        const workers = game.get_workers ? game.get_workers().length : 0;
        const buildings = game.get_buildings ? game.get_buildings().length : 0;

        const result = {
            workers,
            buildings,
            tick: sample(() => game.game_loop(), iters),
            getWorkers: sample(() => game.get_workers(), Math.max(10, Math.floor(iters / 2))),
            getBuildings: sample(() => game.get_buildings(), Math.max(10, Math.floor(iters / 2))),
            getResources: sample(() => game.get_resources(), iters * 2),
            renderResource: sample(safe(window.updateResourcePanel), Math.max(10, Math.floor(iters / 4))),
            renderBuildings: sample(safe(window.updateBuildingDisplay), Math.max(10, Math.floor(iters / 4))),
            renderWorkers: sample(safe(window.updateWorkersPanel), Math.max(10, Math.floor(iters / 8))),
            renderTechnology: sample(safe(window.updateTechnologyPanel), Math.max(5, Math.floor(iters / 8)))
        };
        return result;
    }, iterations);
}

async function initIdleObservers(page) {
    await page.evaluate(() => {
        window.__perfLongTasks = [];
        window.__perfLongTaskObserver = null;
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    window.__perfLongTasks.push(entry.duration);
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
            window.__perfLongTaskObserver = observer;
        } catch (error) {
            // longtask not supported
        }
    });
}

async function sampleIdle(page, client, durationMs) {
    const fpsPromise = page.evaluate((ms) => new Promise((resolve) => {
        const frames = [];
        let last = performance.now();
        const start = last;
        function frame(now) {
            frames.push(now - last);
            last = now;
            if (now - start < ms) {
                requestAnimationFrame(frame);
            } else {
                resolve(frames);
            }
        }
        requestAnimationFrame(frame);
    }), durationMs);

    const heapSamples = [];
    if (client) {
        const started = Date.now();
        while (Date.now() - started < durationMs) {
            try {
                const usage = await client.send('Runtime.getHeapUsage');
                heapSamples.push(usage.usedSize);
            } catch (error) {
                break;
            }
            await sleep(500);
        }
    }

    const frameGaps = await fpsPromise;

    const longTasks = await page.evaluate(() => {
        if (window.__perfLongTaskObserver) {
            window.__perfLongTaskObserver.disconnect();
        }
        return window.__perfLongTasks || [];
    });

    const gaps = frameGaps.filter(Number.isFinite);
    const avgFrame = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const jankFrames = gaps.filter((gap) => gap > 50).length;
    const heap = {
        samples: heapSamples,
        startBytes: heapSamples.length ? heapSamples[0] : null,
        endBytes: heapSamples.length ? heapSamples[heapSamples.length - 1] : null,
        growthBytes: heapSamples.length > 1 ? heapSamples[heapSamples.length - 1] - heapSamples[0] : null
    };

    return {
        fps: { frames: gaps.length, avg: avgFrame > 0 ? round(1000 / avgFrame) : 0, longestFrameMs: gaps.length ? round(Math.max(...gaps)) : 0, jankFrames },
        longTasks,
        heap
    };
}

async function collectCpuProfile(page, client, loops) {
    await client.send('Profiler.enable');
    await client.send('Profiler.setSamplingInterval', { interval: 250 });
    await client.send('Profiler.start');
    await page.evaluate((n) => {
        const game = window.rustGame;
        for (let i = 0; i < n; i++) {
            game.game_loop();
            if (window.updateResourcePanel) window.updateResourcePanel();
            if (window.updateBuildingDisplay) window.updateBuildingDisplay();
            if (game.get_workers) game.get_workers();
        }
    }, loops);
    const { profile } = await client.send('Profiler.stop');
    await client.send('Profiler.disable');
    return profile;
}

function frameLabel(callFrame) {
    if (!callFrame) return '(unknown)';
    const name = callFrame.functionName || '(anonymous)';
    const file = callFrame.url ? callFrame.url.split('/').pop() : '';
    return file ? `${name} (${file})` : name;
}

function buildParentMap(profile) {
    const parentOf = new Map();
    for (const node of profile.nodes || []) {
        for (const child of node.children || []) {
            parentOf.set(child, node.id);
        }
    }
    return parentOf;
}

function selfTimes(profile) {
    const self = new Map();
    const samples = profile.samples || [];
    const deltas = profile.timeDeltas || [];
    if (samples.length) {
        for (let i = 0; i < samples.length; i++) {
            const id = samples[i];
            self.set(id, (self.get(id) || 0) + (deltas[i] != null ? deltas[i] : 1));
        }
    } else {
        for (const node of profile.nodes || []) {
            self.set(node.id, node.hitCount || 0);
        }
    }
    return self;
}

function topSelfTime(profile, limit = 25) {
    const byId = new Map((profile.nodes || []).map((node) => [node.id, node]));
    const totals = new Map();
    for (const [id, micros] of selfTimes(profile)) {
        const node = byId.get(id);
        const label = frameLabel(node && node.callFrame);
        totals.set(label, (totals.get(label) || 0) + micros);
    }
    return [...totals.entries()]
        .map(([name, micros]) => ({ name, ms: round(micros / 1000) }))
        .sort((a, b) => b.ms - a.ms)
        .slice(0, limit);
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildFlamegraphSvg(profile, options = {}) {
    const width = options.width || 1200;
    const rowHeight = options.rowHeight || 18;
    const fontSize = options.fontSize || 11;
    const nodes = profile.nodes || [];
    if (!nodes.length) return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';

    const byId = new Map(nodes.map((node) => [node.id, node]));
    const parentOf = buildParentMap(profile);
    let rootId = null;
    for (const node of nodes) {
        if (!parentOf.has(node.id)) { rootId = node.id; break; }
    }
    if (rootId == null) rootId = nodes[0].id;

    const self = selfTimes(profile);
    const subtree = new Map();
    const total = (id) => {
        if (subtree.has(id)) return subtree.get(id);
        const node = byId.get(id);
        let sum = self.get(id) || 0;
        for (const child of (node && node.children) || []) sum += total(child);
        subtree.set(id, sum);
        return sum;
    };
    const grandTotal = total(rootId) || 1;

    const frames = [];
    const layout = (id, depth, x) => {
        const node = byId.get(id);
        const time = subtree.get(id) || 0;
        if (!node || time <= 0) return x;
        const w = (time / grandTotal) * width;
        frames.push({ node, depth, x, w, time });
        let cursor = x;
        const children = (node.children || []).slice().sort((a, b) => (subtree.get(b) || 0) - (subtree.get(a) || 0));
        for (const child of children) cursor = layout(child, depth + 1, cursor);
        return x + w;
    };
    layout(rootId, 0, 0);

    const maxDepth = frames.reduce((max, frame) => Math.max(max, frame.depth), 0);
    const height = (maxDepth + 1) * rowHeight + 6;
    const color = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
        return `hsl(${hash % 360} 62% 63%)`;
    };

    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="monospace" font-size="${fontSize}">`];
    for (const frame of frames) {
        const label = frameLabel(frame.node.callFrame);
        const y = frame.depth * rowHeight;
        const w = Math.max(1, frame.w);
        parts.push(`<rect x="${frame.x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${rowHeight - 1}" fill="${color(label)}" stroke="#ffffff" stroke-width="0.5"><title>${escapeXml(label)} — ${(frame.time / 1000).toFixed(1)}ms</title></rect>`);
        if (w > 42) {
            const maxChars = Math.max(3, Math.floor(w / (fontSize * 0.62)));
            parts.push(`<text x="${(frame.x + 3).toFixed(1)}" y="${(y + rowHeight - 5)}" fill="#101010">${escapeXml(label.slice(0, maxChars))}</text>`);
        }
    }
    parts.push('</svg>');
    return parts.join('');
}

function cpuProfileToSpeedscope(profile, name) {
    const byId = new Map((profile.nodes || []).map((node) => [node.id, node]));
    const parentOf = buildParentMap(profile);
    const frameIndex = new Map();
    const frames = [];
    const frameFor = (id) => {
        if (frameIndex.has(id)) return frameIndex.get(id);
        const callFrame = (byId.get(id) && byId.get(id).callFrame) || {};
        const index = frames.length;
        frames.push({
            name: callFrame.functionName || '(anonymous)',
            file: callFrame.url || '',
            line: (callFrame.lineNumber || 0) + 1,
            col: (callFrame.columnNumber || 0) + 1
        });
        frameIndex.set(id, index);
        return index;
    };

    const rawSamples = profile.samples || [];
    const deltas = profile.timeDeltas || [];
    const samples = [];
    const weights = [];
    for (let i = 0; i < rawSamples.length; i++) {
        const stack = [];
        let id = rawSamples[i];
        while (id != null) {
            stack.push(frameFor(id));
            id = parentOf.get(id);
        }
        samples.push(stack.reverse());
        weights.push(deltas[i] != null ? deltas[i] : 1);
    }
    const endValue = weights.reduce((sum, value) => sum + value, 0) || 1;

    return {
        $schema: 'https://www.speedscope.app/file-format-schema.json',
        shared: { frames },
        profiles: [{ type: 'sampled', name, unit: 'microseconds', startValue: 0, endValue, samples, weights }],
        activeProfileIndex: 0,
        name,
        exporter: 'idle-game measure-game-perf.js'
    };
}

function bar(label, value, max, unit = 'ms') {
    const ratio = max > 0 ? Math.max(0.01, Math.min(1, value / max)) : 0;
    return `<div class="row"><span class="label">${escapeXml(label)}</span><span class="track"><span class="fill" style="width:${(ratio * 100).toFixed(1)}%"></span></span><span class="value">${value}${unit}</span></div>`;
}

function buildHtmlReport(report, flamegraphSvg) {
    const hot = report.hotPaths;
    const rows = [
        ['tick (game_loop)', hot.tick.p95],
        ['get_workers', hot.getWorkers.p95],
        ['get_buildings', hot.getBuildings.p95],
        ['get_resources', hot.getResources.p95],
        ['renderResourcePanel', hot.renderResource.p95],
        ['renderBuildingDisplay', hot.renderBuildings.p95],
        ['renderWorkersPanel', hot.renderWorkers.p95],
        ['renderTechnologyPanel', hot.renderTechnology.p95]
    ];
    const maxP95 = Math.max(1, ...rows.map((row) => row[1]));
    const bars = rows.map((row) => bar(row[0], row[1], maxP95)).join('');

    const topRows = report.cpuProfile.topSelfTime
        .map((entry) => bar(entry.name, entry.ms, report.cpuProfile.topSelfTime[0].ms))
        .join('');

    const startup = report.startup;
    const startupList = Object.entries(startup)
        .filter(([, value]) => value != null)
        .map(([key, value]) => `<li>${escapeXml(key)}: <strong>${value}</strong></li>`)
        .join('');

    const startupRuns = report.startupRuns || { runs: 0, init: null, visible: null };
    const statRow = (label, stats) => (stats && stats.count
        ? `<tr><td>${escapeXml(label)}</td><td>${stats.p50}</td><td>${stats.p95}</td><td>${stats.max}</td><td>${stats.avg}</td></tr>`
        : `<tr><td>${escapeXml(label)}</td><td colspan="4">n/a</td></tr>`);

    const tabSwitches = report.tabSwitches || { perTab: {}, overall: null };
    const tabEntries = Object.entries(tabSwitches.perTab || {});
    const maxTabP95 = Math.max(1, ...tabEntries.map(([, stats]) => stats.p95));
    const tabBars = tabEntries.map(([name, stats]) => bar(name, stats.p95, maxTabP95)).join('');

    const idle = report.idle;
    const heapKb = (bytes) => (bytes == null ? 'n/a' : `${(bytes / 1024).toFixed(0)} KB`);

    return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>Idle Game 性能报告</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; margin: 24px; color: #111; background: #fafafa; }
  h1 { font-size: 20px; } h2 { font-size: 16px; margin-top: 28px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .card { background: #fff; border: 1px solid #e2e2e2; border-radius: 8px; padding: 12px; }
  .card .k { font-size: 12px; color: #666; } .card .v { font-size: 20px; font-weight: 600; }
  .row { display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 13px; }
  .row .label { width: 210px; flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row .track { flex: 1; background: #ececec; border-radius: 4px; height: 14px; overflow: hidden; }
  .row .fill { display: block; height: 100%; background: linear-gradient(90deg,#4f8cff,#7c4dff); }
  .row .value { width: 80px; flex: none; text-align: right; font-variant-numeric: tabular-nums; }
  .flame { border: 1px solid #e2e2e2; border-radius: 8px; background: #fff; overflow: auto; }
  code { background: #f0f0f0; padding: 1px 5px; border-radius: 4px; }
  .muted { color: #777; font-size: 12px; }
</style></head><body>
<h1>Idle Game 运行期性能报告</h1>
<p class="muted">生成于 ${escapeXml(report.generatedAt)} · 采样迭代 ${report.iterations} · 工人 ${hot.workers} / 建筑 ${hot.buildings}</p>

<div class="grid">
  <div class="card"><div class="k">tick p95</div><div class="v">${hot.tick.p95} ms</div></div>
  <div class="card"><div class="k">get_workers p95</div><div class="v">${hot.getWorkers.p95} ms</div></div>
  <div class="card"><div class="k">资源面板渲染 p95</div><div class="v">${hot.renderResource.p95} ms</div></div>
  <div class="card"><div class="k">空闲 FPS 均值</div><div class="v">${idle.fps.avg}</div></div>
  <div class="card"><div class="k">长任务数</div><div class="v">${idle.longTasks.length}</div></div>
  <div class="card"><div class="k">堆增长</div><div class="v">${heapKb(idle.heap.growthBytes)}</div></div>
</div>

<h2>热路径耗时（p95，越低越好）</h2>
${bars}

<h2>空闲状态</h2>
<ul>
  <li>平均 FPS：<strong>${idle.fps.avg}</strong>（采样 ${idle.fps.frames} 帧，最长帧 ${idle.fps.longestFrameMs}ms，卡顿帧 ${idle.fps.jankFrames}）</li>
  <li>长任务：<strong>${idle.longTasks.length}</strong> 个${idle.longTasks.length ? `（最长 ${round(Math.max(...idle.longTasks))}ms）` : ''}</li>
  <li>JS 堆：${heapKb(idle.heap.startBytes)} → ${heapKb(idle.heap.endBytes)}（增长 ${heapKb(idle.heap.growthBytes)}）</li>
</ul>

<h2>CPU 火焰图（自顶向下，越宽越耗时）</h2>
<div class="flame">${flamegraphSvg}</div>
<p class="muted">交互式查看：用 <code>game-perf.speedscope.json</code> 打开 <code>speedscope.app</code>，或用 Chrome DevTools 打开 <code>game-perf.cpuprofile</code>。</p>

<h2>自耗时最高的函数</h2>
${topRows}

<h2>启动加载（多轮）</h2>
<table>
  <thead><tr><th>阶段</th><th>p50 (ms)</th><th>p95 (ms)</th><th>max (ms)</th><th>avg (ms)</th></tr></thead>
  <tbody>
    ${statRow('可见加载 totalVisibleLoadDuration', startupRuns.visible)}
    ${statRow('初始化 totalInitDuration', startupRuns.init)}
  </tbody>
</table>
<p class="muted">冷启动轮数：<strong>${startupRuns.runs}</strong>（每轮均清空 localStorage/sessionStorage 后重新加载）</p>

<h2>Tab 切换重绘耗时（p95）</h2>
${tabBars || '<p class="muted">未检测到可见的 tab 按钮。</p>'}

<h2>启动耗时</h2>
<ul>${startupList}</ul>
<p class="muted">原始数据：<code>game-perf.json</code></p>
</body></html>`;
}

async function main() {
    const port = DEFAULT_PORT;
    const baseUrl = process.env.PERF_BASE_URL || `http://127.0.0.1:${port}`;
    const startServerFlag = process.env.PERF_START_SERVER !== '0' && !process.env.PERF_BASE_URL;
    let serverProcess = null;
    const outputDir = path.resolve(process.cwd(), OUTPUT_DIR);
    fs.mkdirSync(outputDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    try {
        if (startServerFlag) {
            serverProcess = await startServer(port, SERVER_TIMEOUT_MS);
        } else {
            await waitForHttpReady(baseUrl, SERVER_TIMEOUT_MS);
        }

        const context = await browser.newContext();
        const page = await context.newPage();
        const client = await context.newCDPSession(page);

        const startupRuns = await collectStartupRuns(page, baseUrl, STARTUP_RUNS);
        const startup = startupRuns.perRun[startupRuns.perRun.length - 1];
        await page.waitForTimeout(500);

        const rawHotPaths = await collectHotPaths(page, ITERATIONS);
        const tabsUnlocked = await ensureAllTabsUnlocked(page);
        const tabSwitches = await collectTabSwitches(page, TAB_ITERATIONS);

        await initIdleObservers(page);
        const idle = await sampleIdle(page, client, IDLE_MS);

        const cpuProfile = await collectCpuProfile(page, client, PROFILE_LOOPS);

        const hotPaths = {
            workers: rawHotPaths.workers,
            buildings: rawHotPaths.buildings,
            tick: summarize(rawHotPaths.tick),
            getWorkers: summarize(rawHotPaths.getWorkers),
            getBuildings: summarize(rawHotPaths.getBuildings),
            getResources: summarize(rawHotPaths.getResources),
            renderResource: summarize(rawHotPaths.renderResource),
            renderBuildings: summarize(rawHotPaths.renderBuildings),
            renderWorkers: summarize(rawHotPaths.renderWorkers),
            renderTechnology: summarize(rawHotPaths.renderTechnology)
        };

        const report = {
            generatedAt: new Date().toISOString(),
            iterations: ITERATIONS,
            startup,
            startupRuns,
            tabsUnlocked,
            tabSwitches,
            hotPaths,
            idle,
            cpuProfile: {
                nodes: (cpuProfile.nodes || []).length,
                samples: (cpuProfile.samples || []).length,
                totalMs: round((cpuProfile.timeDeltas || []).reduce((sum, value) => sum + value, 0) / 1000),
                topSelfTime: topSelfTime(cpuProfile)
            }
        };

        const flamegraphSvg = buildFlamegraphSvg(cpuProfile);
        const speedscope = cpuProfileToSpeedscope(cpuProfile, 'idle-game runtime');

        fs.writeFileSync(path.join(outputDir, 'game-perf.json'), JSON.stringify(report, null, 2));
        fs.writeFileSync(path.join(outputDir, 'game-perf.cpuprofile'), JSON.stringify(cpuProfile));
        fs.writeFileSync(path.join(outputDir, 'game-perf.speedscope.json'), JSON.stringify(speedscope));
        fs.writeFileSync(path.join(outputDir, 'game-perf-flamegraph.svg'), flamegraphSvg);
        fs.writeFileSync(path.join(outputDir, 'game-perf.html'), buildHtmlReport(report, flamegraphSvg));

        console.log('Game performance summary');
        console.log(`- tick p95:            ${hotPaths.tick.p95} ms`);
        console.log(`- get_workers p95:     ${hotPaths.getWorkers.p95} ms (${hotPaths.workers} workers)`);
        console.log(`- render resource p95: ${hotPaths.renderResource.p95} ms`);
        console.log(`- idle FPS avg:        ${idle.fps.avg}`);
        console.log(`- long tasks:          ${idle.longTasks.length}`);
        console.log(`- heap growth:         ${idle.heap.growthBytes == null ? 'n/a' : (idle.heap.growthBytes / 1024).toFixed(0) + ' KB'}`);
        console.log(`- wasm decoded:        ${startup.wasmDecodedBytes == null ? 'n/a' : (startup.wasmDecodedBytes / 1024 / 1024).toFixed(2) + ' MB'}`);
        console.log(`- startup visible p95: ${startupRuns.visible.p95} ms (${startupRuns.runs} runs, p50 ${startupRuns.visible.p50}, max ${startupRuns.visible.max})`);
        console.log(`- tabs unlocked:      ${tabsUnlocked}`);
        console.log(`- tab switch p95:      ${tabSwitches.overall.p95} ms (${tabSwitches.overall.count} samples, ${tabSwitches.tabCount} tabs)`);
        console.log('Artifacts:');
        for (const file of ['game-perf.html', 'game-perf-flamegraph.svg', 'game-perf.speedscope.json', 'game-perf.cpuprofile', 'game-perf.json']) {
            console.log(`- ${path.join(OUTPUT_DIR, file)}`);
        }
    } finally {
        await browser.close();
        if (serverProcess) serverProcess.kill();
    }
}

main().catch((error) => {
    console.error('Failed to measure game performance:', error);
    process.exitCode = 1;
});
