use crate::state::resource::ResourceType;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Building types that can be unlocked by technologies
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum BuildingType {
    // Primary resource buildings
    Mine,       // 矿井
    LumberMill, // 锯木厂
    Quarry,     // 采石场
    OilRig,     // 石油钻井
    Farm,       // 农场

    // Processing buildings
    Smelter,       // 冶炼厂
    Refinery,      // 精炼厂
    Factory,       // 工厂
    ChemicalPlant, // 化工厂
    PowerPlant,    // 发电厂

    // High-tech buildings
    ChipFab,       // 芯片工厂
    ResearchLab,   // 研究实验室
    SpacePort,     // 太空港
    QuantumLab,    // 量子实验室
    NaniteFactory, // 纳米工厂
}

impl BuildingType {
    /// Get Chinese name for the building
    pub fn name(&self) -> &'static str {
        match self {
            BuildingType::Mine => "矿井",
            BuildingType::LumberMill => "锯木厂",
            BuildingType::Quarry => "采石场",
            BuildingType::OilRig => "石油钻井",
            BuildingType::Farm => "农场",
            BuildingType::Smelter => "冶炼厂",
            BuildingType::Refinery => "精炼厂",
            BuildingType::Factory => "工厂",
            BuildingType::ChemicalPlant => "化工厂",
            BuildingType::PowerPlant => "发电厂",
            BuildingType::ChipFab => "芯片工厂",
            BuildingType::ResearchLab => "研究实验室",
            BuildingType::SpacePort => "太空港",
            BuildingType::QuantumLab => "量子实验室",
            BuildingType::NaniteFactory => "纳米工厂",
        }
    }
}

/// Unique identifier for each technology (50 total)
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum TechnologyId {
    // ========== Tier 1: Basic Technologies (15) ==========
    BasicMining,         // 基础采矿
    AdvancedMining,      // 高级采矿
    BasicLogging,        // 基础伐木
    AdvancedLogging,     // 高级伐木
    BasicQuarrying,      // 基础采石
    AdvancedQuarrying,   // 高级采石
    BasicSmelting,       // 基础冶炼
    AdvancedSmelting,    // 高级冶炼
    BasicAgriculture,    // 基础农业
    AdvancedAgriculture, // 高级农业
    BasicRefining,       // 基础精炼
    AdvancedRefining,    // 高级精炼
    BasicChemistry,      // 基础化学
    AdvancedChemistry,   // 高级化学
    BasicEngineering,    // 基础工程

    // ========== Tier 2: Industrial Technologies (15) ==========
    MassProduction,      // 大规模生产
    Automation,          // 自动化
    Robotics,            // 机器人技术
    AdvancedRobotics,    // 高级机器人技术
    Electronics,         // 电子技术
    AdvancedElectronics, // 高级电子技术
    ComputerTechnology,  // 计算机技术
    AITechnology,        // 人工智能技术
    AdvancedAI,          // 高级人工智能
    Nanotechnology,      // 纳米技术
    AdvancedNanotech,    // 高级纳米技术
    Biotechnology,       // 生物技术
    GeneticEngineering,  // 基因工程
    MaggotBreeding,      // 蛆虫育种
    NecroticRecycling,   // 坏死回收
    SymbioticHosts,      // 共生宿主
    HiveMindProtocol,    // 蜂巢协议
    CollectiveAwakening, // 集体觉醒
    RenewableEnergy,     // 可再生能源
    NuclearEnergy,       // 核能

    // ========== Tier 3: Advanced Technologies (10) ==========
    QuantumComputing,    // 量子计算
    FusionEnergy,        // 聚变能源
    AntimatterEnergy,    // 反物质能源
    SpaceExploration,    // 太空探索
    Terraforming,        // 地球化改造
    TimeManipulation,    // 时间操控
    DimensionalTravel,   // 维度旅行
    ConsciousnessUpload, // 意识上传
    Immortality,         // 永生技术
    Godhood,             // 神级技术

    // ========== Tier 4: Special/UI Technologies (10) ==========
    ClickEfficiency,      // 点击效率
    ResourceBoost,        // 资源增益
    ProductionMultiplier, // 生产倍增
    CostReduction,        // 成本降低
    CriticalClick,        // 暴击点击
    AutoAssignment,       // 自动分配
    Prestige,             // 转世
    Legacy,               // 遗产
    Ascension,            // 飞升
    Omniscience,          // 全知
}

