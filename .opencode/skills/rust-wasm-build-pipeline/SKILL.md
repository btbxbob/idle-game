---
name: rust-wasm-build-pipeline
description: Rust to WASM build pipeline for browser games — wasm-pack dev/release builds, version-embedded cache busting, and one-command cross-file version sync (Cargo.toml/package.json/index.html). Use when building the WASM package or bumping the runtime version in this project.
---

# Rust+WASM Build Pipeline Skill

Complete build pipeline for Rust → WASM browser games: compilation, version-based cache busting, and cross-file version sync.

## Quick Start

```bash
# Install prerequisites
cargo install wasm-pack

# Development build
wasm-pack build --target web --out-dir pkg --dev

# Release build (optimized)
wasm-pack build --target web --out-dir pkg --release
```

## Cargo.toml Template

```toml
[package]
name = "my-game"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]  # cdylib for WASM, rlib for cargo test

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
web-sys = { version = "0.3", features = ["Window", "Document", "console"] }

[profile.release]
lto = true
codegen-units = 1

[package.metadata.wasm-pack.profile.release]
wasm-opt = true
```

## Version Sync Automation

When bumping version (e.g. 0.1.0 → 0.1.1), update all sources at once:

### Python Script (`scripts/sync-version.py`)

```python
import sys, json, os

def replace_in_file(path, pattern, replacement):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if pattern not in content:
        print(f"WARN: pattern not found in {path}")
        return
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.replace(pattern, replacement))

new_version = sys.argv[1]
old_version = get_current_version()  # Read from package.json or Cargo.toml

# Cargo.toml: version = "0.1.0"
replace_in_file('Cargo.toml', f'version = "{old_version}"', f'version = "{new_version}"')

# package.json: "version": "0.1.0"
replace_in_file('package.json', f'"version": "{old_version}"', f'"version": "{new_version}"')

# index.html cache busting: ?v=0.1.0 → ?v=0.1.1
replace_in_file('index.html', f'?v={old_version}', f'?v={new_version}')

print(f'Version synced: {old_version} → {new_version}')
```

### Usage
```bash
python scripts/sync-version.py 0.1.1
wasm-pack build --target web --out-dir pkg --dev
```

## Post-Build: Versioned Assets for Cache Busting

After `wasm-pack` generates `pkg/my_game.js` and `pkg/my_game_bg.wasm`, create versioned copies:

```python
# scripts/version-wasm-assets.py
import shutil, json, pathlib

def read_version():
    with open('package.json') as f:
        return json.load(f)['version']

version = read_version()
pkg = pathlib.Path('pkg')

for f in list(pkg.glob('*.js')) + list(pkg.glob('*.wasm')):
    stem = f.stem  # my_game or my_game_bg
    suffix = f.suffix
    versioned_name = f'{stem}.v{version}{suffix}'
    shutil.copy(f, pkg / versioned_name)
    print(f'Created {versioned_name}')
```

## Build Scripts

### `build.bat` (Windows)
```batch
@echo off
where wasm-pack >nul 2>&1 || (
    echo wasm-pack not found. Install with: cargo install wasm-pack
    exit /b 1
)
wasm-pack build --target web --out-dir pkg --dev
python scripts/version-wasm-assets.py
```

### `build.sh` (Linux/macOS)
```bash
#!/bin/bash
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack not found. Install with: cargo install wasm-pack"
    exit 1
fi
wasm-pack build --target web --out-dir pkg --dev
python3 scripts/version-wasm-assets.py
```

## Key Patterns

1. **`crate-type = ["cdylib", "rlib"]`**: `cdylib` for WASM output, `rlib` for `cargo test`
2. **Version embed**: Use `env!("CARGO_PKG_VERSION")` in Rust to embed version at compile time
3. **Cache busting**: Version-parameterized query strings (`?v=0.1.1`) on JS/WASM/CSS links in HTML
4. **Release optimization**: `lto = true` + `wasm-opt = true` for smallest WASM binary
5. **Single-command version bump**: One script updates Cargo.toml, package.json, README, index.html

---

## Pitfalls

- **Version sync must cover `package-lock.json` and every `?v=` string**: validating only `<meta name="app-version">` + the footer misses both, so a stale lockfile (e.g. `0.8.6` while everything else is `0.8.15`) passes lint. `scripts/check-version.js` should regex all `\?v=([0-9]+\.[0-9]+\.[0-9]+)` in `index.html` and read `package-lock.json`'s `version`; `scripts/sync-version.py` must also write the lockfile (top-level `version` and `packages[""].version`).
- **`.gitignore` does not affect already-tracked files**: `target/` and `node_modules/` stay tracked even with ignore rules, and `git check-ignore` returns empty for tracked paths. You must `git rm -r --cached <path>` and commit. (This repo had 582 such files committed: `target/`, `node_modules/`, coverage JSON, screenshots, an accidental `~/` tree.)
- **Release build impact (measured in this repo, 2026-09)**: `wasm-pack build --release` (with `wasm-opt = true`) cut the wasm from 4.42 MB to 1.11 MB (−74.8%) and tick p95 from 0.66 ms to 0.02 ms. Dev-build numbers are not production numbers.
- **`wasm-pack` runs a bundled `wasm-opt` during release builds**, so optimization works even when `wasm-opt` is not on `PATH`; standalone commands like `wasm-opt --metrics` still require installing binaryen yourself.
- **Validate the wasm32 target explicitly**: `cargo check` only checks the native target; run `wasm-pack build --target web --out-dir pkg --dev` to catch wasm-only breakage (e.g. `getrandom`/`rand` config).
