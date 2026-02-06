use js_sys::Date;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

// 游戏状态结构体
#[derive(Serialize, Deserialize)]
struct GameState {
    coins: f64,
    coins_per_click: f64,
    coins_per_second: f64,
    total_clicks: u32,
    last_update_time: f64,
}

// 升级结构体
#[derive(Serialize, Deserialize)]
struct Upgrade {
    name: String,
    cost: f64,
    production_increase: f64,
    owned: u32,
    unlocked: bool,
}

// 建筑结构体
#[derive(Serialize, Deserialize)]
struct Building {
    name: String,
    cost: f64,
    production_rate: f64,
    count: u32,
}

// 游戏主控制器
#[wasm_bindgen]
pub struct IdleGame {
    state: Rc<RefCell<GameState>>,
    upgrades: Vec<Upgrade>,
    buildings: Vec<Building>,
}

#[wasm_bindgen]
impl IdleGame {
    // 创建新游戏实例
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

    // 处理点击动作
    #[wasm_bindgen]
    pub fn click_action(&mut self) {
        let mut state = self.state.borrow_mut();
        state.coins += state.coins_per_click;
        state.total_clicks += 1;
        // 释放借用后更新UI
        drop(state);
        self.update_ui();
    }

    // 购买升级
    #[wasm_bindgen]
    pub fn buy_upgrade(&mut self, index: usize) -> bool {
        if index >= self.upgrades.len() {
            return false;
        }

        let upgrade_cost = self.upgrades[index].cost;
        let mut state = self.state.borrow_mut();

        if state.coins >= upgrade_cost {
            state.coins -= upgrade_cost;

            // 应用升级效果
            if self.upgrades[index].name == "Better Click" {
                state.coins_per_click += self.upgrades[index].production_increase;
            } else if self.upgrades[index].name.starts_with("Autoclicker") {
                state.coins_per_second += self.upgrades[index].production_increase;
            }

            // 更新升级信息
            self.upgrades[index].owned += 1;
            self.upgrades[index].cost *= 1.5; // 成本递增

            // 释放借用
            drop(state);

            // 更新生产率
            self.update_production();

            // 更新UI
            self.update_ui();
            true
        } else {
            false
        }
    }

    // 购买建筑
    #[wasm_bindgen]
    pub fn buy_building(&mut self, index: usize) -> bool {
        if index >= self.buildings.len() {
            return false;
        }

        let building_cost = self.buildings[index].cost;
        let mut state = self.state.borrow_mut();

        if state.coins >= building_cost {
            state.coins -= building_cost;

            // 增加建筑数量
            self.buildings[index].count += 1;

            // 更新建筑成本（递增）
            self.buildings[index].cost *= 1.15;

            // 释放借用
            drop(state);

            // 更新生产率
            self.update_production();

            // 更新UI
            self.update_ui();
            true
        } else {
            false
        }
    }

    // 获取当前硬币数
    #[wasm_bindgen]
    pub fn get_coins(&self) -> f64 {
        self.state.borrow().coins
    }

    // 获取每秒硬币产量
    #[wasm_bindgen]
    pub fn get_coins_per_second(&self) -> f64 {
        self.state.borrow().coins_per_second
    }

    // 获取每点击硬币数
    #[wasm_bindgen]
    pub fn get_coins_per_click(&self) -> f64 {
        self.state.borrow().coins_per_click
    }

    // 更新生产率
    fn update_production(&mut self) {
        let mut total_cps = 0.0;

        // 计算建筑总产量
        for building in &self.buildings {
            total_cps += building.production_rate * building.count as f64;
        }

        // 计算升级加成
        for upgrade in &self.upgrades {
            if upgrade.name.starts_with("Autoclicker") {
                total_cps += upgrade.production_increase * upgrade.owned as f64;
            }
        }

        let mut state = self.state.borrow_mut();
        state.coins_per_second = total_cps;
    }

    // 游戏主循环 - 处理自动收入
    #[wasm_bindgen]
    pub fn game_loop(&mut self) {
        let now = Date::now();

        let (new_coins, new_last_update_time) = {
            let state = self.state.borrow();
            let elapsed = (now - state.last_update_time) / 1000.0; // 转换为秒

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

    // 更新UI显示
    fn update_ui(&self) {
        // 调用JavaScript函数更新硬币数
        let window = web_sys::window().expect("should have a window in this context");
        let global_obj = window.as_ref();

        // 更新资源显示
        let coins_val = self.get_coins();
        let coins_per_sec = self.get_coins_per_second();
        let coins_per_click = self.get_coins_per_click();

        let update_resource_display: js_sys::Function =
            js_sys::Reflect::get(global_obj, &"updateResourceDisplay".into())
                .unwrap()
                .into();

        // 调用带三个参数的更新函数
        update_resource_display
            .call3(
                &JsValue::NULL,
                &coins_val.into(),
                &coins_per_sec.into(),
                &coins_per_click.into(),
            )
            .unwrap();

        // 更新升级按钮
        let upgrades_serialized = serde_wasm_bindgen::to_value(&self.upgrades).unwrap();
        let update_upgrades: js_sys::Function =
            js_sys::Reflect::get(global_obj, &"updateUpgradeButtons".into())
                .unwrap()
                .into();
        update_upgrades
            .call1(&JsValue::NULL, &upgrades_serialized)
            .unwrap();

        // 更新建筑显示
        let buildings_serialized = serde_wasm_bindgen::to_value(&self.buildings).unwrap();
        let update_buildings: js_sys::Function =
            js_sys::Reflect::get(global_obj, &"updateBuildingDisplay".into())
                .unwrap()
                .into();
        update_buildings
            .call1(&JsValue::NULL, &buildings_serialized)
            .unwrap();
    }
}

// 初始化游戏
#[wasm_bindgen]
pub fn init_game() -> IdleGame {
    IdleGame::new()
}
