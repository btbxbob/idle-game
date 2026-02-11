// Placeholder JavaScript for Rust WASM integration
// This will be replaced by the WASM output from Rust

// Initialize the game when WASM module loads
window.gameInitialized = false;

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
        
        if (coinsElement) {
            coinsElement.textContent = `Coins: ${Math.floor(coins)}`;
        }
        
        if (woodElement) {
            woodElement.textContent = `Wood: ${Math.floor(wood)}`;
        }
        
        if (stoneElement) {
            stoneElement.textContent = `Stone: ${Math.floor(stone)}`;
        }
        
        if (cpsElement) {
            cpsElement.textContent = `Coins/sec: ${coinsPerSecond.toFixed(1)}`;
        }
        
        if (wpsElement) {
            wpsElement.textContent = `Wood/sec: ${woodPerSecond.toFixed(1)}`;
        }
        
        if (spsElement) {
            spsElement.textContent = `Stone/sec: ${stonePerSecond.toFixed(1)}`;
        }
        
        if (cpcElement) {
            cpcElement.textContent = `Coins/click: ${coinsPerClick.toFixed(1)}`;
        }
        
        if (coinDisplay) {
            coinDisplay.textContent = `${Math.floor(coins)}`;
        }
    }
};

// Function that will be called from Rust/WASM to update upgrades
window.updateUpgradeButtons = function(upgrades) {
    const upgradeList = document.getElementById('upgrade-list');
    if (upgradeList) {
        upgradeList.innerHTML = '';
        upgrades.forEach((upgrade, index) => {
            const upgradeDiv = document.createElement('div');
            upgradeDiv.className = 'upgrade-item';
            
            // Use i18n for dynamic text
            const costText = window.i18n ? window.i18n.t('cost') : 'Cost';
            const buyText = window.i18n ? window.i18n.t('buy') : 'Buy';
            
            // Fix: use production_increase instead of productionIncrease (serde uses snake_case)
            const productionIncrease = upgrade.production_increase || upgrade.productionIncrease || 0;
            
            // Determine the correct unit based on upgrade type
            let unitText = '';
            if (upgrade.name === 'Better Click' || upgrade.name === '更好的点击') {
                // Better Click increases coins per click
                unitText = window.i18n ? window.i18n.t('perClick') : ' coins/click';
            } else if (upgrade.name.startsWith('Autoclicker') || upgrade.name.startsWith('自动点击器')) {
                // Autoclicker increases coins per second
                unitText = window.i18n ? window.i18n.t('perSecond') : '/sec';
            } else if (upgrade.name === 'Lumberjack Efficiency' || upgrade.name === '伐木工效率') {
                // Lumberjack Efficiency increases wood per second
                unitText = window.i18n ? window.i18n.t('woodPerSecondShort') : ' wood/sec';
            } else if (upgrade.name === 'Stone Mason Skill' || upgrade.name === '石匠技能') {
                // Stone Mason Skill increases stone per second
                unitText = window.i18n ? window.i18n.t('stonePerSecondShort') : ' stone/sec';
            } else {
                // Default fallback
                unitText = window.i18n ? window.i18n.t('perSecond') : '/sec';
            }
            
            upgradeDiv.innerHTML = `
                <div>
                    <strong>${upgrade.name}</strong><br>
                    <small>+${productionIncrease}${unitText}</small>
                </div>
                <div>
                    <span>${costText}: ${Math.floor(upgrade.cost)}</span>
                    <button id="buy-upgrade-${index}" 
                            onclick="window.buyUpgrade(${index})"
                            ${!window.gameInitialized ? 'disabled' : ''}>
                        ${buyText}
                    </button>
                </div>
            `;
            upgradeList.appendChild(upgradeDiv);
        });
    }
};

// Function that will be called from Rust/WASM to update buildings
window.updateBuildingDisplay = function(buildings) {
    const buildingList = document.getElementById('building-list');
    if (buildingList) {
        buildingList.innerHTML = '';
        buildings.forEach((building, index) => {
            const buildingDiv = document.createElement('div');
            buildingDiv.className = 'building-item';
            
            // Use i18n for dynamic text
            const ownedText = window.i18n ? window.i18n.t('owned') : 'Owned';
            const costText = window.i18n ? window.i18n.t('cost') : 'Cost';
            const buyText = window.i18n ? window.i18n.t('buy') : 'Buy';
            const perSecondText = window.i18n ? window.i18n.t('perSecond') : '/sec';
            
            // Fix: use production_rate instead of productionRate (serde uses snake_case)
            const productionRate = building.production_rate || building.productionRate || 0;
            
            buildingDiv.innerHTML = `
                <div>
                    <strong>${building.name}</strong><br>
                    <small>${productionRate}${perSecondText}</small>
                </div>
                <div>
                    ${ownedText}: ${building.count}<br>
                    ${costText}: ${Math.floor(building.cost)}
                    <button id="buy-building-${index}" 
                            onclick="window.buyBuilding(${index})"
                            ${!window.gameInitialized ? 'disabled' : ''}>
                        ${buyText}
                    </button>
                </div>
            `;
            buildingList.appendChild(buildingDiv);
        });
    }
};

// Functions called from UI to communicate with Rust/WASM
window.buyUpgrade = function(index) {
    if (window.rustGame && typeof window.rustGame.buy_upgrade === 'function') {
        const success = window.rustGame.buy_upgrade(index);
        if (!success) {
            // Provide visual feedback for failed purchase
            const button = document.getElementById(`buy-upgrade-${index}`);
            if (button) {
                button.classList.add('purchase-failed');
                setTimeout(() => {
                    button.classList.remove('purchase-failed');
                }, 300);
            }
        }
    }
};

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
    const clickArea = document.getElementById('click-area');
    if (clickArea) {
        clickArea.addEventListener('click', function() {
            if (window.rustGame && typeof window.rustGame.click_action === 'function') {
                window.rustGame.click_action();
            }
        });
    }
    
    // Initialize i18n after DOM is loaded
    if (window.i18n) {
        window.i18n.updateAllTranslations();
    }
});