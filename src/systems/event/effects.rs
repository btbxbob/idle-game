use super::compose::snapshot_from_context;
use super::{
    build_catalog_for_stage, build_context, event_cooldown_ms, trigger_matches, EventContext,
    ActiveEventModifierTotals,
};
use crate::entities::{Building, LimbSlot, Worker};
use crate::state::{
    ActiveEventModifier, EventEffectOutcome, EventImpact, EventLogEntry, GameState, ResourceType,
};
use crate::systems::event_data::{EventEffect, ScenarioSeed, REPORT_VARIANT_COUNT};
use crate::systems::technology::TechnologyTree;
use rand::prelude::IndexedRandom;
use rand::rng;
fn injure_random_workers(workers: &mut Vec<Worker>, injury_count: usize) -> (usize, f64) {
    let limb_slots = [
        LimbSlot::LeftArm,
        LimbSlot::RightArm,
        LimbSlot::LeftLeg,
        LimbSlot::RightLeg,
    ];
    let mut local_rng = rng();
    let mut actual_injuries = 0;
    let mut happiness_delta = 0.0;

    for _ in 0..injury_count {
        let candidates: Vec<usize> = workers
            .iter()
            .enumerate()
            .filter(|(_, worker)| worker.missing_limbs.len() < limb_slots.len())
            .map(|(index, _)| index)
            .collect();
        let Some(&worker_index) = candidates.choose(&mut local_rng) else {
            break;
        };

        let available_limbs: Vec<LimbSlot> = limb_slots
            .iter()
            .copied()
            .filter(|limb| !workers[worker_index].missing_limbs.contains(limb))
            .collect();
        let Some(&lost_limb) = available_limbs.choose(&mut local_rng) else {
            continue;
        };

        workers[worker_index].missing_limbs.push(lost_limb);
        workers[worker_index].health = (workers[worker_index].health - 25.0).clamp(0.0, 100.0);
        workers[worker_index].happiness =
            (workers[worker_index].happiness - 10.0).clamp(0.0, 100.0);
        workers[worker_index].stress = (workers[worker_index].stress + 18.0).clamp(0.0, 100.0);
        workers[worker_index].fatigue = (workers[worker_index].fatigue + 12.0).clamp(0.0, 100.0);
        actual_injuries += 1;
        happiness_delta -= 10.0;
    }

    (actual_injuries, happiness_delta)
}

fn kill_random_workers(workers: &mut Vec<Worker>, death_count: usize) -> usize {
    let mut local_rng = rng();
    let mut actual_deaths = 0;
    for _ in 0..death_count.min(workers.len()) {
        let candidates: Vec<usize> = (0..workers.len()).collect();
        let Some(&worker_index) = candidates.choose(&mut local_rng) else {
            break;
        };
        workers.remove(worker_index);
        actual_deaths += 1;
    }

    actual_deaths
}

fn push_active_modifier(
    state: &mut GameState,
    source_event_id: u32,
    scenario_id: &str,
    stage_id: &str,
    now: f64,
    duration_ms: f64,
    coins_per_second_delta: f64,
    wood_per_second_delta: f64,
    stone_per_second_delta: f64,
    food_per_second_delta: f64,
    maggot_per_second_delta: f64,
) {
    if duration_ms <= 0.0 {
        return;
    }

    state
        .event_journal
        .active_modifiers
        .push(ActiveEventModifier {
            source_event_id,
            scenario_id: scenario_id.to_string(),
            stage_id: stage_id.to_string(),
            expires_at: now + duration_ms,
            coins_per_second_delta,
            wood_per_second_delta,
            stone_per_second_delta,
            food_per_second_delta,
            maggot_per_second_delta,
        });
}

pub fn active_modifier_totals(state: &GameState, now: f64) -> ActiveEventModifierTotals {
    state
        .event_journal
        .active_modifiers
        .iter()
        .filter(|modifier| modifier.expires_at > now)
        .fold(
            ActiveEventModifierTotals::default(),
            |mut totals, modifier| {
                totals.coins_per_second_delta += modifier.coins_per_second_delta;
                totals.wood_per_second_delta += modifier.wood_per_second_delta;
                totals.stone_per_second_delta += modifier.stone_per_second_delta;
                totals.food_per_second_delta += modifier.food_per_second_delta;
                totals.maggot_per_second_delta += modifier.maggot_per_second_delta;
                totals
            },
        )
}

