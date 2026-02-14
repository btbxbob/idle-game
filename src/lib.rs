use js_sys::Date;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
struct GameState {
    coins: f64,
    wood: f64,
    stone: f64,
    coins_per_click: f64,
    coins_per_second: f64,
    wood_per_second: f64,
    stone_per_second: f64,
    autoclick_count: u32,
    total_clicks: u32,
    last_update_time: f64,
}

#[derive(Serialize, Deserialize)]
struct Upgrade {
    name: String,
    cost: f64,
    production_increase: f64,
    owned: u32,
    unlocked: bool,
}

#[derive(Serialize, Deserialize)]
struct Building {
    name: String,
    cost: f64,
    production_rate: f64,
    count: u32,
}

#[derive(Serialize, Deserialize)]
struct Worker {
    name: String,
    skills: String,      // Reserved for future use
    background: String,  // Reserved for future use
    preferences: String, // Reserved for future use
    assigned_building: Option<String>,
    level: u32,
}

#[wasm_bindgen]
pub struct IdleGame {
    state: Rc<RefCell<GameState>>,
    upgrades: Vec<Upgrade>,
    buildings: Vec<Building>,
    workers: Vec<Worker>,
}

#[wasm_bindgen]
impl IdleGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> IdleGame {
        let now = Date::now();

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
            workers: vec![Worker {
                name: "Worker 1".to_string(),
                skills: "".to_string(),
                background: "".to_string(),
                preferences: "".to_string(),
                assigned_building: None,
                level: 1,
            }],
        }
    }

    #[wasm_bindgen]
    pub fn click_action(&mut self) {
        let mut state = self.state.borrow_mut();
        state.coins += state.coins_per_click;
        state.total_clicks += 1;
        drop(state);
        // Only update resources for click action - no need to refresh buttons
        self.update_resources_only();
    }

    #[wasm_bindgen]
    pub fn buy_upgrade(&mut self, index: usize) -> bool {
        if index >= self.upgrades.len() {
            return false;
        }

        let upgrade_cost = self.upgrades[index].cost;
        let mut state = self.state.borrow_mut();

        // Use epsilon for floating point comparison
        if state.coins + 1e-10 >= upgrade_cost {
            state.coins -= upgrade_cost;

            if self.upgrades[index].name == "Better Click" {
                state.coins_per_click += self.upgrades[index].production_increase;
            } else if self.upgrades[index].name.starts_with("Autoclicker") {
                state.autoclick_count += 1;
            } else if self.upgrades[index].name == "Lumberjack Efficiency" {
                // This upgrade will be applied to wood production in update_production
            } else if self.upgrades[index].name == "Stone Mason Skill" {
                // This upgrade will be applied to stone production in update_production
            }

            self.upgrades[index].owned += 1;
            self.upgrades[index].cost = self.upgrades[index].cost * 1.5;

            drop(state);

            self.update_production();
            self.update_resources_only();
            self.update_upgrades_only();
            true
        } else {
            // Drop the borrow before calling update_resources_only
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
        let mut state = self.state.borrow_mut();

        // Use epsilon for floating point comparison
        if state.coins + 1e-10 >= building_cost {
            state.coins -= building_cost;
            self.buildings[index].count += 1;
            self.buildings[index].cost *= 1.15;
            drop(state);
            self.update_production();
            self.update_resources_only();
            self.update_buildings_only();
            true
        } else {
            // Drop the borrow before calling update_resources_only
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

        // Ensure values are finite and non-negative before updating the state
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

    #[wasm_bindgen]
    pub fn game_loop(&mut self) {
        let now = Date::now();

        let (new_coins, new_wood, new_stone, new_last_update_time) = {
            let state = self.state.borrow();
            let elapsed = (now - state.last_update_time) / 1000.0;

            if elapsed > 0.0 && elapsed < 3600.0 {
                // Limit max elapsed time to prevent huge jumps
                let mut new_coins = state.coins + state.coins_per_second * elapsed;
                let new_wood = state.wood + state.wood_per_second * elapsed;
                let new_stone = state.stone + state.stone_per_second * elapsed;

                // Clamp values to prevent overflow to infinity or NaN
                new_coins = new_coins.max(0.0);
                
                // Calculate autoclick effect based on elapsed time (assuming 10 clicks per second per autoclicker)
                let autoclicks_per_second = 10.0; // 10 clicks per second per autoclicker
                let clamped_autoclick_effect = state.coins_per_click * state.autoclick_count as f64 * autoclicks_per_second * elapsed;
                if state.autoclick_count > 0 && clamped_autoclick_effect.is_finite() {
                    new_coins += clamped_autoclick_effect;
                }

                (new_coins, new_wood, new_stone, now)
            } else {
                (state.coins, state.wood, state.stone, state.last_update_time)
            }
        };

        // Double check for NaN/Infinite values before updating
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
            None => return,
        };
        let global_obj = window.as_ref();

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
        }
    }

    pub fn click_action(&mut self) {
        self.coins += self.coins_per_click;
        self.total_clicks += 1;
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

        // Test coins production
        game.coins = 700.0;
        game.buy_building(0); // Coin Mine
        game.buy_building(1); // Coin Factory
        game.buy_building(2); // Coin Corporation

        assert_eq!(game.get_coins_per_second(), 6.1);

        // Test wood production
        game.coins = 500.0; // Use coins to buy buildings, not wood
        game.buy_building(3); // Woodcutter
        game.buy_building(4); // Lumber Mill
        game.buy_building(5); // Forest Workshop

        assert_eq!(game.get_wood_per_second(), 5.7);

        // Test stone production
        game.coins = 600.0; // Use coins to buy buildings, not stone
        game.buy_building(6); // Stone Quarry
        game.buy_building(7); // Rock Crusher
        game.buy_building(8); // Mason Workshop

        assert_eq!(game.get_stone_per_second(), 5.85);
    }
}
