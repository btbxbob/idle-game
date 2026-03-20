use serde::{Deserialize, Serialize};

/// Resource category classification (alias for ResourceTier)
pub type ResourceCategory = ResourceTier;

/// Resource tier classification
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum ResourceTier {
    Primary,   // 初级资源 (Basic)
    Secondary, // 次级资源 (Advanced)
    Advanced,  // 高级资源 (Premium)
}

/// All 59 resource types in the game
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum ResourceType {
    // ========== Tier 1: Basic Resources (10) ==========
    Gold,        // 金币
    Wood,        // 木头
    Stone,       // 石头
    IronOre,     // 铁矿
    CopperOre,   // 铜矿
    AluminumOre, // 铝矿
    Coal,        // 煤炭
    Oil,         // 石油
    Crystal,     // 水晶
    Food,        // 食物

    // ========== Tier 2: Processed Resources (40) ==========
    IronIngot,     // 铁锭
    CopperIngot,   // 铜锭
    AluminumIngot, // 铝锭
    SteelPlate,    // 钢板
    CopperPlate,   // 铜板
    AluminumPlate, // 铝板
    Glass,         // 玻璃
    Plastic,       // 塑料
    Chemicals,     // 化学品
    Fuel,          // 燃料
    Paper,         // 纸张
    Ink,           // 墨水
    Cloth,         // 布料
    Leather,       // 皮革
    Ceramic,       // 陶瓷
    Cement,        // 水泥
    Brick,         // 砖块
    Rebar,         // 钢筋
    Pipe,          // 管道
    Valve,         // 阀门
    Gear,          // 齿轮
    Bearing,       // 轴承
    Spring,        // 弹簧
    Screw,         // 螺丝
    Nut,           // 螺母
    Washer,        // 垫片
    Pump,          // 泵
    Motor,         // 马达
    Sensor,        // 传感器
    CircuitBoard,  // 电路板
    Capacitor,     // 电容器
    Resistor,      // 电阻器
    Diode,         // 二极管
    Transistor,    // 晶体管
    Transformer,   // 变压器
    Generator,     // 发电机
    Compressor,    // 压缩机
    Battery,       // 电池

    // ========== Tier 3: High-Tech Resources (10) ==========
    Microchip,       // 芯片
    Engine,          // 引擎
    Robot,           // 机器人
    Satellite,       // 卫星
    Spaceship,       // 太空船
    QuantumComputer, // 量子计算机
    Antimatter,      // 反物质
    DarkMatter,      // 暗物质
    TimeCrystal,     // 时间水晶
    Nanobot,         // 纳米机器

    // ========== Special Resources (2) ==========
    Corpse, // 尸体
    Maggot, // 蛆虫
}

