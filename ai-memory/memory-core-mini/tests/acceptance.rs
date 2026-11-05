//! stage-01 验收测试 —— 不许修改本文件，让它们变绿。
//!
//! 运行：cargo test -p memory-core-mini

use memory_core_mini::{
    valid_file_path_key, NewObservation, ObservationKind, Sanitized,
};

/// 教学版 scrub：只认得"完整形态"的密钥 —— 模拟真实 sanitizer 的模式匹配。
/// （AKIAIOSFODNN7EXAMPLE 是 AWS 文档公开示例键，无危险性）
const SECRET: &str = "AKIAIOSFODNN7EXAMPLE_SECRET_VALUE";
fn scrub(s: &str) -> String {
    s.replace(SECRET, "[REDACTED]")
}

fn obs(title: &str, body: &str) -> NewObservation {
    NewObservation {
        session_id: "s-1".into(),
        kind: ObservationKind::UserPrompt,
        title: title.into(),
        body: body.into(),
        file_path: None,
    }
}

// ---------------------------------------------------------------
// 1. 往返：as_str <-> from_str 互逆（原版 observation_kind_round_trips）
// ---------------------------------------------------------------
#[test]
fn kind_round_trips() {
    let all = [
        ObservationKind::SessionStart,
        ObservationKind::UserPrompt,
        ObservationKind::PreToolUse,
        ObservationKind::PostToolUse,
        ObservationKind::PreCompact,
        ObservationKind::PostCompaction,
        ObservationKind::Notification,
        ObservationKind::Stop,
        ObservationKind::SessionEnd,
        ObservationKind::Other,
    ];
    for k in all {
        assert_eq!(k.as_str().parse::<ObservationKind>().unwrap(), k);
    }
}

// ---------------------------------------------------------------
// 2. 三种命名风格互认 + 未知报 MalformedRecord
// ---------------------------------------------------------------
#[test]
fn kind_accepts_three_styles() {
    for s in ["PostToolUse", "post_tool_use", "post-tool-use"] {
        assert_eq!(
            s.parse::<ObservationKind>().unwrap(),
            ObservationKind::PostToolUse,
            "输入 {s} 应解析为 PostToolUse"
        );
    }
    assert!(matches!(
        "totally-bogus".parse::<ObservationKind>(),
        Err(memory_core_mini::MemoryError::MalformedRecord(_))
    ));
}

// ---------------------------------------------------------------
// 3. #980 对抗测试（本题灵魂）：截断点落在密钥中间时，
//    先截断后 scrub 的实现会泄漏密钥前缀 —— 正确实现必须全量抹除。
// ---------------------------------------------------------------
#[test]
fn secret_split_by_truncation_must_stay_redacted() {
    // "prompt: " = 8 字符，密钥 33 字符；max = 20 恰好把密钥切成
    // "AKIAIOSFODNN7EXAMPL"(18) + 剩余 —— 错误实现在这里留下原文片段。
    let body = format!("prompt: {SECRET} and more trailing context");
    let s = Sanitized::new(obs("t", &body), &scrub).into_inner();
    assert!(
        s.body.contains("[REDACTED]"),
        "完整密钥必须被 scrub 替换；实现是不是先截断了？"
    );
    assert!(
        !s.body.contains("AKIA"),
        "密钥任何片段（含被截断的前缀）都不得残留，got: {:?}",
        s.body
    );
}

// ---------------------------------------------------------------
// 4. 路径白名单（原版 valid_file_path_key，表驱动）
// ---------------------------------------------------------------
#[test]
fn file_path_whitelist() {
    let cases = [
        ("src/lib.rs", true),
        ("docs\\readme.md", true),      // Windows 相对分隔符合法
        ("docs/中文/说明.md", true),     // 非 ASCII 合法
        ("/etc/passwd", false),          // 绝对路径
        ("C:\\tmp\\x.txt", false),       // 盘符
        ("a/../secret.txt", false),      // 上跳段
        ("", false),                     // 空
    ];
    for (path, want) in cases {
        assert_eq!(
            valid_file_path_key(path),
            want,
            "path = {path:?} 应为 {want}"
        );
    }
    let long = "a".repeat(513);
    assert!(!valid_file_path_key(&long), "超过 512 字符应拒绝");
    assert!(valid_file_path_key(&"a".repeat(512)));
}

// ---------------------------------------------------------------
// 5. 消毒后清空：不合规的 file_path 在 Sanitized::new 后变 None
// ---------------------------------------------------------------
#[test]
fn file_path_rejected_becomes_none() {
    let mut o = obs("t", "body");
    o.file_path = Some("/abs/path".into());
    let s = Sanitized::new(o, &scrub).into_inner();
    assert_eq!(s.file_path, None, "不合规路径应被清空而非报错");
    assert_eq!(s.title, "t");
}
