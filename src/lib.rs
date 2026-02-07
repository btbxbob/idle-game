use js_sys::Date;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
struct GameState {
    coins: f64,
    coins_per_click: f64,
    coins_per_second: f64,
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

#[wasm_bindgen]
pub struct IdleGame {
    state: Rc<RefCell<GameState>>,
    upgrades: Vec<Upgrade>,
    buildings: Vec<Building>,
}

#[wasm_bindgen]
impl IdleGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> IdleGame {
        let now = Date::now();

        IdleGame {
            state: Rc::new(RefCell::new(GameState {
                coins: 0.0,
                coins_per_click: 1.0,
                coins_per_second: 0.0,
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
            ],
        }
    }

    #[wasm_bindgen]
    pub fn click_action(&mut self) {
        let mut state = self.state.borrow_mut();
        state.coins += state.coins_per_click;
        state.total_clicks += 1;
        drop(state);
        self.update_ui();
    }

    #[wasm_bindgen]
    pub fn buy_upgrade(&mut self, index: usize) -> bool {
        if index >= self.upgrades.len() {
            return false;
        }

        let upgrade_cost = self.upgrades[index].cost;
        let mut state = self.state.borrow_mut();

        if state.coins >= upgrade_cost {
            state.coins -= upgrade_cost;

            if self.upgrades[index].name == "Better Click" {
                state.coins_per_click += self.upgrades[index].production_increase;
            } else if self.upgrades[index].name.starts_with("Autoclicker") {
                state.coins_per_second += self.upgrades[index].production_increase;
            }

            self.upgrades[index].owned += 1;
            self.upgrades[index].cost *= 1.5;

            drop(state);

            self.update_production();
            self.update_ui();
            true
        } else {
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

        if state.coins >= building_cost {
            state.coins -= building_cost;
            self.buildings[index].count += 1;
            self.buildings[index].cost *= 1.15;
            drop(state);
            self.update_production();
            self.update_ui();
            true
        } else {
            false
        }
    }

    #[wasm_bindgen]
    pub fn get_coins(&self) -> f64 {
        self.state.borrow().coins
    }

    #[wasm_bindgen]
    pub fn get_coins_per_second(&self) -> f64 {
        self.state.borrow().coins_per_second
    }

    #[wasm_bindgen]
    pub fn get_coins_per_click(&self) -> f64 {
        self.state.borrow().coins_per_click
    }

    fn update_production(&mut self) {
        let mut total_cps = 0.0;

        for building in &self.buildings {
            total_cps += building.production_rate * building.count as f64;
        }

        for upgrade in &self.upgrades {
            if upgrade.name.starts_with("Autoclicker") {
                total_cps += upgrade.production_increase * upgrade.owned as f64;
            }
        }

        let mut state = self.state.borrow_mut();
        state.coins_per_second = total_cps;
    }

    #[wasm_bindgen]
    pub fn game_loop(&mut self) {
        let now = Date::now();

        let (new_coins, new_last_update_time) = {
            let state = self.state.borrow();
            let elapsed = (now - state.last_update_time) / 1000.0;

            if elapsed > 0.0 {
                let new_coins = state.coins + state.coins_per_second * elapsed;
                (new_coins, now)
            } else {
                (state.coins, state.last_update_time)
            }
        };

        {
            let mut state = self.state.borrow_mut();
            state.coins = new_coins;
            state.last_update_time = new_last_update_time;
        }

        self.update_ui();
    }

    #[wasm_bindgen]
    pub fn update_ui(&self) {
        let window = match web_sys::window() {
            Some(win) => win,
            None => return,
        };
        let global_obj = window.as_ref();

        let coins_val = self.get_coins();
        let coins_per_sec = self.get_coins_per_second();
        let coins_per_click = self.get_coins_per_click();

        let update_resource_display_result =
            js_sys::Reflect::get(global_obj, &"updateResourceDisplay".into());
        if let Ok(update_func) = update_resource_display_result {
            let update_resource_display: js_sys::Function = update_func.into();
            let _ = update_resource_display.call3(
                &JsValue::NULL,
                &coins_val.into(),
                &coins_per_sec.into(),
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
    coins_per_click: f64,
    coins_per_second: f64,
    total_clicks: u32,
    upgrades: Vec<Upgrade>,
    buildings: Vec<Building>,
}

#[cfg(test)]
impl TestGameState {
    pub fn new() -> Self {
        TestGameState {
            coins: 0.0,
            coins_per_click: 1.0,
            coins_per_second: 0.0,
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
                self.coins_per_second += self.upgrades[index].production_increase;
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

        for building in &self.buildings {
            total_cps += building.production_rate * building.count as f64;
        }

        for upgrade in &self.upgrades {
            if upgrade.name.starts_with("Autoclicker") {
                total_cps += upgrade.production_increase * upgrade.owned as f64;
            }
        }

        self.coins_per_second = total_cps;
    }

    pub fn get_coins(&self) -> f64 {
        self.coins
    }

    pub fn get_coins_per_second(&self) -> f64 {
        self.coins_per_second
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
        assert_eq!(game.get_coins_per_click(), 1.0);
        assert_eq!(game.get_coins_per_second(), 0.0);
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
    }
}
