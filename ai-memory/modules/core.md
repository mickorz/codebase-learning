# 模块学习：ai-memory-core

> 仓库：https://github.com/akitaonrails/ai-memory | 提交：f803819e | 分析日期：2026-11-05
> 范围：`crates/ai-memory-core/src/`（27 个子模块，17120 行）

## 1 问题：这个模块解决什么问题

11 个 crate 要协作处理同一批领域对象——观察、会话、页、handoff。如果每个 crate 自定义字符串字段和解析规则，会出现：同一事件在 hooks 层叫 `PostToolUse`、在 store 层叫 `post_tool_use`；路径校验五处实现五处漏洞；未经消毒的文本从某个旁路溜进 SQLite。

core 用**一套类型 + 一套解析规则 + 一个类型化信任边界**回答"观察是什么、页是什么、什么算合法路径、什么算已消毒"，让整个 workspace 说同一种语言。

## 2 职责：它负责什么，不负责什么

- **负责**：领域类型定义、宽容解析与归一化（kebab/snake/驼峰互认）、防御性上限常量、类型化 ID（newtype）、`Sanitized<T>` 信任标记、错误类型、摘录/衰减等纯函数
- **明确不负责**：**任何 IO**。上游 AGENTS.md 一句话定界：`ai-memory-core/ domain types, errors, ids. NO IO.`——没有 SQL、没有网络、没有文件系统。sqlite 在 store，markdown 在 wiki，HTTP 在 hooks/mcp

证据：`Cargo.toml` 依赖清单为零内部依赖（架构笔记依赖图地基），src/ 无 reqwest/rusqlite/git2（VERIFIED，grep 依赖矩阵）。

## 3 位置：整体架构中的角色

依赖图唯一零依赖节点；store/llm/workstream 直接依赖它，其余 crate 传递依赖。类比：core 是这个国家的"民法典"——不执行任何业务，但所有合同（函数签名）都用它定义的名词书写。

## 4 接口：对外公开的 API

`lib.rs` 全量 re-export 27 个子模块（VERIFIED）。最常用：

| API | 位置 | 用途 |
|---|---|---|
| `ObservationKind` + `FromStr` | observation.rs:31/74 | 10 种事件闭集；存储用 kebab-case，解析接受三种种写法 |
| `Sanitized<NewObservation>::new(obs, &Sanitizer)` | sanitize.rs:907 | **唯一**的观察消毒构造路径 |
| `NewObservation` / `Observation` / `NewSession` | observation.rs | 写入输入 / 行物化视图 / 会话开行 |
| `NewPage` / `Page` / `Tier` / `PageEvidence` | page.rs:22/36/630/101 | 页写入输入（含 Tier 四级 + 证据溯源） |
| `NewHandoff` / `HandoffState` | handoff.rs:52/17 | 接棒记录；状态机 Open/Accepted/Expired |
| `PagePath` newtype | ids.rs:117 | 类型化 wiki 路径，构造时校验一次 |
| `MemoryError` / `MemoryResult` | error.rs（`#[non_exhaustive]`） | workspace 统一错误 |
| `valid_file_path_key` | observation.rs:26 | checkout 相对路径白名单校验（≤512 字符、拒绝绝对路径与 `..`） |

## 5 数据：核心数据结构

**ObservationKind**（observation.rs:31，闭集枚举）：session-start / user-prompt / pre-tool-use / post-tool-use / pre-compact / post-compaction / notification / stop / session-end / other。未知事件落 `other`，**不扩枚举**；第三方词表走 `extension` + `source_event` 两个可选字段旁路记录（NewObservation:136-146），存储归一化但语义不进路由。

**NewObservation**（observation.rs:121）：三元组身份（session/workspace/project_id）+ kind + 消毒后 body + importance(1..=10，默认5) + 可选 `file_path`（消毒不通过会被 `Sanitized::new` 置 None）+ 可选 `occurred_at`（backfill 用原始时间，None=now）。

**Tier 四级记忆**（page.rs:22）：

| Tier | 认知科学类比 | 内容 |
|---|---|---|
| `Working` | 工作记忆 | 最近 N 条观察、当前文件 |
| `Episodic` | 情景记忆 | 会话摘要 + 概念标签 + 触碰的文件 |
| `Semantic` | 语义记忆 | 蒸馏后的事实/偏好/架构笔记——"wiki 正页" |
| `Procedural` | 程序记忆 | 从情景簇提取的重复模式 |

后续的 per-tier 衰减曲线、A2 冷情景页压缩都建立在这个分级上（INFERRED：与 ARCHITECTURE.md 衰减章节对应）。

**防御性上限常量**（page.rs:158-180）：每页实体 ≤10 个且单个 ≤64 字符、abstract ≤1024、relations ≤32、sources ≤16……上限即文档，编译进类型系统旁边。

**HandoffState**（handoff.rs:17）：Open → Accepted / Expired 的行级状态机，配合 store 层"invariant #16：handoff 双重 open 守卫恰好领一次"。

## 6 执行：内部执行流程

core 无运行时执行流，但有**三条编译期固定的规则**在每次调用时执行：

