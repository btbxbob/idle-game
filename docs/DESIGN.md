# Idle Game 设计文档

## 1. 概述

### 1.1 项目目标
Rust + WebAssembly 闲置游戏，具有以下核心特性：
- **多资源系统**：金币、木头、石头三种资源
- **点击收益**：手动点击获得金币
- **自动生产**：建筑和升级提供自动资源生产
- **多语言支持**：简体中文（主语言）和英语
- **跨浏览器兼容**：支持 Chromium、Firefox、Webkit

### 1.2 技术架构
- **后端逻辑**：Rust WASM（高性能计算）
- **前端界面**：JavaScript + HTML + CSS（响应式UI）
- **数据流**：单向数据流，Rust 为唯一数据源

## 2. 核心数据结构

### 2.1 GameState（游戏状态）
```rust
struct GameState {
    coins: f64,                 // 金币数量
    wood: f64,                  // 木头数量  
    stone: f64,                 // 石头数量
    coins_per_click: f64,       // 每次点击获得的金币
    coins_per_second: f64,      // 每秒金币产量
    wood_per_second: f64,       // 每秒木头产量
    stone_per_second: f64,      // 每秒石头产量
    total_clicks: u32,          // 总点击次数
    last_update_time: f64,      // 最后更新时间戳
}
```

### 2.2 Upgrade（升级系统）
```rust
struct Upgrade {
    name: String,               // 升级名称
    cost: f64,                  // 购买成本
    production_increase: f64,   // 生产力提升值
    owned: u32,                 // 已拥有数量
    unlocked: bool,             // 是否已解锁
}
```

**当前升级列表**：
- `Better Click`：提升每次点击收益 (+1.0)
- `Lumberjack Efficiency`：提升木头自动产量 (+0.2/sec)
- `Stone Mason Skill`：提升石头自动产量 (+0.3/sec)

### 2.3 Building（建筑系统）
```rust
struct Building {
    name: String,               // 建筑名称
    cost: f64,                  // 购买成本
    production_rate: f64,       // 每个建筑的生产率
    count: u32,                 // 拥有数量
}
```

**当前建筑列表**：

**金币生产**：
- `Coin Mine`：0.1 coins/sec，成本 15
- `Coin Factory`：1.0 coins/sec，成本 100  
- `Coin Corporation`：5.0 coins/sec，成本 500

**木头生产**：
- `Woodcutter`：0.2 wood/sec，成本 20
- `Lumber Mill`：1.5 wood/sec，成本 80
- `Forest Workshop`：4.0 wood/sec，成本 400

**石头生产**：
- `Stone Quarry`：0.15 stone/sec，成本 25
- `Rock Crusher`：1.2 stone/sec，成本 90
- `Mason Workshop`：4.5 stone/sec，成本 450

### 2.4 Worker（工人系统 - 预留）
```rust
struct Worker {
    name: String,                       // 工人姓名
    skills: String,                     // 技能（预留字段）
    background: String,                 // 背景（预留字段）
    preferences: String,                // 喜好（预留字段）
    assigned_building: Option<String>,   // 分配的建筑
    level: u32,                         // 等级
}
```

## 3. 核心功能流程

### 3.1 点击流程
1. 用户点击中间区域
2. JavaScript 调用 `window.rustGame.click_action()`
3. Rust 更新 `coins += coins_per_click`
4. Rust 调用 `update_resources_only()` 更新UI
5. JavaScript 更新所有资源显示

### 3.2 购买流程
1. 用户点击购买按钮
2. JavaScript 调用 `buy_upgrade(index)` 或 `buy_building(index)`
3. Rust 检查余额是否足够
4. **成功**：扣除资源，更新拥有数量，调用UI更新
5. **失败**：调用UI更新显示当前余额，提供视觉反馈

### 3.3 自动生产流程
1. 游戏循环每100ms执行一次
2. Rust 计算经过时间：`elapsed = (now - last_update_time) / 1000.0`
3. 更新各资源：`resource += resource_per_second * elapsed`
4. Rust 调用 `update_resources_only()` 更新UI

### 3.4 UI更新策略
- **增量更新**：避免不必要的DOM重绘
- **资源更新**：只更新资源数值，不重绘按钮
- **按钮更新**：只在购买成功时更新相关按钮
- **多语言支持**：所有文本通过i18n系统处理

## 4. 国际化系统

### 4.1 支持语言
- **zh-CN**：简体中文（默认）
- **en**：英语

### 4.2 翻译键规范
- 使用描述性键名：`gameTitle`, `clickToEarn`, `coins`, etc.
- 动态参数使用模板：`{resource}: {amount}`
- 所有用户界面文本必须通过i18n系统

