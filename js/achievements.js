class AchievementManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.lastAchievementCount = 0;
        this.notificationTimeout = null;
        this.notifiedAchievements = new Set();
    }

    update() {
        if (this.rustGame && typeof this.rustGame.get_achievements === 'function') {
            try {
                const achievements = this.rustGame.get_achievements();
                return achievements || [];
            } catch (error) {
                console.error('Failed to get achievements:', error);
                return [];
            }
        }
        return [];
    }

    renderAchievements(containerId = 'achievements-list') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Achievements container "${containerId}" not found`);
            return;
        }

        const achievements = this.update();
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

        if (achievements.length === 0) {
            container.innerHTML = `<p id="achievements-placeholder">${t('achievementsPlaceholder') || '成就系统将在未来版本中实现'}</p>`;
            return;
        }

        const categorized = {};
        achievements.forEach(achievement => {
            if (!categorized[achievement.category]) {
                categorized[achievement.category] = [];
            }
            categorized[achievement.category].push(achievement);
        });

        let html = '';
        for (const [category, categoryAchievements] of Object.entries(categorized)) {
            const categoryKey = `achievementCategory_${category}`;
            const categoryName = t(categoryKey) || this.getCategoryName(category);
            
            html += `<div class="achievement-category">
                <h4 class="achievement-category-title">${categoryName}</h4>
                <div class="achievements-grid">`;
            
            categoryAchievements.forEach(achievement => {
                const isUnlocked = achievement.unlocked;
                const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100);
                
                html += `
                    <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}" 
                         id="achievement-${achievement.id}"
                         title="${achievement.description}">
                        <div class="achievement-icon">
                            ${isUnlocked ? '🏆' : '🔒'}
                        </div>
                        <div class="achievement-info">
                            <div class="achievement-name">${achievement.name}</div>
                            <div class="achievement-description">${achievement.description}</div>
                            ${!isUnlocked ? `
                                <div class="achievement-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                                    </div>
                                    <div class="progress-text">${Math.floor(achievement.progress)} / ${Math.floor(achievement.requirement)}</div>
                                </div>
                            ` : `
                                <div class="achievement-unlocked-time">
                                    ${this.formatUnlockTime(achievement.unlock_timestamp)}
                                </div>
                            `}
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }

        container.innerHTML = html;
        this.checkNewUnlocks(achievements);
    }

    getCategoryName(category) {
        const categoryNames = {
            'clicks': '点击',
            'resources': '资源',
            'buildings': '建筑',
            'crafting': '合成',
            'unlocks': '解锁'
        };
        
        if (window.i18n && window.i18n.currentLanguage === 'en') {
            const enNames = {
                'clicks': 'Clicks',
                'resources': 'Resources',
                'buildings': 'Buildings',
                'crafting': 'Crafting',
                'unlocks': 'Unlocks'
            };
            return enNames[category] || category;
        }
        
        return categoryNames[category] || category;
    }

    formatUnlockTime(timestamp) {
        if (!timestamp) return '';
        
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMinutes = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

            if (diffMinutes < 1) {
                return t('justNow') || '刚刚';
            } else if (diffMinutes < 60) {
                return t('minutesAgo', { count: diffMinutes }) || `${diffMinutes}分钟前`;
            } else if (diffHours < 24) {
                return t('hoursAgo', { count: diffHours }) || `${diffHours}小时前`;
            } else if (diffDays < 7) {
                return t('daysAgo', { count: diffDays }) || `${diffDays}天前`;
            } else {
                return date.toLocaleDateString(window.i18n ? window.i18n.currentLanguage : 'zh-CN');
            }
        } catch (error) {
            return '';
        }
    }

    checkNewUnlocks(currentAchievements) {
        const unlockedCount = currentAchievements.filter(a => a.unlocked).length;
        
        if (unlockedCount > this.lastAchievementCount) {
            const newlyUnlocked = currentAchievements.filter(
                a => a.unlocked && !this.notifiedAchievements.has(a.id)
            );
            
            newlyUnlocked.forEach(achievement => {
                this.showNotification(achievement);
                this.notifiedAchievements.add(achievement.id);
            });
        }
        
        this.lastAchievementCount = unlockedCount;
    }

    showNotification(achievement) {
        const existingNotification = document.getElementById('achievement-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

        const notification = document.createElement('div');
        notification.id = 'achievement-notification';
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🏆</div>
                <div class="notification-text">
                    <div class="notification-title">${t('achievementUnlockedTitle') || '成就解锁!'}</div>
                    <div class="notification-name">${achievement.name}</div>
                    <div class="notification-description">${achievement.description}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    notifyAchievement(achievementId) {
        const achievements = this.update();
        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
            this.showNotification(achievement);
        }
    }
}

window.AchievementManager = AchievementManager;

window.updateAchievementsPanel = function() {
    if (window.achievementManager && typeof window.achievementManager.renderAchievements === 'function') {
        const achievementsTab = document.getElementById('tab-achievements');
        if (achievementsTab && achievementsTab.classList.contains('active')) {
            window.achievementManager.update();
            window.achievementManager.renderAchievements('achievements-list');
        } else {
            window.achievementManager.update();
            window.achievementManager.checkNewUnlocks(window.achievementManager.update());
        }
    }
};