pub fn tick_active_modifiers(
    state: &mut GameState,
    now: f64,
    elapsed: f64,
) -> ActiveEventModifierTotals {
    state
        .event_journal
        .active_modifiers
        .retain(|modifier| modifier.expires_at > now);

    let totals = active_modifier_totals(state, now);
    if elapsed > 0.0 {
        let food_delta = totals.food_per_second_delta * elapsed;
        let maggot_delta = totals.maggot_per_second_delta * elapsed;

        if food_delta != 0.0 {
            state.add_resource(ResourceType::Food, food_delta);
        }
        if maggot_delta != 0.0 {
            state.add_resource(ResourceType::Maggot, maggot_delta);
        }
    }

    totals
}

fn apply_effect(
    effect: EventEffect,
    state: &mut GameState,
    workers: &mut Vec<Worker>,
    now: f64,
    event_id: u32,
    scenario_id: &str,
) -> EventEffectOutcome {
    let stage_id = state.current_stage.id().to_string();

    match effect {
        EventEffect::None => EventEffectOutcome::default(),
        EventEffect::AddMaggot(amount) => {
            state.add_resource(ResourceType::Maggot, amount);
            EventEffectOutcome {
                maggot_delta: amount,
                ..EventEffectOutcome::default()
            }
        }
        EventEffect::AddCorpseAndMaggot { corpse, maggot } => {
            state.add_resource(ResourceType::Corpse, corpse);
            state.add_resource(ResourceType::Maggot, maggot);
            let workers_killed = kill_random_workers(workers, corpse.floor() as usize);
            let (workers_injured, happiness_delta) = injure_random_workers(workers, 1);
            EventEffectOutcome {
                corpse_delta: corpse,
                maggot_delta: maggot,
                workers_killed,
                workers_injured,
                happiness_delta,
                ..EventEffectOutcome::default()
            }
        }
        EventEffect::TemporaryPrimaryProduction {
            coins_per_second,
            wood_per_second,
            stone_per_second,
            duration_ms,
        } => {
            push_active_modifier(
                state,
                event_id,
                scenario_id,
                &stage_id,
                now,
                duration_ms,
                coins_per_second,
                wood_per_second,
                stone_per_second,
                0.0,
                0.0,
            );
            EventEffectOutcome {
                coins_per_second_delta: coins_per_second,
                wood_per_second_delta: wood_per_second,
                stone_per_second_delta: stone_per_second,
                duration_ms,
                ..EventEffectOutcome::default()
            }
        }
        EventEffect::TemporaryResourceFlow {
            food_per_second,
            maggot_per_second,
            duration_ms,
        } => {
            push_active_modifier(
                state,
                event_id,
                scenario_id,
                &stage_id,
                now,
                duration_ms,
                0.0,
                0.0,
                0.0,
                food_per_second,
                maggot_per_second,
            );
            EventEffectOutcome {
                food_per_second_delta: food_per_second,
                maggot_per_second_delta: maggot_per_second,
                duration_ms,
                ..EventEffectOutcome::default()
            }
        }
        EventEffect::AddCorpseWithTemporaryPrimaryPenalty {
            corpse,
            coins_per_second,
            wood_per_second,
            stone_per_second,
            duration_ms,
        } => {
            state.add_resource(ResourceType::Corpse, corpse);
            let workers_killed = kill_random_workers(workers, corpse.floor() as usize);
            let (workers_injured, happiness_delta) = injure_random_workers(workers, 1);
            push_active_modifier(
                state,
                event_id,
                scenario_id,
                &stage_id,
                now,
                duration_ms,
                coins_per_second,
                wood_per_second,
                stone_per_second,
                0.0,
                0.0,
            );
            EventEffectOutcome {
                corpse_delta: corpse,
                workers_killed,
                workers_injured,
                happiness_delta,
                coins_per_second_delta: coins_per_second,
                wood_per_second_delta: wood_per_second,
                stone_per_second_delta: stone_per_second,
                duration_ms,
                ..EventEffectOutcome::default()
            }
        }
        EventEffect::ReduceFoodAndAddCorpseWithAftershock {
            food,
            corpse,
            food_per_second,
            maggot_per_second,
            duration_ms,
        } => {
            let current_food = state.get_resource(ResourceType::Food);
            let actual_food_loss = current_food.min(food);
            state.set_resource(ResourceType::Food, (current_food - food).max(0.0));
            state.add_resource(ResourceType::Corpse, corpse);
            let workers_killed = kill_random_workers(workers, corpse.floor() as usize);
            let (workers_injured, happiness_delta) = injure_random_workers(workers, 1);
            push_active_modifier(
                state,
                event_id,
                scenario_id,
                &stage_id,
                now,
                duration_ms,
                0.0,
                0.0,
                0.0,
                food_per_second,
                maggot_per_second,
            );
            EventEffectOutcome {
                food_delta: -actual_food_loss,
                corpse_delta: corpse,
                workers_killed,
                workers_injured,
                happiness_delta,
                food_per_second_delta: food_per_second,
                maggot_per_second_delta: maggot_per_second,
                duration_ms,
                ..EventEffectOutcome::default()
            }
        }
        EventEffect::TemporaryFoodProduction {
            food_per_second,
            duration_ms,
        } => {
            push_active_modifier(
                state,
                event_id,
                scenario_id,
                &stage_id,
                now,
                duration_ms,
                0.0,
                0.0,
                0.0,
                food_per_second,
                0.0,
            );
            EventEffectOutcome {
                food_per_second_delta: food_per_second,
                duration_ms,
                ..EventEffectOutcome::default()
            }
        }
        EventEffect::WorkersKilled { count } => {
            let workers_killed = kill_random_workers(workers, count);
            let (workers_injured, happiness_delta) = injure_random_workers(workers, count / 2);
            EventEffectOutcome {
                workers_killed,
                workers_injured,
                happiness_delta,
                ..EventEffectOutcome::default()
            }
        }
        EventEffect::TemporaryMultiPenalty {
            coins_per_second,
            wood_per_second,
            stone_per_second,
            food_per_second,
            duration_ms,
        } => {
            push_active_modifier(
                state,
                event_id,
                scenario_id,
                &stage_id,
                now,
                duration_ms,
                coins_per_second,
                wood_per_second,
                stone_per_second,
                food_per_second,
                0.0,
            );
            EventEffectOutcome {
                coins_per_second_delta: coins_per_second,
                wood_per_second_delta: wood_per_second,
                stone_per_second_delta: stone_per_second,
                food_per_second_delta: food_per_second,
                duration_ms,
                ..EventEffectOutcome::default()
            }
        }
    }
}

