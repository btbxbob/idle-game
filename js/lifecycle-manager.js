class LifecycleManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
    }

    update() {
        if (!this.rustGame || typeof this.rustGame.get_lifecycle_status_json !== 'function') {
            return null;
        }
        try {
            return JSON.parse(this.rustGame.get_lifecycle_status_json());
        } catch (error) {
            console.error('Failed to get lifecycle status:', error);
            return null;
        }
    }

    renderToPanel(panelId = 'lifecycle-panel') {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const s = this.update();
        if (!s) {
            panel.innerHTML = '<p>生命周期状态不可用</p>';
            return;
        }

        const darkRows = s.dark_cycle_revealed ? `
                <div>尸体: ${this.formatDecimal(s.corpses)}</div>
                <div>蛆虫: ${this.formatDecimal(s.maggots)}</div>
            ` : '';
        const coexistenceRows = s.coexistence_revealed ? `
                <div>人类压力: ${this.formatDecimal(s.human_pressure)}</div>
                <div>蛆虫影响: ${this.formatDecimal(s.maggot_influence)}</div>
                <div>共生稳定度: ${this.formatDecimal(s.symbiosis_stability)}</div>
                <div>混合人口: ${this.formatDecimal(s.hybrid_population)}</div>
            ` : '';
        panel.innerHTML = `
            <div class="lifecycle-overview">
                <h3>生命周期资源</h3>
                <div class="lifecycle-anomaly ${this.escapeHtml(s.anomaly_level || 'stable')}">
                    <strong>异常等级: ${this.formatAnomalyLabel(s.anomaly_level)}</strong>
                    <span>${this.escapeHtml(s.anomaly_text || '')}</span>
                </div>
                <div>工人: ${this.formatInteger(s.workers)}</div>
                <div>饥饿工人: ${this.formatInteger(s.hungry_workers)}</div>
                <div>等待队列: ${this.formatInteger(s.queue_workers)}</div>
                <div>住房容量: ${this.formatInteger(s.housing_capacity)}</div>
                <div>食物: ${this.formatDecimal(s.food)}</div>
                ${darkRows}
                ${coexistenceRows}
            </div>
        `;
    }

    renderResourceWidget(panelId = 'banner-top-monitor') {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const s = this.update();
        if (!s) {
            panel.innerHTML = '';
            return;
        }

        if (this.rustGame && typeof this.rustGame.getProgressionStateJson === 'function') {
            try {
                const progression = JSON.parse(this.rustGame.getProgressionStateJson());
                if (progression.current_stage_id === 'stage_genesis') {
                    panel.innerHTML = '';
                    return;
                }
            } catch (error) {
                console.error('Failed to read progression state for lifecycle widget:', error);
            }
        }

        const workers = Number(s.workers || 0);
        const food = Number(s.food || 0);
        const corpses = Number(s.corpses || 0);
        const maggots = Number(s.maggots || 0);
        const hungry = Number(s.hungry_workers || 0);
        const queue = Number(s.queue_workers || 0);
        const foodConsumeRate = workers * 0.2;
        const foodWarning = hungry > 0 || food < workers;

        const maggotFactoryCount = this.getMaggotFactoryCount();
        const canProcessNow = maggotFactoryCount > 0 && maggots >= 10;
        const anomalyBadge = this.formatAnomalyLabel(s.anomaly_level);
        const darkCycleInline = s.dark_cycle_revealed ? `
                    <span>尸体 ${this.formatDecimal(corpses)}</span>
                    <span>蛆虫 ${this.formatDecimal(maggots)} (转化 ${this.formatInteger(maggots / 10)})</span>
                    <span>蛆虫工厂 x${this.formatInteger(maggotFactoryCount)}</span>
                    ${maggotFactoryCount > 0 ? `<button type="button" id="process-maggot-now" ${canProcessNow ? '' : 'disabled'}>立即转化</button>` : ''}
                ` : '';
        const coexistenceInline = s.coexistence_revealed ? `
                    <span>稳态 ${this.formatDecimal(s.symbiosis_stability)}</span>
                    <span>混合人口 ${this.formatDecimal(s.hybrid_population)}</span>
                ` : '';

        panel.innerHTML = `
            <div class="lifecycle-resource-widget compact ${foodWarning ? 'warning' : ''}">
                <div class="widget-inline">
                    <span class="widget-badge ${foodWarning ? 'danger' : 'ok'}">${foodWarning ? '补给紧张' : '稳定'}</span>
                    <span class="widget-badge anomaly ${this.escapeHtml(s.anomaly_level || 'stable')}">${anomalyBadge}</span>
                    <span>工人 ${this.formatInteger(workers)}</span>
                    <span class="${hungry > 0 ? 'danger' : ''}">饥饿 ${this.formatInteger(hungry)}</span>
                    <span>队列 ${this.formatInteger(queue)}</span>
                    <span>食物 ${this.formatDecimal(food)} (${this.formatDecimal(foodConsumeRate)}/秒)</span>
                    <span class="lifecycle-inline-text">${this.escapeHtml(s.anomaly_text || '')}</span>
                    ${darkCycleInline}
                    ${coexistenceInline}
                </div>
            </div>
        `;

        const processButton = document.getElementById('process-maggot-now');
        if (processButton) {
            processButton.addEventListener('click', () => {
                if (!this.rustGame || typeof this.rustGame.game_loop !== 'function') {
                    return;
                }
                try {
                    this.rustGame.game_loop();
                    this.renderResourceWidget(panelId);
                } catch (error) {
                    console.error('Failed to process maggot conversion:', error);
                }
            });
        }

    }

    getMaggotFactoryCount() {
        if (!this.rustGame || typeof this.rustGame.get_buildings !== 'function') return 0;
        try {
            const buildings = this.rustGame.get_buildings();
            if (!Array.isArray(buildings)) return 0;
            const item = buildings.find((b) => b && b.name === '蛆虫工厂');
            return item ? Number(item.count || 0) : 0;
        } catch (error) {
            console.error('Failed to get maggot factory count:', error);
            return 0;
        }
    }

    formatInteger(value) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatInteger === 'function') {
            return window.NumberFormatter.formatInteger(value);
        }

        return Math.floor(Number(value) || 0).toLocaleString();
    }

    formatDecimal(value, fractionDigits = 1) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatDecimal === 'function') {
            return window.NumberFormatter.formatDecimal(value, { fractionDigits });
        }

        return Number(value || 0).toFixed(fractionDigits);
    }

    formatAnomalyLabel(level) {
        switch (level) {
            case 'warning':
                return '异常预警';
            case 'decay':
                return '秩序衰败';
            case 'breach':
                return '裂口成形';
            default:
                return '暂时稳定';
        }
    }

    escapeHtml(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
}

window.LifecycleManager = LifecycleManager;

window.updateLifecyclePanel = function() {
    if (!window.lifecycleManager) return;

    const lifecycleTab = document.getElementById('tab-lifecycle');
    if (lifecycleTab && lifecycleTab.classList.contains('active')) {
        window.lifecycleManager.renderToPanel('lifecycle-panel');
    }

    window.lifecycleManager.renderResourceWidget('banner-top-monitor');
};
