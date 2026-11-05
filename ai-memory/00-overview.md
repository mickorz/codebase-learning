# 项目概览：ai-memory

> 仓库：https://github.com/akitaonrails/ai-memory | 分支：master | 提交：未采集（远程仓库，按 GitHub Access 约定未 clone） | 分析日期：2026-11-05

## 项目定位

给 AI 编码 agent 的长期记忆系统：跨 agent（20+ 种 harness）、跨项目、跨机器、跨团队共享一份记忆，让"换一个 agent 继续干活"不用重新解释背景。写给使用 AI 编码工具的个人开发者与团队。

一句话架构：`capture ─> consolidate ─> recall ─> handoff`（hooks 静默捕获 -> session-end 整理成 wiki 页 -> 检索+brief 注入 -> 下一个 agent 接棒）。

## 主要功能

- **跨 agent 共享记忆**：Claude Code / Codex / Cursor / Gemini CLI / OpenCode 等 20+ harness 通过 lifecycle hooks 和 MCP 喂同一份记忆（README: "It follows you across agents"）
- **托管工作流**：`ai-memory run <harness>` 启动并自动接线，跨 harness 会话接续（README: managed workstreams）
- **markdown wiki 是真相源**：记忆本质是 git 版本化的 `.md` 文件，SQLite 只是派生索引，可随时重建（README: "Your memory is plain markdown"）
- **零 LLM 默认路径**：捕获、搜索、handoff 全部不需要 API key；LLM 只是可选增强（session 摘要、语义搜索、"dream" 后台整理）
- **记忆老化**：按 tier 衰减曲线、访问加权保留（用过的衰减更慢）、冷记忆压缩成持久事实、近重复合并、矛盾标记——全部零 LLM、可逆（supersede-not-delete + restore-page）
- **多用户/团队**：bearer token 分级、密码登录、per-person 归属、审计日志、可选管理控制台
- **安全边界**：捕获在类型化隐私边界消毒后才存储；服务默认只绑 loopback

## 技术栈

| 项 | 内容 | 证据 |
|---|---|---|
| 语言 | Rust 1.95+，edition 2024，`unsafe_code = "forbid"` | 根 Cargo.toml：`rust-version = "1.95"`、`[workspace.lints.rust]` |
| 构建 | Cargo workspace（11 crates + evals），单二进制发布 | 根 Cargo.toml `[workspace] members` |
| MCP SDK | rmcp 2.2（server + streamable-http transport） | Cargo.toml workspace.dependencies |
| 存储 | SQLite（rusqlite bundled + refinery 迁移），FTS5 全文索引 | Cargo.toml Storage 注释 |
| Wiki 版本化 | git2（vendored libgit2） | Cargo.toml "Wiki git versioning" |
| Web 服务 | axum 0.8 + tower-http（含可选 management-ui feature） | Cargo.toml |
| 本地嵌入 | candle-core/nn/transformers（纯 Rust，2.0 引入） | Cargo.toml "Local (in-process, pure-Rust) embeddings" |
| CLI | clap 4 derive + crossterm（交互 picker） | Cargo.toml |
| 异步 | tokio full | Cargo.toml |

## 目录结构

```text
ai-memory/
├── crates/                  # 核心workspace：11 个 crate（见下表）
├── companions/              # 7 个可选伴生项目：client/desktop/importer/macos/relay/ts/wikisync
├── hooks/                   # 各 agent 的 lifecycle hook 脚本（claude-code/codex/cursor/gemini-cli 等 15+）
├── plugins/                 # claude-code / codex 的 marketplace 插件
├── docs/                    # 大量文档：ARCHITECTURE.md、design-*、research-* 等
├── docker/                  # Dockerfile 与 compose 变体（tls/caddy/cloudflared/prod）
├── nix/                     # NixOS module + systemd 沙箱
├── packaging/               # aur/rpm/systemd/launchd 打包
├── evals/                   # 检索质量 A/B 评测 harness（不随二进制发布）
├── tests/                   # e2e、hooks、安装脚本测试
├── scripts/                 # CI 辅助：changelog 检查、验收脚本
├── install.sh / install.ps1 # 官方安装脚本（SHA-256 校验）
└── AGENTS.md / CLAUDE.md    # agent 协作说明
```

