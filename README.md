# Rust WASM Idle Game Framework

这是一个使用 Rust 和 WebAssembly 构建的闲置游戏（idle game）基础框架。该框架提供了核心的游戏机制，您可以在此基础上扩展自己的游戏内容。

## 特性

- 基于 Rust 和 WebAssembly 的高性能游戏引擎
- 自动资源生成系统
- 点击获取资源机制
- 升级系统
- 建筑系统
- 响应式 UI 设计

## 依赖项

在构建项目之前，请确保已安装以下依赖项：

- [Rust](https://www.rust-lang.org/tools/install)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

## 构建说明

### Windows

```cmd
# 在项目根目录下运行
.\build.bat
```

### Linux/macOS

```bash
# 在项目根目录下运行
./build.sh
```

## 运行游戏

构建成功后，使用内置的 Python 服务器运行游戏：

```bash
python server.py
```

然后在浏览器中打开 `http://localhost:8000` 来玩游戏。

## 项目结构

- `src/lib.rs`: Rust 游戏逻辑的主要源文件
- `index.html`: 游戏的主 HTML 文件
- `css/style.css`: 样式表文件
- `js/`: JavaScript 文件目录
- `assets/`: 游戏资源目录
- `pkg/`: 构建时生成的 WASM 文件目录

## 扩展游戏

要扩展游戏功能，您可以修改以下部分：

1. 在 `src/lib.rs` 中添加新的游戏对象或机制
2. 在 `index.html` 中添加 UI 元素
3. 在 `css/style.css` 中更新样式
4. 在 `js/` 文件中处理新的交互逻辑

## 游戏组件

### GameState
存储游戏的全局状态，包括：
- `coins`: 当前硬币数量
- `coins_per_click`: 每次点击获得的硬币数
- `coins_per_second`: 每秒自动产生的硬币数
- `total_clicks`: 总点击次数

### Upgrade
定义游戏中的升级项：
- `name`: 升级名称
- `cost`: 升级成本
- `production_increase`: 生产力提升值
- `owned`: 拥有数量
- `unlocked`: 是否解锁

### Building
定义游戏中的建筑物：
- `name`: 建筑名称
- `cost`: 建筑成本
- `production_rate`: 每秒生产率
- `count`: 拥有数量

## API 方法

Rust WASM 模块导出以下方法：

- `click_action()`: 处理点击事件
- `buy_upgrade(index)`: 购买指定索引的升级
- `buy_building(index)`: 购买指定索引的建筑
- `get_coins()`: 获取当前硬币数
- `get_coins_per_second()`: 获取每秒硬币产量
- `get_coins_per_click()`: 获取每次点击硬币数
- `game_loop()`: 游戏主循环，处理自动收入