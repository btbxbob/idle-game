// Resource Classification System
// Organizes 60 resources into UI-displayable categories and tiers
// Mirrors the ResourceType enum from src/state/resource.rs

/**
 * Resource tiers - matches Rust ResourceTier enum
 * Used for progressive unlocking and UI organization
 */
export const ResourceTiers = {
  /**
   * Tier 1: Basic Resources (10)
   * Primary resources gathered directly from nature
   */
  TIER1_BASIC: [
    'Gold',
    'Wood',
    'Stone',
    'IronOre',
    'CopperOre',
    'AluminumOre',
    'Coal',
    'Oil',
    'Crystal',
    'Food'
  ],

  /**
   * Tier 2: Processed Resources (40)
   * Secondary resources crafted from Tier 1 materials
   */
  TIER2_PROCESSED: [
    // Metal Ingots (3)
    'IronIngot',
    'CopperIngot',
    'AluminumIngot',
    
    // Metal Plates (3)
    'SteelPlate',
    'CopperPlate',
    'AluminumPlate',
    
    // Basic Materials (4)
    'Glass',
    'Plastic',
    'Chemicals',
    'Fuel',
    
    // Paper & Textiles (4)
    'Paper',
    'Ink',
    'Cloth',
    'Leather',
    
    // Construction Materials (4)
    'Ceramic',
    'Cement',
    'Brick',
    'Rebar',
    
    // Basic Components (6)
    'Wire',
    'Pipe',
    'Valve',
    'Gear',
    'Bearing',
    'Spring',
    
    // Fasteners (3)
    'Screw',
    'Nut',
    'Washer',
    
    // Mechanical Parts (4)
    'Pump',
    'Motor',
    'Sensor',
    'CircuitBoard',
    
    // Electronic Components (5)
    'Capacitor',
    'Resistor',
    'Diode',
    'Transistor',
    'Transformer',
    
    // Power Systems (2)
    'Generator',
    'Compressor',
    'Battery'
  ],

  /**
   * Tier 3: High-Tech Resources (10)
   * Advanced resources requiring complex manufacturing
   */
  TIER3_ADVANCED: [
    'Microchip',
    'Engine',
    'Robot',
    'Satellite',
    'Spaceship',
    'QuantumComputer',
    'Antimatter',
    'DarkMatter',
    'TimeCrystal',
    'Nanobot'
  ],

  /**
   * Special Resources (2)
   * Unique resources with special game mechanics
   */
  SPECIAL: [
    'Corpse',
    'Maggot'
  ]
};

/**
 * Resource categories by material type
 * Used for filtering and organizing in UI
 */
export const ResourceCategories = {
  /**
   * Precious & Base Metals
   */
  METALS: [
    'Gold',
    'IronOre',
    'CopperOre',
    'AluminumOre',
    'IronIngot',
    'CopperIngot',
    'AluminumIngot',
    'SteelPlate',
    'CopperPlate',
    'AluminumPlate'
  ],

  /**
   * Natural & Construction Materials
   */
  MATERIALS: [
    'Wood',
    'Stone',
    'Glass',
    'Plastic',
    'Ceramic',
    'Cement',
    'Brick',
    'Rebar'
  ],

  /**
   * Energy & Fuel Resources
   */
  ENERGY: [
    'Coal',
    'Oil',
    'Fuel',
    'Battery',
    'Generator',
    'Transformer'
  ],

  /**
   * Food & Organic Materials
   */
  FOOD: [
    'Food',
    'Cloth',
    'Leather'
  ],

  /**
   * Chemical & Industrial Resources
   */
  CHEMICALS: [
    'Crystal',
    'Chemicals',
    'Plastic',
    'Ink'
  ],

  /**
   * Paper & Documentation
   */
  PAPER: [
    'Paper',
    'Ink'
  ],

  /**
   * Mechanical Components
   */
  MECHANICAL: [
    'Gear',
    'Bearing',
    'Spring',
    'Pump',
    'Motor',
    'Compressor',
    'Valve',
    'Pipe'
  ],

  /**
   * Electronic Components
   */
  ELECTRONICS: [
    'Wire',
    'CircuitBoard',
    'Capacitor',
    'Resistor',
    'Diode',
    'Transistor',
    'Sensor',
    'Microchip'
  ],

  /**
   * Fasteners & Hardware
   */
  FASTENERS: [
    'Screw',
    'Nut',
    'Washer'
  ],

  /**
   * High-Tech & Advanced Resources
   */
  HIGH_TECH: [
    'Microchip',
    'Engine',
    'Robot',
    'Satellite',
    'Spaceship',
    'QuantumComputer',
    'Antimatter',
    'DarkMatter',
    'TimeCrystal',
    'Nanobot'
  ],

  /**
   * Special & Unique Resources
   */
  SPECIAL: [
    'Corpse',
    'Maggot'
  ]
};

