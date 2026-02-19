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
                'clickFormat': '{resource}/click: {amount}'
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
                'clickFormat': '{resource}/点击：{amount}'
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
        this.updateElement('version-label', 'version');
        this.updateElement('click-to-earn-coins', 'clickToEarnCoins');
        this.updateElement('workers-placeholder', 'workersPlaceholder');
        
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