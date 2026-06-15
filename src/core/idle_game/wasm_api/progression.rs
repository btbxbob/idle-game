use super::super::*;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
impl IdleGame {
    pub fn unlock_feature(&mut self, feature_id: &str) -> bool {
        if !self.check_unlock(feature_id) {
            return false;
        }

        let next_stage = match stage_from_unlock_id(feature_id) {
            Some(stage) => stage,
            None => return false,
        };

        let mut state = self.state.borrow_mut();
        if state.current_stage >= next_stage {
            return true;
        }
        state.current_stage = next_stage;
        drop(state);

        if next_stage == GameStage::Workers && self.workers.is_empty() {
            self.workers.push(Worker::new(
                "新工人",
                "survival",
                "刚刚加入聚落的幸存者",
                "农场",
            ));
        }

        self.refresh_progression_state();
        true
    }

    #[wasm_bindgen]
    pub fn get_unlocks(&self) -> JsValue {
        let state = self.state.borrow().clone();
        let statistics = self.statistics.borrow().clone();
        let unlocks = stage::visible_unlocks(
            &state,
            &statistics,
            &self.workers,
            &self.buildings,
            &self.technology_tree,
        );
        serde_wasm_bindgen::to_value(&unlocks).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen(js_name = getUnlockProgress)]
    pub fn get_unlock_progress(&self, feature_id: &str) -> JsValue {
        let state = self.state.borrow().clone();
        let statistics = self.statistics.borrow().clone();
        let unlocks = stage::visible_unlocks(
            &state,
            &statistics,
            &self.workers,
            &self.buildings,
            &self.technology_tree,
        );

        let progress = if let Some(unlock) = unlocks.iter().find(|unlock| unlock.id == feature_id) {
            let current = stage::requirement_progress(
                &unlock.requirement_type,
                &state,
                &statistics,
                &self.workers,
                &self.technology_tree,
            ) * unlock.requirement_value;
            UnlockProgressView {
                current,
                required: unlock.requirement_value,
                percentage: stage::requirement_progress(
                    &unlock.requirement_type,
                    &state,
                    &statistics,
                    &self.workers,
                    &self.technology_tree,
                ) * 100.0,
            }
        } else {
            UnlockProgressView {
                current: 0.0,
                required: 1.0,
                percentage: 0.0,
            }
        };

        progress
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen(js_name = getUnlockRequirementDetails)]
    pub fn get_unlock_requirement_details(&self, feature_id: &str) -> JsValue {
        let state = self.state.borrow().clone();
        let statistics = self.statistics.borrow().clone();
        let unlocks = stage::visible_unlocks(
            &state,
            &statistics,
            &self.workers,
            &self.buildings,
            &self.technology_tree,
        );

        let Some(unlock) = unlocks.iter().find(|unlock| unlock.id == feature_id) else {
            return JsValue::NULL;
        };

        let details = stage::requirement_details(
            &unlock.requirement_type,
            unlock.requirement_value,
            &state,
            &statistics,
            &self.workers,
            &self.technology_tree,
        );

        details
            .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
            .unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen(js_name = getProgressionStateJson)]
    pub fn get_progression_state_json(&self) -> String {
        let state = self.state.borrow();
        let view = ProgressionStateView {
            current_stage_id: state.current_stage.id().to_string(),
            current_stage_name: state.current_stage.name().to_string(),
            current_stage_description: state.current_stage.short_description().to_string(),
            human_pressure: state.coexistence.human_pressure,
            maggot_influence: state.coexistence.maggot_influence,
            symbiosis_stability: state.coexistence.symbiosis_stability,
            hybrid_population: state.coexistence.hybrid_population,
            collective_consciousness: state.coexistence.collective_consciousness,
        };
        serde_json::to_string(&view).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen(js_name = getCurrentObjectiveChainJson)]
    pub fn get_current_objective_chain_json(&self) -> String {
        let view = self.get_worker_objective_chain_view();
        serde_json::to_string(&view).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn reset_game(&mut self) {
        let fresh_game = IdleGame::new();

        {
            let fresh_state = fresh_game.state.borrow().clone();
            let mut state = self.state.borrow_mut();
            *state = fresh_state;
        }

        {
            let fresh_statistics = fresh_game.statistics.borrow().clone();
            let mut statistics = self.statistics.borrow_mut();
            *statistics = fresh_statistics;
        }

        self.buildings = fresh_game.buildings;
        self.housing_buildings = fresh_game.housing_buildings;
        self.workers = fresh_game.workers;
        self.population_queue = fresh_game.population_queue;
        self.last_food_consumption_time = fresh_game.last_food_consumption_time;
        self.last_worker_spawn_time = fresh_game.last_worker_spawn_time;
        self.achievements = fresh_game.achievements;
        self.unlocked_features = fresh_game.unlocked_features;
        self.technology_tree = fresh_game.technology_tree;

        self.update_production();
        self.update_ui();
    }

    #[wasm_bindgen(js_name = get_achievements)]
    pub fn get_achievements_js(&self) -> JsValue {
        match serde_wasm_bindgen::to_value(&self.achievements) {
            Ok(val) => val,
            Err(_) => JsValue::NULL,
        }
    }

    #[wasm_bindgen(js_name = getStatistics)]
    pub fn get_statistics_js(&self) -> JsValue {
        let stats = self.statistics.borrow().clone();
        match serde_wasm_bindgen::to_value(&stats) {
            Ok(val) => val,
            Err(_) => JsValue::NULL,
        }
    }

    #[wasm_bindgen]
    pub fn get_statistics(&self) -> JsValue {
        self.get_statistics_js()
    }

    #[wasm_bindgen]
    pub fn do_prestige(&mut self, pp_gain: f64) -> bool {
        if !pp_gain.is_finite() || pp_gain <= 0.0 {
            return false;
        }

        self.reset_game();
        let mut state = self.state.borrow_mut();
        state.prestige_points += pp_gain;
        state.prestige_multiplier = 1.0 + state.prestige_points * 0.01;
        true
    }

    #[wasm_bindgen]
    pub fn get_prestige_points(&self) -> f64 {
        let state = self.state.borrow();
        state.prestige_points
    }

    #[wasm_bindgen]
    pub fn get_prestige_multiplier(&self) -> f64 {
        let state = self.state.borrow();
        state.prestige_multiplier
    }

    #[wasm_bindgen]
    pub fn calculate_prestige_gain(&self) -> f64 {
        let state = self.state.borrow();
        let coins = state.get_coins();
        let threshold = 1_000_000.0;
        if coins < threshold {
            return 0.0;
        }
        let excess = coins - threshold;
        (excess / 100_000.0).floor() + 1.0
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
                state.get_coins(),
                state.get_wood(),
                state.get_stone(),
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
        let state = self.state.borrow().clone();
        let stats = self.statistics.borrow().clone();
        stage::can_unlock_stage(
            feature_id,
            &state,
            &stats,
            &self.workers,
            &self.technology_tree,
        )
    }
}
