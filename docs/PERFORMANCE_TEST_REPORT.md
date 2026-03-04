# 性能压力测试报告

**测试日期**: 2026-02-22  
**测试文件**: `tests/performance-stress-test.test.js`  
**测试类型**: 极端场景性能压力测试

## 测试目标

### 场景配置
- **工人数量**: 1000 个
- **科技数量**: 50 个（全解锁）
- **住房数量**: 100 个
- **运行时间**: 10 分钟

### 性能指标目标
- **FPS**: ≥ 60
- **内存**: < 500MB
- **UI 响应时间**: < 100ms

## 测试内容

### 1. 极端数据创建
- 通过调试模式快速注入大量资源
- 批量创建 1000 名工人
- 建造 100 个住房建筑
- 解锁 50 项科技

### 2. 性能监控
- **FPS 监控**: 每秒记录一次帧率
- **UI 响应**: 每次点击操作的响应时间
- **内存使用**: JavaScript 堆内存占用
- **错误检测**: 运行时错误监控

### 3. 验证点
- 平均 FPS ≥ 55（允许小幅度波动）
- UI 响应时间 < 100ms
- 内存占用 < 500MB
- 至少成功创建 500 名工人
- 至少成功建造 50 个住房

## 测试文件

### 完整压力测试 (10 分钟)
- **文件**: `tests/performance-stress-test.test.js`
- **超时时间**: 600000ms (10 分钟)
- **测试名**: `extreme scenario - 1000 workers, 50 techs, 100 housing`

### 快速测试 (2 分钟)
- **文件**: `tests/performance-quick-test.test.js`
- **超时时间**: 120000ms (2 分钟)
- **测试名**: `basic performance check`
- **简化场景**: 100 工人，基础性能监控

## 运行方法

### 方法 1: 完整压力测试
```bash
# 确保服务器在运行
python3 server.py

# 运行完整测试
npx playwright test performance-stress-test.test.js --reporter=list
```

### 方法 2: 快速测试
```bash
# 确保服务器在运行
python3 server.py

# 运行快速测试
npx playwright test performance-quick-test.test.js --reporter=list
```

### 方法 3: 生成 HTML 报告
```bash
npx playwright test performance-stress-test.test.js --reporter=html
# 报告生成在 playwright-report/ 目录
```

## 测试步骤详解

### 阶段 1: 初始化 (5 秒)
```javascript
- 加载游戏页面
- 等待 WASM 初始化完成
- 启动 FPS 监控
```

### 阶段 2: 资源注入 (10 秒)
```javascript
- 切换到 Debug 标签
- 点击 "Add 1000 Coins" 100 次
- 获得 100,000 金币用于测试
```

### 阶段 3: 工人创建 (30-60 秒)
```javascript
- 切换到 Workers 标签
- 批量点击招募按钮
- 每次点击招募 50 名工人
- 目标：1000 名工人
```

### 阶段 4: 住房建造 (30-60 秒)
```javascript
- 切换到 Housing 标签
- 购买住房建筑
- 每 10 次暂停补充资源
- 目标：100 个住房
```

### 阶段 5: 科技解锁 (30-60 秒)
```javascript
- 切换到 Technology 标签
- 批量解锁科技
- 最多尝试 5 轮
- 目标：50 项科技
```

### 阶段 6: 性能监控 (10 分钟)
```javascript
- 每 30 秒检查一次性能
- 记录 FPS、内存、UI 响应
- 验证游戏状态有效性
- 检测运行时错误
```

## 预期结果

### 性能指标
```
平均 FPS:           58-62
最低 FPS:           45-55
UI 响应时间：       20-80ms
内存占用：          200-400MB
```

### 数据验证
```
工人创建：          ≥ 500
住房建造：          ≥ 50
科技解锁：          ≥ 20
无运行时错误
```

## 性能优化建议

### 如果发现 FPS 下降
1. 减少同时渲染的 DOM 元素数量
2. 优化工人列表虚拟化渲染
3. 降低游戏循环更新频率（从 1000ms 调整）
4. 减少 CSS 重计算和重绘

### 如果内存过高
1. 检查内存泄漏（定时器、事件监听器）
2. 优化 JavaScript 对象创建/销毁
3. 使用 WeakMap/WeakSet 管理缓存
4. 定期清理无用数据

### 如果 UI 响应慢
1. 减少 DOM 操作频率
2. 使用 requestAnimationFrame 批量更新
3. 优化事件处理函数
4. 避免同步的强制布局

## 监控工具

### 浏览器 DevTools
```javascript
// Chrome DevTools Performance 面板
- 记录性能时间线
- 分析 FPS 波动
- 查看内存分配

// Console 命令
performance.memory.usedJSHeapSize  // JS 堆内存
performance.memory.totalJSHeapSize // 总堆内存
```

### Playwright 性能 API
```javascript
// 获取性能指标
const metrics = await page.metrics();
console.log(metrics.JSHeapUsedSize);

// 追踪性能时间线
await page.tracing.start({ path: 'trace.json' });
// ... 执行操作 ...
await page.tracing.stop();
```

## 已知限制

1. **浏览器限制**: 性能.memory 仅在 Chrome 中可用
2. **时间限制**: 完整测试需要 10 分钟，可能需要调整超时
3. **资源依赖**: 需要足够的初始资源才能创建大量实体
4. **端口冲突**: 确保 8080 端口未被占用

## 故障排除

### 问题：服务器无法启动
```bash
# 检查端口占用
netstat -ano | findstr :8080

# 杀死占用端口的进程
taskkill /PID <PID> /F
```

### 问题：测试超时
```javascript
// 增加超时时间
test.setTimeout(900000); // 15 分钟
```

### 问题：资源不足
```javascript
// 增加调试模式注入的资源数量
for (let i = 0; i < 200; i++) { // 从 100 增加到 200
    await addCoinsBtn.click();
}
```

## 结论

本性能压力测试旨在验证游戏在极端负载下的表现。通过创建大量工人、住房和科技，模拟真实的高负载场景，并监控关键性能指标。

测试通过标准：
- ✅ FPS 稳定在 55 以上
- ✅ UI 响应时间小于 100ms  
- ✅ 内存占用低于 500MB
- ✅ 无严重运行时错误

**测试状态**: 已创建，等待手动运行
