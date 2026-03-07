#!/usr/bin/env python3

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PKG_DIR = ROOT / "pkg"
PKG_JSON = PKG_DIR / "package.json"
WRAPPER_JS = PKG_DIR / "idle_game.js"
WASM_FILE = PKG_DIR / "idle_game_bg.wasm"


def load_version() -> str:
    data = json.loads(PKG_JSON.read_text(encoding="utf-8"))
    version = data.get("version")
    if not isinstance(version, str) or not version:
        raise SystemExit("pkg/package.json is missing a valid version")
    return version


def clean_old_versioned_assets() -> None:
    for path in PKG_DIR.glob("idle_game.v*.js"):
        path.unlink()
    for path in PKG_DIR.glob("idle_game_bg.v*.wasm"):
        path.unlink()


def build_versioned_wrapper(version: str) -> None:
    wrapper_text = WRAPPER_JS.read_text(encoding="utf-8")
    versioned_wasm_name = f"idle_game_bg.v{version}.wasm"
    updated_text = re.sub(
        r"new URL\('idle_game_bg\.wasm', import\.meta\.url\)",
        f"new URL('{versioned_wasm_name}', import.meta.url)",
        wrapper_text,
        count=1,
    )

    if updated_text == wrapper_text:
        raise SystemExit("failed to rewrite wasm path in pkg/idle_game.js")

    versioned_wrapper = PKG_DIR / f"idle_game.v{version}.js"
    versioned_wrapper.write_text(updated_text, encoding="utf-8")


def copy_versioned_wasm(version: str) -> None:
    target = PKG_DIR / f"idle_game_bg.v{version}.wasm"
    target.write_bytes(WASM_FILE.read_bytes())


def main() -> None:
    version = load_version()
    clean_old_versioned_assets()
    build_versioned_wrapper(version)
    copy_versioned_wasm(version)
    print(f"Versioned WASM assets created for v{version}")


if __name__ == "__main__":
    main()
