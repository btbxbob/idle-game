#!/usr/bin/env python3
"""Sync version across all project files.

Usage:
    python scripts/sync-version.py [NEW_VERSION]

If NEW_VERSION is omitted, reads current version from Cargo.toml and
syncs all other files to match.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import cast


ROOT = Path(__file__).resolve().parent.parent
CARGO_TOML = ROOT / "Cargo.toml"
PACKAGE_JSON = ROOT / "package.json"
PACKAGE_LOCK = ROOT / "package-lock.json"
README_MD = ROOT / "README.md"
INDEX_HTML = ROOT / "index.html"


def read_cargo_version() -> str:
    for line in CARGO_TOML.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped.startswith("version = "):
            return stripped.split("=", 1)[1].strip().strip('"')
    raise SystemExit("cannot find version in Cargo.toml")


def write_cargo_version(version: str) -> None:
    content = CARGO_TOML.read_text(encoding="utf-8")
    updated = re.sub(
        r'(^version\s*=\s*")[^"]+(")',
        rf"\g<1>{version}\2",
        content,
        count=1,
        flags=re.MULTILINE,
    )
    CARGO_TOML.write_text(updated, encoding="utf-8")


def write_package_json_version(version: str) -> None:
    data = cast(dict, json.loads(PACKAGE_JSON.read_text(encoding="utf-8")))
    data["version"] = version
    PACKAGE_JSON.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def write_package_lock_version(version: str) -> None:
    data = cast(dict, json.loads(PACKAGE_LOCK.read_text(encoding="utf-8")))
    data["version"] = version
    packages = data.get("packages")
    if isinstance(packages, dict) and "" in packages:
        packages[""]["version"] = version
    PACKAGE_LOCK.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def write_readme_version(version: str) -> None:
    content = README_MD.read_text(encoding="utf-8")
    updated = re.sub(
        r"(当前版本:\s*\*\*v)[^*]+(\*\*)",
        rf"\g<1>{version}\2",
        content,
    )
    README_MD.write_text(updated, encoding="utf-8")


def write_index_html_version(version: str) -> None:
    content = INDEX_HTML.read_text(encoding="utf-8")
    updated = content
    updated = re.sub(
        r'(<meta\s+name="app-version"\s+content=")[^"]+(")',
        rf"\g<1>{version}\2",
        updated,
    )
    updated = re.sub(
        r"(href=\"css/[^\"]+\?v=)[^\"]+(\")",
        rf"\g<1>{version}\2",
        updated,
    )
    updated = re.sub(
        r"(src=\"js/[^\"]+\?v=)[^\"]+(\")",
        rf"\g<1>{version}\2",
        updated,
    )
    updated = re.sub(
        r"(游戏版本：v)[^<]+(<)",
        rf"\g<1>{version}\2",
        updated,
    )
    INDEX_HTML.write_text(updated, encoding="utf-8")


def main() -> None:
    if len(sys.argv) > 1:
        version = sys.argv[1].lstrip("v")
    else:
        version = read_cargo_version()

    if not re.match(r"^\d+\.\d+\.\d+$", version):
        raise SystemExit(f"invalid version format: {version}")

    write_cargo_version(version)
    write_package_json_version(version)
    write_package_lock_version(version)
    write_readme_version(version)
    write_index_html_version(version)

    print(f"All version sources synced to v{version}")
    print("Remember to rebuild WASM: wasm-pack build --target web --out-dir pkg --dev")


if __name__ == "__main__":
    main()