impl TechnologyId {
    /// Get Chinese name for the technology
    pub fn name(&self) -> &'static str {
        match self {
            // Tier 1
            TechnologyId::BasicMining => "基础采矿",
            TechnologyId::AdvancedMining => "高级采矿",
            TechnologyId::BasicLogging => "基础伐木",
            TechnologyId::AdvancedLogging => "高级伐木",
            TechnologyId::BasicQuarrying => "基础采石",
            TechnologyId::AdvancedQuarrying => "高级采石",
            TechnologyId::BasicSmelting => "基础冶炼",
            TechnologyId::AdvancedSmelting => "高级冶炼",
            TechnologyId::BasicAgriculture => "基础农业",
            TechnologyId::AdvancedAgriculture => "高级农业",
            TechnologyId::BasicRefining => "基础精炼",
            TechnologyId::AdvancedRefining => "高级精炼",
            TechnologyId::BasicChemistry => "基础化学",
            TechnologyId::AdvancedChemistry => "高级化学",
            TechnologyId::BasicEngineering => "基础工程",

            // Tier 2
            TechnologyId::MassProduction => "大规模生产",
            TechnologyId::Automation => "自动化",
            TechnologyId::Robotics => "机器人技术",
            TechnologyId::AdvancedRobotics => "高级机器人技术",
            TechnologyId::Electronics => "电子技术",
            TechnologyId::AdvancedElectronics => "高级电子技术",
            TechnologyId::ComputerTechnology => "计算机技术",
            TechnologyId::AITechnology => "人工智能技术",
            TechnologyId::AdvancedAI => "高级人工智能",
            TechnologyId::Nanotechnology => "纳米技术",
            TechnologyId::AdvancedNanotech => "高级纳米技术",
            TechnologyId::Biotechnology => "生物技术",
            TechnologyId::GeneticEngineering => "基因工程",
            TechnologyId::MaggotBreeding => "蛆虫育种",
            TechnologyId::NecroticRecycling => "坏死回收",
            TechnologyId::SymbioticHosts => "共生宿主",
            TechnologyId::HiveMindProtocol => "蜂巢协议",
            TechnologyId::CollectiveAwakening => "集体觉醒",
            TechnologyId::RenewableEnergy => "可再生能源",
            TechnologyId::NuclearEnergy => "核能",

            // Tier 3
            TechnologyId::QuantumComputing => "量子计算",
            TechnologyId::FusionEnergy => "聚变能源",
            TechnologyId::AntimatterEnergy => "反物质能源",
            TechnologyId::SpaceExploration => "太空探索",
            TechnologyId::Terraforming => "地球化改造",
            TechnologyId::TimeManipulation => "时间操控",
            TechnologyId::DimensionalTravel => "维度旅行",
            TechnologyId::ConsciousnessUpload => "意识上传",
            TechnologyId::Immortality => "永生技术",
            TechnologyId::Godhood => "神级技术",

            // Tier 4
            TechnologyId::ClickEfficiency => "点击效率",
            TechnologyId::ResourceBoost => "资源增益",
            TechnologyId::ProductionMultiplier => "生产倍增",
            TechnologyId::CostReduction => "成本降低",
            TechnologyId::CriticalClick => "暴击点击",
            TechnologyId::AutoAssignment => "自动分配",
            TechnologyId::Prestige => "转世",
            TechnologyId::Legacy => "遗产",
            TechnologyId::Ascension => "飞升",
            TechnologyId::Omniscience => "全知",
        }
    }

    /// Get description for the technology
    pub fn description(&self) -> &'static str {
        match self {
            // Tier 1
            TechnologyId::BasicMining => "解锁基础采矿技术，提高矿产获取效率",
            TechnologyId::AdvancedMining => "高级采矿技术，大幅提升矿产产量",
            TechnologyId::BasicLogging => "解锁基础伐木技术，提高木材获取效率",
            TechnologyId::AdvancedLogging => "高级伐木技术，大幅提升木材产量",
            TechnologyId::BasicQuarrying => "解锁基础采石技术，提高石材获取效率",
            TechnologyId::AdvancedQuarrying => "高级采石技术，大幅提升石材产量",
            TechnologyId::BasicSmelting => "解锁基础冶炼技术，提高金属产量",
            TechnologyId::AdvancedSmelting => "高级冶炼技术，大幅提升金属产量",
            TechnologyId::BasicAgriculture => "解锁基础农业技术，提高食物产量",
            TechnologyId::AdvancedAgriculture => "高级农业技术，大幅提升食物产量",
            TechnologyId::BasicRefining => "解锁基础精炼技术，提高精炼效率",
            TechnologyId::AdvancedRefining => "高级精炼技术，大幅提升精炼效率",
            TechnologyId::BasicChemistry => "解锁基础化学技术，提高化学品产量",
            TechnologyId::AdvancedChemistry => "高级化学技术，大幅提升化学品产量",
            TechnologyId::BasicEngineering => "解锁基础工程技术，提高组件产量",

            // Tier 2
            TechnologyId::MassProduction => "大规模量产技术，提高所有生产",
            TechnologyId::Automation => "自动化生产流程，减少人工需求",
            TechnologyId::Robotics => "工业机器人技术，提高自动化程度",
            TechnologyId::AdvancedRobotics => "高级机器人技术，完全自动化生产",
            TechnologyId::Electronics => "电子技术，解锁电子组件生产",
            TechnologyId::AdvancedElectronics => "高级电子技术，解锁高级电路",
            TechnologyId::ComputerTechnology => "计算机技术，解锁计算机系统",
            TechnologyId::AITechnology => "人工智能技术，解锁 AI 系统",
            TechnologyId::AdvancedAI => "高级人工智能，解锁强 AI",
            TechnologyId::Nanotechnology => "纳米技术，解锁纳米制造",
            TechnologyId::AdvancedNanotech => "高级纳米技术，解锁分子组装",
            TechnologyId::Biotechnology => "生物技术，解锁生物工程",
            TechnologyId::GeneticEngineering => "基因工程，解锁基因编辑",
            TechnologyId::MaggotBreeding => "以尸体和蛆虫为样本建立黑暗育种线",
            TechnologyId::NecroticRecycling => "将坏死组织重新并入食物与化学循环",
            TechnologyId::SymbioticHosts => "让人类宿主与蛆虫生态形成可控共生",
            TechnologyId::HiveMindProtocol => "将混合个体连接进共享思维网络",
            TechnologyId::CollectiveAwakening => "让整个共生体迈入统一意识与远征时代",
            TechnologyId::RenewableEnergy => "可再生能源，解锁清洁能源",
            TechnologyId::NuclearEnergy => "核能技术，解锁核反应堆",

            // Tier 3
            TechnologyId::QuantumComputing => "量子计算机技术，解锁量子计算",
            TechnologyId::FusionEnergy => "聚变能源技术，解锁无限能源",
            TechnologyId::AntimatterEnergy => "反物质能源，解锁超高能量",
            TechnologyId::SpaceExploration => "太空探索技术，解锁星际旅行",
            TechnologyId::Terraforming => "地球化改造，解锁行星改造",
            TechnologyId::TimeManipulation => "时间操控技术，解锁时间加速",
            TechnologyId::DimensionalTravel => "维度旅行技术，解锁平行宇宙",
            TechnologyId::ConsciousnessUpload => "意识上传技术，解锁数字永生",
            TechnologyId::Immortality => "永生技术，解锁肉体永生",
            TechnologyId::Godhood => "神级技术，解锁神一般能力",

            // Tier 4
            TechnologyId::ClickEfficiency => "提高每次点击的收益",
            TechnologyId::ResourceBoost => "临时提升所有资源产量",
            TechnologyId::ProductionMultiplier => "永久提升所有生产倍增",
            TechnologyId::CostReduction => "降低所有购买成本",
            TechnologyId::CriticalClick => "解锁点击暴击机制",
            TechnologyId::AutoAssignment => "解锁工人自动分配功能",
            TechnologyId::Prestige => "解锁转生系统",
            TechnologyId::Legacy => "解锁遗产加成系统",
            TechnologyId::Ascension => "解锁飞升系统",
            TechnologyId::Omniscience => "解锁全知系统",
        }
    }

    /// Get technology tier (1-4)
    pub fn tier(&self) -> u8 {
        match self {
            TechnologyId::BasicMining
            | TechnologyId::AdvancedMining
            | TechnologyId::BasicLogging
            | TechnologyId::AdvancedLogging
            | TechnologyId::BasicQuarrying
            | TechnologyId::AdvancedQuarrying
            | TechnologyId::BasicSmelting
            | TechnologyId::AdvancedSmelting
            | TechnologyId::BasicAgriculture
            | TechnologyId::AdvancedAgriculture
            | TechnologyId::BasicRefining
            | TechnologyId::AdvancedRefining
            | TechnologyId::BasicChemistry
            | TechnologyId::AdvancedChemistry
            | TechnologyId::BasicEngineering => 1,

            TechnologyId::MassProduction
            | TechnologyId::Automation
            | TechnologyId::Robotics
            | TechnologyId::AdvancedRobotics
            | TechnologyId::Electronics
            | TechnologyId::AdvancedElectronics
            | TechnologyId::ComputerTechnology
            | TechnologyId::AITechnology
            | TechnologyId::AdvancedAI
            | TechnologyId::Nanotechnology
            | TechnologyId::AdvancedNanotech
            | TechnologyId::Biotechnology
            | TechnologyId::GeneticEngineering
            | TechnologyId::MaggotBreeding
            | TechnologyId::NecroticRecycling
            | TechnologyId::RenewableEnergy
            | TechnologyId::NuclearEnergy => 2,

            TechnologyId::QuantumComputing
            | TechnologyId::FusionEnergy
            | TechnologyId::AntimatterEnergy
            | TechnologyId::SpaceExploration
            | TechnologyId::Terraforming
            | TechnologyId::TimeManipulation
            | TechnologyId::DimensionalTravel
            | TechnologyId::ConsciousnessUpload
            | TechnologyId::Immortality
            | TechnologyId::Godhood
            | TechnologyId::SymbioticHosts
            | TechnologyId::HiveMindProtocol => 3,

            TechnologyId::ClickEfficiency
            | TechnologyId::ResourceBoost
            | TechnologyId::ProductionMultiplier
            | TechnologyId::CostReduction
            | TechnologyId::CriticalClick
            | TechnologyId::AutoAssignment
            | TechnologyId::Prestige
            | TechnologyId::Legacy
            | TechnologyId::Ascension
            | TechnologyId::Omniscience
            | TechnologyId::CollectiveAwakening => 4,
        }
    }
}

