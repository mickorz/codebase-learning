//! memory-core-mini — ai-memory-core 的最小重实现（stage-01 练习）。
//!
//! 参考原版：
//!   repo/crates/ai-memory-core/src/observation.rs   （ObservationKind / valid_file_path_key）
//!   repo/crates/ai-memory-core/src/sanitize.rs      （Sanitized<T> newtype，:882）
//!   repo/crates/ai-memory-core/src/error.rs         （MemoryError）
//!
//! 规则：测试在 tests/acceptance.rs，不许改测试，让它们变绿。
//! 你的全部实现写在下方 TODO 处。

// ---------------------------------------------------------------
// 1. MemoryError —— 原版 error.rs（#[non_exhaustive]）
// ---------------------------------------------------------------

// TODO: 定义 MemoryError 枚举
//   - MalformedRecord(String)   —— 解析失败
//   - 再加 1 个你自选的变体
//   - 记得 #[non_exhaustive] 和 #[derive(Debug, PartialEq)]
// 原版只有 56 行，错误变体是窄的、带语义的，不是 anyhow 的 String 大杂烩。

// ---------------------------------------------------------------
// 2. ObservationKind —— 原版 observation.rs:31
// ---------------------------------------------------------------

// TODO: 10 变体枚举（serde kebab-case 可选，本练习不要求 serde）
//   SessionStart / UserPrompt / PreToolUse / PostToolUse / PreCompact /
//   PostCompaction / Notification / Stop / SessionEnd / Other
//
// TODO: as_str(&self) -> &'static str        （kebab-case 规范形式）
// TODO: impl std::str::FromStr               （宽容解析：大小写不敏感、'_' 与 '-' 等价）
//   提示：先把输入统一小写、'_' 替换为 '-'，再 match —— 比逐个列别名分支短
//   未知输入 => Err(MemoryError::MalformedRecord(...))

// ---------------------------------------------------------------
// 3. NewObservation —— 原版 observation.rs:121 的 5 字段教学版
// ---------------------------------------------------------------

// TODO:
// pub struct NewObservation {
//     pub session_id: String,
//     pub kind: ObservationKind,
//     pub title: String,
//     pub body: String,
//     pub file_path: Option<String>,
// }

// ---------------------------------------------------------------
// 4. Sanitized<T> —— 原版 sanitize.rs:882（本题灵魂）
// ---------------------------------------------------------------

// TODO: newtype，字段私有！访问仅 inner()/into_inner()
// pub struct Sanitized<T>(T);
//
// TODO: impl<T> Sanitized<T> { pub fn inner(&self) -> &T; pub fn into_inner(self) -> T; }
//
// TODO: impl Sanitized<NewObservation> {
//     /// 唯一构造路径。顺序是灵魂：scrub 先于 truncate（#980）。
//     pub fn new(mut obs: NewObservation, scrub: &dyn Fn(&str) -> String) -> Self {
//         // 1. title = truncate_utf8_safe(scrub(&obs.title), 80)
//         // 2. body  = truncate_utf8_safe(scrub(&obs.body), 4096)
//         // 3. file_path = obs.file_path.filter(valid_file_path_key)
//         // 4. Self(obs)
//     }
// }

// ---------------------------------------------------------------
// 5. 截断与路径白名单
// ---------------------------------------------------------------

// TODO: truncate_utf8_safe(s: &str, max_chars: usize) -> String
//   按 char 边界截断，不能 panic（不要直接 s[..max]，那是 byte 下标）

// TODO: valid_file_path_key(path: &str) -> bool
//   非空 && <=512 chars && 不以 '/' '\\' 开头 && 无 "X:" 盘符 && 无 ".." 段
//   原版 observation.rs:26（那边的实现是切片匹配，你可以用 split 更直白）
