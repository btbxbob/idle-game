class ObjectiveManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.container = document.getElementById('objective-panel-anchor');
        this.currentChain = null;
        this.lastCompletedSteps = new Set();
        this.lastObjectiveId = null;
        this.initialized = false;
        this.highlightTimer = null;
    }

    fetchChain() {
        if (!this.rustGame || typeof this.rustGame.getCurrentObjectiveChainJson !== 'function') {
            return null;
        }

        try {
            const raw = this.rustGame.getCurrentObjectiveChainJson();
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error('ObjectiveManager: Failed to fetch objective chain:', error);
            return null;
        }
    }

    update() {
        this.currentChain = this.fetchChain();
        this.render();
        this.processProgressChanges();
    }

    render() {
        if (!this.container) {
            this.container = document.getElementById('objective-panel-anchor');
            if (!this.container) {
                return;
            }
        }

        const chain = this.currentChain;
        if (!chain || !chain.active || !Array.isArray(chain.steps) || chain.steps.length === 0) {
            this.container.innerHTML = '';
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'block';

        const currentStep = chain.steps.find((step) => step && step.id === chain.current_objective_id)
            || chain.steps.find((step) => step && !step.completed)
            || chain.steps[chain.steps.length - 1];

        const completedCount = chain.steps.filter((step) => step && step.completed).length;
        const totalCount = chain.steps.length;
        const progressRatio = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        const nextLabel = currentStep && currentStep.recommended_tab
            ? this.getTabLabel(currentStep.recommended_tab)
            : '当前面板';

        this.container.innerHTML = `
            <section class="objective-panel" data-stage="${chain.stage_id || ''}">
                <div class="objective-panel-header">
                    <div>
                        <div class="objective-kicker">当前目标 / PRIMARY DIRECTIVE</div>
                        <div class="objective-title">${this.escapeHtml(currentStep?.title || '阶段目标已完成')}</div>
                    </div>
                    <div class="objective-counter">${completedCount}/${totalCount}</div>
                </div>
                <div class="objective-copy">${this.escapeHtml(currentStep?.description || '当前阶段的首批目标已完成。')}</div>
                <div class="objective-meta">
                    <span class="objective-progress-label">进度 ${this.renderStepProgress(currentStep)}</span>
                    <span class="objective-reward-label">奖励 ${this.escapeHtml(currentStep?.reward || '已领取')}</span>
                    <span class="objective-tab-label">前往 ${this.escapeHtml(nextLabel)}</span>
                </div>
                <div class="objective-progress-bar" aria-hidden="true">
                    <span style="width:${progressRatio.toFixed(1)}%"></span>
                </div>
                <div class="objective-step-list">
                    ${chain.steps.map((step) => this.renderStepCard(step, currentStep)).join('')}
                </div>
            </section>
        `;
    }

    renderStepCard(step, currentStep) {
        const isCurrent = currentStep && step && currentStep.id === step.id;
        const stepClass = step.completed ? 'is-complete' : (isCurrent ? 'is-current' : 'is-pending');

        return `
            <article class="objective-step ${stepClass}">
                <div class="objective-step-badge">${step.completed ? 'OK' : (isCurrent ? 'NOW' : 'NEXT')}</div>
                <div class="objective-step-body">
                    <div class="objective-step-name">${this.escapeHtml(step.title)}</div>
                    <div class="objective-step-progress">${this.renderStepProgress(step)}</div>
                </div>
            </article>
        `;
    }

    renderStepProgress(step) {
        if (!step) {
            return '0 / 0';
        }

        const current = Number.isFinite(step.current) ? step.current : 0;
        const required = Number.isFinite(step.required) ? step.required : 0;
        return `${Math.min(current, required)} / ${required}`;
    }

    processProgressChanges() {
        const chain = this.currentChain;
        if (!chain || !chain.active || !Array.isArray(chain.steps)) {
            this.lastCompletedSteps = new Set();
            this.lastObjectiveId = null;
            return;
        }

        const completedIds = new Set(
            chain.steps.filter((step) => step && step.completed).map((step) => step.id)
        );

        if (!this.initialized) {
            this.lastCompletedSteps = completedIds;
            this.lastObjectiveId = chain.current_objective_id || null;
            this.initialized = true;
            this.applyTabHighlight(chain.current_objective_id, chain.steps);
            return;
        }

        chain.steps.forEach((step) => {
            if (step && step.completed && !this.lastCompletedSteps.has(step.id)) {
                this.showCompletionToast(step, chain);
            }
        });

        if (chain.current_objective_id !== this.lastObjectiveId) {
            this.applyTabHighlight(chain.current_objective_id, chain.steps);
        }

        this.lastCompletedSteps = completedIds;
        this.lastObjectiveId = chain.current_objective_id || null;
    }

    showCompletionToast(step, chain) {
        const nextStep = chain.steps.find((candidate) => candidate && !candidate.completed && candidate.id !== step.id)
            || chain.steps.find((candidate) => candidate && !candidate.completed)
            || null;

        const existing = document.querySelector('.objective-notification');
        if (existing) {
            existing.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'achievement-notification objective-notification';
        toast.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">>></div>
                <div class="notification-text">
                    <div class="notification-title">目标完成</div>
                    <div class="notification-name">${this.escapeHtml(step.title)}</div>
                    <div class="notification-description">${this.escapeHtml(nextStep ? `下一步：${nextStep.title}` : '当前阶段首批目标已完成')}</div>
                </div>
            </div>
        `;

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        window.setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            window.setTimeout(() => toast.remove(), 320);
        }, 2600);
    }

    applyTabHighlight(objectiveId, steps) {
        if (this.highlightTimer) {
            window.clearTimeout(this.highlightTimer);
            this.highlightTimer = null;
        }

        document.querySelectorAll('.tab-button.objective-focus').forEach((button) => {
            button.classList.remove('objective-focus');
        });

        const currentStep = Array.isArray(steps)
            ? steps.find((step) => step && step.id === objectiveId)
            : null;

        if (!currentStep || !currentStep.recommended_tab) {
            return;
        }

        const button = document.querySelector(`.tab-button[data-tab="${currentStep.recommended_tab}"]`);
        if (!button || button.classList.contains('active')) {
            return;
        }

        button.classList.add('objective-focus');
        this.highlightTimer = window.setTimeout(() => {
            button.classList.remove('objective-focus');
        }, 5000);
    }

    getTabLabel(tabId) {
        const button = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        return button ? button.textContent.trim() : tabId;
    }

    escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

window.ObjectiveManager = ObjectiveManager;
window.updateObjectivePanel = function() {
    if (window.objectiveManager) {
        window.objectiveManager.update();
    }
};