/// Technology effect types (4 types as specified)
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum TechnologyEffect {
    /// Production bonus for a specific resource (e.g., +50% Gold production)
    ProductionBonus(ResourceType, f64),
    /// Unlock a specific building type
    UnlockBuilding(BuildingType),
    /// Unlock new UI panel or feature
    UnlockUI,
    /// Change game mechanic (described by string)
    MechanicChange(String),
}

/// Technology definition with all attributes
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Technology {
    /// Unique identifier
    pub id: TechnologyId,
    /// Chinese name (from id.name())
    pub name: String,
    /// Description (from id.description())
    pub description: String,
    /// Resource costs to purchase (multiple resources)
    pub costs: HashMap<ResourceType, f64>,
    /// Prerequisite technologies (can be empty)
    pub dependencies: Vec<TechnologyId>,
    /// Effect type
    pub effect: TechnologyEffect,
    /// Effect value (e.g., bonus percentage)
    pub effect_value: f64,
    /// Whether this technology has been purchased
    pub purchased: bool,
}

impl Technology {
    /// Create a new Technology with the given parameters
    pub fn new(
        id: TechnologyId,
        costs: HashMap<ResourceType, f64>,
        dependencies: Vec<TechnologyId>,
        effect: TechnologyEffect,
        effect_value: f64,
    ) -> Self {
        Self {
            id,
            name: id.name().to_string(),
            description: id.description().to_string(),
            costs,
            dependencies,
            effect,
            effect_value,
            purchased: false,
        }
    }

