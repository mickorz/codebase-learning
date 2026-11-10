# 项目概览：mcode-stack

> 仓库：https://github.com/MiniMax-AI/mcode-stack | 分支：main | 提交：88f84be7075106d8ce283e5d3a8138cdb8f9a205 | 分析日期：2026-11-10

## 项目定位

MiniMax Code 团队日常使用的 agent 工程实践合集：把团队围绕 AI coding agent 的工程习惯（何时让 agent 自检、谁来做评审、状态放在哪里、什么算真实验）做成可安装的 SKILL.md 技能包。**这不是传统软件代码库——没有任何可执行程序，"产品"就是 markdown 形态的 skills/checklists/workflows 合集**，定位是 "article explains the idea, this repo makes it runnable"（文章讲思想，本仓库让它可运行）。

## 主要功能

- 三个「stack」（每人一个技能包）：`ronny`（19 个 skills，研发负责人的完整包）、`jiachen`（2 个：脱离 agent 循环 + 内容制作）、`req-tpm`（v0，需求管理，依赖飞书/Meegle）
- 每个 stack 同时是 Claude Code / Codex / MiniMax Code 的插件包（marketplace 安装或脚本拷贝）
- `notes/`：5 篇 MCode Engineering Notes 文章，每篇配套可运行 skills
- `templates/stack-template/`：新成员建自己 stack 的模板
- CI（validate.yml + scripts/check.mjs）校验 skills 结构

## 技术栈

- 内容：纯 Markdown（SKILL.md 格式 + 纯文本 checklist + WORKFLOW.md）
- 分发：bash 安装脚本（scripts/install.sh）、三套插件 manifest（.claude-plugin / .codex-plugin / .minimax-plugin），manifest 遵循 agent-plugins.org 1.0.0 schema（证据：stacks/ronny/plugin.json）
- CI：Node.js 校验脚本（scripts/check.mjs）
- 无运行时依赖、无包管理器、无测试框架——skill 的 markdown 结构本身就是被校验对象

## 目录结构

```text
stacks/                    每个 stack 一个目录（一人一个技能包）
  ronny/                   最完整：19 skills + checklists/ + WORKFLOW.md + plugin.json
  jiachen/                 2 skills
  req-tpm/                 v0 需求管理（外部依赖 lark-cli/meegle）
  <stack>/.minimax-plugin 等三套 manifest 目录
notes/                     5 篇 Engineering Notes 文章（01-subagent ... 05-prefix-cache）
community/                 外部贡献者的 stack
templates/stack-template/  新 stack 模板（skills/ + WORKFLOW.md + README）
scripts/                   install.sh（安装）+ check.mjs（CI 校验）
docs/assets/               README 配图
```

## 入口点

| 入口 | 位置 | 证据 |
| --- | --- | --- |
| 一键安装命令 | `claude plugin install ronny --marketplace MiniMax-AI/mcode-stack` | README Quick start |
| 降级安装脚本 | `scripts/install.sh [stack]`：有 claude/codex CLI 走 marketplace，否则拷贝到 `~/.agents/skills/` | scripts/install.sh 头部注释 |
| 单技能安装 | 拷贝单个 skill 目录到 `~/.agents/skills/` | README "One skill" 一节 |
| CI 校验 | `.github/workflows/validate.yml` → `scripts/check.mjs` | README 徽章（validate.yml） |

## 核心模块（初判）

| 模块 | 初步职责 | 证据等级 |
| --- | --- | --- |
| stacks/ronny 的 19 个 skills | 主体内容：按「一天中的时刻」组织——拆分任务/上下文管理/长会话/评审/实验/拥有 agent 工作 | VERIFIED（README 表格 + 目录） |
| notes/ 5 篇文章 | 思想层：每篇对应若干 companion skills，构成「文章+可运行件」配对 | VERIFIED（notes/README.md + 文章列表） |
| 插件分发机制 | 让 stack 一条命令装进三种 agent | VERIFIED（plugin.json + install.sh） |
| stack 模板与社区 | 可复制扩展的组织模式 | VERIFIED（templates/、community/） |

## 学习建议

这个仓库对用户有特殊价值：**它与用户自己的 skills 生态（skill-writer / codebase-learning / blog-to-practice）是同类实践**，可对比学习。推荐顺序：

1. **Module 精读 ronny 的 4 个代表性 skills**：`subagent-split-check`（何时拆子代理）、`independent-review`（干净上下文评审）、`evidence-first-review`（agent 说完成时的证据审查）、`taste-to-checks`（重复纠正固化为检查）——这四个是"owner 视角"的核心
2. **Architecture flow 看分发机制**：三套 manifest + marketplace + install.sh 的兼容层设计
3. **对照研究**：`notes/01-subagent.md` 的文章写法 vs 用户 blog-to-practice 的「文章→实践」转化；ronny 的 checklist 形态 vs 用户 skill-writer 的 flow 形态
4. **可选**：req-tpm 的需求管理闭环（与用户工作流可能相关）
