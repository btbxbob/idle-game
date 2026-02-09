# 游戏时序图说明

## 时序图概述

`game_sequence_diagram.svg` 文件展示了Rust WASM闲置游戏的完整时序关系，包括以下主要流程：

### 1. 页面加载和初始化
- **DOMContentLoaded**: HTML页面加载完成
- **bootstrap.js加载**: 加载WASM初始化脚本
- **WASM模块加载**: 动态导入并初始化Rust WASM模块
- **游戏实例创建**: 调用`init_game()`创建`IdleGame`实例
- **初始UI更新**: 调用`update_ui()`显示初始的升级和建筑列表

### 2. 游戏主循环
- **定时器启动**: 每100毫秒执行一次`game_loop()`
- **自动收入计算**: `game_loop()`计算并增加硬币
- **UI自动更新**: 每次循环后自动调用`update_ui()`

### 3. 用户交互 - 点击
- **点击事件**: 用户点击中央的圆形区域
- **事件处理**: `game.js`中的点击事件处理器
- **WASM调用**: 调用`rustGame.click_action()`
- **状态更新**: Rust代码增加硬币数量
- **UI更新**: 自动调用`update_ui()`刷新显示

### 4. 用户交互 - 购买升级
- **按钮点击**: 用户点击升级购买按钮
- **事件处理**: `onclick="window.buyUpgrade(index)"`
- **WASM调用**: 调用`rustGame.buy_upgrade(index)`
- **状态验证**: 检查是否有足够硬币
- **购买执行**: 扣除硬币，应用升级效果
- **UI更新**: 自动调用`update_ui()`刷新显示

### 5. 用户交互 - 购买建筑
- **按钮点击**: 用户点击建筑购买按钮  
- **事件处理**: `onclick="window.buyBuilding(index)"`
- **WASM调用**: 调用`rustGame.buy_building(index)`
- **状态验证**: 检查是否有足够硬币
- **购买执行**: 扣除硬币，增加建筑数量
- **生产率更新**: 更新每秒硬币产量
- **UI更新**: 自动调用`update_ui()`刷新显示

## 关键组件说明

### User (用户)
- 触发所有交互事件
- 点击游戏区域、升级按钮、建筑按钮

### HTML/CSS
- 提供UI结构和样式
- 包含所有DOM元素（click-area, upgrade-list, building-list等）

### JavaScript (game.js)
- 定义UI更新函数：`updateResourceDisplay`, `updateUpgradeButtons`, `updateBuildingDisplay`
- 定义购买函数：`buyUpgrade`, `buyBuilding`
- 处理点击事件
- 与Rust WASM模块通信

### JavaScript (bootstrap.js)
- 初始化WASM模块
- 创建游戏实例
- 启动游戏主循环
- 管理全局状态（`window.rustGame`, `window.gameInitialized`）

### Rust WASM
- 核心游戏逻辑实现
- 状态管理（硬币、升级、建筑）
- 业务逻辑（点击、购买、自动收入）
- UI更新触发（`update_ui`函数调用JavaScript）

## 数据流特点

1. **单向数据流**: 用户操作 → JavaScript → Rust WASM → JavaScript → UI更新
2. **自动更新**: 所有状态变更都会触发`update_ui()`，确保UI同步
3. **异步初始化**: WASM模块异步加载，通过`gameInitialized`标志控制UI状态
4. **实时反馈**: 每次操作都有即时的视觉反馈

这个时序图清晰地展示了游戏的架构和数据流向，有助于理解各组件之间的交互关系。