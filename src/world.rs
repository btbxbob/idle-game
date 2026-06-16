use crate::config::{BalanceConfig, ContentManager};
use crate::core::IdleGame;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct World {
    game: IdleGame,
    #[allow(dead_code)]
    config: BalanceConfig,
    content: ContentManager,
    language: String,
}

#[wasm_bindgen]
impl World {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<World, JsValue> {
        let config = BalanceConfig::load()
            .map_err(|e| JsValue::from_str(&e))?;

        Ok(World {
            game: IdleGame::new(),
            config,
            content: ContentManager::new_empty(),
            language: "zh-CN".to_string(),
        })
    }

    pub fn load_content(
        &mut self,
        lang: &str,
        buildings_json: &str,
        resources_json: &str,
        technologies_json: &str,
    ) -> Result<(), JsValue> {
        self.content.load_language(lang, buildings_json, resources_json, technologies_json)
            .map_err(|e| JsValue::from_str(&e))
    }

    pub fn game_loop(&mut self) {
        self.game.game_loop();
    }

    pub fn click_action(&mut self) {
        self.game.click_action();
    }

    pub fn buy_building(&mut self, index: usize) -> bool {
        self.game.buy_building(index)
    }

    pub fn buy_buildings(&mut self, index: usize, count: usize) -> usize {
        self.game.buy_buildings(index, count)
    }

    pub fn research_technology(&mut self, tech_id: &str) -> Result<bool, JsValue> {
        self.game.research_technology(tech_id)
    }

    pub fn assign_worker(&mut self, worker_index: usize, building_id: &str) -> bool {
        self.game.assign_worker(worker_index, building_id)
    }

    pub fn assign_worker_to_building(&mut self, worker_index: usize, building_id: &str) -> bool {
        self.game.assign_worker_to_building(worker_index, building_id)
    }

    pub fn assign_worker_auto(&mut self) -> u32 {
        self.game.assign_worker_auto()
    }

    pub fn do_prestige(&mut self, pp_gain: f64) -> bool {
        self.game.do_prestige(pp_gain)
    }

    pub fn get_prestige_points(&self) -> f64 {
        self.game.get_prestige_points()
    }

    pub fn get_prestige_multiplier(&self) -> f64 {
        self.game.get_prestige_multiplier()
    }

    pub fn calculate_prestige_gain(&self) -> f64 {
        self.game.calculate_prestige_gain()
    }

    pub fn get_ui_snapshot(&self) -> JsValue {
        let obj = js_sys::Object::new();

        js_sys::Reflect::set(&obj, &"resources".into(), &self.game.get_resources()).ok();
        js_sys::Reflect::set(&obj, &"buildings".into(), &self.game.get_buildings()).ok();
        js_sys::Reflect::set(&obj, &"workers".into(), &self.game.get_workers()).ok();
        js_sys::Reflect::set(&obj, &"technologies".into(), &self.game.get_technologies().unwrap_or(JsValue::NULL)).ok();
        js_sys::Reflect::set(&obj, &"statistics".into(), &self.game.get_statistics()).ok();

        let prestige = js_sys::Object::new();
        js_sys::Reflect::set(&prestige, &"currentPp".into(), &JsValue::from_f64(self.game.get_prestige_points())).ok();
        js_sys::Reflect::set(&prestige, &"multiplier".into(), &JsValue::from_f64(self.game.get_prestige_multiplier())).ok();
        js_sys::Reflect::set(&prestige, &"ppOnRebirth".into(), &JsValue::from_f64(self.game.calculate_prestige_gain())).ok();
        js_sys::Reflect::set(&obj, &"prestige".into(), &prestige).ok();

        js_sys::Reflect::set(&obj, &"totalClicks".into(), &JsValue::from_f64(self.game.get_total_clicks() as f64)).ok();

        obj.into()
    }

    pub fn save_to_local_storage(&self) -> Result<(), JsValue> {
        self.game.save_to_local_storage()
    }

    #[wasm_bindgen(js_name = saveToLocalStorage)]
    pub fn save_to_local_storage_camel(&self) -> Result<(), JsValue> {
        self.game.save_to_local_storage()
    }

    pub fn load_from_local_storage(&mut self) -> Result<bool, JsValue> {
        self.game.load_from_local_storage()
    }

    #[wasm_bindgen(js_name = loadFromLocalStorage)]
    pub fn load_from_local_storage_camel(&mut self) -> Result<bool, JsValue> {
        self.game.load_from_local_storage()
    }

    pub fn set_language(&mut self, lang: &str) {
        self.language = lang.to_string();
    }

