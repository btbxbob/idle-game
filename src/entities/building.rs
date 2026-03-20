use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::state::resource::ResourceType;

fn default_output_resource() -> ResourceType {
    ResourceType::Gold
}

fn default_housing_icon() -> String {
    "🏠".to_string()
}

fn housing_cost_growth(resource: &str) -> f64 {
    if resource.eq_ignore_ascii_case("gold") || resource.eq_ignore_ascii_case("coins") {
        1.0025
    } else {
        1.5
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Building {
    pub name: String,
    pub cost: f64,
    pub production_rate: f64,
    #[serde(default = "default_output_resource")]
    pub output_resource: ResourceType,
    pub count: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Housing {
    pub name: String,
    pub cost: HashMap<String, f64>,
    pub capacity: u32,
    pub count: u32,
    #[serde(default)]
    pub description: String,
    #[serde(default = "default_housing_icon")]
    pub icon: String,
    #[serde(default)]
    pub required_technology: Option<String>,
}

impl Housing {
    pub fn new(name: &str, cost: HashMap<String, f64>, capacity: u32) -> Self {
        Housing {
            name: name.to_string(),
            cost,
            capacity,
            count: 0,
            description: String::new(),
            icon: default_housing_icon(),
            required_technology: None,
        }
    }

    pub fn with_details(
        name: &str,
        cost: HashMap<String, f64>,
        capacity: u32,
        description: &str,
        icon: &str,
        required_technology: Option<&str>,
    ) -> Self {
        Housing {
            name: name.to_string(),
            cost,
            capacity,
            count: 0,
            description: description.to_string(),
            icon: icon.to_string(),
            required_technology: required_technology.map(|value| value.to_string()),
        }
    }

    pub fn get_upgrade_cost(&self) -> HashMap<String, f64> {
        let mut upgrade_cost = HashMap::new();
        for (resource, &base_amount) in self.cost.iter() {
            let multiplier = housing_cost_growth(resource).powi(self.count as i32);
            upgrade_cost.insert(resource.clone(), base_amount * multiplier);
        }
        upgrade_cost
    }

    pub fn upgrade(&mut self) {
        self.count += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_building_serialization() {
        let building = Building {
            name: "Test Building".to_string(),
            cost: 100.0,
            production_rate: 1.5,
            output_resource: ResourceType::Gold,
            count: 5,
        };

        // Serialize to JSON
        let json = serde_json::to_string(&building).unwrap();
        assert!(json.contains("Test Building"));
        assert!(json.contains("100"));
        assert!(json.contains("1.5"));
        assert!(json.contains("5"));

        // Deserialize back
        let deserialized: Building = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.name, "Test Building");
        assert_eq!(deserialized.cost, 100.0);
        assert_eq!(deserialized.production_rate, 1.5);
        assert_eq!(deserialized.output_resource, ResourceType::Gold);
        assert_eq!(deserialized.count, 5);
    }

    #[test]
    fn test_building_clone_and_debug() {
        let building = Building {
            name: "Clone Test".to_string(),
            cost: 50.0,
            production_rate: 0.5,
            output_resource: ResourceType::Gold,
            count: 3,
        };

        // Test Clone
        let cloned = building.clone();
        assert_eq!(cloned.name, building.name);
        assert_eq!(cloned.cost, building.cost);

        // Test Debug format
        let debug_str = format!("{:?}", building);
        assert!(debug_str.contains("Clone Test"));
    }

    #[test]
    fn test_housing_new() {
        let mut cost = HashMap::new();
        cost.insert("coins".to_string(), 100.0);
        cost.insert("wood".to_string(), 50.0);

        let housing = Housing::new("Cottage", cost, 4);

        assert_eq!(housing.name, "Cottage");
        assert_eq!(housing.capacity, 4);
        assert_eq!(housing.count, 0); // Starts at 0

        let coins_cost = housing.cost.get("coins");
        assert_eq!(coins_cost, Some(&100.0));

        let wood_cost = housing.cost.get("wood");
        assert_eq!(wood_cost, Some(&50.0));
    }

    #[test]
    fn test_housing_new_with_empty_cost() {
        let cost = HashMap::new();
        let housing = Housing::new("Tent", cost, 2);

        assert_eq!(housing.name, "Tent");
        assert_eq!(housing.capacity, 2);
        assert_eq!(housing.count, 0);
        assert!(housing.cost.is_empty());
    }

    #[test]
    fn test_housing_upgrade_cost_at_level_0() {
        let mut cost = HashMap::new();
        cost.insert("coins".to_string(), 100.0);

        let housing = Housing::new("Cottage", cost, 4);
        let upgrade_cost = housing.get_upgrade_cost();

        // At level 0, multiplier is 1.5^0 = 1.0
        assert_eq!(upgrade_cost.get("coins"), Some(&100.0));
    }

    #[test]
    fn test_housing_upgrade_cost_at_level_1() {
        let mut cost = HashMap::new();
        cost.insert("coins".to_string(), 100.0);

        let mut housing = Housing::new("Cottage", cost, 4);
        housing.upgrade(); // Now count = 1

        let upgrade_cost = housing.get_upgrade_cost();

        assert!((upgrade_cost.get("coins").unwrap() - 100.25).abs() < 0.001);
    }

    #[test]
    fn test_housing_upgrade_cost_at_level_2() {
        let mut cost = HashMap::new();
        cost.insert("coins".to_string(), 100.0);

        let mut housing = Housing::new("Cottage", cost, 4);
        housing.upgrade();
        housing.upgrade(); // Now count = 2

        let upgrade_cost = housing.get_upgrade_cost();

        assert!((upgrade_cost.get("coins").unwrap() - 100.500625).abs() < 0.001);
    }

    #[test]
    fn test_housing_upgrade_cost_at_level_3() {
        let mut cost = HashMap::new();
        cost.insert("coins".to_string(), 100.0);

        let mut housing = Housing::new("Cottage", cost, 4);
        housing.upgrade();
        housing.upgrade();
        housing.upgrade(); // Now count = 3

        let upgrade_cost = housing.get_upgrade_cost();

        assert!((upgrade_cost.get("coins").unwrap() - 100.7518765625).abs() < 0.001);
    }

    #[test]
    fn test_housing_upgrade_multiple_levels() {
        let mut cost = HashMap::new();
        cost.insert("coins".to_string(), 200.0);
        cost.insert("wood".to_string(), 100.0);

        let mut housing = Housing::new("House", cost, 6);

        // Level 0: 200 coins, 100 wood
        let cost_l0 = housing.get_upgrade_cost();
        assert_eq!(cost_l0.get("coins"), Some(&200.0));
        assert_eq!(cost_l0.get("wood"), Some(&100.0));

        housing.upgrade();

        let cost_l1 = housing.get_upgrade_cost();
        assert!((cost_l1.get("coins").unwrap() - 200.5).abs() < 0.001);
        assert!((cost_l1.get("wood").unwrap() - 150.0).abs() < 0.001);

        housing.upgrade();

        let cost_l2 = housing.get_upgrade_cost();
        assert!((cost_l2.get("coins").unwrap() - 201.00125).abs() < 0.001);
        assert!((cost_l2.get("wood").unwrap() - 225.0).abs() < 0.001);
    }

    #[test]
    fn test_housing_coin_scaling_targets_longer_progression() {
        let base_cost = 100.0;
        let total_to_level_10: f64 = (0..10).map(|level| base_cost * 1.5_f64.powi(level)).sum();
        let total_to_level_100: f64 = (0..100)
            .map(|level| base_cost * housing_cost_growth("coins").powi(level))
            .sum();

        assert!((total_to_level_100 - total_to_level_10).abs() < 50.0);
    }

    #[test]
    fn test_housing_upgrade_increments_count() {
        let cost = HashMap::new();
        let mut housing = Housing::new("Tent", cost, 2);

        assert_eq!(housing.count, 0);

        housing.upgrade();
        assert_eq!(housing.count, 1);

        housing.upgrade();
        assert_eq!(housing.count, 2);

        housing.upgrade();
        assert_eq!(housing.count, 3);

        housing.upgrade();
        assert_eq!(housing.count, 4);
        housing.upgrade();
        assert_eq!(housing.count, 5);
    }

    #[test]
    fn test_housing_clone_and_debug() {
        let mut cost = HashMap::new();
        cost.insert("coins".to_string(), 100.0);

        let housing = Housing::new("Cottage", cost, 4);

        // Test Clone
        let cloned = housing.clone();
        assert_eq!(cloned.name, housing.name);
        assert_eq!(cloned.capacity, housing.capacity);
        assert_eq!(cloned.count, housing.count);

        // Test Debug format
        let debug_str = format!("{:?}", housing);
        assert!(debug_str.contains("Cottage"));
    }
}
