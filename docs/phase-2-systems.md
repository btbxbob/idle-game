# Phase 2 系统文档

**版本**: 0.5.0  
**最后更新**: 2026-02-22  
**状态**: 开发中

---

## 目录

1. [科技系统](#1-科技系统)
2. [工人系统](#2-工人系统)
3. [生死循环系统](#3-生死循环系统)
4. [住房系统](#4-住房系统)
5. [平衡参数](#5-平衡参数)

---

## 1. 科技系统

### 1.1 概述

科技系统是 Phase 2 的核心进度系统，允许玩家通过研究技术解锁新的建筑、提升生产效率和解锁高级游戏机制。

### 1.2 科技树结构

科技树包含 **50 项科技**，分为 4 个层级：

```
Tier 1 (15 项)  →  Tier 2 (15 项)  →  Tier 3 (10 项)  →  Tier 4 (10 项)
基础技术          工业技术           高级技术           特殊/UI 技术
```

### 1.3 科技层级详情

#### Tier 1: 基础技术 (15 项)

| 科技 ID | 名称 | 效果 | 前置需求 |
|---------|------|------|----------|
| BasicMining | 基础采矿 | 矿井生产效率 +10% | 无 |
| AdvancedMining | 高级采矿 | 矿井生产效率 +25% | BasicMining |
| BasicLogging | 基础伐木 | 伐木场生产效率 +10% | 无 |
| AdvancedLogging | 高级伐木 | 伐木场生产效率 +25% | BasicLogging |
| BasicQuarrying | 基础采石 | 采石场生产效率 +10% | 无 |
| AdvancedQuarrying | 高级采石 | 采石场生产效率 +25% | BasicQuarrying |
| BasicSmelting | 基础冶炼 | 冶炼厂解锁 | 无 |
| AdvancedSmelting | 高级冶炼 | 冶炼厂生产效率 +20% | BasicSmelting |
| BasicAgriculture | 基础农业 | 农场生产效率 +10% | 无 |
| AdvancedAgriculture | 高级农业 | 农场生产效率 +25% | BasicAgriculture |
| BasicRefining | 基础精炼 | 精炼厂解锁 | 无 |
| AdvancedRefining | 高级精炼 | 精炼厂生产效率 +20% | BasicRefining |
| BasicChemistry | 基础化学 | 化工厂解锁 | 无 |
| AdvancedChemistry | 高级化学 | 化工厂生产效率 +20% | BasicChemistry |
| BasicEngineering | 基础工程 | 工厂生产效率 +15% | 无 |

#### Tier 2: 工业技术 (15 项)

| 科技 ID | 名称 | 效果 | 前置需求 |
|---------|------|------|----------|
| MassProduction | 大规模生产 | 所有生产 +10% | BasicEngineering |
| Automation | 自动化 | 自动化生产效率 +25% | MassProduction |
| Robotics | 机器人技术 | 工人效率 +15% | Automation |
| AdvancedRobotics | 高级机器人技术 | 工人效率 +30% | Robotics |
| Electronics | 电子技术 | 解锁电子组件生产 | BasicEngineering |
| AdvancedElectronics | 高级电子技术 | 电子组件生产 +25% | Electronics |
| ComputerTechnology | 计算机技术 | 解锁计算机系统生产 | AdvancedElectronics |
| AITechnology | 人工智能技术 | 解锁 AI 系统 | ComputerTechnology |
| AdvancedAI | 高级人工智能 | AI 系统效率 +50% | AITechnology |
| Nanotechnology | 纳米技术 | 解锁纳米制造 | AdvancedAI |
| AdvancedNanotech | 高级纳米技术 | 纳米工厂效率 +40% | Nanotechnology |
| Biotechnology | 生物技术 | 解锁生物工程 | BasicChemistry |
| GeneticEngineering | 基因工程 | 工人成长速度 +25% | Biotechnology |
| RenewableEnergy | 可再生能源 | 清洁能源生产 +30% | BasicEngineering |
| NuclearEnergy | 核能 | 解锁核反应堆 | AdvancedEngineering |

#### Tier 3: 高级技术 (10 项)

| 科技 ID | 名称 | 效果 | 前置需求 |
|---------|------|------|----------|
| QuantumComputing | 量子计算 | 计算资源 +100% | AdvancedAI |
| FusionEnergy | 聚变能源 | 能源生产 +200% | NuclearEnergy |
| AntimatterEnergy | 反物质能源 | 能源生产 +500% | FusionEnergy |
| SpaceExploration | 太空探索 | 解锁太空港 | AdvancedRobotics |
| Terraforming | 地球化改造 | 行星改造解锁 | SpaceExploration |
| TimeManipulation | 时间操控 | 时间加速 x2 | QuantumComputing |
| DimensionalTravel | 维度旅行 | 平行宇宙解锁 | TimeManipulation |
| ConsciousnessUpload | 意识上传 | 数字永生解锁 | AdvancedAI |
| Immortality | 永生技术 | 工人不死亡 | ConsciousnessUpload |
| Godhood | 神级技术 | 全能力 +1000% | 所有 Tier 3 科技 |

#### Tier 4: 特殊/UI 技术 (10 项)

| 科技 ID | 名称 | 效果 | 前置需求 |
|---------|------|------|----------|
| ClickEfficiency | 点击效率 | 点击收益 +50% | 无 |
| ResourceBoost | 资源增益 | 临时资源 x2 | 无 |
| ProductionMultiplier | 生产倍增 | 永久生产 +25% | 无 |
| CostReduction | 成本降低 | 购买成本 -15% | 无 |
| CriticalClick | 暴击点击 | 10% 几率 5 倍点击 | ClickEfficiency |
| AutoAssignment | 自动分配 | 解锁工人自动分配功能 | 无 |
| Prestige | 转世 | 解锁转生系统 | Godhood |
| Legacy | 遗产 | 转世后保留加成 | Prestige |
| Ascension | 飞升 | 解锁飞升系统 | Legacy |
| Omniscience | 全知 | 显示所有隐藏信息 | Ascension |

### 1.4 科技效果类型

```rust
pub enum TechnologyEffect {
    /// 生产加成：特定资源产量提升
    ProductionBonus(ResourceType, f64),
    
    /// 建筑解锁：解锁新建筑类型
    UnlockBuilding(BuildingType),
    
    /// UI 解锁：解锁新界面或功能
    UnlockUI,
    
    /// 机制变更：改变游戏机制
    MechanicChange(String),
}
```

### 1.5 科技研究流程

```
1. 玩家选择科技
       ↓
2. 检查前置条件 (dependencies_met)
       ↓
3. 检查资源是否足够 (can_afford)
       ↓
4. 扣除资源
       ↓
5. 标记科技为已购买 (purchased = true)
       ↓
6. 应用效果 (apply_effect)
       ↓
7. 解锁新内容
```

### 1.6 科技数据结构

```rust
pub struct Technology {
    pub id: TechnologyId,           // 唯一标识
    pub name: &'static str,         // 中文名称
    pub description: &'static str,  // 描述
    pub costs: HashMap<ResourceType, f64>,  // 多种资源成本
    pub dependencies: Vec<TechnologyId>,    // 前置科技
    pub effect: TechnologyEffect,   // 效果类型
    pub effect_value: f64,          // 效果值
    pub purchased: bool,            // 是否已购买
}
```

---

## 2. 工人系统

### 2.1 概述

工人系统是 Phase 2 的核心生产力系统。工人可以被分配到建筑工作，通过工作获得经验并升级，提升生产效率。

### 2.2 工人属性

```rust
pub struct Worker {
    pub name: String,                   // 工人姓名
    pub skills: String,                 // 技能描述
    pub background: String,             // 背景故事
    pub preferences: String,            // 偏好建筑
    pub assigned_building: Option<String>, // 分配的建筑
    pub level: u32,                     // 等级 (1+)
    pub efficiency_multiplier: f64,     // 效率倍率 (1.0 = 基础)
    pub xp: f64,                        // 当前经验值
    pub xp_to_next_level: f64,          // 升级所需经验
}
```

### 2.3 工人类型

| 工人名称 | 技能 | 偏好建筑 | 基础效率 |
|----------|------|----------|----------|
| 矿工 | mining | 金币矿山 | 1.0 |
| 伐木工 | logging | 伐木场 | 1.0 |
| 石匠 | masonry | 采石场 | 1.0 |
| 工厂工人 | factory | 金币工厂 | 1.0 |
| 高级工匠 | crafting | 石匠工坊 | 1.0 |

### 2.4 效率计算公式

```rust
// 基础效率
efficiency = 1.0

// 偏好加成 (分配至偏好建筑)
if assigned_building == preference {
    efficiency += 0.2  // +20%
}

// 等级加成 (每级 +5%)
efficiency += level * 0.05

// 最终效率
final_multiplier = efficiency
```

**示例**:
- 1 级工人，分配至偏好建筑：`1.0 + 0.2 + 0.05 = 1.25` (+25%)
- 10 级工人，分配至偏好建筑：`1.0 + 0.2 + 0.5 = 1.7` (+70%)
- 10 级工人，非偏好建筑：`1.0 + 0.5 = 1.5` (+50%)

### 2.5 经验系统

#### 经验获取

```rust
// 每秒经验获取
xp_gain = 10.0 * elapsed_seconds

// 仅当工人被分配至建筑时获得经验
if assigned_building.is_some() {
    worker.xp += xp_gain
}
```

#### 升级机制

```rust
// 升级检查
while worker.xp >= worker.xp_to_next_level {
    // 升级
    worker.level += 1
    
    // 重置经验
    worker.xp -= worker.xp_to_next_level
    
    // 下次升级经验需求增加 50%
    worker.xp_to_next_level = (worker.xp_to_next_level * 1.5).ceil()
    
    // 重新计算效率
    recalculate_efficiency()
}
```

#### 升级需求表

| 等级 | 升级所需经验 | 累计经验 | 效率加成 |
|------|-------------|---------|---------|
| 1→2 | 100 | 100 | +5% |
| 2→3 | 150 | 250 | +10% |
| 3→4 | 225 | 475 | +15% |
| 4→5 | 338 | 813 | +20% |
| 5→6 | 507 | 1320 | +25% |
| 6→7 | 761 | 2081 | +30% |
| 7→8 | 1142 | 3223 | +35% |
| 8→9 | 1713 | 4936 | +40% |
| 9→10 | 2570 | 7506 | +45% |
| 10→11 | 3855 | 11361 | +50% |

### 2.6 工人分配流程

```
1. 玩家选择工人
       ↓
2. 选择目标建筑
       ↓
3. 验证建筑存在
       ↓
4. 分配工人 (assigned_building = Some(building_id))
       ↓
5. 计算效率倍率
       ↓
6. 更新生产力
```

### 2.7 生产力计算

```rust
// 建筑基础产出
base_production = building.production_rate * building.count

// 获取工人加成
worker_bonus = get_worker_bonus_for_building(building_name)

// 最终产出
boosted_production = base_production * worker_bonus

// 工人加成计算
fn get_worker_bonus_for_building(building_name: &str) -> f64 {
    let mut total_bonus = 1.0;
    for worker in &workers {
        if worker.assigned_building == Some(building_name) {
            total_bonus += worker.efficiency_multiplier - 1.0;
        }
    }
    total_bonus
}
```

---

## 3. 生死循环系统

### 3.1 概述

生死循环系统是 Phase 2 的核心生存机制。工人需要定期消耗食物，否则会饥饿并最终死亡。死亡的工人会变成尸体，尸体可以分解为资源。

### 3.2 食物消耗机制

#### 常量定义

```rust
const FOOD_CONSUMPTION_INTERVAL: f64 = 5.0;    // 每 5 秒消耗一次食物
const FOOD_PER_WORKER: f64 = 1.0;              // 每个工人每次消耗 1 食物
const STARVATION_DEATH_THRESHOLD: f64 = 30.0;  // 饥饿 30 秒后死亡
```

#### 食物消耗流程

```rust
// 检查是否到达消耗间隔
if current_time - last_consumption < FOOD_CONSUMPTION_INTERVAL {
    return 0;  // 未到时间，跳过
}

// 更新最后消耗时间
last_consumption = current_time;

// 计算食物需求
let worker_count = workers.len() as f64;
let food_needed = worker_count * FOOD_PER_WORKER;

// 检查食物储备
if current_food >= food_needed {
    // 食物充足，扣减食物
    resources.insert(Food, current_food - food_needed);
    
    // 清除工人饥饿状态
    for worker in workers {
        worker.is_hungry = false;
        worker.starvation_start_time = 0.0;
    }
} else {
    // 食物不足
    resources.insert(Food, 0.0);
    
    // 所有工人进入饥饿状态
    for worker in workers {
        worker.is_hungry = true;
        if worker.starvation_start_time == 0.0 {
            worker.starvation_start_time = current_time;
        }
    }
}
```

### 3.3 饥饿状态

#### 状态转换

```
正常状态
    ↓ (食物不足)
饥饿状态 (is_hungry = true, starvation_start_time = current_time)
    ↓ (持续 30 秒)
死亡 (生成尸体，从工人列表移除)
```

#### 饥饿持续时间计算

```rust
fn get_starvation_duration(worker: &Worker, current_time: f64) -> f64 {
    if worker.starvation_start_time > 0.0 {
        current_time - worker.starvation_start_time
    } else {
        0.0  // 未处于饥饿状态
    }
}
```

### 3.4 死亡机制

#### 死亡判定

```rust
// 每帧检查工人死亡
for worker in workers.iter_mut() {
    if worker.is_hungry {
        let starvation_duration = get_starvation_duration(worker, current_time);
        
        if starvation_duration >= STARVATION_DEATH_THRESHOLD {
            // 工人死亡
            deaths += 1;
            
            // 生成尸体
            resources.insert(Corpse, current_corpses + 1.0);
            
            // 记录尸体开始腐烂时间
            corpse_decay_time = current_time;
            
            // 从工人列表移除
            indices_to_remove.push(worker_index);
        }
    }
}
```

#### 死亡后果

1. **工人损失**: 工人从列表中永久移除
2. **尸体生成**: 每死亡 1 个工人生成 1 个尸体
3. **生产力下降**: 分配的建筑失去工人加成

### 3.5 尸体系统

#### 尸体作为资源

```rust
// 尸体是一种可收集资源
ResourceType::Corpse

// 尸体可以用于:
// 1. 分解为其他资源
// 2. 复活工人 (未来功能)
// 3. 特殊配方材料
```

#### 尸体腐烂机制

```rust
// 尸体在生成后开始腐烂
// 腐烂后可用于特殊配方
if current_time - corpse_decay_time > DECAY_THRESHOLD {
    // 尸体变为"腐烂尸体"
    // 可能产生负面效果或特殊用途
}
```

### 3.6 人口循环流程图

```
┌─────────────┐
│  新工人诞生  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 分配至建筑  │
└──────┬──────┘
       │
       ↓
┌─────────────┐     是      ┌─────────────┐
│  每 5 秒检查   │──────────→│  消耗食物    │
│  食物需求    │           └──────┬──────┘
└──────┬──────┘                  │
       │                        │ 食物充足
       │ 否                     ↓
       │                ┌─────────────┐
       │                │  清除饥饿   │
       │                │  状态      │
       │                └─────────────┘
       ↓
┌─────────────┐
│  进入饥饿   │
│  状态      │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 记录饥饿开始 │
│  时间      │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 持续检查    │
│  饥饿时长  │
└──────┬──────┘
       │
       │ 饥饿 >= 30 秒
       ↓
┌─────────────┐
│   工人死亡  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  生成尸体   │
│  (+1 Corpse)│
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  从列表移除  │
└─────────────┘
```

### 3.7 工人数据结构 (扩展)

```rust
pub struct Worker {
    // 基础属性
    pub name: String,
    pub skills: String,
    pub background: String,
    pub preferences: String,
    
    // 工作状态
    pub assigned_building: Option<String>,
    pub level: u32,
    pub efficiency_multiplier: f64,
    pub xp: f64,
    pub xp_to_next_level: f64,
    
    // 生死循环属性
    pub gender: Gender,                    // 性别
    pub hobbies: Vec<Hobby>,               // 爱好
    pub traits: Vec<Trait>,                // 特质
    pub skill_level: u32,                  // 技能等级
    pub mood: f64,                         // 心情 (0-100)
    pub health: f64,                       // 健康 (0-100)
    pub starvation_start_time: f64,        // 饥饿开始时间
    pub is_hungry: bool,                   // 是否饥饿
}
```

---

## 4. 住房系统

### 4.1 概述

住房系统允许玩家建造和升级住房建筑，提供人口容量上限。住房是人口增长的前提条件。

### 4.2 住房数据结构

```rust
pub struct Housing {
    pub name: String,                      // 住房名称 (e.g., "住房 1", "住房 2")
    pub cost: HashMap<String, f64>,        // 建造成本 (多种资源)
    pub capacity: u32,                     // 人口容量
    pub count: u32,                        // 升级次数/等级
}
```

### 4.3 建造机制

#### 建造流程

```rust
pub fn build_housing(&mut self, cost: JsValue) -> Result<bool, String> {
    // 1. 解析成本
    let cost_map: HashMap<String, f64> = serde_wasm_bindgen::from_value(cost)?;
    
    // 2. 验证成本不为空
    if cost_map.is_empty() {
        return Err("Cost cannot be empty".to_string());
    }
    
    // 3. 检查资源是否足够
    let can_afford = {
        let state = self.state.borrow();
        for (resource, amount) in cost_map.iter() {
            let current = match resource.as_str() {
                "Gold" => state.get_coins(),
                "Wood" => state.get_wood(),
                "Stone" => state.get_stone(),
                _ => return Err(format!("Unknown resource: {}", resource)),
            };
            if current < *amount {
                return Err(format!("Insufficient {}", resource));
            }
        }
        true
    };
    
    if !can_afford {
        return Ok(false);
    }
    
    // 4. 扣除资源
    {
        let mut state = self.state.borrow_mut();
        for (resource, amount) in cost_map.iter() {
            match resource.as_str() {
                "Gold" => state.spend_coins(*amount),
                "Wood" => state.spend_wood(*amount),
                "Stone" => state.spend_stone(*amount),
                _ => return Err(format!("Unknown resource: {}", resource)),
            }
        }
    }
    
    // 5. 创建新住房
    let housing_name = format!("住房{}", self.housing_buildings.len() + 1);
    let total_capacity: u32 = cost_map.values().map(|&v| v as u32).sum();
    let new_housing = Housing::new(&housing_name, cost_map.clone(), total_capacity);
    self.housing_buildings.push(new_housing);
    
    // 6. 更新统计
    self.statistics.borrow_mut().buildings_purchased += 1;
    
    Ok(true)
}
```

#### 建造成本示例

| 住房等级 | 金币 | 木材 | 石材 | 总容量 |
|----------|------|------|------|--------|
| 住房 1 | 100 | 50 | 25 | 175 |
| 住房 2 | 150 | 75 | 40 | 265 |
| 住房 3 | 200 | 100 | 50 | 350 |

### 4.4 升级机制

#### 升级成本公式

```rust
pub fn get_upgrade_cost(&self) -> HashMap<String, f64> {
    let mut upgrade_cost = HashMap::new();
    
    // 成本按等级指数增长：base_cost * 1.5^count
    let multiplier = 1.5_f64.powi(self.count as i32);
    
    for (resource, &base_amount) in self.cost.iter() {
        upgrade_cost.insert(resource.clone(), base_amount * multiplier);
    }
    
    upgrade_cost
}
```

#### 升级成本示例

假设基础成本：金币 100, 木材 50, 石材 25

| 等级 |  multiplier | 金币 | 木材 | 石材 |
|------|------------|------|------|------|
| 0→1 | 1.0 | 100 | 50 | 25 |
| 1→2 | 1.5 | 150 | 75 | 38 |
| 2→3 | 2.25 | 225 | 113 | 56 |
| 3→4 | 3.375 | 338 | 169 | 84 |
| 4→5 | 5.063 | 506 | 253 | 127 |
| 5→6 | 7.594 | 759 | 380 | 190 |

#### 升级流程

```rust
pub fn upgrade_housing(&mut self, building_index: usize) -> Result<bool, String> {
    // 1. 验证索引有效
    if building_index >= self.housing_buildings.len() {
        return Err(format!("Invalid housing index: {}", building_index));
    }
    
    // 2. 获取升级成本
    let upgrade_cost = {
        let housing = &self.housing_buildings[building_index];
        housing.get_upgrade_cost()
    };
    
    // 3. 检查资源是否足够
    let can_afford = {
        let state = self.state.borrow();
        for (resource, amount) in upgrade_cost.iter() {
            let current = match resource.as_str() {
                "Gold" => state.get_coins(),
                "Wood" => state.get_wood(),
                "Stone" => state.get_stone(),
                _ => return Err(format!("Unknown resource: {}", resource)),
            };
            if current < *amount {
                return Err(format!("Insufficient {}", resource));
            }
        }
        true
    };
    
    if !can_afford {
        return Ok(false);
    }
    
    // 4. 扣除资源
    {
        let mut state = self.state.borrow_mut();
        for (resource, amount) in upgrade_cost.iter() {
            match resource.as_str() {
                "Gold" => state.spend_coins(*amount),
                "Wood" => state.spend_wood(*amount),
                "Stone" => state.spend_stone(*amount),
                _ => return Err(format!("Unknown resource: {}", resource)),
            }
        }
    }
    
    // 5. 升级住房
    {
        let housing = &mut self.housing_buildings[building_index];
        housing.upgrade();  // count += 1
    }
    
    // 6. 更新统计
    self.statistics.borrow_mut().buildings_purchased += 1;
    
    Ok(true)
}
```

### 4.5 住房与人口关系

```
总住房容量 = Σ(housing.capacity * (housing.count + 1))

当前人口 ≤ 总住房容量

// 如果人口达到上限:
// - 无法招募新工人
// - 需要建造更多住房
```

### 4.6 住房系统流程图

```
┌─────────────┐
│  玩家点击   │
│  建造住房  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  解析成本   │
│  (多种资源) │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  检查资源   │
│  是否足够  │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
  是       否
   │       │
   ↓       ↓
┌─────┐  ┌───────┐
│扣除 │  │返回   │
│资源 │  │失败   │
└──┬──┘  └───────┘
   │
   ↓
┌─────────────┐
│ 创建新住房  │
│ 生成唯一名称│
│ 计算总容量  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 加入住房列表│
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 更新统计    │
│ buildings++ │
└─────────────┘
```

---

## 5. 平衡参数

### 5.1 概述

本节列出 Phase 2 所有核心平衡参数，用于调整游戏难度和进度节奏。

### 5.2 工人系统参数

| 参数 | 值 | 说明 |
|------|-----|------|
| BASE_XP_GAIN | 10.0/秒 | 工人每秒基础经验获取 |
| XP_TO_LEVEL_2 | 100 | 从 1 级升到 2 级所需经验 |
| XP_SCALING_FACTOR | 1.5 | 每级经验需求增长倍率 |
| PREFERENCE_BONUS | 0.2 (+20%) | 偏好建筑的效率加成 |
| LEVEL_BONUS_PER_LEVEL | 0.05 (+5%) | 每级提供的效率加成 |

### 5.3 生死循环参数

| 参数 | 值 | 说明 |
|------|-----|------|
| FOOD_CONSUMPTION_INTERVAL | 5.0 秒 | 食物消耗间隔 |
| FOOD_PER_WORKER | 1.0 | 每个工人每次消耗食物量 |
| STARVATION_DEATH_THRESHOLD | 30.0 秒 | 饥饿导致死亡的时间阈值 |
| CORPSE_PER_DEATH | 1.0 | 每个死亡工人生成的尸体数量 |

### 5.4 住房系统参数

| 参数 | 值 | 说明 |
|------|-----|------|
| BASE_HOUSING_COST_MULTIPLIER | 1.0 | 基础住房成本倍率 |
| UPGRADE_COST_SCALING | 1.5^level | 升级成本指数增长公式 |
| CAPACITY_PER_RESOURCE | 1 | 每单位成本提供的人口容量 |

### 5.5 科技系统参数

#### 成本参数

| 科技层级 | 基础金币成本 | 成本增长率 |
|----------|-------------|-----------|
| Tier 1 | 50-200 | 15%/级 |
| Tier 2 | 200-1000 | 20%/级 |
| Tier 3 | 1000-5000 | 25%/级 |
| Tier 4 | 5000-50000 | 30%/级 |

#### 效果参数

| 效果类型 | 基础值 | 最大值 | 说明 |
|----------|--------|--------|------|
| ProductionBonus | +10% | +100% | 生产加成 |
| ClickEfficiency | +10% | +200% | 点击效率 |
| CostReduction | -5% | -50% | 成本降低 |
| WorkerEfficiency | +5% | +50% | 工人效率 |

### 5.6 生产力计算公式

```rust
// 建筑总产出
total_production = base_rate * building_count * worker_bonus * tech_bonus

// 工人加成
worker_bonus = 1.0 + Σ(worker.efficiency_multiplier - 1.0)

// 科技加成
tech_bonus = 1.0 + Σ(technology.effect_value)

// 完整公式
final_production = base_rate 
                 * building_count 
                 * (1.0 + preference_bonus + level_bonus) 
                 * (1.0 + technology_bonus)
```

### 5.7 资源转换比率

#### 基础资源价值

| 资源 | 基础价值 (金币) | 说明 |
|------|----------------|------|
| 金币 (Gold) | 1.0 | 基础货币 |
| 木材 (Wood) | 0.5 | 基础材料 |
| 石材 (Stone) | 1.0 | 基础材料 |
| 食物 (Food) | 0.2 | 消耗品 |
| 尸体 (Corpse) | 0.1 | 特殊资源 |

#### 转换配方

| 配方 | 输入 | 输出 | 比率 |
|------|------|------|------|
| 金币→木材 | 100 Gold | 10 Wood | 10:1 |
| 木材→金币 | 10 Wood | 100 Gold | 1:10 |
| 金币→石材 | 100 Gold | 1 Stone | 100:1 |
| 石材→金币 | 1 Stone | 100 Gold | 1:100 |
| 木材→石材 | 10 Wood | 1 Stone | 10:1 |
| 石材→木材 | 1 Stone | 10 Wood | 1:10 |

### 5.8 升级成本公式

#### 建筑升级

```rust
new_cost = base_cost * (1.15 ^ count)
```

#### 升级购买

```rust
new_cost = base_cost * (1.5 ^ owned)
```

#### 住房升级

```rust
upgrade_cost = base_cost * (1.5 ^ level)
```

### 5.9 平衡调整指南

#### 难度调整

**降低难度**:
- 减少食物消耗量 (FOOD_PER_WORKER: 1.0 → 0.5)
- 增加饥饿死亡时间 (STARVATION_DEATH_THRESHOLD: 30 → 60)
- 增加基础 XP 获取 (BASE_XP_GAIN: 10 → 15)

**提高难度**:
- 增加食物消耗量 (FOOD_PER_WORKER: 1.0 → 2.0)
- 减少饥饿死亡时间 (STARVATION_DEATH_THRESHOLD: 30 → 15)
- 减少科技效果值 (effect_value: 0.5 → 0.25)

#### 进度调整

**加快进度**:
- 降低科技成本 (cost * 0.8)
- 提高工人效率加成 (LEVEL_BONUS: 0.05 → 0.1)
- 降低住房升级成本 (UPGRADE_COST_SCALING: 1.5 → 1.3)

**减慢进度**:
- 提高科技成本 (cost * 1.5)
- 降低工人效率加成 (LEVEL_BONUS: 0.05 → 0.025)
- 提高住房升级成本 (UPGRADE_COST_SCALING: 1.5 → 2.0)

### 5.10 参数配置文件结构

```rust
pub struct GameBalanceConfig {
    // 工人
    pub worker_base_xp_gain: f64,
    pub worker_xp_scaling: f64,
    pub worker_preference_bonus: f64,
    pub worker_level_bonus: f64,
    
    // 生死循环
    pub food_consumption_interval: f64,
    pub food_per_worker: f64,
    pub starvation_death_threshold: f64,
    
    // 住房
    pub housing_upgrade_scaling: f64,
    
    // 科技
    pub tech_cost_scaling_tier1: f64,
    pub tech_cost_scaling_tier2: f64,
    pub tech_cost_scaling_tier3: f64,
    pub tech_cost_scaling_tier4: f64,
}
```

---

## 附录 A: 相关文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 科技系统 | `src/systems/technology.rs` | 科技树逻辑 |
| 科技实体 | `src/entities/technology.rs` | 科技定义 |
| 工人实体 | `src/entities/worker.rs` | 工人定义 |
| 人口系统 | `src/systems/population.rs` | 食物消耗/死亡逻辑 |
| 住房实体 | `src/entities/building.rs` | Housing 结构 |
| 游戏核心 | `src/core/idle_game.rs` | 整合所有系统 |

---

## 附录 B: 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 0.2.6 | 2026-02-22 | 初始 Phase 2 文档 |
| 0.2.5 | 2026-02-11 | Phase 1 完成 |

---

**文档结束**
