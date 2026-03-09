use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct UnlockedFeature {
    pub id: String,
    pub name: String,
    pub feature_type: String,
    pub unlocked: bool,
    pub unlock_timestamp: Option<f64>,
    pub requirement_type: String,
    pub requirement_value: f64,
}

impl UnlockedFeature {
    /// Get all default unlocked features
    pub fn get_default_features() -> Vec<UnlockedFeature> {
        vec![
            UnlockedFeature {
                id: "first_unlock".to_string(),
                name: "首次解锁".to_string(),
                feature_type: "achievement".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                requirement_type: "total_clicks".to_string(),
                requirement_value: 10.0,
            },
            UnlockedFeature {
                id: "progress_master_5".to_string(),
                name: "进度大师".to_string(),
                feature_type: "achievement".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                requirement_type: "total_clicks".to_string(),
                requirement_value: 50.0,
            },
            UnlockedFeature {
                id: "unlock_building_1".to_string(),
                name: "建筑解锁 1".to_string(),
                feature_type: "building".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                requirement_type: "buildings_owned".to_string(),
                requirement_value: 5.0,
            },
            UnlockedFeature {
                id: "unlock_building_2".to_string(),
                name: "建筑解锁 2".to_string(),
                feature_type: "building".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                requirement_type: "buildings_owned".to_string(),
                requirement_value: 15.0,
            },
            UnlockedFeature {
                id: "unlock_crafting".to_string(),
                name: "工厂系统".to_string(),
                feature_type: "system".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                requirement_type: "total_coins".to_string(),
                requirement_value: 500.0,
            },
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_get_default_features_count() {
        let features = UnlockedFeature::get_default_features();
        assert_eq!(features.len(), 5);
    }

    #[test]
    fn test_first_unlock_feature() {
        let features = UnlockedFeature::get_default_features();
        let first_unlock = features.iter().find(|f| f.id == "first_unlock").unwrap();

        assert_eq!(first_unlock.name, "首次解锁");
        assert_eq!(first_unlock.feature_type, "achievement");
        assert_eq!(first_unlock.unlocked, false);
        assert_eq!(first_unlock.unlock_timestamp, None);
        assert_eq!(first_unlock.requirement_type, "total_clicks");
        assert_eq!(first_unlock.requirement_value, 10.0);
    }

    #[test]
    fn test_progress_master_5_feature() {
        let features = UnlockedFeature::get_default_features();
        let progress_master = features.iter().find(|f| f.id == "progress_master_5").unwrap();

        assert_eq!(progress_master.name, "进度大师");
        assert_eq!(progress_master.feature_type, "achievement");
        assert_eq!(progress_master.unlocked, false);
        assert_eq!(progress_master.requirement_type, "total_clicks");
        assert_eq!(progress_master.requirement_value, 50.0);
    }

    #[test]
    fn test_unlock_building_1_feature() {
        let features = UnlockedFeature::get_default_features();
        let unlock_building_1 = features.iter().find(|f| f.id == "unlock_building_1").unwrap();

        assert_eq!(unlock_building_1.name, "建筑解锁 1");
        assert_eq!(unlock_building_1.feature_type, "building");
        assert_eq!(unlock_building_1.unlocked, false);
        assert_eq!(unlock_building_1.requirement_type, "buildings_owned");
        assert_eq!(unlock_building_1.requirement_value, 5.0);
    }

    #[test]
    fn test_unlock_building_2_feature() {
        let features = UnlockedFeature::get_default_features();
        let unlock_building_2 = features.iter().find(|f| f.id == "unlock_building_2").unwrap();

        assert_eq!(unlock_building_2.name, "建筑解锁 2");
        assert_eq!(unlock_building_2.feature_type, "building");
        assert_eq!(unlock_building_2.unlocked, false);
        assert_eq!(unlock_building_2.requirement_type, "buildings_owned");
        assert_eq!(unlock_building_2.requirement_value, 15.0);
    }

    #[test]
    fn test_unlock_crafting_feature() {
        let features = UnlockedFeature::get_default_features();
        let unlock_crafting = features.iter().find(|f| f.id == "unlock_crafting").unwrap();

        assert_eq!(unlock_crafting.name, "工厂系统");
        assert_eq!(unlock_crafting.feature_type, "system");
        assert_eq!(unlock_crafting.unlocked, false);
        assert_eq!(unlock_crafting.requirement_type, "total_coins");
        assert_eq!(unlock_crafting.requirement_value, 500.0);
    }

    #[test]
    fn test_all_features_initial_state() {
        let features = UnlockedFeature::get_default_features();

        for feature in &features {
            assert_eq!(feature.unlocked, false, "Feature {} should start locked", feature.id);
            assert_eq!(feature.unlock_timestamp, None, "Feature {} should have no timestamp", feature.id);
        }
    }

    #[test]
    fn test_serialization_deserialization_roundtrip() {
        let features = UnlockedFeature::get_default_features();

        // Serialize to JSON
        let json = serde_json::to_string(&features).unwrap();

        // Deserialize back
        let decoded: Vec<UnlockedFeature> = serde_json::from_str(&json).unwrap();

        // Verify all fields match
        assert_eq!(decoded.len(), features.len());

        for (original, restored) in features.iter().zip(decoded.iter()) {
            assert_eq!(restored.id, original.id);
            assert_eq!(restored.name, original.name);
            assert_eq!(restored.feature_type, original.feature_type);
            assert_eq!(restored.unlocked, original.unlocked);
            assert_eq!(restored.unlock_timestamp, original.unlock_timestamp);
            assert_eq!(restored.requirement_type, original.requirement_type);
            assert_eq!(restored.requirement_value, original.requirement_value);
        }
    }

    #[test]
    fn test_feature_types() {
        let features = UnlockedFeature::get_default_features();

        let achievement_count = features.iter().filter(|f| f.feature_type == "achievement").count();
        let building_count = features.iter().filter(|f| f.feature_type == "building").count();
        let system_count = features.iter().filter(|f| f.feature_type == "system").count();

        assert_eq!(achievement_count, 2);
        assert_eq!(building_count, 2);
        assert_eq!(system_count, 1);
    }

    #[test]
    fn test_requirement_types() {
        let features = UnlockedFeature::get_default_features();

        let total_clicks_count = features.iter().filter(|f| f.requirement_type == "total_clicks").count();
        let buildings_owned_count = features.iter().filter(|f| f.requirement_type == "buildings_owned").count();
        let total_coins_count = features.iter().filter(|f| f.requirement_type == "total_coins").count();

        assert_eq!(total_clicks_count, 2);
        assert_eq!(buildings_owned_count, 2);
        assert_eq!(total_coins_count, 1);
    }
}
