# 学习进度：mcode-stack

> 仓库：https://github.com/MiniMax-AI/mcode-stack | 提交：88f84be | 学习开始：2026-11-10

## 阶段状态

| 阶段 | 状态 | 完成日期 | 产物 |
| --- | --- | --- | --- |
| Overview（概览） | DONE | 2026-11-10 | 00-overview.md |
| Architecture（架构地图） | DONE | 2026-11-10 | 01-architecture.md, 02-module-map.md, 03-git-history.md |
| Module（模块精读） | DONE | 2026-11-10 | modules/subagent-split-check.md, modules/evidence-first-review.md, modules/independent-review.md, modules/taste-to-checks.md |
| Implement（重实现练习） | NOT STARTED | - | exercises/ |
| Assessment（测验） | NOT STARTED | - | quiz/ |

## 当前状态与下一步

Overview / Architecture / Module（4 个代表性 skills）已完成。

跨 skill 元观察（最有价值的输出）：四个 skill 共享同一套设计模式——
1. 条件化准入：先列适用硬条件再谈怎么做（split 三条件 / taste 三信号）
2. 便宜方案优先：拆分前先试工具合并与状态落盘；规则落点先 lint 后 AGENTS.md
3. 测量纪律：eval 数据不是感觉；看翻转任务不只看总分；跑多次
4. 固定 Output 契约：每个 skill 末段规定必须回答什么，使 agent 行为可预期可审计
5. 证伪式验证：从未失败过的检查未被证明有效；每个绿勾要能说出它不证明什么
6. 显式配对网络：skill 间互相引用分工，构成 workflow 生态而非孤立检查表

## 待用户决策

1. 下一步三选：Implement 练习（把某 skill 的判定逻辑写成 TS+vitest）/ Assessment 迁移测验 / 结束本仓库学习。
2. 对照研究待决：taste-to-checks 强度表 vs 自有 CLAUDE.md 的规则组织；Output 契约段是否引入自有 skill-writer。