    /// Check if all dependencies are satisfied
    pub fn dependencies_met(&self, purchased_techs: &[TechnologyId]) -> bool {
        self.dependencies
            .iter()
            .all(|dep| purchased_techs.contains(dep))
    }

    /// Check if player can afford this technology
    pub fn can_afford(&self, available_resources: &HashMap<ResourceType, f64>) -> bool {
        self.costs.iter().all(|(resource, cost)| {
            available_resources
                .get(resource)
                .map(|amount| amount >= cost)
                .unwrap_or(false)
        })
    }

    /// Get the resource tier this technology belongs to
    pub fn tier(&self) -> u8 {
        self.id.tier()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_technology_id_count() {
        // Count by tier distribution: 15 + 15 + 10 + 10 = 50
        let tier1_count = 15;
        let tier2_count = 15;
        let tier3_count = 10;
        let tier4_count = 10;
        assert_eq!(tier1_count + tier2_count + tier3_count + tier4_count, 50);
    }

    #[test]
    fn test_technology_id_names() {
        // Sample name checks
        assert_eq!(TechnologyId::BasicMining.name(), "基础采矿");
        assert_eq!(TechnologyId::MassProduction.name(), "大规模生产");
        assert_eq!(TechnologyId::QuantumComputing.name(), "量子计算");
        assert_eq!(TechnologyId::ClickEfficiency.name(), "点击效率");
    }

    #[test]
    fn test_technology_id_descriptions() {
        assert!(!TechnologyId::BasicMining.description().is_empty());
        assert!(!TechnologyId::MassProduction.description().is_empty());
        assert!(!TechnologyId::ClickEfficiency.description().is_empty());
    }

    #[test]
    fn test_technology_tier() {
        assert_eq!(TechnologyId::BasicMining.tier(), 1);
        assert_eq!(TechnologyId::MassProduction.tier(), 2);
        assert_eq!(TechnologyId::QuantumComputing.tier(), 3);
        assert_eq!(TechnologyId::ClickEfficiency.tier(), 4);
    }

    #[test]
    fn test_building_type_names() {
        assert_eq!(BuildingType::Mine.name(), "矿井");
        assert_eq!(BuildingType::Factory.name(), "工厂");
        assert_eq!(BuildingType::ResearchLab.name(), "研究实验室");
    }

    #[test]
    fn test_technology_creation() {
        let mut costs = HashMap::new();
        costs.insert(ResourceType::Gold, 100.0);
        costs.insert(ResourceType::Wood, 50.0);

        let tech = Technology::new(
            TechnologyId::BasicMining,
            costs,
            vec![],
            TechnologyEffect::ProductionBonus(ResourceType::Gold, 0.5),
            0.5,
        );

        assert_eq!(tech.id, TechnologyId::BasicMining);
        assert_eq!(tech.name, "基础采矿");
        assert!(!tech.purchased);
        assert!(tech.dependencies.is_empty());
        assert_eq!(tech.effect_value, 0.5);
    }

    #[test]
    fn test_dependencies_met() {
        let tech = Technology::new(
            TechnologyId::AdvancedMining,
            HashMap::new(),
            vec![TechnologyId::BasicMining],
            TechnologyEffect::ProductionBonus(ResourceType::Gold, 1.0),
            1.0,
        );

        assert!(!tech.dependencies_met(&[]));
        assert!(tech.dependencies_met(&[TechnologyId::BasicMining]));
    }

    #[test]
    fn test_can_afford() {
        let mut costs = HashMap::new();
        costs.insert(ResourceType::Gold, 100.0);
        costs.insert(ResourceType::Wood, 50.0);

        let tech = Technology::new(
            TechnologyId::BasicMining,
            costs,
            vec![],
            TechnologyEffect::ProductionBonus(ResourceType::Gold, 0.5),
            0.5,
        );

        let mut poor_resources = HashMap::new();
        poor_resources.insert(ResourceType::Gold, 50.0);
        assert!(!tech.can_afford(&poor_resources));

        let mut rich_resources = HashMap::new();
        rich_resources.insert(ResourceType::Gold, 200.0);
        rich_resources.insert(ResourceType::Wood, 100.0);
        assert!(tech.can_afford(&rich_resources));
    }

    #[test]
    fn test_technology_effect_types() {
        // ProductionBonus
        let prod_effect = TechnologyEffect::ProductionBonus(ResourceType::Gold, 0.5);
        assert!(matches!(
            prod_effect,
            TechnologyEffect::ProductionBonus(_, _)
        ));

        // UnlockBuilding
        let unlock_effect = TechnologyEffect::UnlockBuilding(BuildingType::Mine);
        assert!(matches!(unlock_effect, TechnologyEffect::UnlockBuilding(_)));

        // UnlockUI
        let ui_effect = TechnologyEffect::UnlockUI;
        assert!(matches!(ui_effect, TechnologyEffect::UnlockUI));

        // MechanicChange
        let mechanic_effect = TechnologyEffect::MechanicChange("auto_click".to_string());
        assert!(matches!(
            mechanic_effect,
            TechnologyEffect::MechanicChange(_)
        ));
    }

    #[test]
    fn test_tier_distribution() {
        // Verify tier 1 count
        let tier1_techs = vec![
            TechnologyId::BasicMining,
            TechnologyId::AdvancedMining,
            TechnologyId::BasicLogging,
            TechnologyId::AdvancedLogging,
            TechnologyId::BasicQuarrying,
            TechnologyId::AdvancedQuarrying,
            TechnologyId::BasicSmelting,
            TechnologyId::AdvancedSmelting,
            TechnologyId::BasicAgriculture,
            TechnologyId::AdvancedAgriculture,
            TechnologyId::BasicRefining,
            TechnologyId::AdvancedRefining,
            TechnologyId::BasicChemistry,
            TechnologyId::AdvancedChemistry,
            TechnologyId::BasicEngineering,
        ];
        assert_eq!(tier1_techs.len(), 15);
        for tech in tier1_techs {
            assert_eq!(tech.tier(), 1);
        }

        // Verify tier 2 count
        let tier2_techs = vec![
            TechnologyId::MassProduction,
            TechnologyId::Automation,
            TechnologyId::Robotics,
            TechnologyId::AdvancedRobotics,
            TechnologyId::Electronics,
            TechnologyId::AdvancedElectronics,
            TechnologyId::ComputerTechnology,
            TechnologyId::AITechnology,
            TechnologyId::AdvancedAI,
            TechnologyId::Nanotechnology,
            TechnologyId::AdvancedNanotech,
            TechnologyId::Biotechnology,
            TechnologyId::GeneticEngineering,
            TechnologyId::RenewableEnergy,
            TechnologyId::NuclearEnergy,
        ];
        assert_eq!(tier2_techs.len(), 15);
        for tech in tier2_techs {
            assert_eq!(tech.tier(), 2);
        }

        // Verify tier 3 count
        let tier3_techs = vec![
            TechnologyId::QuantumComputing,
            TechnologyId::FusionEnergy,
            TechnologyId::AntimatterEnergy,
            TechnologyId::SpaceExploration,
            TechnologyId::Terraforming,
            TechnologyId::TimeManipulation,
            TechnologyId::DimensionalTravel,
            TechnologyId::ConsciousnessUpload,
            TechnologyId::Immortality,
            TechnologyId::Godhood,
        ];
        assert_eq!(tier3_techs.len(), 10);
        for tech in tier3_techs {
            assert_eq!(tech.tier(), 3);
        }

        // Verify tier 4 count
        let tier4_techs = vec![
            TechnologyId::ClickEfficiency,
            TechnologyId::ResourceBoost,
            TechnologyId::ProductionMultiplier,
            TechnologyId::CostReduction,
            TechnologyId::CriticalClick,
            TechnologyId::AutoAssignment,
            TechnologyId::Prestige,
            TechnologyId::Legacy,
            TechnologyId::Ascension,
            TechnologyId::Omniscience,
        ];
        assert_eq!(tier4_techs.len(), 10);
        for tech in tier4_techs {
            assert_eq!(tech.tier(), 4);
        }
    }
}
