use super::*;
use super::styles::{compose_headline_en, compose_headline_zh};
use super::templates::{compose_body_en, compose_body_zh, compose_worker_opinion_en, compose_worker_opinion_zh};

fn find_scenario(stage: GameStage, scenario_id: &str) -> Option<ScenarioSeed> {
    build_catalog_for_stage(stage)
        .into_iter()
        .find(|seed| seed.id == scenario_id)
}

pub fn snapshot_from_context(ctx: &EventContext) -> EventSnapshot {
    EventSnapshot {
        food: ctx.food,
        hungry_workers: ctx.hungry_workers,
        corpses: ctx.corpses,
        maggots: ctx.maggots,
        building_count: ctx.building_count,
        tech_count: ctx.tech_count,
        hybrid_population: ctx.hybrid_population,
        symbiosis_stability: ctx.symbiosis_stability,
        collective_consciousness: ctx.collective_consciousness,
        total_clicks: ctx.total_clicks,
        maggot_influence: ctx.maggot_influence,
    }
}

fn context_from_entry(entry: &EventLogEntry) -> EventContext {
    let stage = stage_from_id(&entry.stage_id);

    EventContext {
        stage,
        food: entry.snapshot.food,
        corpses: entry.snapshot.corpses,
        maggots: entry.snapshot.maggots,
        total_workers: 0,
        hungry_workers: entry.snapshot.hungry_workers,
        building_count: entry.snapshot.building_count,
        tech_count: entry.snapshot.tech_count,
        human_pressure: 0.0,
        maggot_influence: entry.snapshot.maggot_influence,
        symbiosis_stability: entry.snapshot.symbiosis_stability,
        hybrid_population: entry.snapshot.hybrid_population,
        collective_consciousness: entry.snapshot.collective_consciousness,
        total_clicks: entry.snapshot.total_clicks,
    }
}

pub fn summarize_event_entry(entry: &EventLogEntry) -> EventLogSummaryView {
    EventLogSummaryView {
        event_id: entry.event_id,
        timestamp: entry.timestamp,
        scenario_id: entry.scenario_id.clone(),
        category: entry.category.id().to_string(),
        impact: entry.impact.id().to_string(),
        worker_name: entry.worker_name.clone(),
        worker_trait: entry.worker_trait.clone(),
        is_breaking: entry.is_breaking,
        outcome: entry.outcome.clone(),
    }
}

pub fn render_event_entry(entry: &EventLogEntry) -> Option<RenderedEventLogEntry> {
    let stage = stage_from_id(&entry.stage_id);
    let seed = find_scenario(stage, &entry.scenario_id)?;
    let ctx = context_from_entry(entry);
    let worker_stub = match (&entry.worker_name, &entry.worker_trait) {
        (Some(name), Some(trait_name)) => Some(Worker {
            name: name.clone(),
            skills: String::new(),
            background: String::new(),
            preferences: String::new(),
            assigned_building: None,
            level: 1,
            efficiency_multiplier: 1.0,
            xp: 0.0,
            xp_to_next_level: 100.0,
            gender: crate::entities::Gender::Other,
            hobbies: vec![],
            primary_trait: match trait_name.as_str() {
                "Diligent" => Trait::Diligent,
                "Hardworking" => Trait::Hardworking,
                "Lazy" => Trait::Lazy,
                "Efficient" => Trait::Efficient,
                "Slow" => Trait::Slow,
                "Intelligent" => Trait::Intelligent,
                "FastLearner" => Trait::FastLearner,
                "Genius" => Trait::Genius,
                "SlowLearner" => Trait::SlowLearner,
                "Social" => Trait::Social,
                "Loner" => Trait::Loner,
                "Charismatic" => Trait::Charismatic,
                "Shy" => Trait::Shy,
                "NightOwl" => Trait::NightOwl,
                "EarlyBird" => Trait::EarlyBird,
                "Clumsy" => Trait::Clumsy,
                "Forgetful" => Trait::Forgetful,
                "Careless" => Trait::Careless,
                "Careful" => Trait::Careful,
                "Creative" => Trait::Creative,
                "Persevering" => Trait::Persevering,
                "Optimistic" => Trait::Optimistic,
                _ => Trait::Careful,
            },
            secondary_traits: vec![],
            happiness: 50.0,
            health: 100.0,
            hunger: 0.0,
            focus: 50.0,
            fatigue: 0.0,
            stress: 0.0,
            is_hungry: false,
            missing_limbs: vec![],
            maggot_limbs: vec![],
            starvation_start_time: 0.0,
        }),
        _ => None,
    };

    Some(RenderedEventLogEntry {
        event_id: entry.event_id,
        timestamp: entry.timestamp,
        scenario_id: entry.scenario_id.clone(),
        category: entry.category.id().to_string(),
        impact: entry.impact.id().to_string(),
        headline_zh: compose_headline_zh(&seed, entry.variant_index),
        headline_en: compose_headline_en(&seed, entry.variant_index),
        body_zh: compose_body_zh(
            &seed,
            &ctx,
            entry.worker_name.as_deref(),
            entry.variant_index,
        ),
        body_en: compose_body_en(
            &seed,
            &ctx,
            entry.worker_name.as_deref(),
            entry.variant_index,
        ),
        worker_name: entry.worker_name.clone(),
        worker_trait: entry.worker_trait.clone(),
        opinion_zh: worker_stub
            .as_ref()
            .map(|worker| compose_worker_opinion_zh(worker, &seed, &entry.scenario_id)),
        opinion_en: worker_stub
            .as_ref()
            .map(|worker| compose_worker_opinion_en(worker, &seed, &entry.scenario_id)),
        is_breaking: entry.is_breaking,
        outcome: entry.outcome.clone(),
    })
}

pub fn render_active_modifier_view(
    modifier: &ActiveEventModifier,
    now: f64,
) -> Option<ActiveEventModifierView> {
    if modifier.expires_at <= now {
        return None;
    }

    let seed = find_scenario(stage_from_id(&modifier.stage_id), &modifier.scenario_id)?;

    Some(ActiveEventModifierView {
        event_id: modifier.source_event_id,
        scenario_id: modifier.scenario_id.clone(),
        stage_id: modifier.stage_id.clone(),
        headline_zh: seed.focus_zh.to_string(),
        headline_en: seed.focus_en.to_string(),
        remaining_ms: modifier.expires_at - now,
        outcome: EventEffectOutcome {
            coins_per_second_delta: modifier.coins_per_second_delta,
            wood_per_second_delta: modifier.wood_per_second_delta,
            stone_per_second_delta: modifier.stone_per_second_delta,
            food_per_second_delta: modifier.food_per_second_delta,
            maggot_per_second_delta: modifier.maggot_per_second_delta,
            duration_ms: (modifier.expires_at - now).max(0.0),
            ..EventEffectOutcome::default()
        },
    })
}

