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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::{EventImpact};

    fn make_context() -> EventContext {
        EventContext {
            stage: GameStage::Workers,
            food: 100.0,
            corpses: 5.0,
            maggots: 10.0,
            total_workers: 20,
            hungry_workers: 3,
            building_count: 8,
            tech_count: 4,
            human_pressure: 0.5,
            maggot_influence: 0.3,
            symbiosis_stability: 0.7,
            hybrid_population: 2.0,
            collective_consciousness: 0.1,
            total_clicks: 500,
        }
    }

    fn make_entry(scenario_id: &str, stage_id: &str) -> EventLogEntry {
        EventLogEntry {
            event_id: 1,
            timestamp: 1000.0,
            scenario_id: scenario_id.to_string(),
            category: EventCategory::IndustrialProgress,
            impact: EventImpact::Flavor,
            stage_id: stage_id.to_string(),
            variant_index: 0,
            worker_name: Some("测试员".to_string()),
            worker_trait: Some("Diligent".to_string()),
            is_breaking: false,
            snapshot: EventSnapshot {
                food: 100.0,
                hungry_workers: 2,
                corpses: 0.0,
                maggots: 0.0,
                building_count: 5,
                tech_count: 3,
                hybrid_population: 0.0,
                symbiosis_stability: 0.0,
                collective_consciousness: 0.0,
                total_clicks: 100,
                maggot_influence: 0.0,
            },
            outcome: EventEffectOutcome::default(),
        }
    }

    #[test]
    fn snapshot_from_context_copies_fields() {
        let ctx = make_context();
        let snap = snapshot_from_context(&ctx);
        assert_eq!(snap.food, 100.0);
        assert_eq!(snap.hungry_workers, 3);
        assert_eq!(snap.corpses, 5.0);
        assert_eq!(snap.maggots, 10.0);
        assert_eq!(snap.building_count, 8);
        assert_eq!(snap.tech_count, 4);
        assert_eq!(snap.total_clicks, 500);
    }

    #[test]
    fn summarize_event_entry_copies_fields() {
        let entry = make_entry("test_scenario", "Workers");
        let summary = summarize_event_entry(&entry);
        assert_eq!(summary.event_id, 1);
        assert_eq!(summary.scenario_id, "test_scenario");
        assert_eq!(summary.category, "industrial_progress");
        assert_eq!(summary.impact, "flavor");
        assert_eq!(summary.worker_name, Some("测试员".to_string()));
        assert_eq!(summary.worker_trait, Some("Diligent".to_string()));
        assert!(!summary.is_breaking);
    }

    #[test]
    fn summarize_event_entry_without_worker() {
        let mut entry = make_entry("test_scenario", "Workers");
        entry.worker_name = None;
        entry.worker_trait = None;
        let summary = summarize_event_entry(&entry);
        assert!(summary.worker_name.is_none());
        assert!(summary.worker_trait.is_none());
    }

    #[test]
    fn render_active_modifier_view_expired_returns_none() {
        let modifier = ActiveEventModifier {
            source_event_id: 1,
            scenario_id: "test".to_string(),
            stage_id: "Workers".to_string(),
            expires_at: 100.0,
            ..Default::default()
        };
        let result = render_active_modifier_view(&modifier, 200.0);
        assert!(result.is_none());
    }

    #[test]
    fn render_active_modifier_view_unknown_scenario_returns_none() {
        let modifier = ActiveEventModifier {
            source_event_id: 1,
            scenario_id: "nonexistent_scenario".to_string(),
            stage_id: "Workers".to_string(),
            expires_at: 1000.0,
            coins_per_second_delta: 5.0,
            ..Default::default()
        };
        let result = render_active_modifier_view(&modifier, 100.0);
        assert!(result.is_none());
    }

    #[test]
    fn render_active_modifier_view_success() {
        let modifier = ActiveEventModifier {
            source_event_id: 42,
            scenario_id: "stage_genesis_click_heat_0_r0".to_string(),
            stage_id: "stage_genesis".to_string(),
            expires_at: 1000.0,
            coins_per_second_delta: 2.5,
            wood_per_second_delta: 1.0,
            ..Default::default()
        };
        let result = render_active_modifier_view(&modifier, 500.0);
        assert!(result.is_some());
        let view = result.unwrap();
        assert_eq!(view.event_id, 42);
        assert_eq!(view.scenario_id, "stage_genesis_click_heat_0_r0");
        assert_eq!(view.remaining_ms, 500.0);
        assert_eq!(view.outcome.coins_per_second_delta, 2.5);
        assert_eq!(view.outcome.wood_per_second_delta, 1.0);
        assert!(!view.headline_zh.is_empty());
        assert!(!view.headline_en.is_empty());
    }

    #[test]
    fn render_event_entry_with_valid_scenario() {
        let entry = make_entry("stage_genesis_click_heat_0_r0", "stage_genesis");
        let result = render_event_entry(&entry);
        assert!(result.is_some());
        let rendered = result.unwrap();
        assert_eq!(rendered.event_id, 1);
        assert_eq!(rendered.scenario_id, "stage_genesis_click_heat_0_r0");
        assert!(!rendered.headline_zh.is_empty());
        assert!(!rendered.headline_en.is_empty());
        assert!(!rendered.body_zh.is_empty());
        assert!(!rendered.body_en.is_empty());
        assert_eq!(rendered.worker_name, Some("测试员".to_string()));
        assert_eq!(rendered.worker_trait, Some("Diligent".to_string()));
        assert!(rendered.opinion_zh.is_some());
        assert!(rendered.opinion_en.is_some());
    }

    #[test]
    fn render_event_entry_without_worker() {
        let mut entry = make_entry("stage_genesis_click_heat_0_r0", "stage_genesis");
        entry.worker_name = None;
        entry.worker_trait = None;
        let result = render_event_entry(&entry);
        assert!(result.is_some());
        let rendered = result.unwrap();
        assert!(rendered.worker_name.is_none());
        assert!(rendered.opinion_zh.is_none());
        assert!(rendered.opinion_en.is_none());
    }

    #[test]
    fn render_event_entry_unknown_scenario_returns_none() {
        let entry = make_entry("nonexistent_scenario_id", "stage_genesis");
        let result = render_event_entry(&entry);
        assert!(result.is_none());
    }

    #[test]
    fn render_event_entry_all_trait_mappings() {
        let traits = [
            "Diligent", "Hardworking", "Lazy", "Efficient", "Slow",
            "Intelligent", "FastLearner", "Genius", "SlowLearner",
            "Social", "Loner", "Charismatic", "Shy", "NightOwl",
            "EarlyBird", "Clumsy", "Forgetful", "Careless", "Careful",
            "Creative", "Persevering", "Optimistic",
        ];
        for trait_name in &traits {
            let mut entry = make_entry("stage_genesis_click_heat_0_r0", "stage_genesis");
            entry.worker_trait = Some(trait_name.to_string());
            let result = render_event_entry(&entry);
            assert!(result.is_some(), "trait {} should produce a result", trait_name);
            let rendered = result.unwrap();
            assert!(rendered.opinion_zh.is_some(), "trait {} should have opinion_zh", trait_name);
        }
    }

    #[test]
    fn render_event_entry_unknown_trait_defaults_to_careful() {
        let mut entry = make_entry("stage_genesis_click_heat_0_r0", "stage_genesis");
        entry.worker_trait = Some("UnknownTrait".to_string());
        let result = render_event_entry(&entry);
        assert!(result.is_some());
        let rendered = result.unwrap();
        assert!(rendered.opinion_zh.is_some());
    }

    #[test]
    fn context_from_entry_sets_defaults() {
        let entry = make_entry("stage_genesis_click_heat_0_r0", "stage_genesis");
        let ctx = context_from_entry(&entry);
        assert_eq!(ctx.stage, GameStage::Genesis);
        assert_eq!(ctx.food, 100.0);
        assert_eq!(ctx.hungry_workers, 2);
        assert_eq!(ctx.total_workers, 0);
        assert_eq!(ctx.human_pressure, 0.0);
    }
}