    pub fn get_content_json(&self) -> String {
        let content = if self.language == "en" { self.content.en.as_ref() } else { self.content.zh_cn.as_ref() };
        let Some(content) = content else {
            return "{}".to_string();
        };

        let buildings: serde_json::Map<String, serde_json::Value> = content.buildings.primary.iter()
            .chain(content.buildings.processing.iter())
            .chain(content.buildings.dark.iter())
            .map(|(id, bt)| (id.clone(), serde_json::Value::String(bt.name.clone())))
            .collect();

        let resources: serde_json::Map<String, serde_json::Value> = content.resources.tier1.iter()
            .chain(content.resources.tier2.iter())
            .chain(content.resources.tier3.iter())
            .chain(content.resources.special.iter())
            .map(|(id, rt)| (id.clone(), serde_json::Value::String(rt.name.clone())))
            .collect();

        let technologies: serde_json::Map<String, serde_json::Value> = content.technologies.tier1.iter()
            .chain(content.technologies.tier2.iter())
            .chain(content.technologies.tier3.iter())
            .chain(content.technologies.tier4.iter())
            .map(|(id, tt)| (id.clone(), serde_json::Value::String(tt.name.clone())))
            .collect();

        let mut root = serde_json::Map::new();
        root.insert("buildings".to_string(), serde_json::Value::Object(buildings));
        root.insert("resources".to_string(), serde_json::Value::Object(resources));
        root.insert("technologies".to_string(), serde_json::Value::Object(technologies));

        serde_json::to_string(&serde_json::Value::Object(root)).unwrap_or_else(|_| "{}".to_string())
    }

    pub fn get_coins(&self) -> f64 {
        self.game.get_coins()
    }

    pub fn get_wood(&self) -> f64 {
        self.game.get_wood()
    }

    pub fn get_stone(&self) -> f64 {
        self.game.get_stone()
    }

    pub fn get_total_clicks(&self) -> u32 {
        self.game.get_total_clicks()
    }

    pub fn export_to_base64(&self) -> Result<String, JsValue> {
        self.game.export_to_base64()
    }

    #[wasm_bindgen(js_name = exportToBase64)]
    pub fn export_to_base64_camel(&self) -> Result<String, JsValue> {
        self.game.export_to_base64()
    }

    pub fn import_from_base64(&mut self, data: &str) -> Result<(), JsValue> {
        self.game.import_from_base64(data)
    }

    #[wasm_bindgen(js_name = importFromBase64)]
    pub fn import_from_base64_camel(&mut self, data: &str) -> Result<(), JsValue> {
        self.game.import_from_base64(data)
    }

    pub fn reset_game(&mut self) {
        self.game.reset_game();
    }

    pub fn get_resources(&self) -> JsValue {
        self.game.get_resources()
    }

    pub fn get_buildings(&self) -> JsValue {
        self.game.get_buildings()
    }

    pub fn get_workers(&self) -> js_sys::Array {
        self.game.get_workers()
    }

    pub fn get_technologies(&self) -> Result<JsValue, JsValue> {
        self.game.get_technologies()
    }

    pub fn get_statistics(&self) -> JsValue {
        self.game.get_statistics()
    }

    #[wasm_bindgen(js_name = getStatistics)]
    pub fn get_statistics_camel(&self) -> JsValue {
        self.game.get_statistics()
    }

    pub fn get_achievements(&self) -> JsValue {
        self.game.get_achievements_js()
    }

    pub fn get_progression_state_json(&self) -> String {
        self.game.get_progression_state_json()
    }

    #[wasm_bindgen(js_name = getProgressionStateJson)]
    pub fn get_progression_state_json_camel(&self) -> String {
        self.game.get_progression_state_json()
    }

    pub fn get_current_objective_chain_json(&self) -> String {
        self.game.get_current_objective_chain_json()
    }

    #[wasm_bindgen(js_name = getCurrentObjectiveChainJson)]
    pub fn get_current_objective_chain_json_camel(&self) -> String {
        self.game.get_current_objective_chain_json()
    }

    pub fn get_unlocks(&self) -> JsValue {
        self.game.get_unlocks()
    }

    pub fn get_unlock_progress(&self, feature_id: &str) -> JsValue {
        self.game.get_unlock_progress(feature_id)
    }

    #[wasm_bindgen(js_name = getUnlockProgress)]
    pub fn get_unlock_progress_camel(&self, feature_id: &str) -> JsValue {
        self.game.get_unlock_progress(feature_id)
    }

    pub fn get_unlock_requirement_details(&self, feature_id: &str) -> JsValue {
        self.game.get_unlock_requirement_details(feature_id)
    }

    #[wasm_bindgen(js_name = getUnlockRequirementDetails)]
    pub fn get_unlock_requirement_details_camel(&self, feature_id: &str) -> JsValue {
        self.game.get_unlock_requirement_details(feature_id)
    }

