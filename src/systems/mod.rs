pub mod achievement;
pub mod crafting;
pub mod decay;
pub mod production;
pub mod stage;
pub mod unlock;
pub mod technology;
pub mod population;

pub use achievement::Achievement;
pub use crafting::CraftingRecipe;
pub use decay::{CorpseInfo, CORPSE_DECAY_TIME_SECONDS, MAGGOTS_PER_CORPSE};
pub use unlock::UnlockedFeature;
pub use technology::TechnologyTree;
pub use population::{consume_food_for_workers, check_worker_starvation, check_worker_starvation_deaths};

pub mod prestige;
pub use prestige::calculate_pp_on_rebirth;