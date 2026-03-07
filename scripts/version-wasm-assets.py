#!/usr/bin/env python3

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import cast


ROOT = Path(__file__).resolve().parent.parent
PKG_DIR = ROOT / "pkg"
PKG_JSON = PKG_DIR / "package.json"
ROOT_PACKAGE_JSON = ROOT / "package.json"
CARGO_TOML = ROOT / "Cargo.toml"
WRAPPER_JS = PKG_DIR / "idle_game.js"
WASM_FILE = PKG_DIR / "idle_game_bg.wasm"


def read_json_dict(path: Path) -> dict[str, object]:
    raw_data = cast(object, json.loads(path.read_text(encoding="utf-8")))
    if not isinstance(raw_data, dict):
        raise SystemExit(f"expected JSON object in {path}")
    return cast(dict[str, object], raw_data)


def load_version() -> str:
    if ROOT_PACKAGE_JSON.exists():
        data = read_json_dict(ROOT_PACKAGE_JSON)
        version = data.get("version")
        if isinstance(version, str) and version:
            return version

    if CARGO_TOML.exists():
        for line in CARGO_TOML.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if stripped.startswith("version = "):
                return stripped.split("=", 1)[1].strip().strip('"')

    if PKG_JSON.exists():
        data = read_json_dict(PKG_JSON)
        version = data.get("version")
        if isinstance(version, str) and version:
            return version

    raise SystemExit("unable to determine project version")


def sync_pkg_metadata(version: str) -> None:
    if not PKG_JSON.exists():
        return

    data = read_json_dict(PKG_JSON)
    data["version"] = version
    _ = PKG_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def clean_old_versioned_assets() -> None:
    for path in PKG_DIR.glob("idle_game.v*.js"):
        _ = path.unlink()
    for path in PKG_DIR.glob("idle_game_bg.v*.wasm"):
        _ = path.unlink()


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
    _ = versioned_wrapper.write_text(updated_text, encoding="utf-8")


def copy_versioned_wasm(version: str) -> None:
    target = PKG_DIR / f"idle_game_bg.v{version}.wasm"
    _ = target.write_bytes(WASM_FILE.read_bytes())


def main() -> None:
    version = load_version()
    sync_pkg_metadata(version)
    clean_old_versioned_assets()
    build_versioned_wrapper(version)
    copy_versioned_wasm(version)
    print(f"Versioned WASM assets created for v{version}")


if __name__ == "__main__":
    main()
