use serde::{Deserialize, Serialize};

#[derive(
    Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Default,
)]
pub enum GameStage {
    #[default]
    Genesis,
    Workers,
    Maggot,
    Hybrid,
    Collective,
}

impl GameStage {
    pub fn id(&self) -> &'static str {
        match self {
            GameStage::Genesis => "stage_genesis",
            GameStage::Workers => "stage_workers",
            GameStage::Maggot => "stage_maggot",
            GameStage::Hybrid => "stage_hybrid",
            GameStage::Collective => "stage_collective",
        }
    }

    pub fn name(&self) -> &'static str {
        match self {
            GameStage::Genesis => "初始阶段",
            GameStage::Workers => "工人阶段",
            GameStage::Maggot => "蛆虫阶段",
            GameStage::Hybrid => "蛆虫人阶段",
            GameStage::Collective => "集体意识阶段",
        }
    }

    pub fn short_description(&self) -> &'static str {
        match self {
            GameStage::Genesis => "靠点击与基础建筑撑起最早期资源循环。",
            GameStage::Workers => "工人、住房与食物开始主导产能。",
            GameStage::Maggot => "尸体腐化揭示黑暗生物生产链。",
            GameStage::Hybrid => "人类与蛆虫人共生，稳定度成为核心变量。",
            GameStage::Collective => "集体意识、生物科技与宇宙探索汇流。",
        }
    }
}

fn default_symbiosis_stability() -> f64 {
    15.0
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CoexistenceState {
    #[serde(default)]
    pub human_pressure: f64,
    #[serde(default)]
    pub maggot_influence: f64,
    #[serde(default = "default_symbiosis_stability")]
    pub symbiosis_stability: f64,
    #[serde(default)]
    pub hybrid_population: f64,
    #[serde(default)]
    pub collective_consciousness: f64,
}

impl Default for CoexistenceState {
    fn default() -> Self {
        Self {
            human_pressure: 0.0,
            maggot_influence: 0.0,
            symbiosis_stability: default_symbiosis_stability(),
            hybrid_population: 0.0,
            collective_consciousness: 0.0,
        }
    }
}
