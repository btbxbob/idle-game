use super::*;

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

    /// Export game save to BASE64 string
    #[wasm_bindgen(js_name = exportToBase64)]
    pub fn export_to_base64(&self) -> Result<String, JsValue> {
        let saved_game = self.save_game();

        // Serialize to JSON
        let json_str = serde_json::to_string(&saved_game)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?;

        // Encode to BASE64
        let base64_str = general_purpose::STANDARD.encode(&json_str);
        Ok(base64_str)
    }

    /// Import game save from BASE64 string
    #[wasm_bindgen(js_name = importFromBase64)]
    pub fn import_from_base64(&mut self, base64_str: &str) -> Result<(), JsValue> {
        // Decode from BASE64
        let json_bytes = general_purpose::STANDARD
            .decode(base64_str)
            .map_err(|e| JsValue::from_str(&format!("BASE64 decode error: {}", e)))?;

        let json_str = String::from_utf8(json_bytes)
            .map_err(|e| JsValue::from_str(&format!("UTF8 conversion error: {}", e)))?;

        // Deserialize from JSON
        let saved_game: SavedGame = serde_json::from_str(&json_str)
            .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;

        // Load the saved game state
        self.load_game(saved_game);
        Ok(())
    }

    // ========== Technology System WASM Exports ==========

    #[wasm_bindgen]
    pub fn research_technology(&mut self, tech_id_str: &str) -> Result<bool, JsValue> {
        use crate::entities::technology::TechnologyId;
        let tech_id = match serde_json::from_str::<TechnologyId>(&format!("\"{}\"", tech_id_str)) {
            Ok(id) => id,
            Err(_) => {
                return Err(JsValue::from_str(&format!(
                    "Invalid technology ID: {}",
                    tech_id_str
                )))
            }
        };

        let current_stage = self.state.borrow().current_stage;
        if !stage::is_technology_revealed(tech_id, current_stage) {
            return Err(JsValue::from_str("Technology is still hidden"));
        }

        if !self.technology_tree.can_research(tech_id) {
            return Err(JsValue::from_str(
                "Cannot research: dependencies not met or already purchased",
            ));
        }

        // Check affordability
        {
            let state = self.state.borrow();
            if let Some(tech) = self.technology_tree.technologies.get(&tech_id) {
                for (resource, cost) in &tech.costs {
                    if state.get_resource(*resource) < *cost {
                        return Err(JsValue::from_str(&format!(
                            "Cannot afford: need {} {:?}",
                            cost, resource
                        )));
                    }
                }
            }
        }

        // Deduct costs
        {
            let mut state = self.state.borrow_mut();
            if let Some(tech) = self.technology_tree.technologies.get(&tech_id) {
                for (resource, cost) in &tech.costs {
                    let current = state.get_resource(*resource);
                    state.set_resource(*resource, current - cost);
                }
            }
        }

        // Research
        self.technology_tree
            .research(tech_id)
            .map_err(|e| JsValue::from_str(&e))?;
        self.refresh_progression_state();
        Ok(true)
    }

    #[wasm_bindgen]
    pub fn get_technology_tree_json(&self) -> String {
        serde_json::to_string(&self.technology_tree).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_technologies(&self) -> Result<JsValue, JsValue> {
        let current_stage = self.state.borrow().current_stage;
        let mut technologies = Vec::new();
        for (tech_id, tech) in &self.technology_tree.technologies {
            if !stage::is_technology_revealed(*tech_id, current_stage) {
                continue;
            }
            let dependencies = tech
                .dependencies
                .iter()
                .map(|dep| format!("{:?}", dep))
                .collect::<Vec<_>>();
            let costs = tech
                .costs
                .iter()
                .map(|(resource, amount)| (format!("{:?}", resource), *amount))
                .collect::<HashMap<_, _>>();
            let effect = serde_json::to_value(&tech.effect)
                .unwrap_or_else(|_| serde_json::json!({ "type": "unknown" }));

            technologies.push(TechnologyView {
                id: format!("{:?}", tech_id),
                name: tech.name.clone(),
                description: tech.description.clone(),
                tier: tech.tier(),
                costs,
                dependencies,
                purchased: tech.purchased,
                researched: tech.purchased,
                can_research: self.technology_tree.can_research(*tech_id),
                effect_value: tech.effect_value,
                effect,
            });
        }

        technologies
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize technologies: {}", e)))
    }

    #[wasm_bindgen]
    pub fn get_available_technologies_json(&self) -> String {
        let available = self.technology_tree.get_available_research();
        serde_json::to_string(&available).unwrap_or_else(|_| "[]".to_string())
    }

    // ========== Work Overview WASM Export ==========
    #[wasm_bindgen]
    pub fn get_work_overview_json(&self) -> String {
        use crate::state::job_stats::{JobStats, WorkOverview};
        use std::collections::HashMap;
        let mut job_map: HashMap<String, (u32, f64, f64)> = HashMap::new();
        let mut unassigned = 0u32;
        for worker in &self.workers {
            if let Some(ref building) = worker.assigned_building {
                let building_output = self
                    .buildings
                    .iter()
                    .find(|candidate| candidate.name == *building)
                    .map(|candidate| candidate.production_rate * candidate.count as f64)
                    .unwrap_or(0.0);
                let contribution = building_output * (worker.efficiency_multiplier - 1.0).max(0.0);
                let entry = job_map.entry(building.clone()).or_insert((0, 0.0, 0.0));
                entry.0 += 1;
                entry.1 += worker.efficiency_multiplier;
                entry.2 += contribution;
            } else {
                unassigned += 1;
            }
        }
        let jobs: Vec<JobStats> = job_map
            .into_iter()
            .map(|(job_type, (count, total_eff, total_output))| JobStats {
                job_type,
                worker_count: count,
                avg_efficiency: if count > 0 {
                    total_eff / count as f64
                } else {
                    0.0
                },
                total_output,
            })
            .collect();
        let total_workers = self.workers.len() as u32;
        let total_efficiency: f64 = self.workers.iter().map(|w| w.efficiency_multiplier).sum();
        let overview = WorkOverview {
            jobs,
            unassigned_workers: unassigned,
            total_workers,
            total_efficiency,
        };
        serde_json::to_string(&overview).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_housing_capacity(&self) -> u32 {
        self.get_housing_capacity_internal()
    }

    #[wasm_bindgen]
    pub fn get_housing_occupied(&self) -> u32 {
        self.workers.len() as u32
    }

    #[wasm_bindgen]
    pub fn get_population_queue_json(&self) -> String {
        serde_json::to_string(&self.population_queue).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_lifecycle_status_json(&self) -> String {
        let hungry_workers = self.workers.iter().filter(|w| w.is_hungry).count() as u32;
        let state = self.state.borrow();
        let dark_cycle_revealed = state.current_stage >= GameStage::Maggot;
        let coexistence_revealed = state.current_stage >= GameStage::Hybrid;
        let (anomaly_level, anomaly_text) = self.lifecycle_anomaly_state();
        let status = serde_json::json!({
            "workers": self.workers.len() as u32,
            "hungry_workers": hungry_workers,
            "queue_workers": self.population_queue.len() as u32,
            "housing_capacity": self.get_housing_capacity_internal(),
            "food": state.get_resource(ResourceType::Food),
            "anomaly_level": anomaly_level,
            "anomaly_text": anomaly_text,
            "dark_cycle_revealed": dark_cycle_revealed,
            "coexistence_revealed": coexistence_revealed,
            "corpses": if dark_cycle_revealed { serde_json::Value::from(state.get_resource(ResourceType::Corpse)) } else { serde_json::Value::Null },
            "maggots": if dark_cycle_revealed { serde_json::Value::from(state.get_resource(ResourceType::Maggot)) } else { serde_json::Value::Null },
            "human_pressure": if coexistence_revealed { serde_json::Value::from(state.coexistence.human_pressure) } else { serde_json::Value::Null },
            "maggot_influence": if coexistence_revealed { serde_json::Value::from(state.coexistence.maggot_influence) } else { serde_json::Value::Null },
            "symbiosis_stability": if coexistence_revealed { serde_json::Value::from(state.coexistence.symbiosis_stability) } else { serde_json::Value::Null },
            "hybrid_population": if coexistence_revealed { serde_json::Value::from(state.coexistence.hybrid_population) } else { serde_json::Value::Null }
        });
        serde_json::to_string(&status).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_workers_filtered_json(&self, only_unassigned: bool, sort_by: &str) -> String {
        let mut workers: Vec<&Worker> = self
            .workers
            .iter()
            .filter(|w| !only_unassigned || w.assigned_building.is_none())
            .collect();

        match sort_by {
            "level" => workers.sort_by_key(|w| std::cmp::Reverse(w.level)),
            "efficiency" => workers.sort_by(|a, b| {
                b.efficiency_multiplier
                    .partial_cmp(&a.efficiency_multiplier)
                    .unwrap_or(std::cmp::Ordering::Equal)
            }),
            _ => workers.sort_by(|a, b| a.name.cmp(&b.name)),
        }

        serde_json::to_string(&workers).unwrap_or_else(|_| "[]".to_string())
    }

    /// Get the game version
    #[wasm_bindgen]
    pub fn get_version(&self) -> String {
        env!("CARGO_PKG_VERSION").to_string()
    }

    /// Manually craft a resource by consuming inputs and producing output.
    /// Returns true if crafting succeeded, false if insufficient resources or invalid type.
    #[wasm_bindgen]
    pub fn craft_resource(&mut self, resource_type: &str, count: usize) -> bool {
        let resource: ResourceType = match resource_type {
            "IronIngot" => ResourceType::IronIngot,
            "CopperIngot" => ResourceType::CopperIngot,
            "Chemicals" => ResourceType::Chemicals,
            "SteelPlate" => ResourceType::SteelPlate,
            "Glass" => ResourceType::Glass,
            "Plastic" => ResourceType::Plastic,
            "CircuitBoard" => ResourceType::CircuitBoard,
            "Motor" => ResourceType::Motor,
            "Sensor" => ResourceType::Sensor,
            "Gear" => ResourceType::Gear,
            "Battery" => ResourceType::Battery,
            "Generator" => ResourceType::Generator,
            "Microchip" => ResourceType::Microchip,
            "QuantumComputer" => ResourceType::QuantumComputer,
            "Robot" => ResourceType::Robot,
            "Nanobot" => ResourceType::Nanobot,
            "Antimatter" => ResourceType::Antimatter,
            "DarkMatter" => ResourceType::DarkMatter,
            "TimeCrystal" => ResourceType::TimeCrystal,
            "Spaceship" => ResourceType::Spaceship,
            _ => return false,
        };

        let inputs = production_input_requirements(resource);
        if inputs.is_empty() {
            return false;
        }

        {
            let state = self.state.borrow();
            for (input_res, required_per_unit) in inputs {
                let required = required_per_unit * (count as f64);
                if state.get_resource(*input_res) < required {
                    return false;
                }
            }
        }

        {
            let mut state = self.state.borrow_mut();
            for (input_res, required_per_unit) in inputs {
                let required = required_per_unit * (count as f64);
                let current = state.get_resource(*input_res);
                state.set_resource(*input_res, current - required);
            }
            state.add_resource(resource, count as f64);
        }

        self.update_production();
        true
    }
}
