/**
 * memory-core-mini —— ai-memory-core 的最小 TypeScript 重实现（stage-01 练习）。
 *
 * 参考原版：
 *   repo/crates/ai-memory-core/src/observation.rs   （ObservationKind / valid_file_path_key）
 *   repo/crates/ai-memory-core/src/sanitize.rs      （Sanitized<T>，:882）
 *   repo/crates/ai-memory-core/src/error.rs         （MemoryError）
 *
 * 规则：测试在 tests/acceptance.test.ts，不许改测试，让它们变绿。
 * 你的全部实现写在下方 TODO 处。
 */

// ---------------------------------------------------------------
// 1. Result 与 MemoryError —— 原版 Result 语义 + error.rs
// ---------------------------------------------------------------

// TODO: Rust 的 Result<T, E> 用 discriminated union 模拟：
//   export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
//
// TODO: export type MemoryError =
//   | { kind: 'malformed-record'; message: string }
//   | { kind: 'invalid-file-path'; message: string };
// （kind 判别字段是 TS 惯例；原版 error.rs 的窄变体思路一致）

// ---------------------------------------------------------------
// 2. ObservationKind —— 原版 observation.rs:31 的 10 变体闭集
// ---------------------------------------------------------------

// TODO: 字符串字面量 union（本身就是存储用的 kebab-case）：
//   'session-start' | 'user-prompt' | 'pre-tool-use' | 'post-tool-use'
//   | 'pre-compact' | 'post-compaction' | 'notification' | 'stop'
//   | 'session-end' | 'other'
//
// TODO: export const OBSERVATION_KINDS —— 全部字面量的 readonly 数组（运行时清单）
//
// TODO: parseObservationKind(s: string): Result<ObservationKind, MemoryError>
//   宽容解析：小写化 + '_'→'-' 后在清单里找；未知 => malformed-record
//   提示：norm 化后 includes 一次搞定，比逐个别名分支短

// ---------------------------------------------------------------
// 3. NewObservation —— 原版 observation.rs:121 的 5 字段教学版
// ---------------------------------------------------------------

// TODO:
// export interface NewObservation {
//   sessionId: string;
//   kind: ObservationKind;
//   title: string;
//   body: string;
//   filePath: string | null;
// }

// ---------------------------------------------------------------
// 4. Sanitized<T> —— 原版 sanitize.rs:882（本题灵魂）
// ---------------------------------------------------------------

// TODO: #private 字段 + private constructor —— 运行时和编译期双重封死：
//   export class Sanitized<T> {
//     #value: T;
//     private constructor(value: T) { this.#value = value; }
//     get inner(): T { return this.#value; }
//   }
//
// TODO: static of(obs: NewObservation, scrub: (s: string) => string): Sanitized<NewObservation>
//   唯一构造路径。顺序是灵魂：scrub 先于 truncate（#980）：
//   1. title = truncateUtf8Safe(scrub(obs.title), 80)
//   2. body  = truncateUtf8Safe(scrub(obs.body), 4096)
//   3. filePath = validFilePathKey(obs.filePath) ? obs.filePath : null
//   4. return new Sanitized({...obs, title, body, filePath})

// ---------------------------------------------------------------
// 5. 截断与路径白名单
// ---------------------------------------------------------------

// TODO: truncateUtf8Safe(s: string, maxChars: number): string
//   按码点截断：Array.from(s) 迭代的是码点不是 UTF-16 code unit，
//   slice 后 join('') —— 直接 s.slice(0, max) 会切破 emoji 的代理对

// TODO: validFilePathKey(path: string): boolean
//   非空 && 码点数<=512 && 不以 '/' '\\' 开头 && 无 "X:" 盘符 && 无 '..' 段
//   原版 observation.rs:26（那边是字节切片匹配，这里 split 更直白）
