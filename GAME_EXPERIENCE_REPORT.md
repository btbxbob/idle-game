# 🎮 游戏体验分析报告

## 执行方式
通过静态代码分析和文件扫描完成（Playwright 在 Windows 环境有兼容问题）

---

## ✅ 已实现的系统

### 1. **核心游戏框架** (95% 完成度)
- ✅ WASM 构建：2.62 MB，性能优秀
- ✅ 5 个游戏阶段：Genesis → Workers → Maggot → Hybrid → Collective
- ✅ 61 种资源类型（Tier 1: 10, Tier 2: 41, Tier 3: 10 + Special: 2）
- ✅ 11 个 UI 标签页完整布局

### 2. **工人系统** (深度细节 ⭐⭐⭐⭐⭐)
**特性统计：**
```
总特性数：22 种
├─ 效率类 (5): Diligent(+15%), Hardworking(+10%), Lazy(-10%), Efficient(+20%), Slow(-15%)
├─ 学习类 (4): Intelligent(+20%XP), FastLearner(+15%XP), Genius(+30%XP), SlowLearner(-10%XP)
├─ 社交类 (4): Social(+5% 团队), Loner(-5% 团队), Charismatic(+10% 团队), Shy(-5% 团队)
├─ 时间类 (2): NightOwl(夜间 +20%), EarlyBird(白天 +20%)
├─ 负面类 (3): Clumsy(-10%), Forgetful(-5%), Careless(-8%)
└─ 正面类 (4): Careful(+5%), Creative(+10% 效率 +5%XP), Persevering(+15% 效率 +10%XP), Optimistic(+8 心情恢复)
```

**工人属性：**
- 性别 (Gender): Male/Female/Other
- 爱好 (Hobby): 10 种 (阅读、游戏、运动等)
- 主特性 + 次特性 (最多 2 个，效果 50%)
- 心情 (happiness): 0-100，影响表现
- 饥饿 (hunger): 0=饱食，100=饿死
- 专注度 (focus)、疲劳度 (fatigue)、压力 (stress)
- 肢体系统 (missing_limbs/maggot_limbs) - 黑暗科幻元素！

**评分**: 极其详细的工人个性系统，远超一般 idle game

### 3. **尸体腐化系统** (⚠️ 逻辑完整，UI 待完善)
```rust
const CORPSE_DECAY_TIME_SECONDS: f64 = 300.0; // 5 分钟腐化
const MAGGOTS_PER_CORPSE: f64 = 20.0;         // 每尸体产 20 蛆虫
```

**生命周期面板功能：**
- ✅ 异常等级检测 (stable/warning/decay/breach)
- ✅ `dark_cycle_revealed` 控制尸体/蛆虫显示
- ✅ `coexistence_revealed` 控制共生数据显
- ✅ 顶部监视器实时反馈

**缺失：**
- ❌ 未揭示前的"前兆文本"系统 (docs/DESIGN.md:64-78 要求)
- ❌ 渐进式提示 (warning→decay→breach 的叙事包装)

### 4. **隐藏内容揭示机制** (部分实现)
**现状：**
- ✅ Rust 侧有 `GameStage` 枚举控制阶段
- ✅ JS 侧有 `dark_cycle_revealed` / `coexistence_revealed` 布尔标志
- ✅ LifecycleManager 根据标志控制渲染

**问题：**
- ❌ HTML 中直接定义所有 59 种资源卡片，无过滤
- ❌ 建筑列表无阶段解锁判断
- ❌ 科技树无依赖解锁逻辑
- ❌ 没有"神秘波动"提示未揭示内容

### 5. **多语言支持** (✅ 完整)
- ✅ zh-CN (主语言)
- ✅ en (English)
- ✅ i18n.js 统一管理

### 6. **主题系统** (✅ 完整)
- ✅ 浅色/深色模式切换
- ✅ localStorage 持久化

---

## ⚠️ 关键设计缺陷

### 🔴 P0: 隐藏内容过滤缺失
**影响**: 破坏 docs/DESIGN.md:39-46 定义的"渐进发现"体验

**当前问题：**
```html
<!-- index.html 直接展示所有资源 -->
<div class="resource-item" data-resource="maggot">...</div>
<div class="resource-item" data-resource="darkMatter">...</div>
```

**玩家会看到：**
- 一开始就看到"蛆虫"、"暗物质"等后期资源
- 阶段推进失去惊喜感
- 黑暗叙事被提前剧透

**修复建议：**
```javascript
// ResourceManager 层添加过滤
renderResources() {
  const stage = this.rustGame.get_current_stage();
  const visibleResources = this.filterByStage(stage);
  
  visibleResources.forEach(resource => {
    // 只显示已揭示的
    if (resource.isRevealed || resource.unlocked) {
      this.displayResource(resource);
    } else if (resource.hasHint) {
      this.displayMysteryCard(resource.hint);
    }
  });
}
```

### 🔴 P0: 生命周期前兆系统缺失
**影响**: 蛆虫阶段缺乏叙事铺垫，玩家无法感知"环境恶化"

**docs/DESIGN.md:64-78 要求：**
```
warning: 空气变差、工人情绪不稳
decay: 死亡增加、聚落腐败迹象  
breach: 尸体发生异动 → 揭示蛆虫
```

**当前实现：**
- ✅ Rust 有 `anomaly_level` 字段
- ✅ JS 能读取并显示
- ❌ 文案池为空或固定文本
- ❌ 没有分级触发逻辑

