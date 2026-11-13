# 学习进度：client-code（杭州麻将客户端玩法模块）

> 源路径：E:\WorkProjects\PrdGameSkill\source-code\client\Code | 提交：db544fd（main） | 学习开始：2026-11-10

## 阶段状态

| 阶段 | 状态 | 完成日期 | 产物 |
| --- | --- | --- | --- |
| Overview（概览） | DONE | 2026-11-10 | 00-overview.md |
| Architecture（架构，并入 Overview） | DONE | 2026-11-10 | 00-overview.md（含架构边界声明） |
| Module（模块精读） | DONE（5/5） | 2026-11-10 | modules/game-controller.md, layer-views.md, game-glc-protocol.md, game-data.md, fupan-replay.md |
| Implement（重实现练习） | READY（行为链 5 stage 已布置，待学习者实现） | 2026-11-10 | exercises/（36 用例已验证） |
| Assessment（测验） | SKIP（改为学习报告自评） | 2026-11-10 | learning/learning-report.md |

## 当前状态与下一步

Overview 完成（v0.2.0 本地路径流程首次实战验证通过：原地分析 + source-location.json 落盘）。

Module 精读 5/5 完成，学习报告已出（learning-report.md）。

Implement 已按用户反馈重新设计为「完整行为链」：5 个 stage 对应 5 个已学模块（协议→路由→状态事件→上行→复盘），前段产物是后段依赖，36 用例全绿即全链路闭环（exercises/README.md 有链路图）。

## 待用户决策

1. 后续按需启动（不再主动询问）：行为链练习实现 / commonlobbyframe。
2. mcode-stack stage-01 与 minimax-code Module 候选仍挂起，同上。

## 并行未完事项

- mcode-stack：exercises/stage-01 待学习者实现。
- minimax-code：Module 精读候选（turn-system / skills 宿主 / PiTurnRunner）待选。
