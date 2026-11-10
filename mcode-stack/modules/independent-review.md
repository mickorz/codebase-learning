# 模块学习：independent-review

> 仓库：https://github.com/MiniMax-AI/mcode-stack | 提交：88f84be | 分析日期：2026-11-10
> 源文件：stacks/ronny/skills/independent-review/SKILL.md（79 行）

## 1 问题：这个模块解决什么问题

写代码的 agent 在实现过程中做了大量小决策并逐一说服了自己；**继承该对话的评审者会顺着同样的推理，漏掉同样的东西**。本 skill 把评审者隔离在作者 context 之外，回答的问题是"这个改动满足需求吗"，而不是"作者的推理成立吗"。

## 2 职责：它负责什么，不负责什么

- 负责：对 diff 做干净上下文的代码评审（外部评审员视角）
- 不负责：验收 agent 工作陈述的真实性（`evidence-first-review` 负责，两者显式配对）

## 3 位置：整体架构中的角色

「Review」分组，README 索引位：after the agent finishes a change / before merging。它与 subagent-split-check 形成呼应——**干净上下文评审正是三条件里"parallel, disposable work + 只要结论"的标准案例**（第 2 节 L23-25 自己点明："which is the kind of split that is worth a subagent"）。

## 4 接口：对外公开的 API

- 触发：agent 完成实现后、merge 前、或被要求独立/第二意见评审时
- 输入契约：**恰好三个输入，别的什么都不给**——diff（`git diff <base>...HEAD`）、requirement（issue/spec/验收标准）、test results（真实命令与输出，含失败和跳过）
- 发现的输出结构：Problem / Location / Reason / Severity（blocking / should-fix / nit）四字段，缺 location 或 reason 视为观点而非缺陷（第 3 节）

## 5 数据：核心数据结构

两个"数据"设计：

1. **三输入边界**（第 1 节）：显式禁止传入作者的对话、计划、中间推理、自评——这是防止评审被作者思路污染的机制本体
2. **发现四字段结构**：强制 Location + Reason 使发现可验证、可反驳

## 6 执行：内部执行流程

四步：

1. **收集恰好三个输入**；需求缺失就停下来要需求——"没有需求的评审只能查风格"（L21-22）
2. **在新 context 里跑评审**，优先级递减：子代理（黑盒+清晰边界+紧凑结果）> 内置评审命令 > 新会话粘贴。评审重点四类：代码依赖但未检查的假设（null/空输入、"调用方已校验"、顺序、并发、错误路径）/ diff 未覆盖的需求项 / **通过但没有真正测到需求的测试**（同一 agent 写的测试共享它的盲区，要查测试是否覆盖需求而非只看是否通过）/ 声明范围外的行为变化
3. **按固定结构收发现**（四字段）
4. **主循环验证后再修**（第 4 节）：不整体采纳发现——逐条打开真实代码确认问题存在（理想是有失败测试或具体输入）才修，修后重跑相关测试；**记录被拒绝的发现及理由**，"让下一次评审不再提同样的意见"

## 7 源码：关键段落定位

| 段落 | 位置 | 内容 |
| --- | --- | --- |
| 三输入契约 | 第 1 节 L15-22 | collect these, and nothing else |
| 需求缺失即停 | L21-22 | "A review without a requirement can only check style" |
| 测试盲区警告 | 第 2 节 L37-38 | 同 agent 的测试共享盲区 |
| 四字段发现 | 第 3 节 L48-56 | 无 location/reason 即观点 |
| 拒绝记录 | 第 4 节 L62-66 | findings you rejected and why |

## 8 设计：作者为什么这样设计

- **"恰好三个输入"是负空间设计**：列禁止传入的内容（对话/计划/推理/自评）比列允许的更有约束力——污染源是明确的
- **区分两种评审问题**："改动满足需求吗"vs"作者推理成立吗"——后者天然会被作者框架带偏，前者只看结果对需求的关系
- **发现可反驳化**：Location+Reason 字段让主循环可以逐条证伪，被拒绝的发现留档避免评审噪音复利

## 9 替代方案：其他可能的设计与取舍

- **同上下文自查**（agent 自己复查）：零成本但盲区共享，正是本 skill 反对的
- **双人评审**：更独立但贵且慢；本设计用"新 context + 三输入"近似外部评审员
- 代价：三输入的收集本身有成本（尤其 requirement 经常缺失，此时流程会卡住等人）——作者选择让流程停而非降级为风格检查

## 10 练习：建议你实现什么

最小实现：TypeScript 的 `ReviewFinding` 类型 + `validateFinding(f): 'defect' | 'opinion'` 判定（四字段完整性）+ 一个三输入打包器 `assembleReviewInputs(diff, requirement, testResults): ReviewPacket`，校验 requirement 非空否则抛错（对应"缺需求即停"）。vitest 固化：缺 location/reason 判为 opinion、requirement 为空必须拒绝打包。
