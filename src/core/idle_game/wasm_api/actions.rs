use super::super::*;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
impl IdleGame {
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
            state.add_coins(earned);
            state.total_clicks += 1;
        } // state borrow released here

        // Now check achievements (no conflicting borrows)
        self.check_achievement("click_novice_10");
        self.check_achievement("click_master_100");
        self.check_achievement("click_legend_1000");

        self.update_resources_only();
        self.update_buildings_only();
    }

    #[wasm_bindgen]
    pub fn buy_building(&mut self, index: usize) -> bool {
        if index >= self.buildings.len() {
            return false;
        }

        let current_stage = self.state.borrow().current_stage;
        if !stage::is_building_revealed(
            &self.buildings[index],
            current_stage,
            &self.technology_tree,
        ) {
            return false;
        }

        let building_cost = self.buildings[index].cost;
        let can_afford = {
            let state = self.state.borrow();
            state.get_coins() + 1e-10 >= building_cost
        };

        if can_afford {
            {
                let mut state = self.state.borrow_mut();
                state.spend_coins(building_cost);
                self.buildings[index].count += 1;
                self.buildings[index].cost *= 1.15;
                state.coins_per_click = calculate_click_power_from_buildings(&self.buildings);
            }

            let mut stats = self.statistics.borrow_mut();
            stats.buildings_purchased += 1;
            drop(stats);

            self.check_achievement("first_building");
            self.check_achievement("building_enthusiast_10");
            self.check_achievement("building_tycoon_50");

            self.refresh_progression_state();
            self.update_production();
            self.update_resources_only();
            self.update_buildings_only();
            true
        } else {
            self.update_resources_only();
            false
        }
    }

    #[wasm_bindgen]
    pub fn buy_buildings(&mut self, index: usize, count: usize) -> usize {
        if index >= self.buildings.len() {
            return 0;
        }

        let current_stage = self.state.borrow().current_stage;
        if !stage::is_building_revealed(
            &self.buildings[index],
            current_stage,
            &self.technology_tree,
        ) {
            return 0;
        }

        let mut purchased = 0;
        for _ in 0..count {
            let building_cost = self.buildings[index].cost;
            let can_afford = {
                let state = self.state.borrow();
                state.get_coins() + 1e-10 >= building_cost
            };

            if !can_afford {
                break;
            }

            {
                let mut state = self.state.borrow_mut();
                state.spend_coins(building_cost);
                self.buildings[index].count += 1;
                self.buildings[index].cost *= 1.15;
                state.coins_per_click = calculate_click_power_from_buildings(&self.buildings);
            }

            let mut stats = self.statistics.borrow_mut();
            stats.buildings_purchased += 1;
            drop(stats);

            purchased += 1;
        }

        if purchased > 0 {
            self.check_achievement("first_building");
            self.check_achievement("building_enthusiast_10");
            self.check_achievement("building_tycoon_50");
            self.refresh_progression_state();
            self.update_production();
            self.update_resources_only();
            self.update_buildings_only();
        }

        purchased
    }

    #[wasm_bindgen]
    pub fn get_max_affordable_building_count(&self, index: usize) -> usize {
        if index >= self.buildings.len() {
            return 0;
        }

        let current_stage = self.state.borrow().current_stage;
        if !stage::is_building_revealed(
            &self.buildings[index],
            current_stage,
            &self.technology_tree,
        ) {
            return 0;
        }

        let coins = self.state.borrow().get_coins();
        let mut cost = self.buildings[index].cost;
        let mut affordable_count = 0;
        let mut remaining = coins;

        while remaining + 1e-10 >= cost {
            remaining -= cost;
            affordable_count += 1;
            cost *= 1.15;
        }

        affordable_count
    }

    #[wasm_bindgen]
    pub fn build_housing(&mut self, cost: JsValue) -> Result<bool, String> {
        // Parse cost from JsValue to HashMap
        let cost_map: HashMap<String, f64> = serde_wasm_bindgen::from_value(cost)
            .map_err(|e| format!("Failed to parse cost: {}", e))?;

        // Validate cost is not empty
        if cost_map.is_empty() {
            return Err("Cost cannot be empty".to_string());
        }

        // Check if player can afford the housing
        let can_afford = {
            let state = self.state.borrow();
            for (resource, amount) in cost_map.iter() {
                let current = match normalize_housing_resource_key(resource.as_str()) {
                    Some(resource_type) => state.get_resource(resource_type),
                    _ => return Err(format!("Unknown resource: {}", resource)),
                };
                if current + 1e-10 < *amount {
                    return Err(format!(
                        "Insufficient {}: need {}, have {}",
                        resource, amount, current
                    ));
                }
            }
            true
        };

        if !can_afford {
            self.update_resources_only();
            return Ok(false);
        }

        // Deduct resources
        {
            let mut state = self.state.borrow_mut();
            for (resource, amount) in cost_map.iter() {
                match normalize_housing_resource_key(resource.as_str()) {
                    Some(resource_type) => state.add_resource(resource_type, -*amount),
                    _ => return Err(format!("Unknown resource: {}", resource)),
                };
            }
        }

        // Create new housing with unique name
        let housing_name = format!("住房{}", self.housing_buildings.len() + 1);
        let total_capacity: u32 = cost_map.values().map(|&v| v as u32).sum();
        let new_housing = Housing::new(&housing_name, cost_map.clone(), total_capacity);
        self.housing_buildings.push(new_housing);

        // Update statistics (release borrow before calling other methods)
        {
            let mut stats = self.statistics.borrow_mut();
            stats.buildings_purchased += 1;
        }

        self.update_resources_only();
        Ok(true)
    }

    #[wasm_bindgen]
    pub fn upgrade_housing(&mut self, building_index: usize) -> Result<bool, String> {
        // Validate index
        if building_index >= self.housing_buildings.len() {
            return Err(format!("Invalid housing index: {}", building_index));
        }

        // Get upgrade cost
        let upgrade_cost = {
            let housing = &self.housing_buildings[building_index];
            housing.get_upgrade_cost()
        };

        // Check if player can afford the upgrade
        let can_afford = {
            let state = self.state.borrow();
            for (resource, amount) in upgrade_cost.iter() {
                let current = match normalize_housing_resource_key(resource.as_str()) {
                    Some(resource_type) => state.get_resource(resource_type),
                    _ => return Err(format!("Unknown resource: {}", resource)),
                };
                if current + 1e-10 < *amount {
                    return Err(format!(
                        "Insufficient {}: need {}, have {}",
                        resource, amount, current
                    ));
                }
            }
            true
        };

        if !can_afford {
            self.update_resources_only();
            return Ok(false);
        }

        // Deduct resources
        {
            let mut state = self.state.borrow_mut();
            for (resource, amount) in upgrade_cost.iter() {
                match normalize_housing_resource_key(resource.as_str()) {
                    Some(resource_type) => state.add_resource(resource_type, -*amount),
                    _ => return Err(format!("Unknown resource: {}", resource)),
                };
            }
        }

        // Upgrade the housing
        {
            let housing = &mut self.housing_buildings[building_index];
            housing.upgrade();
        }

        // Update statistics (release borrow before calling other methods)
        {
            let mut stats = self.statistics.borrow_mut();
            stats.buildings_purchased += 1;
        }

        self.update_resources_only();
        Ok(true)
    }
    #[wasm_bindgen]
    pub fn get_coins(&self) -> f64 {
        self.state.borrow().get_coins()
    }

    #[wasm_bindgen]
    pub fn get_wood(&self) -> f64 {
        self.state.borrow().get_wood()
    }

    #[wasm_bindgen]
    pub fn get_stone(&self) -> f64 {
        self.state.borrow().get_stone()
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
    pub fn get_total_clicks(&self) -> u32 {
        self.state.borrow().total_clicks
    }

    #[wasm_bindgen]
    pub fn get_resources(&self) -> JsValue {
        let state = self.state.borrow();
        let resources = js_sys::Object::new();

        for (resource_type, amount) in state.resources.iter() {
            let key = format!("{:?}", resource_type);
            let _ = js_sys::Reflect::set(
                &resources,
                &JsValue::from_str(&key),
                &JsValue::from_f64(*amount),
            );
        }

        let _ = js_sys::Reflect::set(
            &resources,
            &JsValue::from_str("coinsPerSecond"),
            &JsValue::from_f64(state.coins_per_second),
        );
        let _ = js_sys::Reflect::set(
            &resources,
            &JsValue::from_str("woodPerSecond"),
            &JsValue::from_f64(state.wood_per_second),
        );
        let _ = js_sys::Reflect::set(
            &resources,
            &JsValue::from_str("stonePerSecond"),
            &JsValue::from_f64(state.stone_per_second),
        );
        let _ = js_sys::Reflect::set(
            &resources,
            &JsValue::from_str("coinsPerClick"),
            &JsValue::from_f64(state.coins_per_click),
        );

        resources.into()
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

        if !self.has_assignment_capacity(worker_index, building_id) {
            return false;
        }

        self.workers[worker_index].assigned_building = Some(building_id.to_string());

        let efficiency = self.calculate_worker_efficiency_multiplier(worker_index, building_id);
        self.workers[worker_index].efficiency_multiplier = efficiency;

        self.refresh_progression_state();
        self.update_production();

        true
    }

    #[wasm_bindgen]
    pub fn perform_maggot_limb_surgery(&mut self, worker_index: usize) -> bool {
        if worker_index >= self.workers.len() {
            return false;
        }

        let (can_perform, cost, _) =
            self.get_maggot_limb_surgery_status(&self.workers[worker_index]);
        if !can_perform {
            return false;
        }

        {
            let mut state = self.state.borrow_mut();
            state.add_resource(ResourceType::Maggot, -cost);
        }

        let assigned_building = {
            let worker = &mut self.workers[worker_index];
            let replaced_limbs = worker.missing_limbs.clone();
            worker.missing_limbs.clear();
            for limb in replaced_limbs {
                if !worker.maggot_limbs.contains(&limb) {
                    worker.maggot_limbs.push(limb);
                }
            }
            worker.happiness = (worker.happiness + 6.0).clamp(0.0, 100.0);
            worker.focus = (worker.focus + 4.0).clamp(0.0, 100.0);
            worker.fatigue = (worker.fatigue + 10.0).clamp(0.0, 100.0);
            worker.stress = (worker.stress + 6.0).clamp(0.0, 100.0);
            worker.assigned_building.clone()
        };

        if let Some(building_id) = assigned_building {
            let efficiency =
                self.calculate_worker_efficiency_multiplier(worker_index, &building_id);
            self.workers[worker_index].efficiency_multiplier = efficiency;
        }

        self.refresh_progression_state();
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
}
