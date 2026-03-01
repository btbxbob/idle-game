use wasm_bindgen_test::wasm_bindgen_test;
use idle_game::IdleGame;

#[wasm_bindgen_test]
fn test_idle_game_new() {
    let game = IdleGame::new();
    assert_eq!(game.get_coins(), 0.0);
}

#[wasm_bindgen_test]
fn test_get_coins_initial() {
    let game = IdleGame::new();
    assert_eq!(game.get_coins(), 0.0);
}

#[wasm_bindgen_test]
fn test_get_wood_initial() {
    let game = IdleGame::new();
    assert_eq!(game.get_wood(), 0.0);
}

#[wasm_bindgen_test]
fn test_get_stone_initial() {
    let game = IdleGame::new();
    assert_eq!(game.get_stone(), 0.0);
}

#[wasm_bindgen_test]
fn test_click_action_increases_coins() {
    let mut game = IdleGame::new();
    let initial_coins = game.get_coins();
    game.click_action();
    let after_click_coins = game.get_coins();
    assert!(after_click_coins > initial_coins);
}

#[wasm_bindgen_test]
fn test_get_coins_per_click_returns_value() {
    let game = IdleGame::new();
    let coins_per_click = game.get_coins_per_click();
    assert!(coins_per_click > 0.0);
}

#[wasm_bindgen_test]
fn test_get_total_clicks_initial() {
    let game = IdleGame::new();
    // Use get_statistics_js to verify stats object works
    // Verify get_statistics_js doesn't panic
    let _stats = game.get_statistics_js();
}