fn eligible_scenarios(
    state: &GameState,
    tech_tree: &TechnologyTree,
    ctx: &EventContext,
) -> Vec<ScenarioSeed> {
    build_catalog_for_stage(ctx.stage)
        .into_iter()
        .filter(|seed| {
            seed.required_technology
                .map(|technology| tech_tree.is_unlocked(technology))
                .unwrap_or(true)
                && trigger_matches(seed, ctx)
                && seed.stage == state.current_stage
        })
        .collect()
}

fn select_scenario(
    state: &GameState,
    tech_tree: &TechnologyTree,
    ctx: &EventContext,
) -> Option<ScenarioSeed> {
    let candidates = eligible_scenarios(state, tech_tree, ctx);
    if candidates.is_empty() {
        return None;
    }

    let flavor: Vec<ScenarioSeed> = candidates
        .iter()
        .filter(|seed| seed.impact == EventImpact::Flavor)
        .cloned()
        .collect();
    let effective: Vec<ScenarioSeed> = candidates
        .iter()
        .filter(|seed| seed.impact == EventImpact::Effective)
        .cloned()
        .collect();
    let wants_effective = (state.event_journal.total_events_generated + 1) % 5 == 0;
    let pool = if wants_effective && !effective.is_empty() {
        effective
    } else if !flavor.is_empty() {
        flavor
    } else {
        effective
    };
    let mut local_rng = rng();
    pool.choose(&mut local_rng).cloned()
}

