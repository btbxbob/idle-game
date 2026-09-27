#[cfg(test)]
mod snapshot_tests {
    use crate::ui::snapshot::*;
    use std::collections::HashMap;

    #[test]
    fn test_resource_state_serialization() {
        let state = ResourceState {
            amount: 100.5,
            per_second: 2.5,
            tier: 1,
            revealed: true,
        };

        let json = serde_json::to_string(&state).unwrap();
        assert!(json.contains("100.5"));
        assert!(json.contains("2.5"));
        assert!(json.contains("true"));
    }

    #[test]
    fn test_building_card_serialization() {
        let card = BuildingCard {
            id: "gold_mine".to_string(),
            name: "金币矿山".to_string(),
            description: "测试描述".to_string(),
            count: 5,
            cost: 100.0,
            production_rate: 1.5,
            output_resource: "Gold".to_string(),
            can_afford: true,
            unlocked: true,
            category: "primary".to_string(),
            input_requirements: vec![],
        };

        let json = serde_json::to_string(&card).unwrap();
        assert!(json.contains("gold_mine"));
        assert!(json.contains("金币矿山"));
        assert!(json.contains("\"count\":5"));
    }

    #[test]
    fn test_building_card_with_inputs() {
        let card = BuildingCard {
            id: "iron_smelter".to_string(),
            name: "铁锭冶炼厂".to_string(),
            description: String::new(),
            count: 2,
            cost: 220.0,
            production_rate: 0.1,
            output_resource: "IronIngot".to_string(),
            can_afford: false,
            unlocked: true,
            category: "processing".to_string(),
            input_requirements: vec![
                InputReq {
                    resource: "IronOre".to_string(),
                    amount: 10.0,
                    available: 5.0,
                },
            ],
        };

        let json = serde_json::to_string(&card).unwrap();
        assert!(json.contains("IronOre"));
        assert!(json.contains("10.0"));
    }

    #[test]
    fn test_worker_card_serialization() {
        let card = WorkerCard {
            index: 0,
            name: "张三".to_string(),
            level: 5,
            xp: 250.0,
            xp_to_next: 500.0,
            efficiency: 1.35,
            assigned_building: Some("gold_mine".to_string()),
            happiness: 75.0,
            hunger: 10.0,
            focus: 80.0,
            fatigue: 20.0,
            stress: 15.0,
            is_hungry: false,
            primary_trait: "Diligent".to_string(),
            secondary_traits: vec!["Creative".to_string()],
            skills: "Mining".to_string(),
            background: "Village".to_string(),
            preferences: "gold_mine".to_string(),
            gender: "Male".to_string(),
            hobbies: vec!["Reading".to_string()],
            missing_limbs: vec![],
            maggot_limbs: vec![],
        };

        let json = serde_json::to_string(&card).unwrap();
        assert!(json.contains("张三"));
        assert!(json.contains("\"level\":5"));
        assert!(json.contains("gold_mine"));
        assert!(json.contains("Diligent"));
    }

    #[test]
    fn test_worker_card_unassigned() {
        let card = WorkerCard {
            index: 1,
            name: "李四".to_string(),
            level: 1,
            xp: 0.0,
            xp_to_next: 100.0,
            efficiency: 1.0,
            assigned_building: None,
            happiness: 50.0,
            hunger: 0.0,
            focus: 55.0,
            fatigue: 10.0,
            stress: 15.0,
            is_hungry: false,
            primary_trait: "Hardworking".to_string(),
            secondary_traits: vec![],
            skills: String::new(),
            background: String::new(),
            preferences: String::new(),
            gender: "Female".to_string(),
            hobbies: vec![],
            missing_limbs: vec![],
            maggot_limbs: vec![],
        };

        let json = serde_json::to_string(&card).unwrap();
        assert!(json.contains("null"));
    }

    #[test]
    fn test_tech_card_serialization() {
        let mut costs = HashMap::new();
        costs.insert("Gold".to_string(), 100.0);
        costs.insert("Wood".to_string(), 50.0);

        let card = TechCard {
            id: "BasicMining".to_string(),
            name: "基础采矿".to_string(),
            description: "解锁基础采矿技术".to_string(),
            effect: "Coal production +10%".to_string(),
            tier: 1,
            researched: false,
            available: true,
            costs,
            dependencies: vec![],
            recommended: true,
        };

        let json = serde_json::to_string(&card).unwrap();
        assert!(json.contains("BasicMining"));
        assert!(json.contains("基础采矿"));
        assert!(json.contains("\"tier\":1"));
        assert!(json.contains("\"recommended\":true"));
    }

    #[test]
    fn test_tech_card_researched() {
        let card = TechCard {
            id: "BasicMining".to_string(),
            name: "基础采矿".to_string(),
            description: String::new(),
            effect: String::new(),
            tier: 1,
            researched: true,
            available: false,
            costs: HashMap::new(),
            dependencies: vec![],
            recommended: false,
        };

        let json = serde_json::to_string(&card).unwrap();
        assert!(json.contains("\"researched\":true"));
        assert!(json.contains("\"available\":false"));
    }

    #[test]
    fn test_housing_state_serialization() {
        let state = HousingState {
            catalog: vec![
                HousingCard {
                    id: "shack".to_string(),
                    name: "棚屋".to_string(),
                    description: "临时居所".to_string(),
                    capacity: 4,
                    count: 2,
                    costs: {
                        let mut c = HashMap::new();
                        c.insert("Gold".to_string(), 100.0);
                        c
                    },
                    can_afford: true,
                    unlocked: true,
                },
            ],
            total_capacity: 8,
            current_occupancy: 3,
            queue_size: 1,
        };

        let json = serde_json::to_string(&state).unwrap();
        assert!(json.contains("shack"));
        assert!(json.contains("\"total_capacity\":8"));
    }

