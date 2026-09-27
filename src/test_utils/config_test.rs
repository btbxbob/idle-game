#[cfg(test)]
mod config_tests {
    use crate::config::BalanceConfig;
    use crate::config::ContentManager;

    #[test]
    fn test_balance_config_loads_successfully() {
        let config = BalanceConfig::load();
        assert!(config.is_ok(), "BalanceConfig should load without errors: {:?}", config.err());
    }

    #[test]
    fn test_balance_config_version() {
        let config = BalanceConfig::load().unwrap();
        assert_eq!(config.version, "1.0.0");
    }

    #[test]
    fn test_balance_config_game_loop() {
        let config = BalanceConfig::load().unwrap();
        assert_eq!(config.game_loop.tick_interval_ms, 250);
        assert_eq!(config.game_loop.auto_save_interval_ms, 15000);
        assert!(config.game_loop.worker_spawn_interval_s > 0.0);
        assert!(config.game_loop.food_consumption_interval_s > 0.0);
    }

    #[test]
    fn test_balance_config_click() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.click.base_coins_per_click > 0.0);
        assert!(config.click.critical_click_multiplier >= 1.0);
        assert!(config.click.critical_click_chance >= 0.0);
    }

    #[test]
    fn test_balance_config_primary_buildings() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.buildings.primary.len() >= 10, "Should have at least 10 primary buildings");

        let gold_mine = config.buildings.primary.get("gold_mine");
        assert!(gold_mine.is_some(), "gold_mine should exist");
        let gold_mine = gold_mine.unwrap();
        assert_eq!(gold_mine.base_cost, 15.0);
        assert_eq!(gold_mine.production_rate, 1.0);
        assert_eq!(gold_mine.output, "Gold");
    }

    #[test]
    fn test_balance_config_processing_buildings() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.buildings.processing.len() >= 10, "Should have at least 10 processing buildings");

        let iron_smelter = config.buildings.processing.get("iron_smelter");
        assert!(iron_smelter.is_some(), "iron_smelter should exist");
    }

    #[test]
    fn test_balance_config_dark_buildings() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.buildings.dark.len() >= 5, "Should have at least 5 dark buildings");
    }

    #[test]
    fn test_balance_config_cost_growth() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.buildings.cost_growth > 1.0, "Cost growth should be > 1.0");
        assert!(config.buildings.cost_growth < 2.0, "Cost growth should be < 2.0");
    }

    #[test]
    fn test_balance_config_crafting_recipes() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.crafting.len() >= 15, "Should have at least 15 crafting recipes");

        let iron_ingot = config.crafting.get("IronIngot");
        assert!(iron_ingot.is_some(), "IronIngot recipe should exist");
        let iron_ingot = iron_ingot.unwrap();
        assert_eq!(iron_ingot.output, 1.0);
        assert!(iron_ingot.inputs.contains_key("IronOre"), "IronIngot should require IronOre");
        assert_eq!(*iron_ingot.inputs.get("IronOre").unwrap(), 10.0);
    }

    #[test]
    fn test_balance_config_advanced_crafting() {
        let config = BalanceConfig::load().unwrap();

        let microchip = config.crafting.get("Microchip");
        assert!(microchip.is_some(), "Microchip recipe should exist");
        let microchip = microchip.unwrap();
        assert!(microchip.inputs.contains_key("Crystal"));
        assert!(microchip.inputs.contains_key("CircuitBoard"));
    }

    #[test]
    fn test_balance_config_workers() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.workers.food_per_consumption > 0.0);
        assert!(config.workers.starvation_threshold_s > 0.0);
        assert!(config.workers.xp_per_second > 0.0);
        assert!(config.workers.xp_growth_per_level > 1.0);
    }

    #[test]
    fn test_balance_config_efficiency() {
        let config = BalanceConfig::load().unwrap();
        let eff = &config.workers.efficiency;
        assert!(eff.preference_match_bonus > 0.0);
        assert!(eff.min_efficiency > 0.0);
        assert!(eff.min_efficiency < 1.0);
    }

    #[test]
    fn test_balance_config_worker_states() {
        let config = BalanceConfig::load().unwrap();
        let states = &config.workers.states;
        assert_eq!(states.initial.happiness, 50.0);
        assert_eq!(states.initial.health, 100.0);
        assert_eq!(states.initial.hunger, 0.0);
    }

    #[test]
    fn test_balance_config_traits() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.traits.len() >= 15, "Should have at least 15 traits");

        let diligent = config.traits.get("Diligent");
        assert!(diligent.is_some(), "Diligent trait should exist");
        let diligent = diligent.unwrap();
        assert!(diligent.efficiency > 0.0, "Diligent should have positive efficiency");

        let lazy = config.traits.get("Lazy");
        assert!(lazy.is_some(), "Lazy trait should exist");
        let lazy = lazy.unwrap();
        assert!(lazy.efficiency < 0.0, "Lazy should have negative efficiency");
    }

    #[test]
    fn test_balance_config_housing() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.housing.catalog.len() >= 5, "Should have at least 5 housing types");

        let shack = &config.housing.catalog[0];
        assert_eq!(shack.id, "shack");
        assert!(shack.capacity > 0);
        assert!(shack.costs.contains_key("Gold"));
    }

    #[test]
    fn test_balance_config_decay() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.decay.maggots_per_corpse > 0.0);
        assert!(config.decay.corpse_decay_per_tick > 0.0);
    }

    #[test]
    fn test_balance_config_prestige() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.prestige.base_threshold > 0.0);
        assert!(config.prestige.multiplier_per_pp > 0.0);
    }

    #[test]
    fn test_balance_config_stages() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.stages.len() >= 3, "Should have at least 3 stages");
        assert!(config.stages.contains_key("genesis"));
        assert!(config.stages.contains_key("workers"));
    }

    #[test]
    fn test_balance_config_tech_effects() {
        let config = BalanceConfig::load().unwrap();
        assert!(config.technology_effects.production_bonus_compound);
        assert!(config.technology_effects.min_cost_multiplier > 0.0);
        assert!(config.technology_effects.min_cost_multiplier < 1.0);
    }

    #[test]
    fn test_get_building_def_primary() {
        let config = BalanceConfig::load().unwrap();
        let def = config.get_building_def("gold_mine");
        assert!(def.is_some());
        assert_eq!(def.unwrap().output, "Gold");
    }

    #[test]
    fn test_get_building_def_processing() {
        let config = BalanceConfig::load().unwrap();
        let def = config.get_building_def("iron_smelter");
        assert!(def.is_some());
    }

    #[test]
    fn test_get_building_def_dark() {
        let config = BalanceConfig::load().unwrap();
        let def = config.get_building_def("maggot_trough");
        assert!(def.is_some());
    }

    #[test]
    fn test_get_building_def_nonexistent() {
        let config = BalanceConfig::load().unwrap();
        let def = config.get_building_def("nonexistent_building");
        assert!(def.is_none());
    }

    #[test]
    fn test_get_crafting_recipe_exists() {
        let config = BalanceConfig::load().unwrap();
        let recipe = config.get_crafting_recipe("IronIngot");
        assert!(recipe.is_some());
    }

    #[test]
    fn test_get_crafting_recipe_nonexistent() {
        let config = BalanceConfig::load().unwrap();
        let recipe = config.get_crafting_recipe("NonexistentResource");
        assert!(recipe.is_none());
    }

    #[test]
    fn test_get_trait_config_exists() {
        let config = BalanceConfig::load().unwrap();
        let trait_config = config.get_trait_config("Efficient");
        assert!(trait_config.is_some());
        assert!(trait_config.unwrap().efficiency > 0.0);
    }

    #[test]
    fn test_get_trait_config_nonexistent() {
        let config = BalanceConfig::load().unwrap();
        let trait_config = config.get_trait_config("NonexistentTrait");
        assert!(trait_config.is_none());
    }

    #[test]
    fn test_content_manager_loads_successfully() {
        let content = ContentManager::load();
        assert!(content.is_ok(), "ContentManager should load without errors: {:?}", content.err());
    }

    #[test]
    fn test_content_manager_zh_building_names() {
        let content = ContentManager::load().unwrap();
        let name = content.get_building_name("gold_mine", "zh-CN");
        assert_eq!(name, "金币矿山");
    }

    #[test]
    fn test_content_manager_en_building_names() {
        let content = ContentManager::load().unwrap();
        let name = content.get_building_name("gold_mine", "en");
        assert_eq!(name, "Gold Mine");
    }

    #[test]
    fn test_content_manager_zh_resource_names() {
        let content = ContentManager::load().unwrap();
        assert_eq!(content.get_resource_name("Gold", "zh-CN"), "金币");
        assert_eq!(content.get_resource_name("Wood", "zh-CN"), "木头");
        assert_eq!(content.get_resource_name("Stone", "zh-CN"), "石头");
    }

    #[test]
    fn test_content_manager_en_resource_names() {
        let content = ContentManager::load().unwrap();
        assert_eq!(content.get_resource_name("Gold", "en"), "Gold");
        assert_eq!(content.get_resource_name("Wood", "en"), "Wood");
    }

    #[test]
    fn test_content_manager_zh_tech_names() {
        let content = ContentManager::load().unwrap();
        assert_eq!(content.get_tech_name("BasicMining", "zh-CN"), "基础采矿");
    }

    #[test]
    fn test_content_manager_en_tech_names() {
        let content = ContentManager::load().unwrap();
        assert_eq!(content.get_tech_name("BasicMining", "en"), "Basic Mining");
    }

    #[test]
    fn test_content_manager_fallback_unknown_building() {
        let content = ContentManager::load().unwrap();
        let name = content.get_building_name("nonexistent_building", "zh-CN");
        assert_eq!(name, "nonexistent_building");
    }

    #[test]
    fn test_content_manager_fallback_unknown_resource() {
        let content = ContentManager::load().unwrap();
        let name = content.get_resource_name("NonexistentResource", "zh-CN");
        assert_eq!(name, "NonexistentResource");
    }

    #[test]
    fn test_content_manager_fallback_unknown_tech() {
        let content = ContentManager::load().unwrap();
        let name = content.get_tech_name("NonexistentTech", "en");
        assert_eq!(name, "NonexistentTech");
    }

    #[test]
    fn test_content_manager_all_processing_buildings_zh() {
        let content = ContentManager::load().unwrap();
        let processing_buildings = vec![
            "iron_smelter", "copper_smelter", "chemical_plant", "steel_mill",
            "glass_factory", "plastic_factory", "circuit_board_factory",
        ];
        for building_id in processing_buildings {
            let name = content.get_building_name(building_id, "zh-CN");
            assert_ne!(name, building_id, "Building {} should have a zh-CN name", building_id);
        }
    }

    #[test]
    fn test_content_manager_all_tier1_resources_zh() {
        let content = ContentManager::load().unwrap();
        let tier1 = vec!["Gold", "Wood", "Stone", "IronOre", "CopperOre", "Coal", "Oil", "Crystal", "Food"];
        for resource_id in tier1 {
            let name = content.get_resource_name(resource_id, "zh-CN");
            assert_ne!(name, resource_id, "Resource {} should have a zh-CN name", resource_id);
        }
    }

    #[test]
    fn test_content_manager_all_tier1_techs_both_langs() {
        let content = ContentManager::load().unwrap();
        let tier1_techs = vec![
            "BasicMining", "AdvancedMining", "BasicLogging", "AdvancedLogging",
            "BasicQuarrying", "AdvancedQuarrying", "BasicSmelting", "BasicAgriculture",
        ];
        for tech_id in tier1_techs {
            let zh = content.get_tech_name(tech_id, "zh-CN");
            let en = content.get_tech_name(tech_id, "en");
            assert_ne!(zh, tech_id, "Tech {} should have a zh-CN name", tech_id);
            assert_ne!(en, tech_id, "Tech {} should have an en name", tech_id);
        }
    }
}
