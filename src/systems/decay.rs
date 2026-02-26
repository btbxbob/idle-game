use crate::state::resource::ResourceType;
use crate::state::GameState;
use serde::{Deserialize, Serialize};

/// Time in seconds before a corpse starts decaying
pub const CORPSE_DECAY_TIME_SECONDS: f64 = 300.0;

/// Number of maggots produced per corpse
pub const MAGGOTS_PER_CORPSE: f64 = 20.0;

/// Corpse with decay tracking information
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct CorpseInfo {
    pub created_timestamp: f64,
    pub has_produced_maggots: bool,
}

/// Process corpse decay and produce maggots
pub fn produce_maggots(game_state: &mut GameState, _current_time: f64) -> (usize, usize) {
    let mut corpses_decayed = 0usize;
    let mut maggots_produced = 0usize;

    let current_corpses = game_state.get_resource(ResourceType::Corpse);

    if current_corpses <= 0.0 {
        return (0, 0);
    }

    if current_corpses > 0.0 {
        let corpse_count = current_corpses as usize;

        game_state.set_resource(ResourceType::Corpse, 0.0);

        let total_maggots = (current_corpses * MAGGOTS_PER_CORPSE) as f64;
        let current_maggots = game_state.get_resource(ResourceType::Maggot);
        game_state.set_resource(ResourceType::Maggot, current_maggots + total_maggots);

        corpses_decayed = corpse_count;
        maggots_produced = total_maggots as usize;
    }

    (corpses_decayed, maggots_produced)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn create_test_game_state() -> GameState {
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Gold, 100.0);
        resources.insert(ResourceType::Wood, 50.0);
        resources.insert(ResourceType::Stone, 25.0);
        resources.insert(ResourceType::Corpse, 0.0);
        resources.insert(ResourceType::Maggot, 0.0);

        GameState {
            version: "test".to_string(),
            resources,
            coins_per_click: 1.0,
            coins_per_second: 0.0,
            wood_per_second: 0.0,
            stone_per_second: 0.0,
            autoclick_count: 0,
            total_clicks: 0,
            last_update_time: 0.0,
        }
    }

    #[test]
    fn test_no_corpses_no_maggots() {
        let mut game_state = create_test_game_state();
        let (corpses, maggots) = produce_maggots(&mut game_state, 1000.0);

        assert_eq!(corpses, 0);
        assert_eq!(maggots, 0);
        assert_eq!(game_state.get_resource(ResourceType::Corpse), 0.0);
        assert_eq!(game_state.get_resource(ResourceType::Maggot), 0.0);
    }

    #[test]
    fn test_one_corpse_produces_20_maggots() {
        let mut game_state = create_test_game_state();
        game_state.set_resource(ResourceType::Corpse, 1.0);

        let (corpses, maggots) = produce_maggots(&mut game_state, 1000.0);

        assert_eq!(corpses, 1);
        assert_eq!(maggots, 20);
        assert_eq!(game_state.get_resource(ResourceType::Corpse), 0.0);
        assert_eq!(game_state.get_resource(ResourceType::Maggot), 20.0);
    }

    #[test]
    fn test_multiple_corpses_produce_maggots() {
        let mut game_state = create_test_game_state();
        game_state.set_resource(ResourceType::Corpse, 5.0);

        let (corpses, maggots) = produce_maggots(&mut game_state, 1000.0);

        assert_eq!(corpses, 5);
        assert_eq!(maggots, 100);
        assert_eq!(game_state.get_resource(ResourceType::Corpse), 0.0);
        assert_eq!(game_state.get_resource(ResourceType::Maggot), 100.0);
    }

    #[test]
    fn test_existing_maggots_accumulate() {
        let mut game_state = create_test_game_state();
        game_state.set_resource(ResourceType::Corpse, 2.0);
        game_state.set_resource(ResourceType::Maggot, 10.0);

        let (corpses, maggots) = produce_maggots(&mut game_state, 1000.0);

        assert_eq!(corpses, 2);
        assert_eq!(maggots, 40);
        assert_eq!(game_state.get_resource(ResourceType::Corpse), 0.0);
        assert_eq!(game_state.get_resource(ResourceType::Maggot), 50.0);
    }

    #[test]
    fn test_fractional_corpses() {
        let mut game_state = create_test_game_state();
        game_state.set_resource(ResourceType::Corpse, 2.5);

        let (corpses, maggots) = produce_maggots(&mut game_state, 1000.0);

        assert_eq!(corpses, 2);
        assert_eq!(maggots, 50);
        assert_eq!(game_state.get_resource(ResourceType::Corpse), 0.0);
        assert_eq!(game_state.get_resource(ResourceType::Maggot), 50.0);
    }
}
