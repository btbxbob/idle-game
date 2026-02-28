# 复杂系统扩展计划 - 全面实施

## TL;DR

> **核心目标**: 全面扩展闲置游戏系统，新增科技树、复杂工人系统、住房管理、资源生命周期循环
> 
> **主要系统**:
> - 科技系统: 50种科技，复杂依赖关系树
> - 工人系统: 随机英文姓名、性别、20+特性（主次特性系统）、爱好
> - 住房系统: 工人自动入住机制
> - 生命周期系统: 食物→工人→死亡→尸体→蛆虫→工厂→食物
> - 工作总览: 各工种工人数量统计
> - 移除autoclicker
> 
> **预估规模**: 1200-1500行Rust + 600-800行JS
> **执行策略**: 7个阶段，最大化并行，谨慎处理依赖
> **存档策略**: 破坏性更新，接受存档重置
> **风险评估**: 高（涉及核心数据结构变更和多系统集成）

---

## Context

### 原始需求
用户希望进行大规模系统扩展，包括：
1. 【已完成】资源种类扩展（10初级+40次级+10高级）
2. 科技系统：50种科技，消耗资源购买，有依赖关系
3. 工人系统复杂化：英文姓名、性别、爱好、20+特性（主次系统）
4. 工作总览界面
5. 删除autoclicker
6. 住房系统：先建住房，工人自动入住
7. 食物资源：工人消耗，不足则死亡
8. 尸体资源：工人死亡产生
9. 蛆虫资源：尸体持续产生
10. 蛆虫工厂：用蛆虫制作食物

### 技术发现
- **已有基础设施**: 50种TechnologyId枚举、住房结构、食物/尸体/蛆虫资源类型、多个JS管理器
- **Worker结构**: 当前有name, skills, background, preferences, assigned_building, level等字段
- **升级系统**: 类似科技的一次性购买系统已存在
- **解锁系统**: 基于条件的解锁机制已存在
- **保存系统**: 使用serde序列化，需要处理结构变更

### 关键决策记录
- 科技: 使用现有50种，填充依赖关系
- 特性: 主次特性系统，20+种
- 存档: 破坏性更新
- 经济: 平衡型，1农场支持10工人

---

## Work Objectives

### 核心目标
实现一个深度复杂的闲置游戏系统，包含科技树进展、工人个性化管理、资源生命周期循环。

### 具体交付物

#### Rust后端
1. 扩展Worker结构（性别、爱好、20+特性、主次特性系统）
2. 科技树系统（50种科技，依赖关系，效果应用）
3. 工人自动生成系统（随机英文姓名）
4. 住房-工人集成（自动入住逻辑）
5. 食物消耗系统（每秒消耗，不足触发饥饿）
6. 死亡与 decay系统（死亡→尸体→蛆虫）
7. 蛆虫工厂建筑
8. 工作统计系统（各工种计数）
9. 自动分配算法
10. 移除autoclicker

#### JavaScript前端
1. 科技树界面（依赖可视化，可购买状态）
2. 工人详情界面（姓名、性别、爱好、特性展示）
3. 工人列表界面（超长列表，滚动优化）
4. 自动分配按钮
5. 工作总览面板
6. 住房界面更新（入住状态显示）
7. 生命周期资源显示（食物/尸体/蛆虫）
8. 死亡通知系统

### 定义完成标准
- [ ] 50种科技都可被研究，依赖关系正确
- [ ] 工人有随机英文姓名、性别、2个爱好、1主特性+1-2次特性
- [ ] 住房容量满时新工人排队等待
- [ ] 食物不足时工人饿死并产生尸体
- [ ] 尸体自动产生蛆虫
- [ ] 蛆虫工厂可将蛆虫转为食物
- [ ] 工作总览显示各工种人数
- [ ] 自动分配按钮有效工作
- [x] autoclicker完全移除
- [ ] 所有现有测试通过

### 必须实现
- 科技树完整可玩
- 工人系统深度个性化
- 生命周期循环闭环
- 住房-人口动态平衡

### 明确排除
- 复杂的AI行为（工人自主决策）
- 多人/社交功能
- 复杂的图形效果
- 存档迁移逻辑（破坏性更新）

---

## Verification Strategy

### 测试决策
- **测试基础设施**: 已存在（cargo test + Playwright）
- **自动化测试**: Tests-after模式（实现后补充测试）
- **框架**: cargo test for Rust, Playwright for E2E

### QA政策
每个任务包含Agent-Executed QA Scenarios，验证实际行为：
- **Rust逻辑**: 单元测试 + 集成测试
- **WASM导出**: 浏览器控制台验证
- **UI功能**: Playwright自动化测试
- **游戏循环**: 长时间运行测试（5分钟）

---

## Execution Strategy

### 并行执行阶段

