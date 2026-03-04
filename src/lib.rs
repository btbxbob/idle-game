use wasm_bindgen::prelude::*;

pub mod core;
pub mod entities;
pub mod state;
pub mod systems;
#[cfg(test)]
pub mod test_utils;
pub mod ui;
pub mod utils;

pub use core::IdleGame;
pub use entities::{Building, Worker};
pub use state::{GameState, Statistics};
pub use systems::{Achievement, CraftingRecipe, UnlockedFeature};
pub use utils::{Gender, NameGenerator};

#[wasm_bindgen]
pub fn init_game() -> IdleGame {
    IdleGame::new()
}
