// Placeholder JavaScript for Rust WASM integration
// This will be replaced by the WASM output from Rust

// Initialize the game when WASM module loads
window.gameInitialized = false;

function formatIntegerDisplay(value) {
    if (window.NumberFormatter && typeof window.NumberFormatter.formatCompactInteger === 'function') {
        return window.NumberFormatter.formatCompactInteger(value);
    }

    if (window.NumberFormatter && typeof window.NumberFormatter.formatInteger === 'function') {
        return window.NumberFormatter.formatInteger(value);
    }

    return Math.floor(Number(value) || 0).toLocaleString();
}

function formatRateDisplay(value) {
    if (window.NumberFormatter && typeof window.NumberFormatter.formatRate === 'function') {
        return window.NumberFormatter.formatRate(value, { fractionDigits: 1 });
    }

    const numeric = (typeof value === 'number' && isFinite(value)) ? value : 0;
    return numeric.toFixed(1);
}

function formatCoinButtonValue(value) {
    return formatIntegerDisplay(value);
}

// Function that will be called from Rust/WASM to update UI
window.updateResourceDisplay = function(coins, wood, stone, coinsPerSecond, woodPerSecond, stonePerSecond, coinsPerClick) {
    // Use i18n system to update resource displays
    if (window.i18n) {
        window.i18n.updateResourceDisplays(coins, wood, stone, coinsPerSecond, woodPerSecond, stonePerSecond, coinsPerClick);
    } else {
        // Fallback to direct updates if i18n is not available
        const coinsElement = document.getElementById('coins');
        const woodElement = document.getElementById('wood');
        const stoneElement = document.getElementById('stone');
        const cpsElement = document.getElementById('cps');
        const wpsElement = document.getElementById('wps');
        const spsElement = document.getElementById('sps');
        const cpcElement = document.getElementById('cpc');
        const coinDisplay = document.getElementById('coin-display');
        const headerCoinDisplay = document.getElementById('header-coin-display');
        
         if (coinsElement) {
              // Ensure the value is a valid finite number
              const safeCoins = (typeof coins === 'number' && isFinite(coins)) ? coins : 0;
              coinsElement.textContent = `金币：${formatIntegerDisplay(safeCoins)}`;
          }
        
         if (woodElement) {
             // Ensure the value is a valid finite number
             const safeWood = (typeof wood === 'number' && isFinite(wood)) ? wood : 0;
              woodElement.textContent = `木头：${formatIntegerDisplay(safeWood)}`;
          }
        
         if (stoneElement) {
             // Ensure the value is a valid finite number
             const safeStone = (typeof stone === 'number' && isFinite(stone)) ? stone : 0;
              stoneElement.textContent = `石头：${formatIntegerDisplay(safeStone)}`;
          }
        
         if (cpsElement) {
             // Ensure the value is a valid finite number
             const safeCoinsPerSec = (typeof coinsPerSecond === 'number' && isFinite(coinsPerSecond)) ? coinsPerSecond : 0;
              cpsElement.textContent = `金币/秒：${formatRateDisplay(safeCoinsPerSec)}`;
          }
        
         if (wpsElement) {
             // Ensure the value is a valid finite number
             const safeWoodPerSec = (typeof woodPerSecond === 'number' && isFinite(woodPerSecond)) ? woodPerSecond : 0;
              wpsElement.textContent = `木头/秒：${formatRateDisplay(safeWoodPerSec)}`;
          }
        
         if (spsElement) {
             // Ensure the value is a valid finite number
             const safeStonePerSec = (typeof stonePerSecond === 'number' && isFinite(stonePerSecond)) ? stonePerSecond : 0;
              spsElement.textContent = `石头/秒：${formatRateDisplay(safeStonePerSec)}`;
          }
        
         if (cpcElement) {
             // Ensure the value is a valid finite number
             const safeCoinsPerClick = (typeof coinsPerClick === 'number' && isFinite(coinsPerClick)) ? coinsPerClick : 1;
              cpcElement.textContent = `金币/点击：${formatRateDisplay(safeCoinsPerClick)}`;
          }
        
          if (coinDisplay) {
              const safeCoins = (typeof coins === 'number' && isFinite(coins)) ? coins : 0;
              coinDisplay.textContent = `${formatIntegerDisplay(safeCoins)}`;
          }
         
          if (headerCoinDisplay) {
              const safeCoins = (typeof coins === 'number' && isFinite(coins)) ? coins : 0;
              headerCoinDisplay.textContent = `${formatIntegerDisplay(safeCoins)}`;
          }
    }
};