```
阶段1: 核心数据结构与基础设施（基础层，必须先完成）
├── 任务1: 扩展Worker结构（性别、爱好、特性）
├── 任务2: 定义20+工人特性（含效果）
├── 任务3: 英文姓名生成器集成
├── 任务4: 升级存档版本号，添加破坏性更新提示
└── 任务5: 定义科技树依赖关系（50种科技）

阶段2: 核心系统实现（可高度并行）
├── 任务6: 科技系统核心逻辑
├── 任务7: 住房自动入住系统
├── 任务8: 食物消耗与饥饿系统
├── 任务9: 工人自动生成系统
└── 任务10: 工作统计系统

阶段3: 生命周期系统（依赖阶段2部分任务）
├── 任务11: 死亡系统（饥饿致死）
├── 任务12: 尸体产生系统
├── 任务13: 蛆虫产生系统（decay）
├── 任务14: 蛆虫工厂建筑
└── 任务15: 生命周期闭环测试

阶段4: 工人管理与分配（依赖阶段1-2）
├── 任务16: 自动分配算法
├── 任务17: 工作总览系统
├── 任务18: 工人详情界面Rust支持
└── 任务19: 工人列表接口优化

阶段5: WASM导出与JS集成（依赖阶段1-4）
├── 任务20: 扩展WASM导出（Worker字段）
├── 任务21: 科技系统WASM导出
├── 任务22: 住房系统WASM导出扩展
├── 任务23: 生命周期系统WASM导出
└── 任务24: 工作总览WASM导出

阶段6: UI实现（高度并行，依赖阶段5）
├── 任务25: 科技树界面
├── 任务26: 工人列表界面（超长列表优化）
├── 任务27: 工人详情模态框
├── 任务28: 自动分配按钮
├── 任务29: 工作总览面板
├── 任务30: 住房界面更新
└── 任务31: 生命周期资源显示

阶段7: 清理与验证（依赖所有前面阶段）
├── 任务32: 移除autoclicker
├── 任务33: Rust测试套件更新
├── 任务34: Playwright测试更新
├── 任务35: 平衡性调整（食物经济）
└── 任务36: 集成测试与Bug修复
```

### 关键路径
阶段1 → 阶段2 → 阶段3 → 阶段4 → 阶段5 → 阶段6 → 阶段7

并行优化:
- 阶段1任务1-5可部分并行（任务5需要1-3）
- 阶段2任务6-10可高度并行
- 阶段6任务25-31可高度并行

### Agent调度策略
- **阶段1**: 3个deep agents + 2个quick agents
- **阶段2**: 3个deep agents + 2个unspecified-high agents
- **阶段3**: 2个deep agents + 3个unspecified-high agents
- **阶段4**: 2个deep agents + 2个unspecified-high agents
- **阶段5**: 4个quick agents
- **阶段6**: 5个visual-engineering agents
- **阶段7**: 2个deep agents + 3个unspecified-high agents

---

## TODOs

- [x] **任务1: 扩展Worker结构（性别、爱好、特性）**

  **What to do**:
  1. 在 `src/entities/worker.rs` 中扩展 Worker struct，添加以下字段：
     - `gender: Gender` (枚举: Male/Female/Other)
     - `hobbies: Vec<Hobby>` (最多2个爱好)
     - `primary_trait: Trait` (主特性)
     - `secondary_traits: Vec<Trait>` (1-2个次特性)
     - `happiness: f64` (心情值，0-100)
  2. 创建 `Gender`、`Hobby`、`Trait` 枚举和相关类型
  3. 为新增字段实现 serde 序列化/反序列化
  4. 更新 `Worker::new()` 构造函数，使用默认/随机值初始化新字段
  5. 更新 `IdleGame::new()` 中预定义工人的初始化

  **Must NOT do**:
  - 不要修改现有字段（name, skills, background等），保持向后兼容
  - 不要直接暴露Vec<T>到WASM，保持现有模式
  - 不要让特性效果过于复杂（保持简单数值加成）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 涉及核心数据结构变更，需要仔细处理serde和借用检查
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与任务2-3并行）
  - **Parallel Group**: Wave 1（阶段1）
  - **Blocks**: 任务6, 任务9, 任务11, 任务16-19, 任务20, 任务26-27
  - **Blocked By**: 无（可立即开始）

  **References**:
  - `src/entities/worker.rs:1-50` - 当前Worker结构定义
  - `src/entities/mod.rs` - 模块导出模式
  - `src/core/idle_game.rs:200-250` - IdleGame::new()中工人初始化
  - AGENTS.md - 实体定义模式指南

  **Acceptance Criteria**:
  - [ ] Worker结构编译通过
  - [ ] serde序列化/反序列化工作正常
  - [ ] `cargo test` 中Worker相关测试通过
  - [ ] IdleGame::new() 中5个预定义工人初始化正确

  **QA Scenarios**:
  ```
  Scenario: Worker struct creation
    Tool: Bash (cargo test)
    Preconditions: 代码已编译
    Steps:
      1. Run: cargo test worker
      2. Verify: All tests pass
    Expected Result: 0 failures
    Evidence: .sisyphus/evidence/task1-worker-struct.png
  ```

  **Commit**: YES
  - Message: `feat(entities): extend Worker struct with gender, hobbies, and traits`
  - Files: `src/entities/worker.rs`, `src/entities/mod.rs`
  - Pre-commit: `cargo test worker && cargo clippy`

