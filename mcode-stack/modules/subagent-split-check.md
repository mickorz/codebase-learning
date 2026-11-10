# 模块学习：subagent-split-check

> 仓库：https://github.com/MiniMax-AI/mcode-stack | 提交：88f84be | 分析日期：2026-11-10
> 源文件：stacks/ronny/skills/subagent-split-check/SKILL.md（77 行）+ checklists/subagent-split.md

## 1 问题：这个模块解决什么问题

多代理热潮下，团队倾向于"多子代理=架构高级"。这个 skill 对抗的正是这种倾向：**子代理是 context 管理工具，不是地盘划分**。拆错的代价是有损交接（lossy hand-offs）——子代理只带结论回来，原始信息在交接中丢失。

## 2 职责：它负责什么，不负责什么

- 负责：判断一件工作拆子代理还是留主循环；已有子代理系统如何合并回主循环
- 不负责：怎么测量（委托给 `harness-experiment`）、状态怎么落盘（委托给 `handoff-doc`）、工具预算怎么省（委托给 `tool-budget-audit`）

## 3 位置：整体架构中的角色

属于 ronny stack「Plan & split」分组，是**拆分决策的前置闸门**——README「一天中的时刻」索引里排第一位（before splitting work across agents）。它是 notes/01 文章的可运行形态。

## 4 接口：对外公开的 API

- frontmatter description 定义触发场景：spawn 子代理前 / 设计多代理架构时 / 审计现有子代理集准备合并时
- Output 契约（SKILL.md 末段）：必须回答四件事——拆还是不拆、满足哪个条件（或"none met"）、拆的话边界在哪、用什么测量来确认

## 5 数据：核心数据结构

无代码数据结构。核心"数据"是**三条件判定表**（SKILL.md 第 1 节）：

1. Measured degradation——测量到的退化，"measured means eval results, not a feeling"（L17-18）
2. Parallel, disposable work——并行、可丢弃、各需干净 context（L19-20）
3. Tool or instruction conflict——主循环持续选错工具或指令互相冲突（L21-22）

外加一个**决定性问题**（L26-27）：这一步的中间原始输出以后还要用吗？只要结论的才适合子代理。

## 6 执行：内部执行流程

四段式走查（每段一个"检查门"）：

1. **有无 context 理由**（三条件任一）→ 没有则不拆；"属于另一个团队"或"这是另一类问题"是反指标（L29-31）
2. **沿 context 边界切**：子任务几乎不依赖系统其余部分、返回紧凑结果（verdict/list/小结构化对象）；把子代理暴露为主代理的**工具**，主代理保留与用户的对话（L35-40）
3. **先试更便宜的修复**：工具多→`tool-budget-audit`；prompt 大→程序规则变 skills；怕丢状态→`handoff-doc` 落文件，"状态在文件里，会话就能安全清空，为保护 context 而拆的冲动大多消失"（L44-48）
4. **合并既有子代理**（六步，L52-64）：先建小 eval（golden examples 几条就够）→ 合并最高频最紧耦合的 → 过渡期把剩余子代理包装成 tools（顺便得到基线）→ 一次合并一个（prompt 变 skill，API 调用变 tool）→ 对比前后、看翻转任务不只看总分、每任务跑多次 → 除非测量到变差，保留合并版

## 7 源码：关键段落定位

| 段落 | 位置 | 内容 |
| --- | --- | --- |
| 立场陈述 | L11-13 | "Subagents are a tool for managing context, not for dividing up territory. Default to one main loop" |
| 三条件 | 第 1 节 L15-22 | 拆分准入条件 |
| 决定性问题 | L26-27 | raw intermediate output vs conclusion |
| 反指标 | L29-31 | 组织归属/问题类型不是拆分理由 |
| 六步合并法 | 第 4 节 L52-64 | 迁移路径 |

checklists/subagent-split.md 是同内容的 7 项纯文本勾选版，供人直接走查（两副本一致性无 CI 校验，见架构笔记 UNKNOWN 项）。

## 8 设计：作者为什么这样设计

- **"measured, not a feeling"写进正文**：把最常见的拍脑袋拆分直接堵死，要求 eval 证据
- **把合并路径也纳入**（第 4 节）：多数 skill 只管"怎么拆"，这个还管"拆错了怎么合回来"——承认历史决策可能错，并给出低风险迁移路径（先 eval、先包 tools、一次一个）
- **引用兄弟 skills 而非内联**：三个便宜修复各指向专门 skill，保持本 skill 只做判断不做执行

## 9 替代方案：其他可能的设计与取舍

- **静态拆分规则表**（按任务类型/目录自动拆）：可执行性强但失配场景多；本设计选择"逐案判定"，代价是每次要走查
- **只写"何时不拆"**：正面三条件+负面反指标+决定性问题三者结合，比单一负面清单更可操作
- 代价：本 skill 本身不测量，依赖 harness-experiment 的纪律，若团队没有 eval 习惯，第 1 条件形同虚设

## 10 练习：建议你实现什么

用 Implement flow 做一个最小版本：写一个 TypeScript 决策函数 `shouldSplit(input): { split: boolean; condition?: string; boundary?: string; measure: string }`，输入结构化的三条件信号，输出契约与 SKILL.md Output 段一致；用 vitest 固化"三条件都不满足时必须输出 none met"等判定规则。
