# Idle Game 设计文档

## 1. 概述

### 1.1 项目目标
Rust + WebAssembly 闲置游戏，具有以下核心特性：
- **多资源系统**：金币、木头、石头三种资源
- **点击收益**：手动点击获得金币
- **自动生产**：建筑提供自动资源生产
- **多语言支持**：简体中文（主语言）和英语
- **跨浏览器兼容**：支持 Chromium、Firefox、Webkit

### 1.2 技术架构
- **后端逻辑**：Rust WASM（高性能计算）
- **前端界面**：JavaScript + HTML + CSS（响应式UI）
- **数据流**：单向数据流，Rust 为唯一数据源

## 1.3 当前版本的设计目标（阶段化重构）

当前设计以“明确阶段 + 解锁衔接 + 隐藏发现”为主轴，后续代码改动必须围绕这一目标实现，而不是继续扩展平铺式内容。

### 1.3.1 五个核心阶段

| 阶段 | 玩家感受 | 核心玩法 | 代表内容 |
|------|----------|----------|----------|
| 阶段 1：初始阶段 | 只有点击和基础建筑 | 手动点击、购买最初几座建筑、建立食物前的原始经济 | 金币、木头、石头、基础建筑 |
| 阶段 2：工人阶段 | 资源开始依赖人口与供养 | 住房、工人分配、食物维持、效率提升 | 工人、住房、农场、基础工业科技 |
| 阶段 3：隐藏蛆虫阶段 | 死亡与腐化成为新的生产线 | 尸体衰变、蛆虫资源、黑暗生物科技分支 | 尸体、蛆虫、腐化建筑、隐藏科技 |
| 阶段 4：蛆虫人阶段 | 人类与蛆虫体系被迫共存 | 混合人口、共生稳定度、阵营拉扯、风险与收益并存 | 蛆虫人、共生建筑、宿主科技 |
| 阶段 5：集体意识阶段 | 生物科技与宇宙探索融合 | 集体意识、黑暗高科技、深空扩张、终局资源网络 | 暗物质、纳米机器、太空建筑、意识科技 |

### 1.3.2 阶段衔接原则

1. 每个阶段都必须通过解锁系统衔接，而不是直接在一开始全部展示。
2. 阶段推进由 Rust 侧统一判断，前端只展示“已揭示”的结果。
3. 旧资源、旧建筑、旧科技必须重新分布到各阶段，不允许继续无差别铺开。
4. 新增的黑暗科幻内容必须优先落在阶段 3-5，而不是挤占前期节奏。

### 1.3.3 隐藏内容展示规则

这是本轮重构的硬性要求：

1. **未解锁内容不得展示。**
2. **未揭示内容不得展示名字。**
3. **解锁列表本身也不能泄露未来内容。**
4. 某些阶段可以先“揭示存在”，再显示具体名称；在揭示前只能完全不出现，不能出现问号卡片、占位名或灰色条目。

| 内容类型 | 未揭示时 | 已揭示但未完成时 | 已解锁后 |
|----------|----------|------------------|----------|
| 阶段 | 不出现 | 出现在解锁/进度区域，显示正式名称 | 成为当前或已完成阶段 |
| 建筑 | 不出现在建筑列表 | 可见且可查看成本/条件 | 可购买 |
| 科技 | 不出现在科技树 | 可见依赖与成本 | 可研究/已研究 |
| 解锁条目 | 不出现 | 可显示标题与条件 | 标记为已完成 |

### 1.3.4 隐藏蛆虫阶段的特殊要求

蛆虫阶段不是普通公开阶段，而是“被发现”的阶段：

1. 玩家先经历工人饥饿、死亡与尸体积累。
2. 当尸体开始转化为蛆虫，系统才允许揭示这一条分支。
3. 在揭示之前，UI 中不能提前出现“蛆虫”“蛆虫人”等名称。
4. 揭示后再开放对应的建筑、科技和共生系统。

## 1.4 阶段资源与建筑分布原则

### 1.4.1 初始阶段
- 仅保留最基础的点击与生存型资源：金币、木头、石头。
- 仅展示最早期建筑，不出现黑暗科技和高级工业名词。

### 1.4.2 工人阶段
- 引入食物、住房、工人效率。
- 前期工业资源从这一阶段开始逐步出现，但必须由工人与食物链支撑。

### 1.4.3 蛆虫阶段
- 尸体与蛆虫从“后果”转变为“资源链”。
- 黑暗生物建筑与腐化型科技在此出现。

### 1.4.4 蛆虫人阶段
- 不再只靠单纯人类工人生产。
- 系统要允许混合人口产生收益与风险。

