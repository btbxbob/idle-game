// Placeholder JavaScript for Rust WASM integration
// This will be replaced by the WASM output from Rust

// Initialize the game when WASM module loads
window.gameInitialized = false;

// Function that will be called from Rust/WASM to update UI
window.updateResourceDisplay = function(coins, coinsPerSecond, coinsPerClick) {
    const coinsElement = document.getElementById('coins');
    const cpsElement = document.getElementById('cps');
    const cpcElement = document.getElementById('cpc');
    const coinDisplay = document.getElementById('coin-display');
    
    if (coinsElement) {
        coinsElement.textContent = `Coins: ${Math.floor(coins)}`;
    }
    
    if (cpsElement) {
        cpsElement.textContent = `Coins/sec: ${coinsPerSecond.toFixed(1)}`;
    }
    
    if (cpcElement) {
        cpcElement.textContent = `Coins/click: ${coinsPerClick.toFixed(1)}`;
    }
    
    if (coinDisplay) {
        coinDisplay.textContent = `${Math.floor(coins)}`;
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
            upgradeDiv.innerHTML = `
                <div>
                    <strong>${upgrade.name}</strong><br>
                    <small>+${upgrade.productionIncrease}/sec per building</small>
                </div>
                <div>
                    <span>Cost: ${Math.floor(upgrade.cost)}</span>
                    <button id="buy-upgrade-${index}" 
                            onclick="window.buyUpgrade(${index})"
                            ${!window.gameInitialized ? 'disabled' : ''}>
                        Buy
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
            buildingDiv.innerHTML = `
                <div>
                    <strong>${building.name}</strong><br>
                    <small>${building.productionRate}/sec</small>
                </div>
                <div>
                    Owned: ${building.count}<br>
                    Cost: ${Math.floor(building.cost)}
                    <button id="buy-building-${index}" 
                            onclick="window.buyBuilding(${index})"
                            ${!window.gameInitialized ? 'disabled' : ''}>
                        Buy
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
});