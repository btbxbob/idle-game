use crate::entities::{Building, Upgrade, Worker};
use crate::state::{GameState, Statistics};
use crate::systems::{Achievement, CraftingRecipe, UnlockedFeature};
use js_sys::Date;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

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
        // First, update statistics (release borrow immediately)
        {
            let mut stats = self.statistics.borrow_mut();
            stats.total_clicks += 1;
            stats.total_coins_earned += self.state.borrow().coins_per_click;
        } // stats borrow released here

        // Then update game state
        {
            let mut state = self.state.borrow_mut();
            let earned = state.coins_per_click;
            state.coins += earned;
            state.total_clicks += 1;
        } // state borrow released here

        // Now check achievements (no conflicting borrows)
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
    pub fn get_statistics(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.statistics.borrow().clone()).unwrap_or(JsValue::NULL)
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

        // Don't call update_production here to avoid borrow conflicts
        // Caller should call it after releasing other borrows
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

        // Update statistics (release borrow before calling other methods)
        if elapsed > 0.0 {
            {
                let mut stats = self.statistics.borrow_mut();
                stats.play_time_seconds += elapsed;
            }

            // Grant XP to assigned workers based on production
            self.grant_worker_xp(elapsed);

            // Update production after worker XP changes (must be after grant_worker_xp)
            self.update_production();
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
        // First, read state and stats (release borrows immediately)
        let (
            total_clicks,
            coins,
            wood,
            stone,
            buildings_purchased,
            total_resources_crafted,
            achievements_unlocked_count,
        ) = {
            let state = self.state.borrow();
            let stats = self.statistics.borrow();
            (
                state.total_clicks as f64,
                state.coins,
                state.wood,
                state.stone,
                stats.buildings_purchased as f64,
                stats.total_resources_crafted as f64,
                stats.achievements_unlocked_count as f64,
            )
        }; // All borrows released here

        // Find and update the achievement (separate borrow)
        let mut unlocked_this_call = false;
        {
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
                "clicks" => total_clicks,
                "resources" => {
                    if achievement.id == "first_coins_100" {
                        coins
                    } else if achievement.id == "wood_collector_1000" {
                        wood
                    } else if achievement.id == "stone_hoarder_5000" {
                        stone
                    } else {
                        0.0
                    }
                }
                "buildings" => buildings_purchased,
                "crafting" => total_resources_crafted,
                "unlocks" => achievements_unlocked_count,
                _ => 0.0,
            };

            achievement.progress = current_value;

            if achievement.progress >= achievement.requirement {
                achievement.unlocked = true;
                achievement.unlock_timestamp = Some(Date::now());
                unlocked_this_call = true;
            }
        } // achievement borrow released here

        // Update statistics if unlocked (separate borrow)
        if unlocked_this_call {
            {
                let mut stats_mut = self.statistics.borrow_mut();
                stats_mut.achievements_unlocked_count += 1;
            } // stats borrow released here

            // Recursively check dependent achievements (all previous borrows released)
            self.check_achievement("first_unlock");
            self.check_achievement("progress_master_5");

            return true;
        }

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
