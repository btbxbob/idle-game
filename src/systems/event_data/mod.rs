use crate::entities::technology::TechnologyId;
use crate::state::{EventCategory, EventImpact, GameStage};

#[derive(Clone, Copy)]
pub(super) enum TriggerFamily {
    Baseline,
    FoodStress,
    FoodGlutStall,
    DarkSignal,
    HybridFlux,
    CollectiveSignal,
}

#[derive(Clone, Copy)]
pub(super) enum EventEffect {
    None,
    AddMaggot(f64),
    AddCorpseAndMaggot {
        corpse: f64,
        maggot: f64,
    },
    TemporaryPrimaryProduction {
        coins_per_second: f64,
        wood_per_second: f64,
        stone_per_second: f64,
        duration_ms: f64,
    },
    TemporaryResourceFlow {
        food_per_second: f64,
        maggot_per_second: f64,
        duration_ms: f64,
    },
    AddCorpseWithTemporaryPrimaryPenalty {
        corpse: f64,
        coins_per_second: f64,
        wood_per_second: f64,
        stone_per_second: f64,
        duration_ms: f64,
    },
    ReduceFoodAndAddCorpseWithAftershock {
        food: f64,
        corpse: f64,
        food_per_second: f64,
        maggot_per_second: f64,
        duration_ms: f64,
    },
    TemporaryFoodProduction {
        food_per_second: f64,
        duration_ms: f64,
    },
    WorkersKilled {
        count: usize,
    },
    TemporaryMultiPenalty {
        coins_per_second: f64,
        wood_per_second: f64,
        stone_per_second: f64,
        food_per_second: f64,
        duration_ms: f64,
    },
}

#[derive(Clone, Copy)]
pub(super) struct StageSubject {
    pub(super) code: &'static str,
    pub(super) category: EventCategory,
    pub(super) trigger: TriggerFamily,
    pub(super) focus_zh: &'static str,
    pub(super) focus_en: &'static str,
    pub(super) angle_zh: &'static str,
    pub(super) angle_en: &'static str,
    pub(super) result_zh: &'static str,
    pub(super) result_en: &'static str,
    pub(super) impact: EventImpact,
    pub(super) effect: EventEffect,
    pub(super) breaking: bool,
}

#[derive(Clone, Copy)]
pub(super) struct TechTopic {
    pub(super) code: &'static str,
    pub(super) technology: TechnologyId,
    pub(super) category: EventCategory,
    pub(super) focus_zh: &'static str,
    pub(super) focus_en: &'static str,
    pub(super) angle_zh: &'static str,
    pub(super) angle_en: &'static str,
    pub(super) result_zh: &'static str,
    pub(super) result_en: &'static str,
    pub(super) breaking: bool,
}

#[derive(Clone)]
pub(super) struct ScenarioSeed {
    pub(super) id: String,
    pub(super) category: EventCategory,
    pub(super) impact: EventImpact,
    pub(super) stage: GameStage,
    pub(super) required_technology: Option<TechnologyId>,
    pub(super) trigger: TriggerFamily,
    pub(super) focus_zh: &'static str,
    pub(super) focus_en: &'static str,
    pub(super) desk_zh: &'static str,
    pub(super) desk_en: &'static str,
    pub(super) angle_zh: &'static str,
    pub(super) angle_en: &'static str,
    pub(super) result_zh: &'static str,
    pub(super) result_en: &'static str,
    pub(super) effect: EventEffect,
    pub(super) breaking: bool,
}

pub(super) const BASE_DESKS: [(&str, &str); 4] = [
    ("本台讯", "Breaking Desk"),
    ("深度报道", "Long Read"),
    ("聚落日报", "Settlement Daily"),
    ("工务快线", "Operations Wire"),
];

pub(super) const TECH_DESKS: [(&str, &str); 2] = [
    ("产业前沿", "Industry Brief"),
    ("系统简报", "System Bulletin"),
];

pub(super) const CULTURE_DESKS: [(&str, &str); 4] = [
    ("街区文娱", "Culture Desk"),
    ("夜报副刊", "After Hours"),
    ("流行观察", "Trending Watch"),
    ("周末特刊", "Weekend Feature"),
];

pub(super) const RUMOR_DESKS: [(&str, &str); 4] = [
    ("夜班怪谈", "Night Rumor File"),
    ("传闻记录", "Rumor Ledger"),
    ("边角消息", "Whisper Wire"),
    ("深夜来信", "Midnight Dispatch"),
];

pub(super) const TEMPLATE_EXPANSION_FACTOR: usize = 5;
pub(super) const REPORT_VARIANT_COUNT: usize = 1000;
pub(super) const EVENT_TEMPLATE_CAPACITY: usize = 2000;

mod stages;
mod voice_en;
mod voice_zh;

use stages::{
    COLLECTIVE_STAGE_SUBJECTS, COLLECTIVE_TECH_TOPICS, GENESIS_STAGE_SUBJECTS,
    GENESIS_TECH_TOPICS, HYBRID_STAGE_SUBJECTS, HYBRID_TECH_TOPICS, MAGGOT_STAGE_SUBJECTS,
    MAGGOT_TECH_TOPICS, WORKERS_STAGE_SUBJECTS, WORKERS_TECH_TOPICS,
};
pub(super) use voice_en::trait_voice_pack_en;
pub(super) use voice_zh::trait_voice_pack_zh;

pub(super) fn stage_subjects(stage: GameStage) -> &'static [StageSubject] {
    match stage {
        GameStage::Genesis => &GENESIS_STAGE_SUBJECTS,
        GameStage::Workers => &WORKERS_STAGE_SUBJECTS,
        GameStage::Maggot => &MAGGOT_STAGE_SUBJECTS,
        GameStage::Hybrid => &HYBRID_STAGE_SUBJECTS,
        GameStage::Collective => &COLLECTIVE_STAGE_SUBJECTS,
    }
}

pub(super) fn tech_topics(stage: GameStage) -> &'static [TechTopic] {
    match stage {
        GameStage::Genesis => &GENESIS_TECH_TOPICS,
        GameStage::Workers => &WORKERS_TECH_TOPICS,
        GameStage::Maggot => &MAGGOT_TECH_TOPICS,
        GameStage::Hybrid => &HYBRID_TECH_TOPICS,
        GameStage::Collective => &COLLECTIVE_TECH_TOPICS,
    }
}

pub(super) fn template_capacity() -> usize {
    EVENT_TEMPLATE_CAPACITY
}

pub(super) fn catalog_capacity() -> usize {
    template_capacity() * REPORT_VARIANT_COUNT
}

