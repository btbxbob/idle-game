// Internationalization system for the idle game
class I18n {
    constructor() {
        this.currentLanguage = 'zh-CN'; // Default to Simplified Chinese
        this.translations = {
            'en': {
                // Game title and headers
                'gameTitle': 'Rust WASM Idle Game',
                'clickToEarn': 'Click to earn coins and buy buildings!',
                'upgrades': 'Upgrades',
                'buildings': 'Buildings',
                'workers': 'Workers',
                'settings': 'Settings',
                'footerText': 'Idle Game Framework built with Rust and WebAssembly',
                
                // Resource labels - Primary (Tier 1)
                'coins': 'Coins',
                'wood': 'Wood', 
                'stone': 'Stone',
                'ironOre': 'Iron Ore',
                'copperOre': 'Copper Ore',
                'aluminumOre': 'Aluminum Ore',
                'coal': 'Coal',
                'oil': 'Oil',
                'crystal': 'Crystal',
                'food': 'Food',
                'maggot': 'Maggot',
                'corpse': 'Corpse',
                
                // Resource labels - Secondary (Tier 2)
                'ironIngot': 'Iron Ingot',
                'copperIngot': 'Copper Ingot',
                'aluminumIngot': 'Aluminum Ingot',
                'steelPlate': 'Steel Plate',
                'copperPlate': 'Copper Plate',
                'aluminumPlate': 'Aluminum Plate',
                'glass': 'Glass',
                'plastic': 'Plastic',
                'chemicals': 'Chemicals',
                'fuel': 'Fuel',
                'paper': 'Paper',
                'ink': 'Ink',
                'cloth': 'Cloth',
                'leather': 'Leather',
                'ceramic': 'Ceramic',
                'cement': 'Cement',
                'brick': 'Brick',
                'rebar': 'Rebar',
                'wire': 'Wire',
                'pipe': 'Pipe',
                'valve': 'Valve',
                'gear': 'Gear',
                'bearing': 'Bearing',
                'spring': 'Spring',
                'screw': 'Screw',
                'nut': 'Nut',
                'washer': 'Washer',
                'pump': 'Pump',
                'motor': 'Motor',
                'sensor': 'Sensor',
                'circuitBoard': 'Circuit Board',
                'capacitor': 'Capacitor',
                'resistor': 'Resistor',
                'diode': 'Diode',
                'transistor': 'Transistor',
                'transformer': 'Transformer',
                'generator': 'Generator',
                'compressor': 'Compressor',
                'battery': 'Battery',
                
                // Resource labels - Advanced (Tier 3)
                'microchip': 'Microchip',
                'engine': 'Engine',
                'robot': 'Robot',
                'satellite': 'Satellite',
                'spaceship': 'Spaceship',
                'quantumComputer': 'Quantum Computer',
                'antimatter': 'Antimatter',
                'darkMatter': 'Dark Matter',
                'timeCrystal': 'Time Crystal',
                'nanobot': 'Nanobot',
                
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
                'search': 'Search',
                'all': 'All',
                'name': 'Name',
                'autoAssign': 'Auto Assign',
                'gender': 'Gender',
                'background': 'Background',
                'hobby': 'Hobby',
                'hobbies': 'Hobbies',
                'happiness': 'Happiness',
                'hunger': 'Hunger',
                'status': 'Status',
                'building': 'Building',
                'traits': 'Traits',
                'primaryTrait': 'Primary Trait',
                'secondaryTraits': 'Secondary Traits',
                'noPreference': 'None',
                'noHobby': 'None',
                'stableStatus': 'Stable',
                'hungryStatus': 'Hungry',
                'male': 'Male',
                'female': 'Female',
                'otherGender': 'Other',
                'autoAssignUnavailable': 'Auto assign is unavailable',
                'autoAssignConfirm': 'Auto assign all unassigned workers now?',
                'autoAssignSuccess': 'Auto assign completed: {count} workers assigned',
                'autoAssignFailed': 'Auto assign failed, please try again later',
                'skill_Mining': 'Mining',
                'skill_Cooking': 'Cooking',
                'skill_Farming': 'Farming',
                'skill_Building': 'Building',
                'skill_Crafting': 'Crafting',
                'skill_Research': 'Research',
                'skill_Gathering': 'Gathering',
                'skill_Smithing': 'Smithing',
                'skill_Engineering': 'Engineering',
                'skill_Alchemy': 'Alchemy',
                'preference_Quiet': 'Quiet',
                'preference_Loud': 'Loud',
                'preference_Indoor': 'Indoor',
                'preference_Outdoor': 'Outdoor',
                'preference_Teamwork': 'Teamwork',
                'preference_Solo': 'Solo',
                'background_Village': 'Village',
                'background_Forest': 'Forest',
                'background_City': 'City',
                'background_Mountain': 'Mountain',
                'background_River': 'River',
                'background_Desert': 'Desert',
                'background_Scholar': 'Scholar',
                'background_Merchant': 'Merchant',
                'background_Hunter': 'Hunter',
                'background_Farmer': 'Farmer',
                'hobby_Reading': 'Reading',
                'hobby_Gaming': 'Gaming',
                'hobby_Sports': 'Sports',
                'hobby_Music': 'Music',
                'hobby_Art': 'Art',
                'hobby_Cooking': 'Cooking',
                'hobby_Gardening': 'Gardening',
                'hobby_Fishing': 'Fishing',
                'hobby_Traveling': 'Traveling',
                'hobby_Photography': 'Photography',
                'housingPlaceholder': 'Housing system will be implemented in a future version',
                'housingLevel': 'Housing Level',
                'capacity': 'Capacity',
                'occupants': 'Occupants',
                'housingUpgradeCost': 'Upgrade Cost',
                'upgradeHousing': 'Upgrade',
                'housingManagement': 'Housing Management',
                'housingList': 'Housing Count',
                'totalCapacity': 'Total Capacity',
                'currentOccupancy': 'Current Occupancy',
                'queueWorkers': 'Queue',
                'occupancyRate': 'Occupancy Rate',
                'housingFullWarning': 'Housing is full. New population will enter the waiting queue.',
                'bulkUpgradeHousing': 'Bulk Upgrade Housing',
                'occupancyControl': 'Occupancy Control',
                'noHousing': 'No housing available',
                'housingUpgradeFailed': '{count} housing upgrades failed (insufficient resources)',
                
                // Building/Upgrade labels
                'cost': 'Cost',
                'owned': 'Owned',
                'buy': 'Buy',
                'craft': 'Craft',
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
                'saveLoadTitle': 'Save/Load Game',
                'manualSave': 'Manual Save',
                'saveSuccess': 'Saved ✓',
                'saveFailed': 'Save Failed ✗',
                'exportBase64': 'Export to BASE64',
                'importBase64': 'Import from BASE64',
                'importExportPlaceholder': 'Paste BASE64 string here...',
                'exportSuccess': 'Export successful! Copied to clipboard.',
                'importConfirm': 'Importing will overwrite current progress. Continue?',
                'importSuccess': 'Import successful! Game loaded.',
                'importFailed': 'Import failed',
                'importEmpty': 'Please paste a BASE64 string first.',
                
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
                'totalResourcesCrafted': 'Total Factory Output',
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
                'achievementCategory_crafting': 'Industry',
                'achievementCategory_unlocks': 'Unlocks'
            },
            'zh-CN': {
                // Game title and headers
                'gameTitle': 'Rust WASM 闲置游戏',
                'clickToEarn': '点击赚取金币并购买建筑！',
                'upgrades': '升级',
                'buildings': '建筑',
                'workers': '工人',
                'settings': '设置',
                'footerText': '使用 Rust 和 WebAssembly 构建的闲置游戏框架',
                
                // Resource labels - Primary (Tier 1)
                'coins': '金币',
                'wood': '木头',
                'stone': '石头',
                'ironOre': '铁矿',
                'copperOre': '铜矿',
                'aluminumOre': '铝矿',
                'coal': '煤炭',
                'oil': '石油',
                'crystal': '水晶',
                'food': '食物',
                'maggot': '蛆虫',
                'corpse': '尸体',
                
                // Resource labels - Secondary (Tier 2)
                'ironIngot': '铁锭',
                'copperIngot': '铜锭',
                'aluminumIngot': '铝锭',
                'steelPlate': '钢板',
                'copperPlate': '铜板',
                'aluminumPlate': '铝板',
                'glass': '玻璃',
                'plastic': '塑料',
                'chemicals': '化学品',
                'fuel': '燃料',
                'paper': '纸张',
                'ink': '墨水',
                'cloth': '布料',
                'leather': '皮革',
                'ceramic': '陶瓷',
                'cement': '水泥',
                'brick': '砖块',
                'rebar': '钢筋',
                'wire': '电线',
                'pipe': '管道',
                'valve': '阀门',
                'gear': '齿轮',
                'bearing': '轴承',
                'spring': '弹簧',
                'screw': '螺丝',
                'nut': '螺母',
                'washer': '垫片',
                'pump': '泵',
                'motor': '马达',
                'sensor': '传感器',
                'circuitBoard': '电路板',
                'capacitor': '电容器',
                'resistor': '电阻器',
                'diode': '二极管',
                'transistor': '晶体管',
                'transformer': '变压器',
                'generator': '发电机',
                'compressor': '压缩机',
                'battery': '电池',
                
                // Resource labels - Advanced (Tier 3)
                'microchip': '芯片',
                'engine': '引擎',
                'robot': '机器人',
                'satellite': '卫星',
                'spaceship': '太空船',
                'quantumComputer': '量子计算机',
                'antimatter': '反物质',
                'darkMatter': '暗物质',
                'timeCrystal': '时间水晶',
                'nanobot': '纳米机器',
                
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
                'search': '搜索',
                'all': '全部',
                'name': '姓名',
                'autoAssign': '自动分配',
                'gender': '性别',
                'background': '背景',
                'hobby': '爱好',
                'hobbies': '爱好',
                'happiness': '心情',
                'hunger': '饥饿',
                'status': '状态',
                'building': '建筑',
                'traits': '特性',
                'primaryTrait': '主特性',
                'secondaryTraits': '次特性',
                'noPreference': '无',
                'noHobby': '无',
                'stableStatus': '状态稳定',
                'hungryStatus': '饥饿中',
                'male': '男',
                'female': '女',
                'otherGender': '其他',
                'autoAssignUnavailable': '自动分配功能不可用',
                'autoAssignConfirm': '将为未分配工人执行自动分配，是否继续？',
                'autoAssignSuccess': '自动分配完成：成功分配 {count} 名工人',
                'autoAssignFailed': '自动分配失败，请稍后重试',
                'skill_Mining': '采矿',
                'skill_Cooking': '烹饪',
                'skill_Farming': '耕作',
                'skill_Building': '建造',
                'skill_Crafting': '制作',
                'skill_Research': '研究',
                'skill_Gathering': '采集',
                'skill_Smithing': '锻造',
                'skill_Engineering': '工程',
                'skill_Alchemy': '炼金',
                'preference_Quiet': '安静',
                'preference_Loud': '热闹',
                'preference_Indoor': '室内',
                'preference_Outdoor': '户外',
                'preference_Teamwork': '团队协作',
                'preference_Solo': '独立工作',
                'background_Village': '乡村出身',
                'background_Forest': '森林出身',
                'background_City': '城市出身',
                'background_Mountain': '山地出身',
                'background_River': '河畔出身',
                'background_Desert': '沙地出身',
                'background_Scholar': '学者出身',
                'background_Merchant': '商贩出身',
                'background_Hunter': '猎人出身',
                'background_Farmer': '农夫出身',
                'hobby_Reading': '阅读',
                'hobby_Gaming': '游戏',
                'hobby_Sports': '运动',
                'hobby_Music': '音乐',
                'hobby_Art': '艺术',
                'hobby_Cooking': '烹饪',
                'hobby_Gardening': '园艺',
                'hobby_Fishing': '钓鱼',
                'hobby_Traveling': '旅行',
                'hobby_Photography': '摄影',
                'housingPlaceholder': '住房系统将在未来版本中实现',
                'housingLevel': '住房等级',
                'capacity': '容量',
                'occupants': '入住人数',
                'housingUpgradeCost': '升级所需资源',
                'upgradeHousing': '升级住房',
                'housingManagement': '住房管理',
                'housingList': '住房数量',
                'totalCapacity': '总容量',
                'currentOccupancy': '当前入住',
                'queueWorkers': '等待队列',
                'occupancyRate': '入住率',
                'housingFullWarning': '住房容量已满，新增人口将进入等待队列',
                'bulkUpgradeHousing': '批量升级住房',
                'occupancyControl': '入住控制',
                'noHousing': '暂无住房建筑',
                'housingUpgradeFailed': '{count} 个住房升级失败（资源不足）',
                
                // Building/Upgrade labels
                'cost': '花费',
                'owned': '拥有',
                'buy': '购买',
                'craft': '合成',
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
                'saveLoadTitle': '保存/加载游戏',
                'manualSave': '手动保存',
                'saveSuccess': '已保存 ✓',
                'saveFailed': '保存失败 ✗',
                'exportBase64': '导出为 BASE64',
                'importBase64': '从 BASE64 导入',
                'importExportPlaceholder': '在此粘贴 BASE64 字符串...',
                'exportSuccess': '导出成功！已复制到剪贴板。',
                'importConfirm': '导入将覆盖当前游戏进度。确定继续吗？',
                'importSuccess': '导入成功！游戏已加载。',
                'importFailed': '导入失败',
                'importEmpty': '请先粘贴 BASE64 字符串。',
                
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
                'totalResourcesCrafted': '总工厂产出',
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
                'achievementCategory_crafting': '工业',
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

    normalizeWorkerValue(value) {
        return String(value || '').trim();
    }

    getWorkerValueLabel(prefix, value, fallback = '—') {
        const normalized = this.normalizeWorkerValue(value);
        if (!normalized) {
            return fallback;
        }

        const key = `${prefix}_${normalized}`;
        const translated = this.t(key);
        return translated === key ? normalized : translated;
    }

    getWorkerSkillLabel(skill) {
        return this.getWorkerValueLabel('skill', skill);
    }

    getWorkerPreferenceLabel(preference) {
        return this.getWorkerValueLabel('preference', preference, this.t('noPreference'));
    }

    getWorkerBackgroundLabel(background) {
        return this.getWorkerValueLabel('background', background);
    }

    getWorkerHobbyLabel(hobby) {
        return this.getWorkerValueLabel('hobby', hobby, this.t('noHobby'));
    }

    getWorkerStatusLabel(isHungry) {
        return isHungry ? this.t('hungryStatus') : this.t('stableStatus');
    }

    getWorkerGenderLabel(gender) {
        if (gender === 'Male' || gender === 1) return this.t('male');
        if (gender === 'Female' || gender === 2) return this.t('female');
        return this.t('otherGender');
    }
     
    // Update all translatable elements on the page
    updateAllTranslations() {
        // Update static text elements
        this.updateElement('game-title', 'gameTitle');
        this.updateElement('click-to-earn', 'clickToEarn');
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
