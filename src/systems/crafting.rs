use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct CraftingRecipe {
    pub id: String,
    pub name: String,
    pub input_resource: String,
    pub input_amount: f64,
    pub output_resource: String,
    pub output_amount: f64,
    pub unlocked: bool,
}

impl CraftingRecipe {
    /// Get all default crafting recipes
    pub fn get_default_recipes() -> Vec<CraftingRecipe> {
        vec![
            CraftingRecipe {
                id: "coins_to_wood".to_string(),
                name: "金币换木材".to_string(),
                input_resource: "coins".to_string(),
                input_amount: 100.0,
                output_resource: "wood".to_string(),
                output_amount: 10.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "wood_to_coins".to_string(),
                name: "木材换金币".to_string(),
                input_resource: "wood".to_string(),
                input_amount: 10.0,
                output_resource: "coins".to_string(),
                output_amount: 100.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "coins_to_stone".to_string(),
                name: "金币换石头".to_string(),
                input_resource: "coins".to_string(),
                input_amount: 100.0,
                output_resource: "stone".to_string(),
                output_amount: 1.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "stone_to_coins".to_string(),
                name: "石头换金币".to_string(),
                input_resource: "stone".to_string(),
                input_amount: 1.0,
                output_resource: "coins".to_string(),
                output_amount: 100.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "wood_to_stone".to_string(),
                name: "木材换石头".to_string(),
                input_resource: "wood".to_string(),
                input_amount: 10.0,
                output_resource: "stone".to_string(),
                output_amount: 1.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "stone_to_wood".to_string(),
                name: "石头换木材".to_string(),
                input_resource: "stone".to_string(),
                input_amount: 1.0,
                output_resource: "wood".to_string(),
                output_amount: 10.0,
                unlocked: true,
            },
        ]
    }
}
