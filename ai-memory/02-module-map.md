# 模块地图：ai-memory

> 仓库：https://github.com/akitaonrails/ai-memory | 分支：master | 提交：f803819e | 分析日期：2026-11-05
> 职责描述取自各 crate Cargo.toml 的 `description` 字段（官方一句话，VERIFIED）；依赖方向同源。

| 模块 | 路径 | 职责 | 关键文件 | 依赖（内部） | 被依赖 | 证据等级 |
|---|---|---|---|---|---|---|
| core | `crates/ai-memory-core/` | 核心领域类型与错误（"Core domain types and errors"） | `observation.rs`（观察类型与 ObservationKind）、`page.rs`、`handoff.rs`、`sanitize.rs`（消毒）、`excerpt.rs`（L0/L1 摘录）、`workstream.rs`、`active_project.rs`、`okf.rs`（开放知识格式）、`message.rs`、`profile.rs`、`repository_identity.rs` | 无 | 除 test-support 外全部 | VERIFIED |
| llm | `crates/ai-memory-llm/` | LLM provider trait + 类型化客户端（Anthropic/OpenAI/Gemini/Codex/Copilot/Cursor/OpenAI-compat） | trait 定义 + 各 provider 客户端；本地嵌入走根 workspace 的 candle（模型 all-MiniLM-L6-v2） | core | wiki, consolidate, mcp, web, hooks, cli | VERIFIED |
| store | `crates/ai-memory-store/` | SQLite 存储层：单写入者 actor + FTS5/sqlite-vec 索引 | `writer.rs`（WriteCmd:55、WriterHandle:915）、`lib.rs`（SessionEndDisposition:112 等会话状态机）、迁移（refinery） | core | wiki, consolidate, hooks, mcp, web, cli | VERIFIED |
| wiki | `crates/ai-memory-wiki/` | markdown wiki 读写、文件 watcher、git 版本化（"Markdown wiki read/write, file watcher and git versioning"） | 读写 API（write_page/delete_event_ledger 等）、watcher（notify 依赖）、git2 commit | core, llm, store | consolidate, hooks, mcp, web, cli | VERIFIED（依赖）；watcher 行为 INFERRED |
| consolidate | `crates/ai-memory-consolidate/` | Karpathy 式 ingest/query/lint 整理管线 | `consolidator.rs`（consolidate_session:264、consolidate_session_multi:774）、`projection.rs`、`consolidator_frozen_oracle.rs`（评测冻结预期）、profile 收敛 | core, store, wiki, llm | hooks, mcp, cli | VERIFIED |
| hooks | `crates/ai-memory-hooks/` | hook payload schema、消毒、agent lifecycle HTTP ingress | `router.rs`（hook_router:743、render_interrupted_session_context）、`payload.rs`、`capture_policy.rs`（ignore_paths/allowlist）、`brief_tiers.rs`（SessionStart brief 预算）、`hermes.rs`/`antigravity.rs`（harness 特例） | core, store, wiki, consolidate, llm | mcp(dev), cli | VERIFIED |
| mcp | `crates/ai-memory-mcp/` | MCP server 传输与工具路由 | `server.rs`（工具集 + 路由挂载）、`actor.rs`、`auth.rs`/`human_auth.rs`（bearer/密码会话）、`admin.rs`、`identity.rs`、`session_management.rs`、`self_service_keys.rs` | core, consolidate, llm, store, wiki（dev: hooks, web） | cli | VERIFIED |
| web | `crates/ai-memory-web/` | 只读 wiki 浏览器（项目列表/树导航/markdown 渲染/FTS5 搜索） | 路由与 askama 模板；management-ui 为 feature 门控 | core, llm, store, wiki | cli（仅 dev 关系到 mcp） | VERIFIED |
| workstream | `crates/ai-memory-workstream/` | 只读原生 harness 适配器与托管启动规划（managed launch planning） | 各 harness transcript 适配器 | core | cli | VERIFIED |
| cli | `crates/ai-memory-cli/` | `ai-memory` 二进制入口 | `main.rs`（薄壳+runtime flavor）、`lib.rs`（run() 分发）、`cli.rs`（clap 定义）、`commands/`（97 个子命令文件：serve/run/hook/search/handoffs/install-*/doctor/backup…） | 全部 | —（终端用户） | VERIFIED |
| test-support | `crates/ai-memory-test-support/` | 测试共享工具，dev-dependency only，永不发布 | — | 无 | 各 crate dev-deps | VERIFIED |
| evals | `evals/` | 检索质量 A/B 评测 harness（LongMemEval-S 等，不随二进制发布） | `src/`、`fixtures/` | workspace 成员 | — | VERIFIED（Cargo.toml 注释） |

## 周边（非 workspace）

| 部分 | 路径 | 说明 |
|---|---|---|
| hooks 脚本 | `hooks/` | 15+ agent（claude-code/codex/cursor/gemini-cli/…）的 shell 安装端，curl POST /hook 或调原生命令 |
| companions | `companions/` | 7 个独立仓库式项目：ts 客户端 SDK、desktop 安装器、importer（PDF/DOCX 导入）、macos 菜单栏 app、relay、wikisync、client |
| plugins | `plugins/` | claude-code / codex marketplace 插件 |

## 推荐学习顺序（按依赖方向）

1. **core** —— 领域类型是所有 crate 的通用语言：`observation.rs`（10 种 ObservationKind 闭集）、`page.rs`、`handoff.rs`、`sanitize.rs`。读完就懂"一条观察是什么"
2. **store** —— 单写入者 actor + FTS5 + 迁移。理解"写为什么串行、读怎么并发（读池上限 4）"
3. **wiki** —— 真相源层：文件读写 + git2 commit + watcher 对账。理解"SQLite 崩了为什么不怕"
4. **consolidate** —— 观察 → 页的编译管线（零-LLM 规则路径 + LLM 增强），本项目最核心的业务逻辑
5. **hooks** —— 消毒边界与 brief 预算算法（数据入口，安全关键）
6. **mcp** —— MCP 工具面与认证（server.rs 是最大单文件，建议按工具名检索式读）
7. **cli** —— 最后看：此时 97 个命令文件都是已学概念的薄封装；重点只看 serve.rs 与 lib.rs 分发
8. 按需：web / workstream / evals / companions

每模块产出 `modules/<name>.md`；重实现练习建议从 core 的 Observation + sanitize 最小版开始（implement flow）。