- [x] **任务2: 定义20+工人特性（含效果）**

  **What to do**:
  1. 在 `src/entities/worker.rs` 或新建 `src/entities/traits.rs` 中定义特性系统
  2. 创建 `Trait` 枚举，包含20+种特性
  3. 实现 `TraitEffect` 结构，描述每个特性的游戏效果
  4. 实现 `apply_trait_effects()` 函数，计算工人总效率加成
  5. 定义主次特性系统规则（主特性效果100%，次特性效果50%）

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与任务1,3并行）
  - **Parallel Group**: Wave 1（阶段1）

  **Commit**: YES
  - Message: `feat(entities): define 20+ worker traits with gameplay effects`
  - Files: `src/entities/traits.rs`（或 `worker.rs`）
  - Pre-commit: `cargo test trait`

- [ ] **任务1: 扩展Worker结构（性别、爱好、特性）**

  **What to do**:
  1. 在 `src/entities/worker.rs` 中扩展 Worker struct，添加以下字段：
     - `gender: Gender` (枚举: Male/Female/Other)
     - `hobbies: Vec<Hobby>` (最多2个爱好)
     - `primary_trait: Trait` (主特性)
     - `secondary_traits: Vec<Trait>` (1-2个次特性)
     - `happiness: f64` (心情值，0-100)
  2. 创建 `Gender`、`Hobby`、`Trait` 枚举和相关类型
  3. 为新增字段实现 serde 序列化/反序列化
  4. 更新 `Worker::new()` 构造函数，使用默认/随机值初始化新字段
  5. 更新 `IdleGame::new()` 中预定义工人的初始化

  **Must NOT do**:
  - 不要修改现有字段（name, skills, background等），保持向后兼容
  - 不要直接暴露Vec<T>到WASM，保持现有模式
  - 不要让特性效果过于复杂（保持简单数值加成）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 涉及核心数据结构变更，需要仔细处理serde和借用检查
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与任务2-3并行）
  - **Parallel Group**: Wave 1（阶段1）
  - **Blocks**: 任务6, 任务9, 任务11, 任务16-19, 任务20, 任务26-27
  - **Blocked By**: 无（可立即开始）

  **References**:
  - `src/entities/worker.rs:1-50` - 当前Worker结构定义
  - `src/entities/mod.rs` - 模块导出模式
  - `src/core/idle_game.rs:200-250` - IdleGame::new()中工人初始化
  - AGENTS.md - 实体定义模式指南

  **Acceptance Criteria**:
  - [ ] Worker结构编译通过
  - [ ] serde序列化/反序列化工作正常
  - [ ] `cargo test` 中Worker相关测试通过
  - [ ] IdleGame::new() 中5个预定义工人初始化正确

  **QA Scenarios**:
  ```
  Scenario: Worker struct creation
    Tool: Bash (cargo test)
    Preconditions: 代码已编译
    Steps:
      1. Run: cargo test worker
      2. Verify: All tests pass
    Expected Result: 0 failures
    Evidence: .sisyphus/evidence/task1-worker-struct.png
  ```

  **Commit**: YES
  - Message: `feat(entities): extend Worker struct with gender, hobbies, and traits`
  - Files: `src/entities/worker.rs`, `src/entities/mod.rs`
  - Pre-commit: `cargo test worker && cargo clippy`

- [ ] **任务2: 定义20+工人特性（含效果）**

  **What to do**:
  1. 在 `src/entities/worker.rs` 或新建 `src/entities/traits.rs` 中定义特性系统
  2. 创建 `Trait` 枚举，包含20+种特性，例如：
     - 效率类: Diligent(+15%), Hardworking(+10%), Lazy(-10%)
     - 学习类: Intelligent(+20% XP), FastLearner(+15% XP)
     - 社交类: Social(+5%团队效率), Loner(-5%但有专注加成)
     - 特殊类: NightOwl(夜间+20%), EarlyBird(白天+20%)
     - 负面类: Clumsy(-10%), Forgetful(-5%)
     - 等等...
  3. 实现 `TraitEffect` 结构，描述每个特性的游戏效果
  4. 实现 `apply_trait_effects()` 函数，计算工人总效率加成
  5. 定义主次特性系统规则（主特性效果100%，次特性效果50%）

  **Must NOT do**:
  - 不要创建过于复杂的特性交互（避免特性A和B组合产生特殊效果）
  - 不要添加需要额外UI的特性（如"会唱歌"这种纯装饰特性）
  - 不要创建数值差距过大的特性（保持±20%范围内）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要设计平衡的数值系统
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与任务1,3并行）
  - **Parallel Group**: Wave 1（阶段1）
  - **Blocks**: 任务1（需要Trait定义完成）, 任务6, 任务16, 任务26
  - **Blocked By**: 无（可立即开始，但需要与任务1协调）

  **References**:
  - `src/systems/production.rs` - 当前工人效率计算
  - `src/entities/worker.rs` - Worker效率字段
  - Factorio/Dyson Sphere Program特性设计作为参考

  **Acceptance Criteria**:
  - [ ] 至少定义20种特性
  - [ ] 每种特性有明确的数值效果
  - [ ] 主次特性效果计算公式正确
  - [ ] 包含正负特性，保持平衡
  - [ ] `cargo test` 通过

  **QA Scenarios**:
  ```
  Scenario: Trait effects calculation
    Tool: Bash (cargo test)
    Preconditions: 特性系统已实现
    Steps:
      1. Run: cargo test trait
      2. Verify: All trait-related tests pass
      3. Check: Diligent worker has 15% bonus
    Expected Result: Tests verify correct bonus calculations
    Evidence: .sisyphus/evidence/task2-traits.png
  ```

  **Commit**: YES
  - Message: `feat(entities): define 20+ worker traits with gameplay effects`
  - Files: `src/entities/traits.rs`（或 `worker.rs`）
  - Pre-commit: `cargo test trait`

