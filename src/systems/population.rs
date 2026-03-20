use crate::entities::Worker;
use crate::state::resource::ResourceType;
use std::collections::HashMap;

const FOOD_CONSUMPTION_INTERVAL: f64 = 4.0;
const FOOD_PER_WORKER: f64 = 1.25;
const STARVATION_DEATH_THRESHOLD: f64 = 18.0;

pub fn consume_food_for_workers(
    workers: &mut [Worker],
    resources: &mut HashMap<ResourceType, f64>,
    current_time: f64,
    last_consumption: &mut f64,
) -> u32 {
    if current_time - *last_consumption < FOOD_CONSUMPTION_INTERVAL {
        return 0;
    }

    *last_consumption = current_time;

    let worker_count = workers.len() as f64;
    let food_needed = worker_count * FOOD_PER_WORKER;
    let mut hungry_workers = 0u32;

    let current_food = *resources.get(&ResourceType::Food).unwrap_or(&0.0);

    if current_food >= food_needed {
        let new_food = current_food - food_needed;
        resources.insert(ResourceType::Food, new_food);

        for worker in workers.iter_mut() {
            worker.is_hungry = false;
            worker.starvation_start_time = 0.0;
            worker.hunger = (worker.hunger - 25.0).clamp(0.0, 100.0);
            worker.health = (worker.health + 2.5).clamp(0.0, 100.0);
            worker.happiness = (worker.happiness + 0.8).clamp(0.0, 100.0);
        }
    } else {
        resources.insert(ResourceType::Food, 0.0);

        for worker in workers.iter_mut() {
            worker.is_hungry = true;
            worker.hunger = (worker.hunger + 20.0).clamp(0.0, 100.0);
            if worker.starvation_start_time == 0.0 {
                worker.starvation_start_time = current_time;
            }
            hungry_workers += 1;
        }
    }

    hungry_workers
}

pub fn get_starvation_duration(worker: &Worker, current_time: f64) -> f64 {
    if worker.starvation_start_time > 0.0 {
        current_time - worker.starvation_start_time
    } else {
        0.0
    }
}

pub fn check_worker_starvation_deaths(
    workers: &mut Vec<Worker>,
    resources: &mut HashMap<ResourceType, f64>,
    current_time: f64,
    corpse_decay_time: &mut f64,
) -> u32 {
    let mut deaths = 0u32;
    let mut indices_to_remove: Vec<usize> = Vec::new();

    for (idx, worker) in workers.iter_mut().enumerate() {
        if worker.happiness <= 0.0 || worker.health <= 0.0 {
            let current_corpses = *resources.get(&ResourceType::Corpse).unwrap_or(&0.0);
            resources.insert(ResourceType::Corpse, current_corpses + 1.0);
            *corpse_decay_time = current_time;
            indices_to_remove.push(idx);
            deaths += 1;
            continue;
        }

        if worker.is_hungry {
            let starvation_duration = get_starvation_duration(worker, current_time);
            if starvation_duration >= STARVATION_DEATH_THRESHOLD {
                let current_corpses = *resources.get(&ResourceType::Corpse).unwrap_or(&0.0);
                resources.insert(ResourceType::Corpse, current_corpses + 1.0);

                *corpse_decay_time = current_time;
                indices_to_remove.push(idx);
                deaths += 1;
            }
        }
    }

    for &idx in indices_to_remove.iter().rev() {
        workers.remove(idx);
    }

    deaths
}