1. **宽容归一化**：`ObservationKind::from_str`（observation.rs:74）同时接受 `PostToolUse`/`post_tool_use`/`post-tool-use`——不同 harness 的命名习惯在此收敛为一种存储格式。往返测试 `observation_kind_round_trips` 保证 as_str/from_str 互逆
2. **scrub-then-truncate**（sanitize.rs:907 `Sanitized::new`）：先 `sanitizer.scrub()` 抹密，后按 UTF-8 安全截断。**顺序不能反**——#980 的真实 bug：先截断会把秘密切成两半，前半段因太短匹配不到密钥模式，未脱敏地进了 title
3. **路径准入**：`valid_file_path_key`（observation.rs:26）+ `Sanitized::new` 里 `admits_file_path` 不过关就清空 `file_path`——不合格路径不是报错而是**消失**

## 7 源码：关键文件与函数

| 文件 | 行数 | 核心内容 |
|---|---|---|
| `sanitize.rs` | 2458 | `Sanitizer`(626)/`SanitizeConfig`(661)/`Sanitized<T>`(882)/`Sanitized::<NewObservation>::new`(907)/截断函数族(937+) |
| `active_project.rs` | 1805 | "当前项目"指针按调用者坐标隔离（PerActor/PerSession/Single 三模式） |
| `ids.rs` | 1500 | 全部类型化 ID newtype + `AgentKind`(240) + `PagePath`(117) |
| `profile.rs` | 1383 | 跨项目 profile 的候选/收敛类型 |
| `repository_identity.rs` | 1263 | `.ai-memory.toml` marker 与 git-remote 仓库身份 |
| `page.rs` | 1134 | Tier/NewPage/Page/PageEvidence/LinkTarget/Relation + MAX_* 上限 + 实体归一化 |
| `observation.rs` | 335 | ObservationKind/NewObservation/Observation/NewSession/TokenCall 族 |
| `handoff.rs` | 190 | HandoffState/NewHandoff（"typed snapshot of where we are"） |
| `error.rs` | 56 | MemoryError 8 变体（PathEscape/InvalidPagePath/MalformedRecord/Io/Serde…），`#[non_exhaustive]` |
| `excerpt.rs` | 372 | L0/L1 摘录（brief 预算的底层，brief_tiers 复用） |
| 其余 | — | slots/i18n/okf/message/user/workstream/routing_* 等 |

## 8 设计：作者为什么这样设计

1. **`Sanitized<T>` newtype 是整个安全模型的地基**（invariant #6"typed privacy boundary"）。字段私有、仅 `Sanitized::<NewObservation>::new` 一个构造器 → **编译器保证不存在绕过消毒的旁路**：store 的写入 API 若接受裸 `NewObservation`，类型上就过不了关。类比海关：货物必须贴"已检疫"标签才能入关，而标签只有海关能印
2. **闭集枚举 + extension 旁路**而非开放字符串：存储/路由/衰减都按 kind 分支，闭集让 match 穷尽；第三方新词表不污染核心语义，只在 `source_event` 留痕（ARCHITECTURE.md"extension seam, not a runtime plugin system"）
3. **注释里带 issue 号和失败案例**（#980 scrub-then-truncate、cosmetic gap 诚实标注"Left unhandled deliberately"）——设计决策直接写在代码现场，不用翻 design doc
4. **`#[non_exhaustive]` 错误枚举** + 8 个窄变体：外部 crate 只能通配匹配，新增变体不破坏下游

## 9 替代方案：其他可能的设计与取舍

| 备选 | 为何没选 | 代价 |
|---|---|---|
| 观察用 trait 对象/插件注册（开放扩展） | 路由与衰减需要按 kind 精确分支，开放集让穷尽检查失效 | 第三方事件只能进 `other`+旁路，表达力受限 |
| 路径用裸 String + 各处校验 | `..`/绝对路径/超长会在不同层漏检（#932 同类教训） | PagePath newtype 要求所有 API 签名改造一次 |
| 先截断后消毒 | 快；但 #980：秘密被切成两半后模式匹配不到 | scrub-then-truncate 全程处理原文，多一倍临时内存 |
| 错误用 anyhow 全程 | 业务层省事 | core 是类型库，调用方需要按变体分支（PathEscape 是纵深防御信号）；`#[non_exhaustive]` 折中 |

## 10 练习：建议你实现什么

最小重实现（implement flow stage-01）：一个无 IO 的 `memory-core-mini`：

1. `ObservationKind` 枚举 + 三种命名风格互认的 `FromStr` + 往返测试
2. `Sanitized<T>` newtype：构造器内先替换 `sk-...`/`password=...` 模式再截断；写一个"先截断会漏密钥"的对抗测试（复现 #980）
3. `valid_file_path_key` 的路径白名单 + 表驱动测试（`..`/盘符/超长/空）
4. `MemoryError` 枚举 + `#[non_exhaustive]`

完成标准：对抗测试在"去掉 scrub 先截断"时必须失败。→ 详见 exercises/stage-01.md（进入 Implement flow 时生成）
