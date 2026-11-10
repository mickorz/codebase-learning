# 实现练习：迷你乐观锁看板 Stage 1-2

> 仓库：https://github.com/chuspeeism/dashi-taskboard | 提交：bdf7698 | 参考源码：repo/server/database.mjs、repo/shared/api-fields.mjs | 建立日期：2026-10-23

对应模块笔记：`modules/data-layer.md` 第 10 节练习 A。

## 学习目标

独立复现上游数据层的两个核心能力，不抄上游代码：

1. **Stage 1**：建表（幂等迁移）+ createTask（事务内自愈编号、置顶默认排序）
2. **Stage 2**：moveTask 的双层乐观锁（预检快失败 + `WHERE version = ?` 原子守卫）+ 冲突重试协议

做完你将能回答：为什么预检之外还要原子守卫？`BEGIN IMMEDIATE` 到底防什么？编号为什么不会重？

## 需要先理解的概念

- `node:sqlite` 的 `DatabaseSync`：`exec`（DDL/PRAGMA）、`prepare().run()`（返回 `changes`）、`prepare().get()`（返回 `row | undefined`）
- SQLite 事务：`BEGIN IMMEDIATE`（立即拿写锁）vs 延迟事务；本练习所有写操作都要包事务
- 乐观锁：版本比较放进行数判定（`result.changes !== 1`），而不是靠"先读后写"的间隙
- SQLite 的 `substr` 是 1 基；`GLOB 'LOCAL-[0-9]*'` 模式匹配
- 错误即接口：`ApiError(status, code, message, details)` 与上游 `shared/api-fields.mjs:3` 同形

上游 JS → 本练习 TS 的映射说明：上游是纯 JS 无类型标注；练习补了 TS 类型（`Task`、`CreateTaskInput` 等，见 src/types.ts）。上游 `projectPrefix()` 从 id/name 推导前缀（task-records.mjs:215），练习简化为创建项目时显式传 `prefix`；labels、assignee、threadBinding、活动流水明确裁掉——它们不是本练习的教学目标。

## 要创建的文件（已完成脚手架）

```text
exercises/stage-01-optimistic-board/
├── package.json        vitest + typescript，npm test / npm run typecheck
├── tsconfig.json       NodeNext + strict
├── src/
│   ├── types.ts        域模型（已给出，含 STATUS 常量与类型）
│   ├── errors.ts       ApiError（已给出，镜像上游形状）
│   └── board.ts        你的实现目标：所有"尚未实现"处
└── tests/
    ├── stage1.test.ts  验收测试，禁止修改
    └── stage2.test.ts  验收测试，禁止修改
```

环境：Node 24.18（`node:sqlite` 内置可用），已通过 `npm install` 安装 vitest。

## 预计规模与难度

- Stage 1：约 80-100 行（含 SQL），难度 2/5
- Stage 2：约 50-70 行，难度 3/5（事务 + 双层校验的顺序容易写错）

## 关键函数（签名与职责）

全部签名已写在 `src/board.ts`，此处只列职责锚点（括号为上游 database.mjs 行号）：

| 方法 | 职责 | 上游参照 |
| --- | --- | --- |
| `constructor(filename)` | 打开库 + PRAGMA（WAL/busy_timeout/foreign_keys）+ 迁移 | 259 |
| `#migrate()` | 两张表 `CREATE TABLE IF NOT EXISTS`，CHECK 约束写死状态集 | 268 |
| `createProject(input)` | 插入项目，next_task_number = 1 | 934 |
| `createTask(input)` | 事务内：自愈编号 + 置顶默认 + 计数器推进 | 1808 |
| `moveTask(id, version, input)` | 预检 → 原子守卫 → 404/409 歧义消解 | 2053, 2856, 2874 |
| `listTasks(filters)` | 动态 WHERE + 看板列顺序排序 + 行转换 | 1680 |
| `getTask(id)` / `removeTask(id)` | 404 语义 / 练习专用硬删 | 2840 |

## 实现任务

`src/board.ts` 每个方法体都给了伪代码注释和上游行号。按 Stage 顺序做：

**Stage 1 顺序建议**：constructor → #migrate → #taskFromRow → createProject → getTask → createTask → removeTask → listTasks。

createTask 的编号查询（上游 1830-1834，表达式的 1 基偏移最容易错）：

```sql
SELECT MAX(CAST(substr(identifier, ?) AS INTEGER)) AS number
FROM tasks WHERE identifier GLOB ?
-- 参数：prefix.length + 2, `${prefix}-[0-9]*`
```

`number = Math.max(project.nextTaskNumber, maximum === null ? 1 : maximum + 1)`，然后 `UPDATE projects SET next_task_number = number + 1`。

**Stage 2 顺序建议**：moveTask 按 board.ts 注释的 7 步走。两个易错点：
- 错误预检（步骤 2）放在 `BEGIN IMMEDIATE`（步骤 4）**之前**——409 大多数时候在事务外就能回答，别为它开事务；
- `result.changes !== 1` 时必须重查任务区分 404/409，直接 throw 409 会把"任务不存在"误报成冲突。

## 测试用例

19 个验收测试（`npx vitest run`，当前全部因"尚未实现"失败，即起点状态）：

**Stage 1（tests/stage1.test.ts，11 个）**：首任务 LOCAL-1/version1/sortOrder1000 → 新任务置顶（0 = 1000−1000）→ 404 PROJECT_NOT_FOUND → 400 INVALID_STATUS 预检 → 删最大编号后不重号（LOCAL-3）→ 删中间编号不重号 → 看板列顺序排序 → status/projectId 过滤 → 项目 id 重复被拒。

**Stage 2（tests/stage2.test.ts，8 个）**：换列 version 1→2 → 空列置顶 1000 → 同列去底部 MAX+1000 → 404 TASK_NOT_FOUND → 过期版本 409 且 details 带 expectedVersion/actualVersion → **双客户端竞抢恰好一胜**（SKILL.md 认领协议的微缩版）→ 冲突后重读重试成功（协议第 3 条）→ version 单调不减。

## 验收标准

1. `npx vitest run` 19/19 通过
2. `npm run typecheck` 无错误
3. 实现**不使用**任何外部依赖（只用 `node:sqlite`、`node:crypto`）
4. 所有写操作（createTask/moveTask）都有事务包裹，失败路径 ROLLBACK 后 rethrow，不吞错
5. 409 的 details 结构与上游一致：`{ expectedVersion, actualVersion }`（skill 里的 AI 重试协议依赖这个结构）

## 与上游的差异清单（诚实声明）

| 上游 | 练习 | 原因 |
| --- | --- | --- |
| projectPrefix() 推导前缀 | 显式传入 prefix | 推导规则与教学目标无关 |
| 40+ 列 tasks 表 | 9 列 | 裁掉 labels/assignee/threadBinding 等 |
| 归档软删 + Jira 同步 | 无归档，加 removeTask 硬删（仅练习用） | 制造编号空洞以验证自愈 |
| 活动流水 task_activities | 无 | 属于练习 B 之后的内容 |
| 换列/同列缺省排序 | 保留（这是 sort_order 语义的一部分） | 完整保留 |
