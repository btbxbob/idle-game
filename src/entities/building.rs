use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Building {
    pub name: String,
    pub cost: f64,
    pub production_rate: f64,
    pub count: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Housing {
    pub name: String,
    pub cost: HashMap<String, f64>,
    pub capacity: u32,
    pub count: u32,
}

impl Housing {
    pub fn new(name: &str, cost: HashMap<String, f64>, capacity: u32) -> Self {
        Housing {
            name: name.to_string(),
            cost,
            capacity,
            count: 0,
        }
    }

    pub fn get_upgrade_cost(&self) -> HashMap<String, f64> {
        // Upgrade cost scales with level: base_cost * 1.5^(count)
        let mut upgrade_cost = HashMap::new();
        let multiplier = 1.5_f64.powi(self.count as i32);
        for (resource, &base_amount) in self.cost.iter() {
            upgrade_cost.insert(resource.clone(), base_amount * multiplier);
        }
        upgrade_cost
    }

    pub fn upgrade(&mut self) {
        self.count += 1;
    }
}