pub fn maybe_generate_event(
    state: &mut GameState,
    workers: &mut Vec<Worker>,
    buildings: &[Building],
    tech_tree: &TechnologyTree,
    now: f64,
) -> Option<EventLogEntry> {
    if now - state.event_journal.last_event_time < event_cooldown_ms(state.current_stage) {
        return None;
    }

    let ctx = build_context(state, workers, buildings, tech_tree);
    let seed = select_scenario(state, tech_tree, &ctx)?;
    let event_id = state.event_journal.total_events_generated + 1;
    let variant = (state.event_journal.total_events_generated as usize + seed.id.len())
        % REPORT_VARIANT_COUNT;

    let outcome = apply_effect(seed.effect, state, workers, now, event_id, &seed.id);

    let worker = {
        let mut local_rng = rng();
        workers.choose(&mut local_rng)
    };

    let entry = EventLogEntry {
        event_id,
        timestamp: now,
        scenario_id: seed.id.clone(),
        category: seed.category,
        impact: seed.impact,
        stage_id: seed.stage.id().to_string(),
        variant_index: variant,
        worker_name: worker.map(|value| value.name.clone()),
        worker_trait: worker.map(|value| format!("{:?}", value.primary_trait)),
        is_breaking: seed.breaking || seed.impact == EventImpact::Effective,
        snapshot: snapshot_from_context(&ctx),
        outcome,
    };

    state.event_journal.last_event_time = now;
    state.event_journal.total_events_generated += 1;
    state.event_journal.push_entry(entry.clone());
    Some(entry)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entities::{Gender, Hobby, Trait};
    use crate::state::GameStage;
    use crate::systems::event::{build_catalog_for_stage, catalog_capacity, template_capacity_total};

    fn sample_worker() -> Worker {
        Worker {
            name: "James Smith".to_string(),
            skills: "farming".to_string(),
            background: "Dock".to_string(),
            preferences: "农场".to_string(),
            assigned_building: None,
            level: 1,
            efficiency_multiplier: 1.0,
            xp: 0.0,
            xp_to_next_level: 100.0,
            gender: Gender::Male,
            hobbies: vec![Hobby::Fishing],
            primary_trait: Trait::Diligent,
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
        }
    }

    #[test]
    fn event_catalog_capacity_tracks_total_text_variants() {
        assert_eq!(template_capacity_total(), 2000);
        assert_eq!(catalog_capacity(), 2_000_000);
        assert_eq!(build_catalog_for_stage(GameStage::Genesis).len(), 520);
    }

    #[test]
    fn every_fifth_event_prefers_effective_when_available() {
        let mut state = GameState::default();
        state.current_stage = GameStage::Workers;
        state.set_resource(ResourceType::Food, 40.0);
        state.event_journal.total_events_generated = 4;
        let mut workers = vec![sample_worker()];

        let event = maybe_generate_event(
            &mut state,
            &mut workers,
            &[],
            &TechnologyTree::default(),
            60_000.0,
        )
        .expect("event should be generated");

        assert_eq!(event.impact, EventImpact::Effective);
        assert!(event.outcome.corpse_delta > 0.0 || event.outcome.maggot_delta > 0.0);
        assert!(
            state.get_resource(ResourceType::Corpse) >= 1.0
                || state.get_resource(ResourceType::Maggot) >= 1.0
        );
    }

    #[test]
    fn temporary_effect_registers_and_ticks() {
        let mut state = GameState::default();
        state.set_resource(ResourceType::Food, 10.0);
        let mut workers = vec![sample_worker()];

        let outcome = apply_effect(
            EventEffect::TemporaryResourceFlow {
                food_per_second: 0.5,
                maggot_per_second: 0.25,
                duration_ms: 30_000.0,
            },
            &mut state,
            &mut workers,
            1_000.0,
            7,
            "test_flow",
        );

        assert_eq!(outcome.food_per_second_delta, 0.5);
        assert_eq!(outcome.maggot_per_second_delta, 0.25);
        assert_eq!(state.event_journal.active_modifiers.len(), 1);

        let totals = tick_active_modifiers(&mut state, 2_000.0, 2.0);
        assert_eq!(totals.food_per_second_delta, 0.5);
        assert_eq!(totals.maggot_per_second_delta, 0.25);
        assert_eq!(state.get_resource(ResourceType::Food), 11.0);
        assert_eq!(state.get_resource(ResourceType::Maggot), 0.5);
    }
}
