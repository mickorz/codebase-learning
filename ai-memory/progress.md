# ai-memory 学习进度

> 仓库：https://github.com/akitaonrails/ai-memory | 工作区创建：2026-11-05
> clone：learning/ai-memory/repo @ f803819e（2026-11-05）

| 阶段 | 状态 | 产物 |
|---|---|---|
| Overview | 完成 2026-11-05 | 00-overview.md |
| Architecture | 完成 2026-11-05 | 01-architecture.md / 02-module-map.md（git 历史轻量分析含在内，未单列 03） |
| Module 教学 | core 完成 2026-11-05 | modules/core.md |
| Implement 练习 | 未开始（stage-01 已在 core.md 第 10 节预设计） | exercises/*.md |
| Assessment | 未开始 | quiz/assessment.md |

## 关键结论速查

- 单写入者 actor（store/writer.rs）是最早期设计决策（2026-05-21 M1-A 即落）
- crate 依赖分层：core 零依赖 → llm/store → wiki → consolidate → hooks/mcp/web → cli 全量组装
- hooks 依赖 consolidate 是反向亮点：SessionStart brief 复用整理层摘录逻辑
- wiki 是真相源，SQLite 可 reindex 重建；删除 = supersede + restore-page 可恢复

## 待办

- [ ] 下一个模块（推荐 store：单写入者 actor 并发模型）
- [ ] 或进入 Implement flow 做 stage-01（memory-core-mini）
