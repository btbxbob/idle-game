class WorkOverviewManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
    }

    update() {
        if (!this.rustGame || typeof this.rustGame.get_work_overview_json !== 'function') {
            return null;
        }
        try {
            return JSON.parse(this.rustGame.get_work_overview_json());
        } catch (error) {
            console.error('Failed to get work overview:', error);
            return null;
        }
    }

    renderToPanel(panelId = 'work-overview-panel') {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const overview = this.update();
        if (!overview) {
            panel.innerHTML = '<p>工作总览数据不可用</p>';
            return;
        }

        const jobs = Array.isArray(overview.jobs) ? overview.jobs : [];
        const maxWorkers = jobs.reduce((max, job) => Math.max(max, Number(job.worker_count || 0)), 0);
        const maxOutput = jobs.reduce((max, job) => Math.max(max, Number(job.total_output || 0)), 0);
        const rows = jobs
            .slice()
            .sort((a, b) => Number(b.total_output || 0) - Number(a.total_output || 0))
            .map((j) => {
                const workerCount = Number(j.worker_count || 0);
                const avgEfficiency = Number(j.avg_efficiency || 0);
                const totalOutput = Number(j.total_output || 0);
                const workerBar = maxWorkers > 0 ? Math.max(4, Math.round((workerCount / maxWorkers) * 100)) : 0;
                const outputBar = maxOutput > 0 ? Math.max(4, Math.round((totalOutput / maxOutput) * 100)) : 0;
                return `
                    <tr>
                        <td>${this.escapeHtml(j.job_type || '未命名工种')}</td>
                        <td>
                            <div class="metric-cell">
                                <span>${this.formatInteger(workerCount)}</span>
                                <div class="metric-bar"><i style="width:${workerBar}%"></i></div>
                            </div>
                        </td>
                        <td>${this.formatPercent(avgEfficiency * 100)}</td>
                        <td>
                            <div class="metric-cell">
                                <span>${this.formatDecimal(totalOutput, 2)}</span>
                                <div class="metric-bar output"><i style="width:${outputBar}%"></i></div>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join('');

        const totalWorkers = Number(overview.total_workers || 0);
        const unassignedWorkers = Number(overview.unassigned_workers || 0);
        const assignedWorkers = Math.max(0, totalWorkers - unassignedWorkers);
        const totalEfficiency = Number(overview.total_efficiency || 0);
        const avgGlobalEfficiency = totalWorkers > 0 ? (totalEfficiency / totalWorkers) : 0;
        const assignmentRate = totalWorkers > 0 ? Math.round((assignedWorkers / totalWorkers) * 100) : 0;

        const pieSegments = jobs
            .filter((j) => Number(j.worker_count || 0) > 0)
            .slice()
            .sort((a, b) => Number(b.worker_count || 0) - Number(a.worker_count || 0));

        const pie = this.buildPieGradient(pieSegments, totalWorkers);
        const legend = pieSegments
            .map((j, index) => {
                const color = this.getPaletteColor(index);
                const count = Number(j.worker_count || 0);
                const ratio = totalWorkers > 0 ? Math.round((count / totalWorkers) * 100) : 0;
                return `<li><span class="legend-dot" style="background:${color}"></span><span>${this.escapeHtml(j.job_type || '未命名')} (${this.formatInteger(count)}, ${ratio}%)</span></li>`;
            })
            .join('');

        panel.innerHTML = `
            <div class="work-overview">
                <h3>工作总览</h3>
                <div class="work-overview-summary">
                    <div class="summary-card"><strong>${this.formatInteger(totalWorkers)}</strong><span>总工人</span></div>
                    <div class="summary-card"><strong>${this.formatInteger(assignedWorkers)}</strong><span>已分配</span></div>
                    <div class="summary-card"><strong>${this.formatInteger(unassignedWorkers)}</strong><span>空闲工人</span></div>
                    <div class="summary-card"><strong>${this.formatPercent(avgGlobalEfficiency * 100)}</strong><span>总平均效率</span></div>
                </div>
                <div class="assignment-progress">
                    <span>分配率 ${this.formatPercent(assignmentRate, 0)}</span>
                    <div class="assignment-progress-bar"><i style="width:${assignmentRate}%"></i></div>
                </div>
                <div class="work-overview-chart">
                    <div class="workforce-pie" style="background:${pie}"></div>
                    <ul class="workforce-legend">${legend || '<li>暂无工种分布数据</li>'}</ul>
                </div>
                <table class="work-overview-table">
                    <thead><tr><th>工种</th><th>人数</th><th>平均效率</th><th>总产出贡献</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="4">暂无分配数据</td></tr>'}</tbody>
                </table>
            </div>
        `;
    }

    buildPieGradient(segments, totalWorkers) {
        if (!segments.length || totalWorkers <= 0) {
            return 'conic-gradient(#777 0deg 360deg)';
        }

        let start = 0;
        const parts = segments.map((segment, index) => {
            const ratio = Number(segment.worker_count || 0) / totalWorkers;
            const end = start + ratio * 360;
            const color = this.getPaletteColor(index);
            const part = `${color} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`;
            start = end;
            return part;
        });
        if (start < 360) {
            parts.push(`#777 ${start.toFixed(1)}deg 360deg`);
        }
        return `conic-gradient(${parts.join(',')})`;
    }

    getPaletteColor(index) {
        const palette = ['#58d68d', '#5dade2', '#f5b041', '#af7ac5', '#ec7063', '#48c9b0', '#f4d03f'];
        return palette[index % palette.length];
    }

    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    formatDecimal(value, fractionDigits = 1) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatDecimal === 'function') {
            return window.NumberFormatter.formatDecimal(value, { fractionDigits });
        }

        return Number(value || 0).toFixed(fractionDigits);
    }

    formatInteger(value) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatInteger === 'function') {
            return window.NumberFormatter.formatInteger(value);
        }

        return Math.floor(Number(value) || 0).toLocaleString();
    }

    formatPercent(value, fractionDigits = 1) {
        if (window.NumberFormatter && typeof window.NumberFormatter.formatPercent === 'function') {
            return window.NumberFormatter.formatPercent(value, { fractionDigits });
        }

        return `${Number(value || 0).toFixed(fractionDigits)}%`;
    }
}

window.WorkOverviewManager = WorkOverviewManager;
