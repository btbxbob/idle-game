const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('../fixtures/coverage');
const packageJson = require('../../package.json');

test.describe('WASM wrapper coverage', () => {
    const pkgDir = path.join(process.cwd(), 'pkg');
    const runtimeVersion = packageJson.version;

    const moduleFiles = [
        `idle_game.v${runtimeVersion}.js`,
        'idle_game.js',
    ];

    for (const moduleFile of moduleFiles) {
        test(`wrapper /pkg/${moduleFile} covers init cache, type guards, and moved-value branches`, async () => {
            test.setTimeout(60000);

            const moduleUrl = pathToFileURL(path.join(pkgDir, moduleFile)).href;
            const wasmFile = moduleFile
                .replace(`idle_game.v${runtimeVersion}.js`, `idle_game_bg.v${runtimeVersion}.wasm`)
                .replace('idle_game.js', 'idle_game_bg.wasm');
            const wasmBytes = fs.readFileSync(path.join(pkgDir, wasmFile));
            const mod = await import(moduleUrl);

            await mod.default({ module_or_path: wasmBytes });
            await mod.default({ module_or_path: wasmBytes });

            const game = mod.init_game();
            const invalidCallResults = [];
            const typeErrors = [];
            const movedErrors = [];
            const preFreeSnapshots = {};

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
            capture('breaking_event_titles_type', () => game.get_breaking_event_titles('bad-limit'), typeErrors);
            capture('event_log_detail_type', () => game.get_event_log_detail('bad-id'), typeErrors);
            capture('event_log_summaries_type', () => game.get_event_log_summaries('bad-offset', 5), typeErrors);
            capture('worker_details_type', () => game.get_worker_details('bad-index'), typeErrors);
            capture('worker_page_type', () => game.get_worker_page('', 'all', 'name', 'bad-page', 10), typeErrors);
            capture('workers_filtered_bool_type', () => game.get_workers_filtered_json('nope', 'name'), typeErrors);
            capture('do_prestige_type', () => game.do_prestige('bad-pp'), typeErrors);
            capture('perform_surgery_type', () => game.perform_maggot_limb_surgery('bad-worker'), typeErrors);
            capture('upgrade_housing_type', () => game.upgrade_housing('bad-building'), typeErrors);

            [
                ['assign_worker_auto', () => game.assign_worker_auto()],
                ['click_action', () => game.click_action()],
                ['check_all_achievements', () => game.check_all_achievements()],
                ['export_base64_length', () => game.exportToBase64().length],
                ['current_objective_json_length', () => game.getCurrentObjectiveChainJson().length],
                ['progression_json_length', () => game.getProgressionStateJson().length],
                ['statistics_object', () => typeof game.getStatistics()],
                ['unlock_progress_type', () => typeof game.getUnlockProgress('stage_workers')],
                ['unlock_requirement_type', () => typeof game.getUnlockRequirementDetails('stage_workers')],
                ['achievements_len', () => Array.isArray(game.get_achievements()) ? game.get_achievements().length : -1],
                ['active_modifiers_len', () => Array.isArray(game.get_active_event_modifiers()) ? game.get_active_event_modifiers().length : -1],
                ['available_tech_json_length', () => game.get_available_technologies_json().length],
                ['breaking_titles_len', () => Array.isArray(game.get_breaking_event_titles(3)) ? game.get_breaking_event_titles(3).length : -1],
                ['assignment_counts_type', () => typeof game.get_building_assignment_counts()],
                ['buildings_len', () => Array.isArray(game.get_buildings()) ? game.get_buildings().length : -1],
                ['coins', () => game.get_coins()],
                ['coins_per_click', () => game.get_coins_per_click()],
                ['coins_per_second', () => game.get_coins_per_second()],
                ['event_catalog_capacity', () => game.get_event_catalog_capacity()],
                ['event_log_count', () => game.get_event_log_count()],
                ['event_detail_type', () => typeof game.get_event_log_detail(1)],
                ['event_summaries_len', () => Array.isArray(game.get_event_log_summaries(0, 2)) ? game.get_event_log_summaries(0, 2).length : -1],
                ['housing_type', () => typeof game.get_housing()],
                ['housing_capacity', () => game.get_housing_capacity()],
                ['housing_occupied', () => game.get_housing_occupied()],
                ['lifecycle_json_length', () => game.get_lifecycle_status_json().length],
                ['population_overview_type', () => typeof game.get_population_overview()],
                ['population_queue_json_length', () => game.get_population_queue_json().length],
                ['resources_type', () => typeof game.get_resources()],
                ['statistics_alias_type', () => typeof game.get_statistics()],
                ['stone', () => game.get_stone()],
                ['stone_per_second', () => game.get_stone_per_second()],
                ['technologies_len', () => Array.isArray(game.get_technologies()) ? game.get_technologies().length : -1],
                ['technology_tree_json_length', () => game.get_technology_tree_json().length],
                ['total_clicks', () => game.get_total_clicks()],
                ['unlocks_len', () => Array.isArray(game.get_unlocks()) ? game.get_unlocks().length : -1],
                ['version_length', () => game.get_version().length],
                ['wood', () => game.get_wood()],
                ['wood_per_second', () => game.get_wood_per_second()],
                ['work_overview_json_length', () => game.get_work_overview_json().length],
                ['worker_count', () => game.get_worker_count()],
                ['worker_details_type', () => typeof game.get_worker_details(0)],
                ['worker_page_type', () => typeof game.get_worker_page('', 'all', 'name', 1, 5)],
                ['worker_bonus', () => game.get_worker_production_bonus(0)],
                ['worker_summaries_len', () => Array.isArray(game.get_worker_summaries()) ? game.get_worker_summaries().length : -1],
                ['workers_len', () => Array.isArray(game.get_workers()) ? game.get_workers().length : -1],
                ['workers_filtered_json_length', () => game.get_workers_filtered_json(false, 'name').length],
                ['research_basic', () => game.research_technology('BasicAgriculture')],
                ['unlock_feature', () => game.unlock_feature('stage_workers')],
                ['update_buildings_only', () => { game.update_buildings_only(); return 'ok'; }],
                ['update_resources_only', () => { game.update_resources_only(); return 'ok'; }],
                ['update_ui', () => { game.update_ui(); return 'ok'; }],
            ].forEach(([label, fn]) => {
                try {
                    preFreeSnapshots[label] = fn();
                } catch (error) {
                    preFreeSnapshots[label] = `error:${String(error && error.message ? error.message : error)}`;
                }
            });

            const result = {
                beforeFreeCoins: game.get_coins(),
                beforeFreeBuildings: Array.isArray(game.get_buildings()),
                beforeFreeStats: typeof game.getStatistics() === 'object',
                invalidCallResults,
                typeErrors,
                movedErrors,
                preFreeSnapshots,
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
                ['get_breaking_event_titles', () => game.get_breaking_event_titles(1)],
                ['get_event_log_detail', () => game.get_event_log_detail(1)],
                ['get_event_log_summaries', () => game.get_event_log_summaries(0, 1)],
                ['get_housing_capacity', () => game.get_housing_capacity()],
                ['get_worker_page', () => game.get_worker_page('', 'all', 'name', 1, 5)],
                ['get_workers_filtered_json', () => game.get_workers_filtered_json(false, 'name')],
                ['research_technology', () => game.research_technology('BasicAgriculture')],
                ['unlock_feature', () => game.unlock_feature('stage_workers')],
                ['update_ui', () => game.update_ui()],
                ['upgrade_housing', () => game.upgrade_housing(0)],
            ].forEach(([label, fn]) => {
                capture(label, fn, result.movedErrors);
            });

            expect(typeof result.beforeFreeCoins).toBe('number');
            expect(result.beforeFreeBuildings).toBe(true);
            expect(result.beforeFreeStats).toBe(true);
            expect(Object.keys(result.preFreeSnapshots).length).toBeGreaterThan(30);
            expect(result.preFreeSnapshots.export_base64_length).toBeGreaterThan(10);
            expect(result.preFreeSnapshots.current_objective_json_length).toBeGreaterThan(10);
            expect(result.preFreeSnapshots.progression_json_length).toBeGreaterThan(10);
            expect(result.preFreeSnapshots.version_length).toBeGreaterThan(0);
            expect(result.preFreeSnapshots.update_buildings_only).toBe('ok');
            expect(result.preFreeSnapshots.update_resources_only).toBe('ok');
            expect(result.preFreeSnapshots.update_ui).toBe('ok');
            expect(result.invalidCallResults.length).toBe(9);
            expect(result.typeErrors.length).toBe(3);
            expect(result.movedErrors.length).toBe(18);
            expect(result.movedErrors.every((entry) => typeof entry === 'string' && entry.includes(':') && entry.length > 2)).toBe(true);
        });
    }
});
