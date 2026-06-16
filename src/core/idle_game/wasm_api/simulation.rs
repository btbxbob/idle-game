use super::super::*;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
impl IdleGame {
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

    pub(crate) fn update_production(&mut self) {
        let updated_efficiencies: Vec<f64> = self
            .workers
            .iter()
            .map(|worker| {
                worker
                    .assigned_building
                    .as_deref()
                    .map(|assigned_building| {
                        self.calculate_worker_efficiency_for(worker, assigned_building)
                    })
                    .unwrap_or(1.0)
            })
            .collect();

        for (worker, efficiency) in self
            .workers
            .iter_mut()
            .zip(updated_efficiencies.into_iter())
        {
            worker.efficiency_multiplier = efficiency;
        }

        let mut total_cps = 0.0;
        let mut total_wps = 0.0;
        let mut total_sps = 0.0;

        for building in &self.buildings {
            let base_production = building.production_rate * building.count as f64;
            let worker_bonus = self.get_worker_bonus_for_building(&building.name);
            let boosted_production = base_production * worker_bonus;

            match building.output_resource {
                ResourceType::Gold => {
                    total_cps += boosted_production;
                }
                ResourceType::Wood => {
                    total_wps += boosted_production;
                }
                ResourceType::Stone => {
                    total_sps += boosted_production;
                }
                _ => {}
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

        let now = Date::now();
        let modifier_totals = {
            let state = self.state.borrow();
            event::active_modifier_totals(&state, now)
        };

        total_cps = (total_cps + modifier_totals.coins_per_second_delta).max(0.0);
        total_wps = (total_wps + modifier_totals.wood_per_second_delta).max(0.0);
        total_sps = (total_sps + modifier_totals.stone_per_second_delta).max(0.0);

        let mut state = self.state.borrow_mut();
        state.coins_per_second = total_cps;
        state.wood_per_second = total_wps;
        state.stone_per_second = total_sps;
    }

    pub(crate) fn get_housing_capacity_internal(&self) -> u32 {
        self.housing_buildings
            .iter()
            .map(|h| h.capacity * h.count.max(1))
            .sum()
    }

    fn process_housing_queue(&mut self) {
        let capacity = self.get_housing_capacity_internal() as usize;
        while self.workers.len() < capacity {
            match self.population_queue.pop_front() {
                Some(worker) => self.workers.push(worker),
                None => break,
            }
        }
    }

    fn try_spawn_worker(&mut self, now: f64) {
        const WORKER_SPAWN_INTERVAL_MS: f64 = 30_000.0;
        if self.state.borrow().current_stage < GameStage::Workers {
            return;
        }
        if now - self.last_worker_spawn_time < WORKER_SPAWN_INTERVAL_MS {
            return;
        }

        self.last_worker_spawn_time = now;
        let worker = WorkerGenerator::generate_random_worker();
        let capacity = self.get_housing_capacity_internal() as usize;
        if self.workers.len() < capacity {
            self.workers.push(worker);
        } else {
            self.population_queue.push_back(worker);
        }

        self.assign_worker_auto();
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

                    let Some(assigned) = self.workers[i].assigned_building.clone() else {
                        continue;
                    };
                    self.workers[i].efficiency_multiplier =
                        self.calculate_worker_efficiency_for(&self.workers[i], &assigned);
                }
            }
        }