// Function that will be called from Rust/WASM to update buildings
window.updateBuildingDisplay = function(buildings, currentCoins) {
    let buildingEntries = Array.isArray(buildings) ? buildings : null;
    if (!buildingEntries && window.rustGame && typeof window.rustGame.get_buildings === 'function') {
        try {
            const freshBuildings = window.rustGame.get_buildings();
            if (Array.isArray(freshBuildings)) {
                buildingEntries = freshBuildings;
            }
        } catch (error) {
            console.error('Failed to refresh building list from WASM:', error);
        }
    }

    if (!buildingEntries || buildingEntries.length === 0) {
        console.warn('updateBuildingDisplay received invalid or empty building payload, keeping current DOM.');
        return;
    }

    const buildingLists = Array.from(document.querySelectorAll('#building-list'));
    buildingLists.forEach((buildingList) => {
        buildingList.innerHTML = '';
        buildingEntries.forEach((building, index) => {
            const buildingDiv = document.createElement('div');
            buildingDiv.className = 'building-item';
            buildingDiv.id = `building-item-${index}`;

            const ownedText = window.i18n ? window.i18n.t('owned') : 'Owned';
            const costText = window.i18n ? window.i18n.t('cost') : 'Cost';
            const buyText = window.i18n ? window.i18n.t('buy') : 'Buy';
            const perSecondText = window.i18n ? window.i18n.t('perSecond') : '/sec';
            const productionRate = building.production_rate || building.productionRate || 0;
            const clickBonus = building.name === '金币矿山' ? Math.floor(building.count || 0) : 0;
            const resourceName = getResourceNameForBuilding(building);
            const realIndex = Number.isInteger(building.index) ? building.index : index;

            let sufficientFunds = true;
            if (typeof currentCoins === 'number' && Number.isFinite(currentCoins)) {
                sufficientFunds = currentCoins >= building.cost;
            } else if (window.rustGame && typeof window.rustGame.get_coins === 'function') {
                sufficientFunds = window.rustGame.get_coins() >= building.cost;
            }

            buildingDiv.innerHTML = `
                <div>
                    <strong>${building.name}</strong><br>
                    <small>+${productionRate} ${resourceName}${perSecondText}</small>
                    ${clickBonus > 0 ? `<br><small>+${clickBonus} ${window.i18n ? window.i18n.t('coinsPerClick') : '金币/点击'}</small>` : ''}
                </div>
                <div>
                    ${ownedText}: ${building.count}<br>
                    ${costText}: ${formatIntegerDisplay(building.cost)}
                    <button id="buy-building-${realIndex}"
                            onclick="window.buyBuilding(${realIndex})"
                            ${!window.gameInitialized || !sufficientFunds ? 'disabled' : ''}>
                        ${buyText}
                    </button>
                </div>
            `;
            buildingList.appendChild(buildingDiv);
        });
    });
};