- [x] **任务3: 英文姓名生成器集成**

  **What to do**:
  1. 检查现有 `name_generator.rs`（如果存在）
  2. 如果不存在或不符合要求，创建 `src/utils/name_generator.rs`
  3. 实现随机英文姓名生成：
     - 名字池：100+常见英文名（John, Mary, James, Emma等）
     - 姓氏池：100+常见英文姓氏（Smith, Johnson, Brown等）
     - 组合逻辑：名字 + 姓氏
  4. 根据性别调整姓名（如女性用Emma, Olivia，男性用John, James）
  5. 在 `Worker::new()` 或工人生成时调用姓名生成器
  6. 确保姓名唯一性（可选：添加编号如John Smith II）

  **Must NOT do**:
  - 不要使用复杂的外部依赖，保持简单
  - 不要生成冒犯性或不适当的姓名组合
  - 不要让姓名生成成为性能瓶颈

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 相对简单的工具函数
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与任务1-2并行）
  - **Parallel Group**: Wave 1（阶段1）
  - **Blocks**: 任务9（工人自动生成）
  - **Blocked By**: 无

  **References**:
  - `src/entities/worker.rs` - Worker name字段
  - 常见英文姓名列表（可使用公开数据集）

  **Acceptance Criteria**:
  - [ ] 能生成100+独特姓名组合
  - [ ] 根据性别选择合适姓名
  - [ ] 集成到Worker创建流程
  - [ ] `cargo test` 通过

  **QA Scenarios**:
  ```
  Scenario: Name generation
    Tool: Bash (cargo test)
    Preconditions: 姓名生成器已实现
    Steps:
      1. Generate 100 workers
      2. Check: All have valid names
      3. Check: Names are not obviously repetitive
    Expected Result: Diverse, appropriate names
    Evidence: .sisyphus/evidence/task3-names.png
  ```

  **Commit**: YES
  - Message: `feat(utils): add English name generator for workers`
  - Files: `src/utils/name_generator.rs`, `src/utils/mod.rs`
  - Pre-commit: `cargo test name`

- [x] **任务4: 升级存档版本号，添加破坏性更新提示**

  **What to do**:
  1. 在 `src/state/game_state.rs` 中更新版本号：
     - 当前: "0.2.6" → 新: "0.3.0"
  2. 在 `GameState::migrate_from_old()` 中添加版本检查
  3. 如果加载旧版本存档（<0.3.0），显示破坏性更新提示
  4. 添加 `reset_on_version_mismatch` 逻辑，自动重置游戏状态
  5. 更新 `SavedGame` 结构以包含版本信息
  6. 在JS层添加版本不匹配提示UI

  **Must NOT do**:
  - 不要尝试复杂的存档迁移（用户已接受破坏性更新）
  - 不要静默重置（必须告知用户）
  - 不要删除旧迁移代码（保留历史记录）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 主要是配置和消息更新
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与其他阶段1任务并行）
  - **Parallel Group**: Wave 1（阶段1）
  - **Blocks**: 任务32（最终清理）
  - **Blocked By**: 无

  **References**:
  - `src/state/game_state.rs:10-30` - 版本号定义
  - `src/state/game_state.rs:100-150` - migrate_from_old函数
  - `js/game.js` - UI提示逻辑

  **Acceptance Criteria**:
  - [ ] 版本号更新为"0.3.0"
  - [ ] 旧存档加载时触发重置
  - [ ] 用户看到明确的重置提示
  - [ ] 新存档正常保存和加载

  **QA Scenarios**:
  ```
  Scenario: Version mismatch handling
    Tool: Bash (cargo test)
    Preconditions: 版本已更新
    Steps:
      1. Create save with version "0.2.6"
      2. Load with new code
      3. Verify: Game resets with notification
    Expected Result: Clean reset, user informed
    Evidence: .sisyphus/evidence/task4-version.png
  ```

  **Commit**: YES
  - Message: `chore(state): bump version to 0.3.0, add breaking change handling`
  - Files: `src/state/game_state.rs`, `js/game.js`
  - Pre-commit: `cargo test save_load`

