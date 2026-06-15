use wasm_bindgen::prelude::*;

pub mod config;
pub mod core;
pub mod entities;
pub mod state;
pub mod systems;
pub mod world;
#[cfg(test)]
pub mod test_utils;
pub mod ui;
pub mod utils;

pub use config::{BalanceConfig, ContentManager};
pub use core::IdleGame;
pub use entities::{Building, Worker};
pub use state::{GameState, Statistics};
pub use systems::{Achievement, UnlockedFeature};
pub use utils::{Gender, NameGenerator};
pub use world::World;

#[wasm_bindgen]
pub fn init_game() -> World {
    World::new().expect("Failed to initialize game world")
}

#[wasm_bindgen]
pub fn init_game_legacy() -> IdleGame {
    IdleGame::new()
}
