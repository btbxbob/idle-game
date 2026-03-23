class WorkerManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.virtualState = {
            sortBy: 'name',
            filterBy: 'all',
            query: '',
            workers: [],
            pageSize: 24,
            currentPage: 1,
        };
        this.lastRenderSignature = null;
        this.searchDebounceTimer = null;
        this.workerPageCache = null;
        this.workerDetailsCache = new Map();
        this.buildingAssignmentCountsCache = new Map();
        this.lastWorkerFetchAt = 0;
        this.workerRefreshIntervalMs = 2500;
    }

    resetPagination() {
        this.virtualState.currentPage = 1;
    }

    invalidateRenderCache() {
        this.lastRenderSignature = null;
        this.lastWorkerFetchAt = 0;
        this.workerPageCache = null;
        this.workerDetailsCache.clear();
        this.buildingAssignmentCountsCache.clear();
    }

    scheduleSearchRender(nextQuery) {
        const normalizedQuery = String(nextQuery || '');
        if (this.searchDebounceTimer) {
            window.clearTimeout(this.searchDebounceTimer);
        }

        this.searchDebounceTimer = window.setTimeout(() => {
            this.searchDebounceTimer = null;
            this.virtualState.query = normalizedQuery;
            this.resetPagination();
            this.invalidateRenderCache();
            this.renderWorkers();
        }, 120);
    }

    buildRenderSignature(workers, assignedCount, currentPage, totalPages, totalWorkers) {
        const visibleSignature = workers.map((worker) => {
            const missingLimbs = Array.isArray(worker.missingLimbs)
                ? worker.missingLimbs.join(',')
                : (Array.isArray(worker.missing_limbs) ? worker.missing_limbs.join(',') : '');
            const maggotLimbs = Array.isArray(worker.maggotLimbs)
                ? worker.maggotLimbs.join(',')
                : (Array.isArray(worker.maggot_limbs) ? worker.maggot_limbs.join(',') : '');

            return [
                worker.__index,
                worker.name || '',
                worker.level || 0,
                worker.assignedBuilding || '',
                worker.efficiencyMultiplier || worker.efficiency_multiplier || 0,
                worker.xp || worker.experience || 0,
                worker.xpToNext || worker.experienceToNext || worker.xpToNextLevel || 0,
                worker.happiness || 0,
                worker.hunger || 0,
                worker.focus || 0,
                worker.fatigue || 0,
                worker.stress || 0,
                worker.isHungry || worker.is_hungry || false,
                worker.autoAssignmentTarget || '',
                worker.canMaggotSurgery || false,
                worker.maggotSurgeryCost || 0,
                missingLimbs,
                maggotLimbs,
            ].join('|');
        }).join('||');

        return [
            this.virtualState.query,
            this.virtualState.filterBy,
            this.virtualState.sortBy,
            totalWorkers,
            assignedCount,
            currentPage,
            totalPages,
            visibleSignature,
        ].join('###');
    }

    /**
     * Get workers from Rust game state
     * @returns {Array} Array of worker objects
     */
    update(force = false) {
        const now = Date.now();
        if (!force && now - this.lastWorkerFetchAt < this.workerRefreshIntervalMs && this.workerPageCache) {
            return this.workerPageCache;
        }

        const requestedPage = Math.max(1, this.virtualState.currentPage || 1);
        const pageSize = Math.max(1, this.virtualState.pageSize || 24);

        if (this.rustGame && typeof this.rustGame.get_worker_page === 'function') {
            try {
                const pageData = this.rustGame.get_worker_page(
                    this.virtualState.query || '',
                    this.virtualState.filterBy || 'all',
                    this.virtualState.sortBy || 'name',
                    requestedPage,
                    pageSize,
                );
                this.workerPageCache = pageData || { total: 0, assignedCount: 0, page: requestedPage, pageSize, workers: [] };
                this.lastWorkerFetchAt = now;
                return this.workerPageCache;
            } catch (error) {
                console.error('Failed to get worker page:', error);
                return this.workerPageCache || { total: 0, assignedCount: 0, page: requestedPage, pageSize, workers: [] };
            }
        }

        if (this.rustGame && typeof this.rustGame.get_worker_summaries === 'function') {
            try {
                const workers = this.rustGame.get_worker_summaries() || [];
                const filtered = this.getProcessedWorkersFallback(workers);
                const total = filtered.length;
                const start = (requestedPage - 1) * pageSize;
                const pageWorkers = filtered.slice(start, start + pageSize);
                this.workerPageCache = {
                    total,
                    assignedCount: filtered.filter((worker) => worker.assignedBuilding !== null && worker.assignedBuilding !== undefined).length,
                    page: requestedPage,
                    pageSize,
                    workers: pageWorkers,
                };
                this.lastWorkerFetchAt = now;
                return this.workerPageCache;
            } catch (error) {
                console.error('Failed to get worker summaries:', error);
                return this.workerPageCache || { total: 0, assignedCount: 0, page: requestedPage, pageSize, workers: [] };
            }
        }

        if (this.rustGame && typeof this.rustGame.get_workers === 'function') {
            try {
                const workers = this.rustGame.get_workers();
                const filtered = this.getProcessedWorkersFallback(workers || []);
                const total = filtered.length;
                const start = (requestedPage - 1) * pageSize;
                const pageWorkers = filtered.slice(start, start + pageSize);
                this.workerPageCache = {
                    total,
                    assignedCount: filtered.filter((worker) => worker.assignedBuilding !== null && worker.assignedBuilding !== undefined).length,
                    page: requestedPage,
                    pageSize,
                    workers: pageWorkers,
                };
                this.lastWorkerFetchAt = now;
                return this.workerPageCache;
            } catch (error) {
                console.error('Failed to get workers:', error);
                return this.workerPageCache || { total: 0, assignedCount: 0, page: requestedPage, pageSize, workers: [] };
            }
        }

        return this.workerPageCache || { total: 0, assignedCount: 0, page: requestedPage, pageSize, workers: [] };
    }

    getProcessedWorkersFallback(rawWorkers) {
        const query = this.virtualState.query.trim().toLowerCase();
        const filterBy = this.virtualState.filterBy;
        const sortBy = this.virtualState.sortBy;
        const mapped = (Array.isArray(rawWorkers) ? rawWorkers : []).map((worker, index) => ({ ...worker, __index: worker.index ?? index }));
        const filtered = mapped.filter((worker) => {
            const isAssigned = worker.assignedBuilding !== null && worker.assignedBuilding !== undefined;
            if (filterBy === 'assigned' && !isAssigned) return false;
            if (filterBy === 'unassigned' && isAssigned) return false;
            if (!query) return true;
            const haystack = `${worker.name} ${worker.skills} ${worker.preferences} ${worker.assignedBuilding || ''}`.toLowerCase();
            return haystack.includes(query);
        });

        filtered.sort((a, b) => {
            if (sortBy === 'level') return (b.level || 0) - (a.level || 0);
            if (sortBy === 'efficiency') return (b.efficiencyMultiplier || 0) - (a.efficiencyMultiplier || 0);
            return String(a.name || '').localeCompare(String(b.name || ''));
        });

        return filtered;
    }

    getWorkerDetails(workerIndex, force = false) {
        const cacheKey = Number(workerIndex);
        if (!force && this.workerDetailsCache.has(cacheKey)) {
            return this.workerDetailsCache.get(cacheKey);
        }

        if (this.rustGame && typeof this.rustGame.get_worker_details === 'function') {
            try {
                const details = this.rustGame.get_worker_details(cacheKey);
                if (details) {
                    this.workerDetailsCache.set(cacheKey, details);
                    return details;
                }
            } catch (error) {
                console.error('Failed to get worker details:', error);
            }
        }

        return null;
    }

    getWorkerSnapshot(workerIndex, force = false) {
        const details = this.getWorkerDetails(workerIndex, force);
        if (details) {
            return details;
        }

        const pageData = this.update(force);
        const workers = Array.isArray(pageData.workers) ? pageData.workers : [];
        const targetIndex = Number(workerIndex);
        return workers.find((worker) => Number(worker.__index ?? worker.index) === targetIndex) || null;
    }

    /**
     * Assign a worker to a building
     * @param {number} workerIndex - Index of the worker
     * @param {string} buildingId - ID/name of the building
     * @returns {boolean} Success status
     */
    assignWorker(workerIndex, buildingId) {
        if (this.rustGame && typeof this.rustGame.assign_worker === 'function') {
            try {
                return this.rustGame.assign_worker(workerIndex, buildingId);
            } catch (error) {
                console.error('Failed to assign worker:', error);
                return false;
            }
        }
        return false;
    }

    /**
     * Get buildings from Rust game state for selection
     * @returns {Array} Array of building objects
     */
    getBuildings() {
        if (this.rustGame && typeof this.rustGame.get_buildings === 'function') {
            try {
                const buildings = this.rustGame.get_buildings();
                return buildings || [];
            } catch (error) {
                console.error('Failed to get buildings:', error);
                return [];
            }
        }
        return [];
    }

    getBuildingAssignmentCounts(force = false) {
        if (!force && this.buildingAssignmentCountsCache.size > 0) {
            return this.buildingAssignmentCountsCache;
        }

        const counts = new Map();
        if (this.rustGame && typeof this.rustGame.get_building_assignment_counts === 'function') {
            try {
                const entries = this.rustGame.get_building_assignment_counts() || [];
                entries.forEach((entry) => {
                    counts.set(entry.name, Number(entry.assignedCount || 0));
                });
            } catch (error) {
                console.error('Failed to get building assignment counts:', error);
            }
        }

        this.buildingAssignmentCountsCache = counts;
        return counts;
    }

    /**
     * Format efficiency multiplier as percentage
     * @param {number} multiplier - Efficiency multiplier (e.g., 1.0, 1.2)
     * @returns {string} Formatted percentage string
     */
    formatEfficiency(multiplier) {
        const bonus = (multiplier - 1.0) * 100;
        return bonus >= 0 ? `+${bonus.toFixed(0)}%` : `${bonus.toFixed(0)}%`;
    }

    /**
     * Format XP progress
     * @param {number} xp - Current XP
     * @param {number} xpToNext - XP needed for next level
     * @returns {string} Formatted XP string
     */
    formatXP(xp, xpToNext) {
        return `${Math.floor(xp)} / ${Math.floor(xpToNext)}`;
    }

    getTranslator() {
        return window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
    }

    getI18n() {
        return window.i18n || null;
    }

    formatStatusLabel(worker) {
        const i18n = this.getI18n();
        if (i18n && typeof i18n.getWorkerStatusLabel === 'function') {
            return i18n.getWorkerStatusLabel(worker.isHungry || worker.is_hungry);
        }

        const t = this.getTranslator();
        return worker.isHungry || worker.is_hungry ? (t('hungryStatus') || '饥饿中') : (t('stableStatus') || '状态稳定');
    }

    getWorkerStateSummary(worker) {
        const focus = Number(worker.focus || 0).toFixed(0);
        const fatigue = Number(worker.fatigue || 0).toFixed(0);
        const stress = Number(worker.stress || 0).toFixed(0);
        return `专注 ${focus} / 疲劳 ${fatigue} / 压力 ${stress}`;
    }

    getWorkerLimbSummary(worker) {
        const missing = Array.isArray(worker.missingLimbs) ? worker.missingLimbs : (Array.isArray(worker.missing_limbs) ? worker.missing_limbs : []);
        const maggot = Array.isArray(worker.maggotLimbs) ? worker.maggotLimbs : (Array.isArray(worker.maggot_limbs) ? worker.maggot_limbs : []);

        if (missing.length === 0 && maggot.length === 0) {
            return '肢体完整';
        }

        const parts = [];
        if (missing.length > 0) {
            parts.push(`残疾 ${missing.map((limb) => this.getLimbLabel(limb)).join(' / ')}`);
        }
        if (maggot.length > 0) {
            parts.push(`蛆虫肢体 ${maggot.map((limb) => this.getLimbLabel(limb)).join(' / ')}`);
        }
        return parts.join(' / ');
    }

    getLimbLabel(limb) {
        const map = {
            LeftArm: '左手',
            RightArm: '右手',
            LeftLeg: '左腿',
            RightLeg: '右腿',
            '左手': '左手',
            '右手': '右手',
            '左腿': '左腿',
            '右腿': '右腿',
        };
        return map[limb] || String(limb || '未知肢体');
    }

    performMaggotLimbSurgery(workerIndex) {
        if (this.rustGame && typeof this.rustGame.perform_maggot_limb_surgery === 'function') {
            try {
                return this.rustGame.perform_maggot_limb_surgery(workerIndex);
            } catch (error) {
                console.error('Failed to perform maggot limb surgery:', error);
                return false;
            }
        }
        return false;
    }

    getBuildingAssignmentState(buildings, currentWorker) {
        const assignedCounts = this.getBuildingAssignmentCounts(true);
        const currentBuilding = currentWorker && currentWorker.assignedBuilding ? currentWorker.assignedBuilding : null;

        return (Array.isArray(buildings) ? buildings : []).map((building) => {
            const assignedCount = assignedCounts.get(building.name) || 0;
            const reservedCurrent = currentBuilding === building.name ? 1 : 0;
            const availableSlots = Math.max(0, Number(building.count || 0) - assignedCount + reservedCurrent);
            return {
                ...building,
                assignedCount,
                availableSlots,
                isFull: availableSlots <= 0,
            };
        });
    }

    renderWorkers() {
        const container = document.getElementById('workers-list');
        if (!container) {
            console.warn('Workers container "workers-list" not found');
            return;
        }

        const pageData = this.update();
        const workers = Array.isArray(pageData.workers) ? pageData.workers : [];
        const t = this.getTranslator();
        const totalWorkers = Number(pageData.total || 0);
        const assignedCount = Number(pageData.assignedCount || 0);

        if (totalWorkers === 0) {
            this.virtualState.workers = [];
            this.virtualState.currentPage = 1;
            this.invalidateRenderCache();
            const noMatchMessage = (this.virtualState.filterBy !== 'all' || this.virtualState.query)
                ? (t('noWorkersMatchFilter') || '没有符合筛选条件的工人')
                : (t('noWorkers') || '没有工人');
            container.innerHTML = `
                <div class="workers-tools">
                    <input id="workers-search" class="workers-search" type="text" value="${this.escapeHtml(this.virtualState.query)}" placeholder="${t('search') || '搜索工人'}" />
                    <select id="workers-filter" class="workers-filter">
                        <option value="all" ${this.virtualState.filterBy === 'all' ? 'selected' : ''}>${t('all') || '全部'}</option>
                        <option value="assigned" ${this.virtualState.filterBy === 'assigned' ? 'selected' : ''}>${t('assigned') || '已分配'}</option>
                        <option value="unassigned" ${this.virtualState.filterBy === 'unassigned' ? 'selected' : ''}>${t('unassigned') || '未分配'}</option>
                    </select>
                    <select id="workers-sort" class="workers-sort">
                        <option value="name" ${this.virtualState.sortBy === 'name' ? 'selected' : ''}>${t('name') || '姓名'}</option>
                        <option value="level" ${this.virtualState.sortBy === 'level' ? 'selected' : ''}>${t('level') || '等级'}</option>
                        <option value="efficiency" ${this.virtualState.sortBy === 'efficiency' ? 'selected' : ''}>${t('efficiency') || '效率'}</option>
                    </select>
                    <button id="workers-auto-assign" class="workers-auto-assign" type="button">${t('autoAssign') || '自动分配'}</button>
                    <span class="workers-count">${t('totalWorkers') || '总工人'}: ${assignedCount} / ${assignedCount}</span>
                </div>
                <p id="workers-placeholder">${noMatchMessage}</p>
            `;
            this.bindToolsEvents(container);
            return;
        }

        this.virtualState.workers = workers;

        const totalPages = Math.max(1, Math.ceil(totalWorkers / this.virtualState.pageSize));
        const currentPage = Math.min(Number(pageData.page || this.virtualState.currentPage), totalPages);
        this.virtualState.currentPage = currentPage;
        const pageStart = (currentPage - 1) * this.virtualState.pageSize;
        const pageEnd = Math.min(totalWorkers, pageStart + workers.length);
        const renderSignature = this.buildRenderSignature(
            workers,
            assignedCount,
            currentPage,
            totalPages,
            totalWorkers,
        );

        if (this.lastRenderSignature === renderSignature) {
            return;
        }

        this.lastRenderSignature = renderSignature;
        const shownStart = pageStart + 1;
        const shownEnd = pageEnd;
        const shownLabel = `${t('workersShown') || '已显示'} ${shownStart}-${shownEnd} / ${totalWorkers}`;
        const pageStatusLabel = t('workersPageStatus', { current: currentPage, total: totalPages }) || `第 ${currentPage} / ${totalPages} 页`;
        container.innerHTML = `
            <div class="workers-tools">
                <input id="workers-search" class="workers-search" type="text" value="${this.escapeHtml(this.virtualState.query)}" placeholder="${t('search') || '搜索工人'}" />
                <select id="workers-filter" class="workers-filter">
                    <option value="all" ${this.virtualState.filterBy === 'all' ? 'selected' : ''}>${t('all') || '全部'}</option>
                    <option value="assigned" ${this.virtualState.filterBy === 'assigned' ? 'selected' : ''}>${t('assigned') || '已分配'}</option>
                    <option value="unassigned" ${this.virtualState.filterBy === 'unassigned' ? 'selected' : ''}>${t('unassigned') || '未分配'}</option>
                </select>
                <select id="workers-sort" class="workers-sort">
                    <option value="name" ${this.virtualState.sortBy === 'name' ? 'selected' : ''}>${t('name') || '姓名'}</option>
                    <option value="level" ${this.virtualState.sortBy === 'level' ? 'selected' : ''}>${t('level') || '等级'}</option>
                    <option value="efficiency" ${this.virtualState.sortBy === 'efficiency' ? 'selected' : ''}>${t('efficiency') || '效率'}</option>
                </select>
                <button id="workers-auto-assign" class="workers-auto-assign" type="button">${t('autoAssign') || '自动分配'}</button>
                <span class="workers-count">${t('totalWorkers') || '总工人'}: ${totalWorkers} / ${assignedCount}</span>
                <span class="workers-visible-count">${shownLabel}</span>
            </div>
            <div id="workers-grid" class="workers-grid"></div>
            ${totalWorkers > this.virtualState.pageSize ? `
                <div class="workers-pagination">
                    <button id="workers-prev-page" class="workers-page-btn" type="button" ${currentPage <= 1 ? 'disabled' : ''}>${t('workersPrevPage') || '上一页'}</button>
                    <span class="workers-page-status">${pageStatusLabel}</span>
                    <button id="workers-next-page" class="workers-page-btn" type="button" ${currentPage >= totalPages ? 'disabled' : ''}>${t('workersNextPage') || '下一页'}</button>
                </div>
            ` : ''}
        `;

        const search = document.getElementById('workers-search');
        const filter = document.getElementById('workers-filter');
        const sort = document.getElementById('workers-sort');
        const autoAssign = document.getElementById('workers-auto-assign');
        const prevPage = document.getElementById('workers-prev-page');
        const nextPage = document.getElementById('workers-next-page');

        if (search) {
            search.addEventListener('input', (e) => {
                this.scheduleSearchRender(e.target.value || '');
            });
        }
        if (filter) {
            filter.addEventListener('change', (e) => {
                this.virtualState.filterBy = e.target.value || 'all';
                this.resetPagination();
                this.invalidateRenderCache();
                this.renderWorkers();
            });
        }
        if (sort) {
            sort.addEventListener('change', (e) => {
                this.virtualState.sortBy = e.target.value || 'name';
                this.resetPagination();
                this.invalidateRenderCache();
                this.renderWorkers();
            });
        }
        if (autoAssign) {
            autoAssign.addEventListener('click', () => {
                this.handleAutoAssign();
            });
        }
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                this.virtualState.currentPage = Math.max(1, this.virtualState.currentPage - 1);
                this.invalidateRenderCache();
                this.renderWorkers();
            });
        }
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                const maxPage = Math.max(1, Math.ceil(totalWorkers / this.virtualState.pageSize));
                this.virtualState.currentPage = Math.min(maxPage, this.virtualState.currentPage + 1);
                this.invalidateRenderCache();
                this.renderWorkers();
            });
        }

        this.renderWorkerCards();
    }

    handleAutoAssign() {
        const t = this.getTranslator();

        if (!this.rustGame || typeof this.rustGame.assign_worker_auto !== 'function') {
            alert(t('autoAssignUnavailable') || '自动分配功能不可用');
            return;
        }

        const confirmed = window.confirm(t('autoAssignConfirm') || '将重新为全部工人执行自动安排，并优先选择收益最高且有空位的岗位，是否继续？');
        if (!confirmed) return;

        try {
            const assignedCount = this.rustGame.assign_worker_auto();
            this.invalidateRenderCache();
            this.renderWorkers();
            if (window.updateResourceDisplay) {
                window.updateResourceDisplay();
            }
            alert(t('autoAssignSuccess', { count: assignedCount }) || `自动安排完成：已为 ${assignedCount} 名工人选择当前最佳岗位`);
        } catch (error) {
            console.error('Auto assignment failed:', error);
            alert(t('autoAssignFailed') || '自动分配失败，请稍后重试');
        }
    }

    renderWorkerCards() {
        const content = document.getElementById('workers-grid');
        const workers = this.virtualState.workers;
        const t = this.getTranslator();

        if (!content) return;

        let html = '';
        for (let i = 0; i < workers.length; i++) {
            const worker = workers[i];
            const isAssigned = worker.assignedBuilding !== null && worker.assignedBuilding !== undefined;
            const xp = Number(worker.experience || worker.xp || 0);
            const xpToNext = Number(worker.experienceToNext || worker.xpToNext || 100);
            const xpProgress = xpToNext > 0 ? Math.max(0, Math.min(100, (xp / xpToNext) * 100)) : 0;
            const assignmentName = this.escapeHtml(worker.assignedBuilding || (t('unassigned') || '未分配'));
            const skillsText = this.escapeHtml(this.getSkillLabel(worker.skills));
            const backgroundText = this.escapeHtml(this.getBackgroundLabel(worker.background));
            const preferenceText = this.escapeHtml(this.getPreferenceLabel(worker.preferences));
            const genderText = this.getGenderLabel(worker.gender);
            const hobbiesText = this.escapeHtml(this.getHobbiesLabel(worker.hobbies));
            const happiness = Number(worker.happiness || 0).toFixed(0);
            const hunger = Number(worker.hunger || 0).toFixed(0);
            const hungryText = this.formatStatusLabel(worker);
            const stateSummary = this.escapeHtml(this.getWorkerStateSummary(worker));
            const limbSummary = this.escapeHtml(this.getWorkerLimbSummary(worker));
            const traitInfo = this.getTraitInfo(worker);
            const efficiencyBreakdown = this.escapeHtml(this.getEfficiencyBreakdown(worker));
            const autoHint = this.escapeHtml(this.getAutoAssignmentHint(worker));
            html += `
                <div class="worker-card worker-list-item" onclick="window.workerManager.showAssignmentModal(${worker.__index})">
                    <div class="worker-header worker-item-header">
                        <div class="worker-item-name">
                            <span class="worker-avatar">👷</span>
                            <span class="worker-name-text">${this.escapeHtml(worker.name || '')}</span>
                            <span class="worker-level-badge">${t('level') || '等级'} ${worker.level || 1}</span>
                        </div>
                        <span class="status-text">${isAssigned ? (t('assigned') || '已分配') : (t('unassigned') || '未分配')}</span>
                    </div>
                    <div class="worker-body worker-item-body">
                        <span class="detail-value">${assignmentName}</span>
                        <span class="detail-value efficiency-value">${this.formatEfficiency(worker.efficiencyMultiplier || 1)}</span>
                        <span class="detail-value">XP ${this.formatXP(xp, xpToNext)}</span>
                    </div>
                    <div class="worker-card-traits">
                        <div class="worker-card-meta">
                            <span><strong>${t('gender') || '性别'}:</strong> ${genderText}</span>
                            <span><strong>${t('skills') || '技能'}:</strong> ${skillsText || '—'}</span>
                            <span><strong>${t('background') || '背景'}:</strong> ${backgroundText || '—'}</span>
                            <span><strong>${t('preference') || '偏好'}:</strong> ${preferenceText || '—'}</span>
                            <span><strong>${t('hobby') || '爱好'}:</strong> ${hobbiesText}</span>
                        </div>
                        <div class="worker-card-chip-line">
                            <span class="trait-chip">${traitInfo.primary.icon} ${traitInfo.primary.label}</span>
                            ${traitInfo.secondaryHtml}
                        </div>
                        <div class="worker-card-status-line">
                            <span><strong>${t('happiness') || '心情'}:</strong> ${happiness}</span>
                            <span><strong>${t('hunger') || '饥饿'}:</strong> ${hunger}</span>
                            <span><strong>${t('status') || '状态'}:</strong> ${hungryText}</span>
                        </div>
                        <div class="worker-card-status-line worker-card-state-line">
                            <span><strong>工作状态:</strong> ${stateSummary}</span>
                        </div>
                        <div class="worker-card-status-line worker-card-state-line">
                            <span><strong>肢体状态:</strong> ${limbSummary}</span>
                        </div>
                        <div class="worker-card-efficiency-detail">${efficiencyBreakdown}</div>
                        ${autoHint ? `<div class="worker-card-auto-hint">${autoHint}</div>` : ''}
                    </div>
                    <div class="xp-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${xpProgress.toFixed(0)}">
                        <span class="xp-progress-fill" style="width:${xpProgress.toFixed(1)}%"></span>
                    </div>
                    <div class="worker-footer">
                        <button class="btn-assign worker-assign-btn" onclick="event.stopPropagation(); window.workerManager.showAssignmentModal(${worker.__index})">${isAssigned ? (t('reassign') || '重新分配') : (t('assign') || '分配')}</button>
                    </div>
                </div>
            `;
        }
        content.innerHTML = html;
    }

    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    /**
     * Render building selection dropdown for a specific worker
     * @param {number} workerIndex - Index of the worker to assign
     * @returns {string} HTML for building selection
     */
    renderBuildingSelect(workerIndex) {
        const worker = this.getWorkerSnapshot(workerIndex, true);
        const buildings = this.getBuildingAssignmentState(this.getBuildings(), worker);
        
        if (!worker) {
            return '<option value="">' + (window.i18n ? window.i18n.t('invalidWorker') || '无效工人' : '无效工人') + '</option>';
        }

        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
        
        let html = `<option value="">${t('selectBuilding') || '选择建筑'}</option>`;
        html += `<option value="">${t('unassign') || '取消分配'}</option>`;
        
        buildings.forEach((building) => {
            const isSelected = worker.assignedBuilding === building.name;
            html += `<option value="${building.name}" ${isSelected ? 'selected' : ''} ${!isSelected && building.isFull ? 'disabled' : ''}>${building.name} (${building.assignedCount}/${building.count})</option>`;
        });

        return html;
    }

    /**
     * Show assignment modal for a worker
     * @param {number} workerIndex - Index of the worker to assign
     */
    showAssignmentModal(workerIndex) {
        const worker = this.getWorkerSnapshot(workerIndex, true);
        
        if (!worker) {
            console.error('Worker not found:', workerIndex);
            return;
        }

        const existingModal = document.getElementById('worker-assignment-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const t = this.getTranslator();
        const buildings = this.getBuildings();
        const genderText = this.getGenderLabel(worker.gender);
        const hobbiesText = this.getHobbiesLabel(worker.hobbies);
        const traitInfo = this.getTraitInfo(worker);
        const assignmentText = this.escapeHtml(worker.assignedBuilding || (t('unassigned') || '未分配'));
        const efficiencyDetail = this.getEfficiencyDetail(worker);
        const efficiencyBreakdown = this.escapeHtml(this.getEfficiencyBreakdown(worker));
        const autoHint = this.escapeHtml(this.getAutoAssignmentHint(worker));
        const stateSummary = this.escapeHtml(this.getWorkerStateSummary(worker));
        const limbSummary = this.escapeHtml(this.getWorkerLimbSummary(worker));
        const surgeryCost = Number(worker.maggotSurgeryCost || 0).toFixed(0);
        const surgeryAvailable = Boolean(worker.canMaggotSurgery);
        const surgeryReason = this.escapeHtml(worker.maggotSurgeryReason || '');
        const missingLimbs = Array.isArray(worker.missingLimbs) ? worker.missingLimbs : (Array.isArray(worker.missing_limbs) ? worker.missing_limbs : []);
        const hasMissingLimbs = missingLimbs.length > 0;

        const modal = document.createElement('div');
        modal.id = 'worker-assignment-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content worker-detail-modal">
                <div class="modal-header">
                    <h3>${t('assignWorker') || '分配工人'}: ${worker.name}</h3>
                    <button class="modal-close" onclick="window.workerManager.closeAssignmentModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="worker-detail-grid">
                        <div class="worker-detail-card">
                            <div class="worker-detail-row-line">
                                <span>${t('gender') || '性别'}</span>
                                <strong>${genderText}</strong>
                            </div>
                            <div class="worker-detail-row-line">
                                <span>${t('hobby') || '爱好'}</span>
                                <strong>${hobbiesText}</strong>
                            </div>
                            <div class="worker-detail-row-line">
                                <span>${t('assignedBuilding') || '分配建筑'}</span>
                                <strong>${assignmentText}</strong>
                            </div>
                            <div class="worker-detail-row-line">
                                <span>${t('experience') || '经验'}</span>
                                <strong>${this.formatXP(worker.xp, worker.xpToNextLevel)}</strong>
                            </div>
                            <div class="xp-progress-bar">
                                <div class="xp-progress-fill" style="width: ${Math.min(100, (worker.xp / worker.xpToNextLevel) * 100)}%"></div>
                            </div>
                            <div class="worker-detail-row-line">
                                <span>${t('efficiency') || '效率'}</span>
                                <strong>${efficiencyDetail}</strong>
                            </div>
                            <div class="worker-detail-row-line worker-detail-notes">
                                <span>${t('efficiency') || '效率来源'}</span>
                                <strong>${efficiencyBreakdown}</strong>
                            </div>
                            <div class="worker-detail-row-line worker-detail-notes">
                                <span>工作状态</span>
                                <strong>${stateSummary}</strong>
                            </div>
                            <div class="worker-detail-row-line worker-detail-notes">
                                <span>肢体状态</span>
                                <strong>${limbSummary}</strong>
                            </div>
                            ${autoHint ? `<div class="worker-detail-row-line worker-detail-notes"><span>自动建议</span><strong>${autoHint}</strong></div>` : ''}
                        </div>
                        <div class="worker-detail-card">
                            <div class="trait-line">
                                <span class="trait-label">${t('primaryTrait') || '主特性'}</span>
                                <span class="trait-chip">${traitInfo.primary.icon} ${traitInfo.primary.label}</span>
                            </div>
                            <div class="trait-line">
                                <span class="trait-label">${t('secondaryTraits') || '次特性'}</span>
                                <div class="trait-list">${traitInfo.secondaryHtml}</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="worker-building-select">${t('selectBuilding') || '选择建筑'}:</label>
                        <select id="worker-building-select" class="form-control">
                            ${this.renderBuildingSelect(workerIndex)}
                        </select>
                    </div>
                    <div class="worker-preview"><span class="preview-label">${t('preference') || '偏好'}:</span> <span class="preview-value">${this.escapeHtml(this.getPreferenceLabel(worker.preferences))}</span></div>
                    ${hasMissingLimbs ? `
                        <div class="worker-preview worker-surgery-panel">
                            <span class="preview-label">蛆虫置换</span>
                            <span class="preview-value">消耗 ${surgeryCost} 蛆虫，将残缺肢体替换为蛆虫肢体</span>
                        </div>
                        ${!surgeryAvailable && surgeryReason ? `<div class="worker-preview worker-surgery-panel"><span class="preview-label">当前条件</span><span class="preview-value">${surgeryReason}</span></div>` : ''}
                    ` : ''}
                </div>
                <div class="modal-footer">
                    ${hasMissingLimbs ? `<button class="btn btn-secondary" ${surgeryAvailable ? '' : 'disabled'} onclick="window.workerManager.handleMaggotLimbSurgery(${workerIndex})">蛆虫肢体手术</button>` : ''}
                    <button class="btn btn-secondary" onclick="window.workerManager.closeAssignmentModal()">
                        ${t('cancel') || '取消'}
                    </button>
                    <button class="btn btn-primary" onclick="window.workerManager.confirmAssignment(${workerIndex})">
                        ${t('confirm') || '确认'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    handleMaggotLimbSurgery(workerIndex) {
        const worker = this.getWorkerSnapshot(workerIndex, true);
        if (!worker) {
            return;
        }

        const cost = Number(worker.maggotSurgeryCost || 0).toFixed(0);
        const reason = worker.maggotSurgeryReason || '当前无法执行蛆虫肢体手术';
        if (!worker.canMaggotSurgery) {
            alert(reason);
            return;
        }

        const confirmed = window.confirm(`确认消耗 ${cost} 蛆虫，为 ${worker.name} 执行蛆虫肢体置换手术？`);
        if (!confirmed) {
            return;
        }

        const success = this.performMaggotLimbSurgery(workerIndex);
        if (!success) {
            alert(reason || '蛆虫肢体手术失败');
            return;
        }

        this.invalidateRenderCache();
        this.renderWorkers();
        if (window.updateResourceDisplay) {
            window.updateResourceDisplay();
        }
        this.showAssignmentModal(workerIndex);
    }

    getGenderLabel(gender) {
        const i18n = this.getI18n();
        const t = this.getTranslator();
        if (i18n && typeof i18n.getWorkerGenderLabel === 'function') {
            if (gender === 'Male' || gender === 1) return `♂ ${i18n.getWorkerGenderLabel(gender)}`;
            if (gender === 'Female' || gender === 2) return `♀ ${i18n.getWorkerGenderLabel(gender)}`;
            return `⚪ ${i18n.getWorkerGenderLabel(gender)}`;
        }

        if (gender === 'Male' || gender === 1) return `♂ ${t('male') || '男'}`;
        if (gender === 'Female' || gender === 2) return `♀ ${t('female') || '女'}`;
        return `⚪ ${t('otherGender') || '其他'}`;
    }

    getHobbiesLabel(hobbies) {
        const list = Array.isArray(hobbies) ? hobbies : [];
        const t = this.getTranslator();
        if (list.length === 0) return t('noHobby') || '无';
        return list.map(h => this.getHobbyLabel(h)).join(' / ');
    }

    getSkillLabel(skill) {
        const i18n = this.getI18n();
        if (i18n && typeof i18n.getWorkerSkillLabel === 'function') {
            return i18n.getWorkerSkillLabel(skill);
        }

        return String(skill || '').trim() || '—';
    }

    getPreferenceLabel(preference) {
        const i18n = this.getI18n();
        const t = this.getTranslator();
        if (i18n && typeof i18n.getWorkerPreferenceLabel === 'function') {
            return i18n.getWorkerPreferenceLabel(preference);
        }

        return String(preference || '').trim() || (t('noPreference') || '无');
    }

    getBackgroundLabel(background) {
        const i18n = this.getI18n();
        if (i18n && typeof i18n.getWorkerBackgroundLabel === 'function') {
            return i18n.getWorkerBackgroundLabel(background);
        }

        return String(background || '').trim() || '—';
    }

    getHobbyLabel(hobby) {
        const i18n = this.getI18n();
        const icons = {
            Reading: '📚',
            Gaming: '🎮',
            Sports: '🏃',
            Music: '🎵',
            Art: '🎨',
            Cooking: '🍳',
            Gardening: '🌱',
            Fishing: '🎣',
            Traveling: '🧳',
            Photography: '📷',
        };
        const translated = i18n && typeof i18n.getWorkerHobbyLabel === 'function'
            ? i18n.getWorkerHobbyLabel(hobby)
            : (String(hobby || '').trim() || '—');
        return icons[hobby] ? `${icons[hobby]} ${translated}` : translated;
    }

    getTraitInfo(worker) {
        const primary = this.getTraitLabel(worker.primaryTrait || worker.primary_trait);
        const secondary = Array.isArray(worker.secondaryTraits) ? worker.secondaryTraits : (Array.isArray(worker.secondary_traits) ? worker.secondary_traits : []);
        const secondaryHtml = secondary.length > 0
            ? secondary.map((trait) => {
                const info = this.getTraitLabel(trait);
                return `<span class="trait-chip secondary">${info.icon} ${info.label}</span>`;
            }).join('')
            : `<span class="trait-chip secondary">—</span>`;
        return { primary, secondaryHtml };
    }

    getTraitLabel(trait) {
        const map = {
            Diligent: { icon: '💪', label: '勤奋' },
            Hardworking: { icon: '🔧', label: '努力' },
            Lazy: { icon: '😴', label: '懒惰' },
            Efficient: { icon: '⚡', label: '高效' },
            Slow: { icon: '🐢', label: '缓慢' },
            Intelligent: { icon: '🧠', label: '聪明' },
            FastLearner: { icon: '📈', label: '快学' },
            Genius: { icon: '🌟', label: '天才' },
            SlowLearner: { icon: '📉', label: '慢学' },
            Social: { icon: '🤝', label: '社交' },
            Loner: { icon: '🧍', label: '孤僻' },
            Charismatic: { icon: '✨', label: '魅力' },
            Shy: { icon: '🙈', label: '害羞' },
            NightOwl: { icon: '🌙', label: '夜猫子' },
            EarlyBird: { icon: '🌅', label: '早起者' },
            Clumsy: { icon: '💥', label: '笨拙' },
            Forgetful: { icon: '🌀', label: '健忘' },
            Careless: { icon: '⚠️', label: '粗心' },
            Careful: { icon: '🛡️', label: '细心' },
            Creative: { icon: '🎯', label: '创意' },
            Persevering: { icon: '🏋️', label: '坚韧' },
            Optimistic: { icon: '🌞', label: '乐观' },
        };
        return map[trait] || { icon: '🔹', label: String(trait || '未知') };
    }

    getEfficiencyDetail(worker) {
        const base = Number(worker.efficiencyMultiplier || 1);
        const total = typeof worker.totalEfficiency === 'number'
            ? worker.totalEfficiency
            : (typeof worker.total_efficiency === 'number' ? worker.total_efficiency : base);
        const baseText = `${(base * 100).toFixed(0)}%`;
        const totalText = `${(total * 100).toFixed(0)}%`;
        return `${baseText} → ${totalText}`;
    }

    getEfficiencyBreakdown(worker) {
        if (!worker || !Array.isArray(worker.efficiencyBreakdown) || worker.efficiencyBreakdown.length === 0) {
            return '基础 100%';
        }
        return worker.efficiencyBreakdown.join(' / ');
    }

    getAutoAssignmentHint(worker) {
        if (!worker || worker.assignedBuilding || !worker.autoAssignmentTarget) {
            return '';
        }
        return `自动建议: ${worker.autoAssignmentTarget}（按当前状态收益最高）`;
    }

    /**
     * Close assignment modal
     */
    closeAssignmentModal() {
        const modal = document.getElementById('worker-assignment-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    /**
     * Confirm worker assignment
     * @param {number} workerIndex - Index of the worker to assign
     */
    confirmAssignment(workerIndex) {
        const select = document.getElementById('worker-building-select');
        if (!select) {
            console.error('Building select not found');
            return;
        }

        const buildingId = select.value;
        
        if (buildingId) {
            const success = this.assignWorker(workerIndex, buildingId);
            if (success) {
                this.invalidateRenderCache();
                this.renderWorkers();
                this.closeAssignmentModal();
                
                if (window.updateResourceDisplay) {
                    window.updateResourceDisplay();
                }
            } else {
                console.error('Failed to assign worker');
                alert(window.i18n ? window.i18n.t('assignFailed') || '分配失败' : '分配失败');
            }
        } else {
            this.closeAssignmentModal();
        }
    }

    refreshWorkers(force = false) {
        const shouldForce = Boolean(force);
        if (shouldForce) {
            this.invalidateRenderCache();
        }
        return this.renderWorkers();
    }

    /**
     * Render workers panel with full UI
     * @param {string} panelId - DOM element ID for the workers panel
     */
    renderToPanel(panelId = 'workers-tab') {
        const panel = document.getElementById(panelId);
        if (!panel) {
            console.warn(`Workers panel "${panelId}" not found`);
            return;
        }

        const pageData = this.update(true);
        const workers = Array.isArray(pageData.workers) ? pageData.workers : [];
        const t = this.getTranslator();

        if (Number(pageData.total || 0) === 0) {
            panel.innerHTML = `
                <div class="workers-panel">
                    <h3>${t('workers') || '工人'}</h3>
                    <p class="placeholder">${t('noWorkers') || '没有工人'}</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="workers-panel">
                <div class="workers-header">
                    <h3>${t('workers') || '工人'}</h3>
                    <div class="workers-summary">
                        <span class="summary-item">${t('totalWorkers') || '总工人'}: ${pageData.total || 0}</span>
                        <span class="summary-item">${t('assignedWorkers') || '已分配'}: ${pageData.assignedCount || 0}</span>
                    </div>
                </div>
                ${this.renderWorkersToList()}
            </div>
        `;

        panel.innerHTML = html;
    }

    /**
     * Render workers to a list format
     * @returns {string} HTML string for workers list
     */
    renderWorkersToList() {
        const pageData = this.update(true);
        const workers = Array.isArray(pageData.workers) ? pageData.workers : [];
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

        if (Number(pageData.total || 0) === 0) {
            return `<p class="empty-list">${t('noWorkers') || '没有工人'}</p>`;
        }

        let html = '<div class="workers-list">';
        
        workers.forEach((worker, index) => {
            const isAssigned = worker.assignedBuilding !== null && worker.assignedBuilding !== undefined;
            const assignedBuildingName = isAssigned ? worker.assignedBuilding : (t('unassigned') || '未分配');
            const efficiencyBonus = this.formatEfficiency(worker.efficiencyMultiplier);
            const genderText = this.getGenderLabel(worker.gender);
            const hobbiesText = this.escapeHtml(this.getHobbiesLabel(worker.hobbies));
            const backgroundText = this.escapeHtml(this.getBackgroundLabel(worker.background));
            const preferenceText = this.escapeHtml(this.getPreferenceLabel(worker.preferences));
            const skillsText = this.escapeHtml(this.getSkillLabel(worker.skills));
            const traitInfo = this.getTraitInfo(worker);
            const happiness = Number(worker.happiness || 0).toFixed(0);
            const hunger = Number(worker.hunger || 0).toFixed(0);
            const hungryText = this.formatStatusLabel(worker);

            html += `
                <div class="worker-list-item" id="worker-item-${index}">
                    <div class="worker-item-header">
                        <div class="worker-item-name">
                            <span class="worker-avatar">👷</span>
                            <span class="worker-name-text">${worker.name}</span>
                            <span class="worker-level-badge">${t('level') || '等级'} ${worker.level}</span>
                        </div>
                        <div class="worker-item-status">
                            <span class="status-indicator ${isAssigned ? 'assigned' : 'unassigned'}"></span>
                            <span class="status-text">${isAssigned ? (t('assigned') || '已分配') : (t('unassigned') || '未分配')}</span>
                        </div>
                    </div>
                    <div class="worker-item-body">
                        <div class="worker-detail-row">
                            <span class="detail-label">${t('building') || '建筑'}:</span>
                            <span class="detail-value">${assignedBuildingName}</span>
                        </div>
                        <div class="worker-detail-row">
                            <span class="detail-label">${t('efficiency') || '效率'}:</span>
                            <span class="detail-value efficiency-value">${efficiencyBonus}</span>
                        </div>
                        <div class="worker-detail-row">
                            <span class="detail-label">${t('experience') || '经验'}:</span>
                            <span class="detail-value">${this.formatXP(worker.xp, worker.xpToNextLevel)}</span>
                            <div class="xp-progress-small">
                                <div class="xp-progress-fill-small" style="width: ${Math.min(100, (worker.xp / worker.xpToNextLevel) * 100)}%"></div>
                            </div>
                        </div>
                        <div class="worker-detail-row worker-detail-row-stacked">
                            <span class="detail-label">${t('gender') || '性别'} / ${t('skills') || '技能'}:</span>
                            <span class="detail-value">${genderText} / ${skillsText || '—'}</span>
                        </div>
                        <div class="worker-detail-row worker-detail-row-stacked">
                            <span class="detail-label">${t('background') || '背景'}:</span>
                            <span class="detail-value">${backgroundText || '—'}</span>
                        </div>
                        <div class="worker-detail-row worker-detail-row-stacked">
                            <span class="detail-label">${t('preference') || '偏好'} / ${t('hobby') || '爱好'}:</span>
                            <span class="detail-value">${preferenceText || '—'} / ${hobbiesText}</span>
                        </div>
                        <div class="worker-detail-row worker-detail-row-stacked">
                            <span class="detail-label">${t('traits') || '特性'}:</span>
                            <span class="detail-value worker-inline-traits"><span class="trait-chip">${traitInfo.primary.icon} ${traitInfo.primary.label}</span>${traitInfo.secondaryHtml}</span>
                        </div>
                        <div class="worker-detail-row worker-detail-row-stacked">
                            <span class="detail-label">${t('status') || '状态'}:</span>
                            <span class="detail-value">${hungryText} / ${t('happiness') || '心情'} ${happiness} / ${t('hunger') || '饥饿'} ${hunger}</span>
                        </div>
                    </div>
                    <div class="worker-item-actions">
                        <button 
                            class="btn-assign" 
                            onclick="window.workerManager.showAssignmentModal(${index})"
                        >
                            ${isAssigned ? (t('reassign') || '重新分配') : (t('assign') || '分配')}
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }
}

window.WorkerManager = WorkerManager;

window.updateWorkersPanel = function() {
    if (!window.workerManager || typeof window.workerManager.refreshWorkers !== 'function') {
        return;
    }

    if (document.getElementById('worker-assignment-modal')) {
        return;
    }

    const workersTab = document.getElementById('tab-workers');
    if (workersTab && workersTab.classList.contains('active')) {
        window.workerManager.refreshWorkers(false);
    }
};
