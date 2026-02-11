# Rust WASM Idle Game Framework

这是一个使用 Rust 和 WebAssembly 构建的闲置游戏（idle game）完整框架。该框架提供了核心的游戏机制，包括多资源系统、多语言支持和现代化界面。

## 特性

- 基于 Rust 和 WebAssembly 的高性能游戏引擎
- **多资源系统**: 金币、木头、石头三种资源
- **自动资源生成系统**: 建筑和升级提供自动生产
- **点击获取资源机制**: 手动点击赚取金币
- **升级系统**: 提升生产力和点击收益
- **建筑系统**: 多种建筑类型，每种产生不同资源
- **多标签页界面**: 资源、升级、建筑、工人、设置
- **多语言支持**: 简体中文（主语言）、英语
- **ASCII艺术风格**: 白底黑字，终端风格视觉效果
- **跨浏览器兼容**: Chromium、Firefox、Webkit
- **完整测试覆盖**: Playwright端到端测试

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

### 本地运行
构建成功后，使用内置的 Python 服务器运行游戏：

```bash
python server.py
```

然后在浏览器中打开 `http://localhost:8080` 来玩游戏。

### GitHub Pages 托管
本项目支持直接发布到 GitHub Pages：

1. 在 GitHub 仓库 Settings > Pages
2. 选择 Source: GitHub Actions
3. Push 代码到 master 分支，GitHub Actions 会自动构建并部署
4. 访问 `https://<your-username>.github.io/<repo-name>/` 即可在线游玩

GitHub Actions 工作流会自动：
- 使用 Rust 工具链编译 WASM
- 使用 wasm-pack 构建发布版本
- 将构建产物部署到 GitHub Pages

## 项目结构

```
idle-game/
├── docs/                 # 项目文档
│   ├── DESIGN.md         # 详细设计文档
│   └── DEVELOPMENT_GUIDELINES.md  # 开发准则
├── src/                  # Rust 源代码
│   └── lib.rs           # 主要游戏逻辑
├── js/                   # JavaScript 前端
│   ├── i18n.js          # 国际化系统
│   ├── game.js          # UI 更新函数
│   └── bootstrap.js     # WASM 加载
├── css/                  # 样式表
│   └── style.css        # 主要样式
├── tests/                # Playwright 测试
├── index.html            # 主 HTML 文件
└── TEST_CASES.md         # 测试用例文档
```

## 文档

- **[设计文档](docs/DESIGN.md)** - 架构、数据结构、核心流程
- **[开发指引](docs/DEVELOPMENT_GUIDELINES.md)** - 开发准则和最佳实践  
- **[测试用例](TEST_CASES.md)** - 测试覆盖范围和执行策略

## 扩展游戏

要扩展游戏功能，您可以修改以下部分：

1. 在 `src/lib.rs` 中添加新的游戏对象或机制
2. 在 `index.html` 中添加 UI 元素
3. 在 `css/style.css` 中更新样式
4. 在 `js/` 文件中处理新的交互逻辑
5. 参考 `docs/DESIGN.md` 了解架构约束

## 游戏组件

### GameState
存储游戏的全局状态，包括：
- `coins`: 当前金币数量
- `wood`: 当前木头数量  
- `stone`: 当前石头数量
- `coins_per_click`: 每次点击获得的金币数
- `coins_per_second`: 每秒金币产量
- `wood_per_second`: 每秒木头产量
- `stone_per_second`: 每秒石头产量
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

### Worker (预留)
- `name`: 工人姓名
- `skills`: 技能（预留字段）
- `background`: 背景（预留字段）
- `preferences`: 喜好（预留字段）

## API 方法

Rust WASM 模块导出以下方法：

- `click_action()`: 处理点击事件
- `buy_upgrade(index)`: 购买指定索引的升级
- `buy_building(index)`: 购买指定索引的建筑
- `get_coins()`: 获取当前金币数
- `get_wood()`: 获取当前木头数
- `get_stone()`: 获取当前石头数
- `get_coins_per_second()`: 获取每秒金币产量
- `get_wood_per_second()`: 获取每秒木头产量
- `get_stone_per_second()`: 获取每秒石头产量
- `get_coins_per_click()`: 获取每次点击金币数
- `game_loop()`: 游戏主循环，处理自动收入

## 版本

当前版本: **v0.2.5** - 修复tab切换问题

## 贡献

请参考 [开发指引](docs/DEVELOPMENT_GUIDELINES.md) 了解贡献流程。