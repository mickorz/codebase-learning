# 模块地图：mcode-stack

> 仓库：https://github.com/MiniMax-AI/mcode-stack | 提交：88f84be | 分析日期：2026-11-10

| 模块 | 路径 | 职责 | 关键文件 | 依赖 | 被依赖 | 证据等级 |
| --- | --- | --- | --- | --- | --- | --- |
| ronny skills | stacks/ronny/skills/（19 个） | 主体内容：按工作时刻组织的 agent 工程检查 | subagent-split-check / independent-review / evidence-first-review / taste-to-checks 等 | 各自独立，仅靠 WORKFLOW.md 索引关联 | marketplace、install.sh、README | VERIFIED |
| jiachen skills | stacks/jiachen/skills/（2 个） | 脱离 agent 循环 + 内容制作 | lifting-loops / making-content | 独立 | marketplace | VERIFIED |
| req-tpm | stacks/req-tpm/ | 需求管理闭环（v0） | skills/ + templates/ + README | 外部 CLI：lark-cli、meegle | marketplace | VERIFIED（存在）/ UNKNOWN（运行效果） |
| 插件 manifest 组 | 各 stack 的 .minimax-plugin / .claude-plugin / .codex-plugin / 根 plugin.json | 三种 agent 的打包声明，权威版+三份一致拷贝 | stacks/ronny/.minimax-plugin/plugin.json（权威） | skills 目录、icon | marketplace.json、check.mjs、安装器 | VERIFIED |
| marketplace 索引 | .claude-plugin/marketplace.json | 仓库注册为插件市场，一 stack 一条目 | 同左 | 各 stack manifest | claude plugin install | VERIFIED |
| 安装脚本 | scripts/install.sh | 三分支降级安装 | 同左 | stacks 目录、claude/codex CLI（可选） | 用户 | VERIFIED |
| 质量校验 | scripts/check.mjs + .github/workflows/validate.yml | 四项检查：lint / marketplace 一致 / 版本 bump / 官方 validator | check.mjs | 全部声明式文件 | CI | VERIFIED |
| 工程文章 | notes/（5 篇） | 思想层，与 skills 配对 | 01-subagent.md ... 05-prefix-cache.md | 无 | README Articles 表 | VERIFIED |
| stack 模板 | templates/stack-template/ | 新成员建 stack 的起点 | skills/ + WORKFLOW.md + README | 无 | 新 stack 的复制源 | VERIFIED |
| 社区 stack | community/ | 外部贡献者技能包 | community/README.md（当前为空壳说明） | 同 stack 规范 | marketplace（PUBLISHED_PARENTS 含 community） | VERIFIED |

## 推荐学习顺序

本仓库模块间几乎无调用依赖（声明式合集），学习顺序按「借鉴价值 × 内容深度」排序：

1. **ronny 的 4 个代表性 skills**（内容核心，直接可借鉴到自有 skill 体系）：subagent-split-check → evidence-first-review → independent-review → taste-to-checks
2. **check.mjs**（质量机制设计：版本 bump 强制 + manifest 一致性，可移植到自有 skills 仓库的 CI）
3. **notes/01-subagent.md**（文章形态：与自有 blog-to-practice 的「文章→实践」转化对照）
4. **install.sh**（60 行的兼容层，看边界处理即可，无深挖价值）
5. jiachen / req-tpm（可选，按兴趣）
