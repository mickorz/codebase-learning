# 实现练习：taste-to-checks 落点决策与有效性证明 Stage 01

> 仓库：https://github.com/MiniMax-AI/mcode-stack | 参考源码：stacks/ronny/skills/taste-to-checks/SKILL.md（提交 88f84be）
> 代码位置：exercises/stage-01/（package.json + tsconfig 已就绪，src/ 待你实现，tests/ 是验收测试不许改）

## 学习目标

把 skill 里的两段"人类判断"翻译成可执行、可测试的 TypeScript 决策函数，体会这个 skill 的核心主张：**品味只有变成会失败的检查才 scale**——而检查自己也要先被证明有效。

## 需要先理解的概念

- 落点强度表（SKILL.md 第 3 节）：lint/ci-grep > test > hook > AGENTS.md/skill（最后手段），排序原则是"失败的检查不会被忽略，文本会被"
- 有效性证明（第 4 节）：对过去的错误必须失败且报错清晰，main 上必须通过；从未失败过的检查未被证明有效
- 编码门槛（第 1 节）：只编码发生过不止一次、或造成过真实损害的；一次性怪癖不编码
- 可测试句（第 2 节）：规则必须能写成一句机械可判定的话，否则是判断题，留在评审里

## 要创建的文件

只需实现 `exercises/stage-01/src/taste.ts`（已给出类型与桩函数）。tests/ 已有完整验收测试。

## 预计规模与难度

约 60-90 行，难度：低-中。难点不在代码量，在把 markdown 表格翻译成无歧义的分支逻辑。

## 关键函数（签名已定，见 src/taste.ts）

```typescript
// 第 1 节：编码门槛
shouldEncode(signal: RepeatSignal): boolean
// 三信号任一为真且非一次性怪癖 -> true；造成真实损害 -> 即使只发生一次也 true

// 第 3 节：落点决策（严格按强度表从上往下匹配）
suggestPlacement(rule: RuleSpec): PlacementSuggestion
// 非 mechanical 的规则 -> 拒绝编码，留在评审

// 第 4 节：有效性证明
proveCheck(proof: CheckProof): ProofResult
// 旧错误上必须失败且 failureMessage 非空；main 上必须通过；任一不满足给出 reason
```

## 实现任务

伪代码骨架（不完整，分支细节你自己填）：

```typescript
// shouldEncode:
//   若 causedRealDamage -> true（无论次数）
//   若 oneOffQuirk 且未重复 -> false
//   否则看三信号：sameCommentCount >= 2 || recurredAfterCompaction || mechanicallyCatchable

// suggestPlacement（按表格从上到下，命中即返回，强度字段递减）:
//   若 !mechanical -> { placement: 'review-only', strength: 0, reason: 判断题留在评审 }
//   isPattern（禁止的代码模式）-> lint-or-ci-grep, strength 3, 建议报错信息写明修法
//   isBehavior（必须保持的行为）-> test, strength 2, 要求先在坏版本上失败
//   perEdit（每次编辑/提交必须发生）-> hook, strength 1
//   needsContext -> project-rule-or-skill, strength 0（最后手段）
//   互斥约定：isPattern/isBehavior 由调用者声明，一个规则只声明一种形态；
//   perEdit 与 isPattern 同时为真时按表格顺序取更靠上的（pattern 优先）

// proveCheck:
//   oldFail === false -> not proven，reason 必含"从未失败"语义
//   oldFail === true 且 failureMessage 为空 -> not proven，reason 指向"报错信息要清晰"
//   mainPass === false -> not proven
//   全过 -> proven
```

## 测试用例

tests/taste.test.ts 已写好 15 个用例，全部对应 SKILL.md 原文行为：

1. shouldEncode：同评语两次 / compaction 后再犯 / 机械可抓的漏 各自命中；一次性怪癖且无损害拒绝；只发生一次但造成真实损害仍编码
2. suggestPlacement：模式→lint；行为→test；perEdit→hook；needsContext→project-rule；非机械→review-only；pattern+perEdit 冲突时取 lint
3. proveCheck：双绿通过；旧错未失败被拒；main 失败被拒；失败但报错为空被拒

## 验收标准

- [ ] `npm install && npx vitest run` 全绿（15/15）
- [ ] suggestPlacement 的强度值严格递减且与表格行序一致
- [ ] proveCheck 的拒绝 reason 里至少一条引用"从未失败过的检查未被证明有效"的原意
- [ ] 不改 tests/ 与 src/taste.ts 之外的文件
