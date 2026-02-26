use crate::state::GameState;

/// Calculate Prestige Points (PP) on rebirth
pub fn calculate_pp_on_rebirth(
    state: &GameState,
    researched_techs: usize,
    unlocked_achievements: usize,
) -> f64 {
    let total_resources: f64 = state.resources.values().sum();
    let base_pp = (total_resources / 1e6).sqrt();
    let tech_bonus = researched_techs as f64 * 0.1;
    let achievement_bonus = unlocked_achievements as f64 * 0.05;
    let final_pp = base_pp * (1.0 + tech_bonus + achievement_bonus);
    final_pp
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::resource::ResourceType;
    use std::collections::HashMap;

    #[test]
    fn test_calculate_pp_no_resources() {
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Gold, 0.0);

        let state = GameState {
            version: "0.2.6".to_string(),
            resources,
            coins_per_click: 1.0,
            coins_per_second: 0.0,
            wood_per_second: 0.0,
            stone_per_second: 0.0,
            autoclick_count: 0,
            total_clicks: 0,
            last_update_time: 0.0,
            prestige_points: 0,
            prestige_multiplier: 1.0,
        };

        let pp = calculate_pp_on_rebirth(&state, 0, 0);
        assert_eq!(pp, 0.0);
    }

    #[test]
    fn test_calculate_pp_with_resources() {
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Gold, 1_000_000.0);

        let state = GameState {
            version: "0.2.6".to_string(),
            resources,
            coins_per_click: 1.0,
            coins_per_second: 0.0,
            wood_per_second: 0.0,
            stone_per_second: 0.0,
            autoclick_count: 0,
            total_clicks: 0,
            last_update_time: 0.0,
            prestige_points: 0,
            prestige_multiplier: 1.0,
        };

        let pp = calculate_pp_on_rebirth(&state, 0, 0);
        assert!((pp - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_calculate_pp_with_bonuses() {
        let mut resources = HashMap::new();
        resources.insert(ResourceType::Gold, 1_000_000.0);

        let state = GameState {
            version: "0.2.6".to_string(),
            resources,
            coins_per_click: 1.0,
            coins_per_second: 0.0,
            wood_per_second: 0.0,
            stone_per_second: 0.0,
            autoclick_count: 0,
            total_clicks: 0,
            last_update_time: 0.0,
            prestige_points: 0,
            prestige_multiplier: 1.0,
        };

        let pp = calculate_pp_on_rebirth(&state, 10, 5);
        assert!((pp - 2.25).abs() < 1e-10);
    }
}
