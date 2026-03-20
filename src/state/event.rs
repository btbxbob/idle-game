use serde::{Deserialize, Serialize};

pub const EVENT_LOG_LIMIT: usize = 1000;

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, Hash, Default)]
pub enum EventCategory {
    SurvivalCrisis,
    DarkConversion,
    #[default]
    IndustrialProgress,
    SocialMutation,
    EndgameSign,
}

impl EventCategory {
    pub fn id(&self) -> &'static str {
        match self {
            EventCategory::SurvivalCrisis => "survival_crisis",
            EventCategory::DarkConversion => "dark_conversion",
            EventCategory::IndustrialProgress => "industrial_progress",
            EventCategory::SocialMutation => "social_mutation",
            EventCategory::EndgameSign => "endgame_sign",
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, Hash, Default)]
pub enum EventImpact {
    #[default]
    Flavor,
    Effective,
}

impl EventImpact {
    pub fn id(&self) -> &'static str {
        match self {
            EventImpact::Flavor => "flavor",
            EventImpact::Effective => "effective",
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EventSnapshot {
    #[serde(default)]
    pub food: f64,
    #[serde(default)]
    pub hungry_workers: usize,
    #[serde(default)]
    pub corpses: f64,
    #[serde(default)]
    pub maggots: f64,
    #[serde(default)]
    pub building_count: usize,
    #[serde(default)]
    pub tech_count: usize,
    #[serde(default)]
    pub hybrid_population: f64,
    #[serde(default)]
    pub symbiosis_stability: f64,
    #[serde(default)]
    pub collective_consciousness: f64,
    #[serde(default)]
    pub total_clicks: u32,
    #[serde(default)]
    pub maggot_influence: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EventLogEntry {
    #[serde(default)]
    pub event_id: u32,
    pub timestamp: f64,
    pub scenario_id: String,
    #[serde(default)]
    pub category: EventCategory,
    #[serde(default)]
    pub impact: EventImpact,
    #[serde(default)]
    pub stage_id: String,
    #[serde(default)]
    pub variant_index: usize,
    #[serde(default)]
    pub worker_name: Option<String>,
    #[serde(default)]
    pub worker_trait: Option<String>,
    #[serde(default)]
    pub is_breaking: bool,
    #[serde(default)]
    pub snapshot: EventSnapshot,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EventJournalState {
    #[serde(default)]
    pub entries: Vec<EventLogEntry>,
    #[serde(default)]
    pub last_event_time: f64,
    #[serde(default)]
    pub total_events_generated: u32,
}

impl EventJournalState {
    pub fn push_entry(&mut self, entry: EventLogEntry) {
        self.entries.push(entry);
        if self.entries.len() > EVENT_LOG_LIMIT {
            let overflow = self.entries.len() - EVENT_LOG_LIMIT;
            self.entries.drain(0..overflow);
        }
    }
}
