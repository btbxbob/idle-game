// ResourcePanel - Renders resource panel UI using ResourceManager
// Integrates with resource-classification.js for tier filtering
// Follows existing manager pattern (see workers.js, statistics.js)

import { ResourceManager } from './resource-manager.js';
import { ResourceTiers, getTierResources } from './resource-classification.js';

let resourceManager = null;

/**
 * Create category/tier filter buttons UI
 * @param {string} containerId - DOM element ID for the container
 */
function createCategorySwitchUI(containerId = 'resource-category-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container #${containerId} not found, skipping category switch UI`);
    return;
  }

  const categories = [
    { id: 'ALL', label: '全部资源' },
    { id: 'TIER1_BASIC', label: '基础资源' },
    { id: 'TIER2_PROCESSED', label: '加工材料' },
    { id: 'TIER3_ADVANCED', label: '高科技' },
    { id: 'SPECIAL', label: '特殊' }
  ];

  container.innerHTML = `
    <div class="resource-category-tabs">
      ${categories.map(cat => `
        <button class="category-tab-button" data-tier="${cat.id}">
          ${cat.label}
        </button>
      `).join('')}
    </div>
  `;

  // Add click handlers
  const buttons = container.querySelectorAll('.category-tab-button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all
      buttons.forEach(b => b.classList.remove('active'));
      // Add active to clicked
      btn.classList.add('active');
      // Re-render panel with filter
      const tier = btn.getAttribute('data-tier');
      renderResourcePanel('resource-panel-container', tier);
    });
  });

  // Set initial active state (ALL by default)
  const allButton = container.querySelector('[data-tier="ALL"]');
  if (allButton) {
    allButton.classList.add('active');
  }
}

/**
 * Initialize resource panel system
 * @param {Object} rustGame - WASM game instance
 */
export function initResourcePanel(rustGame) {
  resourceManager = new ResourceManager(rustGame);
  createCategorySwitchUI('resource-category-container');
}

/**
 * Render resource panel to specified container
 * @param {string} containerId - DOM element ID
 * @param {string} tierFilter - Which tier to show ('ALL', 'TIER1_BASIC', 'TIER2_PROCESSED', 'TIER3_ADVANCED', 'SPECIAL')
 */
export function renderResourcePanel(containerId = 'resource-panel-container', tierFilter = 'ALL') {
  if (!resourceManager) {
    console.error('Resource panel not initialized. Call initResourcePanel() first.');
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return;
  }

  // Get filtered resources
  const resources = resourceManager.getDisplayResources(tierFilter);
  
  // Build HTML
  container.innerHTML = `
    <div class="resource-panel-header">
      <h3 class="resource-panel-title">资源面板</h3>
      <div class="resource-panel-stats">
        拥有：${resourceManager.getOwnedResourceCount()} / 61
      </div>
    </div>
    <div class="resource-panel-scrollable">
      <div class="resource-grid-extended">
        ${resources.map(res => `
          <div class="resource-item ${resourceManager.getResourceColor(res.name)}" 
               data-resource-name="${res.name}">
            <span class="resource-name">${window.i18n.t(res.name)}</span>
            <span class="resource-amount">${resourceManager.formatResourceValue(res.amount)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Update specific resource display (for game loop)
 * @param {string} resourceName - Name of the resource
 * @param {number} newAmount - New amount to display
 */
export function updateResourceDisplay(resourceName, newAmount) {
  const element = document.querySelector(`[data-resource-name="${resourceName}"]`);
  if (element) {
    const amountEl = element.querySelector('.resource-amount');
    if (amountEl) {
      amountEl.textContent = resourceManager.formatResourceValue(newAmount);
    }
  }
}

/**
 * Update resource panel stats (owned count, total, etc.)
 * @param {string} containerId - DOM element ID
 */
export function updateResourcePanelStats(containerId = 'resource-panel-container') {
  const container = document.getElementById(containerId);
  if (!container || !resourceManager) return;

  const statsEl = container.querySelector('.resource-panel-stats');
  if (statsEl) {
    statsEl.textContent = `拥有：${resourceManager.getOwnedResourceCount()} / 61`;
  }
}

/**
 * Refresh entire resource panel (call after tier change)
 * @param {string} containerId - DOM element ID
 * @param {string} tierFilter - New tier filter
 */
export function refreshResourcePanel(containerId = 'resource-panel-container', tierFilter = 'ALL') {
  renderResourcePanel(containerId, tierFilter);
}

// Export for global access
window.ResourcePanel = {
  init: initResourcePanel,
  render: renderResourcePanel,
  update: updateResourceDisplay,
  updateStats: updateResourcePanelStats,
  refresh: refreshResourcePanel
};