- [x] **任务5: 定义科技树依赖关系（50种科技）**

  **What to do**:
  1. 检查现有的 `TechnologyId` 枚举（50种科技ID）
  2. 在 `src/systems/technology.rs` 中定义 `Technology` 结构：
     - id: TechnologyId
     - name: String
     - description: String
     - cost: HashMap<ResourceType, f64>
     - dependencies: Vec<TechnologyId>
     - effect: TechnologyEffect
     - researched: bool
  3. 为50种科技定义完整的依赖关系图：
     - 基础科技（无依赖）：5-8种
     - 初级科技（依赖基础）：10-15种
     - 中级科技（依赖初级）：15-20种
     - 高级科技（依赖中级）：10-15种
     - 终极科技（依赖高级）：3-5种
  4. 设计科技效果类型：
     - 资源产量加成
     - 解锁新建筑
     - 解锁新资源
     - 工人效率提升
     - 解锁新功能
  5. 实现科技树验证函数（检查循环依赖、孤立节点）

  **Must NOT do**:
  - 不要创建循环依赖（A依赖B，B依赖A）
  - 不要创建无法到达的科技（所有科技都必须有路径）
  - 不要让所有科技都依赖同一个前置科技（创建瓶颈）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要设计复杂的图结构和平衡的游戏进展
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与阶段1其他任务并行）
  - **Parallel Group**: Wave 1（阶段1）
  - **Blocks**: 任务6（科技系统核心逻辑）
  - **Blocked By**: 无

  **References**:
  - `src/systems/technology.rs` - 现有科技系统框架
  - `src/systems/unlock.rs` - 类似的需求和解锁模式
  - 文明/Dyson Sphere Program科技树作为参考

  **Acceptance Criteria**:
  - [ ] 50种科技全部定义
  - [ ] 依赖关系图无循环
  - [ ] 所有科技都可到达
  - [ ] 科技效果类型定义完整
  - [ ] 验证函数通过
  - [ ] `cargo test` 通过

  **QA Scenarios**:
  ```
  Scenario: Tech tree validation
    Tool: Bash (cargo test)
    Preconditions: 科技树已定义
    Steps:
      1. Run: cargo test tech_tree
      2. Verify: No circular dependencies
      3. Verify: No orphaned technologies
      4. Check: Path exists from start to all techs
    Expected Result: Valid tech tree
    Evidence: .sisyphus/evidence/task5-tech-tree.png
  ```

  **Commit**: YES
  - Message: `feat(systems): define complete tech tree with 50 technologies`
  - Files: `src/systems/technology.rs`
  - Pre-commit: `cargo test tech`

- [ ] **任务1: 扩展Worker结构（性别、爱好、特性）**

  **What to do**:
  1. 在 `src/entities/worker.rs` 中扩展 Worker struct，添加以下字段：
     - `gender: Gender` (枚举: Male/Female/Other)
     - `hobbies: Vec<Hobby>` (最多2个爱好)
     - `primary_trait: Trait` (主特性)
     - `secondary_traits: Vec<Trait>` (1-2个次特性)
     - `happiness: f64` (心情值，0-100)
  2. 创建 `Gender`、`Hobby`、`Trait` 枚举和相关类型
  3. 为新增字段实现 serde 序列化/反序列化
  4. 更新 `Worker::new()` 构造函数，使用默认/随机值初始化新字段
  5. 更新 `IdleGame::new()` 中预定义工人的初始化

  **Must NOT do**:
  - 不要修改现有字段（name, skills, background等），保持向后兼容
  - 不要直接暴露Vec<T>到WASM，保持现有模式
  - 不要让特性效果过于复杂（保持简单数值加成）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 涉及核心数据结构变更，需要仔细处理serde和借用检查
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与任务2-3并行）
  - **Parallel Group**: Wave 1（阶段1）
  - **Blocks**: 任务6, 任务9, 任务11, 任务16-19, 任务20, 任务26-27
  - **Blocked By**: 无（可立即开始）

  **References**:
  - `src/entities/worker.rs:1-50` - 当前Worker结构定义
  - `src/entities/mod.rs` - 模块导出模式
  - `src/core/idle_game.rs:200-250` - IdleGame::new()中工人初始化
  - AGENTS.md - 实体定义模式指南

  **Acceptance Criteria**:
  - [ ] Worker结构编译通过
  - [ ] serde序列化/反序列化工作正常
  - [ ] `cargo test` 中Worker相关测试通过
  - [ ] IdleGame::new() 中5个预定义工人初始化正确

  **QA Scenarios**:
  ```
  Scenario: Worker struct creation
    Tool: Bash (cargo test)
    Preconditions: 代码已编译
    Steps:
      1. Run: cargo test worker
      2. Verify: All tests pass
    Expected Result: 0 failures
    Evidence: .sisyphus/evidence/task1-worker-struct.png
  ```

  **Commit**: YES
  - Message: `feat(entities): extend Worker struct with gender, hobbies, and traits`
  - Files: `src/entities/worker.rs`, `src/entities/mod.rs`
  - Pre-commit: `cargo test worker && cargo clippy`

