# 实现练习：memory-core-mini（TypeScript）Stage 01

> 仓库：https://github.com/akitaonrails/ai-memory | 参考源码：`ai-memory/repo/crates/ai-memory-core/src/{observation.rs, sanitize.rs, error.rs}`
> 练习项目：`ai-memory/memory-core-mini/`（TypeScript + vitest）
> 语言说明：上游是 Rust，练习统一用 TypeScript 实现；类型映射规则见 skill 的 implement-flow.md

## 学习目标

亲手复刻 core 的三个核心机制，理解"类型化信任边界"为什么必须这样设计：

1. 宽容归一化：`ObservationKind` 三种命名风格互认 + 往返保证
2. **类型化信任边界**：`Sanitized<T>` class（`#private` 字段 + `private constructor`），scrub-then-truncate 顺序约束（复现 #980）
3. 路径白名单：`validFilePathKey` 表驱动校验

## 需要先理解的概念

- TypeScript `#private` 字段与 `private constructor`：运行时 + 编译期双重封死，是 TS 里最接近 Rust newtype 的方案
- discriminated union 模拟 Rust `Result<T, E>`：`{ ok: true; value: T } | { ok: false; error: E }`
- string literal union 代替 Rust 枚举；解析函数返回 Result 而不是 throw
- JS 字符串按 UTF-16 code unit 切片会切破代理对——按码点截断用 `Array.from(s)`
- #980 bug：先截断会把秘密切成两半，前半段太短匹配不到密钥模式 → 未脱敏入库

## 要创建的文件（骨架已建好）

```
memory-core-mini/
├── package.json            # 已建好（vitest + typescript）
├── tsconfig.json           # 已建好
├── src/
│   └── index.ts            # 你的实现（骨架已给，填 TODO）
└── tests/
    └── acceptance.test.ts  # 验收测试（已建好，不许改——让它们变绿）
```

## 预计规模与难度

- 规模：index.ts 约 120-180 行
- 难度：入门-中级（discriminated union + `#private` class + 表驱动测试）

## 关键函数（TS 惯用签名，对照原版）

```ts
// 原版 observation.rs:31 的 10 变体 → 字符串字面量 union（本身就是 kebab-case）
export type ObservationKind =
  | 'session-start' | 'user-prompt' | 'pre-tool-use' | 'post-tool-use'
  | 'pre-compact' | 'post-compaction' | 'notification' | 'stop'
  | 'session-end' | 'other';

// 原版 FromStr → 解析函数；Result 用 discriminated union 模拟
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export type MemoryError =
  | { kind: 'malformed-record'; message: string }
  | { kind: 'invalid-file-path'; message: string };
export function parseObservationKind(s: string): Result<ObservationKind, MemoryError>;

// 原版 sanitize.rs:882 —— #private 字段 + private constructor 双重封死
export class Sanitized<T> {
  #value: T;
  private constructor(value: T) { this.#value = value; }
  get inner(): T { return this.#value; }
  // 原版 sanitize.rs:907 —— 唯一构造路径；顺序是灵魂：scrub 先于 truncate
  static of(obs: NewObservation, scrub: (s: string) => string): Sanitized<NewObservation>;
}

// 原版 observation.rs:26 —— 表驱动路径白名单
export function validFilePathKey(path: string): boolean;

// 按"码点"截断（Array.from 迭代），不是 slice（会切破代理对）
export function truncateUtf8Safe(s: string, maxChars: number): string;
```

与原版的简化差异（**刻意为之**）：sanitizer 不做正则引擎，注入 `scrub: (s: string) => string`；`NewObservation` 缩为 5 字段。

## 实现任务（伪代码，不含完整实现）

```
parseObservationKind(s):
  norm = s.toLowerCase().replaceAll('_', '-')
  OBSERVATION_KINDS.includes(norm) ? ok(norm) : err({ kind: 'malformed-record', ... })

Sanitized.of(obs, scrub):                             # 顺序是本题灵魂
  title = truncateUtf8Safe(scrub(obs.title), 80)      # scrub 在前
  body  = truncateUtf8Safe(scrub(obs.body), 4096)     # scrub 在前
  filePath = validFilePathKey(obs.filePath) ? obs.filePath : null
  return new Sanitized({...obs, title, body, filePath})

validFilePathKey(path):
  非空 && 码点数<=512 && 不以 '/' '\\' 开头 && 不匹配 X: 盘符 && 无 '..' 段
```

## 测试用例（acceptance.test.ts 已写好，5 组）

1. `kind 往返` —— 10 个字面量 parse 后 asStr 恒等
2. `kind 三风格互认` —— `PostToolUse`/`post_tool_use`/`post-tool-use` 同解；未知返回 `malformed-record`
3. **`#980 对抗`（本题灵魂）** —— body 含 33 字符密钥，截断上限 20 恰好切在密钥中间；错误实现（先截断后 scrub）残留 `AKIA` 片段，断言输出含 `[REDACTED]` 且不含任何密钥片段
4. `路径白名单` —— 表驱动 8 例：合法相对/绝对路径/`..`/盘符/超长/空/反斜杠/中文路径
5. `不合规 file_path 清空为 null` —— 不是报错而是消失（原版 `admits_file_path` 语义）

## 验收标准

- [ ] `npm test` 全绿（5 组测试全过）
- [ ] `npx tsc --noEmit` 无类型错误
- [ ] 尝试在测试外构造 `Sanitized`（`new Sanitized(...)` 或 `Object.assign`）编译期/运行期失败——`#private` 与 `private constructor` 的意义
- [ ] 能口头回答：为什么 scrub 必须在 truncate 之前？`#private` 字段阻止了哪种真实事故？
