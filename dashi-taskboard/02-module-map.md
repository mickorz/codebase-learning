# 模块地图：Codex Taskboard (dashi-taskboard)

> 仓库：https://github.com/chuspeeism/dashi-taskboard | 分支：main | 提交：bdf7698 | 分析日期：2026-10-23

| 模块 | 路径 | 职责 | 关键文件 | 依赖 | 被依赖 | 证据等级 |
| --- | --- | --- | --- | --- | --- | --- |
| 域模型与词汇表 | shared/domain.mjs | 状态枚举、优先级、默认项目/标签常量 | TASK_STATUSES 等 7 种状态 | 无 | server、间接被前端约定 | VERIFIED |
| 输入校验 | shared/task-input.mjs, api-fields.mjs | 所有 API 入参的解析与校验（乐观版本、过滤器、关系变更） | parseTaskCreate, parseVersionMutation | domain.mjs | server/app.mjs | VERIFIED |
| 会话绑定 | shared/task-records.mjs, composer-reference.mjs | threadBinding 五元组、composer 引用键 | task-records.mjs (222 行) | 无 | app.mjs, taskctl | VERIFIED |
| HTTP 服务 | server/app.mjs (3221 行) | 路由、鉴权/origin 校验、SSE EventHub、静态文件、WebSocket | createTaskboardServer, EventHub | 全部 shared + server 内部模块 | index.mjs, Tauri(进程) | VERIFIED |
| 数据层 | server/database.mjs (2892 行) | 全部 SQL：项目/issue/评论/附件/AI 线程/README | TaskboardDatabase 类 | node:sqlite | app.mjs | VERIFIED |
| 服务进程入口 | server/index.mjs (41 行) | 启动、监听端口/FD、信号处理 | main() | app.mjs | npm start, Tauri | VERIFIED |
| 本地 AI 对话 | server/ai-chat.mjs (1237 行) + ai-chat-catalog/process/turn-owner | AI 聊天线程、runs、composer 集成 | AiChatService | database | app.mjs | VERIFIED（存在与导入）/ UNKNOWN（内部逻辑未深入） |
| Codex app server 集成 | server/codex-app-server.mjs (376 行) | 与 Codex app server 通信 | - | - | app.mjs | VERIFIED（导入） |
| 云代理 companion | server/cloud-proxy.mjs, cloud-config.mjs | 云模式下的本地环回代理、路径映射、Basic Auth | createCloudProxy | - | app.mjs | VERIFIED（导入） |
| Jira 集成 | server/jira-config.mjs, jira-integration.mjs (510 行) | Jira 拉取同步到本地库 | createJiraIntegration | database | app.mjs（GET /api/tasks 触发） | VERIFIED |
| 项目摘要 | server/project-summary.mjs (159 行) | 项目完成度统计 | ProjectSummaryService | database | app.mjs | VERIFIED（导入） |
| CLI | cli/taskctl.mjs (1486 行) | 全部 taskctl 命令，AI 的操作面 | main(), sendRequest(), moveIssue() | 仅 HTTP API | skills 引用、注入器 | VERIFIED |
| React 前端 | web/src/ | 看板/列表/甘特/详情/编辑器/实时刷新 | App.tsx (4250 行), api.ts (808 行), components/ (32 个) | 仅 HTTP API | 注入面板（iframe 加载） | VERIFIED |
| Markdown/文档 | web/src/documentModel.ts, MarkdownDocument.tsx, DescriptionDocument.tsx | ProseMirror 编辑、GFM/mermaid 只读渲染 | - | prosemirror, markdown-it, mermaid | App.tsx | VERIFIED（依赖清单） |
| 修订轮询 | web/src/revisionPolling.mjs | 云版 WebSocket 修订号广播客户端 | createRevisionWebSocketClient | api.ts | App.tsx | VERIFIED（导入） |
| CDP 注入器 | scripts/codex-injector.mjs (3683 行) | 启动/复用 Codex、CDP 注入、服务守护、watch | codex-injector-runtime.mjs, codex-cdp-pipe.mjs | CDP 协议 | 用户脚本 | VERIFIED（规模与 README 行为描述） |
| 注入用户脚本 | inject/codex-taskboard.user.js (2140 行) | 在 Codex 渲染进程里挂侧边栏入口 + iframe 面板 | - | Codex DOM（运行时） | - | VERIFIED（存在）/ UNKNOWN（运行时行为） |
| 桌面壳 | src-tauri/src/main.rs (2733 行) | 打包 Node runtime、启动服务、托盘、窗口管理 | tauri.conf.json | Tauri 2 / objc2 | 全部（进程级） | VERIFIED（存在） |
| 云 Worker | cloud/src/index.mjs (2910 行) | 云版 API：D1 + R2 + Basic Auth + 修订广播 | cloud/migrations/ | D1, R2 | 本地 companion（代理） | VERIFIED（存在） |
| Codex Skill | skills/manage-taskboard/SKILL.md | 教 AI 安全操作看板的工作流规范（认领/冲突/评审） | references/cli.md | taskctl | Codex 运行时 | VERIFIED |
| E2E 测试 | tests/（Playwright）、test/（node:test） | 看板/issue/协作流的无模型 e2e | e2e.config.ts | - | - | VERIFIED |

## 推荐学习顺序

按依赖方向（先被依赖的基础，再核心业务，最后外围形态）：

1. **shared/domain.mjs + task-input.mjs**（~2 小时）——项目的"词汇表"：7 种状态、优先级、输入校验规则。所有后续模块都建立在这套词汇上。它也示范了"无框架 API 项目如何做输入校验"。
2. **server/database.mjs**（~3 小时）——数据长什么样：表结构、version 字段、threadBinding。读懂它就懂了产品的一半业务模型。
3. **server/app.mjs**（~4 小时，最大模块）——路由分发大 if 链、EventHub SSE、origin/loopback 安全校验、静态文件服务。重点不是背路由，而是理解"无框架 HTTP 服务"的组织方式和实时广播设计。
4. **web/src/App.tsx + api.ts**（~3 小时）——前端如何消费 API：SSE 防抖 refetch、乐观 UI、拖拽看板。App.tsx 有 4250 行，建议按功能块（事件订阅/拖拽/视图切换）切片读。
5. **cli/taskctl.mjs + skills/manage-taskboard/SKILL.md**（~2 小时）——同一 API 的第二个消费者，以及"把并发协议写给 AI 看"的产品设计。SKILL.md 本身值得精读。
6. **scripts/codex-injector.mjs + inject/codex-taskboard.user.js**（~4 小时）——CDP 集成第三方 Electron 应用的实战，最有独特学习价值，也最难。
7. **src-tauri/src/main.rs + cloud/src/index.mjs**（各 ~2 小时）——两种部署形态的外壳，独立性强，可按需选学。

> 每一步都可以配一个 Implement 练习（TypeScript + vitest），例如：步骤 1 后实现一个迷你输入校验器；步骤 3 后实现一个 EventHub + SSE 广播；步骤 5 后实现乐观并发冲突重试客户端。
