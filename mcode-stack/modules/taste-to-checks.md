# 模块学习：taste-to-checks

> 仓库：https://github.com/MiniMax-AI/mcode-stack | 提交：88f84be | 分析日期：2026-11-10
> 源文件：stacks/ronny/skills/taste-to-checks/SKILL.md（62 行）

## 1 问题：这个模块解决什么问题

只存在于人脑中的品味（taste）必须在每次评审时手工施加，**不随会话数量 scale**。开篇立场句（L11）："If we tell an agent the same thing twice, the second time is our fault."——第二次还口头纠正，是纠正者的问题，应该把品味写到能自动运行的地方。

## 2 职责：它负责什么，不负责什么

- 负责：把重复出现的纠正固化为自动检查（test / lint / hook / CI / 项目规则）
- 不负责：判断哪些是一次性怪癖（有明确排除规则）；不能测试化的判断题（明确留给评审）

## 3 位置：整体架构中的角色

「Owning agent work」分组，README 索引位：when the same correction comes up twice。它承接 `evidence-first-review` 的产出——后者发现的"机械检查本可抓住的漏"是本 skill 的输入信号之一（第 1 节 L19-20 显式引用）。

## 4 接口：对外公开的 API

- 触发：同样的纠正出现在第二条 agent PR 上 / compaction 或新会话后又出错 / evidence-first-review 发现检查可抓的漏
- Output 契约：规则句、落点、**证明检查有效的两条命令**（旧错误上失败 + main 上通过）、PR 链接

## 5 数据：核心数据结构

核心"数据"是**落点强度表**（第 3 节，按优先级排序）：

| 规则形态 | 落点 |
| --- | --- |
| 要禁止的代码模式 | lint 规则或 CI grep，报错信息写明修法 |
| 必须保持的行为 | test，且**先在坏版本上写到失败** |
| 每次编辑/提交必须发生 | hook（pre-commit 或 agent hook） |
| 需要语境非机械 | 项目规则（AGENTS.md）或 skill，**最后手段** |

排序原则（L38）："Text in AGENTS.md is read and sometimes ignored; a failing check is not."——落点越靠上，执行越不受 agent 自由裁量影响。

## 6 执行：内部执行流程

五步：

1. **抓重复**（第 1 节）：三个信号——同一评审评语写过两次 / 同一问题在 compaction 后或新会话再犯 / evidence-first-review 发现机械检查可抓的漏。**排除规则**：一次性的怪癖不编码，"只编码发生过不止一次、或造成过真实损害的"
2. **把规则写成一句可测试的话**（第 2 节）：bad "keep the code clean"；good "no new `any` in `packages/core`"、"every new tool has a description under 200 characters"、"a bug fix PR includes a test that fails on main"。写不出可测试句 = 判断题 = 留在评审里
3. **选最强的落点**（第 3 节强度表）
4. **证明检查有效**（第 4 节）：对过去的错误运行它——checkout 那个 commit 或重新 apply 坏 diff，确认它失败且报错信息清晰；再确认 main 上通过。**"从未失败过的检查没有被证明有效"**
5. **小步交付**（第 5 节）：一条规则一个 PR，描述里链上来源（评审评语或事故）

## 7 源码：关键段落定位

| 段落 | 位置 | 内容 |
| --- | --- | --- |
| 立场句 | L11 | 第二次口头纠正是纠正者的错 |
| 重复信号与排除 | 第 1 节 L15-21 | 三信号 + 一次性怪癖排除 |
| 可测试句 | 第 2 节 L23-27 | 三条 good 示例都是可机械判定的 |
| 强度表 | 第 3 节 L29-38 | AGENTS.md 是最后手段 |
| 有效性证明 | 第 4 节 L40-42 | 从未失败 = 未证明 |

## 8 设计：作者为什么这样设计

- **落点排序是本 skill 的灵魂**：多数团队的重复纠正停留在 CLAUDE.md/AGENTS.md（恰好是最弱落点——"会被读但有时被忽略"），强度表把"写规则"升级为"选最强执行机制"
- **有效性证明步骤少见但关键**：不验证检查会在坏输入上失败，可能上线一个永远通过的检查（假保护）。"先在坏版本上失败"与 TDD 的红绿循环同构
- **排除规则防过度工程**：明确不编码一次性怪癖，避免规则库膨胀成新的维护负担

## 9 替代方案：其他可能的设计与取舍

- **全写进 AGENTS.md**：最省事，但落在强度表最底端，执行靠 agent 自觉
- **全写 lint/test**：最强执行，但需要语境的判断题机械化为误报来源——所以表底部保留了 AGENTS.md/skill 作为"最后手段"而非禁项
- 代价：每条规则要走完整流程（写句子→选落点→证明→小 PR），一次性投入高于口头纠正；作者用"第二次口头纠正已是我们的错"承担了这个成本

## 10 练习：建议你实现什么

最小实现：TypeScript 的 `RulePlacement` 强度枚举 + `suggestPlacement(rule: { mechanical: boolean; perEdit: boolean; pattern?: boolean }): Placement` 决策函数，按强度表规则排序输出落点；再加一个 `proveCheck(oldFail: boolean, mainPass: boolean)` 验证函数，固化"旧错必须失败且 main 必须通过"的有效性判定。vitest 固化强度排序与有效性判定。
