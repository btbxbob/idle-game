// Internationalization system for the idle game
class I18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('gameLanguage') || 'zh-CN'; // Default to Simplified Chinese
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
                'workersPlaceholder': 'Loading worker panel...',
                'achievementsLoadingPlaceholder': 'Loading achievements panel...',
                'unlocksLoadingPlaceholder': 'Loading unlock panel...',
                'housingLoadingPlaceholder': 'Loading housing panel...',
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
                'noAchievements': 'No achievement data available yet',
                'search': 'Search',
                'available': 'Available',
                'researched': 'Researched',
                'hideResearched': 'Hide researched',
                'noTechnologies': 'No technologies available yet',
                'research': 'Research',
                'insufficientResources': 'Insufficient resources',
                'locked': 'Locked',
                'costs': 'Costs',
                'dependencies': 'Prerequisites',
                'effect': 'Effect',
                'unknownEffect': 'Unknown effect',
                'researchFailed': 'Research failed',
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
                'autoAssignConfirm': 'Reassign all workers to the highest-efficiency job with open slots now?',
                'autoAssignSuccess': 'Auto assign completed: selected the current best open job for {count} workers',
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
                'housingPlaceholder': 'Loading housing panel...',
                'housingLevel': 'Housing Level',
                'capacity': 'Capacity',
                'occupants': 'Occupants',
                'housingUpgradeCost': 'Upgrade Cost',
                'upgradeHousing': 'Upgrade',
                'housingManagement': 'Housing Management',
                'housingCatalogSubtitle': 'Housing now scales with the technology and industrial resource chain.',
                'housingList': 'Housing Count',
                'totalCapacity': 'Total Capacity',
                'currentOccupancy': 'Current Occupancy',
                'queueWorkers': 'Queue',
                'occupancyRate': 'Occupancy Rate',
                'housingFullWarning': 'Housing is full. New population will enter the waiting queue.',
                'bulkUpgradeHousing': 'Bulk Upgrade Housing',
                'housingAutoPurchase': 'Auto Purchase',
                'housingAutoPurchaseSummary': 'Auto purchase complete: {count} housing upgrades processed',
                'housingNoAutoPurchase': 'Not enough resources to auto purchase housing right now',
                'housingCapacityPerLevel': 'Capacity per Level',
                'occupancyControl': 'Occupancy Control',
                'noHousing': 'No housing available',
                'housingUpgradeFailed': '{count} housing upgrades failed (insufficient resources)',
                'housingName_棚屋': 'Shanty Shelter',
                'housingName_木梁小屋': 'Timber Cottage',
                'housingName_采石宿舍': 'Quarry Dormitory',
                'housingName_铸铁公寓': 'Cast-Iron Apartments',
                'housingName_钢骨宿舍塔': 'Steelframe Dorm Tower',
                'housingName_聚合物生活舱': 'Polymer Hab Pod',
                'housingName_自动化居住穹顶': 'Automated Habitat Dome',
                'housingName_仿生共生巢': 'Bionic Symbiosis Nest',
                'housingName_量子静域居所': 'Quantum Quiet-Zone Residence',
                'housingName_星轨方舟': 'Starrail Ark',
                'housingDescription_棚屋': 'A temporary shelter stitched together from the earliest timber and fabric scraps, just enough to house the first labor wave.',
                'housingDescription_木梁小屋': 'Once logging and quarrying stabilize, workers can finally move into timber homes that do not leak at every gust.',
                'housingDescription_采石宿舍': 'Stone walls and ore braces make this dormitory fit for quarry crews and miners staying on-site for the long haul.',
                'housingDescription_铸铁公寓': 'After smelting and glassmaking mature, the settlement graduates into true multi-storey worker apartments.',
                'housingDescription_钢骨宿舍塔': 'Mechanical engineering pushes housing vertical, with structural steel and powered utilities keeping dense dorm life reliable.',
                'housingDescription_聚合物生活舱': 'Chemical industry unlocks lightweight habitation pods that are cheaper to maintain and much faster to expand.',
                'housingDescription_自动化居住穹顶': 'Automatic doors, energy loops, and baseline life-support turn housing blocks into semi-automated living domes.',
                'housingDescription_仿生共生巢': 'As biotechnology enters architecture, the habitat starts regulating itself like an organism and welcoming hybrid residents.',
                'housingDescription_量子静域居所': 'With quantum tuning managing the environment, the entire district can optimize itself around each resident in real time.',
                'housingDescription_星轨方舟': 'Endgame housing no longer merely stores population; it carries the whole colony forward like a migrating ark.',
                
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
                'simplifiedChinese': 'Simplified Chinese',
                'englishLanguage': 'English / English',
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
                'exportFailed': 'Export failed',
                'importBase64': 'Import from BASE64',
                'importExportPlaceholder': 'Paste BASE64 string here...',
                'allResources': 'All Resources',
                'basicResources': 'Basic Resources',
                'processedResources': 'Processed Materials',
                'advancedResources': 'High Tech',
                'specialResources': 'Special',
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
                'achievementCategory_unlocks': 'Unlocks',
                'unlockSectionLabel': 'Next Revelation',
                'noUnlocksAvailable': 'No new observable anomalies right now. The perimeter remains stable for the moment.',
                'unlockAutoRevealHint': 'Automatically reveals when conditions are met',
                'unlockFeatureType_stage': 'Stage Shift',
                'unlockFeatureType_system': 'System Anomaly',
                'unlockFeatureType_area': 'Panel Revelation',
                'unlockFeatureType_default': 'Revelation Target',
                'unlockRequirement_workers_stage': 'Buy a total of 3 buildings',
                'unlockRequirement_maggot_stage': 'Reveal the maggot stage',
                'unlockRequirement_hybrid_stage': 'Advance the hybrid stage',
                'unlockRequirement_collective_stage': 'Advance the collective stage',
                'unlockRequirement_symbiosis_stability': 'Maintain symbiotic balance',
                'unlockRequirement_total_clicks': 'Reach the basic click threshold',
                'unlockRequirement_default': 'Meet the current stage requirements',
                'unlockSummary_workers_stage': 'The worker stage now depends on one requirement only: buy 3 buildings in total.',
                'unlockSummary_maggot_stage': 'The dark branch emerges from settlement decay itself: hunger, corpses, and maggot activity reveal the hidden stage together.',
                'unlockSummary_maggot_tech': 'Dark biology is not unlocked with a manual button. Research "Maggot Breeding" first.',
                'unlockSummary_hybrid_stage': 'The hybrid stage advances through three forces together: dark-tech readiness, maggot influence, and symbiosis stability. Overall progress is their average.',
                'unlockSummary_collective_stage': 'The collective stage also advances through a three-part average: collective consciousness, hybrid population, and key technology.',
                'unlockSummary_symbiosis_stability': 'Keep symbiosis stability above the safe line before the system recognizes the balance as sustainable.',
                'unlockSummary_total_clicks': 'Keep clicking and build up the basics until you reach {count} total clicks.',
                'unlockLine_buildingsPurchased': 'Buildings Purchased',
                'unlockLine_hungryWorkers': 'Hungry Workers',
                'unlockLine_corpses': 'Corpses',
                'unlockLine_maggotActivity': 'Maggot Activity',
                'unlockLine_maggotBreeding': 'Maggot Breeding',
                'unlockLine_darkTechReadiness': 'Dark-Tech Readiness',
                'unlockLine_maggotInfluence': 'Maggot Influence',
                'unlockLine_symbiosisStability': 'Symbiosis Stability',
                'unlockLine_collectiveConsciousness': 'Collective Consciousness',
                'unlockLine_hybridPopulation': 'Hybrid Population',
                'unlockLine_keyTechnology': 'Key Technology',
                'unlockLine_totalClicks': 'Total Clicks',
                'progressionKicker': 'Active Dossier',
                'progressionMetric_humanPressure': 'Human Pressure',
                'progressionMetric_humanPressureNote': 'How strongly human order pushes back against mutation.',
                'progressionMetric_maggotInfluence': 'Maggot Influence',
                'progressionMetric_maggotInfluenceNote': 'How deeply the corrupted ecosystem is spreading into the settlement.',
                'progressionMetric_symbiosisStability': 'Symbiosis Stability',
                'progressionMetric_symbiosisStabilityNote': 'Determines whether the hybrid society can keep functioning.',
                'progressionMetric_hybridPopulation': 'Hybrid Population',
                'progressionMetric_hybridPopulationNote': 'The scale of hybrid workers already active in production.',
                'progressionMetric_collectiveConsciousness': 'Collective Consciousness',
                'progressionMetric_collectiveConsciousnessNote': 'How much the shared mind network is concentrating endgame output.',
                'stage_stage_genesis': 'Genesis Stage',
                'stage_stage_workers': 'Worker Stage',
                'stage_stage_maggot': 'Maggot Stage',
                'stage_stage_hybrid': 'Hybrid Stage',
                'stage_stage_collective': 'Collective Stage',
                'stageDescription_stage_genesis': 'Support the earliest resource loop with clicks and basic buildings.',
                'stageDescription_stage_workers': 'Workers, housing, and food begin to dominate production.',
                'stageDescription_stage_maggot': 'Corpse corruption reveals a dark biological production chain.',
                'stageDescription_stage_hybrid': 'Humans and hybrids coexist, and stability becomes the key variable.',
                'stageDescription_stage_collective': 'Collective consciousness, biotech, and cosmic expansion converge.',
                'stageNarrative_stage_genesis': 'The world can still be understood as a simple stack of resources and manual labor. The danger remains hidden behind structure.',
                'stageNarrative_stage_workers': 'The settlement has outgrown pure clicking. Food, housing, and worker logistics now decide whether civilization expands.',
                'stageNarrative_stage_maggot': 'Death yields sustainable returns for the first time. Production no longer means only construction; it also consumes corpses and consequences.',
                'stageNarrative_stage_hybrid': 'Order and corruption are forced to share the same infrastructure, and any imbalance can drive society into collapse.',
                'stageNarrative_stage_collective': 'Individual boundaries keep dissolving. Consciousness, reproduction, and expedition now operate through one network.',
                'unlockName_stage_workers': 'Worker Stage',
                'unlockName_stage_maggot': 'Maggot Stage',
                'unlockName_stage_hybrid': 'Hybrid Stage',
                'unlockName_stage_collective': 'Collective Stage',
                'unlockName_coexistence_balance': 'Symbiotic Balance',
                'unlockName_statistics_panel': 'Statistics Panel',
                'unlockName_achievements_panel': 'Achievements Panel',
                'unlockName_workers_tab': 'Workers Panel',
                'unlockName_dark_biology': 'Dark Biology',
                'unlockDescription_stage_workers': 'Basic gathering is no longer enough for expansion. A new labor system is about to open.',
                'unlockDescription_stage_maggot': 'You discover that death is not an ending, but the entrance to another production chain.',
                'unlockDescription_stage_hybrid': 'Pure human order is collapsing. Symbiosis will become the new production law.',
                'unlockDescription_stage_collective': 'When individual borders dissolve, consciousness itself drives expansion and expedition.',
                'unlockDescription_coexistence_balance': 'Keep human pressure and maggot influence within a controllable balance.',
                'unlockDescription_workers_tab': 'Workers, housing, the work overview, and lifecycle systems are now operating steadily.',
                'unlockDescription_statistics_panel': 'The statistics panel is now available as a stable observation tool.',
                'unlockDescription_achievements_panel': 'The achievements panel has been revealed and can now track milestone progress.',
                'unlockDescription_dark_biology': 'The dark biological chain has formed, and its technology branch can now be researched.',
                'unlockDescription_default': 'A new stage boundary is coming into view.',
                'achievementName_click_novice_10': 'Click Novice',
                'achievementName_click_master_100': 'Click Master',
                'achievementName_click_legend_1000': 'Click Legend',
                'achievementName_first_coins_100': 'First Pot of Gold',
                'achievementName_wood_collector_1000': 'Wood Collector',
                'achievementName_stone_hoarder_5000': 'Stone Hoarder',
                'achievementName_first_building': 'First Building',
                'achievementName_building_enthusiast_10': 'Building Enthusiast',
                'achievementName_building_tycoon_50': 'Building Tycoon',
                'achievementName_first_craft': 'First Factory Output',
                'achievementName_craft_master_100': 'Industry Master',
                'achievementName_first_unlock': 'First Unlock',
                'achievementName_progress_master_5': 'Progress Master',
                'achievementDescription_click_novice_10': 'Click 10 times',
                'achievementDescription_click_master_100': 'Click 100 times',
                'achievementDescription_click_legend_1000': 'Click 1,000 times',
                'achievementDescription_first_coins_100': 'Earn 100 coins',
                'achievementDescription_wood_collector_1000': 'Collect 1,000 wood',
                'achievementDescription_stone_hoarder_5000': 'Collect 5,000 stone',
                'achievementDescription_first_building': 'Buy your first building',
                'achievementDescription_building_enthusiast_10': 'Buy 10 buildings',
                'achievementDescription_building_tycoon_50': 'Buy 50 buildings',
                'achievementDescription_first_craft': 'Produce your first processed resource in a factory',
                'achievementDescription_craft_master_100': 'Produce 100 processed resources in factories',
                'achievementDescription_first_unlock': 'Unlock your first achievement',
                'achievementDescription_progress_master_5': 'Unlock 5 achievements'
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
                'workersPlaceholder': '正在加载工人面板...',
                'achievementsLoadingPlaceholder': '正在加载成就面板...',
                'unlocksLoadingPlaceholder': '正在加载解锁面板...',
                'housingLoadingPlaceholder': '正在加载住房面板...',
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
                'noAchievements': '暂无成就数据',
                'search': '搜索',
                'available': '可研究',
                'researched': '已研究',
                'hideResearched': '隐藏已研究',
                'noTechnologies': '暂无科技可研究',
                'research': '研究',
                'insufficientResources': '资源不足',
                'locked': '未解锁',
                'costs': '花费',
                'dependencies': '前置科技',
                'effect': '效果',
                'unknownEffect': '未知效果',
                'researchFailed': '研究失败',
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
                'autoAssignConfirm': '将重新为全部工人执行自动安排，并优先选择效率最高且仍有空位的岗位，是否继续？',
                'autoAssignSuccess': '自动安排完成：已为 {count} 名工人选择当前最佳且仍有空位的岗位',
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
                'housingPlaceholder': '正在加载住房面板...',
                'housingLevel': '住房等级',
                'capacity': '容量',
                'occupants': '入住人数',
                'housingUpgradeCost': '升级所需资源',
                'upgradeHousing': '升级住房',
                'housingManagement': '住房管理',
                'housingCatalogSubtitle': '住房会沿着科技与工业资源链持续升级。',
                'housingList': '住房数量',
                'totalCapacity': '总容量',
                'currentOccupancy': '当前入住',
                'queueWorkers': '等待队列',
                'occupancyRate': '入住率',
                'housingFullWarning': '住房容量已满，新增人口将进入等待队列',
                'bulkUpgradeHousing': '批量升级住房',
                'housingAutoPurchase': '自动购买',
                'housingAutoPurchaseSummary': '自动购买完成，共处理 {count} 次住房升级',
                'housingNoAutoPurchase': '当前资源不足，无法自动购买住房',
                'housingCapacityPerLevel': '单级容量',
                'occupancyControl': '入住控制',
                'noHousing': '暂无住房建筑',
                'housingUpgradeFailed': '{count} 个住房升级失败（资源不足）',
                'housingName_棚屋': '棚屋',
                'housingName_木梁小屋': '木梁小屋',
                'housingName_采石宿舍': '采石宿舍',
                'housingName_铸铁公寓': '铸铁公寓',
                'housingName_钢骨宿舍塔': '钢骨宿舍塔',
                'housingName_聚合物生活舱': '聚合物生活舱',
                'housingName_自动化居住穹顶': '自动化居住穹顶',
                'housingName_仿生共生巢': '仿生共生巢',
                'housingName_量子静域居所': '量子静域居所',
                'housingName_星轨方舟': '星轨方舟',
                'housingDescription_棚屋': '用最基础的木料和布片拼出来的临时居所，能先把第一批劳动力安顿下来。',
                'housingDescription_木梁小屋': '有了稳定伐木和采石之后，工人终于能住进不那么容易漏风的木屋。',
                'housingDescription_采石宿舍': '石墙和矿梁让宿舍结构更稳，适合矿工和采石工长期驻扎。',
                'housingDescription_铸铁公寓': '冶炼和玻璃工艺成熟后，城市开始出现真正意义上的多层工人公寓。',
                'housingDescription_钢骨宿舍塔': '机械工程推动住房垂直扩张，结构件和供能线路让多人宿舍变得可靠。',
                'housingDescription_聚合物生活舱': '化工产业让轻量化居住舱变成现实，维护成本更低，扩张速度也更快。',
                'housingDescription_自动化居住穹顶': '自动门、能源循环和基础维生系统把住房升级成了半自动化穹顶。',
                'housingDescription_仿生共生巢': '当生物技术介入住房设计，建筑开始像组织一样自我调节并容纳混合居民。',
                'housingDescription_量子静域居所': '量子计算接管环境调谐后，整片住宅区可以按居民状态实时优化。',
                'housingDescription_星轨方舟': '终局住房不再只是容纳人口，而是让整个群落像航行中的殖民方舟一样持续演化。',
                
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
                'simplifiedChinese': '简体中文',
                'englishLanguage': '英语 / English',
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
                'exportFailed': '导出失败',
                'importBase64': '从 BASE64 导入',
                'importExportPlaceholder': '在此粘贴 BASE64 字符串...',
                'allResources': '全部资源',
                'basicResources': '基础资源',
                'processedResources': '加工材料',
                'advancedResources': '高科技',
                'specialResources': '特殊',
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
                'achievementCategory_unlocks': '解锁',
                'unlockSectionLabel': '下一次揭示',
                'noUnlocksAvailable': '目前没有新的可观测异常，边界暂时保持稳定。',
                'unlockAutoRevealHint': '满足条件后自动揭示',
                'unlockFeatureType_stage': '阶段跃迁',
                'unlockFeatureType_system': '系统异常',
                'unlockFeatureType_area': '面板揭示',
                'unlockFeatureType_default': '揭示项目',
                'unlockRequirement_workers_stage': '累计购买 3 座建筑',
                'unlockRequirement_maggot_stage': '揭示蛆虫阶段',
                'unlockRequirement_hybrid_stage': '推进蛆虫人阶段',
                'unlockRequirement_collective_stage': '推进集体意识阶段',
                'unlockRequirement_symbiosis_stability': '维持共生平衡',
                'unlockRequirement_total_clicks': '完成基础点击阈值',
                'unlockRequirement_default': '满足当前阶段条件',
                'unlockSummary_workers_stage': '工人阶段现在只看一条条件：累计购买 3 座建筑。',
                'unlockSummary_maggot_stage': '黑暗分支来自聚落衰败本身：饥饿、尸体与异动共同推动隐藏阶段显形。',
                'unlockSummary_maggot_tech': '黑暗生物链不是手动按钮解锁，而是要先研究科技“蛆虫育种”。',
                'unlockSummary_hybrid_stage': '蛆虫人阶段看三项共同推进：黑暗科技准备度、蛆虫影响、共生稳定度。总进度是三项平均值。',
                'unlockSummary_collective_stage': '集体意识阶段同样按三项平均推进：集体意识、混合人口、关键科技。',
                'unlockSummary_symbiosis_stability': '把共生稳定度维持在安全线以上，系统才会承认当前平衡可持续。',
                'unlockSummary_total_clicks': '继续点击并积累基础操作次数，达到 {count} 次。',
                'unlockLine_buildingsPurchased': '已购买建筑',
                'unlockLine_hungryWorkers': '饥饿工人',
                'unlockLine_corpses': '尸体',
                'unlockLine_maggotActivity': '蛆虫异动',
                'unlockLine_maggotBreeding': '蛆虫育种',
                'unlockLine_darkTechReadiness': '黑暗科技准备度',
                'unlockLine_maggotInfluence': '蛆虫影响',
                'unlockLine_symbiosisStability': '共生稳定度',
                'unlockLine_collectiveConsciousness': '集体意识',
                'unlockLine_hybridPopulation': '混合人口',
                'unlockLine_keyTechnology': '关键科技',
                'unlockLine_totalClicks': '总点击次数',
                'progressionKicker': '当前阶段',
                'progressionMetric_humanPressure': '人类压力',
                'progressionMetric_humanPressureNote': '人类秩序对异化的反制强度',
                'progressionMetric_maggotInfluence': '蛆虫影响',
                'progressionMetric_maggotInfluenceNote': '腐化生态正在渗透聚落的程度',
                'progressionMetric_symbiosisStability': '共生稳定度',
                'progressionMetric_symbiosisStabilityNote': '决定混合社会是否还能保持运转',
                'progressionMetric_hybridPopulation': '混合人口',
                'progressionMetric_hybridPopulationNote': '已经参与生产的蛆虫人规模',
                'progressionMetric_collectiveConsciousness': '集体意识',
                'progressionMetric_collectiveConsciousnessNote': '共享思维网络对终局产能的聚合程度',
                'stage_stage_genesis': '初始阶段',
                'stage_stage_workers': '工人阶段',
                'stage_stage_maggot': '蛆虫阶段',
                'stage_stage_hybrid': '蛆虫人阶段',
                'stage_stage_collective': '集体意识阶段',
                'stageDescription_stage_genesis': '靠点击与基础建筑撑起最早期资源循环。',
                'stageDescription_stage_workers': '工人、住房与食物开始主导产能。',
                'stageDescription_stage_maggot': '尸体腐化揭示黑暗生物生产链。',
                'stageDescription_stage_hybrid': '人类与蛆虫人共生，稳定度成为核心变量。',
                'stageDescription_stage_collective': '集体意识、生物科技与宇宙探索汇流。',
                'stageNarrative_stage_genesis': '世界仍旧可被理解为资源与手工劳动的简单叠加，危险还隐藏在结构之后。',
                'stageNarrative_stage_workers': '聚落已经摆脱纯点击驱动，食物、住房和工人调度开始决定文明是否扩张。',
                'stageNarrative_stage_maggot': '死亡第一次形成可持续回报，生产不再只是建设，也开始吞食尸体与后果。',
                'stageNarrative_stage_hybrid': '秩序与腐化被迫共享同一套基础设施，任何失衡都会把社会推向崩塌。',
                'stageNarrative_stage_collective': '个体边界被持续稀释，意识、繁殖与远征开始围绕同一网络运转。',
                'unlockName_stage_workers': '工人阶段',
                'unlockName_stage_maggot': '蛆虫阶段',
                'unlockName_stage_hybrid': '蛆虫人阶段',
                'unlockName_stage_collective': '集体意识阶段',
                'unlockName_coexistence_balance': '共生平衡',
                'unlockName_statistics_panel': '统计面板',
                'unlockName_achievements_panel': '成就面板',
                'unlockName_workers_tab': '工人面板',
                'unlockName_dark_biology': '黑暗生物链',
                'unlockDescription_stage_workers': '基础采集已经无法满足扩张，新的劳动力系统即将开启。',
                'unlockDescription_stage_maggot': '你发现死亡并非终点，而是另一条生产链的入口。',
                'unlockDescription_stage_hybrid': '纯粹的人类秩序正在崩塌，共生将成为新的生产法则。',
                'unlockDescription_stage_collective': '当个体边界溶解，意识将直接驱动远征与扩张。',
                'unlockDescription_coexistence_balance': '把人类压力与蛆虫影响维持在可控平衡内。',
                'unlockDescription_workers_tab': '工人、住房、工作总览和生命周期系统已经稳定运转。',
                'unlockDescription_statistics_panel': '统计面板已成为稳定观测工具。',
                'unlockDescription_achievements_panel': '成就面板已被揭示，可查看里程碑进度。',
                'unlockDescription_dark_biology': '黑暗生物链已经形成，相关科技分支可被研究。',
                'unlockDescription_default': '新的阶段边界正在显现。',
                'achievementName_click_novice_10': '点击新手',
                'achievementName_click_master_100': '点击大师',
                'achievementName_click_legend_1000': '点击传奇',
                'achievementName_first_coins_100': '第一桶金',
                'achievementName_wood_collector_1000': '木材收集者',
                'achievementName_stone_hoarder_5000': '石头囤积者',
                'achievementName_first_building': '第一座建筑',
                'achievementName_building_enthusiast_10': '建筑爱好者',
                'achievementName_building_tycoon_50': '建筑大亨',
                'achievementName_first_craft': '第一次加工',
                'achievementName_craft_master_100': '工业大师',
                'achievementName_first_unlock': '首次解锁',
                'achievementName_progress_master_5': '进度大师',
                'achievementDescription_click_novice_10': '点击 10 次',
                'achievementDescription_click_master_100': '点击 100 次',
                'achievementDescription_click_legend_1000': '点击 1000 次',
                'achievementDescription_first_coins_100': '获得 100 金币',
                'achievementDescription_wood_collector_1000': '获得 1000 木头',
                'achievementDescription_stone_hoarder_5000': '获得 5000 石头',
                'achievementDescription_first_building': '购买第一座建筑',
                'achievementDescription_building_enthusiast_10': '购买 10 座建筑',
                'achievementDescription_building_tycoon_50': '购买 50 座建筑',
                'achievementDescription_first_craft': '通过工厂产出第一个加工资源',
                'achievementDescription_craft_master_100': '通过工厂累计产出 100 个加工资源',
                'achievementDescription_first_unlock': '解锁第一个成就',
                'achievementDescription_progress_master_5': '解锁 5 个成就'
            }
        };
    }
    
    // Set current language
    setLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            localStorage.setItem('gameLanguage', language);
            return true;
        }
        return false;
    }

    translateFor(language, key, params = {}) {
        const translation = this.translations[language]?.[key] || this.translations.en[key] || key;
        let result = translation;
        for (const [param, value] of Object.entries(params)) {
            result = result.replace(new RegExp(`{${param}}`, 'g'), value);
        }
        return result;
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

    getAchievementName(id, fallback = '') {
        if (!id) {
            return fallback;
        }

        const key = `achievementName_${id}`;
        const translated = this.t(key);
        return translated === key ? fallback || id : translated;
    }

    getAchievementDescription(id, fallback = '') {
        if (!id) {
            return fallback;
        }

        const key = `achievementDescription_${id}`;
        const translated = this.t(key);
        return translated === key ? fallback : translated;
    }

    getUnlockName(id, fallback = '') {
        if (!id) {
            return fallback;
        }

        const key = `unlockName_${id}`;
        const translated = this.t(key);
        return translated === key ? fallback || id : translated;
    }

    getUnlockDescription(id, fallback = '') {
        if (!id) {
            return fallback;
        }

        const key = `unlockDescription_${id}`;
        const translated = this.t(key);
        return translated === key ? (fallback || this.t('unlockDescription_default')) : translated;
    }

    getStageName(stageId, fallback = '') {
        if (!stageId) {
            return fallback;
        }

        const key = `stage_${stageId}`;
        const translated = this.t(key);
        return translated === key ? fallback || stageId : translated;
    }

    getStageDescription(stageId, fallback = '') {
        if (!stageId) {
            return fallback;
        }

        const key = `stageDescription_${stageId}`;
        const translated = this.t(key);
        return translated === key ? fallback : translated;
    }

    getStageNarrative(stageId, fallback = '') {
        if (!stageId) {
            return fallback;
        }

        const key = `stageNarrative_${stageId}`;
        const translated = this.t(key);
        return translated === key ? fallback : translated;
    }

    getHousingName(name, fallback = '') {
        if (!name) {
            return fallback;
        }

        const key = `housingName_${name}`;
        const translated = this.t(key);
        return translated === key ? fallback || name : translated;
    }

    getHousingDescription(name, fallback = '') {
        if (!name) {
            return fallback;
        }

        const key = `housingDescription_${name}`;
        const translated = this.t(key);
        return translated === key ? fallback : translated;
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
        this.updateElement('achievements-placeholder', 'achievementsLoadingPlaceholder');
        this.updateElement('unlocks-placeholder', 'unlocksLoadingPlaceholder');

        // Update settings labels
        this.updateLabel('theme-select-setting', 'theme');
        this.updateLabel('language-select-setting', 'language');
        this.updateElement('reset-game', 'resetGame');
        this.updateElement('manual-save', 'manualSave');
        this.updateElement('export-base64', 'exportBase64');
        this.updateElement('import-base64', 'importBase64');
        this.updateElement('save-load-title', 'saveLoadTitle');
        this.updateSettingsVersionLabel();
        this.updateSettingsOptions();
        this.updateResourceCategoryTabs();
        this.updatePlaceholder('import-export-text', 'importExportPlaceholder');

        // Update resource displays (these will be handled by resource update functions)
        this.updateResourceDisplays();
    }
    
    // Update a label element
    updateLabel(elementId, translationKey) {
        const element = document.getElementById(elementId);
        if (element) {
            const label = element.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                const alternateLanguage = this.currentLanguage === 'en' ? 'zh-CN' : 'en';
                label.textContent = `${this.t(translationKey)} / ${this.translateFor(alternateLanguage, translationKey)}`;
            }
        }
    }

    updatePlaceholder(elementId, translationKey) {
        const element = document.getElementById(elementId);
        if (element) {
            element.placeholder = this.t(translationKey);
        }
    }

    updateSettingsVersionLabel() {
        const element = document.getElementById('game-version-label');
        const version = document.getElementById('version-number')?.textContent || '...';
        if (element) {
            element.textContent = `${this.t('gameVersion')}: ${version.startsWith('v') ? version : `v${version}`}`;
        }
    }

    updateSettingsOptions() {
        const themeSelect = document.getElementById('theme-select-setting');
        if (themeSelect?.options?.length >= 2) {
            themeSelect.options[0].textContent = this.t('lightTheme');
            themeSelect.options[1].textContent = this.t('darkTheme');
        }

        const languageSelect = document.getElementById('language-select-setting');
        if (languageSelect?.options?.length >= 2) {
            languageSelect.options[0].textContent = this.t('simplifiedChinese');
            languageSelect.options[1].textContent = this.t('englishLanguage');
        }
    }

    updateResourceCategoryTabs() {
        const labels = {
            ALL: 'allResources',
            TIER1_BASIC: 'basicResources',
            TIER2_PROCESSED: 'processedResources',
            TIER3_ADVANCED: 'advancedResources',
            SPECIAL: 'specialResources',
        };

        document.querySelectorAll('#resource-category-tabs .category-tab-button').forEach((button) => {
            const tier = button.getAttribute('data-tier');
            const key = labels[tier];
            if (key) {
                button.textContent = this.t(key);
            }
        });
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
