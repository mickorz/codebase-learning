/**
 * stage-01 验收测试 —— 不许修改本文件，让它们变绿。
 *
 * 运行：npm test
 */
import { describe, expect, it } from 'vitest';
import {
  OBSERVATION_KINDS,
  Sanitized,
  truncateUtf8Safe,
  validFilePathKey,
  parseObservationKind,
  type NewObservation,
  type ObservationKind,
} from '../src/index.js';

/** 教学版 scrub：只认得"完整形态"的密钥 —— 模拟真实 sanitizer 的模式匹配。 */
const SECRET = 'AKIAIOSFODNN7EXAMPLE_SECRET_VALUE'; // AWS 文档公开示例键，无危险性
const scrub = (s: string) => s.replaceAll(SECRET, '[REDACTED]');

function obs(title: string, body: string): NewObservation {
  return { sessionId: 's-1', kind: 'user-prompt', title, body, filePath: null };
}

// ---------------------------------------------------------------
// 1. 往返：字面量清单完整且 parse 恒等（原版 observation_kind_round_trips）
// ---------------------------------------------------------------
describe('parseObservationKind', () => {
  it('清单完整且往返恒等', () => {
    expect(OBSERVATION_KINDS).toHaveLength(10);
    for (const k of OBSERVATION_KINDS as readonly ObservationKind[]) {
      const r = parseObservationKind(k);
      expect(r).toEqual({ ok: true, value: k });
    }
  });

  // -------------------------------------------------------------
  // 2. 三种命名风格互认 + 未知报 malformed-record
  // -------------------------------------------------------------
  it('接受 PostToolUse / post_tool_use / post-tool-use 三种风格', () => {
    for (const s of ['PostToolUse', 'post_tool_use', 'post-tool-use']) {
      const r = parseObservationKind(s);
      expect(r).toEqual({ ok: true, value: 'post-tool-use' });
    }
  });

  it('未知输入返回 malformed-record', () => {
    const r = parseObservationKind('totally-bogus');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('malformed-record');
  });
});

// ---------------------------------------------------------------
// 3. #980 对抗测试（本题灵魂）：截断点落在密钥中间时，
//    先截断后 scrub 的实现会泄漏密钥前缀 —— 正确实现必须全量抹除。
// ---------------------------------------------------------------
describe('Sanitized.of（#980 顺序约束）', () => {
  it('截断点切在密钥中间时密钥必须全量消失', () => {
    // "prompt: " = 8 码点，密钥 33 字符；max = 20 恰好把密钥切成
    // "AKIAIOSFODNN7EXAMPL"(18) + 剩余 —— 错误实现在这里留下原文片段。
    const body = `prompt: ${SECRET} and more trailing context`;
    const s = Sanitized.of(obs('t', body), scrub).inner;
    expect(s.body).toContain('[REDACTED]');
    expect(s.body).not.toContain('AKIA'); // 任何片段都不得残留
  });

  // -------------------------------------------------------------
  // 5. 不合规 file_path 在消毒后清空为 null（原版 admits_file_path 语义）
  // -------------------------------------------------------------
  it('不合规 file_path 被清空为 null 而非报错', () => {
    const s = Sanitized.of({ ...obs('t', 'body'), filePath: '/abs/path' }, scrub).inner;
    expect(s.filePath).toBeNull();
    expect(s.title).toBe('t');
  });
});

// ---------------------------------------------------------------
// 4. 路径白名单（原版 valid_file_path_key，表驱动）
// ---------------------------------------------------------------
describe('validFilePathKey', () => {
  const cases: Array<[string, boolean]> = [
    ['src/lib.rs', true],
    ['docs\\readme.md', true], // Windows 相对分隔符合法
    ['docs/中文/说明.md', true], // 非 ASCII 合法
    ['/etc/passwd', false], // 绝对路径
    ['C:\\tmp\\x.txt', false], // 盘符
    ['a/../secret.txt', false], // 上跳段
    ['', false], // 空
  ];
  it.each(cases)('%j => %j', (path, want) => {
    expect(validFilePathKey(path)).toBe(want);
  });
  it('超过 512 码点拒绝，512 恰好通过', () => {
    expect(validFilePathKey('a'.repeat(513))).toBe(false);
    expect(validFilePathKey('a'.repeat(512))).toBe(true);
  });
});

// ---------------------------------------------------------------
// 附：码点安全截断（slice 会切破 emoji 代理对）
// ---------------------------------------------------------------
describe('truncateUtf8Safe', () => {
  it('按码点截断，不切破 emoji 代理对', () => {
    const s = 'abc🦀def'; // 🦀 是 2 个 UTF-16 code unit，1 个码点
    expect(Array.from(truncateUtf8Safe(s, 4))).toEqual(['a', 'b', 'c', '🦀']);
  });
});
