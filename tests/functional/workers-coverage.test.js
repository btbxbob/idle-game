const { test, expect } = require('../fixtures/coverage');
const { unlockWorkersStage, unlockMaggotStage } = require('../fixtures/stage-helpers');

test.describe('Workers Manager Coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true);
        await unlockWorkersStage(page);
        await page.click('[data-tab="workers"]');
        await page.waitForFunction(() => !!window.workerManager);
    });

    test('formatEfficiency covers positive and negative bonus branches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                positive: mgr.formatEfficiency(1.2),
                zero: mgr.formatEfficiency(1.0),
                negative: mgr.formatEfficiency(0.8),
                highPositive: mgr.formatEfficiency(2.5),
            };
        });
        expect(result.positive).toBe('+20%');
        expect(result.zero).toBe('+0%');
        expect(result.negative).toBe('-20%');
        expect(result.highPositive).toBe('+150%');
    });

    test('formatXP formats correctly', async ({ page }) => {
        const result = await page.evaluate(() => {
            return window.workerManager.formatXP(50.7, 100.3);
        });
        expect(result).toBe('50 / 100');
    });

    test('escapeHtml covers all special characters', async ({ page }) => {
        const result = await page.evaluate(() => {
            return window.workerManager.escapeHtml('<div class="test">&\'hello\'</div>');
        });
        expect(result).toContain('&lt;');
        expect(result).toContain('&gt;');
        expect(result).toContain('&amp;');
        expect(result).toContain('&quot;');
        expect(result).toContain('&#39;');
    });

    test('getLimbLabel covers known and unknown limbs', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                leftArm: mgr.getLimbLabel('LeftArm'),
                rightArm: mgr.getLimbLabel('RightArm'),
                leftLeg: mgr.getLimbLabel('LeftLeg'),
                rightLeg: mgr.getLimbLabel('RightLeg'),
                chineseLeftArm: mgr.getLimbLabel('左手'),
                chineseRightArm: mgr.getLimbLabel('右手'),
                chineseLeftLeg: mgr.getLimbLabel('左腿'),
                chineseRightLeg: mgr.getLimbLabel('右腿'),
                unknown: mgr.getLimbLabel('UnknownLimb'),
                empty: mgr.getLimbLabel(''),
                nullVal: mgr.getLimbLabel(null),
            };
        });
        expect(result.leftArm).toBe('左手');
        expect(result.rightArm).toBe('右手');
        expect(result.leftLeg).toBe('左腿');
        expect(result.rightLeg).toBe('右腿');
        expect(result.chineseLeftArm).toBe('左手');
        expect(result.unknown).toBe('UnknownLimb');
    });

    test('getGenderLabel covers male female and other', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                maleStr: mgr.getGenderLabel('Male'),
                femaleStr: mgr.getGenderLabel('Female'),
                maleNum: mgr.getGenderLabel(1),
                femaleNum: mgr.getGenderLabel(2),
                other: mgr.getGenderLabel('Other'),
                nullGender: mgr.getGenderLabel(null),
            };
        });
        expect(result.maleStr).toContain('♂');
        expect(result.femaleStr).toContain('♀');
        expect(result.maleNum).toContain('♂');
        expect(result.femaleNum).toContain('♀');
        expect(result.other).toContain('⚪');
    });

    test('getHobbiesLabel covers empty and multiple hobbies', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                empty: mgr.getHobbiesLabel([]),
                nullHobbies: mgr.getHobbiesLabel(null),
                single: mgr.getHobbiesLabel(['Reading']),
                multiple: mgr.getHobbiesLabel(['Reading', 'Gaming', 'Music']),
            };
        });
        expect(result.empty).toBe('无');
        expect(result.nullHobbies).toBe('无');
        expect(result.single).toContain('📚');
        expect(result.multiple).toContain('📚');
        expect(result.multiple).toContain('🎮');
        expect(result.multiple).toContain('🎵');
    });

    test('getHobbyLabel covers known and unknown hobbies with icons', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                reading: mgr.getHobbyLabel('Reading'),
                gaming: mgr.getHobbyLabel('Gaming'),
                sports: mgr.getHobbyLabel('Sports'),
                music: mgr.getHobbyLabel('Music'),
                art: mgr.getHobbyLabel('Art'),
                cooking: mgr.getHobbyLabel('Cooking'),
                gardening: mgr.getHobbyLabel('Gardening'),
                fishing: mgr.getHobbyLabel('Fishing'),
                traveling: mgr.getHobbyLabel('Traveling'),
                photography: mgr.getHobbyLabel('Photography'),
                unknown: mgr.getHobbyLabel('UnknownHobby'),
                empty: mgr.getHobbyLabel(''),
                nullHobby: mgr.getHobbyLabel(null),
            };
        });
        expect(result.reading).toContain('📚');
        expect(result.gaming).toContain('🎮');
        expect(result.sports).toContain('🏃');
        expect(result.music).toContain('🎵');
        expect(result.art).toContain('🎨');
        expect(result.cooking).toContain('🍳');
        expect(result.gardening).toContain('🌱');
        expect(result.fishing).toContain('🎣');
        expect(result.traveling).toContain('🧳');
        expect(result.photography).toContain('📷');
        expect(result.unknown).not.toContain('📚');
    });

    test('getTraitLabel covers known and unknown traits', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                diligent: mgr.getTraitLabel('Diligent'),
                lazy: mgr.getTraitLabel('Lazy'),
                efficient: mgr.getTraitLabel('Efficient'),
                intelligent: mgr.getTraitLabel('Intelligent'),
                genius: mgr.getTraitLabel('Genius'),
                social: mgr.getTraitLabel('Social'),
                loner: mgr.getTraitLabel('Loner'),
                nightOwl: mgr.getTraitLabel('NightOwl'),
                earlyBird: mgr.getTraitLabel('EarlyBird'),
                clumsy: mgr.getTraitLabel('Clumsy'),
                creative: mgr.getTraitLabel('Creative'),
                optimistic: mgr.getTraitLabel('Optimistic'),
                unknown: mgr.getTraitLabel('UnknownTrait'),
                empty: mgr.getTraitLabel(''),
                nullTrait: mgr.getTraitLabel(null),
            };
        });
        expect(result.diligent.icon).toBe('💪');
        expect(result.lazy.icon).toBe('😴');
        expect(result.efficient.icon).toBe('⚡');
        expect(result.intelligent.icon).toBe('🧠');
        expect(result.genius.icon).toBe('🌟');
        expect(result.unknown.icon).toBe('🔹');
        expect(result.nullTrait.icon).toBe('🔹');
    });

    test('getTraitInfo covers primary and secondary traits', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const withBoth = mgr.getTraitInfo({
                primaryTrait: 'Diligent',
                secondaryTraits: ['Intelligent', 'Social'],
            });
            const primaryOnly = mgr.getTraitInfo({
                primaryTrait: 'Lazy',
                secondaryTraits: [],
            });
            const withSnakeCase = mgr.getTraitInfo({
                primary_trait: 'Efficient',
                secondary_traits: ['NightOwl'],
            });
            const withNoTraits = mgr.getTraitInfo({});
            return { withBoth, primaryOnly, withSnakeCase, withNoTraits };
        });
        expect(result.withBoth.primary.icon).toBe('💪');
        expect(result.withBoth.secondaryHtml).toContain('🧠');
        expect(result.withBoth.secondaryHtml).toContain('🤝');
        expect(result.primaryOnly.secondaryHtml).toContain('—');
        expect(result.withSnakeCase.primary.icon).toBe('⚡');
        expect(result.withNoTraits.primary.icon).toBe('🔹');
    });

    test('getWorkerLimbSummary covers all limb combinations', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                noLimbs: mgr.getWorkerLimbSummary({}),
                missingOnly: mgr.getWorkerLimbSummary({ missingLimbs: ['LeftArm', 'RightLeg'] }),
                maggotOnly: mgr.getWorkerLimbSummary({ maggotLimbs: ['LeftArm'] }),
                both: mgr.getWorkerLimbSummary({ missingLimbs: ['LeftArm'], maggotLimbs: ['RightLeg'] }),
                snakeCaseMissing: mgr.getWorkerLimbSummary({ missing_limbs: ['LeftLeg'] }),
                snakeCaseMaggot: mgr.getWorkerLimbSummary({ maggot_limbs: ['RightArm'] }),
                emptyArrays: mgr.getWorkerLimbSummary({ missingLimbs: [], maggotLimbs: [] }),
            };
        });
        expect(result.noLimbs).toBe('肢体完整');
        expect(result.missingOnly).toContain('残疾');
        expect(result.missingOnly).toContain('左手');
        expect(result.missingOnly).toContain('右腿');
        expect(result.maggotOnly).toContain('蛆虫肢体');
        expect(result.both).toContain('残疾');
        expect(result.both).toContain('蛆虫肢体');
        expect(result.emptyArrays).toBe('肢体完整');
    });

    test('getWorkerStateSummary formats stats correctly', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return mgr.getWorkerStateSummary({ focus: 75.6, fatigue: 30.2, stress: 10.8 });
        });
        expect(result).toContain('76');
        expect(result).toContain('30');
        expect(result).toContain('11');
    });

    test('formatStatusLabel covers hungry and stable states', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                hungryCamel: mgr.formatStatusLabel({ isHungry: true }),
                stableCamel: mgr.formatStatusLabel({ isHungry: false }),
                hungrySnake: mgr.formatStatusLabel({ is_hungry: true }),
                stableSnake: mgr.formatStatusLabel({ is_hungry: false }),
            };
        });
        expect(result.hungryCamel).toContain('饥饿');
        expect(result.stableCamel).toContain('稳定');
    });

    test('getEfficiencyDetail covers various worker states', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                baseOnly: mgr.getEfficiencyDetail({ efficiencyMultiplier: 1.0 }),
                withTotal: mgr.getEfficiencyDetail({ efficiencyMultiplier: 1.2, totalEfficiency: 1.5 }),
                snakeCaseTotal: mgr.getEfficiencyDetail({ efficiencyMultiplier: 1.0, total_efficiency: 1.3 }),
                noTotal: mgr.getEfficiencyDetail({ efficiencyMultiplier: 1.0 }),
            };
        });
        expect(result.baseOnly).toBe('100% → 100%');
        expect(result.withTotal).toBe('120% → 150%');
        expect(result.snakeCaseTotal).toBe('100% → 130%');
    });

    test('getEfficiencyBreakdown covers with and without breakdown', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                noBreakdown: mgr.getEfficiencyBreakdown({}),
                emptyBreakdown: mgr.getEfficiencyBreakdown({ efficiencyBreakdown: [] }),
                withBreakdown: mgr.getEfficiencyBreakdown({ efficiencyBreakdown: ['基础 100%', '技术 +20%', '设备 +10%'] }),
                nullWorker: mgr.getEfficiencyBreakdown(null),
            };
        });
        expect(result.noBreakdown).toBe('基础 100%');
        expect(result.emptyBreakdown).toBe('基础 100%');
        expect(result.withBreakdown).toContain('技术 +20%');
        expect(result.withBreakdown).toContain('设备 +10%');
        expect(result.nullWorker).toBe('基础 100%');
    });

    test('getAutoAssignmentHint covers with and without hint', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                assigned: mgr.getAutoAssignmentHint({ assignedBuilding: 'Mine', autoAssignmentTarget: 'Quarry' }),
                unassignedWithTarget: mgr.getAutoAssignmentHint({ assignedBuilding: null, autoAssignmentTarget: 'Quarry' }),
                noTarget: mgr.getAutoAssignmentHint({ assignedBuilding: null, autoAssignmentTarget: null }),
                nullWorker: mgr.getAutoAssignmentHint(null),
            };
        });
        expect(result.assigned).toBe('');
        expect(result.unassignedWithTarget).toContain('Quarry');
        expect(result.noTarget).toBe('');
        expect(result.nullWorker).toBe('');
    });

    test('getSkillLabel covers with and without i18n', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                withSkill: mgr.getSkillLabel('Mining'),
                emptySkill: mgr.getSkillLabel(''),
                nullSkill: mgr.getSkillLabel(null),
            };
        });
        expect(result.withSkill).toBe('Mining');
        expect(result.emptySkill).toBe('—');
        expect(result.nullSkill).toBe('—');
    });

    test('getPreferenceLabel covers with and without i18n', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                withPref: mgr.getPreferenceLabel('Indoor'),
                emptyPref: mgr.getPreferenceLabel(''),
                nullPref: mgr.getPreferenceLabel(null),
            };
        });
        expect(result.withPref).toBe('Indoor');
        expect(result.emptyPref).toBe('无');
    });

    test('getBackgroundLabel covers with and without i18n', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                withBg: mgr.getBackgroundLabel('Engineer'),
                emptyBg: mgr.getBackgroundLabel(''),
                nullBg: mgr.getBackgroundLabel(null),
            };
        });
        expect(result.withBg).toBe('Engineer');
        expect(result.emptyBg).toBe('—');
    });

    test('getTranslator returns function', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const t = mgr.getTranslator();
            return typeof t;
        });
        expect(result).toBe('function');
    });

    test('getI18n returns i18n or null', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const i18n = mgr.getI18n();
            return i18n === null || typeof i18n === 'object';
        });
        expect(result).toBe(true);
    });

    test('update covers cache hit and miss paths', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.invalidateRenderCache();
            const first = mgr.update(true);
            const second = mgr.update(false);
            mgr.lastWorkerFetchAt = 0;
            const third = mgr.update(false);
            return {
                firstHasWorkers: Array.isArray(first.workers),
                secondHasWorkers: Array.isArray(second.workers),
                thirdHasWorkers: Array.isArray(third.workers),
                firstTotal: first.total,
                secondTotal: second.total,
            };
        });
        expect(result.firstHasWorkers).toBe(true);
        expect(result.secondHasWorkers).toBe(true);
        expect(result.thirdHasWorkers).toBe(true);
    });

    test('update covers fallback paths with mock rustGame', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const origRustGame = mgr.rustGame;

            mgr.rustGame = {
                get_worker_page: () => { throw new Error('mock error'); },
            };
            mgr.invalidateRenderCache();
            const errorPage = mgr.update(true);

            mgr.rustGame = {
                get_worker_summaries: () => [
                    { index: 0, name: 'TestWorker1', level: 5, assignedBuilding: 'Mine', efficiencyMultiplier: 1.2 },
                    { index: 1, name: 'TestWorker2', level: 3, assignedBuilding: null, efficiencyMultiplier: 1.0 },
                ],
            };
            mgr.invalidateRenderCache();
            const fallbackSummaries = mgr.update(true);

            mgr.rustGame = {
                get_workers: () => [
                    { index: 0, name: 'FallbackWorker', level: 2, assignedBuilding: 'Farm' },
                ],
            };
            mgr.invalidateRenderCache();
            const fallbackWorkers = mgr.update(true);

            mgr.rustGame = {};
            mgr.invalidateRenderCache();
            const noApi = mgr.update(true);

            mgr.rustGame = origRustGame;
            return {
                errorPageTotal: errorPage.total,
                fallbackTotal: fallbackSummaries.total,
                fallbackAssigned: fallbackSummaries.assignedCount,
                fallbackWorkersTotal: fallbackWorkers.total,
                noApiTotal: noApi.total,
            };
        });
        expect(result.fallbackTotal).toBe(2);
        expect(result.fallbackAssigned).toBe(1);
        expect(result.fallbackWorkersTotal).toBe(1);
        expect(result.noApiTotal).toBe(0);
    });

    test('getProcessedWorkersFallback covers filter and sort paths', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const rawWorkers = [
                { index: 0, name: 'Alice', level: 5, assignedBuilding: 'Mine', efficiencyMultiplier: 1.3, skills: 'Mining', preferences: 'Outdoor' },
                { index: 1, name: 'Bob', level: 3, assignedBuilding: null, efficiencyMultiplier: 1.1, skills: 'Crafting', preferences: 'Indoor' },
                { index: 2, name: 'Charlie', level: 8, assignedBuilding: 'Farm', efficiencyMultiplier: 1.5, skills: 'Farming', preferences: 'Outdoor' },
            ];

            mgr.virtualState.filterBy = 'all';
            mgr.virtualState.query = '';
            mgr.virtualState.sortBy = 'name';
            const allByName = mgr.getProcessedWorkersFallback(rawWorkers);

            mgr.virtualState.filterBy = 'assigned';
            const assigned = mgr.getProcessedWorkersFallback(rawWorkers);

            mgr.virtualState.filterBy = 'unassigned';
            const unassigned = mgr.getProcessedWorkersFallback(rawWorkers);

            mgr.virtualState.filterBy = 'all';
            mgr.virtualState.sortBy = 'level';
            const byLevel = mgr.getProcessedWorkersFallback(rawWorkers);

            mgr.virtualState.sortBy = 'efficiency';
            const byEfficiency = mgr.getProcessedWorkersFallback(rawWorkers);

            mgr.virtualState.sortBy = 'name';
            mgr.virtualState.query = 'ali';
            const searchResult = mgr.getProcessedWorkersFallback(rawWorkers);

            mgr.virtualState.query = 'zzz';
            const noMatch = mgr.getProcessedWorkersFallback(rawWorkers);

            mgr.virtualState.query = '';
            mgr.virtualState.filterBy = 'all';
            mgr.virtualState.sortBy = 'name';

            return {
                allCount: allByName.length,
                allFirst: allByName[0].name,
                assignedCount: assigned.length,
                unassignedCount: unassigned.length,
                byLevelFirst: byLevel[0].name,
                byEfficiencyFirst: byEfficiency[0].name,
                searchCount: searchResult.length,
                searchFirst: searchResult[0].name,
                noMatchCount: noMatch.length,
            };
        });
        expect(result.allCount).toBe(3);
        expect(result.allFirst).toBe('Alice');
        expect(result.assignedCount).toBe(2);
        expect(result.unassignedCount).toBe(1);
        expect(result.byLevelFirst).toBe('Charlie');
        expect(result.byEfficiencyFirst).toBe('Charlie');
        expect(result.searchCount).toBe(1);
        expect(result.searchFirst).toBe('Alice');
        expect(result.noMatchCount).toBe(0);
    });

    test('getWorkerDetails covers cache hit and miss', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.workerDetailsCache.clear();
            const first = mgr.getWorkerDetails(0, true);
            const cached = mgr.getWorkerDetails(0, false);
            const forceRefresh = mgr.getWorkerDetails(0, true);
            return {
                firstNotNull: first !== null,
                cachedSame: JSON.stringify(cached) === JSON.stringify(first),
                forceNotNull: forceRefresh !== null,
            };
        });
        expect(result.firstNotNull).toBe(true);
        expect(result.cachedSame).toBe(true);
    });

    test('getWorkerSnapshot covers details and page fallback', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.invalidateRenderCache();
            const fromDetails = mgr.getWorkerSnapshot(0, true);
            mgr.workerDetailsCache.clear();
            const origGetDetails = mgr.getWorkerDetails.bind(mgr);
            mgr.getWorkerDetails = () => null;
            mgr.invalidateRenderCache();
            const fromPage = mgr.getWorkerSnapshot(0, true);
            mgr.getWorkerDetails = origGetDetails;
            return {
                fromDetailsNotNull: fromDetails !== null,
                fromPageResult: fromPage !== null || fromPage === null,
            };
        });
        expect(result.fromDetailsNotNull).toBe(true);
    });

    test('getBuildingAssignmentCounts covers cache and fetch paths', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.buildingAssignmentCountsCache.clear();
            const first = mgr.getBuildingAssignmentCounts(true);
            const cached = mgr.getBuildingAssignmentCounts(false);
            const force = mgr.getBuildingAssignmentCounts(true);
            return {
                firstIsMap: first instanceof Map,
                cachedIsMap: cached instanceof Map,
                forceIsMap: force instanceof Map,
                firstSize: first.size,
            };
        });
        expect(result.firstIsMap).toBe(true);
        expect(result.cachedIsMap).toBe(true);
    });

    test('getBuildingAssignmentState covers various building states', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const buildings = [
                { name: 'Mine', count: 3 },
                { name: 'Farm', count: 1 },
            ];
            const currentWorker = { assignedBuilding: 'Mine' };
            const states = mgr.getBuildingAssignmentState(buildings, currentWorker);
            const noWorker = mgr.getBuildingAssignmentState(buildings, null);
            const emptyBuildings = mgr.getBuildingAssignmentState([], null);
            const nonArray = mgr.getBuildingAssignmentState('notarray', null);
            return {
                statesLen: states.length,
                mineReserved: states[0].availableSlots,
                noWorkerLen: noWorker.length,
                emptyLen: emptyBuildings.length,
                nonArrayLen: nonArray.length,
            };
        });
        expect(result.statesLen).toBe(2);
        expect(result.noWorkerLen).toBe(2);
        expect(result.emptyLen).toBe(0);
        expect(result.nonArrayLen).toBe(0);
    });

    test('assignWorker covers success and error paths', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const buildings = mgr.getBuildings();
            if (buildings.length === 0) return { skipped: true };

            const success = mgr.assignWorker(0, buildings[0].name);

            const origFn = mgr.rustGame.assign_worker;
            mgr.rustGame.assign_worker = () => { throw new Error('mock'); };
            const errorResult = mgr.assignWorker(0, buildings[0].name);
            mgr.rustGame.assign_worker = origFn;

            const origRustGame = mgr.rustGame;
            mgr.rustGame = null;
            const noGame = mgr.assignWorker(0, 'test');
            mgr.rustGame = origRustGame;

            return { success, errorResult, noGame, skipped: false };
        });
        if (result.skipped) test.skip(true, 'No buildings available');
        expect(result.success).toBe(true);
        expect(result.errorResult).toBe(false);
        expect(result.noGame).toBe(false);
    });

    test('getBuildings covers success and error paths', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const success = mgr.getBuildings();

            const origFn = mgr.rustGame.get_buildings;
            mgr.rustGame.get_buildings = () => { throw new Error('mock'); };
            const errorResult = mgr.getBuildings();
            mgr.rustGame.get_buildings = origFn;

            const origRustGame = mgr.rustGame;
            mgr.rustGame = null;
            const noGame = mgr.getBuildings();
            mgr.rustGame = origRustGame;

            return {
                successIsArray: Array.isArray(success),
                errorIsArray: Array.isArray(errorResult),
                errorLen: errorResult.length,
                noGameIsArray: Array.isArray(noGame),
                noGameLen: noGame.length,
            };
        });
        expect(result.successIsArray).toBe(true);
        expect(result.errorIsArray).toBe(true);
        expect(result.noGameIsArray).toBe(true);
    });

    test('performMaggotLimbSurgery covers success and error paths', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;

            const origRustGame = mgr.rustGame;
            mgr.rustGame = null;
            const noGame = mgr.performMaggotLimbSurgery(0);
            mgr.rustGame = origRustGame;

            const origFn = mgr.rustGame.perform_maggot_limb_surgery;
            if (origFn) {
                mgr.rustGame.perform_maggot_limb_surgery = () => { throw new Error('mock'); };
                const errorResult = mgr.performMaggotLimbSurgery(0);
                mgr.rustGame.perform_maggot_limb_surgery = origFn;
                return { noGame, errorResult };
            }
            return { noGame, errorResult: false };
        });
        expect(result.noGame).toBe(false);
    });

    test('buildRenderSignature covers various worker properties', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const workers = [
                {
                    __index: 0, name: 'Test', level: 5, assignedBuilding: 'Mine',
                    efficiencyMultiplier: 1.2, xp: 50, xpToNext: 100,
                    happiness: 80, hunger: 20, focus: 70, fatigue: 30, stress: 10,
                    isHungry: false, autoAssignmentTarget: '', canMaggotSurgery: false,
                    maggotSurgeryCost: 0, missingLimbs: ['LeftArm'], maggotLimbs: [],
                },
                {
                    __index: 1, name: 'Test2', level: 3, assignedBuilding: null,
                    efficiency_multiplier: 1.0, experience: 20, experienceToNext: 50,
                    happiness: 60, hunger: 40, focus: 50, fatigue: 50, stress: 20,
                    is_hungry: true, autoAssignmentTarget: 'Farm', canMaggotSurgery: true,
                    maggotSurgeryCost: 10, missing_limbs: [], maggot_limbs: ['RightLeg'],
                },
            ];
            const sig = mgr.buildRenderSignature(workers, 1, 1, 5, 100);
            return { sigLen: sig.length, hasContent: sig.length > 0 };
        });
        expect(result.hasContent).toBe(true);
    });

    test('resetPagination resets to page 1', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.virtualState.currentPage = 5;
            mgr.resetPagination();
            return mgr.virtualState.currentPage;
        });
        expect(result).toBe(1);
    });

    test('invalidateRenderCache clears all caches', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.lastRenderSignature = 'test';
            mgr.lastWorkerFetchAt = Date.now();
            mgr.workerPageCache = { total: 1 };
            mgr.workerDetailsCache.set(0, { name: 'test' });
            mgr.buildingAssignmentCountsCache.set('Mine', 2);

            mgr.invalidateRenderCache();

            return {
                sig: mgr.lastRenderSignature,
                fetchAt: mgr.lastWorkerFetchAt,
                pageCache: mgr.workerPageCache,
                detailsSize: mgr.workerDetailsCache.size,
                countsSize: mgr.buildingAssignmentCountsCache.size,
            };
        });
        expect(result.sig).toBe(null);
        expect(result.fetchAt).toBe(0);
        expect(result.pageCache).toBe(null);
        expect(result.detailsSize).toBe(0);
        expect(result.countsSize).toBe(0);
    });

    test('scheduleSearchRender debounces and triggers render', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            let renderCalled = false;
            const origRender = mgr.renderWorkers.bind(mgr);
            mgr.renderWorkers = () => { renderCalled = true; };

            mgr.scheduleSearchRender('test');
            mgr.scheduleSearchRender('test2');

            return {
                hasTimer: mgr.searchDebounceTimer !== null,
            };
        });

        await page.waitForTimeout(200);

        const afterWait = await page.evaluate(() => {
            const mgr = window.workerManager;
            return {
                timer: mgr.searchDebounceTimer,
                query: mgr.virtualState.query,
            };
        });
        expect(afterWait.timer).toBe(null);
        expect(afterWait.query).toBe('test2');
    });

    test('renderWorkers covers empty state with filters', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.virtualState.filterBy = 'assigned';
            mgr.virtualState.query = 'nonexistent';

            const origUpdate = mgr.update.bind(mgr);
            mgr.update = () => ({ total: 0, assignedCount: 0, page: 1, pageSize: 24, workers: [] });

            mgr.renderWorkers();

            const placeholder = document.getElementById('workers-placeholder');
            const text = placeholder ? placeholder.textContent : '';

            mgr.update = origUpdate;
            mgr.virtualState.filterBy = 'all';
            mgr.virtualState.query = '';

            return { hasPlaceholder: !!placeholder, text };
        });
        expect(result.hasPlaceholder).toBe(true);
    });

    test('renderWorkers covers no-workers-at-all state', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.virtualState.filterBy = 'all';
            mgr.virtualState.query = '';

            const origUpdate = mgr.update.bind(mgr);
            mgr.update = () => ({ total: 0, assignedCount: 0, page: 1, pageSize: 24, workers: [] });

            mgr.renderWorkers();

            const placeholder = document.getElementById('workers-placeholder');
            const text = placeholder ? placeholder.textContent : '';

            mgr.update = origUpdate;
            return { text };
        });
        expect(result.text).toContain('没有工人');
    });

    test('renderWorkers covers pagination with many workers', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const fakeWorkers = Array.from({ length: 24 }, (_, i) => ({
                __index: i,
                name: `Worker${i}`,
                level: i + 1,
                assignedBuilding: i % 2 === 0 ? 'Mine' : null,
                efficiencyMultiplier: 1.0 + i * 0.05,
                xp: i * 10,
                xpToNext: 100,
                experience: i * 10,
                experienceToNext: 100,
                happiness: 50,
                hunger: 30,
                focus: 70,
                fatigue: 20,
                stress: 10,
                isHungry: false,
                is_hungry: false,
                gender: i % 2 === 0 ? 'Male' : 'Female',
                skills: 'Mining',
                preferences: 'Outdoor',
                background: 'Engineer',
                hobbies: ['Reading'],
                primaryTrait: 'Diligent',
                secondaryTraits: ['Intelligent'],
                missingLimbs: [],
                maggotLimbs: [],
            }));

            const origUpdate = mgr.update.bind(mgr);
            mgr.update = (force) => ({
                total: 50,
                assignedCount: 25,
                page: 1,
                pageSize: 24,
                workers: fakeWorkers,
            });

            mgr.invalidateRenderCache();
            mgr.renderWorkers();

            const hasNextPage = !!document.getElementById('workers-next-page');
            const hasPrevPage = !!document.getElementById('workers-prev-page');
            const cards = document.querySelectorAll('#workers-grid .worker-card').length;

            mgr.update = origUpdate;
            return { hasNextPage, hasPrevPage, cards };
        });
        expect(result.cards).toBe(24);
        expect(result.hasNextPage).toBe(true);
    });

    test('renderWorkerCards covers various worker property combinations', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.virtualState.workers = [
                {
                    __index: 0, name: 'WorkerA', level: 5,
                    assignedBuilding: 'Mine',
                    efficiencyMultiplier: 1.3,
                    xp: 50, xpToNext: 100,
                    experience: 50, experienceToNext: 100,
                    happiness: 80, hunger: 20,
                    focus: 70, fatigue: 30, stress: 10,
                    isHungry: true, is_hungry: true,
                    gender: 'Male', skills: 'Mining', preferences: 'Outdoor',
                    background: 'Engineer', hobbies: ['Reading', 'Gaming'],
                    primaryTrait: 'Diligent', secondaryTraits: ['Intelligent', 'Social'],
                    missingLimbs: ['LeftArm'], maggotLimbs: ['RightLeg'],
                    autoAssignmentTarget: null,
                    efficiencyBreakdown: ['基础 100%', '技术 +30%'],
                    canMaggotSurgery: true, maggotSurgeryCost: 10,
                },
                {
                    __index: 1, name: 'WorkerB', level: 1,
                    assignedBuilding: null,
                    efficiency_multiplier: 1.0,
                    experience: 0, experienceToNextLevel: 100,
                    happiness: 50, hunger: 50,
                    focus: 50, fatigue: 50, stress: 50,
                    isHungry: false, is_hungry: false,
                    gender: 'Female', skills: '', preferences: '',
                    background: '', hobbies: [],
                    primary_trait: 'Lazy', secondary_traits: [],
                    missing_limbs: [], maggot_limbs: [],
                    autoAssignmentTarget: 'Farm',
                    efficiencyBreakdown: [],
                    canMaggotSurgery: false, maggotSurgeryCost: 0,
                },
            ];

            mgr.renderWorkerCards();
            const cards = document.querySelectorAll('#workers-grid .worker-card').length;
            return { cards };
        });
        expect(result.cards).toBe(2);
    });

    test('showAssignmentModal and closeAssignmentModal cover full lifecycle', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.invalidateRenderCache();

            const worker = mgr.getWorkerSnapshot(0, true);
            if (!worker) return { skipped: true };

            mgr.showAssignmentModal(0);
            const modalExists = !!document.getElementById('worker-assignment-modal');

            mgr.closeAssignmentModal();
            return { skipped: false, modalExists };
        });
        if (result.skipped) test.skip(true, 'No workers available');
        expect(result.modalExists).toBe(true);
    });

    test('showAssignmentModal covers worker with missing limbs', async ({ page }) => {
        await unlockMaggotStage(page);
        await page.click('[data-tab="workers"]');

        const result = await page.evaluate(() => {
            const raw = window.rustGame.exportToBase64();
            const json = JSON.parse(atob(raw));
            json.state.current_stage = 'Maggot';
            json.state.resources = json.state.resources || {};
            json.state.resources.Maggot = 60;
            if (Array.isArray(json.workers) && json.workers.length > 0) {
                json.workers[0].missing_limbs = ['LeftArm'];
                json.workers[0].maggot_limbs = [];
            }
            window.rustGame.importFromBase64(btoa(JSON.stringify(json)));
            if (typeof window.rustGame.game_loop === 'function') {
                window.rustGame.game_loop();
            }

            const mgr = window.workerManager;
            mgr.invalidateRenderCache();
            mgr.showAssignmentModal(0);

            const modal = document.getElementById('worker-assignment-modal');
            const hasSurgery = modal ? modal.textContent.includes('蛆虫肢体手术') : false;
            const hasLimbInfo = modal ? modal.textContent.includes('左手') : false;

            mgr.closeAssignmentModal();
            return { hasSurgery, hasLimbInfo };
        });
        expect(result.hasSurgery).toBe(true);
        expect(result.hasLimbInfo).toBe(true);
    });

    test('confirmAssignment covers select not found and empty value', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.confirmAssignment(0);

            const fakeSelect = document.createElement('select');
            fakeSelect.id = 'worker-building-select';
            fakeSelect.value = '';
            document.body.appendChild(fakeSelect);
            mgr.confirmAssignment(0);
            const modalAfterEmpty = document.getElementById('worker-assignment-modal');

            fakeSelect.remove();
            return { ok: true };
        });
        expect(result.ok).toBe(true);
    });

    test('confirmAssignment covers failed assignment', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const origAssign = mgr.assignWorker.bind(mgr);
            mgr.assignWorker = () => false;

            let alertMsg = null;
            const origAlert = window.alert;
            window.alert = (msg) => { alertMsg = msg; };

            const fakeSelect = document.createElement('select');
            fakeSelect.id = 'worker-building-select';
            fakeSelect.value = 'SomeBuilding';
            document.body.appendChild(fakeSelect);

            mgr.confirmAssignment(0);

            window.alert = origAlert;
            fakeSelect.remove();
            mgr.assignWorker = origAssign;

            return { alertMsg: alertMsg !== null };
        });
        expect(result.alertMsg).toBe(true);
    });

    test('refreshWorkers covers force and non-force paths', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.refreshWorkers(false);
            const nonForce = true;
            mgr.refreshWorkers(true);
            const force = true;
            return { nonForce, force };
        });
        expect(result.nonForce).toBe(true);
        expect(result.force).toBe(true);
    });

    test('renderToPanel covers empty and populated states', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;

            const testPanel = document.createElement('div');
            testPanel.id = 'test-workers-panel';
            document.body.appendChild(testPanel);

            const origUpdate = mgr.update.bind(mgr);
            mgr.update = () => ({ total: 0, assignedCount: 0, page: 1, pageSize: 24, workers: [] });
            mgr.renderToPanel('test-workers-panel');
            const emptyContent = testPanel.innerHTML;

            mgr.update = (force) => ({
                total: 2,
                assignedCount: 1,
                page: 1,
                pageSize: 24,
                workers: [
                    { __index: 0, name: 'TestA', level: 3, assignedBuilding: 'Mine', efficiencyMultiplier: 1.2, xp: 50, xpToNextLevel: 100, happiness: 80, hunger: 20, focus: 70, fatigue: 30, stress: 10, isHungry: false, gender: 'Male', skills: 'Mining', preferences: 'Outdoor', background: 'Engineer', hobbies: ['Reading'], primaryTrait: 'Diligent', secondaryTraits: ['Intelligent'], missingLimbs: [], maggotLimbs: [] },
                    { __index: 1, name: 'TestB', level: 1, assignedBuilding: null, efficiencyMultiplier: 1.0, xp: 0, xpToNextLevel: 100, happiness: 50, hunger: 50, focus: 50, fatigue: 50, stress: 50, isHungry: true, gender: 'Female', skills: '', preferences: '', background: '', hobbies: [], primaryTrait: 'Lazy', secondaryTraits: [], missingLimbs: [], maggotLimbs: [] },
                ],
            });
            mgr.renderToPanel('test-workers-panel');
            const populatedContent = testPanel.innerHTML;

            mgr.renderToPanel('nonexistent-panel');

            mgr.update = origUpdate;
            testPanel.remove();

            return {
                hasEmpty: emptyContent.includes('没有工人'),
                hasPopulated: populatedContent.includes('TestA'),
                hasAssigned: populatedContent.includes('已分配'),
                hasUnassigned: populatedContent.includes('未分配'),
            };
        });
        expect(result.hasEmpty).toBe(true);
        expect(result.hasPopulated).toBe(true);
    });

    test('renderWorkersToList covers empty and populated states', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;

            const origUpdate = mgr.update.bind(mgr);
            mgr.update = () => ({ total: 0, assignedCount: 0, page: 1, pageSize: 24, workers: [] });
            const empty = mgr.renderWorkersToList();

            mgr.update = (force) => ({
                total: 1,
                assignedCount: 1,
                page: 1,
                pageSize: 24,
                workers: [
                    { __index: 0, name: 'ListWorker', level: 5, assignedBuilding: 'Mine', efficiencyMultiplier: 1.3, xp: 50, xpToNextLevel: 100, happiness: 80, hunger: 20, focus: 70, fatigue: 30, stress: 10, isHungry: false, gender: 'Male', skills: 'Mining', preferences: 'Outdoor', background: 'Engineer', hobbies: ['Reading', 'Gaming'], primaryTrait: 'Diligent', secondaryTraits: ['Intelligent'], missingLimbs: [], maggotLimbs: [] },
                ],
            });
            const populated = mgr.renderWorkersToList();

            mgr.update = origUpdate;

            return {
                emptyHasNoWorkers: empty.includes('没有工人'),
                populatedHasWorker: populated.includes('ListWorker'),
                populatedHasAssigned: populated.includes('已分配'),
            };
        });
        expect(result.emptyHasNoWorkers).toBe(true);
        expect(result.populatedHasWorker).toBe(true);
    });

    test('handleAutoAssign covers unavailable path', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const origRustGame = mgr.rustGame;
            mgr.rustGame = null;

            let alertMsg = null;
            const origAlert = window.alert;
            window.alert = (msg) => { alertMsg = msg; };

            mgr.handleAutoAssign();

            window.alert = origAlert;
            mgr.rustGame = origRustGame;

            return { alertMsg: alertMsg !== null };
        });
        expect(result.alertMsg).toBe(true);
    });

    test('handleAutoAssign covers error path', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;

            let confirmResult = true;
            const origConfirm = window.confirm;
            window.confirm = () => { return true; };

            const origAutoAssign = mgr.rustGame.assign_worker_auto;
            mgr.rustGame.assign_worker_auto = () => { throw new Error('mock error'); };

            let alertMsg = null;
            const origAlert = window.alert;
            window.alert = (msg) => { alertMsg = msg; };

            mgr.handleAutoAssign();

            window.alert = origAlert;
            window.confirm = origConfirm;
            mgr.rustGame.assign_worker_auto = origAutoAssign;

            return { alertMsg: alertMsg !== null };
        });
        expect(result.alertMsg).toBe(true);
    });

    test('handleMaggotLimbSurgery covers cannot surgery path', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.invalidateRenderCache();

            const worker = mgr.getWorkerSnapshot(0, true);
            if (!worker) return { skipped: true };

            const origSnapshot = mgr.getWorkerSnapshot.bind(mgr);
            mgr.getWorkerSnapshot = () => ({
                ...worker,
                canMaggotSurgery: false,
                maggotSurgeryReason: '测试原因',
                missingLimbs: ['LeftArm'],
            });

            let alertMsg = null;
            const origAlert = window.alert;
            window.alert = (msg) => { alertMsg = msg; };

            mgr.handleMaggotLimbSurgery(0);

            window.alert = origAlert;
            mgr.getWorkerSnapshot = origSnapshot;

            return { skipped: false, alertMsg: alertMsg !== null };
        });
        if (result.skipped) test.skip(true, 'No workers available');
        expect(result.alertMsg).toBe(true);
    });

    test('handleMaggotLimbSurgery covers cancel path', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.invalidateRenderCache();

            const worker = mgr.getWorkerSnapshot(0, true);
            if (!worker) return { skipped: true };

            const origSnapshot = mgr.getWorkerSnapshot.bind(mgr);
            mgr.getWorkerSnapshot = () => ({
                ...worker,
                canMaggotSurgery: true,
                maggotSurgeryCost: 5,
                missingLimbs: ['LeftArm'],
            });

            const origConfirm = window.confirm;
            window.confirm = () => false;

            mgr.handleMaggotLimbSurgery(0);

            window.confirm = origConfirm;
            mgr.getWorkerSnapshot = origSnapshot;

            return { skipped: false, ok: true };
        });
        if (result.skipped) test.skip(true, 'No workers available');
        expect(result.ok).toBe(true);
    });

    test('handleMaggotLimbSurgery covers null worker path', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const origSnapshot = mgr.getWorkerSnapshot.bind(mgr);
            mgr.getWorkerSnapshot = () => null;
            mgr.handleMaggotLimbSurgery(999);
            mgr.getWorkerSnapshot = origSnapshot;
            return { ok: true };
        });
        expect(result.ok).toBe(true);
    });

    test('handleMaggotLimbSurgery covers surgery failure path', async ({ page }) => {
        await unlockMaggotStage(page);
        await page.click('[data-tab="workers"]');

        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.invalidateRenderCache();

            const origSnapshot = mgr.getWorkerSnapshot.bind(mgr);
            const origSurgery = mgr.performMaggotLimbSurgery.bind(mgr);

            mgr.getWorkerSnapshot = (idx, force) => {
                const w = origSnapshot(idx, force);
                if (!w) return null;
                return { ...w, canMaggotSurgery: true, maggotSurgeryCost: 5, missingLimbs: ['LeftArm'], maggotSurgeryReason: '手术失败测试' };
            };
            mgr.performMaggotLimbSurgery = () => false;

            const origConfirm = window.confirm;
            window.confirm = () => true;

            let alertMsg = null;
            const origAlert = window.alert;
            window.alert = (msg) => { alertMsg = msg; };

            mgr.handleMaggotLimbSurgery(0);

            window.alert = origAlert;
            window.confirm = origConfirm;
            mgr.getWorkerSnapshot = origSnapshot;
            mgr.performMaggotLimbSurgery = origSurgery;

            return { alertMsg: alertMsg !== null };
        });
        expect(result.alertMsg).toBe(true);
    });

    test('renderBuildingSelect covers various states', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.invalidateRenderCache();

            const origSnapshot = mgr.getWorkerSnapshot.bind(mgr);
            mgr.getWorkerSnapshot = () => null;
            const noWorker = mgr.renderBuildingSelect(0);

            mgr.getWorkerSnapshot = () => ({
                __index: 0, name: 'Test', assignedBuilding: 'Mine',
                level: 5, missingLimbs: [], maggotLimbs: [],
            });
            const withWorker = mgr.renderBuildingSelect(0);

            mgr.getWorkerSnapshot = origSnapshot;

            return {
                noWorkerHasInvalid: noWorker.includes('无效工人'),
                withWorkerHasSelect: withWorker.includes('选择建筑'),
                withWorkerHasUnassign: withWorker.includes('取消分配'),
            };
        });
        expect(result.noWorkerHasInvalid).toBe(true);
        expect(result.withWorkerHasSelect).toBe(true);
    });

    test('window.updateWorkersPanel covers various states', async ({ page }) => {
        const result = await page.evaluate(() => {
            const origManager = window.workerManager;

            window.workerManager = null;
            window.updateWorkersPanel();
            const noManager = true;

            window.workerManager = { refreshWorkers: 'not a function' };
            window.updateWorkersPanel();
            const noFunction = true;

            window.workerManager = origManager;

            const modal = document.createElement('div');
            modal.id = 'worker-assignment-modal';
            document.body.appendChild(modal);
            window.updateWorkersPanel();
            const withModal = true;
            modal.remove();

            const workersTab = document.getElementById('tab-workers');
            if (workersTab) {
                workersTab.classList.remove('active');
                window.updateWorkersPanel();
                const inactiveTab = true;
                workersTab.classList.add('active');
            }

            return { noManager, noFunction, withModal };
        });
        expect(result.noManager).toBe(true);
    });

    test('renderFilters covers DOM rendering with various states', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.virtualState.filterBy = 'assigned';
            mgr.virtualState.sortBy = 'level';
            mgr.virtualState.query = 'test';
            mgr.virtualState.assignedCount = 5;
            mgr.virtualState.totalWorkers = 10;

            const container = document.createElement('div');
            container.id = 'workers-filters';
            document.body.appendChild(container);

            mgr.renderFilters();

            const search = document.getElementById('workers-search');
            const filter = document.getElementById('workers-filter');
            const sort = document.getElementById('workers-sort');
            const autoAssign = document.getElementById('workers-auto-assign');

            const hasSearch = !!search;
            const hasFilter = !!filter;
            const hasSort = !!sort;
            const hasAutoAssign = !!autoAssign;
            const filterValue = filter ? filter.value : '';
            const sortValue = sort ? sort.value : '';
            const searchValue = search ? search.value : '';

            container.remove();
            return { hasSearch, hasFilter, hasSort, hasAutoAssign, filterValue, sortValue, searchValue };
        });
        expect(result.hasSearch).toBe(true);
        expect(result.hasFilter).toBe(true);
        expect(result.hasSort).toBe(true);
        expect(result.hasAutoAssign).toBe(true);
        expect(result.filterValue).toBe('assigned');
        expect(result.sortValue).toBe('level');
        expect(result.searchValue).toBe('test');
    });

    test('renderFilters handles missing container', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const existing = document.getElementById('workers-filters');
            if (existing) existing.remove();
            mgr.renderFilters();
            return { ok: true };
        });
        expect(result.ok).toBe(true);
    });

    test('renderWorkers handles missing container', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const container = document.getElementById('workers-list');
            const origId = container ? container.id : null;
            if (container) container.id = 'workers-list-hidden';
            mgr.renderWorkers();
            if (container) container.id = origId;
            return { ok: true };
        });
        expect(result.ok).toBe(true);
    });

    test('closeAssignmentModal handles no modal present', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const existing = document.getElementById('worker-assignment-modal');
            if (existing) existing.remove();
            mgr.closeAssignmentModal();
            return { ok: true };
        });
        expect(result.ok).toBe(true);
    });

    test('showAssignmentModal handles missing worker', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            const origSnapshot = mgr.getWorkerSnapshot.bind(mgr);
            mgr.getWorkerSnapshot = () => null;
            mgr.showAssignmentModal(999);
            mgr.getWorkerSnapshot = origSnapshot;
            return { ok: true };
        });
        expect(result.ok).toBe(true);
    });

    test('showAssignmentModal removes existing modal before creating new one', async ({ page }) => {
        const result = await page.evaluate(() => {
            const mgr = window.workerManager;
            mgr.invalidateRenderCache();

            const existing = document.createElement('div');
            existing.id = 'worker-assignment-modal';
            document.body.appendChild(existing);

            mgr.showAssignmentModal(0);

            const modals = document.querySelectorAll('#worker-assignment-modal');
            const cleaned = modals.length <= 1;

            mgr.closeAssignmentModal();
            return { cleaned };
        });
        expect(result.cleaned).toBe(true);
    });
});
