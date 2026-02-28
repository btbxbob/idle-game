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

        panel.innerHTML = `
            <div class="lifecycle-overview">
                <h3>生命周期资源</h3>
                <div>工人: ${s.workers}</div>
                <div>饥饿工人: ${s.hungry_workers}</div>
                <div>等待队列: ${s.queue_workers}</div>
                <div>住房容量: ${s.housing_capacity}</div>
                <div>食物: ${Number(s.food || 0).toFixed(1)}</div>
                <div>尸体: ${Number(s.corpses || 0).toFixed(1)}</div>
                <div>蛆虫: ${Number(s.maggots || 0).toFixed(1)}</div>
            </div>
        `;
    }

    renderResourceWidget(panelId = 'lifecycle-resource-widget') {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const s = this.update();
        if (!s) {
            panel.innerHTML = '';
            return;
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
        const maggotToFoodRate = maggotFactoryCount;

        panel.innerHTML = `
            <div class="lifecycle-resource-widget ${foodWarning ? 'warning' : ''}">
                <div class="widget-header">
                    <h4>生命周期资源监控</h4>
                    <span class="widget-badge ${foodWarning ? 'danger' : 'ok'}">${foodWarning ? '补给紧张' : '稳定'}</span>
                </div>
                <div class="widget-grid">
                    <div class="widget-item">
                        <span>食物</span>
                        <strong>${food.toFixed(1)}</strong>
                        <small>消耗速率 ${foodConsumeRate.toFixed(1)}/秒</small>
                    </div>
                    <div class="widget-item">
                        <span>尸体</span>
                        <strong>${corpses.toFixed(1)}</strong>
                    </div>
                    <div class="widget-item">
                        <span>蛆虫</span>
                        <strong>${maggots.toFixed(1)}</strong>
                        <small>可转化食物 ${Math.floor(maggots / 10)}</small>
                    </div>
                    <div class="widget-item ${hungry > 0 ? 'danger' : ''}">
                        <span>饥饿工人</span>
                        <strong>${hungry}</strong>
                        <small>等待队列 ${queue}</small>
                    </div>
                </div>
                <div class="maggot-factory-panel">
                    <div class="maggot-factory-info">
                        <span>蛆虫工厂</span>
                        <strong>x${maggotFactoryCount}</strong>
                        <small>理论转化 ${maggotToFoodRate.toFixed(1)} 食物/秒</small>
                    </div>
                    <button type="button" id="process-maggot-now" ${maggotFactoryCount === 0 ? 'disabled' : ''}>立即处理蛆虫</button>
                </div>
            </div>
        `;

        const processBtn = document.getElementById('process-maggot-now');
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                if (this.rustGame && typeof this.rustGame.game_loop === 'function') {
                    this.rustGame.game_loop();
                    this.renderResourceWidget(panelId);
                    this.renderToPanel('lifecycle-panel');
                    if (window.updateResourcePanel) {
                        window.updateResourcePanel();
                    }
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
}

window.LifecycleManager = LifecycleManager;

window.updateLifecyclePanel = function() {
    if (!window.lifecycleManager) return;

    const lifecycleTab = document.getElementById('tab-lifecycle');
    if (lifecycleTab && lifecycleTab.classList.contains('active')) {
        window.lifecycleManager.renderToPanel('lifecycle-panel');
    }

    const resourcesTab = document.getElementById('tab-resources');
    if (resourcesTab && resourcesTab.classList.contains('active')) {
        window.lifecycleManager.renderResourceWidget('lifecycle-resource-widget');
    }
};
