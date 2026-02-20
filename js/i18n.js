// Internationalization system for the idle game
class I18n {
    constructor() {
        this.currentLanguage = 'zh-CN'; // Default to Simplified Chinese
        this.translations = {
            'en': {
                // Game title and headers
                'gameTitle': 'Rust WASM Idle Game',
                'clickToEarn': 'Click to earn coins and buy upgrades!',
                'upgrades': 'Upgrades',
                'buildings': 'Buildings',
                'workers': 'Workers',
                'settings': 'Settings',
                'footerText': 'Idle Game Framework built with Rust and WebAssembly',
                
                // Resource labels
                'coins': 'Coins',
                'wood': 'Wood', 
                'stone': 'Stone',
                'coinsPerSecond': 'Coins/sec',
                'woodPerSecond': 'Wood/sec',
                'stonePerSecond': 'Stone/sec',
                'coinsPerClick': 'Coins/click',
                
                // Click area
                'clickToEarnCoins': 'Click to earn coins',
                
                // Workers
                'workersPlaceholder': 'Worker system will be implemented in a future version',
                'unassigned': 'Unassigned',
                'assigned': 'Assigned',
                'level': 'Level',
                'assignedBuilding': 'Assigned Building',
                'efficiency': 'Efficiency',
                'skills': 'Skills',
                'preferences': 'Preferences',
                'experience': 'Experience',
                'assignWorker': 'Assign Worker',
                'reassignWorker': 'Reassign Worker',
                'assign': 'Assign',
                'reassign': 'Reassign',
                'selectBuilding': 'Select Building',
                'unassign': 'Unassign',
                'invalidWorker': 'Invalid Worker',
                'currentLevel': 'Current Level',
                'efficiencyBonus': 'Efficiency Bonus',
                'preference': 'Preference',
                'cancel': 'Cancel',
                'confirm': 'Confirm',
                'assignFailed': 'Assignment Failed',
                'totalWorkers': 'Total Workers',
                'assignedWorkers': 'Assigned',
                'noWorkers': 'No workers available',
                
                // Building/Upgrade labels
                'cost': 'Cost',
                'owned': 'Owned',
                'buy': 'Buy',
                'perBuilding': '/sec per building',
                'perSecond': '/sec',
                'perClick': ' coins/click',
                'woodPerSecondShort': ' wood/sec',
                'stonePerSecondShort': ' stone/sec',
                
                // Settings
                'theme': 'Theme',
                'language': 'Language',
                'lightTheme': 'Light Theme',
                'darkTheme': 'Dark Theme',
                'gameVersion': 'Game Version',
                'version': 'Version',
                'resetGame': 'Reset Game',
                'resetGameConfirm': 'Are you sure you want to reset the game? All progress will be lost!',
                
                // Resource display format
                'resourceFormat': '{resource}: {amount}',
                'productionFormat': '{resource}/sec: {amount}',
                'clickFormat': '{resource}/click: {amount}',
                
                // Statistics
                'statisticsTab': 'Statistics',
                'gameStats': 'Game Statistics',
                'progressStats': 'Progress Statistics',
                'totalClicks': 'Total Clicks',
                'totalCoinsEarned': 'Total Coins Earned',
                'totalWoodEarned': 'Total Wood Earned',
                'totalStoneEarned': 'Total Stone Earned',
                'totalResourcesCrafted': 'Total Resources Crafted',
                'playTime': 'Play Time',
                'buildingsPurchased': 'Buildings Purchased',
                'upgradesPurchased': 'Upgrades Purchased',
                'achievementsUnlocked': 'Achievements Unlocked',
                'achievementUnlockedTitle': 'Achievement Unlocked!',
                'achievementUnlocked': 'Achievement Unlocked',
                'justNow': 'Just now',
                'minutesAgo': '{count} minutes ago',
                'hoursAgo': '{count} hours ago',
                'daysAgo': '{count} days ago',
                'achievementCategory_clicks': 'Clicks',
                'achievementCategory_resources': 'Resources',
                'achievementCategory_buildings': 'Buildings',
                'achievementCategory_crafting': 'Crafting',
                'achievementCategory_unlocks': 'Unlocks'
            },
            'zh-CN': {
                // Game title and headers
                'gameTitle': 'Rust WASM 闲置游戏',
                'clickToEarn': '点击赚取金币并购买升级！',
                'upgrades': '升级',
                'buildings': '建筑',
                'workers': '工人',
                'settings': '设置',
                'footerText': '使用 Rust 和 WebAssembly 构建的闲置游戏框架',
                
                // Resource labels
                'coins': '金币',
                'wood': '木头',
                'stone': '石头',
                'coinsPerSecond': '金币/秒',
                'woodPerSecond': '木头/秒',
                'stonePerSecond': '石头/秒',
                'coinsPerClick': '金币/点击',
                
                // Click area
                'clickToEarnCoins': '点击赚取金币',
                
                // Workers
                'workersPlaceholder': '工人系统将在未来版本中实现',
                'unassigned': '未分配',
                'assigned': '已分配',
                'level': '等级',
                'assignedBuilding': '分配建筑',
                'efficiency': '效率',
                'skills': '技能',
                'preferences': '偏好',
                'experience': '经验',
                'assignWorker': '分配工人',
                'reassignWorker': '重新分配',
                'assign': '分配',
                'reassign': '重新分配',
                'selectBuilding': '选择建筑',
                'unassign': '取消分配',
                'invalidWorker': '无效工人',
                'currentLevel': '当前等级',
                'efficiencyBonus': '效率加成',
                'preference': '偏好',
                'cancel': '取消',
                'confirm': '确认',
                'assignFailed': '分配失败',
                'totalWorkers': '总工人',
                'assignedWorkers': '已分配',
                'noWorkers': '没有工人',
                
                // Building/Upgrade labels
                'cost': '花费',
                'owned': '拥有',
                'buy': '购买',
                'perBuilding': '/秒 每建筑',
                'perSecond': '/秒',
                'perClick': ' 金币/点击',
                'woodPerSecondShort': ' 木头/秒',
                'stonePerSecondShort': ' 石头/秒',
                
                // Settings
                'theme': '主题',
                'language': '语言',
                'lightTheme': '亮色主题',
                'darkTheme': '暗色主题',
                'gameVersion': '游戏版本',
                'version': '版本',
                'resetGame': '重置游戏',
                'resetGameConfirm': '确定要重置游戏吗？所有进度将丢失！',
                
                // Resource display format
                'resourceFormat': '{resource}: {amount}',
                'productionFormat': '{resource}/秒：{amount}',
                'clickFormat': '{resource}/点击：{amount}',
                
                // Statistics
                'statisticsTab': '统计',
                'gameStats': '游戏统计',
                'progressStats': '进度统计',
                'totalClicks': '总点击次数',
                'totalCoinsEarned': '总获得金币',
                'totalWoodEarned': '总获得木头',
                'totalStoneEarned': '总获得石头',
                'totalResourcesCrafted': '总合成物品',
                'playTime': '游戏时间',
                'buildingsPurchased': '购买建筑',
                'upgradesPurchased': '购买升级',
                'achievementsUnlocked': '解锁成就',
                'achievementUnlockedTitle': '成就解锁!',
                'achievementUnlocked': '成就解锁',
                'justNow': '刚刚',
                'minutesAgo': '{count}分钟前',
                'hoursAgo': '{count}小时前',
                'daysAgo': '{count}天前',
                'achievementCategory_clicks': '点击',
                'achievementCategory_resources': '资源',
                'achievementCategory_buildings': '建筑',
                'achievementCategory_crafting': '合成',
                'achievementCategory_unlocks': '解锁'
            }
        };
    }
    
