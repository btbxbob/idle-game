//! English name generator for NPCs and workers
//! Generates random first and last names based on gender

use rand::prelude::IndexedRandom;
use rand::rng;

/// Gender enum for name generation
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Gender {
    Male,
    Female,
    Other,
}

/// English name generator
pub struct NameGenerator;

impl NameGenerator {
    /// Generate random full name
    pub fn generate_full_name(gender: Gender) -> String {
        let first_name = Self::generate_first_name(gender);
        let last_name = Self::generate_last_name();
        format!("{} {}", first_name, last_name)
    }

    /// Generate first name (based on gender)
    fn generate_first_name(gender: Gender) -> &'static str {
        let male_names = [
            "James",
            "John",
            "Robert",
            "Michael",
            "William",
            "David",
            "Richard",
            "Joseph",
            "Thomas",
            "Charles",
            "Christopher",
            "Daniel",
            "Matthew",
            "Anthony",
            "Mark",
            "Donald",
            "Steven",
            "Paul",
            "Andrew",
            "Joshua",
            "Kenneth",
            "Kevin",
            "Brian",
            "George",
            "Edward",
        ];

        let female_names = [
            "Mary",
            "Patricia",
            "Jennifer",
            "Linda",
            "Elizabeth",
            "Susan",
            "Jessica",
            "Sarah",
            "Karen",
            "Nancy",
            "Lisa",
            "Betty",
            "Margaret",
            "Sandra",
            "Ashley",
            "Kimberly",
            "Emily",
            "Donna",
            "Michelle",
            "Dorothy",
            "Carol",
            "Amanda",
            "Melissa",
            "Deborah",
            "Stephanie",
        ];

        let mut rng = rng();

        match gender {
            Gender::Male => male_names.choose(&mut rng).unwrap(),
            Gender::Female => female_names.choose(&mut rng).unwrap(),
            Gender::Other => {
                let all_names: Vec<_> = male_names.iter().chain(female_names.iter()).collect();
                *all_names.choose(&mut rng).unwrap()
            }
        }
    }

    /// Generate last name
    fn generate_last_name() -> &'static str {
        let last_names = [
            "Smith",
            "Johnson",
            "Williams",
            "Brown",
            "Jones",
            "Garcia",
            "Miller",
            "Davis",
            "Rodriguez",
            "Martinez",
            "Hernandez",
            "Lopez",
            "Gonzalez",
            "Wilson",
            "Anderson",
            "Thomas",
            "Taylor",
            "Moore",
            "Jackson",
            "Martin",
            "Lee",
            "Perez",
            "Thompson",
            "White",
            "Harris",
        ];

        let mut rng = rng();
        last_names.choose(&mut rng).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_full_name_male() {
        let name = NameGenerator::generate_full_name(Gender::Male);
        assert!(
            name.contains(' '),
            "Name should contain a space between first and last name"
        );
        let parts: Vec<&str> = name.split(' ').collect();
        assert_eq!(parts.len(), 2, "Name should have exactly 2 parts");
    }

    #[test]
    fn test_generate_full_name_female() {
        let name = NameGenerator::generate_full_name(Gender::Female);
        assert!(
            name.contains(' '),
            "Name should contain a space between first and last name"
        );
        let parts: Vec<&str> = name.split(' ').collect();
        assert_eq!(parts.len(), 2, "Name should have exactly 2 parts");
    }

    #[test]
    fn test_generate_full_name_other() {
        let name = NameGenerator::generate_full_name(Gender::Other);
        assert!(
            name.contains(' '),
            "Name should contain a space between first and last name"
        );
        let parts: Vec<&str> = name.split(' ').collect();
        assert_eq!(parts.len(), 2, "Name should have exactly 2 parts");
    }

    #[test]
    fn test_name_generator() {
        let name1 = NameGenerator::generate_full_name(Gender::Male);
        let name2 = NameGenerator::generate_full_name(Gender::Female);
        assert!(name1.contains(' ')); // contains space (first + last name)
        assert!(name2.contains(' '));
    }

    #[test]
    fn test_names_are_different() {
        // Generate multiple names to verify randomness
        let names: Vec<String> = (0..10)
            .map(|i| {
                if i % 2 == 0 {
                    NameGenerator::generate_full_name(Gender::Male)
                } else {
                    NameGenerator::generate_full_name(Gender::Female)
                }
            })
            .collect();

        // All names should be properly formatted
        for name in &names {
            assert!(name.contains(' '), "Each name should have a space");
            let parts: Vec<&str> = name.split(' ').collect();
            assert_eq!(parts.len(), 2, "Each name should have exactly 2 parts");
            // First letter of each part should be uppercase
            assert!(parts[0].chars().next().unwrap().is_uppercase());
            assert!(parts[1].chars().next().unwrap().is_uppercase());
        }
    }
}
