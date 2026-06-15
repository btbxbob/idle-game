use crate::entities::{Building, Worker};
use crate::state::{EventEffectOutcome, EventImpact, GameStage, GameState, ResourceType};
use crate::systems::event_data::{
    catalog_capacity as total_text_capacity, stage_subjects, tech_topics, template_capacity,
    EventEffect, ScenarioSeed, TriggerFamily, TECH_DESKS, TEMPLATE_EXPANSION_FACTOR,
};
use crate::systems::technology::TechnologyTree;
use serde::Serialize;
pub fn catalog_capacity() -> usize {
    total_text_capacity()
}

pub fn template_capacity_total() -> usize {
    template_capacity()
}

pub(super) fn variant_slot(variant: usize, stride: usize, len: usize) -> usize {
    if len == 0 {
        return 0;
    }
    (variant / stride) % len
}

pub(super) struct EventContext {
    pub(super) stage: GameStage,
    pub(super) food: f64,
    pub(super) corpses: f64,
    pub(super) maggots: f64,
    pub(super) total_workers: usize,
    pub(super) hungry_workers: usize,
    pub(super) building_count: usize,
    pub(super) tech_count: usize,
    pub(super) human_pressure: f64,
    pub(super) maggot_influence: f64,
    pub(super) symbiosis_stability: f64,
    pub(super) hybrid_population: f64,
    pub(super) collective_consciousness: f64,
    pub(super) total_clicks: u32,
}

#[derive(Default, Clone, Copy)]
pub struct ActiveEventModifierTotals {
    pub coins_per_second_delta: f64,
    pub wood_per_second_delta: f64,
    pub stone_per_second_delta: f64,
    pub food_per_second_delta: f64,
    pub maggot_per_second_delta: f64,
}

#[derive(Serialize, Clone)]
pub struct EventLogSummaryView {
    pub event_id: u32,
    pub timestamp: f64,
    pub scenario_id: String,
    pub category: String,
    pub impact: String,
    pub worker_name: Option<String>,
    pub worker_trait: Option<String>,
    pub is_breaking: bool,
    pub outcome: EventEffectOutcome,
}

#[derive(Serialize, Clone)]
pub struct RenderedEventLogEntry {
    pub event_id: u32,
    pub timestamp: f64,
    pub scenario_id: String,
    pub category: String,
    pub impact: String,
    pub headline_zh: String,
    pub headline_en: String,
    pub body_zh: String,
    pub body_en: String,
    pub worker_name: Option<String>,
    pub worker_trait: Option<String>,
    pub opinion_zh: Option<String>,
    pub opinion_en: Option<String>,
    pub is_breaking: bool,
    pub outcome: EventEffectOutcome,
}

#[derive(Serialize, Clone)]
pub struct ActiveEventModifierView {
    pub event_id: u32,
    pub scenario_id: String,
    pub stage_id: String,
    pub headline_zh: String,
    pub headline_en: String,
    pub remaining_ms: f64,
    pub outcome: EventEffectOutcome,
}

pub(super) fn stage_from_id(stage_id: &str) -> GameStage {
    match stage_id {
        "stage_workers" => GameStage::Workers,
        "stage_maggot" => GameStage::Maggot,
        "stage_hybrid" => GameStage::Hybrid,
        "stage_collective" => GameStage::Collective,
        _ => GameStage::Genesis,
    }
}

pub(super) fn event_cooldown_ms(stage: GameStage) -> f64 {
    match stage {
        GameStage::Genesis => 48_000.0,
        GameStage::Workers => 42_000.0,
        GameStage::Maggot => 36_000.0,
        GameStage::Hybrid => 36_000.0,
        GameStage::Collective => 34_000.0,
    }
}

pub(super) fn build_context(
    state: &GameState,
    workers: &[Worker],
    buildings: &[Building],
    tech_tree: &TechnologyTree,
) -> EventContext {
    EventContext {
        stage: state.current_stage,
        food: state.get_resource(ResourceType::Food),
        corpses: state.get_resource(ResourceType::Corpse),
        maggots: state.get_resource(ResourceType::Maggot),
        total_workers: workers.len(),
        hungry_workers: workers.iter().filter(|worker| worker.is_hungry).count(),
        building_count: buildings
            .iter()
            .map(|building| building.count as usize)
            .sum(),
        tech_count: tech_tree
            .technologies
            .values()
            .filter(|technology| technology.purchased)
            .count(),
        human_pressure: state.coexistence.human_pressure,
        maggot_influence: state.coexistence.maggot_influence,
        symbiosis_stability: state.coexistence.symbiosis_stability,
        hybrid_population: state.coexistence.hybrid_population,
        collective_consciousness: state.coexistence.collective_consciousness,
        total_clicks: state.total_clicks,
    }
}

