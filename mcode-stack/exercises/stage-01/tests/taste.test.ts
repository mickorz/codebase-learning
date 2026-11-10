// 验收测试：对应 stacks/ronny/skills/taste-to-checks/SKILL.md 的行为约定。
// 本文件是验收标准，学习者不要修改。
import { describe, expect, it } from 'vitest'
import {
  proveCheck,
  shouldEncode,
  suggestPlacement,
  type CheckProof,
  type RepeatSignal,
  type RuleSpec,
} from '../src/taste.js'

// ---------- shouldEncode：SKILL.md 第 1 节 ----------

const base: RepeatSignal = {
  sameCommentCount: 1,
  recurredAfterCompaction: false,
  mechanicallyCatchable: false,
  oneOffQuirk: false,
  causedRealDamage: false,
}

describe('shouldEncode', () => {
  it('同一评审评语写过两次 -> 编码', () => {
    expect(shouldEncode({ ...base, sameCommentCount: 2 })).toBe(true)
  })

  it('compaction 或新会话后再犯 -> 编码', () => {
    expect(shouldEncode({ ...base, recurredAfterCompaction: true })).toBe(true)
  })

  it('机械检查能抓的漏 -> 编码', () => {
    expect(shouldEncode({ ...base, mechanicallyCatchable: true })).toBe(true)
  })

  it('一次性怪癖且无损害 -> 不编码', () => {
    expect(shouldEncode({ ...base, oneOffQuirk: true })).toBe(false)
  })

  it('只发生一次但造成真实损害 -> 仍然编码', () => {
    expect(shouldEncode({ ...base, causedRealDamage: true })).toBe(true)
  })
})

// ---------- suggestPlacement：SKILL.md 第 3 节强度表 ----------

describe('suggestPlacement', () => {
  it('要禁止的代码模式 -> lint 或 CI grep，强度 3', () => {
    const r = suggestPlacement({
      sentence: 'no new any in packages/core',
      mechanical: true,
      isPattern: true,
    })
    expect(r.placement).toBe('lint-or-ci-grep')
    expect(r.strength).toBe(3)
  })

  it('必须保持的行为 -> test，强度 2', () => {
    const r = suggestPlacement({
      sentence: 'a bug fix PR includes a test that fails on main',
      mechanical: true,
      isBehavior: true,
    })
    expect(r.placement).toBe('test')
    expect(r.strength).toBe(2)
  })

  it('每次编辑提交必须发生 -> hook，强度 1', () => {
    const r = suggestPlacement({
      sentence: 'every commit message references an issue',
      mechanical: true,
      perEdit: true,
    })
    expect(r.placement).toBe('hook')
    expect(r.strength).toBe(1)
  })

  it('需要语境非机械 -> 项目规则或 skill，强度 0（最后手段）', () => {
    const r = suggestPlacement({
      sentence: 'naming should follow domain conventions',
      mechanical: true,
      needsContext: true,
    })
    expect(r.placement).toBe('project-rule-or-skill')
    expect(r.strength).toBe(0)
  })

  it('非机械可判定的判断题 -> review-only，留在评审里', () => {
    const r = suggestPlacement({
      sentence: 'keep the code clean',
      mechanical: false,
    })
    expect(r.placement).toBe('review-only')
    expect(r.strength).toBe(0)
  })

  it('pattern 与 perEdit 同时为真 -> 按表格顺序取更靠上的 lint', () => {
    const r = suggestPlacement({
      sentence: 'no console.log in src, checked every commit',
      mechanical: true,
      isPattern: true,
      perEdit: true,
    })
    expect(r.placement).toBe('lint-or-ci-grep')
    expect(r.strength).toBe(3)
  })
})

// ---------- proveCheck：SKILL.md 第 4 节 ----------

describe('proveCheck', () => {
  it('旧错误上失败且报错清晰、main 上通过 -> 证明有效', () => {
    const proof: CheckProof = {
      oldFail: true,
      failureMessage: 'found console.log in src/a.ts:12, remove or use logger',
      mainPass: true,
    }
    expect(proveCheck(proof).proven).toBe(true)
  })

  it('从未失败过的检查未被证明有效', () => {
    const r = proveCheck({ oldFail: false, mainPass: true })
    expect(r.proven).toBe(false)
    expect(r.reasons.some((s) => s.includes('从未失败'))).toBe(true)
  })

  it('失败但报错信息为空 -> 未证明（报错要清晰、写明修法）', () => {
    const r = proveCheck({ oldFail: true, failureMessage: '', mainPass: true })
    expect(r.proven).toBe(false)
  })

  it('main 上不通过 -> 未证明', () => {
    const r = proveCheck({
      oldFail: true,
      failureMessage: 'boom',
      mainPass: false,
    })
    expect(r.proven).toBe(false)
  })
})
