pub mod achievement;
pub mod crafting;
pub mod decay;
pub mod event;
pub mod event_data;
pub mod population;
pub mod production;
pub mod stage;
pub mod technology;
pub mod unlock;

pub use achievement::Achievement;
pub use crafting::CraftingRecipe;
pub use decay::{CorpseInfo, CORPSE_DECAY_TIME_SECONDS, MAGGOTS_PER_CORPSE};
pub use event::{
    catalog_capacity as event_catalog_capacity, maybe_generate_event, render_event_entry,
    summarize_event_entry,
};
pub use population::{
    check_worker_starvation, check_worker_starvation_deaths, consume_food_for_workers,
};
pub use technology::TechnologyTree;
pub use unlock::UnlockedFeature;

pub mod prestige;
pub use prestige::calculate_pp_on_rebirth;
