#!/bin/bash

# 构建Rust WASM项目
echo "Building Rust WASM module..."

# 确保安装了wasm-pack
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    cargo install wasm-pack
fi

# 构建项目（debug模式）
wasm-pack build --target web --out-dir pkg --dev

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "To run the game, serve the idle-game folder with a web server."
    echo "For example: python -m http.server 8000 in the idle-game directory"
else
    echo "Build failed!"
    exit 1
fi