### 4.3 语言切换
- 顶部语言选择器
- 实时切换，无需页面刷新
- 自动更新HTML lang属性

## 5. 性能优化

### 5.1 WASM优化
- 使用 `RefCell`/`Rc` 管理共享状态
- 避免不必要的内存分配
- 浮点数精度处理（epsilon比较）

### 5.2 UI优化
- 增量DOM更新
- 避免全量重绘
- 批量操作最小化

### 5.3 游戏循环
- 100ms间隔平衡性能和体验
- 时间差计算确保准确的资源生成

## 6. 错误处理和健壮性

### 6.1 购买失败处理
- 提供视觉反馈（按钮闪烁动画）
- 显示当前余额
- 不阻塞后续操作

### 6.2 WASM安全
- 所有函数返回Result类型
- 避免panic，使用proper error handling
- RefCell借用安全检查

### 6.3 JavaScript容错
- 检查WASM函数是否存在
- 字段名兼容性处理（snake_case vs camelCase）
- 回退机制确保基本功能

## 7. 扩展性设计

### 7.1 新资源添加
1. 在 `GameState` 中添加新资源字段
2. 在 `update_production` 中添加生产逻辑
3. 在UI更新函数中添加显示逻辑
4. 在i18n中添加翻译

### 7.2 新建筑/升级添加
1. 在初始化中添加新项目
2. 在 `update_production` 中添加效果逻辑
3. 确保成本和生产率平衡

### 7.3 工人系统扩展
- 当前为预留字段
- 可用于：建筑效率提升、特殊能力、任务分配等

## 8. 测试策略

### 8.1 Rust单元测试
- 初始状态验证
- 点击功能测试
- 购买逻辑验证
- 生产计算准确性

### 8.2 Playwright端到端测试
- 跨浏览器兼容性
- UI显示正确性
- 功能流程验证
- 边界条件测试

### 8.3 手动测试
- 用户体验验证
- 性能测试
- 视觉反馈测试

## 9. 版本历史

### v0.1.0 - 基础功能完成
- 单一金币系统
- 基础建筑和升级
- Playwright测试框架

### v0.2.0 - 多资源系统
- 添加木头、石头资源
- 相应的建筑和升级
- 工人系统框架

### v0.2.1 - 多语言支持
- 简体中文作为主语言
- 国际化系统实现
- 语言切换功能

### v0.2.2 - 问题修复
- 修复中间数字显示问题
- 修复undefined显示问题
- 修复字段名序列化问题

### v0.5.0 - 自动点击器移除
- 移除 Autoclicker 升级及其相关状态字段
- 游戏循环仅保留建筑/升级提供的资源自动生产
- 相关测试与文档同步更新

## 9.1 科技系统设计

### 9.1.1 概述
科技系统是游戏的核心进度系统之一，玩家通过研究科技获得各种加成和能力。科技树分为4个层级，共50种科技。

### 9.1.2 科技分类

**Tier 1: 基础技术 (15种)**
- 基础/高级采矿 (BasicMining, AdvancedMining)
- 基础/高级伐木 (BasicLogging, AdvancedLogging)
- 基础/高级采石 (BasicQuarrying, AdvancedQuarrying)
- 基础/高级冶炼 (BasicSmelting, AdvancedSmelting)
- 基础/高级农业 (BasicAgriculture, AdvancedAgriculture)
- 基础/高级精炼 (BasicRefining, AdvancedRefining)
- 基础/高级化学 (BasicChemistry, AdvancedChemistry)
- 基础工程 (BasicEngineering)

**Tier 2: 工业技术 (15种)**
- 大规模生产 (MassProduction)
- 自动化 (Automation)
- 机器人技术 (Robotics, AdvancedRobotics)
- 电子技术 (Electronics, AdvancedElectronics)
- 计算机技术 (ComputerTechnology)
- 人工智能 (AITechnology, AdvancedAI)
- 纳米技术 (Nanotechnology, AdvancedNanotech)
- 生物技术 (Biotechnology)
- 基因工程 (GeneticEngineering)
- 可再生能源 (RenewableEnergy)
- 核能 (NuclearEnergy)

**Tier 3: 先进技术 (10种)**
- 量子计算 (QuantumComputing)
- 聚变能源 (FusionEnergy)
- 反物质能源 (AntimatterEnergy)
- 太空探索 (SpaceExploration)
- 地球化改造 (Terraforming)
- 时间操控 (TimeManipulation)
- 维度旅行 (DimensionalTravel)
- 意识上传 (ConsciousnessUpload)
- 永生技术 (Immortality)
- 神级技术 (Godhood)