    pub fn get_work_overview_json(&self) -> String {
        self.game.get_work_overview_json()
    }

    pub fn get_housing(&self) -> JsValue {
        self.game.get_housing()
    }

    pub fn build_housing(&mut self, cost: JsValue) -> Result<bool, String> {
        self.game.build_housing(cost)
    }

    pub fn get_lifecycle_status_json(&self) -> String {
        self.game.get_lifecycle_status_json()
    }

    pub fn update_ui(&self) {
        self.game.update_ui()
    }

    pub fn get_coins_per_second(&self) -> f64 {
        self.game.get_coins_per_second()
    }

    pub fn get_wood_per_second(&self) -> f64 {
        self.game.get_wood_per_second()
    }

    pub fn get_stone_per_second(&self) -> f64 {
        self.game.get_stone_per_second()
    }

    pub fn get_coins_per_click(&self) -> f64 {
        self.game.get_coins_per_click()
    }

    pub fn get_housing_capacity(&self) -> u32 {
        self.game.get_housing_capacity()
    }

    pub fn get_housing_occupied(&self) -> u32 {
        self.game.get_housing_occupied()
    }

    pub fn get_event_log_count(&self) -> usize {
        self.game.get_event_log_count()
    }

    pub fn get_event_log_summaries(&self, offset: usize, limit: usize) -> JsValue {
        self.game.get_event_log_summaries(offset, limit)
    }

    pub fn get_active_event_modifiers(&self) -> JsValue {
        self.game.get_active_event_modifiers()
    }

    pub fn get_breaking_event_titles(&self, limit: usize) -> JsValue {
        self.game.get_breaking_event_titles(limit)
    }

    pub fn get_workers_filtered_json(&self, only_unassigned: bool, sort_by: &str) -> String {
        self.game.get_workers_filtered_json(only_unassigned, sort_by)
    }

    pub fn craft_resource(&mut self, resource_type: &str, count: usize) -> bool {
        self.game.craft_resource(resource_type, count)
    }

    pub fn get_crafting_recipes_json(&self) -> String {
        serde_json::to_string(&self.config.crafting).unwrap_or_else(|_| "{}".to_string())
    }

    pub fn unlock_feature(&mut self, feature_id: &str) -> bool {
        self.game.unlock_feature(feature_id)
    }

    pub fn get_max_affordable_building_count(&self, index: usize) -> usize {
        self.game.get_max_affordable_building_count(index)
    }

    pub fn upgrade_housing(&mut self, building_index: usize) -> Result<bool, String> {
        self.game.upgrade_housing(building_index)
    }

    pub fn perform_maggot_limb_surgery(&mut self, worker_index: usize) -> bool {
        self.game.perform_maggot_limb_surgery(worker_index)
    }

    pub fn get_worker_production_bonus(&self, worker_index: usize) -> f64 {
        self.game.get_worker_production_bonus(worker_index)
    }

    pub fn get_population_overview(&self) -> JsValue {
        self.game.get_population_overview()
    }

    pub fn get_event_log_detail(&self, event_id: u32) -> JsValue {
        self.game.get_event_log_detail(event_id)
    }

    pub fn get_event_catalog_capacity(&self) -> usize {
        self.game.get_event_catalog_capacity()
    }

    pub fn get_worker_count(&self) -> u32 {
        self.game.get_worker_count()
    }

    pub fn get_worker_summaries(&self) -> JsValue {
        self.game.get_worker_summaries()
    }

    pub fn get_worker_page(&self, query: String, filter_by: String, sort_by: String, page: usize, page_size: usize) -> JsValue {
        self.game.get_worker_page(query, filter_by, sort_by, page, page_size)
    }

    pub fn get_building_assignment_counts(&self) -> JsValue {
        self.game.get_building_assignment_counts()
    }

    pub fn get_worker_details(&self, index: usize) -> JsValue {
        self.game.get_worker_details(index)
    }

    pub fn update_resources_only(&self) {
        self.game.update_resources_only()
    }

    pub fn update_buildings_only(&self) {
        self.game.update_buildings_only()
    }

    pub fn check_achievement(&mut self, achievement_id: &str) -> bool {
        self.game.check_achievement(achievement_id)
    }

    pub fn get_technology_tree_json(&self) -> String {
        self.game.get_technology_tree_json()
    }

    pub fn get_available_technologies_json(&self) -> String {
        self.game.get_available_technologies_json()
    }

    pub fn get_population_queue_json(&self) -> String {
        self.game.get_population_queue_json()
    }

    pub fn get_version(&self) -> String {
        self.game.get_version()
    }
}

