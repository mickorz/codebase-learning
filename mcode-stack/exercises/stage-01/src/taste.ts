// taste-to-checks 判定逻辑练习桩文件
// 参考源码：MiniMax-AI/mcode-stack stacks/ronny/skills/taste-to-checks/SKILL.md
// 任务：实现下面三个函数，使 tests/taste.test.ts 全绿。
// 规则出处以注释标注（对应 SKILL.md 的节号）。

// ---------- 第 1 节：Catch the repeat（编码门槛） ----------

export interface RepeatSignal {
  /** 同一评审评语写过的次数 */
  sameCommentCount: number;
  /** compaction 或新会话之后同样的问题再次出现 */
  recurredAfterCompaction: boolean;
  /** evidence-first-review 发现机械检查本可抓住的漏 */
  mechanicallyCatchable: boolean;
  /** 这是一次性的怪癖（只发生过一次且无真实损害） */
  oneOffQuirk: boolean;
  /** 造成过真实损害 */
  causedRealDamage: boolean;
}

// ---------- 第 3 节：落点强度表（从上往下，越靠上越强） ----------

export type Placement =
  | 'lint-or-ci-grep'      // 要禁止的代码模式
  | 'test'                 // 必须保持的行为
  | 'hook'                 // 每次编辑或提交必须发生
  | 'project-rule-or-skill' // 需要语境非机械（最后手段）
  | 'review-only';         // 不能机械判定的判断题，留在评审里

export interface RuleSpec {
  /** 一句可测试的规则话（第 2 节） */
  sentence: string;
  /** 是否机械可判定 */
  mechanical: boolean;
  /** 要禁止的代码模式 */
  isPattern?: boolean;
  /** 必须保持的行为 */
  isBehavior?: boolean;
  /** 每次编辑或提交都必须发生 */
  perEdit?: boolean;
  /** 需要语境而非机械判定 */
  needsContext?: boolean;
}

export interface PlacementSuggestion {
  placement: Placement;
  /** 3 = lint > 2 = test > 1 = hook > 0 = 最后手段/评审 */
  strength: number;
  reason: string;
}

// ---------- 第 4 节：Prove the check works（有效性证明） ----------

export interface CheckProof {
  /** 对过去的错误运行检查：是否失败 */
  oldFail: boolean;
  /** 失败时的报错信息（要求清晰、写明修法） */
  failureMessage?: string;
  /** 在当前 main 上是否通过 */
  mainPass: boolean;
}

export interface ProofResult {
  proven: boolean;
  /** 未被证明有效时的原因列表 */
  reasons: string[];
}

// ---------- 待实现的三个函数 ----------

export function shouldEncode(signal: RepeatSignal): boolean {
  throw new Error('not implemented: shouldEncode')
}

export function suggestPlacement(rule: RuleSpec): PlacementSuggestion {
  throw new Error('not implemented: suggestPlacement')
}

export function proveCheck(proof: CheckProof): ProofResult {
  throw new Error('not implemented: proveCheck')
}
