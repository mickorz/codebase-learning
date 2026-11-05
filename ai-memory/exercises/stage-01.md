# 实现练习：memory-core-mini Stage 01

> 仓库：https://github.com/akitaonrails/ai-memory | 参考源码：`repo/crates/ai-memory-core/src/{observation.rs, sanitize.rs, error.rs}`
> 练习项目：`learning/ai-memory/memory-core-mini/`

## 学习目标

亲手复刻 core 的三个核心机制，理解"类型化信任边界"为什么必须这样设计：

1. 宽容归一化：`ObservationKind` 三种命名风格互认 + 往返保证
2. **类型化信任边界**：`Sanitized<T>` newtype，scrub-then-truncate 顺序约束（复现 #980）
3. 路径白名单：`valid_file_path_key` 表驱动校验

## 需要先理解的概念

- Rust newtype 模式：`struct Sanitized<T>(T)` 私有字段 = 编译器级访问控制
- `impl Sanitized<NewObservation>` 特化构造：只有这个 impl 块能造出"已消毒"标记
- `FromStr` trait + `#[non_exhaustive]` 枚举
- UTF-8 安全截断（不能在 char 边界中间切开）：`str::char_indices`
- #980 bug：先截断会把秘密切成两半，前半段太短匹配不到密钥模式 → 未脱敏入库

## 要创建的文件

```
memory-core-mini/
├── Cargo.toml            # 已建好
├── src/lib.rs            # 你的实现（骨架已给，填 TODO）
└── tests/
    └── acceptance.rs     # 验收测试（已建好，不许改——让它们变绿）
```

## 预计规模与难度

- 规模：lib.rs 约 180-250 行（含注释）
- 难度：入门-中级（newtype 泛型 + FromStr + 表驱动测试）

## 关键函数（签名与职责，对照原版）

```rust
// 原版 observation.rs:31 —— 10 变体闭集
pub enum ObservationKind { SessionStart, UserPrompt, PreToolUse, PostToolUse,
    PreCompact, PostCompaction, Notification, Stop, SessionEnd, Other }

// 原版 observation.rs:74 —— 三风格互认；未知输入返回 MalformedRecord
impl FromStr for ObservationKind { type Err = MemoryError; /* ... */ }

// 原版 observation.rs:48 —— 存储/线格式用 kebab-case
impl ObservationKind { pub const fn as_str(&self) -> &'static str; }

// 原版 sanitize.rs:882 —— 私有字段 newtype，访问仅 inner/into_inner
pub struct Sanitized<T>(T);

// 原版 sanitize.rs:907 —— 唯一构造路径；顺序：scrub 先于 truncate
impl Sanitized<NewObservation> {
    pub fn new(obs: NewObservation, scrub: &dyn Fn(&str) -> String) -> Self;
}

// 原版 observation.rs:26 —— 表驱动路径白名单
pub fn valid_file_path_key(path: &str) -> bool;

// 原版 error.rs —— workspace 统一错误
pub enum MemoryError { MalformedRecord(String), /* + 1-2 个自选变体 */ }
```

与原版的简化差异（**刻意为之**，写注释说明即可）：
- sanitizer 不做正则引擎，改为注入的 `scrub: &dyn Fn(&str) -> String`（重点在顺序约束，不在模式库）
- `NewObservation` 缩减为 5 字段：session_id/kind/title/body/file_path
- 不做 UTF-8 head-tail 截断，只需 char 边界安全的普通截断（`truncate_utf8_safe(s, max)`）

## 实现任务（伪代码，不含完整实现）

```
fn main 流程不存在 —— 这是纯类型库，测试驱动

ObservationKind::from_str:
    match s 规范化（小写化 + '_'→'-'）
      "session-start" => Ok(SessionStart)
      ... 10 个分支
      _ => Err(MalformedRecord)

Sanitized::<NewObservation>::new(obs, scrub):        # 顺序是本题灵魂
    obs.title = truncate(scrub(obs.title), 80)       # scrub 在前
    obs.body  = truncate(scrub(obs.body), 4096)      # scrub 在前
    obs.file_path = obs.file_path.filter(valid_file_path_key)
    Self(obs)                                        # 贴"已检疫"标签

valid_file_path_key(path):
    非空 && 字符数<=512 && 不以 / \\ 开头 && 不匹配 X: 盘符 && 无 .. 段
```

注意：`truncate_utf8_safe` 先自己实现（`char_indices` 找 ≤max 的边界）；`Sanitized` 的字段**必须私有**，访问走 `inner()`/`into_inner()`。

## 测试用例（tests/acceptance.rs 已写好，5 组）

1. `kind_round_trips` —— 10 个变体 as_str↔from_str 互逆
2. `kind_accepts_three_styles` —— `PostToolUse`/`post_tool_use`/`post-tool-use` 同解；未知返回 `MalformedRecord`
3. **`secret_split_by_truncation_must_stay_redacted`（#980 对抗，本题灵魂）** —— body 放一个长密钥 `AKIAIOSFODNN7EXAMPLE_SECRET_VALUE`，截断点落在密钥中间。错误实现（先截断后 scrub）会让前半段密钥原文残留；正确实现输出含 `[REDACTED]` 且**不含任何密钥片段**
4. `file_path_whitelist` —— 表驱动 8 例：合法相对路径/绝对路径/`..`/盘符/超长/空/反斜杠/中文路径
5. `redaction_marks_are_stable` —— scrub 产生的标记不被后续截断腰斩

## 验收标准

- [ ] `cargo test -p memory-core-mini` 全绿（5 组测试全过）
- [ ] `cargo clippy -- -D warnings` 无警告
- [ ] `Sanitized` 字段私有（把 `Sanitized.0` 写在 lib.rs 外编译不过，试一下）
- [ ] 能口头回答：为什么 scrub 必须在 truncate 之前？`Sanitized` 阻止了哪种真实事故？
