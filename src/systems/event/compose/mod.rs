use super::{
    build_catalog_for_stage, stage_from_id, stage_name_en, variant_slot, EventContext,
};
use super::{ActiveEventModifierView, EventLogSummaryView, RenderedEventLogEntry};
use crate::entities::{Trait, Worker};
use crate::state::{
    ActiveEventModifier, EventCategory, EventEffectOutcome, EventLogEntry, EventSnapshot,
    GameStage,
};
use crate::systems::event_data::{
    trait_voice_pack_en, trait_voice_pack_zh, ScenarioSeed, BASE_DESKS, CULTURE_DESKS, RUMOR_DESKS,
};

mod styles;
mod templates;
mod render;

pub use render::{
    render_active_modifier_view, render_event_entry, snapshot_from_context, summarize_event_entry,
};
pub use styles::{detect_news_style, desks_for_style};
