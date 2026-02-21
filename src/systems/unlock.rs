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
                name: "制作系统".to_string(),
                feature_type: "system".to_string(),
                unlocked: false,
                unlock_timestamp: None,
                requirement_type: "total_coins".to_string(),
                requirement_value: 500.0,
            },
        ]
    }
}
