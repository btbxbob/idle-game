class WorkerManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.virtualState = {
            sortBy: 'name',
            filterBy: 'all',
            query: '',
            workers: [],
        };
    }

    /**
     * Get workers from Rust game state
     * @returns {Array} Array of worker objects
     */
    update() {
        if (this.rustGame && typeof this.rustGame.get_workers === 'function') {
            try {
                const workers = this.rustGame.get_workers();
                return workers || [];
            } catch (error) {
                console.error('Failed to get workers:', error);
                return [];
            }
        }
        return [];
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

    renderWorkers() {
        const container = document.getElementById('workers-list');
        if (!container) {
            console.warn('Workers container "workers-list" not found');
            return;
        }

        const workers = this.getProcessedWorkers(this.update());
        const t = this.getTranslator();

        if (workers.length === 0) {
            container.innerHTML = `<p id="workers-placeholder">${t('workersPlaceholder') || '工人系统将在未来版本中实现'}</p>`;
            return;
        }

        this.virtualState.workers = workers;

        const assignedCount = workers.filter(w => w.assignedBuilding !== null && w.assignedBuilding !== undefined).length;
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
                <span class="workers-count">${t('totalWorkers') || '总工人'}: ${workers.length} / ${assignedCount}</span>
            </div>
            <div id="workers-grid" class="workers-grid"></div>
        `;

        const search = document.getElementById('workers-search');
        const filter = document.getElementById('workers-filter');
        const sort = document.getElementById('workers-sort');
        const autoAssign = document.getElementById('workers-auto-assign');

        if (search) {
            search.addEventListener('input', (e) => {
                this.virtualState.query = e.target.value || '';
                this.renderWorkers();
            });
        }
        if (filter) {
            filter.addEventListener('change', (e) => {
                this.virtualState.filterBy = e.target.value || 'all';
                this.renderWorkers();
            });
        }
        if (sort) {
            sort.addEventListener('change', (e) => {
                this.virtualState.sortBy = e.target.value || 'name';
                this.renderWorkers();
            });
        }
        if (autoAssign) {
            autoAssign.addEventListener('click', () => {
                this.handleAutoAssign();
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

        const confirmed = window.confirm(t('autoAssignConfirm') || '将为未分配工人执行自动分配，是否继续？');
        if (!confirmed) return;

        try {
            const assignedCount = this.rustGame.assign_worker_auto();
            this.renderWorkers();
            if (window.updateResourceDisplay) {
                window.updateResourceDisplay();
            }
            alert(t('autoAssignSuccess', { count: assignedCount }) || `自动分配完成：成功分配 ${assignedCount} 名工人`);
        } catch (error) {
            console.error('Auto assignment failed:', error);
            alert(t('autoAssignFailed') || '自动分配失败，请稍后重试');
        }
    }

    getProcessedWorkers(rawWorkers) {
        const query = this.virtualState.query.trim().toLowerCase();
        const filterBy = this.virtualState.filterBy;
        const sortBy = this.virtualState.sortBy;

        const mapped = rawWorkers.map((worker, index) => ({ ...worker, __index: index }));
        let filtered = mapped.filter((worker) => {
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
        const buildings = this.getBuildings();
        const workers = this.update();
        const worker = workers[workerIndex];
        
        if (!worker) {
            return '<option value="">' + (window.i18n ? window.i18n.t('invalidWorker') || '无效工人' : '无效工人') + '</option>';
        }

        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
        
        let html = `<option value="">${t('selectBuilding') || '选择建筑'}</option>`;
        html += `<option value="">${t('unassign') || '取消分配'}</option>`;
        
        buildings.forEach((building, index) => {
            const isSelected = worker.assignedBuilding === building.name;
            html += `<option value="${building.name}" ${isSelected ? 'selected' : ''}>${building.name} (${building.count})</option>`;
        });

        return html;
    }

    /**
     * Show assignment modal for a worker
     * @param {number} workerIndex - Index of the worker to assign
     */
    showAssignmentModal(workerIndex) {
        const workers = this.update();
        const worker = workers[workerIndex];
        
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
                </div>
                <div class="modal-footer">
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
        return `自动建议: ${worker.autoAssignmentTarget}`;
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

        const workers = this.update();
        const t = this.getTranslator();

        if (workers.length === 0) {
            panel.innerHTML = `
                <div class="workers-panel">
                    <h3>${t('workers') || '工人'}</h3>
                    <p class="placeholder">${t('workersPlaceholder') || '工人系统将在未来版本中实现'}</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="workers-panel">
                <div class="workers-header">
                    <h3>${t('workers') || '工人'}</h3>
                    <div class="workers-summary">
                        <span class="summary-item">${t('totalWorkers') || '总工人'}: ${workers.length}</span>
                        <span class="summary-item">${t('assignedWorkers') || '已分配'}: ${workers.filter(w => w.assignedBuilding).length}</span>
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
        const workers = this.update();
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

        if (workers.length === 0) {
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