    // Set current language
    setLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            return true;
        }
        return false;
    }
    
    // Get translation for a key
    t(key, params = {}) {
        const translation = this.translations[this.currentLanguage][key] || 
                           this.translations['en'][key] || 
                           key;
        
        // Replace parameters in the translation
        let result = translation;
        for (const [param, value] of Object.entries(params)) {
            result = result.replace(new RegExp(`{${param}}`, 'g'), value);
        }
        return result;
    }
    
    // Update all translatable elements on the page
    updateAllTranslations() {
        // Update static text elements
        this.updateElement('game-title', 'gameTitle');
        this.updateElement('click-to-earn', 'clickToEarn');
        this.updateElement('upgrades-header', 'upgrades');
        this.updateElement('buildings-header', 'buildings');
        this.updateElement('workers-header', 'workers');
        this.updateElement('settings-header', 'settings');
        this.updateElement('footer-text', 'footerText');
        this.updateElement('click-to-earn-coins', 'clickToEarnCoins');
        this.updateElement('workers-placeholder', 'workersPlaceholder');
        
        this.updateElement('workers-list', 'noWorkers');
        
        // Update settings labels
        this.updateLabel('theme-select-setting', 'theme');
        this.updateLabel('language-select-setting', 'language');
        
        // Update resource displays (these will be handled by resource update functions)
        this.updateResourceDisplays();
    }
    
    // Update a label element
    updateLabel(elementId, translationKey) {
        const element = document.getElementById(elementId);
        if (element) {
            const label = element.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.textContent = this.t(translationKey) + ' / ' + this.t(translationKey, {locale: 'en'});
            }
        }
    }
    
    // Update a specific element with translation
    updateElement(elementId, translationKey) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.t(translationKey);
        }
    }
    
    // Update resource display formats
    updateResourceDisplays(coins = 0, wood = 0, stone = 0, 
                          coinsPerSec = 0, woodPerSec = 0, stonePerSec = 0, 
                          coinsPerClick = 0) {
        // Update resource amount displays
        this.updateResourceElement('coins', 'coins', coins);
        this.updateResourceElement('wood', 'wood', wood);
        this.updateResourceElement('stone', 'stone', stone);
        
        // Update production rate displays
        this.updateProductionElement('cps', 'coins', coinsPerSec);
        this.updateProductionElement('wps', 'wood', woodPerSec);
        this.updateProductionElement('sps', 'stone', stonePerSec);
        
        // Update click rate display
        this.updateClickElement('cpc', 'coins', coinsPerClick);
        
        // Update middle coin display
        this.updateCoinDisplay('coin-display', coins);
    }
    
     updateCoinDisplay(elementId, amount) {
         const element = document.getElementById(elementId);
         if (element) {
             // Ensure amount is a valid finite number before processing
             const safeAmount = (typeof amount === 'number' && isFinite(amount)) ? amount : 0;
             element.textContent = Math.floor(safeAmount).toString();
         }
     }
    
     updateResourceElement(elementId, resourceKey, amount) {
         const element = document.getElementById(elementId);
         if (element) {
             const resourceName = this.t(resourceKey);
             // Ensure amount is a valid finite number before processing
             const safeAmount = (typeof amount === 'number' && isFinite(amount)) ? amount : 0;
             element.textContent = this.t('resourceFormat', { 
                 resource: resourceName, 
                 amount: Math.floor(safeAmount) 
             });
         }
     }
    
     updateProductionElement(elementId, resourceKey, amount) {
         const element = document.getElementById(elementId);
         if (element) {
             const resourceName = this.t(resourceKey);
             // Ensure amount is a valid finite number before processing
             const safeAmount = (typeof amount === 'number' && isFinite(amount)) ? amount : 0;
             element.textContent = this.t('productionFormat', { 
                 resource: resourceName, 
                 amount: safeAmount.toFixed(1) 
             });
         }
     }
    
     updateClickElement(elementId, resourceKey, amount) {
         const element = document.getElementById(elementId);
         if (element) {
             const resourceName = this.t(resourceKey);
             // Ensure amount is a valid finite number before processing
             const safeAmount = (typeof amount === 'number' && isFinite(amount)) ? amount : 0;
             element.textContent = this.t('clickFormat', { 
                 resource: resourceName, 
                 amount: safeAmount.toFixed(1) 
             });
         }
     }
    
    // Get available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
    
    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Initialize global i18n instance
window.i18n = new I18n();