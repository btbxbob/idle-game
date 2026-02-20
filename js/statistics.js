class StatisticsManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
    }

    /**
     * Update statistics from Rust game state
     */
    update() {
        if (this.rustGame && typeof this.rustGame.get_statistics === 'function') {
            return this.rustGame.get_statistics();
        }
        return null;
    }

    /**
     * Format time in seconds as HH:MM:SS
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        const pad = (num) => num.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    }

    /**
     * Render statistics to a panel element
     * @param {string} panelId - DOM element ID for the statistics panel
     */
    renderToPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) {
            console.warn(`Statistics panel "${panelId}" not found`);
            return;
        }

        const stats = this.update();
        if (!stats) {
            console.warn('Statistics not available');
            return;
        }

        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

        // Format number with commas for readability
        const formatNumber = (num) => {
            return Math.floor(num).toLocaleString();
        };

        panel.innerHTML = `
            <div class="statistics-grid">
                <div class="statistic-item">
                    <span class="stat-label">${t('totalClicks')}</span>
                    <span class="stat-value">${formatNumber(stats.total_clicks)}</span>
                </div>
                <div class="statistic-item">
                    <span class="stat-label">${t('totalCoinsEarned')}</span>
                    <span class="stat-value">${formatNumber(stats.total_coins_earned)}</span>
                </div>
                <div class="statistic-item">
                    <span class="stat-label">${t('totalWoodEarned')}</span>
                    <span class="stat-value">${formatNumber(stats.total_wood_earned)}</span>
                </div>
                <div class="statistic-item">
                    <span class="stat-label">${t('totalStoneEarned')}</span>
                    <span class="stat-value">${formatNumber(stats.total_stone_earned)}</span>
                </div>
                <div class="statistic-item">
                    <span class="stat-label">${t('totalResourcesCrafted')}</span>
                    <span class="stat-value">${formatNumber(stats.total_resources_crafted)}</span>
                </div>
                <div class="statistic-item">
                    <span class="stat-label">${t('achievementsUnlocked')}</span>
                    <span class="stat-value">${formatNumber(stats.achievements_unlocked_count)}</span>
                </div>
                <div class="statistic-item">
                    <span class="stat-label">${t('playTime')}</span>
                    <span class="stat-value">${this.formatTime(stats.play_time_seconds)}</span>
                </div>
                <div class="statistic-item">
                    <span class="stat-label">${t('buildingsPurchased')}</span>
                    <span class="stat-value">${formatNumber(stats.buildings_purchased)}</span>
                </div>
                <div class="statistic-item">
                    <span class="stat-label">${t('upgradesPurchased')}</span>
                    <span class="stat-value">${formatNumber(stats.upgrades_purchased)}</span>
                </div>
            </div>
        `;
    }
}

window.StatisticsManager = StatisticsManager;
