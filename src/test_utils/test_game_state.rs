use crate::entities::{Building, Upgrade, Worker};
use crate::state::Statistics;
use crate::systems::{Achievement, CraftingRecipe, UnlockedFeature};

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