- [ ] **任务2: 定义20+工人特性（含效果）**

  **What to do**:
  1. 在 `src/entities/worker.rs` 或新建 `src/entities/traits.rs` 中定义特性系统
  2. 创建 `Trait` 枚举，包含20+种特性，例如：
     - 效率类: Diligent(+15%), Hardworking(+10%), Lazy(-10%)
     - 学习类: Intelligent(+20% XP), FastLearner(+15% XP)
     - 社交类: Social(+5%团队效率), Loner(-5%但有专注加成)
     - 特殊类: NightOwl(夜间+20%), EarlyBird(白天+20%)
     - 负面类: Clumsy(-10%), Forgetful(-5%)
     - 等等...
  3. 实现 `TraitEffect` 结构，描述每个特性的游戏效果
  4. 实现 `apply_trait_effects()` 函数，计算工人总效率加成
  5. 定义主次特性系统规则（主特性效果100%，次特性效果50%）

  **Must NOT do**:
  - 不要创建过于复杂的特性交互
  - 不要添加需要额外UI的纯装饰特性
  - 不要创建数值差距过大的特性（保持±20%范围内）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要设计平衡的数值系统
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与任务1,3并行）
  - **Parallel Group**: Wave 1（阶段1）
  - **Blocks**: 任务1（需要Trait定义完成）, 任务6, 任务16, 任务26
  - **Blocked By**: 无

  **References**:
  - `src/systems/production.rs` - 当前工人效率计算
  - `src/entities/worker.rs` - Worker效率字段

  **Acceptance Criteria**:
  - [ ] 至少定义20种特性
  - [ ] 每种特性有明确的数值效果
  - [ ] 主次特性效果计算公式正确
  - [ ] `cargo test` 通过

  **QA Scenarios**:
  ```
  Scenario: Trait effects calculation
    Tool: Bash (cargo test)
    Preconditions: 特性系统已实现
    Steps:
      1. Run: cargo test trait
      2. Verify: All tests pass
    Expected Result: Tests verify correct bonus calculations
    Evidence: .sisyphus/evidence/task2-traits.png
  ```

  **Commit**: YES
  - Message: `feat(entities): define 20+ worker traits with gameplay effects`
  - Files: `src/entities/traits.rs`（或 `worker.rs`）
  - Pre-commit: `cargo test trait`

- [ ] **任务3: 英文姓名生成器集成**

  **What to do**:
  1. 创建 `src/utils/name_generator.rs`
  2. 实现随机英文姓名生成（100+名字 + 100+姓氏）
  3. 根据性别调整姓名选择
  4. 集成到工人生成流程

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocks**: 任务9
  - **Blocked By**: 无

  **Commit**: YES
  - Message: `feat(utils): add English name generator`
  - Files: `src/utils/name_generator.rs`
  - Pre-commit: `cargo test name`


- [ ] **任务3: 英文姓名生成器集成**

  **What to do**:
  1. 创建 `src/utils/name_generator.rs`
  2. 实现随机英文姓名生成（名字池100+，姓氏池100+）
  3. 根据性别调整姓名
  4. 在工人生成时调用姓名生成器
  5. 确保姓名多样性

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1

  **Commit**: YES

- [ ] **任务4: 升级存档版本号，添加破坏性更新提示**

  **What to do**:
  1. 在 `GameState` 中更新版本号："0.2.6" → "0.3.0"
  2. 添加版本检查逻辑，旧存档自动重置
  3. 在JS层添加版本不匹配提示UI

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [ ] **任务5: 定义科技树依赖关系（50种科技）**

  **What to do**:
  1. 在 `src/systems/technology.rs` 中定义 `Technology` 结构
  2. 为50种科技定义完整的依赖关系图
  3. 设计科技效果类型（资源加成、解锁建筑等）
  4. 实现科技树验证函数（检查循环依赖）

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与阶段1其他任务并行）

  **Commit**: YES

- [x] **任务6: 科技系统核心逻辑**

  **What to do**:
  1. 实现科技研究功能（消耗资源，标记为已研究）
  2. 实现依赖检查（前置科技必须已研究）
  3. 实现科技效果应用系统
  4. 集成到游戏主循环

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖任务5）
  - **Blocked By**: 任务5

  **Commit**: YES

- [x] **任务7: 住房自动入住系统**

  **What to do**:
  1. 修改工人产生逻辑，检查住房容量
  2. 实现入住队列系统（容量满时工人等待）
  3. 当住房容量增加时，自动分配等待中的工人
  4. 更新住房UI显示入住状态

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与任务6,8,9,10并行）

  **Commit**: YES

- [x] **任务8: 食物消耗与饥饿系统**

  **What to do**:
  1. 实现每秒食物消耗逻辑（每个工人消耗X食物）
  2. 实现饥饿度累积（食物不足时增加饥饿度）
  3. 当饥饿度达到阈值时触发死亡
  4. 平衡经济：1农场支持10工人

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务9: 工人自动生成系统**

  **What to do**:
  1. 实现工人自动生成计时器
  2. 根据住房容量控制生成速度
  3. 使用姓名生成器生成随机姓名
  4. 随机分配性别、爱好、特性

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务1-3

  **Commit**: YES

- [x] **任务10: 工作统计系统**

  **What to do**:
  1. 统计每种建筑类型的工人数
  2. 统计未分配工人数
  3. 计算每工种的平均效率
  4. 为工作总览界面提供数据

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务11: 死亡系统（饥饿致死）**

  **What to do**:
  1. 当工人饥饿度达到阈值时触发死亡
  2. 从工人列表中移除死亡工人
  3. 触发尸体产生事件
  4. 添加死亡通知机制

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖任务8）
  - **Blocked By**: 任务8

  **Commit**: YES

- [x] **任务12: 尸体产生系统**

  **What to do**:
  1. 工人死亡时产生1个尸体（Corpse资源）
  2. 在资源系统中管理尸体数量
  3. 添加尸体存储上限（可选）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与任务11同时）

  **Commit**: YES


