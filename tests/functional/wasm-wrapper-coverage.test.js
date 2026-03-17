const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('../fixtures/coverage');

test.describe('WASM wrapper coverage', () => {
    const pkgDir = path.join(process.cwd(), 'pkg');

    const moduleFiles = [
        'idle_game.v0.7.0.js',
        'idle_game.js',
    ];

    for (const moduleFile of moduleFiles) {
        test(`wrapper /pkg/${moduleFile} covers init cache, type guards, and moved-value branches`, async () => {
            test.setTimeout(60000);

            const moduleUrl = pathToFileURL(path.join(pkgDir, moduleFile)).href;
            const wasmFile = moduleFile
                .replace('idle_game.v0.7.0.js', 'idle_game_bg.v0.7.0.wasm')
                .replace('idle_game.js', 'idle_game_bg.wasm');
            const wasmBytes = fs.readFileSync(path.join(pkgDir, wasmFile));
            const mod = await import(moduleUrl);

            await mod.default({ module_or_path: wasmBytes });
            await mod.default({ module_or_path: wasmBytes });

            const game = mod.init_game();
            const invalidCallResults = [];
            const typeErrors = [];
            const movedErrors = [];

            const capture = (label, fn, bucket) => {
                try {
                    invalidCallResults.push(`${label}:${String(fn())}`);
                } catch (error) {
                    bucket.push(`${label}:${String(error && error.message ? error.message : error)}`);
                }
            };

            capture('assign_worker_num', () => game.assign_worker('bad-index', 'Farm'), typeErrors);
            capture('assign_worker_string', () => game.assign_worker(0, 123), typeErrors);
            capture('check_unlock_string', () => game.check_unlock(123), typeErrors);

            const result = {
                beforeFreeCoins: game.get_coins(),
                beforeFreeBuildings: Array.isArray(game.get_buildings()),
                beforeFreeStats: typeof game.getStatistics() === 'object',
                invalidCallResults,
                typeErrors,
                movedErrors,
            };

            game.free();

            [
                ['get_coins', () => game.get_coins()],
                ['get_buildings', () => game.get_buildings()],
                ['buy_building', () => game.buy_building(0)],
                ['assign_worker_auto', () => game.assign_worker_auto()],
                ['exportToBase64', () => game.exportToBase64()],
                ['getProgressionStateJson', () => game.getProgressionStateJson()],
                ['getUnlockProgress', () => game.getUnlockProgress('stage_workers')],
                ['check_achievement', () => game.check_achievement('first_click')],
            ].forEach(([label, fn]) => capture(label, fn, result.movedErrors));

            expect(typeof result.beforeFreeCoins).toBe('number');
            expect(result.beforeFreeBuildings).toBe(true);
            expect(result.beforeFreeStats).toBe(true);
            expect(result.invalidCallResults.length + result.typeErrors.length).toBe(3);
            expect(result.movedErrors.length).toBe(8);
            expect(result.movedErrors.every((entry) => typeof entry === 'string' && entry.includes(':') && entry.length > 2)).toBe(true);
        });
    }
});
