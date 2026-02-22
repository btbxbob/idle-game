//! Worker name generator using creative word combinations
//! Generates unique names by combining natural elements with colors

use std::collections::HashSet;

/// Natural elements list (50 items)
const NATURAL_ELEMENTS: &[&str] = &[
    "River",
    "Sky",
    "Ocean",
    "Stone",
    "Forest",
    "Mountain",
    "Valley",
    "Stream",
    "Meadow",
    "Cliff",
    "Waterfall",
    "Canyon",
    "Glacier",
    "Volcano",
    "Desert",
    "Island",
    "Peninsula",
    "Bay",
    "Harbor",
    "Reef",
    "Cave",
    "Cavern",
    "Grotto",
    "Spring",
    "Well",
    "Grove",
    "Thicket",
    "Woodland",
    "Prairie",
    "Plain",
    "Savanna",
    "Tundra",
    "Marsh",
    "Swamp",
    "Bog",
    "Dune",
    "Peak",
    "Summit",
    "Ridge",
    "Hill",
    "Knoll",
    "Butte",
    "Mesa",
    "Plateau",
    "Basin",
    "Delta",
    "Estuary",
    "Lagoon",
    "Oasis",
    "Coast",
];

/// Colors list (20 items)
const COLORS: &[&str] = &[
    "Blue", "Green", "Red", "Silver", "Golden", "Purple", "Crimson", "Azure", "Emerald", "Ruby",
    "Amber", "Jade", "Ivory", "Onyx", "Pearl", "Coral", "Sage", "Copper", "Bronze", "Violet",
];

/// Simple pseudo-random number generator
static mut COUNTER: u32 = 0;

fn random_index(max: usize) -> usize {
    unsafe {
        COUNTER = COUNTER.wrapping_add(0x9E3779B9);
        (COUNTER as usize) % max
    }
}

/// Generate a single name by combining element and color
pub fn generate_name() -> String {
    let element_idx = random_index(NATURAL_ELEMENTS.len());
    let color_idx = random_index(COLORS.len());
    let pattern = random_index(2);

    let element = NATURAL_ELEMENTS[element_idx];
    let color = COLORS[color_idx];

    if pattern == 0 {
        format!("{} {}", element, color)
    } else {
        format!("{} {}", color, element)
    }
}

/// Generate a unique name not in the existing list
pub fn generate_unique_name(existing: &[String]) -> String {
    let existing_set: HashSet<&String> = existing.iter().collect();

    // Safety limit to prevent infinite loops
    let max_attempts = 1000;
    let mut attempts = 0;

    while attempts < max_attempts {
        let name = generate_name();
        if !existing_set.contains(&name) {
            return name;
        }
        attempts += 1;
    }

    // Fallback: generate a numbered name if all combinations exhausted
    format!("Unique_{}", existing.len())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_name_returns_non_empty() {
        let name = generate_name();
        assert!(!name.is_empty());
        assert!(name.len() > 5);
    }

    #[test]
    fn test_generate_name_format() {
        let name = generate_name();
        let parts: Vec<&str> = name.split_whitespace().collect();
        assert_eq!(parts.len(), 2, "Name should have exactly 2 words");
    }

    #[test]
    fn test_generate_name_contains_valid_words() {
        for _ in 0..100 {
            let name = generate_name();
            let parts: Vec<&str> = name.split_whitespace().collect();

            let has_element = parts.iter().any(|p| NATURAL_ELEMENTS.contains(p));
            let has_color = parts.iter().any(|p| COLORS.contains(p));

            assert!(
                has_element || has_color,
                "Name should contain valid element or color"
            );
        }
    }

    #[test]
    fn test_generate_unique_name_returns_unique() {
        let existing = vec!["River Blue".to_string(), "Sky Green".to_string()];
        let new_name = generate_unique_name(&existing);

        assert!(!existing.contains(&new_name));
    }

    #[test]
    fn test_generate_500_unique_names() {
        let mut names: Vec<String> = Vec::new();

        for _ in 0..500 {
            let name = generate_unique_name(&names);
            assert!(!names.contains(&name), "Duplicate name generated: {}", name);
            names.push(name);
        }

        assert_eq!(names.len(), 500, "Should generate 500 unique names");
    }

    #[test]
    fn test_generate_1000_unique_names() {
        let mut names: Vec<String> = Vec::new();

        for _ in 0..1000 {
            let name = generate_unique_name(&names);
            assert!(!names.contains(&name), "Duplicate name generated: {}", name);
            names.push(name);
        }

        assert_eq!(names.len(), 1000, "Should generate 1000 unique names");
    }

    #[test]
    fn test_name_combination_patterns() {
        let mut has_element_first = false;
        let mut has_color_first = false;

        for _ in 0..100 {
            let name = generate_name();
            let parts: Vec<&str> = name.split_whitespace().collect();

            if parts.len() == 2 {
                let first = parts[0];
                let second = parts[1];

                if NATURAL_ELEMENTS.contains(&first) && COLORS.contains(&second) {
                    has_element_first = true;
                }
                if COLORS.contains(&first) && NATURAL_ELEMENTS.contains(&second) {
                    has_color_first = true;
                }
            }
        }

        assert!(has_element_first, "Should have 'Element Color' pattern");
        assert!(has_color_first, "Should have 'Color Element' pattern");
    }

    #[test]
    fn test_name_aesthetics() {
        let sample_names: Vec<String> = (0..20).map(|_| generate_name()).collect();

        for name in &sample_names {
            assert!(name.chars().all(|c| c.is_alphabetic() || c.is_whitespace()));

            let parts: Vec<&str> = name.split_whitespace().collect();
            for part in parts {
                assert!(part.chars().next().unwrap().is_uppercase());
            }
        }
    }
}
