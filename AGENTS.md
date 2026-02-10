# Idle Game Project Knowledge Base

## Overview
Rust + WebAssembly idle game with JavaScript frontend. Core game logic in Rust, compiled to WASM, with JS/HTML/CSS frontend.

## Build Commands

### Development Build
```bash
# Windows
.\build.bat

# Linux/macOS  
./build.sh

# Direct wasm-pack command
wasm-pack build --target web --out-dir pkg --dev
```

### Production Build
```bash
wasm-pack build --target web --out-dir pkg --release
```

### Run Development Server
```bash
python server.py  # Serves on http://localhost:8080
# Or use Python's built-in server
python -m http.server 8080
```

## Test Commands

### Run Rust Tests
```bash
cargo test
```

Note: Tests are located in `src/lib.rs` under `#[cfg(test)]` modules. There are currently 5 test functions covering:
- Initial state validation
- Click action functionality  
- Upgrade purchase logic
- Building purchase logic
- Production calculation

### Manual Testing
Since this is a browser-based game, manual testing involves:
1. Build the project
2. Start the development server
3. Open http://localhost:8080 in browser
4. Test click functionality and purchase mechanics

## Code Style Guidelines

### Rust Code Style
- **Formatting**: Use standard Rust formatting (`rustfmt`)
- **Naming**: 
  - Variables/functions: `snake_case`
  - Types/structs: `PascalCase`
  - Constants: `SCREAMING_SNAKE_CASE`
- **Error Handling**: Use proper Result types where applicable
- **Memory Management**: Leverage Rust's ownership system; avoid unnecessary clones
- **WASM Specifics**: 
  - Use `wasm-bindgen` for JS interop
  - Use `RefCell`/`Rc` for shared mutable state (as seen in current code)
  - Handle JS exceptions properly with `Result` types

### JavaScript Code Style
- **Formatting**: Standard JavaScript formatting (no specific linter configured)
- **Naming**: 
  - Variables/functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE` or `camelCase`
- **Global State**: Minimize global variables; current code uses `window` object for WASM integration
- **Event Handling**: Use modern event listeners rather than inline handlers when possible
- **Error Handling**: Check for existence of WASM functions before calling them
- **Internationalization**: Use the `i18n.js` system for all translatable text

### HTML/CSS Style
- **HTML**: Semantic structure, proper accessibility attributes
- **CSS**: 
  - Mobile-first responsive design
  - Consistent color palette using CSS variables would be beneficial
  - Current styling uses direct color values (#2c3e50, #f1c40f, etc.)

## Project Structure
```
idle-game/
├── src/              # Rust source code
│   └── lib.rs        # Main game logic with WASM bindings
├── js/               # JavaScript frontend
│   ├── i18n.js       # Internationalization system (zh-CN, en)
│   ├── game.js       # UI update functions and event handlers
│   └── bootstrap.js  # WASM module loading and initialization
├── css/              # Stylesheets
│   └── style.css     # Main stylesheet
├── assets/           # Game assets (images, sounds, etc.)
├── pkg/              # Generated WASM output (git ignored)
├── target/           # Rust build artifacts (git ignored)
├── build.bat         # Windows build script
├── build.sh          # Unix build script
├── server.py         # Development HTTP server
└── index.html        # Main HTML entry point
```

## Key Conventions

### WASM Integration
- Rust functions exposed via `#[wasm_bindgen]`
- JavaScript calls Rust functions through `window.rustGame` object
- UI updates from Rust call back to JavaScript via `window.updateResourceDisplay`, `window.updateUpgradeButtons`, etc.
- Game state managed in Rust, UI state synchronized via callbacks

### Internationalization (i18n)
- **Primary language**: Simplified Chinese (zh-CN)
- **Secondary language**: English (en)
- **Translation keys**: Use descriptive keys like 'gameTitle', 'clickToEarn', 'coins', etc.
- **Dynamic text**: All user-facing text should use the i18n system
- **Language selector**: Available in the header for user switching
- **Adding new languages**: Add new translation objects to `i18n.js`
- Single source of truth in Rust `GameState`
- JavaScript maintains minimal state (mainly DOM references)
- All game logic happens in Rust, JavaScript handles presentation only

### Event Flow
1. User clicks UI element
2. JavaScript handler calls appropriate Rust function
3. Rust processes logic and updates internal state
4. Rust calls JavaScript UI update functions
5. JavaScript updates DOM to reflect new state

## Anti-Patterns to Avoid

### Rust
- Don't use `unwrap()` or `expect()` in production code
- Avoid excessive `RefCell` borrowing that could panic
- Don't expose internal state directly to JavaScript
- Avoid blocking operations in WASM (keep game loop lightweight)

### JavaScript  
- Don't modify game state directly in JavaScript
- Avoid inline event handlers (use event delegation instead)
- Don't assume WASM module is always available (check `window.rustGame`)
- Avoid global variables beyond the necessary integration points

### General
- Don't mix business logic between Rust and JavaScript
- Avoid hardcoding values that should be configurable
- Don't duplicate game state between Rust and JavaScript

## Development Tips

### Debugging WASM
- Use `console.log` in Rust via `web_sys::console::log_1`
- Enable debug builds with `--dev` flag for better error messages
- Use browser developer tools to inspect WASM module loading

### Performance Considerations
- Minimize frequency of UI updates from Rust
- Batch DOM updates when possible
- Consider debouncing rapid click events
- Optimize game loop interval (currently 100ms)

### Extending the Game
- Add new game mechanics in Rust `lib.rs`
- Update UI templates in JavaScript functions
- Add new styles to `style.css`
- Update build scripts if new dependencies are added
- Add new translations to `i18n.js` for any new text

## Dependencies

### Rust Dependencies
- `wasm-bindgen`: WASM-JS interop
- `web-sys`: Web API bindings
- `js-sys`: JavaScript standard library bindings  
- `serde`: Serialization/deserialization
- `serde-wasm-bindgen`: Serde integration with WASM

### System Dependencies
- Rust toolchain (stable)
- `wasm-pack` (installed automatically by build scripts)
- Python 3 (for development server)