    #[test]
    fn test_prestige_state_serialization() {
        let state = PrestigeState {
            unlocked: true,
            current_pp: 5.5,
            pp_on_rebirth: 2.3,
            multiplier: 1.055,
            can_prestige: true,
        };

        let json = serde_json::to_string(&state).unwrap();
        assert!(json.contains("\"unlocked\":true"));
        assert!(json.contains("5.5"));
        assert!(json.contains("\"can_prestige\":true"));
    }

    #[test]
    fn test_progression_state_serialization() {
        let state = ProgressionState {
            current_stage: "Workers".to_string(),
            stage_name: "工人阶段".to_string(),
            objectives: vec![
                ObjectiveEntry {
                    id: "buy_10_buildings".to_string(),
                    description: "购买10座建筑".to_string(),
                    progress: 5.0,
                    target: 10.0,
                    completed: false,
                },
            ],
            unlocks: vec![
                UnlockEntry {
                    id: "workers_tab".to_string(),
                    name: "工人面板".to_string(),
                    description: "解锁工人面板".to_string(),
                    unlocked: true,
                    progress: 1.0,
                },
            ],
        };

        let json = serde_json::to_string(&state).unwrap();
        assert!(json.contains("Workers"));
        assert!(json.contains("buy_10_buildings"));
        assert!(json.contains("\"completed\":false"));
    }

    #[test]
    fn test_statistics_state_serialization() {
        let state = StatisticsState {
            total_clicks: 1500,
            total_coins_earned: 50000.0,
            total_wood_earned: 12000.0,
            total_stone_earned: 8000.0,
            total_resources_crafted: 250,
            play_time_s: 3600.0,
            buildings_purchased: 45,
            upgrades_purchased: 12,
            achievements_unlocked: 8,
            workers_count: 15,
            deaths_count: 3,
        };

        let json = serde_json::to_string(&state).unwrap();
        assert!(json.contains("\"total_clicks\":1500"));
        assert!(json.contains("\"workers_count\":15"));
        assert!(json.contains("\"deaths_count\":3"));
    }

    #[test]
    fn test_event_entry_serialization() {
        let entry = EventEntry {
            id: "food_shortage_001".to_string(),
            category: "survival_crisis".to_string(),
            headline: "粮食危机".to_string(),
            body: "聚落面临严重的粮食短缺".to_string(),
            timestamp: 1234567890.0,
            priority: 3,
        };

        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("food_shortage_001"));
        assert!(json.contains("survival_crisis"));
        assert!(json.contains("\"priority\":3"));
    }

    #[test]
    fn test_full_ui_snapshot_serialization() {
        let mut resources = HashMap::new();
        resources.insert("Gold".to_string(), ResourceState {
            amount: 500.0,
            per_second: 5.0,
            tier: 1,
            revealed: true,
        });

        let snapshot = UiSnapshot {
            resources,
            buildings: vec![],
            workers: vec![],
            technologies: vec![],
            housing: HousingState {
                catalog: vec![],
                total_capacity: 0,
                current_occupancy: 0,
                queue_size: 0,
            },
            prestige: PrestigeState {
                unlocked: false,
                current_pp: 0.0,
                pp_on_rebirth: 0.0,
                multiplier: 1.0,
                can_prestige: false,
            },
            progression: ProgressionState {
                current_stage: "Genesis".to_string(),
                stage_name: "初始阶段".to_string(),
                objectives: vec![],
                unlocks: vec![],
            },
            events: vec![],
            statistics: StatisticsState {
                total_clicks: 100,
                total_coins_earned: 500.0,
                total_wood_earned: 0.0,
                total_stone_earned: 0.0,
                total_resources_crafted: 0,
                play_time_s: 120.0,
                buildings_purchased: 3,
                upgrades_purchased: 0,
                achievements_unlocked: 1,
                workers_count: 0,
                deaths_count: 0,
            },
            tick_ms: 2.5,
        };

        let json = serde_json::to_string(&snapshot).unwrap();
        assert!(json.contains("Gold"));
        assert!(json.contains("Genesis"));
        assert!(json.contains("\"total_clicks\":100"));
        assert!(json.contains("\"tick_ms\":2.5"));

        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.get("resources").is_some());
        assert!(parsed.get("buildings").is_some());
        assert!(parsed.get("statistics").is_some());
    }

    #[test]
    fn test_input_req_serialization() {
        let req = InputReq {
            resource: "IronOre".to_string(),
            amount: 10.0,
            available: 25.0,
        };

        let json = serde_json::to_string(&req).unwrap();
        assert!(json.contains("IronOre"));
        assert!(json.contains("\"amount\":10"));
        assert!(json.contains("\"available\":25"));
    }

    #[test]
    fn test_objective_entry_completed() {
        let entry = ObjectiveEntry {
            id: "first_click".to_string(),
            description: "第一次点击".to_string(),
            progress: 1.0,
            target: 1.0,
            completed: true,
        };

        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("\"completed\":true"));
    }

    #[test]
    fn test_unlock_entry_locked() {
        let entry = UnlockEntry {
            id: "prestige_system".to_string(),
            name: "转生系统".to_string(),
            description: "解锁转生".to_string(),
            unlocked: false,
            progress: 0.5,
        };

        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("\"unlocked\":false"));
        assert!(json.contains("0.5"));
    }
}