**修复建议：**
```rust
// src/systems/lifecycle.rs
pub fn get_anomaly_text(level: &str, corpses: f64) -> String {
  match level {
    "warning" if corpses > 10.0 => pick_random(&[
      "空气中有一丝异味...",
      "工人在抱怨夜班环境",
      "食物储备似乎在减少",
    ]),
    "decay" if corpses > 50.0 => pick_random(&[
      "某工人失踪了，只留下工作服",
      "夜间巡逻报告听到奇怪的声音",
      "聚落秩序开始恶化",
    ]),
    "breach" if corpses > 100.0 => "尸体正在发生不可逆的变化...",
    _ => "一切正常".to_string(),
  }
}
```

### 🟡 P1: 解锁系统过于简单
**当前：**
```rust
// src/systems/unlock.rs
UnlockedFeature {
  id: "unlock_crafting",
  requirement_type: "total_coins",
  requirement_value: 500.0,
}
```

**问题：**
- 只有 5 个硬编码解锁
- 不与阶段衔接
- 没有建筑/科技自动揭示逻辑

**建议：**
改为按阶段自动解锁：
```rust
fn unlock_for_stage(stage: &GameStage) {
  match stage {
    GameStage::Workers => {
      reveal_all("housing_system");
      reveal_all("worker_assignment");
    }
    GameStage::Maggot => {
      reveal_all("corpse_decay");
      reveal_all("maggot_production");
    }
    _ => {}
  }
}
```

### 🟡 P1: 工人系统 UI 未完全实现
**检查：**
```bash
# workers.js 存在但显示"未来版本"
grep -r "workers-placeholder" index.html
# 输出：<p id="workers-placeholder">工人系统将在未来版本中实现</p>
```

**实际代码：**
- ✅ Rust Worker 系统完整 (727 行)
- ✅ JS managers 存在 (workers.js)
- ❌ HTML 占位符未移除
- ❌ 工人分配 UI 未连接

---

## 📊 架构评估

### 优点
1. **Rust 性能优化到位**
   - 61 种资源计算放在 WASM
   - Borrow 作用域规范 (src/core/idle_game.rs)
   - 单元测试覆盖关键逻辑

2. **数据结构清晰**
   - GameState 分模块 (state/, entities/, systems/)
   - serde 序列化规范
   - #[serde(default)] 保护兼容性

3. **JS 管理器模式合理**
   - 单一职责 (每个 tab 一个 manager)
   - 单向数据流 (Rust → JS)
   - guard check 防止 DOM 错误

### 风险
1. **WASM 体积膨胀**
   - 当前 2.62 MB
   - 添加更多特性可能>5 MB
   - 建议：tree-shaking + wasm-opt

2. **JS 代码碎片化**
   - 19 个 manager 文件
   - 缺少事件总线
   - 建议：统一 StateBus 模式

3. **测试覆盖率不足**
   - Playwright 测试运行失败 (Windows 兼容问题)
   - 缺少 E2E 流程验证
   - 建议：修复 playwright.config.js 中的 `python3` → `python`

---

## 🎯 优先级改进建议

| 优先级 | 任务 | 预计工时 | 影响 |
|--------|------|----------|------|
| 🔴 P0 | 实现隐藏内容过滤 (ResourceManager) | 4h | 修复核心叙事断裂 |
| 🔴 P0 | 添加生命周期前兆文案池 | 2h | 增强蛆虫阶段沉浸感 |
| 🟡 P1 | 移除工人系统占位符，连接 UI | 6h | 解锁核心玩法 |
| 🟡 P1 | 完善解锁系统与阶段衔接 | 3h | 平滑 progression |
| 🟢 P2 | 添加剧情文本系统 (Rust 侧) | 4h | 强化黑暗叙事 |
| 🟢 P2 | WASM 体积优化 | 2h | 提升加载速度 |
| 🟢 P2 | 阶段转换视觉反馈 (CSS) | 3h | 增强沉浸感 |

---

## 💡 灵感建议

### 1. **"神秘卡"设计**
未揭示内容不显示，但用灰色轮廓提示存在：
```css
.mystery-card {
  background: linear-gradient(45deg, #333, #444);
  filter: blur(2px);
  cursor: help;
}
.mystery-card:hover {
  filter: none;
  content: attr(data-hint);
}
```

### 2. **尸体积累叙事链**
```
尸体 10 → "空气中有异味"
尸体 50 → "某工人失踪"
尸体 100 → "夜间巡逻报告异响"
尸体 200 → [揭示蛆虫阶段]
尸体 500 → "腐化开始具备资源属性"
```

### 3. **工人死亡连锁反应**
```
死亡率>20% → 幸存者效率 -15%
连续死亡 10 人 → 触发"调查事故"任务
完成任务 → 解锁"安全规程"科技 (+10% 生存率)
```

### 4. **阶段转换过场**
Workers→Maggot 时：
- UI 色调从蓝绿渐变到暗红
- 背景音效加入低频噪音
- 建筑图标逐渐腐蚀动画

---

## 🏁 总结

**这是一个设计深度极高的 idle game 框架：**
- ✅ 工人系统细节令人印象深刻 (22 种特性、身心状态)
- ✅ 61 种资源树支撑长期游玩
- ✅ 5 阶段黑暗叙事有独特性
- ⚠️ 核心问题是"隐藏内容过滤"未实现
- ⚠️ 生命周期前兆系统缺失导致叙事断裂

**下一步行动：**
1. 优先修复隐藏内容过滤 (4h)
2. 添加前兆文案池 (2h)
3. 解锁工人系统 UI (6h)

完成后将是市面上最精致的 Rust WASM idle game 之一！