        // Don't call update_production here to avoid borrow conflicts
        // Caller should call it after releasing other borrows
    }

    #[wasm_bindgen]
    pub fn game_loop(&mut self) {
        let now = Date::now();

        // Get technology bonuses
        let tech_bonuses = self.technology_tree.calculate_bonuses();

        // Get production rates from production system BEFORE borrowing state mutably
        let production =
            production::update_production(&self.buildings, &self.workers, &tech_bonuses);

        let active_modifier_totals = {
            let state = self.state.borrow();
            event::active_modifier_totals(&state, now)
        };

        let (new_coins, new_wood, new_stone, new_last_update_time, elapsed) = {
            let state = self.state.borrow();
            let elapsed = (now - state.last_update_time) / 1000.0;

            if elapsed > 0.0 && elapsed < 3600.0 {
                // Use production[0] for coins, production[1] for wood, production[2] for stone
                let mut new_coins = state.get_coins()
                    + (production[0] + active_modifier_totals.coins_per_second_delta) * elapsed;
                let new_wood = state.get_wood()
                    + (production[1] + active_modifier_totals.wood_per_second_delta) * elapsed;
                let new_stone = state.get_stone()
                    + (production[2] + active_modifier_totals.stone_per_second_delta) * elapsed;

                new_coins = new_coins.max(0.0);

                (new_coins, new_wood, new_stone, now, elapsed)
            } else {
                (
                    state.get_coins(),
                    state.get_wood(),
                    state.get_stone(),
                    state.last_update_time,
                    0.0,
                )
            }
        };

        let mut processed_outputs = 0u32;
        {
            let mut state = self.state.borrow_mut();
            let current_coins = state.get_coins();
            let current_wood = state.get_wood();
            let current_stone = state.get_stone();

            state.set_coins(if new_coins.is_finite() {
                new_coins
            } else {
                current_coins
            });
            state.set_wood(if new_wood.is_finite() {
                new_wood
            } else {
                current_wood
            });
            state.set_stone(if new_stone.is_finite() {
                new_stone
            } else {
                current_stone
            });

            for (resource, index) in production_resource_slots() {
                let gain = production[*index] * elapsed;
                if gain.is_finite() && gain > 0.0 {
                    let input_requirements = production_input_requirements(*resource);
                    if input_requirements.is_empty() {
                        state.add_resource(*resource, gain);
                        if matches!(
                            *resource,
                            ResourceType::IronIngot
                                | ResourceType::CopperIngot
                                | ResourceType::Chemicals
                                | ResourceType::SteelPlate
                                | ResourceType::Glass
                                | ResourceType::Plastic
                                | ResourceType::CircuitBoard
                                | ResourceType::Motor
                                | ResourceType::Sensor
                                | ResourceType::Gear
                                | ResourceType::Battery
                                | ResourceType::Generator
                                | ResourceType::Microchip
                                | ResourceType::QuantumComputer
                                | ResourceType::Robot
                                | ResourceType::Nanobot
                                | ResourceType::Antimatter
                                | ResourceType::TimeCrystal
                                | ResourceType::DarkMatter
                                | ResourceType::Spaceship
                        ) {
                            processed_outputs += 1;
                        }
                        continue;
                    }

                    let can_produce =
                        input_requirements
                            .iter()
                            .all(|(input_resource, amount_per_unit)| {
                                let required_amount = gain * amount_per_unit;
                                state.get_resource(*input_resource) + 1e-10 >= required_amount
                            });

                    if can_produce {
                        for (input_resource, amount_per_unit) in input_requirements {
                            state.add_resource(*input_resource, -(gain * amount_per_unit));
                        }
                        state.add_resource(*resource, gain);
                        processed_outputs += 1;
                    }
                }
            }

            state.last_update_time = new_last_update_time;
            let _ = event::tick_active_modifiers(&mut state, now, elapsed);
        }

        // Update statistics (release borrow before calling other methods)
        if elapsed > 0.0 {
            {
                let mut stats = self.statistics.borrow_mut();
                stats.play_time_seconds += elapsed;
                stats.total_resources_crafted += processed_outputs;
            }

            // Grant XP to assigned workers based on production
            self.grant_worker_xp(elapsed);

            // Update production after worker XP changes (must be after grant_worker_xp)
            self.update_production();
            // Food consumption and starvation check
            {
                let mut state = self.state.borrow_mut();
                let mut last_consumption = self.last_food_consumption_time;
                let _hungry = crate::systems::population::consume_food_for_workers(
                    &mut self.workers,
                    &mut state.resources,
                    now,
                    &mut last_consumption,
                );
                self.last_food_consumption_time = last_consumption;

                if state.current_stage >= GameStage::Maggot {
                    let safe_maggot_diet = self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::NecroticRecycling);
                    let mut available_maggots = state.get_resource(ResourceType::Maggot);
                    let mut corpse_gain = 0.0;
                    let mut indices_to_remove = Vec::new();

                    for (idx, worker) in self.workers.iter_mut().enumerate() {
                        if !worker.is_hungry || available_maggots < 1.0 {
                            continue;
                        }

                        available_maggots -= 1.0;
                        worker.is_hungry = false;
                        worker.starvation_start_time = 0.0;
                        worker.hunger = (worker.hunger - 35.0).clamp(0.0, 100.0);

                        if !safe_maggot_diet {
                            worker.happiness = (worker.happiness - 10.0).clamp(0.0, 100.0);
                            worker.health = (worker.health - 14.0).clamp(0.0, 100.0);
                            worker.stress = (worker.stress + 6.0).clamp(0.0, 100.0);
                            worker.focus = (worker.focus - 4.0).clamp(0.0, 100.0);
                        }

                        if worker.happiness <= 0.0 || worker.health <= 0.0 {
                            indices_to_remove.push(idx);
                            corpse_gain += 1.0;
                        }
                    }

                    state.set_resource(ResourceType::Maggot, available_maggots);
                    if corpse_gain > 0.0 {
                        state.add_resource(ResourceType::Corpse, corpse_gain);
                    }
                    for idx in indices_to_remove.into_iter().rev() {
                        self.workers.remove(idx);
                    }
                }

                let mut corpse_decay_time = 0.0;
                let _deaths = crate::systems::population::check_worker_starvation_deaths(
                    &mut self.workers,
                    &mut state.resources,
                    now,
                    &mut corpse_decay_time,
                );
            }
            self.refresh_worker_state(elapsed);
            self.update_production();
            // Corpse decay: produce maggots from corpses
            {
                let mut state = self.state.borrow_mut();
                crate::systems::decay::produce_maggots(&mut state, now);

                let larva_trough = self.buildings.iter().find(|b| b.name == "腐食育蛆槽");
                let larva_trough_count = larva_trough.map(|b| b.count as f64).unwrap_or(0.0);
                let maggot_factory = self.buildings.iter().find(|b| b.name == "蛆虫工厂");
                let maggot_factory_count = maggot_factory.map(|b| b.count as f64).unwrap_or(0.0);
                let necrotic_pool = self.buildings.iter().find(|b| b.name == "腐肉育池");
                let necrotic_pool_count = necrotic_pool.map(|b| b.count as f64).unwrap_or(0.0);
                let symbiosis_chamber = self.buildings.iter().find(|b| b.name == "共生培育舱");
                let symbiosis_chamber_count =
                    symbiosis_chamber.map(|b| b.count as f64).unwrap_or(0.0);
                let symbiosis_chamber_output = symbiosis_chamber
                    .map(|b| b.production_rate * b.count as f64)
                    .unwrap_or(0.0);
                let neural_spire = self.buildings.iter().find(|b| b.name == "神经尖塔");
                let neural_spire_count = neural_spire.map(|b| b.count as f64).unwrap_or(0.0);
                let neural_spire_output = neural_spire
                    .map(|b| b.production_rate * b.count as f64)
                    .unwrap_or(0.0);
                let deep_space_hatchery = self.buildings.iter().find(|b| b.name == "深空孵化港");
                let deep_space_hatchery_count =
                    deep_space_hatchery.map(|b| b.count as f64).unwrap_or(0.0);
                let deep_space_hatchery_output = deep_space_hatchery
                    .map(|b| b.production_rate * b.count as f64)
                    .unwrap_or(0.0);

                let current_food = state.get_resource(ResourceType::Food);
                let spoilable_food = (current_food - 120.0).max(0.0);
                if spoilable_food > 0.0 {
                    let spoiled_food = (spoilable_food * 0.015 * elapsed).min(6.0 * elapsed);
                    if spoiled_food.is_finite() && spoiled_food > 0.0 {
                        state.add_resource(ResourceType::Food, -spoiled_food);
                        state.add_resource(ResourceType::Maggot, spoiled_food / 4.0);
                    }
                }

                if larva_trough_count > 0.0 {
                    let available_food = state.get_resource(ResourceType::Food);
                    let max_food_process = 3.0 * larva_trough_count * elapsed;
                    let process_amount = available_food.min(max_food_process).max(0.0);
                    if process_amount > 0.0 {
                        state.add_resource(ResourceType::Food, -process_amount);
                        state.add_resource(ResourceType::Maggot, process_amount / 2.0);
                    }
                }

                let maggot_gain = (maggot_factory_count + (necrotic_pool_count * 0.5)) * elapsed;
                if maggot_gain.is_finite() && maggot_gain > 0.0 {
                    state.add_resource(ResourceType::Maggot, maggot_gain);
                }

                if maggot_factory_count > 0.0 {
                    state.objective_chain.dark_conversion_completed = true;
                    if !state
                        .objective_chain
                        .completed_steps
                        .iter()
                        .any(|completed| completed == "complete_dark_conversion")
                    {
                        state
                            .objective_chain
                            .completed_steps
                            .push("complete_dark_conversion".to_string());
                    }
                }

                if necrotic_pool_count > 0.0
                    && self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::NecroticRecycling)
                {
                    let current_maggot = state.get_resource(ResourceType::Maggot);
                    let process_amount = current_maggot
                        .min(8.0 * necrotic_pool_count * elapsed)
                        .max(0.0);
                    if process_amount > 0.0 {
                        state.add_resource(ResourceType::Maggot, -process_amount);
                        state.add_resource(ResourceType::Food, process_amount / 16.0);
                        state.add_resource(ResourceType::Chemicals, process_amount / 8.0);
                        state.objective_chain.dark_conversion_completed = true;
                        if !state
                            .objective_chain
                            .completed_steps
                            .iter()
                            .any(|completed| completed == "complete_dark_conversion")
                        {
                            state
                                .objective_chain
                                .completed_steps
                                .push("complete_dark_conversion".to_string());
                        }
                    }
                }

                if symbiosis_chamber_count > 0.0
                    && self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::SymbioticHosts)
                {
                    state.coexistence.hybrid_population = (state.coexistence.hybrid_population
                        + (symbiosis_chamber_output * 0.004 * elapsed))
                        .clamp(0.0, 24.0);
                    state.coexistence.symbiosis_stability = (state.coexistence.symbiosis_stability
                        + (symbiosis_chamber_output * 0.01 * elapsed))
                        .clamp(0.0, 100.0);
                }

                if neural_spire_count > 0.0
                    && self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::CollectiveAwakening)
                {
                    state.add_resource(ResourceType::DarkMatter, neural_spire_output * elapsed);
                }

                if deep_space_hatchery_count > 0.0
                    && self
                        .technology_tree
                        .is_unlocked(crate::entities::technology::TechnologyId::ConsciousnessUpload)
                {
                    state.add_resource(
                        ResourceType::Spaceship,
                        deep_space_hatchery_output * elapsed,
                    );
                }
            }

            self.process_housing_queue();
            self.try_spawn_worker(now);

            let stage_snapshot = self.state.borrow().clone();
            let coexistence = stage::update_coexistence(
                &stage_snapshot.coexistence,
                &stage_snapshot,
                &self.workers,
                &self.buildings,
                &self.technology_tree,
                elapsed,
            );
            {
                let mut state = self.state.borrow_mut();
                state.coexistence = coexistence.clone();

                if state.current_stage >= GameStage::Hybrid {
                    let food_bonus = (coexistence.hybrid_population * 0.08)
                        + (coexistence.symbiosis_stability * 0.01);
                    let gold_bonus = coexistence.hybrid_population * 0.03;
                    if food_bonus > 0.0 {
                        state.add_resource(ResourceType::Food, food_bonus * elapsed);
                    }
                    if gold_bonus > 0.0 {
                        state.add_resource(ResourceType::Gold, gold_bonus * elapsed);
                    }
                }

                if state.current_stage >= GameStage::Collective {
                    let dark_bonus = (coexistence.collective_consciousness * 0.0025)
                        + (coexistence.hybrid_population * 0.01);
                    if dark_bonus > 0.0 {
                        state.add_resource(ResourceType::DarkMatter, dark_bonus * elapsed);
                    }
                }
            }

            {
                let mut state = self.state.borrow_mut();
                let _ = event::maybe_generate_event(
                    &mut state,
                    &mut self.workers,
                    &self.buildings,
                    &self.technology_tree,
                    now,
                );
            }
        }

        self.refresh_progression_state();

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
    pub fn update_buildings_only(&self) {
        let window = match web_sys::window() {
            Some(win) => win,
            None => return,
        };
        let global_obj = window.as_ref();

        let buildings_serialized = self.get_buildings();
        if buildings_serialized.is_null() {
            return;
        }
        let update_buildings_result =
            js_sys::Reflect::get(global_obj, &"updateBuildingDisplay".into());
        if let Ok(update_func) = update_buildings_result {
            let update_buildings: js_sys::Function = update_func.into();
            let coins = self.get_coins();
            let _ = update_buildings.call2(
                &JsValue::NULL,
                &buildings_serialized,
                &JsValue::from_f64(coins),
            );
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

        let buildings_serialized = self.get_buildings();
        if buildings_serialized.is_null() {
            return;
        }
        let update_buildings_result =
            js_sys::Reflect::get(global_obj, &"updateBuildingDisplay".into());
        if let Ok(update_func) = update_buildings_result {
            let update_buildings: js_sys::Function = update_func.into();
            let coins = self.get_coins();
            let _ = update_buildings.call2(
                &JsValue::NULL,
                &buildings_serialized,
                &JsValue::from_f64(coins),
            );
        }
    }
}
