use crate::state::resource::ResourceType;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct CraftingRecipe {
    pub id: String,
    pub name: String,
    pub input_resource: ResourceType,
    pub input_amount: f64,
    pub output_resource: ResourceType,
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
                input_resource: ResourceType::Gold,
                input_amount: 100.0,
                output_resource: ResourceType::Wood,
                output_amount: 10.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "wood_to_coins".to_string(),
                name: "木材换金币".to_string(),
                input_resource: ResourceType::Wood,
                input_amount: 10.0,
                output_resource: ResourceType::Gold,
                output_amount: 100.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "coins_to_stone".to_string(),
                name: "金币换石头".to_string(),
                input_resource: ResourceType::Gold,
                input_amount: 100.0,
                output_resource: ResourceType::Stone,
                output_amount: 1.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "stone_to_coins".to_string(),
                name: "石头换金币".to_string(),
                input_resource: ResourceType::Stone,
                input_amount: 1.0,
                output_resource: ResourceType::Gold,
                output_amount: 100.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "wood_to_stone".to_string(),
                name: "木材换石头".to_string(),
                input_resource: ResourceType::Wood,
                input_amount: 10.0,
                output_resource: ResourceType::Stone,
                output_amount: 1.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "stone_to_wood".to_string(),
                name: "石头换木材".to_string(),
                input_resource: ResourceType::Stone,
                input_amount: 1.0,
                output_resource: ResourceType::Wood,
                output_amount: 10.0,
                unlocked: true,
            },
            // ============================================
            // Metal Ingots (3 recipes)
            // ============================================
            CraftingRecipe {
                id: "iron_ore_to_iron_ingot".to_string(),
                name: "铁矿炼铁锭".to_string(),
                input_resource: ResourceType::IronOre,
                input_amount: 10.0,
                output_resource: ResourceType::IronIngot,
                output_amount: 1.0,
                unlocked: true,
            },
            CraftingRecipe {
                id: "copper_ore_to_copper_ingot".to_string(),
                name: "铜矿炼铜锭".to_string(),
                input_resource: ResourceType::CopperOre,
                input_amount: 10.0,
                output_resource: ResourceType::CopperIngot,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "aluminum_ore_to_aluminum_ingot".to_string(),
                name: "铝矿炼铝锭".to_string(),
                input_resource: ResourceType::AluminumOre,
                input_amount: 10.0,
                output_resource: ResourceType::AluminumIngot,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Metal Plates (3 recipes)
            // ============================================
            CraftingRecipe {
                id: "iron_ingot_to_steel_plate".to_string(),
                name: "铁锭制钢板".to_string(),
                input_resource: ResourceType::IronIngot,
                input_amount: 10.0,
                output_resource: ResourceType::SteelPlate,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "copper_ingot_to_copper_plate".to_string(),
                name: "铜锭制铜板".to_string(),
                input_resource: ResourceType::CopperIngot,
                input_amount: 10.0,
                output_resource: ResourceType::CopperPlate,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "aluminum_ingot_to_aluminum_plate".to_string(),
                name: "铝锭制铝板".to_string(),
                input_resource: ResourceType::AluminumIngot,
                input_amount: 10.0,
                output_resource: ResourceType::AluminumPlate,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Industrial Materials (4 recipes)
            // ============================================
            CraftingRecipe {
                id: "stone_to_glass".to_string(),
                name: "石头制玻璃".to_string(),
                input_resource: ResourceType::Stone,
                input_amount: 10.0,
                output_resource: ResourceType::Glass,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "oil_to_plastic".to_string(),
                name: "石油制塑料".to_string(),
                input_resource: ResourceType::Oil,
                input_amount: 10.0,
                output_resource: ResourceType::Plastic,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "oil_to_chemicals".to_string(),
                name: "石油制化学品".to_string(),
                input_resource: ResourceType::Oil,
                input_amount: 10.0,
                output_resource: ResourceType::Chemicals,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "coal_to_fuel".to_string(),
                name: "煤矿制燃料".to_string(),
                input_resource: ResourceType::Coal,
                input_amount: 10.0,
                output_resource: ResourceType::Fuel,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Basic Materials (4 recipes)
            // ============================================
            CraftingRecipe {
                id: "wood_to_paper".to_string(),
                name: "木头造纸张".to_string(),
                input_resource: ResourceType::Wood,
                input_amount: 10.0,
                output_resource: ResourceType::Paper,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "stone_to_ink".to_string(),
                name: "石头制墨水".to_string(),
                input_resource: ResourceType::Stone,
                input_amount: 10.0,
                output_resource: ResourceType::Ink,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "food_to_cloth".to_string(),
                name: "食物制布料".to_string(),
                input_resource: ResourceType::Food,
                input_amount: 10.0,
                output_resource: ResourceType::Cloth,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "food_to_leather".to_string(),
                name: "食物制皮革".to_string(),
                input_resource: ResourceType::Food,
                input_amount: 10.0,
                output_resource: ResourceType::Leather,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Construction Materials (6 recipes)
            // ============================================
            CraftingRecipe {
                id: "stone_to_ceramic".to_string(),
                name: "石头制陶瓷".to_string(),
                input_resource: ResourceType::Stone,
                input_amount: 10.0,
                output_resource: ResourceType::Ceramic,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "stone_to_cement".to_string(),
                name: "石头制水泥".to_string(),
                input_resource: ResourceType::Stone,
                input_amount: 10.0,
                output_resource: ResourceType::Cement,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "stone_to_brick".to_string(),
                name: "石头制砖块".to_string(),
                input_resource: ResourceType::Stone,
                input_amount: 10.0,
                output_resource: ResourceType::Brick,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "iron_ore_to_rebar".to_string(),
                name: "铁矿制钢筋".to_string(),
                input_resource: ResourceType::IronOre,
                input_amount: 10.0,
                output_resource: ResourceType::Rebar,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "stone_to_wire".to_string(),
                name: "石头制电线".to_string(),
                input_resource: ResourceType::Stone,
                input_amount: 10.0,
                output_resource: ResourceType::Wire,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "iron_ore_to_pipe".to_string(),
                name: "铁矿制管道".to_string(),
                input_resource: ResourceType::IronOre,
                input_amount: 10.0,
                output_resource: ResourceType::Pipe,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Mechanical Parts (5 recipes)
            // ============================================
            CraftingRecipe {
                id: "iron_ore_to_valve".to_string(),
                name: "铁矿制阀门".to_string(),
                input_resource: ResourceType::IronOre,
                input_amount: 10.0,
                output_resource: ResourceType::Valve,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_to_gear".to_string(),
                name: "钢板制齿轮".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Gear,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_to_bearing".to_string(),
                name: "钢板制轴承".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Bearing,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_to_spring".to_string(),
                name: "钢板制弹簧".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Spring,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_to_screw".to_string(),
                name: "钢板制螺丝".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Screw,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Hardware (5 recipes)
            // ============================================
            CraftingRecipe {
                id: "steel_plate_to_nut".to_string(),
                name: "钢板制螺母".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Nut,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_to_washer".to_string(),
                name: "钢板制垫片".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Washer,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_to_pump".to_string(),
                name: "钢板制泵".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Pump,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_to_motor".to_string(),
                name: "钢板制马达".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Motor,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_to_sensor".to_string(),
                name: "钢板制传感器".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Sensor,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Electronic Components (5 recipes)
            // ============================================
            CraftingRecipe {
                id: "copper_plate_to_circuit_board".to_string(),
                name: "铜板制电路板".to_string(),
                input_resource: ResourceType::CopperPlate,
                input_amount: 10.0,
                output_resource: ResourceType::CircuitBoard,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "copper_plate_to_capacitor".to_string(),
                name: "铜板制电容器".to_string(),
                input_resource: ResourceType::CopperPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Capacitor,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "copper_plate_to_resistor".to_string(),
                name: "铜板制电阻器".to_string(),
                input_resource: ResourceType::CopperPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Resistor,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "copper_plate_to_diode".to_string(),
                name: "铜板制二极管".to_string(),
                input_resource: ResourceType::CopperPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Diode,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "copper_plate_to_transistor".to_string(),
                name: "铜板制晶体管".to_string(),
                input_resource: ResourceType::CopperPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Transistor,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Electrical Equipment (5 recipes)
            // ============================================
            CraftingRecipe {
                id: "copper_plate_to_transformer".to_string(),
                name: "铜板制变压器".to_string(),
                input_resource: ResourceType::CopperPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Transformer,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "copper_plate_to_generator".to_string(),
                name: "铜板制发电机".to_string(),
                input_resource: ResourceType::CopperPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Generator,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "copper_plate_to_compressor".to_string(),
                name: "铜板制压缩机".to_string(),
                input_resource: ResourceType::CopperPlate,
                input_amount: 10.0,
                output_resource: ResourceType::Compressor,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "copper_plate_plastic_to_battery".to_string(),
                name: "铜板塑料制电池".to_string(),
                input_resource: ResourceType::CopperPlate,
                input_amount: 20.0,
                output_resource: ResourceType::Battery,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_sensor_to_controller".to_string(),
                name: "钢板传感器制控制器".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 20.0,
                output_resource: ResourceType::Microchip,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // High-Tech Components (5 recipes)
            // ============================================
            CraftingRecipe {
                id: "circuit_board_chip_to_chip".to_string(),
                name: "电路板芯片制芯片".to_string(),
                input_resource: ResourceType::CircuitBoard,
                input_amount: 100.0,
                output_resource: ResourceType::Microchip,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_gear_to_engine".to_string(),
                name: "钢板齿轮制引擎".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 100.0,
                output_resource: ResourceType::Engine,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "circuit_board_sensor_to_robot".to_string(),
                name: "电路板传感器制机器人".to_string(),
                input_resource: ResourceType::CircuitBoard,
                input_amount: 100.0,
                output_resource: ResourceType::Robot,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "steel_plate_circuit_board_to_satellite".to_string(),
                name: "钢板电路板制卫星".to_string(),
                input_resource: ResourceType::SteelPlate,
                input_amount: 100.0,
                output_resource: ResourceType::Satellite,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "engine_steel_plate_to_spaceship".to_string(),
                name: "引擎钢板制太空船".to_string(),
                input_resource: ResourceType::Engine,
                input_amount: 100.0,
                output_resource: ResourceType::Spaceship,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Advanced Technology (5 recipes)
            // ============================================
            CraftingRecipe {
                id: "chip_circuit_board_to_quantum_computer".to_string(),
                name: "芯片电路板制量子计算机".to_string(),
                input_resource: ResourceType::Microchip,
                input_amount: 100.0,
                output_resource: ResourceType::QuantumComputer,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "fuel_chemicals_to_antimatter".to_string(),
                name: "燃料化学品制反物质".to_string(),
                input_resource: ResourceType::Fuel,
                input_amount: 100.0,
                output_resource: ResourceType::Antimatter,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "fuel_antimatter_to_dark_matter".to_string(),
                name: "燃料反物质制暗物质".to_string(),
                input_resource: ResourceType::Fuel,
                input_amount: 100.0,
                output_resource: ResourceType::DarkMatter,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "crystal_time_to_time_crystal".to_string(),
                name: "水晶时间制时间水晶".to_string(),
                input_resource: ResourceType::Crystal,
                input_amount: 100.0,
                output_resource: ResourceType::TimeCrystal,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "chip_robot_to_nanobot".to_string(),
                name: "芯片机器人制纳米机器".to_string(),
                input_resource: ResourceType::Microchip,
                input_amount: 100.0,
                output_resource: ResourceType::Nanobot,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Special Resources (4 recipes)
            // ============================================
            CraftingRecipe {
                id: "food_to_corpse".to_string(),
                name: "食物腐烂".to_string(),
                input_resource: ResourceType::Food,
                input_amount: 10.0,
                output_resource: ResourceType::Corpse,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "corpse_to_maggot".to_string(),
                name: "尸体分解".to_string(),
                input_resource: ResourceType::Corpse,
                input_amount: 1.0,
                output_resource: ResourceType::Maggot,
                output_amount: 10.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "maggot_to_food".to_string(),
                name: "蛆虫转化食物".to_string(),
                input_resource: ResourceType::Maggot,
                input_amount: 10.0,
                output_resource: ResourceType::Food,
                output_amount: 1.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "crystal_to_gold".to_string(),
                name: "水晶炼金".to_string(),
                input_resource: ResourceType::Crystal,
                input_amount: 1.0,
                output_resource: ResourceType::Gold,
                output_amount: 100.0,
                unlocked: false,
            },
            // ============================================
            // Extended Metal Recipes (4 recipes - making AluminumPlate usable)
            // ============================================
            CraftingRecipe {
                id: "aluminum_plate_to_aluminum_ingot".to_string(),
                name: "铝板熔铝锭".to_string(),
                input_resource: ResourceType::AluminumPlate,
                input_amount: 1.0,
                output_resource: ResourceType::AluminumIngot,
                output_amount: 10.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "aluminum_plate_to_wire".to_string(),
                name: "铝板制电线".to_string(),
                input_resource: ResourceType::AluminumPlate,
                input_amount: 1.0,
                output_resource: ResourceType::Wire,
                output_amount: 10.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "aluminum_plate_to_pipe".to_string(),
                name: "铝板制管道".to_string(),
                input_resource: ResourceType::AluminumPlate,
                input_amount: 1.0,
                output_resource: ResourceType::Pipe,
                output_amount: 10.0,
                unlocked: false,
            },
            CraftingRecipe {
                id: "stone_crystal_to_crystal".to_string(),
                name: "石头水晶制水晶".to_string(),
                input_resource: ResourceType::Stone,
                input_amount: 100.0,
                output_resource: ResourceType::Crystal,
                output_amount: 1.0,
                unlocked: false,
            },
            // ============================================
            // Maggot Factory (maggots → food)
            // ============================================
            CraftingRecipe {
                id: "maggots_to_food".to_string(),
                name: "蛆虫制食物".to_string(),
                input_resource: ResourceType::Maggot,
                input_amount: 10.0,
                output_resource: ResourceType::Food,
                output_amount: 5.0,
                unlocked: true,
            },
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::resource::ResourceType;

    #[test]
    fn test_get_default_recipes_count() {
        let recipes = CraftingRecipe::get_default_recipes();
        assert!(
            recipes.len() >= 60,
            "Expected at least 60 recipes, got {}",
            recipes.len()
        );
        assert!(
            recipes.len() <= 70,
            "Expected at most 70 recipes, got {}",
            recipes.len()
        );
    }

    #[test]
    fn test_recipe_fields_present() {
        let recipes = CraftingRecipe::get_default_recipes();
        assert!(!recipes.is_empty());
        let recipe = &recipes[0];
        assert!(!recipe.id.is_empty());
        assert!(!recipe.name.is_empty());
        assert!(recipe.input_amount > 0.0);
        assert!(recipe.output_amount > 0.0);
    }

    #[test]
    fn test_basic_trade_recipes_unlocked() {
        let recipes = CraftingRecipe::get_default_recipes();
        let coins_to_wood = recipes.iter().find(|r| r.id == "coins_to_wood").unwrap();
        assert!(coins_to_wood.unlocked);
        let wood_to_coins = recipes.iter().find(|r| r.id == "wood_to_coins").unwrap();
        assert!(wood_to_coins.unlocked);
        let coins_to_stone = recipes.iter().find(|r| r.id == "coins_to_stone").unwrap();
        assert!(coins_to_stone.unlocked);
        let stone_to_coins = recipes.iter().find(|r| r.id == "stone_to_coins").unwrap();
        assert!(stone_to_coins.unlocked);
        let wood_to_stone = recipes.iter().find(|r| r.id == "wood_to_stone").unwrap();
        assert!(wood_to_stone.unlocked);
        let stone_to_wood = recipes.iter().find(|r| r.id == "stone_to_wood").unwrap();
        assert!(stone_to_wood.unlocked);
    }

    #[test]
    fn test_advanced_recipes_locked() {
        let recipes = CraftingRecipe::get_default_recipes();
        let iron_ore_to_iron_ingot = recipes
            .iter()
            .find(|r| r.id == "iron_ore_to_iron_ingot")
            .unwrap();
        assert!(iron_ore_to_iron_ingot.unlocked);
        let copper_ore_to_copper_ingot = recipes
            .iter()
            .find(|r| r.id == "copper_ore_to_copper_ingot")
            .unwrap();
        assert!(!copper_ore_to_copper_ingot.unlocked);
        let aluminum_ore_to_aluminum_ingot = recipes
            .iter()
            .find(|r| r.id == "aluminum_ore_to_aluminum_ingot")
            .unwrap();
        assert!(!aluminum_ore_to_aluminum_ingot.unlocked);
        let iron_ingot_to_steel_plate = recipes
            .iter()
            .find(|r| r.id == "iron_ingot_to_steel_plate")
            .unwrap();
        assert!(!iron_ingot_to_steel_plate.unlocked);
    }

    #[test]
    fn test_serialization_deserialization_roundtrip() {
        let recipes = CraftingRecipe::get_default_recipes();
        let recipe = &recipes[0];
        let serialized = serde_json::to_string(recipe).unwrap();
        assert!(!serialized.is_empty());
        let deserialized: CraftingRecipe = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized.id, recipe.id);
        assert_eq!(deserialized.name, recipe.name);
        assert_eq!(deserialized.input_resource, recipe.input_resource);
        assert_eq!(deserialized.input_amount, recipe.input_amount);
        assert_eq!(deserialized.output_resource, recipe.output_resource);
        assert_eq!(deserialized.output_amount, recipe.output_amount);
        assert_eq!(deserialized.unlocked, recipe.unlocked);
    }

    #[test]
    fn test_recipe_ids_unique() {
        let recipes = CraftingRecipe::get_default_recipes();
        let mut ids: Vec<&String> = recipes.iter().map(|r| &r.id).collect();
        ids.sort();
        ids.dedup();
        assert_eq!(ids.len(), recipes.len(), "Recipe IDs should be unique");
    }

    #[test]
    fn test_recipe_name_localization_chinese() {
        let recipes = CraftingRecipe::get_default_recipes();
        for recipe in &recipes {
            assert!(
                !recipe.name.is_empty(),
                "Recipe {} should have a name",
                recipe.id
            );
            let has_chinese = recipe.name.chars().any(|c| {
                let code = c as u32;
                (0x4E00..=0x9FFF).contains(&code) || (0x3400..=0x4DBF).contains(&code)
            });
            assert!(
                has_chinese,
                "Recipe '{}' should have Chinese localization",
                recipe.name
            );
        }
    }

    #[test]
    fn test_maggot_factory_recipe() {
        let recipes = CraftingRecipe::get_default_recipes();
        let maggots_to_food = recipes.iter().find(|r| r.id == "maggots_to_food").unwrap();
        assert!(maggots_to_food.unlocked);
        assert_eq!(maggots_to_food.input_resource, ResourceType::Maggot);
        assert_eq!(maggots_to_food.input_amount, 10.0);
        assert_eq!(maggots_to_food.output_resource, ResourceType::Food);
        assert_eq!(maggots_to_food.output_amount, 5.0);
    }

    #[test]
    fn test_100_to_10_ratio_preserved() {
        let recipes = CraftingRecipe::get_default_recipes();
        let coins_to_wood = recipes.iter().find(|r| r.id == "coins_to_wood").unwrap();
        assert_eq!(coins_to_wood.input_amount, 100.0);
        assert_eq!(coins_to_wood.output_amount, 10.0);
        let wood_to_coins = recipes.iter().find(|r| r.id == "wood_to_coins").unwrap();
        assert_eq!(wood_to_coins.input_amount, 10.0);
        assert_eq!(wood_to_coins.output_amount, 100.0);
    }
}