// Helper function to get resource name for building
function getResourceNameForBuilding(building) {
    const outputResource = building && typeof building === 'object'
        ? (building.output_resource || building.outputResource || null)
        : null;
    if (outputResource) {
        const resourceKey = outputResource.charAt(0).toLowerCase() + outputResource.slice(1);
        return window.i18n ? window.i18n.t(resourceKey) : resourceKey;
    }

    const buildingName = typeof building === 'string' ? building : building?.name;
    const buildingResourceMap = {
        '金币矿山': 'coins',
        'Coin Mine': 'coins',
        'Coin Factory': 'coins',
        'Coin Corporation': 'coins',
        '伐木场': 'wood',
        'Woodcutter': 'wood',
        'Lumber Mill': 'wood',
        'Forest Workshop': 'wood',
        '采石场': 'stone',
        'Stone Quarry': 'stone',
        'Rock Crusher': 'stone',
        'Mason Workshop': 'stone',
        '铁矿场': 'ironOre',
        '铜矿场': 'copperOre',
        '铝矿场': 'aluminumOre',
        '煤矿场': 'coal',
        '石油井': 'oil',
        '水晶矿': 'crystal',
        '农场': 'food',
        '铁锭冶炼厂': 'ironIngot',
        '铜锭冶炼厂': 'copperIngot',
        '化学品厂': 'chemicals',
        '钢铁厂': 'steelPlate',
        '玻璃厂': 'glass',
        '塑料厂': 'plastic',
        '电路板厂': 'circuitBoard',
        '马达厂': 'motor',
        '传感器厂': 'sensor',
        '齿轮厂': 'gear',
        '电池厂': 'battery',
        '发电机厂': 'generator',
        '芯片制造厂': 'microchip',
        '量子计算中心': 'quantumComputer',
        '机器人工厂': 'robot',
        '纳米机器人工厂': 'nanobot',
        '反物质反应堆': 'antimatter',
        '时间水晶合成器': 'timeCrystal',
        '蛆虫工厂': 'maggot',
        '腐肉育池': 'maggot',
        '共生培育舱': 'food',
        '神经尖塔': 'darkMatter',
        '深空孵化港': 'spaceship'
    };
    
    const resourceKey = buildingResourceMap[buildingName] || 'coins';
    return window.i18n ? window.i18n.t(resourceKey) : resourceKey;
}

// Functions called from UI to communicate with Rust/WASM
window.buyBuilding = function(index) {
    if (window.rustGame && typeof window.rustGame.buy_building === 'function') {
        const success = window.rustGame.buy_building(index);
        if (!success) {
            // Provide visual feedback for failed purchase
            const button = document.getElementById(`buy-building-${index}`);
            if (button) {
                button.classList.add('purchase-failed');
                setTimeout(() => {
                    button.classList.remove('purchase-failed');
                }, 300);
            }
        }
    }
};

