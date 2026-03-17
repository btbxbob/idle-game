# v0.7.0 Implementation Plan

## Goal

Implement the planned progression overhaul after the design phase is complete, starting from the worker-stage onboarding slice and expanding stage by stage.

## Phases

### Phase 1 - Worker Stage MVP

- [done] T1 `目标链状态模型`
- [done] T2 `工人阶段奖励包`
- [done] T3 `目标链 WASM 导出`
- [done] T4 `目标链 UI 面板`
- [done] T5 `目标完成反馈 + tab 高亮`
- [done] T6 `工人阶段首批科技推荐`
- [done] T7 `建筑按阶段/科技过滤`
- [done] T8 `基础测试补齐`

### Phase 2 - Worker System Deepening

- [done] T9 `工人效率正式接入产能`
- [done] T10 `效率来源展示`
- [done] T11 `自动分配最大收益策略`
- [done] T12 `自动分配结果可解释化`
- [done] T13 `工作总览收益排序/分配率展示`

### Phase 3 - Lifecycle Anomalies and Maggot Reveal

- [done] T14 `生命周期异常等级状态`
- [done] T15 `warning/decay/breach 文案池`
- [done] T16 `蛆虫阶段隐藏揭示逻辑`
- [done] T17 `蛆虫阶段目标链与面板引导`

### Phase 4 - Maggot Tech and Building Chain

- [done] T18 `MaggotBreeding/NecroticRecycling/SymbioticHosts`
- [done] T19 `蛆虫建筑按科技逐步揭示`
- [done] T20 `尸体/蛆虫到食物或化学品的黑暗转化闭环`
- [partial] T21 `蛆虫科技详情与建筑联动反馈`

### Phase 5 - Hybrid Population Framework

- [done] T22 `混合人口状态字段`
- [done] T23 `人类压力/蛆虫影响/共生稳定度/混合人口`
- [done] T24 `蛆虫人阶段目标链`
- [partial] T25 `共生建筑与宿主科技骨架`

### Phase 6 - Endgame and Global Balance

- [partial] T26 `终局资源网络骨架`
- [done] T27 `集体意识阶段入口条件`
- [partial] T28 `全局平衡参数首轮收敛`
- [partial] T29 `阶段回归测试矩阵`

## Status Legend

- `[done]` Implemented and integrated into the current gameplay loop
- `[partial]` First functional version exists, but the feature still needs polish, deeper feedback, or broader validation
- `[todo]` Not yet completed as a planned implementation milestone

## Current Snapshot

- Completed through the main progression spine from worker -> maggot -> hybrid -> collective
- Remaining work is concentrated in late-stage polish and validation
- Highest-priority unfinished item is still `T28`, but the first pacing pass is now underway
- `T29` now has broad stage-matrix coverage, but could still be split into more stage-focused suites later
- Most likely follow-up polish areas are `T21`, `T25`, and `T26`

## Recommended Build Order

1. `T1 + T2 + T3`
2. `T4 + T5`
3. `T6 + T7 + T8`
4. `T9 + T10 + T11 + T12 + T13`
5. `T14 + T15 + T16 + T17`
6. `T18 + T19 + T20 + T21`
7. `T22 + T23 + T24 + T25`
8. `T26 + T27 + T28 + T29`

## Dependency Notes

- `T4/T5` depend on `T1/T3`
- `T6` depends on a first usable version of `T7`
- `T11` depends on `T9`
- `T16/T17` depend on `T14/T15`
- `T19/T20` depend on `T18`

## First Buildable Slice

The first implementation slice is:

- `T1 目标链状态模型`
- `T2 工人阶段奖励包`
- `T3 目标链 WASM 导出`

This slice establishes the Rust-side source of truth needed by later UI, progression, and building-reveal work.