### 1.4.5 集体意识阶段
- 高级资源、意识科技、太空探索集中在终局阶段。
- 暗物质、纳米机器、太空船等高阶内容必须与前面的黑暗生物链条相连。

## 1.5 共生数值系统目标

蛆虫人与人类的共存不能只靠一个简单计数器，而是至少包含以下四类状态：

| 指标 | 含义 | 作用 |
|------|------|------|
| 人类压力 | 人类社会对异化的排斥、恐慌与维稳压力 | 过高时压制黑暗分支效率 |
| 蛆虫影响 | 腐化生态对生产与人口系统的渗透程度 | 过高时侵蚀传统生产秩序 |
| 共生稳定度 | 人类与蛆虫人是否能维持脆弱平衡 | 决定阶段 4 是否可持续 |
| 混合人口 | 已完成转化并参与生产的蛆虫人数值 | 提供阶段 4-5 的关键产能 |

这些指标应满足以下目标：

1. 不能只增不减，要允许波动。
2. 要同时受资源、建筑、科技、饥饿/死亡等状态影响。
3. 要真正影响产能、风险和后续解锁。
4. 要为集体意识阶段提供前置条件。

## 1.6 前后端实现边界

1. 阶段判断、隐藏内容过滤、共生数值计算全部由 Rust 负责。
2. JS 只能请求“当前已揭示内容”和“当前已解锁内容”，不能自行猜测未来内容。
3. 前端渲染器必须接受“列表被过滤后长度变化”的情况，不能假设所有内容永远可见。
4. 保存与读档必须对新增阶段字段和共生字段保持向后兼容。

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

### 2.2 Building（建筑系统）
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

### 2.3 Worker（工人系统 - 预留）
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
2. JavaScript 调用 `buy_building(index)`
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

### 7.2 新建筑添加
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
- 基础建筑
- Playwright测试框架

### v0.2.0 - 多资源系统
- 添加木头、石头资源
- 相应的建筑
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
- 移除 Autoclicker 相关状态字段
- 游戏循环仅保留建筑提供的资源自动生产
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
}
```

### 9.1.4 科技加成系统

`TechnologyBonuses` 结构体汇总所有已购买科技的效果：

```rust
pub struct TechnologyBonuses {
    /// 各类资源的生产加成倍率 (1.0 = 无加成)
    pub production_bonus: HashMap<ResourceType, f64>,
    /// 全局生产倍率 (1.0 = 无加成)
    pub production_multiplier: f64,
}
```

### 9.1.5 科技效果应用

科技加成在生产系统中自动应用。游戏主循环会计算科技加成，并将其传递给生产系统：

```rust
// idle_game.rs - game_loop
let tech_bonuses = self.technology_tree.calculate_bonuses();
let production = production::update_production(
    &self.buildings, 
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
### 9.1.7 技术成本渲染规范

技术成本在 UI 中渲染时必须保持稳定的排序顺序，以避免每次面板刷新时资源顺序抖动。

#### 渲染一致性要求

1. **成本排序策略**：使用预定义的资源优先级列表对成本进行排序，确保相同的科技成本始终以相同顺序渲染。

2. **所有渲染路径一致**：技术成本排序逻辑必须在以下三个渲染位置统一应用：
   - 科技详情面板 (`renderTechDetail`)
   - 内联详情视图 (`selectTechnology` 备用路径)

3. **辅助方法**：在 `TechnologyManager` 中实现 `sortCosts` 辅助方法，接收成本对象并返回排序后的条目数组。

### 9.1.8 建筑类型


可解锁的建筑类型 (BuildingType 枚举)：
- 矿井 (Mine)
- 锯木厂 (LumberMill)
- 采石场 (Quarry)
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
- 添加更多建筑与建筑分工玩法
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
TZ|- 性能进一步优化

## 10.4 制造系统

制造系统允许玩家将基础资源转化为高级资源。

### 10.4.1 基础制造配方

| 配方 ID | 名称 | 输入 | 输出 | 初始状态 |
|---------|------|------|------|----------|
| iron_ore_to_iron_ingot | 铁矿炼铁锭 | 10 IronOre | 1 IronIngot | 已解锁 |
| copper_ore_to_copper_ingot | 铜矿炼铜锭 | 10 CopperOre | 1 CopperIngot | 未解锁 |
| aluminum_ore_to_aluminum_ingot | 铝矿炼铝锭 | 10 AluminumOre | 1 AluminumIngot | 未解锁 |

注：铁矿炼铁锭是玩家获取铁锭的主要途径，在制造系统可用后即可使用。

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
