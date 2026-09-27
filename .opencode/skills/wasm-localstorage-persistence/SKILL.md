---
name: wasm-localstorage-persistence
description: Rust + WASM save/load/export/import via localStorage + BASE64, with matching Rust and JS sides. Use when persisting, loading, exporting, or migrating game saves in this project.
---

# WASM localStorage Persistence Skill

Rust+WASM save/load/export/import pattern using localStorage + BASE64.
Both Rust and JS sides included.

## Quick Start

### Cargo.toml Dependencies
```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
base64 = "0.22"
wasm-bindgen = "0.2"
web-sys = { version = "0.3", features = ["Storage", "Window"] }
```

### Rust Side: Save/Load

```rust
use wasm_bindgen::prelude::*;
use web_sys::window;

const SAVE_KEY: &str = "my_game_save";

#[derive(Serialize, Deserialize)]
struct SaveData {
    coins: f64,
    level: u32,
    version: String,
}

#[wasm_bindgen]
pub fn save_to_local_storage(&self) -> Result<(), JsValue> {
    let save = SaveData {
        coins: self.state.borrow().coins,
        level: self.state.borrow().level,
        version: env!("CARGO_PKG_VERSION").to_string(),
    };
    let json = serde_json::to_string(&save)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let storage = window().unwrap().local_storage().unwrap().unwrap();
    storage.set_item(SAVE_KEY, &json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(())
}

#[wasm_bindgen]
pub fn load_from_local_storage(&mut self) -> Result<bool, JsValue> {
    let storage = window().unwrap().local_storage().unwrap().unwrap();
    let json = match storage.get_item(SAVE_KEY).map_err(|e| JsValue::from_str(&e.to_string()))? {
        Some(data) => data,
        None => return Ok(false),
    };
    let save: SaveData = serde_json::from_str(&json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    self.apply_save(save);
    Ok(true)
}
```

### Rust Side: BASE64 Export/Import

```rust
use base64::Engine;

#[wasm_bindgen]
pub fn export_to_base64(&self) -> Result<String, JsValue> {
    let save = SaveData { /* ... */ };
    let json = serde_json::to_string(&save)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(base64::engine::general_purpose::STANDARD.encode(json))
}

#[wasm_bindgen]
pub fn import_from_base64(&mut self, data: &str) -> Result<(), JsValue> {
    let json_bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let json = String::from_utf8(json_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let save: SaveData = serde_json::from_str(&json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    self.apply_save(save);
    Ok(())
}
```

### JS Side: Auto-Save Loop

```js
// In bootstrap.js, after WASM init:
setInterval(() => {
    if (game && typeof game.saveToLocalStorage === 'function') {
        try {
            game.saveToLocalStorage();
        } catch (e) {
            console.error('Auto-save failed:', e);
        }
    }
}, 15000);

// On page load, check for existing save before starting fresh:
const hadSave = !!localStorage.getItem('my_game_save');
const loaded = game.loadFromLocalStorage();
if (hadSave && isFreshState(game)) {
    alert('Save reset due to version update. Starting new game.');
}
```

### JS Side: Manual Import/Export

```js
// Export: copy BASE64 to clipboard
async function exportSave() {
    const b64 = await game.exportToBase64();
    await navigator.clipboard.writeText(b64);
    console.log('Save copied to clipboard');
}

// Import: confirm before overwriting
function importSave(b64Data) {
    if (!confirm('Overwrite current save?')) return;
    try {
        game.importFromBase64(b64Data);
    } catch (e) {
        alert('Import failed: ' + e);
    }
}
```

## Key Patterns

1. **Version tracking**: Embed `env!("CARGO_PKG_VERSION")` in save data to detect incompatible saves
2. **Error-safe localStorage**: Always try-catch Web Storage API calls
3. **BASE64 export**: Standard portable save sharing between players/devices
4. **Auto-save interval**: 15-30 seconds is typical; gate behind `window.gameInitialized`
5. **Version reset detection**: If save existed before load but all resources are 0, it was a version migration