pub fn check_worker_starvation(
    workers: &mut Vec<Worker>,
    resources: &mut HashMap<ResourceType, f64>,
    current_time: f64,
    corpse_decay_time: &mut f64,
) -> u32 {
    check_worker_starvation_deaths(workers, resources, current_time, corpse_decay_time)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entities::worker::{Gender, Hobby, Trait};

    fn create_test_worker() -> Worker {
        Worker {
            name: "Test Worker".to_string(),
            skills: "mining".to_string(),
            background: "Test".to_string(),
            preferences: "Mine".to_string(),
            assigned_building: None,
            level: 1,
            efficiency_multiplier: 1.0,
            xp: 0.0,
            xp_to_next_level: 100.0,
            gender: Gender::Male,
            hobbies: vec![Hobby::Fishing],
            primary_trait: Trait::Diligent,
            secondary_traits: vec![],
            happiness: 50.0,
            health: 100.0,
            hunger: 0.0,
            focus: 55.0,
            fatigue: 10.0,
            stress: 15.0,
            missing_limbs: vec![],
            maggot_limbs: vec![],
            is_hungry: false,
            starvation_start_time: 0.0,
        }
    }

    #[test]
    fn test_no_food_consumption_before_interval() {
        let mut workers = vec![create_test_worker()];
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Food, 10.0);
        let mut last_consumption = 100.0;
        let current_time = 102.0;

        let hungry = consume_food_for_workers(
            &mut workers,
            &mut resources,
            current_time,
            &mut last_consumption,
        );

        assert_eq!(hungry, 0);
        assert_eq!(*resources.get(&ResourceType::Food).unwrap(), 10.0);
        assert_eq!(last_consumption, 100.0);
    }

    #[test]
    fn test_food_consumption_with_sufficient_food() {
        let mut workers = vec![create_test_worker(), create_test_worker()];
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Food, 10.0);
        let mut last_consumption = 100.0;
        let current_time = 106.0;

        let hungry = consume_food_for_workers(
            &mut workers,
            &mut resources,
            current_time,
            &mut last_consumption,
        );

        assert_eq!(hungry, 0);
        assert_eq!(*resources.get(&ResourceType::Food).unwrap(), 7.5);
        assert_eq!(last_consumption, 106.0);
        assert!(!workers[0].is_hungry);
        assert!(!workers[1].is_hungry);
        assert_eq!(workers[0].health, 100.0);
        assert_eq!(workers[1].health, 100.0);
    }

    #[test]
    fn test_food_consumption_with_insufficient_food() {
        let mut workers = vec![
            create_test_worker(),
            create_test_worker(),
            create_test_worker(),
        ];
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Food, 1.0);
        let mut last_consumption = 100.0;
        let current_time = 106.0;

        let hungry = consume_food_for_workers(
            &mut workers,
            &mut resources,
            current_time,
            &mut last_consumption,
        );

        assert_eq!(hungry, 3);
        assert_eq!(*resources.get(&ResourceType::Food).unwrap(), 0.0);
        assert!(workers[0].is_hungry);
        assert!(workers[1].is_hungry);
        assert!(workers[2].is_hungry);
        assert!(workers[0].starvation_start_time > 0.0);
    }

    #[test]
    fn test_starvation_duration() {
        let mut worker = create_test_worker();
        worker.starvation_start_time = 100.0;
        worker.is_hungry = true;

        let duration = get_starvation_duration(&worker, 150.0);
        assert_eq!(duration, 50.0);

        let duration = get_starvation_duration(&worker, 100.0);
        assert_eq!(duration, 0.0);
    }

    #[test]
    fn test_worker_death_after_starvation_threshold() {
        let mut workers = vec![create_test_worker()];
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Food, 0.0);
        let mut corpse_decay_time = 0.0;

        let mut last_consumption = 0.0;
        consume_food_for_workers(&mut workers, &mut resources, 100.0, &mut last_consumption);

        assert!(workers[0].is_hungry);
        assert!(workers[0].starvation_start_time > 0.0);
        assert_eq!(workers.len(), 1);

        let deaths = check_worker_starvation_deaths(
            &mut workers,
            &mut resources,
            117.0,
            &mut corpse_decay_time,
        );
        assert_eq!(deaths, 0);
        assert_eq!(workers.len(), 1);

        let deaths = check_worker_starvation_deaths(
            &mut workers,
            &mut resources,
            118.0,
            &mut corpse_decay_time,
        );
        assert_eq!(deaths, 1);
        assert_eq!(workers.len(), 0);
        assert_eq!(*resources.get(&ResourceType::Corpse).unwrap(), 1.0);
        assert_eq!(corpse_decay_time, 118.0);
    }

    #[test]
    fn test_multiple_worker_deaths() {
        let mut workers = vec![
            create_test_worker(),
            create_test_worker(),
            create_test_worker(),
        ];
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Food, 0.0);
        let mut corpse_decay_time = 0.0;

        let mut last_consumption = 0.0;
        consume_food_for_workers(&mut workers, &mut resources, 100.0, &mut last_consumption);

        assert_eq!(workers.len(), 3);

        let deaths = check_worker_starvation_deaths(
            &mut workers,
            &mut resources,
            130.0,
            &mut corpse_decay_time,
        );

        assert_eq!(deaths, 3);
        assert_eq!(workers.len(), 0);
        assert_eq!(*resources.get(&ResourceType::Corpse).unwrap(), 3.0);
    }

    #[test]
    fn test_corpse_resource_produced_on_death() {
        let mut workers = vec![create_test_worker()];
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Corpse, 5.0);
        resources.insert(ResourceType::Food, 0.0);
        let mut corpse_decay_time = 0.0;

        let mut last_consumption = 0.0;
        consume_food_for_workers(&mut workers, &mut resources, 100.0, &mut last_consumption);

        let deaths = check_worker_starvation_deaths(
            &mut workers,
            &mut resources,
            130.0,
            &mut corpse_decay_time,
        );

        assert_eq!(deaths, 1);
        assert_eq!(*resources.get(&ResourceType::Corpse).unwrap(), 6.0);
    }
}
