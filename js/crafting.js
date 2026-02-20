/**
 * CraftingManager - Manages the crafting system UI
 * Handles recipe display, crafting operations, and confirmation dialogs
 */
class CraftingManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.currentRecipes = [];
    }

    /**
     * Fetch crafting recipes from Rust game state
     */
    update() {
        if (this.rustGame && typeof this.rustGame.get_crafting_recipes === 'function') {
            try {
                const recipes = this.rustGame.get_crafting_recipes();
                this.currentRecipes = recipes || [];
                return this.currentRecipes;
            } catch (error) {
                console.error('Failed to fetch crafting recipes:', error);
                this.currentRecipes = [];
            }
        }
        return [];
    }

    /**
     * Craft a recipe by ID
     * @param {string} recipeId - The recipe ID to craft
     * @returns {boolean} Success status
     */
    craft(recipeId) {
        if (this.rustGame && typeof this.rustGame.craft_resource === 'function') {
            try {
                const success = this.rustGame.craft_resource(recipeId);
                if (!success) {
                    console.warn(`Crafting failed for recipe: ${recipeId}`);
                }
                return success;
            } catch (error) {
                console.error(`Error crafting recipe ${recipeId}:`, error);
                return false;
            }
        }
        return false;
    }

    /**
     * Show confirmation dialog before crafting
     * @param {Object} recipe - The recipe to confirm
     * @returns {Promise<boolean>} User confirmation result
     */
    showConfirmationDialog(recipe) {
        return new Promise((resolve) => {
            const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
            
            const inputText = this.getResourceAmountText(recipe.input_resource, recipe.input_amount);
            const outputText = this.getResourceAmountText(recipe.output_resource, recipe.output_amount);
            
            const message = `确认合成？\n消耗：${inputText}\n获得：${outputText}`;
            
            if (confirm(message)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    /**
     * Get formatted resource text
     * @param {string} resource - Resource type
     * @param {number} amount - Resource amount
     * @returns {string} Formatted resource text
     */
    getResourceAmountText(resource, amount) {
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
        
        let resourceName = resource;
        if (resource === 'coins') {
            resourceName = t('coins') || '金币';
        } else if (resource === 'wood') {
            resourceName = t('wood') || '木头';
        } else if (resource === 'stone') {
            resourceName = t('stone') || '石头';
        }
        
        return `${Math.floor(amount)} ${resourceName}`;
    }

    /**
     * Check if player has enough resources for recipe
     * @param {Object} recipe - The recipe to check
     * @returns {boolean} Whether resources are sufficient
     */
    hasEnoughResources(recipe) {
        if (!this.rustGame) return false;
        
        try {
            let currentAmount = 0;
            if (recipe.input_resource === 'coins') {
                currentAmount = this.rustGame.get_coins();
            } else if (recipe.input_resource === 'wood') {
                currentAmount = this.rustGame.get_wood();
            } else if (recipe.input_resource === 'stone') {
                currentAmount = this.rustGame.get_stone();
            }
            
            return currentAmount >= recipe.input_amount;
        } catch (error) {
            console.error('Error checking resources:', error);
            return false;
        }
    }

    /**
     * Handle craft button click
     * @param {string} recipeId - Recipe ID to craft
     */
    async handleCraftClick(recipeId) {
        const recipe = this.currentRecipes.find(r => r.id === recipeId);
        if (!recipe) {
            console.warn(`Recipe ${recipeId} not found`);
            return;
        }

        // Check if recipe is unlocked
        if (!recipe.unlocked) {
            console.warn(`Recipe ${recipeId} is not unlocked`);
            return;
        }

        // Check resources first
        if (!this.hasEnoughResources(recipe)) {
            const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
            const inputText = this.getResourceAmountText(recipe.input_resource, recipe.input_amount);
            alert(`资源不足！需要：${inputText}`);
            return;
        }

        // Show confirmation dialog
        const confirmed = await this.showConfirmationDialog(recipe);
        if (!confirmed) {
            return;
        }

        // Perform crafting
        const success = this.craft(recipeId);
        
        if (success) {
            // Visual feedback for success
            const button = document.getElementById(`craft-btn-${recipeId}`);
            if (button) {
                button.classList.add('craft-success');
                setTimeout(() => {
                    button.classList.remove('craft-success');
                }, 300);
            }
        } else {
            // Visual feedback for failure
            const button = document.getElementById(`craft-btn-${recipeId}`);
            if (button) {
                button.classList.add('craft-failed');
                setTimeout(() => {
                    button.classList.remove('craft-failed');
                }, 300);
            }
        }
    }

    /**
     * Render all crafting recipes to DOM
     * @param {string} containerId - DOM element ID for the crafting list
     */
    renderRecipes(containerId = 'crafting-list') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Crafting container "${containerId}" not found`);
            return;
        }

        const recipes = this.update();
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

        if (!recipes || recipes.length === 0) {
            container.innerHTML = `<p id="crafting-placeholder">${t('craftingPlaceholder') || '合成系统将在未来版本中实现'}</p>`;
            return;
        }

        // Build recipe list HTML
        const recipeElements = recipes.map((recipe, index) => {
            const isUnlocked = recipe.unlocked !== undefined ? recipe.unlocked : true;
            const hasResources = this.hasEnoughResources(recipe);
            const canCraft = isUnlocked && hasResources;
            
            const inputText = this.getResourceAmountText(recipe.input_resource, recipe.input_amount);
            const outputText = this.getResourceAmountText(recipe.output_resource, recipe.output_amount);
            
            const statusClass = !isUnlocked ? 'recipe-locked' : (!hasResources ? 'recipe-insufficient' : 'recipe-available');
            const buttonText = isUnlocked ? (t('craft') || '合成') : (t('locked') || '已锁定');
            const disabledAttr = !canCraft ? 'disabled' : '';
            
            return `
                <div class="crafting-recipe ${statusClass}" id="recipe-${recipe.id}">
                    <div class="recipe-header">
                        <strong class="recipe-name">${recipe.name}</strong>
                        ${!isUnlocked ? '<span class="locked-indicator">🔒</span>' : ''}
                    </div>
                    <div class="recipe-details">
                        <div class="recipe-input">
                            <span class="recipe-label">${t('input') || '消耗'}:</span>
                            <span class="recipe-resource">${inputText}</span>
                        </div>
                        <div class="recipe-output">
                            <span class="recipe-label">${t('output') || '获得'}:</span>
                            <span class="recipe-resource">${outputText}</span>
                        </div>
                    </div>
                    <div class="recipe-actions">
                        <button 
                            id="craft-btn-${recipe.id}"
                            class="craft-button ${!canCraft ? 'disabled' : ''}"
                            ${disabledAttr}
                            onclick="window.craftingManager.handleCraftClick('${recipe.id}')">
                            ${buttonText}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = recipeElements;
    }
}

// Expose to global scope
window.CraftingManager = CraftingManager;

// Add update function for game loop integration
window.updateCraftingPanel = function() {
    if (window.craftingManager && typeof window.craftingManager.renderRecipes === 'function') {
        const craftingTab = document.getElementById('tab-crafting');
        if (craftingTab && craftingTab.classList.contains('active')) {
            window.craftingManager.update();
            window.craftingManager.renderRecipes('crafting-list');
        }
    }
};
