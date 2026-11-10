# 项目概览：Codex Taskboard (dashi-taskboard)

> 仓库：https://github.com/chuspeeism/dashi-taskboard | 分支：main | 提交：bdf7698f6c3f3737a65377814dbb9db7ce81ea38 | 分析日期：2026-10-23

## 项目定位

一个**本地优先（local-first）的 issue 看板**：在浏览器里跑，也可以通过 CDP 注入嵌入到 Codex 桌面应用里当侧边栏用。同一个 HTTP API 同时驱动 React UI 和 `taskctl` CLI，让 AI 编码助手（Codex）和人类用同一块看板协作。写给"用 Codex 干活、需要一个任务板的个人/小团队"。

类比：它像是一个"私人版的 Linear/Trello"，但不部署在别人的云上——SQLite 文件就在你本机 `.data/taskboard.sqlite`，同时又能通过 CDP 注入"长"进 Codex 桌面应用的界面里，成为 AI 的工作台。

## 主要功能

- 看板视图（7 种状态：backlog / todo / in_progress / in_review / blocked / done / canceled）+ 列表视图 + 甘特图视图（`dhtmlx-gantt`，见 package.json 依赖）
- 项目（project）/ issue / 评论 / 附件 / 标签 / 关系（parent、blocks、related）/ 优先级（shared/domain.mjs VERIFIED）
- Markdown 任务描述与评论（GFM、mermaid 只读渲染、ProseMirror 富文本编辑）
- 实时协作：SSE `/api/events` 广播 + 修订号轮询/WebSocket（server/app.mjs:2504、web/src/App.tsx:602,2191 VERIFIED）
- `taskctl` CLI：AI 通过它认领 issue（乐观版本号并发控制 `--if-version`）、移动状态、写评论（skills/manage-taskboard/SKILL.md VERIFIED）
- Codex 集成：CDP 注入侧边栏入口（scripts/codex-injector.mjs + inject/codex-taskboard.user.js）、issue ↔ Codex 会话绑定（threadBinding 五元组）
- 桌面 App（macOS/Linux/Windows，Tauri 打包自带 Node runtime）
- 云协作：Cloudflare Worker + D1 + R2，HTTPS Basic Auth（cloud/src/index.mjs）
- Jira 同步（server/jira-integration.mjs）、本地 AI 对话线程（server/ai-chat.mjs）

## 技术栈

| 层 | 技术 | 证据 |
| --- | --- | --- |
| 语言 | JavaScript (纯 ESM .mjs) + TypeScript (前端) + Rust (桌面壳) | 目录结构 + package.json `"type": "module"` |
| 运行时 | Node.js ^22.22.3 \|\| >=24.8.0 | package.json engines |
| HTTP 服务器 | **原生 `node:http`（无框架）** | server/app.mjs `import { createServer } from "node:http"` VERIFIED |
| 数据库 | **`node:sqlite` 内置模块（无 ORM）** | server/database.mjs:19 `import { DatabaseSync } from "node:sqlite"` VERIFIED |
| 实时 | `ws` WebSocket + SSE + 修订号轮询 | package.json 依赖、server/app.mjs:26 |
| 前端 | React 19 + Vite 8 + TypeScript 7 | package.json |
| 编辑/渲染 | ProseMirror 全家桶、markdown-it、react-markdown、mermaid 11 | package.json |
| 桌面 | Tauri 2.11（Rust，objc2/AppKit 深度集成） | src-tauri/、package.json devDeps |
| 云 | Cloudflare Worker + D1 + R2 + wrangler 4 | wrangler.jsonc、cloud/ |
| 测试 | node:test + vitest + jsdom + Playwright e2e | package.json scripts |

## 目录结构