crates 一览（来自根 Cargo.toml `[workspace] members`，VERIFIED）：

| crate | 初步职责 | 证据等级 |
|---|---|---|
| ai-memory-cli | 唯一入口二进制：100+ 子命令（setup/serve/run/search/handoffs/install-hooks/install-mcp/doctor/backup 等） | VERIFIED（commands/ 目录 97 个文件） |
| ai-memory-core | 领域模型与共享类型（所有 crate 依赖它） | INFERRED（workspace.dependencies 全部 path 依赖它） |
| ai-memory-store | SQLite 存储层：FTS5、实体、嵌入、单一写入者 | INFERRED（Cargo Storage 注释 + README "one SQLite writer"） |
| ai-memory-wiki | git 版本化 markdown wiki 读写 | INFERRED（git2 依赖注释 "Wiki git versioning"） |
| ai-memory-mcp | MCP/HTTP 服务端（server.rs/actor.rs/auth.rs/human_auth.rs） | INFERRED（结构 + rmcp 依赖） |
| ai-memory-hooks | lifecycle hook 捕获协议端 | INFERRED |
| ai-memory-llm | LLM/embedding provider 客户端（reqwest + candle 本地嵌入） | INFERRED |
| ai-memory-consolidate | session-end 把观察编译成 wiki 页（含零-LLM 路径） | INFERRED（README capture -> consolidate） |
| ai-memory-web | Web UI 与 JSON API | INFERRED（axum + --enable-web） |
| ai-memory-workstream | `ai-memory run` 托管工作流与跨 harness 会话接续 | INFERRED（README managed workstreams） |
| ai-memory-test-support | 测试专用共享工具（dev-dependency，不发布） | VERIFIED（Cargo.toml 注释） |

## 入口点

| 入口 | 位置 | 证据 |
|---|---|---|
| CLI 二进制 main | `crates/ai-memory-cli/src/main.rs` | 目录结构 VERIFIED（内部流程待 Architecture 验证） |
| 服务端（serve 子命令） | `crates/ai-memory-cli/src/commands/serve.rs` -> `crates/ai-memory-mcp/src/server.rs` | 命令文件存在 VERIFIED，调用链 INFERRED |
| MCP stdio 桥 | `crates/ai-memory-cli/src/commands/mcp_bridge.rs` | 文件存在 VERIFIED，职责 README 说明 |
| hooks 捕获 | `crates/ai-memory-cli/src/commands/hook.rs`（另有 hook_capture/hook_spool/hook_drain_process） | 文件存在 VERIFIED |
| `ai-memory run` 启动器 | `crates/ai-memory-cli/src/commands/run.rs`（+ run_autowire.rs） | 文件存在 VERIFIED |

## 核心数据目录（运行时形态）

```text
<data_dir>/
├── wiki/    # markdown 真相源，git 版本化
├── raw/     # 不可变的消毒后工作流 transcript 段
├── db/      # SQLite 索引（FTS5/实体/嵌入）
├── models/  # 本地嵌入模型
└── logs/    # 滚动 tracing 日志
```
（README "Architecture" 一节，VERIFIED as documented；代码对应关系待验证）

## 学习建议

推荐顺序（按依赖方向，先被依赖后依赖人）：

1. **ai-memory-core** —— 所有 crate 的地基，领域模型在这里
2. **ai-memory-store** —— SQLite/FTS5 存储与迁移，读写路径的底座
3. **ai-memory-wiki** —— markdown 真相源的读写与 git 版本化（本项目最有特色的取舍）
4. **ai-memory-consolidate** —— 观察编译成页（含零-LLM 老化机制）
5. **ai-memory-mcp** —— MCP/HTTP 服务端与认证
6. **ai-memory-cli** —— 入口与命令编排（此时看就是"串珠子"）
7. 其余（hooks/llm/web/workstream/companions）按需

另外 `docs/ARCHITECTURE.md` 是上游自带的架构文档，Architecture 阶段用它做线索、用源码验证其说法。