- [x] **任务13: 蛆虫产生系统（decay）**

  **What to do**:
  1. 实现尸体decay逻辑（每具尸体随时间产生蛆虫）
  2. 定义蛆虫产生速率（如每5分钟1尸体→10蛆虫）
  3. 在资源系统中管理蛆虫数量
  4. 可选择：尸体完全decay后消失

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务14: 蛆虫工厂建筑**

  **What to do**:
  1. 创建新的建筑类型：蛆虫工厂（Maggot Factory）
  2. 定义建筑成本（使用次级资源）
  3. 实现蛆虫→食物转换逻辑
  4. 定义转换比率（如100蛆虫→10食物）
  5. 添加到建筑购买界面

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务15: 生命周期闭环测试**

  **What to do**:
  1. 编写集成测试验证完整循环：
     - 食物不足 → 工人死亡 → 产生尸体 → 产生蛆虫 → 工厂生产食物
  2. 验证各阶段资源变化正确
  3. 测试边界条件（无食物、无尸体、无工厂等）
  4. 验证闭环可持续（食物最终恢复）

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖任务11-14）
  - **Blocked By**: 任务11, 12, 13, 14

  **Commit**: YES

- [x] **任务16: 自动分配算法**

  **What to do**:
  1. 实现自动分配按钮功能
  2. 算法逻辑：
     - 优先匹配工人偏好（preferences）与建筑类型
     - 其次考虑工人特性（如Diligent工人优先分配给高价值建筑）
     - 最后随机分配
  3. 只分配未分配工人
  4. 优先填满未满员的建筑

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务1（特性系统）

  **Commit**: YES

- [x] **任务17: 工作总览系统**

  **What to do**:
  1. 整合各工种统计信息
  2. 计算总工作效率
  3. 显示空闲工人数量
  4. 为UI层提供清晰的接口

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务18: 工人详情界面Rust支持**

  **What to do**:
  1. 实现获取单个工人详情的WASM导出函数
  2. 包含所有新字段：姓名、性别、爱好、特性、等级、经验等
  3. 使用js_sys::Object手动构建JS对象（遵循现有模式）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务19: 工人列表接口优化**

  **What to do**:
  1. 优化 `get_workers()` 性能（支持大量工人）
  2. 添加分页支持（可选）
  3. 实现过滤功能（按工种、特性等）
  4. 提供排序接口（按效率、等级等）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务20: 扩展WASM导出（Worker字段）**

  **What to do**:
  1. 在 `IdleGame` 中添加WASM导出方法：
     - `get_worker_details(index)` - 获取工人详情
     - `get_worker_count()` - 获取工人数
     - `assign_worker_auto()` - 自动分配
  2. 更新现有 `get_workers()` 以包含新字段
  3. 确保所有字段正确映射到JS对象

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务1, 16-19

  **Commit**: YES

- [x] **任务21: 科技系统WASM导出**

  **What to do**:
  1. 添加WASM导出方法：
     - `get_technologies()` - 获取所有科技状态
     - `research_technology(id)` - 研究科技
     - `can_research(id)` - 检查是否可研究
  2. 确保科技树数据正确序列化到JS
  3. 处理依赖关系的可视化数据

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务22: 住房系统WASM导出扩展**

  **What to do**:
  1. 添加WASM导出方法：
     - `get_housing_capacity()` - 获取总容量
     - `get_housing_occupied()` - 获取已入住数
     - `get_population_queue()` - 获取等待队列
  2. 更新现有住房相关导出

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务23: 生命周期系统WASM导出**

  **What to do**:
  1. 添加食物、尸体、蛆虫资源获取方法
  2. 添加饥饿度、死亡统计等信息
  3. 导出蛆虫工厂相关方法

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务24: 工作总览WASM导出**

  **What to do**:
  1. 添加 `get_job_overview()` 方法
  2. 返回工种统计、效率、空闲人数等
  3. 数据格式便于JS渲染

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES


- [x] **任务25: 科技树界面**

  **What to do**:
  1. 在HTML中添加科技标签页（或升级标签页扩展）
  2. 实现科技树可视化（使用SVG或Canvas）
  3. 显示科技状态（未解锁、可研究、已研究）
  4. 显示科技成本和效果
  5. 实现研究按钮
  6. 连接线显示依赖关系

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务21

  **Commit**: YES

- [x] **任务26: 工人列表界面（超长列表优化）**

  **What to do**:
  1. 重新设计工人标签页，显示工人列表
  2. 实现虚拟滚动（支持100+工人）
  3. 显示每个工人的简要信息（姓名、工种、效率）
  4. 实现排序和过滤控件
  5. 点击工人打开详情模态框

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务20

  **Commit**: YES

- [x] **任务27: 工人详情模态框**

  **What to do**:
  1. 创建工人详情弹窗/模态框
  2. 显示完整信息：
     - 姓名、性别
     - 爱好列表
     - 主特性+次特性（带图标）
     - 等级、经验条
     - 分配的建筑
     - 效率加成详情
  3. 实现分配/重新分配按钮
  4. 美观的视觉效果

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务28: 自动分配按钮**

  **What to do**:
  1. 在工人标签页添加"自动分配"按钮
  2. 点击后调用Rust自动分配函数
  3. 显示分配结果（成功分配X个工人）
  4. 添加确认提示（可选）
  5. 实时更新工人列表显示

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务29: 工作总览面板**

  **What to do**:
  1. 创建新的"工作总览"标签页
  2. 显示各工种统计数据：
     - 工种名称
     - 工人数
     - 平均效率
     - 总产出贡献
  3. 显示空闲工人数量
  4. 可视化图表（柱状图/饼图）
  5. 总工作效率统计

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务24

  **Commit**: YES

