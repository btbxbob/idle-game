use wasm_bindgen::prelude::*;

pub mod core;
pub mod entities;
pub mod state;
pub mod systems;
pub mod ui;
#[cfg(test)]
pub mod test_utils;

pub use core::IdleGame;
pub use entities::{Building, Upgrade, Worker};
pub use state::{GameState, Statistics};
pub use systems::{Achievement, CraftingRecipe, UnlockedFeature};

#[wasm_bindgen]
pub fn init_game() -> IdleGame {
    IdleGame::new()
}
