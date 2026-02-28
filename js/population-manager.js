class PopulationManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.sortColumn = 'name';
        this.sortDirection = 'asc';
        this.filter = 'all';
    }

    update() {
        if (this.rustGame && typeof this.rustGame.get_population_overview === 'function') {
            try {
                return this.rustGame.get_population_overview() || [];
            } catch (error) {
                console.error('Failed to get population overview:', error);
                return [];
            }
        }
        return [];
    }

    sortByColumn(data, column, direction = 'asc') {
        return data.sort((a, b) => {
            let aVal = a[column] || '';
            let bVal = b[column] || '';
            let comparison = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'zh-CN');
            return direction === 'asc' ? comparison : -comparison;
        });
    }

    filterByStatus(data, filter) {
        if (filter === 'all') return data;
        if (filter === 'assigned') return data.filter(w => w.assigned_building !== '未分配');
        if (filter === 'unassigned') return data.filter(w => w.assigned_building === '未分配');
        if (filter === 'hungry') return data.filter(w => w.is_hungry === true);
        return data;
    }

    formatEfficiency(multiplier) {
        const bonus = (multiplier - 1.0) * 100;
        return bonus >= 0 ? '+' + bonus.toFixed(1) + '%' : bonus.toFixed(1) + '%';
    }

    formatStatus(status, isHungry) {
        if (isHungry) return '😫 饥饿';
        if (status === '工作中') return '🔨 工作中';
        if (status === '空闲') return '😌 空闲';
        return status;
    }

    formatColoredValue(value, low, high) {
        const cls = value < low ? 'value-low' : (value >= high ? 'value-high' : 'value-normal');
        return '<span class="' + cls + '">' + value.toFixed(1) + '</span>';
    }

    renderPopulation() {
        const container = document.getElementById('population-table-body');
        if (!container) return;

        let population = this.update();
        if (population.length === 0) {
            container.innerHTML = '<tr><td colspan="10" class="empty-message">暂无人口数据</td></tr>';
            this.updateSummary(0);
            return;
        }

        population = this.filterByStatus(population, this.filter);
        population = this.sortByColumn(population, this.sortColumn, this.sortDirection);
        this.updateSummary(population.length);

        let html = '';
        population.forEach(w => {
            const statusClass = w.is_hungry ? 'status-hungry' : (w.assigned_building !== '未分配' ? 'status-working' : 'status-idle');
            html += '<tr class="population-row ' + statusClass + '" data-worker-id="' + w.id + '">' +
                '<td class="cell-name">' + w.name + '</td>' +
                '<td class="cell-gender">' + w.gender + '</td>' +
                '<td class="cell-age">' + w.age + '</td>' +
                '<td class="cell-level">Lv.' + w.level + '</td>' +
                '<td class="cell-skill">' + w.skill_level + '</td>' +
                '<td class="cell-building">' + w.assigned_building + '</td>' +
                '<td class="cell-efficiency">' + this.formatEfficiency(w.efficiency) + '</td>' +
                '<td class="cell-mood">' + this.formatColoredValue(w.mood, 30, 70) + '</td>' +
                '<td class="cell-health">' + this.formatColoredValue(w.health, 30, 70) + '</td>' +
                '<td class="cell-status ' + statusClass + '">' + this.formatStatus(w.status, w.is_hungry) + '</td>' +
                '</tr>';
        });
        container.innerHTML = html;
    }

    updateSummary(count) {
        const el = document.getElementById('population-summary');
        if (!el) return;
        const pop = this.update();
        el.textContent = '总人数：' + pop.length + ' | 显示：' + count + ' | 已分配:' + pop.filter(w => w.assigned_building !== '未分配').length + ' | 饥饿:' + pop.filter(w => w.is_hungry).length;
    }

    setSortColumn(col) {
        if (this.sortColumn === col) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = col;
            this.sortDirection = 'asc';
        }
        this.updateSortIndicators();
        this.renderPopulation();
    }

    updateSortIndicators() {
        document.querySelectorAll('#population-table th[data-sort]').forEach(th => {
            const col = th.getAttribute('data-sort');
            th.textContent = th.textContent.replace(' ▲', '').replace(' ▼', '');
            if (col === this.sortColumn) {
                th.textContent += this.sortDirection === 'asc' ? ' ▲' : ' ▼';
                th.classList.add('sorted');
            } else {
                th.classList.remove('sorted');
            }
        });
    }

    setFilter(filter) {
        this.filter = filter;
        this.renderPopulation();
    }

    initialize() {
        document.querySelectorAll('#population-table th[data-sort]').forEach(th => {
            th.classList.add('sortable');
            th.addEventListener('click', () => this.setSortColumn(th.getAttribute('data-sort')));
        });
        const fs = document.getElementById('population-filter');
        if (fs) fs.addEventListener('change', e => this.setFilter(e.target.value));
        this.renderPopulation();
    }
}

window.PopulationManager = PopulationManager;