/**
 * Get the tier for a given resource
 * @param {string} resourceName - Name of the resource (ResourceType enum value)
 * @returns {string} Tier name (e.g., 'TIER1_BASIC', 'TIER2_PROCESSED', etc.)
 */
export function getResourceTier(resourceName) {
  for (const [tier, resources] of Object.entries(ResourceTiers)) {
    if (resources.includes(resourceName)) {
      return tier;
    }
  }
  return 'UNKNOWN';
}

/**
 * Get all resources in a specific category
 * @param {string} categoryName - Name of the category
 * @returns {Array<string>} Array of resource names in the category
 */
export function getCategoryResources(categoryName) {
  return ResourceCategories[categoryName] || [];
}

/**
 * Get all resources in a specific tier
 * @param {string} tierName - Name of the tier
 * @returns {Array<string>} Array of resource names in the tier
 */
export function getTierResources(tierName) {
  return ResourceTiers[tierName] || [];
}

/**
 * Check if a resource belongs to a specific category
 * @param {string} resourceName - Name of the resource
 * @param {string} categoryName - Name of the category
 * @returns {boolean} True if resource is in category
 */
export function isResourceInCategory(resourceName, categoryName) {
  const category = ResourceCategories[categoryName];
  return category ? category.includes(resourceName) : false;
}

/**
 * Get all categories that contain a specific resource
 * @param {string} resourceName - Name of the resource
 * @returns {Array<string>} Array of category names
 */
export function getResourceCategories(resourceName) {
  const categories = [];
  for (const [categoryName, resources] of Object.entries(ResourceCategories)) {
    if (resources.includes(resourceName)) {
      categories.push(categoryName);
    }
  }
  return categories;
}

/**
 * Get total count of resources in each tier
 * @returns {Object} Object with tier names as keys and counts as values
 */
export function getTierCounts() {
  const counts = {};
  for (const [tierName, resources] of Object.entries(ResourceTiers)) {
    counts[tierName] = resources.length;
  }
  return counts;
}

/**
 * Validate that all resources are properly classified
 * @returns {Object} Validation result with any missing or duplicate resources
 */
export function validateResourceClassification() {
  const allTiers = Object.values(ResourceTiers).flat();
  const allCategories = Object.values(ResourceCategories).flat();
  const uniqueTiers = new Set(allTiers);
  const uniqueCategories = new Set(allCategories);
  
  // Find resources in tiers but not in categories
  const missingFromCategories = allTiers.filter(r => !uniqueCategories.has(r));
  
  // Find resources in categories but not in tiers
  const missingFromTiers = allCategories.filter(r => !uniqueTiers.has(r));
  
  // Check for duplicates within tiers
  const tierDuplicates = allTiers.filter((r, i) => allTiers.indexOf(r) !== i);
  
  // Check for duplicates within categories
  const categoryDuplicates = allCategories.filter((r, i) => allCategories.indexOf(r) !== i);
  
  return {
    isValid: missingFromCategories.length === 0 && missingFromTiers.length === 0 && tierDuplicates.length === 0,
    missingFromCategories,
    missingFromTiers,
    tierDuplicates,
    categoryDuplicates,
    totalTiers: uniqueTiers.size,
    totalCategories: uniqueCategories.size
  };
}