```text
repo/
├── server/          # 本地 HTTP 服务（入口 index.mjs，主体 app.mjs 路由 + database.mjs SQLite）
├── shared/          # 前后端共享：域模型、输入校验、threadBinding 记录（13 个 .mjs）
├── web/             # React 前端（App.tsx 主状态 + 32 个组件）
├── cli/             # taskctl CLI（单文件 1486 行，package.json bin）
├── scripts/         # Codex CDP 注入器/启动器、Tauri 构建、发布校验等 20+ 脚本
├── inject/          # 注入 Codex 的用户脚本 codex-taskboard.user.js（2140 行）
├── src-tauri/       # Tauri 桌面壳（main.rs 2733 行，负责 spawn Node 服务）
├── cloud/           # Cloudflare Worker 云端版（index.mjs 2910 行 + D1 migrations）
├── skills/          # manage-taskboard Codex Skill（教 AI 用 taskctl 的工作流）
├── integrations/    # deepseek-harness 等外部集成
├── tools/windows/   # Windows 辅助工具
├── test/  tests/    # node:test 套件 + Playwright e2e
└── docs/            # 产品文档（云协作、签名策略等）
```

## 入口点

| 入口 | 位置 | 证据 |
| --- | --- | --- |
| 本地服务进程 | server/index.mjs `main()` → app.mjs `createTaskboardServer()` | index.mjs:14-17 VERIFIED |
| HTTP 路由分发 | server/app.mjs（if pathname === ... 逐条匹配） | app.mjs:1812-2504+ VERIFIED |
| CLI | cli/taskctl.mjs（package.json `"bin": {"taskctl": "./cli/taskctl.mjs"}`） | package.json VERIFIED |
| 前端 | web/src/main.tsx → App.tsx | main.tsx VERIFIED |
| Codex 注入器 | scripts/codex-injector.mjs（npm run codex / codex:inject） | package.json scripts VERIFIED |
| 注入用户脚本 | inject/codex-taskboard.user.js | 文件存在 VERIFIED |
| 桌面 App | src-tauri/src/main.rs | 文件存在 VERIFIED |
| 云 Worker | cloud/src/index.mjs（wrangler.jsonc 配置） | 文件存在 VERIFIED |

## 核心模块（初判）

| 模块 | 初步职责 | 证据等级 |
| --- | --- | --- |
| server/app.mjs（3221 行） | HTTP 服务：路由、origin 校验、SSE 广播、静态文件、WebSocket | VERIFIED |
| server/database.mjs（2892 行） | `TaskboardDatabase` 类：全部 SQL（项目/issue/评论/附件/AI 线程） | VERIFIED |
| shared/（1322 行） | 域模型 + 输入解析校验（task-input.mjs、api-fields.mjs），前后端共用 | VERIFIED |
| web/src/App.tsx（4250 行） | 前端主状态容器（拖拽、过滤、实时刷新、视图路由） | VERIFIED（行数与导入关系） |
| cli/taskctl.mjs（1486 行） | CLI 命令 → HTTP API 调用，JSON 输出，乐观版本号 | VERIFIED |
| scripts/codex-injector.mjs（3683 行） | CDP 启动器 + 注入 + 服务守护 | VERIFIED（文件规模与 README 描述一致） |
| src-tauri/src/main.rs（2733 行） | 桌面壳：打包 Node runtime、启动服务、注入面板 | VERIFIED |
| cloud/src/index.mjs（2910 行） | 云端 Worker：D1 + R2 + Basic Auth + 修订号广播 | VERIFIED |
| skills/manage-taskboard | Codex Skill：认领/移动/评审的 taskctl 工作流规范 | VERIFIED |

## 学习建议

这个项目最有学习价值的两条主线：

1. **本地服务 + 数据层**（server/app.mjs + database.mjs + shared/）——一切功能的根，无框架写 HTTP 服务、乐观并发、SSE 实时推送，都是可复用的能力。
2. **Codex 注入链路**（scripts/codex-injector.mjs + inject/user.js）——CDP 集成第三方 Electron 应用的实战，市面上少见。

推荐顺序：`shared/domain.mjs`（词汇表）→ `server/database.mjs`（数据长什么样）→ `server/app.mjs`（路由与实时）→ `web/src/App.tsx`（UI 消费）→ `cli/taskctl.mjs`（AI 消费）→ 注入链路 → Tauri/Cloud。
