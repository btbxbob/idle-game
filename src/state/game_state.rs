use crate::state::resource::ResourceType;
use serde::de;
use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashMap;

/// Current save format version
pub const SAVE_VERSION: &str = "0.2.6";

#[derive(Serialize, Clone, Debug)]
pub struct GameState {
    pub version: String,
    pub resources: HashMap<ResourceType, f64>,
    pub coins_per_click: f64,
    pub coins_per_second: f64,
    pub wood_per_second: f64,
    pub stone_per_second: f64,
    pub autoclick_count: u32,
    pub total_clicks: u32,
    pub last_update_time: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OldGameState {
    coins: f64,
    wood: f64,
    stone: f64,
    coins_per_click: f64,
    coins_per_second: f64,
    wood_per_second: f64,
    stone_per_second: f64,
    autoclick_count: u32,
    total_clicks: u32,
    last_update_time: f64,
}

impl<'de> Deserialize<'de> for GameState {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        struct NewGameState {
            version: Option<String>,
            resources: HashMap<ResourceType, f64>,
            coins_per_click: f64,
            coins_per_second: f64,
            wood_per_second: f64,
            stone_per_second: f64,
            autoclick_count: u32,
            total_clicks: u32,
            last_update_time: f64,
        }

        let map = HashMap::<String, serde_json::Value>::deserialize(deserializer)?;

        if map.contains_key("coins") && !map.contains_key("resources") {
            let old: OldGameState =
                serde_json::from_value(serde_json::Value::Object(map.into_iter().collect()))
                    .map_err(de::Error::custom)?;

            Ok(Self::migrate_from_old(old))
        } else {
            let new: NewGameState =
                serde_json::from_value(serde_json::Value::Object(map.into_iter().collect()))
                    .map_err(de::Error::custom)?;

            Ok(GameState {
                version: new.version.unwrap_or_else(|| SAVE_VERSION.to_string()),
                resources: new.resources,
                coins_per_click: new.coins_per_click,
                coins_per_second: new.coins_per_second,
                wood_per_second: new.wood_per_second,
                stone_per_second: new.stone_per_second,
                autoclick_count: new.autoclick_count,
                total_clicks: new.total_clicks,
                last_update_time: new.last_update_time,
            })
        }
    }
}

impl GameState {
    pub fn migrate_from_old(old: OldGameState) -> Self {
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Gold, old.coins);
        resources.insert(ResourceType::Wood, old.wood);
        resources.insert(ResourceType::Stone, old.stone);

        GameState {
            version: "0.2.6-migrated".to_string(),
            resources,
            coins_per_click: old.coins_per_click,
            coins_per_second: old.coins_per_second,
            wood_per_second: old.wood_per_second,
            stone_per_second: old.stone_per_second,
            autoclick_count: old.autoclick_count,
            total_clicks: old.total_clicks,
            last_update_time: old.last_update_time,
        }
    }
    pub fn get_resource(&self, resource: ResourceType) -> f64 {
        *self.resources.get(&resource).unwrap_or(&0.0)
    }

    pub fn set_resource(&mut self, resource: ResourceType, amount: f64) {
        self.resources.insert(resource, amount);
    }

    pub fn add_resource(&mut self, resource: ResourceType, amount: f64) {
        let current = self.get_resource(resource);
        self.set_resource(resource, current + amount);
    }

    pub fn get_coins(&self) -> f64 {
        self.get_resource(ResourceType::Gold)
    }

    pub fn set_coins(&mut self, amount: f64) {
        self.set_resource(ResourceType::Gold, amount);
    }

    pub fn get_wood(&self) -> f64 {
        self.get_resource(ResourceType::Wood)
    }

    pub fn set_wood(&mut self, amount: f64) {
        self.set_resource(ResourceType::Wood, amount);
    }

    pub fn get_stone(&self) -> f64 {
        self.get_resource(ResourceType::Stone)
    }

    pub fn set_stone(&mut self, amount: f64) {
        self.set_resource(ResourceType::Stone, amount);
    }

    pub fn add_coins(&mut self, amount: f64) {
        self.add_resource(ResourceType::Gold, amount);
    }

    pub fn add_wood(&mut self, amount: f64) {
        self.add_resource(ResourceType::Wood, amount);
    }

    pub fn add_stone(&mut self, amount: f64) {
        self.add_resource(ResourceType::Stone, amount);
    }

    pub fn spend_coins(&mut self, amount: f64) -> bool {
        let current = self.get_coins();
        if current >= amount {
            self.set_coins(current - amount);
            true
        } else {
            false
        }
    }

    pub fn spend_wood(&mut self, amount: f64) -> bool {
        let current = self.get_wood();
        if current >= amount {
            self.set_wood(current - amount);
            true
        } else {
            false
        }
    }

    pub fn spend_stone(&mut self, amount: f64) -> bool {
        let current = self.get_stone();
        if current >= amount {
            self.set_stone(current - amount);
            true
        } else {
            false
        }
    }
}

impl Default for GameState {
    fn default() -> Self {
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Gold, 0.0);
        resources.insert(ResourceType::Wood, 0.0);
        resources.insert(ResourceType::Stone, 0.0);

        GameState {
            resources,
            coins_per_click: 1.0,
            coins_per_second: 0.0,
            wood_per_second: 0.0,
            stone_per_second: 0.0,
            autoclick_count: 0,
            total_clicks: 0,
            last_update_time: 0.0,
            version: SAVE_VERSION.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_migrate_old_save() {
        let old_format = OldGameState {
            coins: 100.0,
            wood: 50.0,
            stone: 25.0,
            coins_per_click: 2.0,
            coins_per_second: 5.0,
            wood_per_second: 3.0,
            stone_per_second: 1.0,
            autoclick_count: 10,
            total_clicks: 100,
            last_update_time: 1234567890.0,
        };

        let old_json = serde_json::to_string(&old_format).unwrap();

        let new_state: GameState = serde_json::from_str(&old_json).unwrap();

        assert_eq!(new_state.get_coins(), 100.0);
        assert_eq!(new_state.get_wood(), 50.0);
        assert_eq!(new_state.get_stone(), 25.0);
        assert_eq!(new_state.coins_per_click, 2.0);
        assert_eq!(new_state.coins_per_second, 5.0);
        assert_eq!(new_state.wood_per_second, 3.0);
        assert_eq!(new_state.stone_per_second, 1.0);
        assert_eq!(new_state.autoclick_count, 10);
        assert_eq!(new_state.total_clicks, 100);
        assert_eq!(new_state.last_update_time, 1234567890.0);
        assert!(new_state.version.contains("migrated"));
    }

    #[test]
    fn test_deserialize_new_format() {
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Gold, 200.0);
        resources.insert(ResourceType::Wood, 75.0);
        resources.insert(ResourceType::Stone, 30.0);

        let new_format = GameState {
            version: SAVE_VERSION.to_string(),
            resources,
            coins_per_click: 3.0,
            coins_per_second: 10.0,
            wood_per_second: 5.0,
            stone_per_second: 2.0,
            autoclick_count: 20,
            total_clicks: 200,
            last_update_time: 9876543210.0,
        };

        let new_json = serde_json::to_string(&new_format).unwrap();
        let deserialized: GameState = serde_json::from_str(&new_json).unwrap();

        assert_eq!(deserialized.get_coins(), 200.0);
        assert_eq!(deserialized.get_wood(), 75.0);
        assert_eq!(deserialized.get_stone(), 30.0);
        assert_eq!(deserialized.version, SAVE_VERSION);
    }
}
