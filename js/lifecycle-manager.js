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

    renderResourceWidget(panelId = 'banner-top-monitor') {
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

        panel.innerHTML = `
            <div class="lifecycle-resource-widget compact ${foodWarning ? 'warning' : ''}">
                <div class="widget-inline">
                    <span class="widget-badge ${foodWarning ? 'danger' : 'ok'}">${foodWarning ? '补给紧张' : '稳定'}</span>
                    <span>工人 ${workers}</span>
                    <span class="${hungry > 0 ? 'danger' : ''}">饥饿 ${hungry}</span>
                    <span>队列 ${queue}</span>
                    <span>食物 ${food.toFixed(1)} (${foodConsumeRate.toFixed(1)}/秒)</span>
                    <span>尸体 ${corpses.toFixed(1)}</span>
                    <span>蛆虫 ${maggots.toFixed(1)} (转化 ${Math.floor(maggots / 10)})</span>
                    <span>蛆虫工厂 x${maggotFactoryCount}</span>
                </div>
            </div>
        `;

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

    window.lifecycleManager.renderResourceWidget('banner-top-monitor');
};
