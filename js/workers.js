class WorkerManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
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

    renderWorkers() {
        const container = document.getElementById('workers-list');
        if (!container) {
            console.warn('Workers container "workers-list" not found');
            return;
        }

        const workers = this.update();
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

        if (workers.length === 0) {
            container.innerHTML = `<p id="workers-placeholder">${t('workersPlaceholder') || '工人系统将在未来版本中实现'}</p>`;
            return;
        }

        let html = '<div class="workers-grid">';
        
        workers.forEach((worker, index) => {
            const isAssigned = worker.assignedBuilding !== null && worker.assignedBuilding !== undefined;
            const assignedBuildingName = isAssigned ? worker.assignedBuilding : (t('unassigned') || '未分配');
            const efficiencyBonus = this.formatEfficiency(worker.efficiencyMultiplier);
            const xpProgress = this.formatXP(worker.xp, worker.xpToNextLevel);
            const progressPercent = Math.min(100, (worker.xp / worker.xpToNextLevel) * 100);

            html += `
                <div class="worker-card" id="worker-card-${index}">
                    <div class="worker-header">
                        <div class="worker-name">${worker.name}</div>
                        <div class="worker-level">${t('level') || '等级'}: ${worker.level}</div>
                    </div>
                    <div class="worker-body">
                        <div class="worker-info-row">
                            <span class="worker-label">${t('assignedBuilding') || '分配建筑'}:</span>
                            <span class="worker-value">${assignedBuildingName}</span>
                        </div>
                        <div class="worker-info-row">
                            <span class="worker-label">${t('efficiency') || '效率'}:</span>
                            <span class="worker-value efficiency">${efficiencyBonus}</span>
                        </div>
                        <div class="worker-info-row">
                            <span class="worker-label">${t('skills') || '技能'}:</span>
                            <span class="worker-value">${worker.skills}</span>
                        </div>
                        <div class="worker-info-row">
                            <span class="worker-label">${t('preferences') || '偏好'}:</span>
                            <span class="worker-value">${worker.preferences}</span>
                        </div>
                        <div class="worker-xp-section">
                            <div class="worker-info-row">
                                <span class="worker-label">${t('experience') || '经验'}:</span>
                                <span class="worker-value">${xpProgress}</span>
                            </div>
                            <div class="xp-progress-bar">
                                <div class="xp-progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="worker-footer">
                        <button 
                            class="worker-assign-btn" 
                            onclick="window.workerManager.showAssignmentModal(${index})"
                            title="${isAssigned ? t('reassignWorker') : t('assignWorker')}"
                        >
                            ${isAssigned ? t('reassign') : t('assign')}
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
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

        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
        const buildings = this.getBuildings();

        const modal = document.createElement('div');
        modal.id = 'worker-assignment-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${t('assignWorker') || '分配工人'}: ${worker.name}</h3>
                    <button class="modal-close" onclick="window.workerManager.closeAssignmentModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="worker-building-select">${t('selectBuilding') || '选择建筑'}:</label>
                        <select id="worker-building-select" class="form-control">
                            ${this.renderBuildingSelect(workerIndex)}
                        </select>
                    </div>
                    <div class="worker-preview">
                        <div class="preview-row">
                            <span class="preview-label">${t('currentLevel') || '当前等级'}:</span>
                            <span class="preview-value">${worker.level}</span>
                        </div>
                        <div class="preview-row">
                            <span class="preview-label">${t('efficiencyBonus') || '效率加成'}:</span>
                            <span class="preview-value">${this.formatEfficiency(worker.efficiencyMultiplier)}</span>
                        </div>
                        <div class="preview-row">
                            <span class="preview-label">${t('preference') || '偏好'}:</span>
                            <span class="preview-value">${worker.preferences}</span>
                        </div>
                    </div>
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
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

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
