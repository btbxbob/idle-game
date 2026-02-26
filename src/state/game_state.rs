use crate::state::resource::ResourceType;
use serde::de;
use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashMap;

/// Current save format version
pub const SAVE_VERSION: &str = "0.3.0";

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
            // Old format without resources - breaking update (0.3.0), reset to default
            return Ok(Self::default());
        } else {
            // Check version for breaking update
            if let Some(version_val) = map.get("version") {
                if let Some(version_str) = version_val.as_str() {
                    // Parse versions and compare
                    fn parse_version(v: &str) -> Option<(u32, u32, u32)> {
                        let parts: Vec<&str> = v.split('.').collect();
                        if parts.len() >= 3 {
                            let major = parts[0].parse().ok()?;
                            let minor = parts[1].parse().ok()?;
                            let patch = parts[2].split(|c: char| !c.is_ascii_digit()).next()?.parse().ok()?;
                            Some((major, minor, patch))
                        } else {
                            None
                        }
                    }
                    
                    let current = parse_version(version_str);
                    let target = parse_version("0.3.0");
                    
                    if let (Some(cur), Some(tgt)) = (current, target) {
                        if cur < tgt {
                            // Breaking update: reset to default
                            return Ok(Self::default());
                        }
                    } else {
                        // Can't parse version, assume old and reset
                        return Ok(Self::default());
                    }
                } else {
                    // No version string, assume old and reset
                    return Ok(Self::default());
                }
            } else {
                // No version field, assume old and reset
                return Ok(Self::default());
            }

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
        // Old format without resources should reset to default (0.3.0 breaking change)
        assert_eq!(new_state.get_coins(), 0.0);
        assert_eq!(new_state.get_wood(), 0.0);
        assert_eq!(new_state.get_stone(), 0.0);
        assert_eq!(new_state.version, SAVE_VERSION);
    }

    #[test]
    fn test_old_version_save_resets() {
        // Simulate a 0.2.6 version save that should be reset
        let old_save = r#"{"version":"0.2.6","resources":{"Gold":1000.0,"Wood":500.0,"Stone":200.0},"coins_per_click":5.0,"coins_per_second":10.0,"wood_per_second":5.0,"stone_per_second":2.0,"autoclick_count":5,"total_clicks":1000,"last_update_time":1234567890.0}"#;
        
        let state: GameState = serde_json::from_str(old_save).unwrap();
        
        // Should be reset to default values
        assert_eq!(state.get_coins(), 0.0);
        assert_eq!(state.get_wood(), 0.0);
        assert_eq!(state.get_stone(), 0.0);
        assert_eq!(state.version, SAVE_VERSION);
    }

    #[test]
    fn test_current_version_save_loads() {
        // Simulate a 0.3.0 version save that should load normally
        let current_save = r#"{"version":"0.3.0","resources":{"Gold":1000.0,"Wood":500.0,"Stone":200.0},"coins_per_click":5.0,"coins_per_second":10.0,"wood_per_second":5.0,"stone_per_second":2.0,"autoclick_count":5,"total_clicks":1000,"last_update_time":1234567890.0}"#;
        
        let state: GameState = serde_json::from_str(current_save).unwrap();
        
        // Should load with preserved values
        assert_eq!(state.get_coins(), 1000.0);
        assert_eq!(state.get_wood(), 500.0);
        assert_eq!(state.get_stone(), 200.0);
        assert_eq!(state.version, "0.3.0");
    }

    #[test]
    fn test_newer_version_save_loads() {
        // Simulate a future version that should also load normally
        let future_save = r#"{"version":"0.4.0","resources":{"Gold":999.0,"Wood":888.0,"Stone":777.0},"coins_per_click":5.0,"coins_per_second":10.0,"wood_per_second":5.0,"stone_per_second":2.0,"autoclick_count":5,"total_clicks":1000,"last_update_time":1234567890.0}"#;
        
        let state: GameState = serde_json::from_str(future_save).unwrap();
        
        // Should load with preserved values
        assert_eq!(state.get_coins(), 999.0);
        assert_eq!(state.get_wood(), 888.0);
        assert_eq!(state.get_stone(), 777.0);
        assert_eq!(state.version, "0.4.0");
    }

    #[test]
    fn test_deserialize_new_format() {
        let mut resources: HashMap<ResourceType, f64> = HashMap::new();
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