**Tier 4: 特殊/UI技术 (10种)**
- 点击效率 (ClickEfficiency)
- 资源增益 (ResourceBoost)
- 生产倍增 (ProductionMultiplier)
- 成本降低 (CostReduction)
- 暴击点击 (CriticalClick)
- 自动分配 (AutoAssignment)
- 转世 (Prestige)
- 遗产 (Legacy)
- 飞升 (Ascension)
- 全知 (Omniscience)

### 9.1.3 科技效果类型

科技效果通过 `TechnologyEffect` 枚举定义：

```rust
pub enum TechnologyEffect {
    /// 生产加成：针对特定资源的产量加成 (如 +50% Gold)
    ProductionBonus(ResourceType, f64),
    /// 建筑解锁：解锁特定建筑类型
    UnlockBuilding(BuildingType),
    /// UI解锁：解锁新的UI面板或功能
    UnlockUI,
    /// 机制变更：描述游戏机制变化 (字符串)
    MechanicChange(String),
}
```

### 9.1.4 科技加成系统

`TechnologyBonuses` 结构体汇总所有已购买科技的效果：

```rust
pub struct TechnologyBonuses {
    /// 各类资源的生产加成倍率 (1.0 = 无加成)
    pub production_bonus: HashMap<ResourceType, f64>,
    /// 点击效率加成倍率 (1.0 = 无加成)
    pub click_bonus: f64,
    /// 成本降低倍率 (1.0 = 无降低, 0.9 = 9折)
    pub cost_reduction: f64,
    /// 全局生产倍率 (1.0 = 无加成)
    pub production_multiplier: f64,
    /// 暴击点击概率 (0.0 = 无, 1.0 = 100%)
    pub critical_click_chance: f64,
    /// 暴击点击倍率
    pub critical_click_multiplier: f64,
    /// 已解锁建筑类型
    pub unlocked_buildings: HashSet<BuildingType>,
    /// 已启用的游戏机制
    pub enabled_mechanics: HashSet<String>,
}
```

### 9.1.5 科技效果应用

科技加成在生产系统中自动应用。游戏主循环会计算科技加成，并将其传递给生产系统：

```rust
// idle_game.rs - game_loop
let tech_bonuses = self.technology_tree.calculate_bonuses();
let production = production::update_production(
    &self.buildings, 
    &self.upgrades, 
    &self.workers, 
    &tech_bonuses
);
```

### 9.1.6 数据结构

**TechnologyId** - 科技唯一标识符 (50个枚举变体)

**Technology** - 科技定义
```rust
pub struct Technology {
    pub id: TechnologyId,
    pub name: String,           // 中文名称
    pub description: String,   // 科技描述
    pub costs: HashMap<ResourceType, f64>,  // 购买成本
    pub dependencies: Vec<TechnologyId>,     // 前置科技
    pub effect: TechnologyEffect,
    pub effect_value: f64,     // 效果数值
    pub purchased: bool,        // 是否已购买
}
```

**TechnologyTree** - 科技树管理系统
```rust
pub struct TechnologyTree {
    pub technologies: HashMap<TechnologyId, Technology>,
    pub unlocked: HashSet<TechnologyId>,
}
```

### 9.1.7 建筑类型

可解锁的建筑类型 (BuildingType 枚举)：
- 矿井 (Mine)
- 锯木厂 (LumberMill)
- 采石场 (Quarry)
- 石油钻井 (OilRig)
- 农场 (Farm)
- 冶炼厂 (Smelter)
- 精炼厂 (Refinery)
- 工厂 (Factory)
- 化工厂 (ChemicalPlant)
- 发电厂 (PowerPlant)
- 芯片工厂 (ChipFab)
- 研究实验室 (ResearchLab)
- 太空港 (SpacePort)
- 量子实验室 (QuantumLab)
- 纳米工厂 (NaniteFactory)

## 10. 未来规划

### 10.1 短期计划
- 完善工人系统
- 添加更多升级和建筑
- 实现离线收益计算
- 添加成就系统

### 10.2 中期计划
- 保存/加载功能
- 更复杂的经济平衡
- 社交功能（排行榜等）
- 移动端优化

### 10.3 长期计划
- Mod支持
- 多玩家互动
- 更丰富的游戏内容
- 性能进一步优化

## 11. 开发规范

### 11.1 代码风格
- Rust：标准rustfmt格式
- JavaScript：标准格式，无特定linter
- HTML/CSS：语义化结构，移动优先

### 11.2 提交规范
- 详细描述变更内容
- 包含测试验证
- 遵循现有模式

### 11.3 文档维护
- 设计文档与代码同步更新
- AGENTS.md保持最新
- 新功能必须有相应文档

---

**最后更新**: 2026-03-02  
**版本**: v0.5.4  
**状态**: 稳定可用
