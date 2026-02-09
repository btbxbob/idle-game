# Changelog

## [0.1.0] - 2026-02-09

### Added
- 基础的闲置游戏框架（Rust + WebAssembly + JavaScript）
- 点击获取金币机制
- 升级系统（Better Click, Autoclicker Lv1）
- 建筑系统（Coin Mine, Coin Factory, Coin Corporation）
- 自动金币生成系统
- 响应式 UI 设计

### Fixed
- **Buy按钮实时响应问题**：分离UI更新逻辑，避免不必要的DOM重绘
- **Firefox购买失败问题**：修复浮点数精度比较问题
- **购买失败后游戏停止工作**：修复RefCell借用冲突问题
- **视觉反馈**：购买失败时提供动画反馈

### Testing
- 添加Playwright自动化测试
- 跨浏览器兼容性测试（Chromium, Firefox, Webkit）
- 修复验证测试用例

### Development
- 完善AGENTS.md开发指南
- 优化构建和测试流程
- 改进代码结构和可维护性

### Known Issues
- 无已知的重大问题

[0.1.0]: https://github.com/your-username/idle-game/releases/tag/v0.1.0