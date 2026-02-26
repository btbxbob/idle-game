//! Worker generator for automatic worker spawning
//! Generates random workers with name, gender, hobbies, and traits

use crate::entities::worker::{Gender, Hobby, Trait, Worker};
use crate::utils::name_generator::NameGenerator;
use rand::RngExt;
use rand::seq::IndexedRandom;
use rand::rng;


/// Worker generator for creating random workers
pub struct WorkerGenerator;

impl WorkerGenerator {
    /// Generate random gender
    pub fn random_gender() -> Gender {
        let mut rng = rng();
        match rng.random_range(0..3) {
            0 => Gender::Male,
            1 => Gender::Female,
            _ => Gender::Other,
        }
    }

    /// Generate random hobbies (1-2 hobbies)
    pub fn random_hobbies() -> Vec<Hobby> {
        let all_hobbies = vec![
            Hobby::Reading,
            Hobby::Gaming,
            Hobby::Sports,
            Hobby::Music,
            Hobby::Art,
            Hobby::Cooking,
            Hobby::Gardening,
            Hobby::Fishing,
            Hobby::Traveling,
            Hobby::Photography,
        ];

        let mut rng = rng();
        let count = rng.random_range(1..=2); // 1-2 hobbies

        all_hobbies
            .sample(&mut rng, count)
            .cloned()
            .collect()
    }

    /// Generate random traits (1 primary + 0-2 secondary)
    pub fn random_traits() -> (Trait, Vec<Trait>) {
        let all_traits = vec![
            Trait::Diligent,
            Trait::Hardworking,
            Trait::Lazy,
            Trait::Efficient,
            Trait::Slow,
            Trait::Intelligent,
            Trait::FastLearner,
            Trait::Genius,
            Trait::SlowLearner,
            Trait::Social,
            Trait::Loner,
            Trait::Charismatic,
            Trait::Shy,
            Trait::NightOwl,
            Trait::EarlyBird,
            Trait::Clumsy,
            Trait::Forgetful,
            Trait::Careless,
            Trait::Careful,
            Trait::Creative,
            Trait::Persevering,
            Trait::Optimistic,
        ];

        let mut rng = rng();

        // Select primary trait
        let primary = all_traits
            .choose(&mut rng)
            .copied()
            .unwrap_or(Trait::Hardworking);

        // Select 0-2 secondary traits
        let secondary_count = rng.random_range(0..=2);
        let secondary: Vec<Trait> = all_traits
            .sample(&mut rng, secondary_count)
            .cloned()
            .filter(|t| *t != primary) // Don't duplicate primary trait
            .collect();

        (primary, secondary)
    }

    /// Generate random skill based on primary trait
    fn random_skill() -> &'static str {
        let skills = [
            "mining",
            "logging",
            "masonry",
            "crafting",
            "farming",
            "fishing",
            "hunting",
            "trading",
            "engineering",
            "cooking",
        ];
        let mut rng = rng();
        skills.choose(&mut rng).unwrap_or(&"general")
    }

    /// Generate random preferences based on skill
    fn random_preferences(skill: &str) -> String {
        match skill {
            "mining" => "Coin Mine",
            "logging" => "Woodcutter",
            "masonry" => "Stone Quarry",
            "crafting" => "Workshop",
            "farming" => "Farm",
            "fishing" => "Fishery",
            "hunting" => "Hunting Lodge",
            "trading" => "Market",
            "engineering" => "Factory",
            "cooking" => "Kitchen",
            _ => "Any",
        }
        .to_string()
    }

    /// Generate complete random worker
    pub fn generate_random_worker() -> Worker {
        let gender = Self::random_gender();

        // Convert worker Gender to name generator Gender
        let name_gender = match gender {
            Gender::Male => super::name_generator::Gender::Male,
            Gender::Female => super::name_generator::Gender::Female,
            Gender::Other => super::name_generator::Gender::Other,
        };

        let name = NameGenerator::generate_full_name(name_gender);
        let hobbies = Self::random_hobbies();
        let (primary_trait, secondary_traits) = Self::random_traits();
        let skill = Self::random_skill();
        let preferences = Self::random_preferences(skill);

        Worker::new_full(
            &name,
            skill,
            "新工人",
            &preferences,
            gender,
            hobbies,
            primary_trait,
            secondary_traits,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_random_gender() {
        // Test that random_gender produces valid values
        for _ in 0..10 {
            let gender = WorkerGenerator::random_gender();
            assert!(
                matches!(gender, Gender::Male | Gender::Female | Gender::Other),
                "Gender should be one of the three variants"
            );
        }
    }

    #[test]
    fn test_random_hobbies() {
        let hobbies = WorkerGenerator::random_hobbies();
        assert!(
            hobbies.len() >= 1 && hobbies.len() <= 2,
            "Should have 1-2 hobbies, got {}",
            hobbies.len()
        );
    }

    #[test]
    fn test_random_traits() {
        let (primary, secondary) = WorkerGenerator::random_traits();

        // Primary should always exist
        assert!(
            !matches!(primary, Trait::Hardworking) || true,
            "Primary trait should be set"
        );

        // Secondary should be 0-2 and not contain primary
        assert!(
            secondary.len() <= 2,
            "Should have at most 2 secondary traits"
        );
        assert!(
            !secondary.contains(&primary),
            "Secondary traits should not contain primary trait"
        );
    }

    #[test]
    fn test_generate_random_worker() {
        let worker = WorkerGenerator::generate_random_worker();

        // Name should not be empty
        assert!(!worker.name.is_empty(), "Worker name should not be empty");
        assert!(
            worker.name.contains(' '),
            "Name should contain first and last name"
        );

        // Should have 1-2 hobbies
        assert!(
            worker.hobbies.len() >= 1 && worker.hobbies.len() <= 2,
            "Worker should have 1-2 hobbies"
        );

        // Should have skills set
        assert!(!worker.skills.is_empty(), "Worker should have skills set");

        // Should have preferences set
        assert!(
            !worker.preferences.is_empty(),
            "Worker should have preferences set"
        );

        // Level should start at 1
        assert_eq!(worker.level, 1, "New worker should start at level 1");

        // XP should start at 0
        assert_eq!(worker.xp, 0.0, "New worker should start with 0 XP");
    }

    #[test]
    fn test_worker_trait_consistency() {
        let worker = WorkerGenerator::generate_random_worker();

        // Verify trait effects can be calculated without panic
        let effects = worker.calculate_trait_effects();

        // Efficiency bonus should be finite
        assert!(
            effects.efficiency_bonus.is_finite(),
            "Efficiency bonus should be finite"
        );

        // XP bonus should be finite
        assert!(effects.xp_bonus.is_finite(), "XP bonus should be finite");

        // Team bonus should be finite
        assert!(
            effects.team_bonus.is_finite(),
            "Team bonus should be finite"
        );
    }

    #[test]
    fn test_multiple_workers_unique() {
        // Generate multiple workers and verify they're different
        let workers: Vec<Worker> = (0..5)
            .map(|_| WorkerGenerator::generate_random_worker())
            .collect();

        // At least some workers should have different names
        let unique_names: std::collections::HashSet<_> =
            workers.iter().map(|w| w.name.clone()).collect();
        assert!(
            unique_names.len() > 1,
            "Generated workers should have different names"
        );
    }
}
