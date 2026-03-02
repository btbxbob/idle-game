use crate::entities::Building;
use crate::state::resource::ResourceType;
use crate::systems::production;
use std::collections::HashMap;

pub struct BalanceReport {
    pub simulation_duration_seconds: f64,
    pub final_resources: HashMap<ResourceType, f64>,
    pub resource_production_rates: HashMap<ResourceType, f64>,
    pub balance_issues: Vec<String>,
    pub is_balanced: bool,
}

pub struct BalanceSimulator {
    pub resources: HashMap<ResourceType, f64>,
    pub buildings: Vec<Building>,
    sim_time: f64,
    resource_history: HashMap<ResourceType, Vec<f64>>,
}

impl Default for BalanceSimulator {
    fn default() -> Self {
        Self::new()
    }
}

impl BalanceSimulator {
    pub fn new() -> Self {
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Gold, 100.0);
        resources.insert(ResourceType::Wood, 50.0);
        resources.insert(ResourceType::Stone, 25.0);
        resources.insert(ResourceType::Food, 50.0);

        BalanceSimulator {
            resources,
            buildings: Self::create_initial_buildings(),
            sim_time: 0.0,
            resource_history: HashMap::new(),
        }
    }

    fn create_initial_buildings() -> Vec<Building> {
        vec![
            Building {
                name: "金币矿山".to_string(),
                cost: 15.0,
                production_rate: 1.0,
                output_resource: ResourceType::Gold,
                count: 5,
            },
            Building {
                name: "伐木场".to_string(),
                cost: 20.0,
                production_rate: 0.5,
                output_resource: ResourceType::Wood,
                count: 3,
            },
            Building {
                name: "采石场".to_string(),
                cost: 25.0,
                production_rate: 0.3,
                output_resource: ResourceType::Stone,
                count: 2,
            },
            Building {
                name: "农场".to_string(),
                cost: 30.0,
                production_rate: 2.0,
                output_resource: ResourceType::Food,
                count: 2,
            },
        ]
    }

    pub fn run_simulation(&mut self, duration_seconds: f64, time_step: f64) -> BalanceReport {
        println!(
            "Starting balance simulation for {} seconds",
            duration_seconds
        );

        while self.sim_time < duration_seconds {
            self.simulation_step(time_step);

            if (self.sim_time * 10.0) as u64 % 100 == 0 {
                self.print_status();
            }
        }

        println!("Simulation completed at {} seconds", self.sim_time);
        self.generate_report(duration_seconds)
    }

    fn simulation_step(&mut self, delta_time: f64) {
        self.sim_time += delta_time;
        self.produce_resources(delta_time);
        self.record_history();
    }

    fn produce_resources(&mut self, delta_time: f64) {
        let workers = vec![];
        let upgrades = vec![];
        let production = production::update_production(&self.buildings, &upgrades, &workers);

        *self.resources.entry(ResourceType::Gold).or_insert(0.0) += production[0] * delta_time;
        *self.resources.entry(ResourceType::Wood).or_insert(0.0) += production[1] * delta_time;
        *self.resources.entry(ResourceType::Stone).or_insert(0.0) += production[2] * delta_time;

        let food_prod = self.get_building_production("农场");
        *self.resources.entry(ResourceType::Food).or_insert(0.0) += food_prod * delta_time;
    }

    fn get_building_production(&self, name: &str) -> f64 {
        self.buildings
            .iter()
            .find(|b| b.name == name)
            .map(|b| b.production_rate * b.count as f64)
            .unwrap_or(0.0)
    }

    fn record_history(&mut self) {
        for (&resource_type, &amount) in &self.resources {
            self.resource_history
                .entry(resource_type)
                .or_insert_with(Vec::new)
                .push(amount);
        }
    }

    fn print_status(&self) {
        let gold = *self.resources.get(&ResourceType::Gold).unwrap_or(&0.0);
        let wood = *self.resources.get(&ResourceType::Wood).unwrap_or(&0.0);
        let stone = *self.resources.get(&ResourceType::Stone).unwrap_or(&0.0);
        let food = *self.resources.get(&ResourceType::Food).unwrap_or(&0.0);

        println!(
            "T={:6.0}s | Gold={:10.1} | Wood={:8.1} | Stone={:7.1} | Food={:6.1}",
            self.sim_time, gold, wood, stone, food
        );
    }

    fn generate_report(&self, duration: f64) -> BalanceReport {
        let mut issues = Vec::new();

        let final_resources = self.resources.clone();

        let mut rates = HashMap::new();
        for (&resource_type, history) in &self.resource_history {
            if history.len() >= 2 {
                let start = history[0];
                let end = history[history.len() - 1];
                let rate = (end - start) / duration;
                rates.insert(resource_type, rate);
            }
        }

        for (&resource, &amount) in &final_resources {
            if amount > 1_000_000.0 {
                issues.push(format!(
                    "Resource {:?} accumulated too much: {:.0}",
                    resource, amount
                ));
            }
        }

        let gold_rate = *rates.get(&ResourceType::Gold).unwrap_or(&0.0);
        if gold_rate < 0.1 && duration > 100.0 {
            issues.push("Gold production too low".to_string());
        }

        let is_balanced = issues.is_empty()
            && *final_resources.get(&ResourceType::Gold).unwrap_or(&0.0) > 0.0
            && *final_resources.get(&ResourceType::Food).unwrap_or(&0.0) > 0.0;

        BalanceReport {
            simulation_duration_seconds: duration,
            final_resources,
            resource_production_rates: rates,
            balance_issues: issues,
            is_balanced,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simulator_initialization() {
        let sim = BalanceSimulator::new();
        assert!(*sim.resources.get(&ResourceType::Gold).unwrap() > 0.0);
        assert!(!sim.buildings.is_empty());
    }

    #[test]
    fn test_short_simulation() {
        let mut sim = BalanceSimulator::new();
        let report = sim.run_simulation(60.0, 1.0);
        assert!(report.simulation_duration_seconds >= 60.0);
        assert!(*report.final_resources.get(&ResourceType::Gold).unwrap() > 0.0);
    }

    #[test]
    fn test_resource_production() {
        let mut sim = BalanceSimulator::new();
        let report = sim.run_simulation(300.0, 1.0);

        assert!(*report.final_resources.get(&ResourceType::Gold).unwrap() > 100.0);
        assert!(*report.final_resources.get(&ResourceType::Wood).unwrap() > 50.0);
    }
}

#[cfg(test)]
mod balance_tests {
    use super::*;

    #[test]
    fn test_one_hour_simulation() {
        let mut sim = BalanceSimulator::new();

        let report = sim.run_simulation(3600.0, 1.0);

        println!("\n=== BALANCE REPORT ===");
        println!("Duration: {} seconds", report.simulation_duration_seconds);
        println!(
            "Final Gold: {:.0}",
            report
                .final_resources
                .get(&ResourceType::Gold)
                .unwrap_or(&0.0)
        );
        println!(
            "Final Wood: {:.0}",
            report
                .final_resources
                .get(&ResourceType::Wood)
                .unwrap_or(&0.0)
        );
        println!(
            "Final Stone: {:.0}",
            report
                .final_resources
                .get(&ResourceType::Stone)
                .unwrap_or(&0.0)
        );
        println!(
            "Final Food: {:.0}",
            report
                .final_resources
                .get(&ResourceType::Food)
                .unwrap_or(&0.0)
        );
        println!("Is Balanced: {}", report.is_balanced);

        if !report.balance_issues.is_empty() {
            println!("\n⚠️  BALANCE ISSUES DETECTED:");
            for issue in &report.balance_issues {
                println!("  - {}", issue);
            }
        } else {
            println!("\n✅ No balance issues detected!");
        }

        assert!(report.is_balanced, "Game balance issues detected");
        assert!(
            *report
                .final_resources
                .get(&ResourceType::Gold)
                .unwrap_or(&0.0)
                > 100.0
        );
        assert!(
            *report
                .final_resources
                .get(&ResourceType::Food)
                .unwrap_or(&0.0)
                > 50.0
        );
    }
}