- [x] **任务30: 住房界面更新**

  **What to do**:
  1. 在现有住房显示基础上扩展
  2. 显示总容量 vs 已入住人数
  3. 显示等待队列人数（如果有）
  4. 添加入住进度指示器
  5. 当容量满时显示视觉提示

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务31: 生命周期资源显示**

  **What to do**:
  1. 在资源标签页添加新资源显示：
     - 食物（带消耗速率）
     - 尸体（如果有）
     - 蛆虫（如果有）
  2. 添加警告指示器（食物不足时）
  3. 显示饥饿工人数量（危险状态）
  4. 蛆虫工厂操作界面

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Commit**: YES

- [x] **任务32: 移除autoclicker**

  **What to do**:
  1. 从 `IdleGame::new()` 中移除 `Autoclicker Lv1` 升级
  2. 从 `game_loop()` 中移除autoclicker逻辑
  3. 从JS中移除相关UI元素
  4. 确保所有相关代码被清理
  5. 更新任何受影响的游戏平衡

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（最后执行）

  **Commit**: YES

- [ ] **任务33: Rust测试套件更新**

  **What to do**:
  1. 更新现有测试以适应新Worker结构
  2. 添加科技系统测试
  3. 添加生命周期系统测试
  4. 添加自动分配算法测试
  5. 确保所有测试通过

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖前面所有Rust任务）

  **Commit**: YES

- [ ] **任务34: Playwright测试更新**

  **What to do**:
  1. 更新现有E2E测试
  2. 添加科技系统测试
  3. 添加工人系统测试
  4. 添加生命周期系统测试
  5. 确保所有测试通过

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: ['playwright']

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖所有UI任务）

  **Commit**: YES

- [ ] **任务35: 平衡性调整（食物经济）**

  **What to do**:
  1. 测试食物产生/消耗比率
  2. 调整农场产出和工人消耗
  3. 调整蛆虫工厂转换率
  4. 确保循环可持续但又有挑战性
  5. 目标：1农场支持10工人

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（需要完整系统）

  **Commit**: YES

- [ ] **任务36: 集成测试与Bug修复**

  **What to do**:
  1. 进行完整的游戏流程测试
  2. 测试所有边缘情况
  3. 修复发现的bug
  4. 性能优化（如果需要）
  5. 最终验证所有需求完成

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（最终任务）

  **Commit**: YES

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE.

- [ ] **F1. Plan Compliance Audit** - `oracle`
  Read plan end-to-end. Verify all "Must Have" are implemented (tech tree, worker traits, life cycle, housing, job overview, autoclicker removed). Check "Must NOT Have" are absent. Verify evidence files exist.
  Output: `Must Have [7/7] | Must NOT Have [4/4] | Tasks [36/36] | VERDICT`

- [ ] **F2. Code Quality Review** - `unspecified-high`
  Run `cargo test`, `cargo clippy`, Playwright tests. Review for borrow checker issues, WASM exposure problems, AI slop patterns.
  Output: `Build [PASS/FAIL] | Tests [N/N] | Quality [PASS/FAIL] | VERDICT`

- [ ] **F3. Real Manual QA** - `unspecified-high` + `playwright`
  Test complete gameplay loop: Start → Build housing → Workers arrive → Food production → Starvation → Death → Corpses → Maggots → Factory → Food. Test tech tree progression. Verify all UI elements.
  Output: `Gameplay Loop [PASS/FAIL] | Tech Tree [PASS/FAIL] | UI [PASS/FAIL] | VERDICT`

- [ ] **F4. Balance & Fun Check** - `deep`
  Review balance numbers. Food economy sustainable? Tech progression feels good? Worker traits meaningful? Dark cycle actually happens or trivial?
  Output: `Food Economy [BALANCED/OFF] | Tech Pacing [GOOD/OFF] | Trait Impact [MEANINGFUL/WEAK] | VERDICT`

---

## Commit Strategy

- 每个任务单独提交，使用 conventional commits 格式
- 阶段提交消息示例：
  - `feat(entities): extend Worker struct with gender, hobbies, and traits`
  - `feat(systems): implement technology tree with 50 technologies`
  - `feat(core): add life cycle system (food→death→corpse→maggot→food)`
  - `feat(ui): add worker list with virtual scrolling`
  - `refactor: remove autoclicker system`

---

## Success Criteria

### Verification Commands
```bash
# Rust tests
cargo test

# Build WASM
wasm-pack build --target web --out-dir pkg --release

# Start server and run Playwright tests
python server.py &
npx playwright test

# Manual verification checklist:
# □ 50 technologies researchable with proper dependencies
# □ Workers have English names, gender, hobbies, traits
# □ Housing capacity controls worker population
# □ Food shortage causes worker death
# □ Corpses produce maggots over time
# □ Maggot factory converts maggots to food
# □ Job overview shows worker counts per job
# □ Auto-assign button works correctly
# □ Autoclicker completely removed
```

### Final Checklist
- [ ] All 36 tasks completed
- [ ] All 4 verification agents approved
- [ ] No critical bugs
- [ ] All existing tests pass
- [ ] New tests added for new systems
- [ ] Documentation updated (AGENTS.md if needed)
- [ ] User acceptance: "This is the dark idle game I wanted"
