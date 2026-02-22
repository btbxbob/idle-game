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
}
