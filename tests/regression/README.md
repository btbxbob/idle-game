# 回归测试目录说明

本目录用于存放 **bug 修复相关** 的测试用例。

## 约定
- 每个回归测试文件开头必须写明：
  - `Bug`：当时的故障现象
  - `Root Cause`：根因（可选）
  - `Expected`：修复后的预期行为
- 文件命名建议：`<bug-domain>-<symptom>.test.js`

## 当前已归类用例与历史故障
- `core-issues-fixed.test.js`
  - Bug: 金币显示区域不更新，且列表出现 `undefined`。
- `no-undefined-display.test.js`
  - Bug: 建筑/升级面板渲染出现 `undefined` 文本。
- `click-after-failure.test.js`
  - Bug: 购买失败后点击流程受影响（状态/交互异常）。
- `upgrade-cost-recursive-borrow.test.js`
  - Bug: 升级购买后花费更新异常，涉及 Rust 借用冲突修复后的回归验证。
- `upgrade-cost-update.test.js`
  - Bug: 升级花费未按倍率更新或显示不一致。
- `upgrade-cost-debug.test.js`
  - Bug: 升级花费链路异常，需要诊断路径校验。
- `debug-upgrade-cost.test.js`
  - Bug: 同升级花费问题的调试与防回归补充。
- `diagnose-upgrade-init.test.js`
  - Bug: 升级列表初始化异常（条目/成本/索引不一致）。
- `debug-tab.test.js`
  - Bug: 标签页切换显示状态异常，需要状态诊断。
- `fix-all-issues.test.js`
  - Bug: 历史复合问题集合（显示异常、升级链路异常）回归用例。
- `autoclicker-removed.test.js`
  - Bug: 移除自动点击器后仍有残留 UI/API/被动收益路径。
