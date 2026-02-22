pub mod achievement;
pub mod crafting;
pub mod decay;
pub mod production;
pub mod unlock;

pub use achievement::Achievement;
pub use crafting::CraftingRecipe;
pub use decay::{CorpseInfo, MAGGOTS_PER_CORPSE, CORPSE_DECAY_TIME_SECONDS};
pub use unlock::UnlockedFeature;
