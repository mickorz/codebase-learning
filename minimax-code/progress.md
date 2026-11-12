# 学习进度：minimax-code

> 仓库：https://github.com/MiniMax-AI/minimax-code | 提交：3c21163（浅克隆 depth=50） | 学习开始：2026-11-10

## 阶段状态

| 阶段 | 状态 | 完成日期 | 产物 |
| --- | --- | --- | --- |
| Overview（概览） | DONE | 2026-11-10 | 00-overview.md |
| Architecture（架构地图，重点 local-runtime-v2） | DONE | 2026-11-10 | 01-architecture.md |
| Module（模块精读） | NOT STARTED | - | modules/*.md |
| Implement（重实现练习） | NOT STARTED | - | exercises/ |
| Assessment（测验） | NOT STARTED | - | quiz/ |

## 当前状态与下一步

Overview 与 Architecture（重点 local-runtime-v2）已完成。关键发现：v2 是全仓最大包（25.1 万行，service 层 22 个子系统）；v1→v2 是绞杀者模式（数据迁移回执 + 失败回退 v1）；公开投影剥了 HTTP 层但 package.json 配置留有化石引用。

待选下一步：v2 内部子系统精读（turn-system 最复杂，含 compaction/runaway-guard/PTC quickjs）或回到原推荐路线（skills 宿主 / permission / context-manager / PiTurnRunner）。

## 待用户决策

1. Module 精读对象：v2 的 turn-system / 其余子系统 / 原推荐四模块。
2. mcode-stack 的 stage-01 仍未交。

## 并行未完事项

- mcode-stack 的 exercises/stage-01（taste-to-checks 判定函数）已布置，待学习者实现。