// Handle click interaction
document.addEventListener('DOMContentLoaded', function() {
    // Old click area (for backward compatibility)
    const clickArea = document.getElementById('click-area');
    if (clickArea) {
        clickArea.addEventListener('click', function() {
            if (window.rustGame && typeof window.rustGame.click_action === 'function') {
                window.rustGame.click_action();
            }
        });
    }
    
    // New header coin click area
    const headerCoinClickArea = document.getElementById('coin-click-area');
    if (headerCoinClickArea) {
        headerCoinClickArea.addEventListener('click', function(e) {
            if (window.rustGame && typeof window.rustGame.click_action === 'function') {
                window.rustGame.click_action();
                createCoinParticles(e.clientX, e.clientY);
            }
        });
    }
    
    const coinButton = document.getElementById('coin-button');
    if (coinButton) {
        coinButton.addEventListener('click', function(e) {
            if (window.rustGame && typeof window.rustGame.click_action === 'function') {
                window.rustGame.click_action();
                createCoinParticles(e.clientX, e.clientY);
            }
        });
    }
    
    // Manual save button
    const manualSaveBtn = document.getElementById('manual-save');
    if (manualSaveBtn) {
        manualSaveBtn.addEventListener('click', function() {
            if (window.rustGame && typeof window.rustGame.saveToLocalStorage === 'function') {
                try {
                    window.rustGame.saveToLocalStorage();
                    const statusEl = document.getElementById('save-status');
                    if (statusEl) {
                        statusEl.textContent = '已保存 ✓';
                        setTimeout(() => { statusEl.textContent = ''; }, 3000);
                    }
                    console.log('Game manually saved at', new Date().toLocaleTimeString());
                } catch (saveError) {
                    console.error('Manual save failed:', saveError);
                    const statusEl = document.getElementById('save-status');
                    if (statusEl) {
                        statusEl.textContent = '保存失败 ✗';
                        setTimeout(() => { statusEl.textContent = ''; }, 3000);
                    }
                }
            }
        });
    }
    
    // Export to BASE64 button
    const exportBtn = document.getElementById('export-base64');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            if (window.rustGame && typeof window.rustGame.exportToBase64 === 'function') {
                try {
                    const base64Str = window.rustGame.exportToBase64();
                    const textArea = document.getElementById('import-export-text');
                    if (textArea) {
                        textArea.value = base64Str;
                        textArea.select();
                        document.execCommand('copy');
                        alert('导出成功！已复制到剪贴板。');
                    }
                    console.log('Game exported to BASE64 at', new Date().toLocaleTimeString());
                } catch (exportError) {
                    console.error('Export failed:', exportError);
                    alert('导出失败：' + exportError.message);
                }
            }
        });
    }
    
    // Import from BASE64 button
    const importBtn = document.getElementById('import-base64');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            const textArea = document.getElementById('import-export-text');
            if (!textArea || !textArea.value.trim()) {
                alert('请先粘贴 BASE64 字符串。');
                return;
            }
            
            if (window.rustGame && typeof window.rustGame.importFromBase64 === 'function') {
                if (!confirm('导入将覆盖当前游戏进度。确定继续吗？')) {
                    return;
                }
                
                try {
                    window.rustGame.importFromBase64(textArea.value.trim());
                    alert('导入成功！游戏已加载。');
                    console.log('Game imported from BASE64 at', new Date().toLocaleTimeString());
                    
                    // Refresh UI
                    if (window.rustGame.update_ui) {
                        window.rustGame.update_ui();
                    }
                } catch (importError) {
                    console.error('Import failed:', importError);
                    alert('导入失败：' + (importError.message || '无效的 BASE64 字符串'));
                }
            }
        });
    }
    
    // Initialize i18n after DOM is loaded
    if (window.i18n) {
        window.i18n.updateAllTranslations();
    }
});

// Particle effect when clicking coin button
function createCoinParticles(x, y) {
    const coinButton = document.getElementById('coin-button');
    if (!coinButton) return;
    
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'coin-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        // Random direction - particles spread out in a circle
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 50 + Math.random() * 30;
        particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
        
        document.body.appendChild(particle);
        
        // Cleanup after animation completes
        setTimeout(() => {
            particle.remove();
        }, 600);
    }
}

window.updateStatisticsPanel = function() {
    if (window.statisticsManager && typeof window.statisticsManager.renderToPanel === 'function') {
        const statisticsTab = document.getElementById('tab-statistics');
        if (statisticsTab && statisticsTab.classList.contains('active')) {
            window.statisticsManager.renderToPanel('statistics-list');
        }
    }
};

window.updateUnlocksPanel = function() {
    if (window.unlockManager && typeof window.unlockManager.update === 'function') {
        window.unlockManager.update();
    }
    if (window.unlockManager && typeof window.unlockManager.renderUnlocks === 'function') {
        const unlocksTab = document.getElementById('tab-unlocks');
        if (unlocksTab && unlocksTab.classList.contains('active')) {
            window.unlockManager.renderUnlocks();
        }
    }
};

window.updateCoinButton = function() {
    if (!window.rustGame || typeof window.rustGame.get_coins !== 'function') return;
    const coins = window.rustGame.get_coins();
    const coinCount = document.getElementById('coin-count');
    if (coinCount) {
        coinCount.textContent = formatCoinButtonValue(coins);
    }
};
