@echo off
echo Building Rust WASM module...

REM 检查是否安装了wasm-pack
where wasm-pack >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing wasm-pack...
    cargo install wasm-pack
)

REM 构建项目
wasm-pack build --target web --out-dir pkg

if %ERRORLEVEL% equ 0 (
    echo Build successful!
    echo To run the game, serve the idle-game folder with a web server.
    echo For example: python -m http.server 8000 in the idle-game directory
) else (
    echo Build failed!
    exit /b 1
)