pub(super) fn build_catalog_for_stage(stage: GameStage) -> Vec<ScenarioSeed> {
    let mut catalog = Vec::with_capacity(360);

    for subject in stage_subjects(stage) {
        let desks = desks_for_style(detect_news_style(&ScenarioSeed {
            id: String::new(),
            category: subject.category,
            impact: subject.impact,
            stage,
            required_technology: None,
            trigger: subject.trigger,
            focus_zh: subject.focus_zh,
            focus_en: subject.focus_en,
            desk_zh: "",
            desk_en: "",
            angle_zh: subject.angle_zh,
            angle_en: subject.angle_en,
            result_zh: subject.result_zh,
            result_en: subject.result_en,
            effect: subject.effect,
            breaking: subject.breaking,
        }));
        for revision in 0..TEMPLATE_EXPANSION_FACTOR {
            for (index, (desk_zh, desk_en)) in desks.iter().enumerate() {
                catalog.push(ScenarioSeed {
                    id: format!("{}_{}_{}_r{}", stage.id(), subject.code, index, revision),
                    category: subject.category,
                    impact: subject.impact,
                    stage,
                    required_technology: None,
                    trigger: subject.trigger,
                    focus_zh: subject.focus_zh,
                    focus_en: subject.focus_en,
                    desk_zh,
                    desk_en,
                    angle_zh: subject.angle_zh,
                    angle_en: subject.angle_en,
                    result_zh: subject.result_zh,
                    result_en: subject.result_en,
                    effect: subject.effect,
                    breaking: subject.breaking || (index == 0 && revision == 0),
                });
            }
        }
    }

    for topic in tech_topics(stage) {
        for revision in 0..TEMPLATE_EXPANSION_FACTOR {
            for (index, (desk_zh, desk_en)) in TECH_DESKS.iter().enumerate() {
                catalog.push(ScenarioSeed {
                    id: format!("{}_{}_tech{}_r{}", stage.id(), topic.code, index, revision),
                    category: topic.category,
                    impact: EventImpact::Flavor,
                    stage,
                    required_technology: Some(topic.technology),
                    trigger: TriggerFamily::Baseline,
                    focus_zh: topic.focus_zh,
                    focus_en: topic.focus_en,
                    desk_zh,
                    desk_en,
                    angle_zh: topic.angle_zh,
                    angle_en: topic.angle_en,
                    result_zh: topic.result_zh,
                    result_en: topic.result_en,
                    effect: EventEffect::None,
                    breaking: topic.breaking || (index == 0 && revision == 0),
                });
            }
        }
    }

    catalog
}

pub(super) fn trigger_matches(seed: &ScenarioSeed, ctx: &EventContext) -> bool {
    if seed.stage != ctx.stage {
        return false;
    }

    match seed.trigger {
        TriggerFamily::Baseline => ctx.building_count > 0 || ctx.total_clicks >= 10,
        TriggerFamily::FoodStress => {
            (ctx.total_workers > 0 && ctx.food < ctx.total_workers as f64 + 1.0)
                || ctx.hungry_workers > 0
        }
        TriggerFamily::FoodGlutStall => {
            ctx.food >= ctx.total_workers.max(1) as f64 + 12.0 && ctx.corpses < 2.0
        }
        TriggerFamily::DarkSignal => {
            ctx.corpses >= 1.0 || ctx.maggots >= 1.0 || ctx.maggot_influence >= 5.0
        }
        TriggerFamily::HybridFlux => {
            ctx.hybrid_population > 0.0
                || ctx.symbiosis_stability < 60.0
                || ctx.human_pressure > 10.0
        }
        TriggerFamily::CollectiveSignal => {
            ctx.collective_consciousness > 0.0 || ctx.maggot_influence > 20.0
        }
    }
}

pub(super) fn stage_name_en(stage: GameStage) -> &'static str {
    match stage {
        GameStage::Genesis => "Genesis Stage",
        GameStage::Workers => "Worker Stage",
        GameStage::Maggot => "Maggot Stage",
        GameStage::Hybrid => "Hybrid Stage",
        GameStage::Collective => "Collective Stage",
    }
}

mod compose;
mod effects;

use compose::{detect_news_style, desks_for_style};
pub use compose::{render_active_modifier_view, render_event_entry, summarize_event_entry};
pub use effects::{active_modifier_totals, maybe_generate_event, tick_active_modifiers};