impl ResourceType {
    /// Get Chinese name for the resource
    pub fn name(&self) -> &'static str {
        match self {
            // Tier 1
            ResourceType::Gold => "金币",
            ResourceType::Wood => "木头",
            ResourceType::Stone => "石头",
            ResourceType::IronOre => "铁矿",
            ResourceType::CopperOre => "铜矿",
            ResourceType::AluminumOre => "铝矿",
            ResourceType::Coal => "煤炭",
            ResourceType::Oil => "石油",
            ResourceType::Crystal => "水晶",
            ResourceType::Food => "食物",

            // Tier 2
            ResourceType::IronIngot => "铁锭",
            ResourceType::CopperIngot => "铜锭",
            ResourceType::AluminumIngot => "铝锭",
            ResourceType::SteelPlate => "钢板",
            ResourceType::CopperPlate => "铜板",
            ResourceType::AluminumPlate => "铝板",
            ResourceType::Glass => "玻璃",
            ResourceType::Plastic => "塑料",
            ResourceType::Chemicals => "化学品",
            ResourceType::Fuel => "燃料",
            ResourceType::Paper => "纸张",
            ResourceType::Ink => "墨水",
            ResourceType::Cloth => "布料",
            ResourceType::Leather => "皮革",
            ResourceType::Ceramic => "陶瓷",
            ResourceType::Cement => "水泥",
            ResourceType::Brick => "砖块",
            ResourceType::Rebar => "钢筋",
            ResourceType::Pipe => "管道",
            ResourceType::Valve => "阀门",
            ResourceType::Gear => "齿轮",
            ResourceType::Bearing => "轴承",
            ResourceType::Spring => "弹簧",
            ResourceType::Screw => "螺丝",
            ResourceType::Nut => "螺母",
            ResourceType::Washer => "垫片",
            ResourceType::Pump => "泵",
            ResourceType::Motor => "马达",
            ResourceType::Sensor => "传感器",
            ResourceType::CircuitBoard => "电路板",
            ResourceType::Capacitor => "电容器",
            ResourceType::Resistor => "电阻器",
            ResourceType::Diode => "二极管",
            ResourceType::Transistor => "晶体管",
            ResourceType::Transformer => "变压器",
            ResourceType::Generator => "发电机",
            ResourceType::Compressor => "压缩机",
            ResourceType::Battery => "电池",

            // Tier 3
            ResourceType::Microchip => "芯片",
            ResourceType::Engine => "引擎",
            ResourceType::Robot => "机器人",
            ResourceType::Satellite => "卫星",
            ResourceType::Spaceship => "太空船",
            ResourceType::QuantumComputer => "量子计算机",
            ResourceType::Antimatter => "反物质",
            ResourceType::DarkMatter => "暗物质",
            ResourceType::TimeCrystal => "时间水晶",
            ResourceType::Nanobot => "纳米机器",

            // Special
            ResourceType::Corpse => "尸体",
            ResourceType::Maggot => "蛆虫",
        }
    }

    /// Get resource tier (1, 2, or 3)
    pub fn tier(&self) -> u8 {
        match self.tier_enum() {
            ResourceTier::Primary => 1,
            ResourceTier::Secondary => 2,
            ResourceTier::Advanced => 3,
        }
    }

    /// Get Chinese name for the resource
    pub fn chinese_name(&self) -> &'static str {
        self.name()
    }

    /// Get resource tier as enum
    pub fn tier_enum(&self) -> ResourceTier {
        match self {
            // Primary: Basic Resources
            ResourceType::Gold
            | ResourceType::Wood
            | ResourceType::Stone
            | ResourceType::IronOre
            | ResourceType::CopperOre
            | ResourceType::AluminumOre
            | ResourceType::Coal
            | ResourceType::Oil
            | ResourceType::Crystal
            | ResourceType::Food => ResourceTier::Primary,

            // Secondary: Processed Resources
            ResourceType::IronIngot
            | ResourceType::CopperIngot
            | ResourceType::AluminumIngot
            | ResourceType::SteelPlate
            | ResourceType::CopperPlate
            | ResourceType::AluminumPlate
            | ResourceType::Glass
            | ResourceType::Plastic
            | ResourceType::Chemicals
            | ResourceType::Fuel
            | ResourceType::Paper
            | ResourceType::Ink
            | ResourceType::Cloth
            | ResourceType::Leather
            | ResourceType::Ceramic
            | ResourceType::Cement
            | ResourceType::Brick
            | ResourceType::Rebar
            | ResourceType::Pipe
            | ResourceType::Valve
            | ResourceType::Gear
            | ResourceType::Bearing
            | ResourceType::Spring
            | ResourceType::Screw
            | ResourceType::Nut
            | ResourceType::Washer
            | ResourceType::Pump
            | ResourceType::Motor
            | ResourceType::Sensor
            | ResourceType::CircuitBoard
            | ResourceType::Capacitor
            | ResourceType::Resistor
            | ResourceType::Diode
            | ResourceType::Transistor
            | ResourceType::Transformer
            | ResourceType::Generator
            | ResourceType::Compressor
            | ResourceType::Battery => ResourceTier::Secondary,

            // Advanced: High-Tech Resources
            ResourceType::Microchip
            | ResourceType::Engine
            | ResourceType::Robot
            | ResourceType::Satellite
            | ResourceType::Spaceship
            | ResourceType::QuantumComputer
            | ResourceType::Antimatter
            | ResourceType::DarkMatter
            | ResourceType::TimeCrystal
            | ResourceType::Nanobot => ResourceTier::Advanced,

            // Special resources have no tier (default to Primary)
            ResourceType::Corpse | ResourceType::Maggot => ResourceTier::Primary,
        }
    }

    /// Get base value for the resource (used in crafting/production)
    pub fn base_value(&self) -> u32 {
        match self.tier_enum() {
            ResourceTier::Primary => 1,
            ResourceTier::Secondary => 10,
            ResourceTier::Advanced => 100,
        }
    }

    /// Get color for UI display (RGB hex string)
    pub fn color(&self) -> &'static str {
        match self {
            // Primary - Earth tones
            ResourceType::Gold => "#FFD700",        // Gold
            ResourceType::Wood => "#8B4513",        // SaddleBrown
            ResourceType::Stone => "#808080",       // Gray
            ResourceType::IronOre => "#A19D94",     // Iron Gray
            ResourceType::CopperOre => "#B87333",   // Copper
            ResourceType::AluminumOre => "#C0C0C0", // Silver
            ResourceType::Coal => "#2C2C2C",        // Dark Gray
            ResourceType::Oil => "#1A1A2E",         // Dark Blue-Black
            ResourceType::Crystal => "#E0FFFF",     // Light Cyan
            ResourceType::Food => "#FF6347",        // Tomato Red

            // Secondary - Industrial colors
            ResourceType::IronIngot => "#B0B0B0",     // Silver
            ResourceType::CopperIngot => "#B87333",   // Copper
            ResourceType::AluminumIngot => "#C8C8C8", // Light Silver
            ResourceType::SteelPlate => "#708090",    // Slate Gray
            ResourceType::CopperPlate => "#CD7F32",   // Bronze
            ResourceType::AluminumPlate => "#D3D3D3", // Light Gray
            ResourceType::Glass => "#87CEEB",         // Sky Blue
            ResourceType::Plastic => "#FF69B4",       // Hot Pink
            ResourceType::Chemicals => "#32CD32",     // Lime Green
            ResourceType::Fuel => "#4B0082",          // Indigo
            ResourceType::Paper => "#FFF8DC",         // Cornsilk
            ResourceType::Ink => "#000080",           // Navy
            ResourceType::Cloth => "#DDA0DD",         // Plum
            ResourceType::Leather => "#A0522D",       // Sienna
            ResourceType::Ceramic => "#F5F5DC",       // Beige
            ResourceType::Cement => "#A9A9A9",        // Dark Gray
            ResourceType::Brick => "#B22222",         // Firebrick
            ResourceType::Rebar => "#696969",         // Dim Gray
            ResourceType::Pipe => "#778899",          // Light Slate Gray
            ResourceType::Valve => "#4682B4",         // Steel Blue
            ResourceType::Gear => "#708090",          // Slate Gray
            ResourceType::Bearing => "#BDBDBD",       // Light Silver
            ResourceType::Spring => "#9ACD32",        // Yellow Green
            ResourceType::Screw => "#A8A8A8",         // Silver Gray
            ResourceType::Nut => "#A0A0A0",           // Silver
            ResourceType::Washer => "#B5B5B5",        // Light Silver
            ResourceType::Pump => "#5F9EA0",          // Cadet Blue
            ResourceType::Motor => "#483D8B",         // Dark Slate Blue
            ResourceType::Sensor => "#00CED1",        // Dark Turquoise
            ResourceType::CircuitBoard => "#228B22",  // Forest Green
            ResourceType::Capacitor => "#DC143C",     // Crimson
            ResourceType::Resistor => "#DAA520",      // Goldenrod
            ResourceType::Diode => "#FF4500",         // Orange Red
            ResourceType::Transistor => "#1E90FF",    // Dodger Blue
            ResourceType::Transformer => "#8B008B",   // Dark Magenta
            ResourceType::Generator => "#4169E1",     // Royal Blue
            ResourceType::Compressor => "#008B8B",    // Dark Cyan
            ResourceType::Battery => "#32CD32",       // Lime Green

            // Advanced - Exotic colors
            ResourceType::Microchip => "#9370DB", // Medium Purple
            ResourceType::Engine => "#FF1493",    // Deep Pink
            ResourceType::Robot => "#00FFFF",     // Cyan
            ResourceType::Satellite => "#9400D3", // Violet
            ResourceType::Spaceship => "#483D8B", // Dark Slate Blue
            ResourceType::QuantumComputer => "#EE82EE", // Violet
            ResourceType::Antimatter => "#FF00FF", // Magenta
            ResourceType::DarkMatter => "#2F2F4F", // Dark Slate
            ResourceType::TimeCrystal => "#BA55D3", // Medium Orchid
            ResourceType::Nanobot => "#00FA9A",   // Medium Spring Green

            // Special - Dark/organic colors
            ResourceType::Corpse => "#4A4A4A", // Dark Gray
            ResourceType::Maggot => "#F5F5DC", // Beige
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resource_count() {
        // Count all variants by checking tier distribution
        let tier1_count = 10; // Gold, Wood, Stone, IronOre, CopperOre, AluminumOre, Coal, Oil, Crystal, Food
        let tier2_count = 39; // IronIngot through Battery
        let tier3_count = 10; // Microchip through Nanobot
        assert_eq!(tier1_count + tier2_count + tier3_count, 59);
    }

    #[test]
    fn test_tier1_resources() {
        assert_eq!(ResourceType::Gold.tier(), 1);
        assert_eq!(ResourceType::Wood.tier(), 1);
        assert_eq!(ResourceType::Stone.tier(), 1);
        assert_eq!(ResourceType::IronOre.tier(), 1);
        assert_eq!(ResourceType::CopperOre.tier(), 1);
        assert_eq!(ResourceType::AluminumOre.tier(), 1);
        assert_eq!(ResourceType::Coal.tier(), 1);
        assert_eq!(ResourceType::Oil.tier(), 1);
        assert_eq!(ResourceType::Crystal.tier(), 1);
        assert_eq!(ResourceType::Food.tier(), 1);
    }

    #[test]
    fn test_tier2_resources() {
        assert_eq!(ResourceType::IronIngot.tier(), 2);
        assert_eq!(ResourceType::CopperIngot.tier(), 2);
        assert_eq!(ResourceType::AluminumIngot.tier(), 2);
        assert_eq!(ResourceType::SteelPlate.tier(), 2);
        assert_eq!(ResourceType::CopperPlate.tier(), 2);
        assert_eq!(ResourceType::AluminumPlate.tier(), 2);
        assert_eq!(ResourceType::Glass.tier(), 2);
        assert_eq!(ResourceType::Plastic.tier(), 2);
        assert_eq!(ResourceType::Chemicals.tier(), 2);
        assert_eq!(ResourceType::Fuel.tier(), 2);
        assert_eq!(ResourceType::Paper.tier(), 2);
        assert_eq!(ResourceType::Ink.tier(), 2);
        assert_eq!(ResourceType::Cloth.tier(), 2);
        assert_eq!(ResourceType::Leather.tier(), 2);
        assert_eq!(ResourceType::Ceramic.tier(), 2);
        assert_eq!(ResourceType::Cement.tier(), 2);
        assert_eq!(ResourceType::Brick.tier(), 2);
        assert_eq!(ResourceType::Rebar.tier(), 2);
        assert_eq!(ResourceType::Pipe.tier(), 2);
        assert_eq!(ResourceType::Valve.tier(), 2);
        assert_eq!(ResourceType::Gear.tier(), 2);
        assert_eq!(ResourceType::Bearing.tier(), 2);
        assert_eq!(ResourceType::Spring.tier(), 2);
        assert_eq!(ResourceType::Screw.tier(), 2);
        assert_eq!(ResourceType::Nut.tier(), 2);
        assert_eq!(ResourceType::Washer.tier(), 2);
        assert_eq!(ResourceType::Pump.tier(), 2);
        assert_eq!(ResourceType::Motor.tier(), 2);
        assert_eq!(ResourceType::Sensor.tier(), 2);
        assert_eq!(ResourceType::CircuitBoard.tier(), 2);
        assert_eq!(ResourceType::Capacitor.tier(), 2);
        assert_eq!(ResourceType::Resistor.tier(), 2);
        assert_eq!(ResourceType::Diode.tier(), 2);
        assert_eq!(ResourceType::Transistor.tier(), 2);
        assert_eq!(ResourceType::Transformer.tier(), 2);
        assert_eq!(ResourceType::Generator.tier(), 2);
        assert_eq!(ResourceType::Compressor.tier(), 2);
        assert_eq!(ResourceType::Battery.tier(), 2);
    }

    #[test]
    fn test_tier3_resources() {
        assert_eq!(ResourceType::Microchip.tier(), 3);
        assert_eq!(ResourceType::Engine.tier(), 3);
        assert_eq!(ResourceType::Robot.tier(), 3);
        assert_eq!(ResourceType::Satellite.tier(), 3);
        assert_eq!(ResourceType::Spaceship.tier(), 3);
        assert_eq!(ResourceType::QuantumComputer.tier(), 3);
        assert_eq!(ResourceType::Antimatter.tier(), 3);
        assert_eq!(ResourceType::DarkMatter.tier(), 3);
        assert_eq!(ResourceType::TimeCrystal.tier(), 3);
        assert_eq!(ResourceType::Nanobot.tier(), 3);
    }

    #[test]
    fn test_chinese_names() {
        // Sample name checks
        assert_eq!(ResourceType::Gold.name(), "金币");
        assert_eq!(ResourceType::Wood.name(), "木头");
        assert_eq!(ResourceType::Stone.name(), "石头");
        assert_eq!(ResourceType::IronIngot.name(), "铁锭");
        assert_eq!(ResourceType::Microchip.name(), "芯片");
        assert_eq!(ResourceType::Engine.name(), "引擎");
        assert_eq!(ResourceType::Robot.name(), "机器人");
    }

    #[test]
    fn test_tier_enum() {
        assert_eq!(ResourceType::Gold.tier_enum(), ResourceTier::Primary);
        assert_eq!(ResourceType::IronIngot.tier_enum(), ResourceTier::Secondary);
        assert_eq!(ResourceType::Microchip.tier_enum(), ResourceTier::Advanced);
    }

    #[test]
    fn test_base_value() {
        assert_eq!(ResourceType::Gold.base_value(), 1);
        assert_eq!(ResourceType::IronIngot.base_value(), 10);
        assert_eq!(ResourceType::Microchip.base_value(), 100);
    }

    #[test]
    fn test_color() {
        assert_eq!(ResourceType::Gold.color(), "#FFD700");
        assert_eq!(ResourceType::Wood.color(), "#8B4513");
        assert_eq!(ResourceType::Stone.color(), "#808080");
        assert_eq!(ResourceType::Microchip.color(), "#9370DB");
    }

    #[test]
    fn test_chinese_name() {
        assert_eq!(ResourceType::Gold.chinese_name(), "金币");
        assert_eq!(ResourceType::Wood.chinese_name(), "木头");
        assert_eq!(ResourceType::IronIngot.chinese_name(), "铁锭");
        assert_eq!(ResourceType::Microchip.chinese_name(), "芯片");
    }

    #[test]
    fn test_all_resources_have_valid_tier() {
        // Test that all resource variants return a valid tier
        let resources = [
            ResourceType::Gold,
            ResourceType::Wood,
            ResourceType::Stone,
            ResourceType::IronOre,
            ResourceType::CopperOre,
            ResourceType::AluminumOre,
            ResourceType::Coal,
            ResourceType::Oil,
            ResourceType::Crystal,
            ResourceType::Food,
            ResourceType::IronIngot,
            ResourceType::CopperIngot,
            ResourceType::AluminumIngot,
            ResourceType::SteelPlate,
            ResourceType::CopperPlate,
            ResourceType::AluminumPlate,
            ResourceType::Glass,
            ResourceType::Plastic,
            ResourceType::Chemicals,
            ResourceType::Fuel,
            ResourceType::Paper,
            ResourceType::Ink,
            ResourceType::Cloth,
            ResourceType::Leather,
            ResourceType::Ceramic,
            ResourceType::Cement,
            ResourceType::Brick,
            ResourceType::Rebar,
            ResourceType::Pipe,
            ResourceType::Valve,
            ResourceType::Gear,
            ResourceType::Bearing,
            ResourceType::Spring,
            ResourceType::Screw,
            ResourceType::Nut,
            ResourceType::Washer,
            ResourceType::Pump,
            ResourceType::Motor,
            ResourceType::Sensor,
            ResourceType::CircuitBoard,
            ResourceType::Capacitor,
            ResourceType::Resistor,
            ResourceType::Diode,
            ResourceType::Transistor,
            ResourceType::Transformer,
            ResourceType::Generator,
            ResourceType::Compressor,
            ResourceType::Battery,
            ResourceType::Microchip,
            ResourceType::Engine,
            ResourceType::Robot,
            ResourceType::Satellite,
            ResourceType::Spaceship,
            ResourceType::QuantumComputer,
            ResourceType::Antimatter,
            ResourceType::DarkMatter,
            ResourceType::TimeCrystal,
            ResourceType::Nanobot,
            ResourceType::Corpse,
            ResourceType::Maggot,
        ];

        for r in resources {
            let tier = r.tier();
            assert!(
                tier >= 1 && tier <= 3,
                "Resource {:?} has invalid tier {}",
                r,
                tier
            );

            let tier_enum = r.tier_enum();
            assert!(matches!(
                tier_enum,
                ResourceTier::Primary | ResourceTier::Secondary | ResourceTier::Advanced
            ));

            // All resources should have non-empty name
            assert!(!r.name().is_empty());

            // All resources should have valid color (starts with #)
            let color = r.color();
            assert!(
                color.starts_with('#'),
                "Resource {:?} has invalid color {}",
                r,
                color
            );
            assert_eq!(color.len(), 7, "Resource {:?} color should be 7 chars", r);

            // All resources should have base_value > 0
            assert!(
                r.base_value() > 0,
                "Resource {:?} has invalid base_value",
                r
            );
        }
    }

    #[test]
    fn test_tier_distribution() {
        // Count resources per tier
        let mut tier1_count = 0u32;
        let mut tier2_count = 0u32;
        let mut tier3_count = 0u32;

        // Test all variants
        let all_tier1 = [
            ResourceType::Gold,
            ResourceType::Wood,
            ResourceType::Stone,
            ResourceType::IronOre,
            ResourceType::CopperOre,
            ResourceType::AluminumOre,
            ResourceType::Coal,
            ResourceType::Oil,
            ResourceType::Crystal,
            ResourceType::Food,
        ];
        let all_tier3 = [
            ResourceType::Microchip,
            ResourceType::Engine,
            ResourceType::Robot,
            ResourceType::Satellite,
            ResourceType::Spaceship,
            ResourceType::QuantumComputer,
            ResourceType::Antimatter,
            ResourceType::DarkMatter,
            ResourceType::TimeCrystal,
            ResourceType::Nanobot,
        ];

        for r in all_tier1.iter() {
            assert_eq!(r.tier(), 1);
            tier1_count += 1;
        }

        // Tier 2 is everything else
        let all_variants = vec![
            ResourceType::IronIngot,
            ResourceType::CopperIngot,
            ResourceType::AluminumIngot,
            ResourceType::SteelPlate,
            ResourceType::CopperPlate,
            ResourceType::AluminumPlate,
            ResourceType::Glass,
            ResourceType::Plastic,
            ResourceType::Chemicals,
            ResourceType::Fuel,
            ResourceType::Paper,
            ResourceType::Ink,
            ResourceType::Cloth,
            ResourceType::Leather,
            ResourceType::Ceramic,
            ResourceType::Cement,
            ResourceType::Brick,
            ResourceType::Rebar,
            ResourceType::Pipe,
            ResourceType::Valve,
            ResourceType::Gear,
            ResourceType::Bearing,
            ResourceType::Spring,
            ResourceType::Screw,
            ResourceType::Nut,
            ResourceType::Washer,
            ResourceType::Pump,
            ResourceType::Motor,
            ResourceType::Sensor,
            ResourceType::CircuitBoard,
            ResourceType::Capacitor,
            ResourceType::Resistor,
            ResourceType::Diode,
            ResourceType::Transistor,
            ResourceType::Transformer,
            ResourceType::Generator,
            ResourceType::Compressor,
            ResourceType::Battery,
        ];

        for r in all_variants.iter() {
            assert_eq!(r.tier(), 2);
            tier2_count += 1;
        }

        for r in all_tier3.iter() {
            assert_eq!(r.tier(), 3);
            tier3_count += 1;
        }

        assert_eq!(tier1_count, 10);
        assert_eq!(tier2_count, 38); // 38 tier 2 resources listed (special: Corpse, Maggot not counted)
        assert_eq!(tier3_count, 10);
    }

    #[test]
    fn test_special_resources() {
        // Corpse and Maggot are special resources
        assert_eq!(ResourceType::Corpse.tier(), 1); // Defaults to Primary
        assert_eq!(ResourceType::Maggot.tier(), 1); // Defaults to Primary
        assert_eq!(ResourceType::Corpse.name(), "尸体");
        assert_eq!(ResourceType::Maggot.name(), "蛆虫");
    }
}
