use js_sys::Date;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Clone)]
#[wasm_bindgen]
pub struct Statistics {
    pub total_clicks: u32,
    pub total_coins_earned: f64,
    pub total_wood_earned: f64,
    pub total_stone_earned: f64,
    pub total_resources_crafted: u32,
    pub achievements_unlocked_count: u32,
    pub play_time_seconds: f64,
    pub buildings_purchased: u32,
    pub upgrades_purchased: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GameState {
    pub coins: f64,
    pub wood: f64,
    pub stone: f64,
    pub coins_per_click: f64,
    pub coins_per_second: f64,
    pub wood_per_second: f64,
    pub stone_per_second: f64,
    pub autoclick_count: u32,
    pub total_clicks: u32,
    pub last_update_time: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Upgrade {
    pub name: String,
    pub cost: f64,
    pub production_increase: f64,
    pub owned: u32,
    pub unlocked: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Building {
    pub name: String,
    pub cost: f64,
    pub production_rate: f64,
    pub count: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Worker {
    pub name: String,
    pub skills: String,      // Reserved for future use - stores skill type
    pub background: String,  // Reserved for future use - background story
    pub preferences: String, // Reserved for future use - preferences
    pub assigned_building: Option<String>,
    pub level: u32,
    pub efficiency_multiplier: f64, // Efficiency bonus (1.0 base)
    pub xp: f64,                    // Experience points
    pub xp_to_next_level: f64,      // XP needed for next level
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Achievement {
    pub id: String,
    pub name: String,
    pub description: String,
    pub unlocked: bool,
    pub unlock_timestamp: Option<f64>,
    pub progress: f64,
    pub requirement: f64,
    pub category: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct CraftingRecipe {
    pub id: String,
    pub name: String,
    pub input_resource: String,
    pub input_amount: f64,
    pub output_resource: String,
    pub output_amount: f64,
    pub unlocked: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UnlockedFeature {
    pub id: String,
    pub name: String,
    pub feature_type: String,
    pub unlocked: bool,
    pub unlock_timestamp: Option<f64>,
    pub requirement_type: String,
    pub requirement_value: f64,
}

/// Complete game save data structure for persistence
#[derive(Serialize, Deserialize, Clone)]
pub struct SavedGame {
    pub state: GameState,
    pub statistics: Statistics,
    pub upgrades: Vec<Upgrade>,
    pub buildings: Vec<Building>,
    pub workers: Vec<Worker>,
    pub achievements: Vec<Achievement>,
    pub crafting_recipes: Vec<CraftingRecipe>,
    pub unlocked_features: Vec<UnlockedFeature>,
    pub save_timestamp: f64,
    pub version: String,
}

impl IdleGame {
    /// Serialize entire game state to SavedGame structure
    pub fn save_game(&self) -> SavedGame {
        SavedGame {
            state: self.state.borrow().clone(),
            statistics: self.statistics.borrow().clone(),
            upgrades: self.upgrades.clone(),
            buildings: self.buildings.clone(),
            workers: self.workers.clone(),
            achievements: self.achievements.clone(),
            crafting_recipes: self.crafting_recipes.clone(),
            unlocked_features: self.unlocked_features.clone(),
            save_timestamp: Date::now(),
            version: "0.2.6".to_string(),
        }
    }

    /// Load game state from SavedGame structure
    pub fn load_game(&mut self, saved: SavedGame) {
        {
            let mut state = self.state.borrow_mut();
            state.coins = saved.state.coins;
            state.wood = saved.state.wood;
            state.stone = saved.state.stone;
            state.coins_per_click = saved.state.coins_per_click;
            state.coins_per_second = saved.state.coins_per_second;
            state.wood_per_second = saved.state.wood_per_second;
            state.stone_per_second = saved.state.stone_per_second;
            state.autoclick_count = saved.state.autoclick_count;
            state.total_clicks = saved.state.total_clicks;
            state.last_update_time = saved.state.last_update_time;
        }

        {
            let mut stats = self.statistics.borrow_mut();
            stats.total_clicks = saved.statistics.total_clicks;
            stats.total_coins_earned = saved.statistics.total_coins_earned;
            stats.total_wood_earned = saved.statistics.total_wood_earned;
            stats.total_stone_earned = saved.statistics.total_stone_earned;
            stats.total_resources_crafted = saved.statistics.total_resources_crafted;
            stats.achievements_unlocked_count = saved.statistics.achievements_unlocked_count;
            stats.play_time_seconds = saved.statistics.play_time_seconds;
            stats.buildings_purchased = saved.statistics.buildings_purchased;
            stats.upgrades_purchased = saved.statistics.upgrades_purchased;
        }

        self.upgrades = saved.upgrades;
        self.buildings = saved.buildings;
        self.workers = saved.workers;
        self.achievements = saved.achievements;
        self.crafting_recipes = saved.crafting_recipes;
        self.unlocked_features = saved.unlocked_features;
    }
}

#[wasm_bindgen]
impl IdleGame {
    /// Save game to localStorage via JS interop
    #[wasm_bindgen(js_name = saveToLocalStorage)]
    pub fn save_to_local_storage(&self) -> Result<(), JsValue> {
        let saved_game = self.save_game();

        // Serialize to JSON
        let json_str = serde_json::to_string(&saved_game)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?;

        // Save to localStorage using JavaScript
        let window = web_sys::window().ok_or_else(|| JsValue::from_str("Window not available"))?;

        let local_storage = window
            .local_storage()
            .map_err(|e| JsValue::from_str(&format!("localStorage access error: {:?}", e)))?
            .ok_or_else(|| JsValue::from_str("localStorage not available"))?;

        local_storage
            .set_item("idle_game_save", &json_str)
            .map_err(|e| JsValue::from_str(&format!("localStorage set error: {:?}", e)))?;

        Ok(())
    }

    /// Load game from localStorage via JS interop
    #[wasm_bindgen(js_name = loadFromLocalStorage)]
    pub fn load_from_local_storage(&mut self) -> Result<bool, JsValue> {
        let window = web_sys::window().ok_or_else(|| JsValue::from_str("Window not available"))?;

        let local_storage = window
            .local_storage()
            .map_err(|e| JsValue::from_str(&format!("localStorage access error: {:?}", e)))?
            .ok_or_else(|| JsValue::from_str("localStorage not available"))?;

        // Try to get saved game data
        let saved_data = local_storage
            .get_item("idle_game_save")
            .map_err(|e| JsValue::from_str(&format!("localStorage get error: {:?}", e)))?;

        match saved_data {
            Some(json_str) => {
                // Deserialize from JSON
                let saved_game: SavedGame = serde_json::from_str(&json_str)
                    .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;

                // Load the saved game state
                self.load_game(saved_game);
                Ok(true)
            }
            None => Ok(false), // No saved game found
        }
    }
}

#[wasm_bindgen]
pub struct IdleGame {
    state: Rc<RefCell<GameState>>,
    upgrades: Vec<Upgrade>,
    buildings: Vec<Building>,
    workers: Vec<Worker>,
    #[wasm_bindgen(skip)]
    achievements: Vec<Achievement>,
    #[wasm_bindgen(skip)]
    crafting_recipes: Vec<CraftingRecipe>,
    #[wasm_bindgen(skip)]
    unlocked_features: Vec<UnlockedFeature>,
    statistics: Rc<RefCell<Statistics>>,
}

#[wasm_bindgen]
impl IdleGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> IdleGame {
        let now = Date::now();

        let achievements = vec![
            // Click achievements
            Achievement {
                id: "click_novice_10".to_string(),
                name: "点击新手".to_string(),
                description: "点击 10 次".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 10.0,
                category: "clicks".to_string(),
            },
            Achievement {
                id: "click_master_100".to_string(),
                name: "点击大师".to_string(),
                description: "点击 100 次".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 100.0,
                category: "clicks".to_string(),
            },
            Achievement {
                id: "click_legend_1000".to_string(),
                name: "点击传奇".to_string(),
                description: "点击 1000 次".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1000.0,
                category: "clicks".to_string(),
            },
            // Resource achievements
            Achievement {
                id: "first_coins_100".to_string(),
                name: "第一桶金".to_string(),
                description: "获得 100 金币".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 100.0,
                category: "resources".to_string(),
            },
            Achievement {
                id: "wood_collector_1000".to_string(),
                name: "木材收集者".to_string(),
                description: "获得 1000 木头".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1000.0,
                category: "resources".to_string(),
            },
            Achievement {
                id: "stone_hoarder_5000".to_string(),
                name: "石头囤积者".to_string(),
                description: "获得 5000 石头".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 5000.0,
                category: "resources".to_string(),
            },
            // Building achievements
            Achievement {
                id: "first_building".to_string(),
                name: "第一座建筑".to_string(),
                description: "购买第一座建筑".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1.0,
                category: "buildings".to_string(),
            },
            Achievement {
                id: "building_enthusiast_10".to_string(),
                name: "建筑爱好者".to_string(),
                description: "购买 10 座建筑".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 10.0,
                category: "buildings".to_string(),
            },
            Achievement {
                id: "building_tycoon_50".to_string(),
                name: "建筑大亨".to_string(),
                description: "购买 50 座建筑".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 50.0,
                category: "buildings".to_string(),
            },
            // Crafting achievements
            Achievement {
                id: "first_craft".to_string(),
                name: "第一次制作".to_string(),
                description: "制作第一个物品".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1.0,
                category: "crafting".to_string(),
            },
            Achievement {
                id: "craft_master_100".to_string(),
                name: "制作大师".to_string(),
                description: "制作 100 个物品".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 100.0,
                category: "crafting".to_string(),
            },
            // Unlock achievements
            Achievement {
                id: "first_unlock".to_string(),
                name: "首次解锁".to_string(),
                description: "解锁第一个成就".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 1.0,
                category: "unlocks".to_string(),
            },
            Achievement {
                id: "progress_master_5".to_string(),
                name: "进度大师".to_string(),
                description: "解锁 5 个成就".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                progress: 0.0,
                requirement: 5.0,
                category: "unlocks".to_string(),
            },
        ];

        IdleGame {
            state: Rc::new(RefCell::new(GameState {
                coins: 0.0,
                wood: 0.0,
                stone: 0.0,
                coins_per_click: 1.0,
                coins_per_second: 0.0,
                wood_per_second: 0.0,
                stone_per_second: 0.0,
                autoclick_count: 0,
                total_clicks: 0,
                last_update_time: now,
            })),
            statistics: Rc::new(RefCell::new(Statistics {
                total_clicks: 0,
                total_coins_earned: 0.0,
                total_wood_earned: 0.0,
                total_stone_earned: 0.0,
                total_resources_crafted: 0,
                achievements_unlocked_count: 0,
                play_time_seconds: 0.0,
                buildings_purchased: 0,
                upgrades_purchased: 0,
            })),
            achievements: achievements,
            crafting_recipes: vec![
                CraftingRecipe {
                    id: "coins_to_wood".to_string(),
                    name: "金币换木材".to_string(),
                    input_resource: "coins".to_string(),
                    input_amount: 100.0,
                    output_resource: "wood".to_string(),
                    output_amount: 10.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "wood_to_coins".to_string(),
                    name: "木材换金币".to_string(),
                    input_resource: "wood".to_string(),
                    input_amount: 10.0,
                    output_resource: "coins".to_string(),
                    output_amount: 100.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "coins_to_stone".to_string(),
                    name: "金币换石头".to_string(),
                    input_resource: "coins".to_string(),
                    input_amount: 100.0,
                    output_resource: "stone".to_string(),
                    output_amount: 1.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "stone_to_coins".to_string(),
                    name: "石头换金币".to_string(),
                    input_resource: "stone".to_string(),
                    input_amount: 1.0,
                    output_resource: "coins".to_string(),
                    output_amount: 100.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "wood_to_stone".to_string(),
                    name: "木材换石头".to_string(),
                    input_resource: "wood".to_string(),
                    input_amount: 10.0,
                    output_resource: "stone".to_string(),
                    output_amount: 1.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "stone_to_wood".to_string(),
                    name: "石头换木材".to_string(),
                    input_resource: "stone".to_string(),
                    input_amount: 1.0,
                    output_resource: "wood".to_string(),
                    output_amount: 10.0,
                    unlocked: true,
                },
            ],
            upgrades: vec![
                Upgrade {
                    name: "Better Click".to_string(),
                    cost: 10.0,
                    production_increase: 1.0,
                    owned: 0,
                    unlocked: true,
                },
                Upgrade {
                    name: "Autoclicker Lv1".to_string(),
                    cost: 50.0,
                    production_increase: 1.0,
                    owned: 0,
                    unlocked: true,
                },
                Upgrade {
                    name: "Lumberjack Efficiency".to_string(),
                    cost: 20.0,
                    production_increase: 0.2,
                    owned: 0,
                    unlocked: true,
                },
                Upgrade {
                    name: "Stone Mason Skill".to_string(),
                    cost: 25.0,
                    production_increase: 0.3,
                    owned: 0,
                    unlocked: true,
                },
            ],
            buildings: vec![
                Building {
                    name: "Coin Mine".to_string(),
                    cost: 15.0,
                    production_rate: 0.1,
                    count: 0,
                },
                Building {
                    name: "Coin Factory".to_string(),
                    cost: 100.0,
                    production_rate: 1.0,
                    count: 0,
                },
                Building {
                    name: "Coin Corporation".to_string(),
                    cost: 500.0,
                    production_rate: 5.0,
                    count: 0,
                },
                Building {
                    name: "Woodcutter".to_string(),
                    cost: 20.0,
                    production_rate: 0.2,
                    count: 0,
                },
                Building {
                    name: "Lumber Mill".to_string(),
                    cost: 80.0,
                    production_rate: 1.5,
                    count: 0,
                },
                Building {
                    name: "Forest Workshop".to_string(),
                    cost: 400.0,
                    production_rate: 4.0,
                    count: 0,
                },
                Building {
                    name: "Stone Quarry".to_string(),
                    cost: 25.0,
                    production_rate: 0.15,
                    count: 0,
                },
                Building {
                    name: "Rock Crusher".to_string(),
                    cost: 90.0,
                    production_rate: 1.2,
                    count: 0,
                },
                Building {
                    name: "Mason Workshop".to_string(),
                    cost: 450.0,
                    production_rate: 4.5,
                    count: 0,
                },
            ],
            workers: vec![
                Worker {
                    name: "矿工".to_string(),
                    skills: "mining".to_string(),
                    background: "擅长挖矿的工人".to_string(),
                    preferences: "Coin Mine".to_string(),
                    assigned_building: None,
                    level: 1,
                    efficiency_multiplier: 1.0,
                    xp: 0.0,
                    xp_to_next_level: 100.0,
                },
                Worker {
                    name: "伐木工".to_string(),
                    skills: "logging".to_string(),
                    background: "擅长伐木的工人".to_string(),
                    preferences: "Woodcutter".to_string(),
                    assigned_building: None,
                    level: 1,
                    efficiency_multiplier: 1.0,
                    xp: 0.0,
                    xp_to_next_level: 100.0,
                },
                Worker {
                    name: "石匠".to_string(),
                    skills: "masonry".to_string(),
                    background: "擅长采石的工人".to_string(),
                    preferences: "Stone Quarry".to_string(),
                    assigned_building: None,
                    level: 1,
                    efficiency_multiplier: 1.0,
                    xp: 0.0,
                    xp_to_next_level: 100.0,
                },
                Worker {
                    name: "工厂工人".to_string(),
                    skills: "factory".to_string(),
                    background: "擅长工厂生产的工人".to_string(),
                    preferences: "Coin Factory".to_string(),
                    assigned_building: None,
                    level: 1,
                    efficiency_multiplier: 1.0,
                    xp: 0.0,
                    xp_to_next_level: 100.0,
                },
                Worker {
                    name: "高级工匠".to_string(),
                    skills: "crafting".to_string(),
                    background: "擅长高级制作的工匠".to_string(),
                    preferences: "Mason Workshop".to_string(),
                    assigned_building: None,
                    level: 1,
                    efficiency_multiplier: 1.0,
                    xp: 0.0,
                    xp_to_next_level: 100.0,
                },
            ],
            unlocked_features: vec![
                UnlockedFeature {
                    id: "workers_tab".to_string(),
                    name: "工人面板".to_string(),
                    feature_type: "area".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_clicks".to_string(),
                    requirement_value: 50.0,
                },
                UnlockedFeature {
                    id: "advanced_buildings".to_string(),
                    name: "高级建筑".to_string(),
                    feature_type: "building".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "buildings_owned".to_string(),
                    requirement_value: 20.0,
                },
                UnlockedFeature {
                    id: "prestige_system".to_string(),
                    name: "转生系统".to_string(),
                    feature_type: "mechanic".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_coins".to_string(),
                    requirement_value: 10000.0,
                },
                UnlockedFeature {
                    id: "statistics_panel".to_string(),
                    name: "统计面板".to_string(),
                    feature_type: "area".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_clicks".to_string(),
                    requirement_value: 10.0,
                },
                UnlockedFeature {
                    id: "achievements_panel".to_string(),
                    name: "成就面板".to_string(),
                    feature_type: "area".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_clicks".to_string(),
                    requirement_value: 25.0,
                },
            ],
        }
    }

    #[wasm_bindgen]
    pub fn click_action(&mut self) {
        let mut state = self.state.borrow_mut();
        let earned = state.coins_per_click;
        state.coins += earned;
        state.total_clicks += 1;

        let mut stats = self.statistics.borrow_mut();
        stats.total_clicks += 1;
        stats.total_coins_earned += earned;
        drop(stats);
        drop(state);

        self.check_achievement("click_novice_10");
        self.check_achievement("click_master_100");
        self.check_achievement("click_legend_1000");

        self.update_resources_only();
    }

    #[wasm_bindgen]
    pub fn buy_upgrade(&mut self, index: usize) -> bool {
        if index >= self.upgrades.len() {
            return false;
        }

        let upgrade_cost = self.upgrades[index].cost;
        let state = self.state.borrow();

        if state.coins + 1e-10 >= upgrade_cost {
            drop(state);
            let mut state = self.state.borrow_mut();
            state.coins -= upgrade_cost;

            if self.upgrades[index].name == "Better Click" {
                state.coins_per_click += self.upgrades[index].production_increase;
            } else if self.upgrades[index].name.starts_with("Autoclicker") {
                state.autoclick_count += 1;
            }

            self.upgrades[index].owned += 1;
            self.upgrades[index].cost = self.upgrades[index].cost * 1.5;
            drop(state);

            let mut stats = self.statistics.borrow_mut();
            stats.upgrades_purchased += 1;
            drop(stats);

            self.update_production();
            self.update_resources_only();
            self.update_upgrades_only();
            true
        } else {
            drop(state);
            self.update_resources_only();
            false
        }
    }

    #[wasm_bindgen]
    pub fn buy_building(&mut self, index: usize) -> bool {
        if index >= self.buildings.len() {
            return false;
        }

        let building_cost = self.buildings[index].cost;
        let state = self.state.borrow();

        if state.coins + 1e-10 >= building_cost {
            drop(state);
            let mut state = self.state.borrow_mut();
            state.coins -= building_cost;
            self.buildings[index].count += 1;
            self.buildings[index].cost *= 1.15;
            drop(state);

            let mut stats = self.statistics.borrow_mut();
            stats.buildings_purchased += 1;
            drop(stats);

            self.check_achievement("first_building");
            self.check_achievement("building_enthusiast_10");
            self.check_achievement("building_tycoon_50");

            self.update_production();
            self.update_resources_only();
            self.update_buildings_only();
            true
        } else {
            drop(state);
            self.update_resources_only();
            false
        }
    }

    #[wasm_bindgen]
    pub fn craft_resource(&mut self, recipe_id: &str) -> bool {
        let recipe = match self.crafting_recipes.iter().find(|r| r.id == recipe_id) {
            Some(r) => r.clone(),
            None => return false,
        };

        let mut state = self.state.borrow_mut();
        let input_amount = match recipe.input_resource.as_str() {
            "coins" => state.coins,
            "wood" => state.wood,
            "stone" => state.stone,
            _ => return false,
        };

        if input_amount + 1e-10 >= recipe.input_amount {
            match recipe.input_resource.as_str() {
                "coins" => state.coins -= recipe.input_amount,
                "wood" => state.wood -= recipe.input_amount,
                "stone" => state.stone -= recipe.input_amount,
                _ => return false,
            }

            match recipe.output_resource.as_str() {
                "coins" => state.coins += recipe.output_amount,
                "wood" => state.wood += recipe.output_amount,
                "stone" => state.stone += recipe.output_amount,
                _ => return false,
            }

            drop(state);

            let mut stats = self.statistics.borrow_mut();
            stats.total_resources_crafted += 1;
            drop(stats);

            self.check_achievement("first_craft");
            self.check_achievement("craft_master_100");

            self.update_resources_only();
            true
        } else {
            drop(state);
            self.update_resources_only();
            false
        }
    }

    #[wasm_bindgen]
    pub fn get_coins(&self) -> f64 {
        self.state.borrow().coins
    }

    #[wasm_bindgen]
    pub fn get_wood(&self) -> f64 {
        self.state.borrow().wood
    }

    #[wasm_bindgen]
    pub fn get_stone(&self) -> f64 {
        self.state.borrow().stone
    }

    #[wasm_bindgen]
    pub fn get_coins_per_second(&self) -> f64 {
        self.state.borrow().coins_per_second
    }

    #[wasm_bindgen]
    pub fn get_wood_per_second(&self) -> f64 {
        self.state.borrow().wood_per_second
    }

    #[wasm_bindgen]
    pub fn get_stone_per_second(&self) -> f64 {
        self.state.borrow().stone_per_second
    }

    #[wasm_bindgen]
    pub fn get_coins_per_click(&self) -> f64 {
        self.state.borrow().coins_per_click
    }

    #[wasm_bindgen]
    pub fn get_statistics(&self) -> Statistics {
        self.statistics.borrow().clone()
    }

    #[wasm_bindgen]
    pub fn assign_worker(&mut self, worker_index: usize, building_id: &str) -> bool {
        if worker_index >= self.workers.len() {
            return false;
        }

        let building_exists = self.buildings.iter().any(|b| b.name == building_id);
        if !building_exists {
            return false;
        }

        self.workers[worker_index].assigned_building = Some(building_id.to_string());

        let preference = &self.workers[worker_index].preferences;

        let mut efficiency = 1.0;

        if preference == building_id {
            efficiency += 0.2;
        }

        efficiency += (self.workers[worker_index].level as f64) * 0.05;

        self.workers[worker_index].efficiency_multiplier = efficiency;

        self.update_production();

        true
    }

    #[wasm_bindgen]
    pub fn get_worker_production_bonus(&self, worker_index: usize) -> f64 {
        if worker_index >= self.workers.len() {
            return 0.0;
        }

        let worker = &self.workers[worker_index];
        if worker.assigned_building.is_none() {
            return 0.0;
        }

        worker.efficiency_multiplier - 1.0
    }

    #[wasm_bindgen]
    pub fn get_workers(&self) -> js_sys::Array {
        let workers_array = js_sys::Array::new();

        for worker in self.workers.iter() {
            let worker_obj = js_sys::Object::new();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("name"),
                &JsValue::from_str(&worker.name),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("skills"),
                &JsValue::from_str(&worker.skills),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("background"),
                &JsValue::from_str(&worker.background),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("preferences"),
                &JsValue::from_str(&worker.preferences),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("assignedBuilding"),
                &match &worker.assigned_building {
                    Some(building) => JsValue::from_str(building),
                    None => JsValue::NULL,
                },
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("level"),
                &JsValue::from_f64(worker.level as f64),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("efficiencyMultiplier"),
                &JsValue::from_f64(worker.efficiency_multiplier),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("xp"),
                &JsValue::from_f64(worker.xp),
            )
            .unwrap();

            js_sys::Reflect::set(
                &worker_obj,
                &JsValue::from_str("xpToNextLevel"),
                &JsValue::from_f64(worker.xp_to_next_level),
            )
            .unwrap();

            workers_array.push(&worker_obj);
        }

        workers_array
    }

    #[wasm_bindgen]
    pub fn assign_worker_to_building(&mut self, worker_index: usize, building_id: &str) -> bool {
        if worker_index >= self.workers.len() {
            return false;
        }

        let building_exists = self.buildings.iter().any(|b| b.name == building_id);
        if !building_exists {
            return false;
        }

        self.workers[worker_index].assigned_building = Some(building_id.to_string());

        let _skill = &self.workers[worker_index].skills;
        let preference = &self.workers[worker_index].preferences;

        let mut efficiency = 1.0;

        if preference == building_id {
            efficiency += 0.2;
        }

        efficiency += (self.workers[worker_index].level as f64) * 0.05;

        self.workers[worker_index].efficiency_multiplier = efficiency;

        self.update_production();

        true
    }

    fn get_worker_bonus_for_building(&self, building_name: &str) -> f64 {
        let mut total_bonus = 1.0;

        for worker in &self.workers {
            if let Some(ref assigned) = worker.assigned_building {
                if assigned == building_name {
                    total_bonus += worker.efficiency_multiplier - 1.0;
                }
            }
        }

        total_bonus
    }

    fn update_production(&mut self) {
        let mut total_cps = 0.0;
        let mut total_wps = 0.0;
        let mut total_sps = 0.0;

        for building in &self.buildings {
            let base_production = building.production_rate * building.count as f64;
            let worker_bonus = self.get_worker_bonus_for_building(&building.name);
            let boosted_production = base_production * worker_bonus;

            match building.name.as_str() {
                "Coin Mine" | "Coin Factory" | "Coin Corporation" => {
                    total_cps += boosted_production;
                }
                "Woodcutter" | "Lumber Mill" | "Forest Workshop" => {
                    total_wps += boosted_production;
                }
                "Stone Quarry" | "Rock Crusher" | "Mason Workshop" => {
                    total_sps += boosted_production;
                }
                _ => {}
            }
        }

        for upgrade in &self.upgrades {
            if upgrade.name == "Lumberjack Efficiency" {
                total_wps += upgrade.production_increase * upgrade.owned as f64;
            }
            if upgrade.name == "Stone Mason Skill" {
                total_sps += upgrade.production_increase * upgrade.owned as f64;
            }
        }

        total_cps = if total_cps.is_finite() && total_cps >= 0.0 {
            total_cps
        } else {
            0.0
        };
        total_wps = if total_wps.is_finite() && total_wps >= 0.0 {
            total_wps
        } else {
            0.0
        };
        total_sps = if total_sps.is_finite() && total_sps >= 0.0 {
            total_sps
        } else {
            0.0
        };

        let mut state = self.state.borrow_mut();
        state.coins_per_second = total_cps;
        state.wood_per_second = total_wps;
        state.stone_per_second = total_sps;
    }

    fn grant_worker_xp(&mut self, elapsed: f64) {
        for i in 0..self.workers.len() {
            if self.workers[i].assigned_building.is_some() {
                let xp_gain = 10.0 * elapsed;
                self.workers[i].xp += xp_gain;

                while self.workers[i].xp >= self.workers[i].xp_to_next_level {
                    self.workers[i].xp -= self.workers[i].xp_to_next_level;
                    self.workers[i].level += 1;
                    self.workers[i].xp_to_next_level =
                        (self.workers[i].xp_to_next_level * 1.5).ceil();

                    let preference = &self.workers[i].preferences;
                    let assigned = self.workers[i].assigned_building.as_ref().unwrap();
                    let mut efficiency = 1.0;

                    if preference == assigned {
                        efficiency += 0.2;
                    }
                    efficiency += (self.workers[i].level as f64) * 0.05;
                    self.workers[i].efficiency_multiplier = efficiency;
                }
            }
        }

        self.update_production();
    }

    #[wasm_bindgen]
    pub fn game_loop(&mut self) {
        let now = Date::now();

        let (new_coins, new_wood, new_stone, new_last_update_time, elapsed) = {
            let state = self.state.borrow();
            let elapsed = (now - state.last_update_time) / 1000.0;

            if elapsed > 0.0 && elapsed < 3600.0 {
                let mut new_coins = state.coins + state.coins_per_second * elapsed;
                let new_wood = state.wood + state.wood_per_second * elapsed;
                let new_stone = state.stone + state.stone_per_second * elapsed;

                new_coins = new_coins.max(0.0);

                let autoclicks_per_second = 10.0;
                let clamped_autoclick_effect = state.coins_per_click
                    * state.autoclick_count as f64
                    * autoclicks_per_second
                    * elapsed;
                if state.autoclick_count > 0 && clamped_autoclick_effect.is_finite() {
                    new_coins += clamped_autoclick_effect;
                }

                (new_coins, new_wood, new_stone, now, elapsed)
            } else {
                (
                    state.coins,
                    state.wood,
                    state.stone,
                    state.last_update_time,
                    0.0,
                )
            }
        };

        {
            let mut state = self.state.borrow_mut();
            state.coins = if new_coins.is_finite() {
                new_coins
            } else {
                state.coins
            };
            state.wood = if new_wood.is_finite() {
                new_wood
            } else {
                state.wood
            };
            state.stone = if new_stone.is_finite() {
                new_stone
            } else {
                state.stone
            };
            state.last_update_time = new_last_update_time;
        }

        if elapsed > 0.0 {
            let mut stats = self.statistics.borrow_mut();
            stats.play_time_seconds += elapsed;
            drop(stats);

            // Grant XP to assigned workers based on production
            self.grant_worker_xp(elapsed);
        }

        self.check_achievement("first_coins_100");
        self.check_achievement("wood_collector_1000");
        self.check_achievement("stone_hoarder_5000");
        self.check_achievement("craft_master_100");

        self.update_resources_only();
    }

    #[wasm_bindgen]
    pub fn update_resources_only(&self) {
        let window = match web_sys::window() {
            Some(win) => win,
            None => return,
        };
        let global_obj = window.as_ref();

        let coins_val = self.get_coins();
        let wood_val = self.get_wood();
        let stone_val = self.get_stone();
        let coins_per_sec = self.get_coins_per_second();
        let wood_per_sec = self.get_wood_per_second();
        let stone_per_sec = self.get_stone_per_second();
        let coins_per_click = self.get_coins_per_click();

        let update_resource_display_result =
            js_sys::Reflect::get(global_obj, &"updateResourceDisplay".into());
        if let Ok(update_func) = update_resource_display_result {
            let update_resource_display: js_sys::Function = update_func.into();
            let _ = update_resource_display.call7(
                &JsValue::NULL,
                &coins_val.into(),
                &wood_val.into(),
                &stone_val.into(),
                &coins_per_sec.into(),
                &wood_per_sec.into(),
                &stone_per_sec.into(),
                &coins_per_click.into(),
            );
        }
    }

    #[wasm_bindgen]
    pub fn update_upgrades_only(&self) {
        let window = match web_sys::window() {
            Some(win) => win,
            None => {
                web_sys::console::log_1(&"update_upgrades_only: window is None".into());
                return;
            }
        };
        let global_obj = window.as_ref();

        web_sys::console::log_1(
            &format!(
                "update_upgrades_only: upgrades count={}",
                self.upgrades.len()
            )
            .into(),
        );
        for (i, upgrade) in self.upgrades.iter().enumerate() {
            web_sys::console::log_1(
                &format!(
                    "  upgrade[{}]: name={}, cost={}",
                    i, upgrade.name, upgrade.cost
                )
                .into(),
            );
        }

        let upgrades_serialized = match serde_wasm_bindgen::to_value(&self.upgrades) {
            Ok(val) => {
                web_sys::console::log_1(&"update_upgrades_only: serialization OK".into());
                val
            }
            Err(e) => {
                web_sys::console::log_1(
                    &format!("update_upgrades_only: serialization ERROR: {:?}", e).into(),
                );
                return;
            }
        };

        let update_upgrades_result =
            js_sys::Reflect::get(global_obj, &"updateUpgradeButtons".into());
        match update_upgrades_result {
            Ok(update_func_val) => {
                web_sys::console::log_1(
                    &"update_upgrades_only: got updateUpgradeButtons function".into(),
                );
                let update_func: js_sys::Function = update_func_val.into();
                let call_result = update_func.call1(&JsValue::NULL, &upgrades_serialized);
                match call_result {
                    Ok(_) => web_sys::console::log_1(&"update_upgrades_only: call SUCCESS".into()),
                    Err(e) => web_sys::console::log_1(
                        &format!("update_upgrades_only: call ERROR: {:?}", e).into(),
                    ),
                }
            }
            Err(e) => {
                web_sys::console::log_1(
                    &format!("update_upgrades_only: get function ERROR: {:?}", e).into(),
                );
            }
        }
    }

    #[wasm_bindgen]
    pub fn update_buildings_only(&self) {
        let window = match web_sys::window() {
            Some(win) => win,
            None => return,
        };
        let global_obj = window.as_ref();

        let buildings_serialized = match serde_wasm_bindgen::to_value(&self.buildings) {
            Ok(val) => val,
            Err(_) => return,
        };
        let update_buildings_result =
            js_sys::Reflect::get(global_obj, &"updateBuildingDisplay".into());
        if let Ok(update_func) = update_buildings_result {
            let update_buildings: js_sys::Function = update_func.into();
            let _ = update_buildings.call1(&JsValue::NULL, &buildings_serialized);
        }
    }

    #[wasm_bindgen]
    pub fn update_ui(&self) {
        let window = match web_sys::window() {
            Some(win) => win,
            None => return,
        };
        let global_obj = window.as_ref();

        let coins_val = self.get_coins();
        let wood_val = self.get_wood();
        let stone_val = self.get_stone();
        let coins_per_sec = self.get_coins_per_second();
        let wood_per_sec = self.get_wood_per_second();
        let stone_per_sec = self.get_stone_per_second();
        let coins_per_click = self.get_coins_per_click();

        let update_resource_display_result =
            js_sys::Reflect::get(global_obj, &"updateResourceDisplay".into());
        if let Ok(update_func) = update_resource_display_result {
            let update_resource_display: js_sys::Function = update_func.into();
            let _ = update_resource_display.call7(
                &JsValue::NULL,
                &coins_val.into(),
                &wood_val.into(),
                &stone_val.into(),
                &coins_per_sec.into(),
                &wood_per_sec.into(),
                &stone_per_sec.into(),
                &coins_per_click.into(),
            );
        }

        let upgrades_serialized = match serde_wasm_bindgen::to_value(&self.upgrades) {
            Ok(val) => val,
            Err(_) => return,
        };
        let update_upgrades_result =
            js_sys::Reflect::get(global_obj, &"updateUpgradeButtons".into());
        if let Ok(update_func) = update_upgrades_result {
            let update_upgrades: js_sys::Function = update_func.into();
            let _ = update_upgrades.call1(&JsValue::NULL, &upgrades_serialized);
        }

        let buildings_serialized = match serde_wasm_bindgen::to_value(&self.buildings) {
            Ok(val) => val,
            Err(_) => return,
        };
        let update_buildings_result =
            js_sys::Reflect::get(global_obj, &"updateBuildingDisplay".into());
        if let Ok(update_func) = update_buildings_result {
            let update_buildings: js_sys::Function = update_func.into();
            let _ = update_buildings.call1(&JsValue::NULL, &buildings_serialized);
        }
    }

    #[wasm_bindgen]
    pub fn get_crafting_recipes(&self) -> JsValue {
        match serde_wasm_bindgen::to_value(&self.crafting_recipes) {
            Ok(val) => val,
            Err(_) => JsValue::NULL,
        }
    }

    #[wasm_bindgen]
    pub fn unlock_feature(&mut self, feature_id: &str) -> bool {
        if !self.check_unlock(feature_id) {
            return false;
        }

        let feature = match self
            .unlocked_features
            .iter_mut()
            .find(|f| f.id == feature_id)
        {
            Some(f) => f,
            None => return false,
        };

        if feature.unlocked {
            return true;
        }

        feature.unlocked = true;
        feature.unlock_timestamp = Some(Date::now());
        true
    }

    #[wasm_bindgen]
    pub fn get_unlocks(&self) -> JsValue {
        match serde_wasm_bindgen::to_value(&self.unlocked_features) {
            Ok(val) => val,
            Err(_) => JsValue::NULL,
        }
    }

    #[wasm_bindgen]
    pub fn reset_game(&mut self) {
        // Reset Statistics to zeros
        {
            let mut stats = self.statistics.borrow_mut();
            stats.total_clicks = 0;
            stats.total_coins_earned = 0.0;
            stats.total_wood_earned = 0.0;
            stats.total_stone_earned = 0.0;
            stats.total_resources_crafted = 0;
            stats.achievements_unlocked_count = 0;
            stats.play_time_seconds = 0.0;
            stats.buildings_purchased = 0;
            stats.upgrades_purchased = 0;
        }

        // Reset Achievements (unlocked=false, progress=0)
        for achievement in self.achievements.iter_mut() {
            achievement.unlocked = false;
            achievement.unlock_timestamp = None;
            achievement.progress = 0.0;
        }

        // Reset Crafting progress (all recipes unlocked=true as in new())
        for recipe in self.crafting_recipes.iter_mut() {
            recipe.unlocked = true;
        }

        // Reset Unlocks (unlocked=false)
        for feature in self.unlocked_features.iter_mut() {
            feature.unlocked = false;
            feature.unlock_timestamp = None;
        }

        // Reset Workers (level=1, assigned_building=None, xp=0, etc.)
        for worker in self.workers.iter_mut() {
            worker.assigned_building = None;
            worker.level = 1;
            worker.efficiency_multiplier = 1.0;
            worker.xp = 0.0;
            worker.xp_to_next_level = 100.0;
        }

        // Reset game state (coins, wood, stone, etc.)
        {
            let mut state = self.state.borrow_mut();
            state.coins = 0.0;
            state.wood = 0.0;
            state.stone = 0.0;
            state.coins_per_click = 1.0;
            state.coins_per_second = 0.0;
            state.wood_per_second = 0.0;
            state.stone_per_second = 0.0;
            state.autoclick_count = 0;
            state.total_clicks = 0;
            state.last_update_time = Date::now();
        }

        // Reset Upgrades (owned=0, cost=initial, unlocked=true)
        for (i, upgrade) in self.upgrades.iter_mut().enumerate() {
            upgrade.owned = 0;
            upgrade.unlocked = true;
            // Reset costs to initial values
            match i {
                0 => upgrade.cost = 10.0, // Better Click
                1 => upgrade.cost = 50.0, // Autoclicker Lv1
                2 => upgrade.cost = 20.0, // Lumberjack Efficiency
                3 => upgrade.cost = 25.0, // Stone Mason Skill
                _ => {}
            }
        }

        // Reset Buildings (count=0, cost=initial)
        for (i, building) in self.buildings.iter_mut().enumerate() {
            building.count = 0;
            // Reset costs to initial values
            match i {
                0 => building.cost = 15.0,  // Coin Mine
                1 => building.cost = 100.0, // Coin Factory
                2 => building.cost = 500.0, // Coin Corporation
                3 => building.cost = 20.0,  // Woodcutter
                4 => building.cost = 80.0,  // Lumber Mill
                5 => building.cost = 400.0, // Forest Workshop
                6 => building.cost = 25.0,  // Stone Quarry
                7 => building.cost = 90.0,  // Rock Crusher
                8 => building.cost = 450.0, // Mason Workshop
                _ => {}
            }
        }
    }
}

#[wasm_bindgen]
impl IdleGame {
    #[wasm_bindgen(js_name = get_achievements)]
    pub fn get_achievements_js(&self) -> JsValue {
        match serde_wasm_bindgen::to_value(&self.achievements) {
            Ok(val) => val,
            Err(_) => JsValue::NULL,
        }
    }

    #[wasm_bindgen]
    pub fn check_achievement(&mut self, achievement_id: &str) -> bool {
        let state = self.state.borrow();
        let stats = self.statistics.borrow();

        let achievement = match self
            .achievements
            .iter_mut()
            .find(|a| a.id == achievement_id)
        {
            Some(a) => a,
            None => return false,
        };

        if achievement.unlocked {
            return true;
        }

        let current_value = match achievement.category.as_str() {
            "clicks" => state.total_clicks as f64,
            "resources" => {
                if achievement.id == "first_coins_100" {
                    state.coins
                } else if achievement.id == "wood_collector_1000" {
                    state.wood
                } else if achievement.id == "stone_hoarder_5000" {
                    state.stone
                } else {
                    0.0
                }
            }
            "buildings" => stats.buildings_purchased as f64,
            "crafting" => stats.total_resources_crafted as f64,
            "unlocks" => stats.achievements_unlocked_count as f64,
            _ => 0.0,
        };

        achievement.progress = current_value;

        if achievement.progress >= achievement.requirement {
            achievement.unlocked = true;
            achievement.unlock_timestamp = Some(Date::now());

            let mut stats_mut = self.statistics.borrow_mut();
            stats_mut.achievements_unlocked_count += 1;
            drop(stats_mut);

            drop(stats);
            drop(state);

            self.check_achievement("first_unlock");
            self.check_achievement("progress_master_5");

            return true;
        }

        drop(stats);
        drop(state);
        false
    }

    pub fn check_all_achievements(&mut self) {
        let achievement_ids: Vec<String> = self.achievements.iter().map(|a| a.id.clone()).collect();
        for id in achievement_ids {
            self.check_achievement(&id);
        }
    }

    pub fn check_unlock(&mut self, feature_id: &str) -> bool {
        let state = self.state.borrow();
        let stats = self.statistics.borrow();

        let feature = match self
            .unlocked_features
            .iter_mut()
            .find(|f| f.id == feature_id)
        {
            Some(f) => f,
            None => return false,
        };

        if feature.unlocked {
            return true;
        }

        let current_value = match feature.requirement_type.as_str() {
            "total_clicks" => state.total_clicks as f64,
            "total_coins" => state.coins,
            "buildings_owned" => stats.buildings_purchased as f64,
            _ => 0.0,
        };

        drop(stats);
        drop(state);

        current_value >= feature.requirement_value
    }
}

#[wasm_bindgen]
pub fn init_game() -> IdleGame {
    IdleGame::new()
}

#[cfg(test)]
pub struct TestGameState {
    coins: f64,
    wood: f64,
    stone: f64,
    coins_per_click: f64,
    coins_per_second: f64,
    wood_per_second: f64,
    stone_per_second: f64,
    autoclick_count: u32,
    total_clicks: u32,
    upgrades: Vec<Upgrade>,
    buildings: Vec<Building>,
    achievements: Vec<Achievement>,
    crafting_recipes: Vec<CraftingRecipe>,
    unlocked_features: Vec<UnlockedFeature>,
    statistics: Statistics,
    workers: Vec<Worker>,
}

#[cfg(test)]
impl TestGameState {
    pub fn new() -> Self {
        TestGameState {
            coins: 0.0,
            wood: 0.0,
            stone: 0.0,
            coins_per_click: 1.0,
            coins_per_second: 0.0,
            wood_per_second: 0.0,
            stone_per_second: 0.0,
            autoclick_count: 0,
            total_clicks: 0,
            upgrades: vec![
                Upgrade {
                    name: "Better Click".to_string(),
                    cost: 10.0,
                    production_increase: 1.0,
                    owned: 0,
                    unlocked: true,
                },
                Upgrade {
                    name: "Autoclicker Lv1".to_string(),
                    cost: 50.0,
                    production_increase: 1.0,
                    owned: 0,
                    unlocked: true,
                },
                Upgrade {
                    name: "Lumberjack Efficiency".to_string(),
                    cost: 20.0,
                    production_increase: 0.2,
                    owned: 0,
                    unlocked: true,
                },
                Upgrade {
                    name: "Stone Mason Skill".to_string(),
                    cost: 25.0,
                    production_increase: 0.3,
                    owned: 0,
                    unlocked: true,
                },
            ],
            buildings: vec![
                Building {
                    name: "Coin Mine".to_string(),
                    cost: 15.0,
                    production_rate: 0.1,
                    count: 0,
                },
                Building {
                    name: "Coin Factory".to_string(),
                    cost: 100.0,
                    production_rate: 1.0,
                    count: 0,
                },
                Building {
                    name: "Coin Corporation".to_string(),
                    cost: 500.0,
                    production_rate: 5.0,
                    count: 0,
                },
                Building {
                    name: "Woodcutter".to_string(),
                    cost: 20.0,
                    production_rate: 0.2,
                    count: 0,
                },
                Building {
                    name: "Lumber Mill".to_string(),
                    cost: 80.0,
                    production_rate: 1.5,
                    count: 0,
                },
                Building {
                    name: "Forest Workshop".to_string(),
                    cost: 400.0,
                    production_rate: 4.0,
                    count: 0,
                },
                Building {
                    name: "Stone Quarry".to_string(),
                    cost: 25.0,
                    production_rate: 0.15,
                    count: 0,
                },
                Building {
                    name: "Rock Crusher".to_string(),
                    cost: 120.0,
                    production_rate: 1.2,
                    count: 0,
                },
                Building {
                    name: "Mason Workshop".to_string(),
                    cost: 450.0,
                    production_rate: 4.5,
                    count: 0,
                },
            ],
            statistics: Statistics {
                total_clicks: 0,
                total_coins_earned: 0.0,
                total_wood_earned: 0.0,
                total_stone_earned: 0.0,
                total_resources_crafted: 0,
                achievements_unlocked_count: 0,
                play_time_seconds: 0.0,
                buildings_purchased: 0,
                upgrades_purchased: 0,
            },
            achievements: vec![
                Achievement {
                    id: "click_novice_10".to_string(),
                    name: "点击新手".to_string(),
                    description: "点击 10 次".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 10.0,
                    category: "clicks".to_string(),
                },
                Achievement {
                    id: "click_master_100".to_string(),
                    name: "点击大师".to_string(),
                    description: "点击 100 次".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 100.0,
                    category: "clicks".to_string(),
                },
                Achievement {
                    id: "click_legend_1000".to_string(),
                    name: "点击传奇".to_string(),
                    description: "点击 1000 次".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 1000.0,
                    category: "clicks".to_string(),
                },
                Achievement {
                    id: "first_coins_100".to_string(),
                    name: "第一桶金".to_string(),
                    description: "获得 100 金币".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 100.0,
                    category: "resources".to_string(),
                },
                Achievement {
                    id: "wood_collector_1000".to_string(),
                    name: "木材收集者".to_string(),
                    description: "获得 1000 木头".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 1000.0,
                    category: "resources".to_string(),
                },
                Achievement {
                    id: "stone_hoarder_5000".to_string(),
                    name: "石头囤积者".to_string(),
                    description: "获得 5000 石头".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 5000.0,
                    category: "resources".to_string(),
                },
                Achievement {
                    id: "first_building".to_string(),
                    name: "第一座建筑".to_string(),
                    description: "购买第一座建筑".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 1.0,
                    category: "buildings".to_string(),
                },
                Achievement {
                    id: "building_enthusiast_10".to_string(),
                    name: "建筑爱好者".to_string(),
                    description: "购买 10 座建筑".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 10.0,
                    category: "buildings".to_string(),
                },
                Achievement {
                    id: "building_tycoon_50".to_string(),
                    name: "建筑大亨".to_string(),
                    description: "购买 50 座建筑".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 50.0,
                    category: "buildings".to_string(),
                },
                Achievement {
                    id: "first_craft".to_string(),
                    name: "第一次制作".to_string(),
                    description: "制作第一个物品".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 1.0,
                    category: "crafting".to_string(),
                },
                Achievement {
                    id: "craft_master_100".to_string(),
                    name: "制作大师".to_string(),
                    description: "制作 100 个物品".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 100.0,
                    category: "crafting".to_string(),
                },
                Achievement {
                    id: "first_unlock".to_string(),
                    name: "首次解锁".to_string(),
                    description: "解锁第一个成就".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 1.0,
                    category: "unlocks".to_string(),
                },
                Achievement {
                    id: "progress_master_5".to_string(),
                    name: "进度大师".to_string(),
                    description: "解锁 5 个成就".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    progress: 0.0,
                    requirement: 5.0,
                    category: "unlocks".to_string(),
                },
            ],
            crafting_recipes: vec![
                CraftingRecipe {
                    id: "coins_to_wood".to_string(),
                    name: "金币换木材".to_string(),
                    input_resource: "coins".to_string(),
                    input_amount: 100.0,
                    output_resource: "wood".to_string(),
                    output_amount: 10.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "wood_to_coins".to_string(),
                    name: "木材换金币".to_string(),
                    input_resource: "wood".to_string(),
                    input_amount: 10.0,
                    output_resource: "coins".to_string(),
                    output_amount: 100.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "coins_to_stone".to_string(),
                    name: "金币换石头".to_string(),
                    input_resource: "coins".to_string(),
                    input_amount: 100.0,
                    output_resource: "stone".to_string(),
                    output_amount: 1.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "stone_to_coins".to_string(),
                    name: "石头换金币".to_string(),
                    input_resource: "stone".to_string(),
                    input_amount: 1.0,
                    output_resource: "coins".to_string(),
                    output_amount: 100.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "wood_to_stone".to_string(),
                    name: "木材换石头".to_string(),
                    input_resource: "wood".to_string(),
                    input_amount: 10.0,
                    output_resource: "stone".to_string(),
                    output_amount: 1.0,
                    unlocked: true,
                },
                CraftingRecipe {
                    id: "stone_to_wood".to_string(),
                    name: "石头换木材".to_string(),
                    input_resource: "stone".to_string(),
                    input_amount: 1.0,
                    output_resource: "wood".to_string(),
                    output_amount: 10.0,
                    unlocked: true,
                },
            ],
            unlocked_features: vec![
                UnlockedFeature {
                    id: "workers_tab".to_string(),
                    name: "工人面板".to_string(),
                    feature_type: "area".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_clicks".to_string(),
                    requirement_value: 50.0,
                },
                UnlockedFeature {
                    id: "advanced_buildings".to_string(),
                    name: "高级建筑".to_string(),
                    feature_type: "building".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "buildings_owned".to_string(),
                    requirement_value: 20.0,
                },
                UnlockedFeature {
                    id: "prestige_system".to_string(),
                    name: "转生系统".to_string(),
                    feature_type: "mechanic".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_coins".to_string(),
                    requirement_value: 10000.0,
                },
                UnlockedFeature {
                    id: "statistics_panel".to_string(),
                    name: "统计面板".to_string(),
                    feature_type: "area".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_clicks".to_string(),
                    requirement_value: 10.0,
                },
                UnlockedFeature {
                    id: "achievements_panel".to_string(),
                    name: "成就面板".to_string(),
                    feature_type: "area".to_string(),
                    unlocked: false,
                    unlock_timestamp: None,
                    requirement_type: "total_clicks".to_string(),
                    requirement_value: 25.0,
                },
            ],
            workers: vec![
                Worker {
                    name: "矿工".to_string(),
                    skills: "mining".to_string(),
                    background: "擅长挖矿的工人".to_string(),
                    preferences: "Coin Mine".to_string(),
                    assigned_building: None,
                    level: 1,
                    efficiency_multiplier: 1.0,
                    xp: 0.0,
                    xp_to_next_level: 100.0,
                },
                Worker {
                    name: "伐木工".to_string(),
                    skills: "logging".to_string(),
                    background: "擅长伐木的工人".to_string(),
                    preferences: "Woodcutter".to_string(),
                    assigned_building: None,
                    level: 1,
                    efficiency_multiplier: 1.0,
                    xp: 0.0,
                    xp_to_next_level: 100.0,
                },
                Worker {
                    name: "石匠".to_string(),
                    skills: "masonry".to_string(),
                    background: "擅长采石的工人".to_string(),
                    preferences: "Stone Quarry".to_string(),
                    assigned_building: None,
                    level: 1,
                    efficiency_multiplier: 1.0,
                    xp: 0.0,
                    xp_to_next_level: 100.0,
                },
            ],
        }
    }

    #[cfg(test)]
    pub fn get_statistics(&self) -> Statistics {
        self.statistics.clone()
    }

    #[cfg(test)]
    pub fn get_achievements(&self) -> Vec<Achievement> {
        self.achievements.clone()
    }

    #[cfg(test)]
    pub fn get_crafting_recipes(&self) -> Vec<CraftingRecipe> {
        self.crafting_recipes.clone()
    }

    #[cfg(test)]
    pub fn get_unlocks(&self) -> Vec<UnlockedFeature> {
        self.unlocked_features.clone()
    }

    #[cfg(test)]
    pub(crate) fn get_workers(&self) -> Vec<Worker> {
        self.workers.clone()
    }

    #[cfg(test)]
    pub fn assign_worker(&mut self, worker_index: usize, building_id: &str) -> bool {
        if worker_index >= self.workers.len() {
            return false;
        }

        let building_exists = self.buildings.iter().any(|b| b.name == building_id);
        if !building_exists {
            return false;
        }

        self.workers[worker_index].assigned_building = Some(building_id.to_string());

        let preference = &self.workers[worker_index].preferences;

        let mut efficiency = 1.0;

        if preference == building_id {
            efficiency += 0.2;
        }

        efficiency += (self.workers[worker_index].level as f64) * 0.05;

        self.workers[worker_index].efficiency_multiplier = efficiency;

        true
    }

    #[cfg(test)]
    pub fn check_unlock(&mut self, feature_id: &str) -> bool {
        let feature = match self
            .unlocked_features
            .iter_mut()
            .find(|f| f.id == feature_id)
        {
            Some(f) => f,
            None => return false,
        };

        if feature.unlocked {
            return true;
        }

        let current_value = match feature.requirement_type.as_str() {
            "total_clicks" => self.total_clicks as f64,
            "total_coins" => self.coins,
            "buildings_owned" => self.statistics.buildings_purchased as f64,
            _ => 0.0,
        };

        current_value >= feature.requirement_value
    }

    #[cfg(test)]
    pub fn unlock_feature(&mut self, feature_id: &str) -> bool {
        if !self.check_unlock(feature_id) {
            return false;
        }

        let feature = match self
            .unlocked_features
            .iter_mut()
            .find(|f| f.id == feature_id)
        {
            Some(f) => f,
            None => return false,
        };

        if feature.unlocked {
            return true;
        }

        feature.unlocked = true;
        feature.unlock_timestamp = Some(0.0); // Use 0.0 for tests instead of Date::now()
        true
    }

    pub fn craft_resource(&mut self, recipe_id: &str) -> bool {
        let recipe = match self.crafting_recipes.iter().find(|r| r.id == recipe_id) {
            Some(r) => r.clone(),
            None => return false,
        };

        let input_amount = match recipe.input_resource.as_str() {
            "coins" => self.coins,
            "wood" => self.wood,
            "stone" => self.stone,
            _ => return false,
        };

        if input_amount + 1e-10 >= recipe.input_amount {
            match recipe.input_resource.as_str() {
                "coins" => self.coins -= recipe.input_amount,
                "wood" => self.wood -= recipe.input_amount,
                "stone" => self.stone -= recipe.input_amount,
                _ => return false,
            }

            match recipe.output_resource.as_str() {
                "coins" => self.coins += recipe.output_amount,
                "wood" => self.wood += recipe.output_amount,
                "stone" => self.stone += recipe.output_amount,
                _ => return false,
            }

            self.statistics.total_resources_crafted += 1;
            true
        } else {
            false
        }
    }

    pub fn click_action(&mut self) {
        let earned = self.coins_per_click;
        self.coins += earned;
        self.total_clicks += 1;
        self.statistics.total_clicks += 1;
        self.statistics.total_coins_earned += earned;
    }

    pub fn buy_upgrade(&mut self, index: usize) -> bool {
        if index >= self.upgrades.len() {
            return false;
        }

        let upgrade_cost = self.upgrades[index].cost;

        if self.coins >= upgrade_cost {
            self.coins -= upgrade_cost;

            if self.upgrades[index].name == "Better Click" {
                self.coins_per_click += self.upgrades[index].production_increase;
            } else if self.upgrades[index].name.starts_with("Autoclicker") {
                self.autoclick_count += 1;
            }

            self.upgrades[index].owned += 1;
            self.upgrades[index].cost *= 1.5;
            self.statistics.upgrades_purchased += 1;

            self.update_production();
            true
        } else {
            false
        }
    }

    pub fn buy_building(&mut self, index: usize) -> bool {
        if index >= self.buildings.len() {
            return false;
        }

        let building_cost = self.buildings[index].cost;

        if self.coins >= building_cost {
            self.coins -= building_cost;
            self.buildings[index].count += 1;
            self.buildings[index].cost *= 1.15;
            self.statistics.buildings_purchased += 1;
            self.update_production();
            true
        } else {
            false
        }
    }

    fn update_production(&mut self) {
        let mut total_cps = 0.0;
        let mut total_wps = 0.0;
        let mut total_sps = 0.0;

        for building in &self.buildings {
            match building.name.as_str() {
                "Coin Mine" | "Coin Factory" | "Coin Corporation" => {
                    total_cps += building.production_rate * building.count as f64;
                }
                "Woodcutter" | "Lumber Mill" | "Forest Workshop" => {
                    total_wps += building.production_rate * building.count as f64;
                }
                "Stone Quarry" | "Rock Crusher" | "Mason Workshop" => {
                    total_sps += building.production_rate * building.count as f64;
                }
                _ => {} // Unknown building type
            }
        }

        for upgrade in &self.upgrades {
            if upgrade.name == "Lumberjack Efficiency" {
                total_wps += upgrade.production_increase * upgrade.owned as f64;
            }
            if upgrade.name == "Stone Mason Skill" {
                total_sps += upgrade.production_increase * upgrade.owned as f64;
            }
        }

        self.coins_per_second = total_cps;
        self.wood_per_second = total_wps;
        self.stone_per_second = total_sps;
    }

    pub fn get_coins(&self) -> f64 {
        self.coins
    }

    pub fn get_wood(&self) -> f64 {
        self.wood
    }

    pub fn get_stone(&self) -> f64 {
        self.stone
    }

    pub fn get_coins_per_second(&self) -> f64 {
        self.coins_per_second
    }

    pub fn get_wood_per_second(&self) -> f64 {
        self.wood_per_second
    }

    pub fn get_stone_per_second(&self) -> f64 {
        self.stone_per_second
    }

    pub fn get_coins_per_click(&self) -> f64 {
        self.coins_per_click
    }

    pub fn check_achievement(&mut self, achievement_id: &str) -> bool {
        let achievement = match self
            .achievements
            .iter_mut()
            .find(|a| a.id == achievement_id)
        {
            Some(a) => a,
            None => return false,
        };

        if achievement.unlocked {
            return true;
        }

        let current_value = match achievement.category.as_str() {
            "clicks" => self.total_clicks as f64,
            "resources" => {
                if achievement.id == "first_coins_100" {
                    self.coins
                } else if achievement.id == "wood_collector_1000" {
                    self.wood
                } else if achievement.id == "stone_hoarder_5000" {
                    self.stone
                } else {
                    0.0
                }
            }
            "buildings" => self.statistics.buildings_purchased as f64,
            "crafting" => self.statistics.total_resources_crafted as f64,
            "unlocks" => self.statistics.achievements_unlocked_count as f64,
            _ => 0.0,
        };

        achievement.progress = current_value;

        if achievement.progress >= achievement.requirement {
            achievement.unlocked = true;
            achievement.unlock_timestamp = Some(0.0);

            self.statistics.achievements_unlocked_count += 1;

            self.check_achievement("first_unlock");
            self.check_achievement("progress_master_5");

            return true;
        }

        false
    }

    pub fn grant_worker_xp(&mut self, elapsed: f64) {
        for i in 0..self.workers.len() {
            if self.workers[i].assigned_building.is_some() {
                let xp_gain = 10.0 * elapsed;
                self.workers[i].xp += xp_gain;

                while self.workers[i].xp >= self.workers[i].xp_to_next_level {
                    self.workers[i].xp -= self.workers[i].xp_to_next_level;
                    self.workers[i].level += 1;
                    self.workers[i].xp_to_next_level =
                        (self.workers[i].xp_to_next_level * 1.5).ceil();

                    let preference = &self.workers[i].preferences;
                    let assigned = self.workers[i].assigned_building.as_ref().unwrap();
                    let mut efficiency = 1.0;

                    if preference == assigned {
                        efficiency += 0.2;
                    }
                    efficiency += (self.workers[i].level as f64) * 0.05;
                    self.workers[i].efficiency_multiplier = efficiency;
                }
            }
        }
    }

    pub fn get_worker_production_bonus(&self, worker_index: usize) -> f64 {
        if worker_index >= self.workers.len() {
            return 0.0;
        }

        let worker = &self.workers[worker_index];
        if worker.assigned_building.is_none() {
            return 0.0;
        }

        worker.efficiency_multiplier - 1.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initial_state() {
        let game = TestGameState::new();
        assert_eq!(game.get_coins(), 0.0);
        assert_eq!(game.get_wood(), 0.0);
        assert_eq!(game.get_stone(), 0.0);
        assert_eq!(game.get_coins_per_click(), 1.0);
        assert_eq!(game.get_coins_per_second(), 0.0);
        assert_eq!(game.get_wood_per_second(), 0.0);
        assert_eq!(game.get_stone_per_second(), 0.0);
    }

    #[test]
    fn test_click_action() {
        let mut game = TestGameState::new();
        game.click_action();
        assert_eq!(game.get_coins(), 1.0);

        game.click_action();
        game.click_action();
        assert_eq!(game.get_coins(), 3.0);
    }

    #[test]
    fn test_buy_upgrade() {
        let mut game = TestGameState::new();

        assert_eq!(game.buy_upgrade(0), false);
        assert_eq!(game.get_coins(), 0.0);

        game.coins = 15.0;

        assert_eq!(game.buy_upgrade(0), true);
        assert_eq!(game.get_coins(), 5.0);
        assert_eq!(game.get_coins_per_click(), 2.0);
    }

    #[test]
    fn test_buy_building() {
        let mut game = TestGameState::new();

        assert_eq!(game.buy_building(0), false);
        assert_eq!(game.get_coins(), 0.0);

        game.coins = 20.0;

        assert_eq!(game.buy_building(0), true);
        assert_eq!(game.get_coins(), 5.0);
        assert_eq!(game.buildings[0].count, 1);
        assert_eq!(game.get_coins_per_second(), 0.1);
    }

    #[test]
    fn test_update_production() {
        let mut game = TestGameState::new();

        game.coins = 700.0;
        game.buy_building(0);
        game.buy_building(1);
        game.buy_building(2);

        assert_eq!(game.get_coins_per_second(), 6.1);

        game.coins = 500.0;
        game.buy_building(3);
        game.buy_building(4);
        game.buy_building(5);

        assert_eq!(game.get_wood_per_second(), 5.7);

        game.coins = 600.0;
        game.buy_building(6);
        game.buy_building(7);
        game.buy_building(8);

        assert_eq!(game.get_stone_per_second(), 5.85);
    }

    #[test]
    fn test_statistics_initialization() {
        let game = TestGameState::new();
        let stats = game.get_statistics();

        assert_eq!(stats.total_clicks, 0);
        assert_eq!(stats.total_coins_earned, 0.0);
        assert_eq!(stats.total_wood_earned, 0.0);
        assert_eq!(stats.total_stone_earned, 0.0);
        assert_eq!(stats.total_resources_crafted, 0);
        assert_eq!(stats.achievements_unlocked_count, 0);
        assert_eq!(stats.play_time_seconds, 0.0);
        assert_eq!(stats.buildings_purchased, 0);
        assert_eq!(stats.upgrades_purchased, 0);
    }

    #[test]
    fn test_statistics_click_tracking() {
        let mut game = TestGameState::new();

        for _ in 0..10 {
            game.click_action();
        }

        let stats = game.get_statistics();
        assert_eq!(stats.total_clicks, 10);
        assert_eq!(stats.total_coins_earned, 10.0);
    }

    #[test]
    fn test_statistics_building_tracking() {
        let mut game = TestGameState::new();
        game.coins = 1000.0;

        game.buy_building(0);
        game.buy_building(0);
        game.buy_building(1);

        let stats = game.get_statistics();
        assert_eq!(stats.buildings_purchased, 3);
    }

    #[test]
    fn test_statistics_upgrade_tracking() {
        let mut game = TestGameState::new();
        game.coins = 100.0;

        game.buy_upgrade(0);
        game.buy_upgrade(0);

        let stats = game.get_statistics();
        assert_eq!(stats.upgrades_purchased, 2);
    }

    #[test]
    fn test_achievements_initialization() {
        let game = TestGameState::new();
        let achievements = game.get_achievements();

        assert_eq!(achievements.len(), 13);
        for achievement in &achievements {
            assert_eq!(achievement.unlocked, false);
            assert_eq!(achievement.progress, 0.0);
        }
    }

    #[test]
    fn test_check_achievement_click_novice() {
        let mut game = TestGameState::new();

        for _ in 0..10 {
            game.click_action();
        }

        let unlocked = game.check_achievement("click_novice_10");
        assert_eq!(unlocked, true);

        let achievements = game.get_achievements();
        let click_novice = achievements
            .iter()
            .find(|a| a.id == "click_novice_10")
            .unwrap();
        assert_eq!(click_novice.unlocked, true);
        assert_eq!(click_novice.progress, 10.0);
    }

    #[test]
    fn test_check_achievement_not_yet() {
        let mut game = TestGameState::new();

        for _ in 0..5 {
            game.click_action();
        }

        let unlocked = game.check_achievement("click_novice_10");
        assert_eq!(unlocked, false);

        let achievements = game.get_achievements();
        let click_novice = achievements
            .iter()
            .find(|a| a.id == "click_novice_10")
            .unwrap();
        assert_eq!(click_novice.unlocked, false);
        assert_eq!(click_novice.progress, 5.0);
    }

    #[test]
    fn test_check_achievement_first_building() {
        let mut game = TestGameState::new();
        game.coins = 20.0;

        game.buy_building(0);

        let unlocked = game.check_achievement("first_building");
        assert_eq!(unlocked, true);

        let achievements = game.get_achievements();
        let first_building = achievements
            .iter()
            .find(|a| a.id == "first_building")
            .unwrap();
        assert_eq!(first_building.unlocked, true);
        assert_eq!(first_building.progress, 1.0);
    }

    #[test]
    fn test_check_achievement_first_coins() {
        let mut game = TestGameState::new();
        game.coins = 150.0;

        let unlocked = game.check_achievement("first_coins_100");
        assert_eq!(unlocked, true);

        let achievements = game.get_achievements();
        let first_coins = achievements
            .iter()
            .find(|a| a.id == "first_coins_100")
            .unwrap();
        assert_eq!(first_coins.unlocked, true);
        assert_eq!(first_coins.progress, 150.0);
    }

    #[test]
    fn test_check_achievement_invalid_id() {
        let mut game = TestGameState::new();

        let unlocked = game.check_achievement("invalid_achievement_id");
        assert_eq!(unlocked, false);
    }

    #[test]
    fn test_check_achievement_already_unlocked() {
        let mut game = TestGameState::new();

        for _ in 0..10 {
            game.click_action();
        }

        let unlocked1 = game.check_achievement("click_novice_10");
        assert_eq!(unlocked1, true);

        let unlocked2 = game.check_achievement("click_novice_10");
        assert_eq!(unlocked2, true);
    }

    #[test]
    fn test_get_crafting_recipes() {
        let game = TestGameState::new();
        let recipes = game.get_crafting_recipes();

        assert_eq!(recipes.len(), 6);

        assert_eq!(recipes[0].id, "coins_to_wood");
        assert_eq!(recipes[0].input_resource, "coins");
        assert_eq!(recipes[0].input_amount, 100.0);
        assert_eq!(recipes[0].output_resource, "wood");
        assert_eq!(recipes[0].output_amount, 10.0);

        assert_eq!(recipes[1].id, "wood_to_coins");
        assert_eq!(recipes[1].input_resource, "wood");
        assert_eq!(recipes[1].input_amount, 10.0);
        assert_eq!(recipes[1].output_resource, "coins");
        assert_eq!(recipes[1].output_amount, 100.0);

        assert_eq!(recipes[2].id, "coins_to_stone");
        assert_eq!(recipes[2].input_resource, "coins");
        assert_eq!(recipes[2].input_amount, 100.0);
        assert_eq!(recipes[2].output_resource, "stone");
        assert_eq!(recipes[2].output_amount, 1.0);

        assert_eq!(recipes[3].id, "stone_to_coins");
        assert_eq!(recipes[3].input_resource, "stone");
        assert_eq!(recipes[3].input_amount, 1.0);
        assert_eq!(recipes[3].output_resource, "coins");
        assert_eq!(recipes[3].output_amount, 100.0);

        assert_eq!(recipes[4].id, "wood_to_stone");
        assert_eq!(recipes[4].input_resource, "wood");
        assert_eq!(recipes[4].input_amount, 10.0);
        assert_eq!(recipes[4].output_resource, "stone");
        assert_eq!(recipes[4].output_amount, 1.0);

        assert_eq!(recipes[5].id, "stone_to_wood");
        assert_eq!(recipes[5].input_resource, "stone");
        assert_eq!(recipes[5].input_amount, 1.0);
        assert_eq!(recipes[5].output_resource, "wood");
        assert_eq!(recipes[5].output_amount, 10.0);
    }

    #[test]
    fn test_craft_resource_success() {
        let mut game = TestGameState::new();
        game.coins = 200.0;
        game.wood = 0.0;

        let wood_before = game.get_wood();
        let result = game.craft_resource("coins_to_wood");

        assert_eq!(result, true);
        assert_eq!(game.get_coins(), 100.0);
        assert_eq!(game.get_wood(), wood_before + 10.0);

        let stats = game.get_statistics();
        assert_eq!(stats.total_resources_crafted, 1);
    }

    #[test]
    fn test_craft_resource_insufficient() {
        let mut game = TestGameState::new();
        game.coins = 50.0;
        game.wood = 0.0;

        let coins_before = game.get_coins();
        let wood_before = game.get_wood();
        let result = game.craft_resource("coins_to_wood");

        assert_eq!(result, false);
        assert_eq!(game.get_coins(), coins_before);
        assert_eq!(game.get_wood(), wood_before);

        let stats = game.get_statistics();
        assert_eq!(stats.total_resources_crafted, 0);
    }

    #[test]
    fn test_unlock_initialization() {
        let game = TestGameState::new();
        let unlocks = game.get_unlocks();

        assert_eq!(unlocks.len(), 5);

        let workers_tab = unlocks.iter().find(|u| u.id == "workers_tab").unwrap();
        assert_eq!(workers_tab.name, "工人面板");
        assert_eq!(workers_tab.feature_type, "area");
        assert_eq!(workers_tab.unlocked, false);
        assert_eq!(workers_tab.requirement_type, "total_clicks");
        assert_eq!(workers_tab.requirement_value, 50.0);

        let advanced_buildings = unlocks
            .iter()
            .find(|u| u.id == "advanced_buildings")
            .unwrap();
        assert_eq!(advanced_buildings.name, "高级建筑");
        assert_eq!(advanced_buildings.feature_type, "building");
        assert_eq!(advanced_buildings.unlocked, false);
        assert_eq!(advanced_buildings.requirement_type, "buildings_owned");
        assert_eq!(advanced_buildings.requirement_value, 20.0);

        let prestige_system = unlocks.iter().find(|u| u.id == "prestige_system").unwrap();
        assert_eq!(prestige_system.name, "转生系统");
        assert_eq!(prestige_system.feature_type, "mechanic");
        assert_eq!(prestige_system.unlocked, false);
        assert_eq!(prestige_system.requirement_type, "total_coins");
        assert_eq!(prestige_system.requirement_value, 10000.0);

        let statistics_panel = unlocks.iter().find(|u| u.id == "statistics_panel").unwrap();
        assert_eq!(statistics_panel.name, "统计面板");
        assert_eq!(statistics_panel.feature_type, "area");
        assert_eq!(statistics_panel.unlocked, false);
        assert_eq!(statistics_panel.requirement_type, "total_clicks");
        assert_eq!(statistics_panel.requirement_value, 10.0);

        let achievements_panel = unlocks
            .iter()
            .find(|u| u.id == "achievements_panel")
            .unwrap();
        assert_eq!(achievements_panel.name, "成就面板");
        assert_eq!(achievements_panel.feature_type, "area");
        assert_eq!(achievements_panel.unlocked, false);
        assert_eq!(achievements_panel.requirement_type, "total_clicks");
        assert_eq!(achievements_panel.requirement_value, 25.0);
    }

    #[test]
    fn test_check_unlock_requirement_met() {
        let mut game = TestGameState::new();
        game.total_clicks = 60;

        let can_unlock = game.check_unlock("workers_tab");
        assert_eq!(can_unlock, true);
    }

    #[test]
    fn test_check_unlock_requirement_not_met() {
        let mut game = TestGameState::new();
        game.total_clicks = 5;

        let can_unlock = game.check_unlock("workers_tab");
        assert_eq!(can_unlock, false);
    }

    #[test]
    fn test_unlock_feature_success() {
        let mut game = TestGameState::new();
        game.total_clicks = 60;

        let unlocks_before = game.get_unlocks();
        let workers_before = unlocks_before
            .iter()
            .find(|u| u.id == "workers_tab")
            .unwrap();
        assert_eq!(workers_before.unlocked, false);

        let result = game.unlock_feature("workers_tab");
        assert_eq!(result, true);

        let unlocks_after = game.get_unlocks();
        let workers_after = unlocks_after
            .iter()
            .find(|u| u.id == "workers_tab")
            .unwrap();
        assert_eq!(workers_after.unlocked, true);
        assert!(workers_after.unlock_timestamp.is_some());
    }

    #[test]
    fn test_unlock_feature_requirement_not_met() {
        let mut game = TestGameState::new();
        game.total_clicks = 5;

        let result = game.unlock_feature("workers_tab");
        assert_eq!(result, false);

        let unlocks = game.get_unlocks();
        let workers = unlocks.iter().find(|u| u.id == "workers_tab").unwrap();
        assert_eq!(workers.unlocked, false);
    }

    #[test]
    fn test_check_unlock_buildings_requirement() {
        let mut game = TestGameState::new();
        game.statistics.buildings_purchased = 25;

        let can_unlock = game.check_unlock("advanced_buildings");
        assert_eq!(can_unlock, true);

        game.statistics.buildings_purchased = 10;
        let can_unlock_again = game.check_unlock("advanced_buildings");
        assert_eq!(can_unlock_again, false);
    }

    #[test]
    fn test_check_unlock_coins_requirement() {
        let mut game = TestGameState::new();
        game.coins = 15000.0;

        let can_unlock = game.check_unlock("prestige_system");
        assert_eq!(can_unlock, true);

        game.coins = 5000.0;
        let can_unlock_again = game.check_unlock("prestige_system");
        assert_eq!(can_unlock_again, false);
    }

    #[test]
    fn test_unlock_invalid_feature() {
        let mut game = TestGameState::new();

        let result = game.unlock_feature("invalid_feature_id");
        assert_eq!(result, false);

        let can_unlock = game.check_unlock("invalid_feature_id");
        assert_eq!(can_unlock, false);
    }

    #[test]
    fn test_worker_initialization() {
        let game = TestGameState::new();
        let workers = game.get_workers();

        assert_eq!(workers.len(), 3);

        let miner = &workers[0];
        assert_eq!(miner.name, "矿工");
        assert_eq!(miner.skills, "mining");
        assert_eq!(miner.assigned_building, None);
        assert_eq!(miner.level, 1);
        assert_eq!(miner.efficiency_multiplier, 1.0);

        let lumberjack = &workers[1];
        assert_eq!(lumberjack.name, "伐木工");
        assert_eq!(lumberjack.skills, "logging");
        assert_eq!(lumberjack.preferences, "Woodcutter");

        let mason = &workers[2];
        assert_eq!(mason.name, "石匠");
        assert_eq!(mason.skills, "masonry");
        assert_eq!(mason.preferences, "Stone Quarry");
    }

    #[test]
    fn test_assign_worker_success() {
        let mut game = TestGameState::new();

        let result = game.assign_worker(0, "Coin Mine");
        assert_eq!(result, true);

        let workers = game.get_workers();
        let worker = &workers[0];
        assert_eq!(worker.assigned_building, Some("Coin Mine".to_string()));
    }

    #[test]
    fn test_assign_worker_with_bonus() {
        let mut game = TestGameState::new();

        let result = game.assign_worker(0, "Coin Mine");
        assert_eq!(result, true);

        let workers = game.get_workers();
        let worker = &workers[0];
        assert_eq!(worker.efficiency_multiplier, 1.25);
    }

    #[test]
    fn test_assign_worker_invalid_index() {
        let mut game = TestGameState::new();

        let result = game.assign_worker(99, "Coin Mine");
        assert_eq!(result, false);
    }

    #[test]
    fn test_assign_worker_invalid_building() {
        let mut game = TestGameState::new();

        let result = game.assign_worker(0, "Invalid Building");
        assert_eq!(result, false);
    }

    #[test]
    fn test_worker_level_bonus() {
        let mut game = TestGameState::new();

        game.workers[0].level = 5;
        let result = game.assign_worker(0, "Coin Mine");
        assert_eq!(result, true);

        let workers = game.get_workers();
        let worker = &workers[0];
        assert_eq!(worker.efficiency_multiplier, 1.45);
    }

    #[test]
    fn test_worker_xp_gain() {
        let mut game = TestGameState::new();

        let result = game.assign_worker(0, "Coin Mine");
        assert_eq!(result, true);

        let workers_before = game.get_workers();
        let xp_before = workers_before[0].xp;

        game.grant_worker_xp(5.0);

        let workers_after = game.get_workers();
        assert_eq!(workers_after[0].xp, xp_before + 50.0);
        assert_eq!(workers_after[0].level, 1);
    }

    #[test]
    fn test_worker_level_up() {
        let mut game = TestGameState::new();

        let result = game.assign_worker(0, "Coin Mine");
        assert_eq!(result, true);

        game.grant_worker_xp(10.0);

        let workers = game.get_workers();
        assert_eq!(workers[0].level, 2);
        assert_eq!(workers[0].xp, 0.0);
        assert_eq!(workers[0].xp_to_next_level, 150.0);
        assert_eq!(workers[0].efficiency_multiplier, 1.30);
    }

    #[test]
    fn test_worker_multiple_level_ups() {
        let mut game = TestGameState::new();

        game.assign_worker(0, "Coin Mine");

        game.grant_worker_xp(50.0);

        let workers = game.get_workers();
        assert!(workers[0].level >= 3);
        assert!(workers[0].efficiency_multiplier > 1.30);
    }

    #[test]
    fn test_worker_xp_unassigned() {
        let mut game = TestGameState::new();

        let workers_before = game.get_workers();
        let xp_before = workers_before[0].xp;

        game.grant_worker_xp(10.0);

        let workers_after = game.get_workers();
        assert_eq!(workers_after[0].xp, xp_before);
        assert_eq!(workers_after[0].level, 1);
    }

    #[test]
    fn test_get_worker_production_bonus() {
        let mut game = TestGameState::new();

        game.assign_worker(0, "Coin Mine");

        let bonus = game.get_worker_production_bonus(0);
        assert!(bonus > 0.0);

        let unassigned_bonus = game.get_worker_production_bonus(1);
        assert_eq!(unassigned_bonus, 0.0);
    }
}
