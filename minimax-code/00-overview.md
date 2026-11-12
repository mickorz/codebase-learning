# 项目概览：minimax-code

> 仓库：https://github.com/MiniMax-AI/minimax-code | 分支：main | 提交：3c21163c85a9684030cb147bfef48c6284fa3c46（浅克隆 depth=50） | 分析日期：2026-11-10

## 项目定位

MiniMax Code（命令 `mcode`）：终端形态的 coding agent（TUI），"Turn a prompt into something that works"——支持 MiniMax 托管账号或 BYOK 自有模型 API，v0.7.2。**与上一个学习对象 mcode-stack 是同一团队：mcode-stack 是给这个产品安装的 skills 合集，本仓库是产品本体。**

最重要的仓库形态事实（AGENTS.md 开篇）：**这是内部 monorepo 的"受审公开投影"（reviewed public projection），不是普通开源仓库**——每个发布文件登记在 `release/public-source.json`，上游变更经三方合并（docs/source-sync.md）进来，移动/重命名文件会在下次同步时变成冲突。Git 历史是压缩后的投影（本次浅克隆仅 50 条），**历史分析价值有限，release/ 下的机器可读契约才是理解本仓库的钥匙**。

## 主要功能

- 终端 coding agent：TUI 交互 + headless 模式 + ACP 协议（packages/tui/src 下可见 acp/headless/host）
- 托管账号（login/--region）与 BYOK（`mcode provider add`，openai-completions 等 API 格式）
- 插件系统（mcode-stack 的安装宿主）、hooks、skills、MCP
- Python SDK（minimax-code-sdk，最近提交显示正在活跃发布 0.1.x）

## 技术栈

- TypeScript（ESM）+ pnpm@9.12 monorepo（33 个 workspace 包），Node.js 22.19+ / 24.2+ / 25 / 26
- 构建 esbuild（scripts/build.mjs），测试 vitest 多套件（policy/byok/sandbox/status-contract/capability/code-sdk/windows，声明于 test/vitest-suites.json）+ node:test 冒烟
- 证据：根 package.json scripts 块、pnpm-workspace.yaml

## 目录结构

```text
packages/
  tui/                 CLI 与 TUI 产品入口（src/: cli tui headless acp host plugin provider auth runtime ...）
  agent-core/          共享运行时契约 + PiTurnRunner 组装层（服务 Mavis 本地/云端宿主）
  agent-runtime/       agent-core 之上的可插拔扩展层（per-turn extension SPI + registry + assembleTurn）
  agent-tools/         平台拥有的运行时工具定义
  agent-modules/       12 个功能模块（二层包结构）
    background-task context-manager conversation-contract cron goal mcp
    permission plugin-hooks runaway-guard session-report skills system-reminder
  protocol/ config/ shared/  基础设施
  code-sdk/            驱动 mcode agent 的 TS SDK（另有 Python SDK）
  browser-core/ local-runtime/ local-runtime-v2/ oauth-core/ oauth-lease-protocol/
  mcode-tools-host/ agent-extension/
third_party/
  pi-mono/             vendored pi 生态四包（agent / ai / coding-agent / tui）
  sandbox-runtime/     沙箱运行时
release/               机器可读发布契约（extraction.json / public-source.json / dependency-licenses.json）
docs/                  含官方 architecture.md、source-sync.md、verification.md、plugins/、superpowers/
tools/plugins/         插件校验器（mcode-stack 的 CI 引用它）
test/ test-vectors/    仓库级测试与套件声明
scripts/               构建/校验工具（build.mjs / verify.mjs / source-inventory.mjs ...）
```

## 入口点

| 入口 | 位置 | 证据 |
| --- | --- | --- |
| CLI/TUI 产品入口 | packages/tui（package.json description "Minimax Code CLI and TUI product entry"） | VERIFIED |
| 运行构建产物 | 根 package.json `start`/`mcode` → `node dist/cli.js`（esbuild 产出） | VERIFIED |
| 官方安装器 | curl 安装脚本 → `~/.minimax-code`，或 npm `@minimax-ai/code` | VERIFIED（README Quick start） |
| SDK 驱动 | packages/code-sdk（TS）、minimax-code-sdk（PyPI） | VERIFIED |
| 插件校验入口 | tools/plugins/validate-plugin.mjs（`pnpm check:plugin`） | VERIFIED |

## 核心模块（初判）

| 模块 | 初步职责 | 证据等级 |
| --- | --- | --- |
| pi-mono（vendored） | agent 基础引擎（agent/ai/coding-agent/tui 四包），产品构建于其上 | VERIFIED（存在）/ UNKNOWN（集成细节，待 Architecture flow） |
| agent-core + PiTurnRunner | 把 pi 引擎组装成本产品的回合执行器，定义共享契约 | VERIFIED（package.json description） |
| agent-runtime | 每回合扩展 SPI + registry + assembleTurn——产品功能的挂接点 | VERIFIED（description） |
| agent-modules 12 模块 | 功能纵切：skills（mcode-stack 的宿主实现）/ permission / mcp / context-manager / runaway-guard / goal / cron / system-reminder 等 | VERIFIED（存在） |
| release/ 契约体系 | 公开源文件清单 + 源基线钉定 + 三方合并同步机制 | VERIFIED（AGENTS.md + docs/source-sync.md 存在） |

## 与已有学习的关联

- mcode-stack 的 skills 装进本产品的 `agent-modules/skills` 宿主；本仓库 `tools/plugins/validate-plugin.mjs` 就是 mcode-stack CI 引用的官方 validator——两个学习对象在此闭环。
- **third_party/pi-mono 正是你日常使用的 pi 生态**：MiniMax Code 是 pi 引擎之上的产品化封装（PiTurnRunner 佐证）。学本仓库 = 看一个 pi 发行版如何被产品化。

## 学习建议

1. **Architecture flow 先读 docs/architecture.md**（官方文档存在，先读官方再验证源码，省大量探索）
2. 顺着「一回合的执行路径」走：tui 入口 → agent-core/PiTurnRunner → agent-runtime 扩展 → tools 执行
3. 重点模块：`agent-modules/skills`（与 mcode-stack 闭环）、`permission`、`context-manager`（与 agent memory 文章主题呼应）
4. release/source-sync 机制值得单独看——「内部单仓库公开投影」是一种罕见的仓库形态
5. Git 历史分析（浅克隆 50 条）只能看近期方向（Python SDK、computer-use），不足以支撑完整演化分析，此局限需在架构笔记中声明
