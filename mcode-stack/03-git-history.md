# Git 历史分析：mcode-stack

> 仓库：https://github.com/MiniMax-AI/mcode-stack | 提交：88f84be | 分析日期：2026-11-10
> 共 14 个 commit（含 1 个 merge），时间跨度短，是发布初期的新仓库。

## 演化脉络

| 阶段 | Commit | 内容 | 说明 |
| --- | --- | --- | --- |
| 起点 | c889a19 Initial MCode Stack | 一次性带入 ronny stack（19 skills 雏形）+ template + notes 5 篇 + CI + 贡献模板 | 骨架完整后才公开——不是从 README 长出来的项目，而是把内部已有实践一次性发布 |
| 扩展 | e7307b0 (#2) | jiachen stack 入驻 | 第二个成员的 stack，验证「一人一 stack」模式可复制 |
| 规范 | 253205e (#3) | 声明 engineering skills 的 CC-BY 3.0 条款 | 内容许可与代码 MIT 双轨 |
| 分发 | d3d902e (#7) | 每个 stack 一条命令装进 Claude 和 Codex | marketplace 化的关键一步：install.sh + .claude-plugin/.codex-plugin 成体系 |
| 扩展 | 5fb1427 (#10) | ronny 新增 4 个「owning agent work」skills（agent-brief / evidence-first-review / review-capacity-check / taste-to-checks），0.3.0→0.3.1 | 内容仍在生长；commit 同时改了全部四套 manifest——正是 manifest 同步负担的实证 |
| 扩展 | 633cee9 (#11) + 88f84be (#12) | req-tpm stack v0 入驻，默认英文 README | 第三种 stack 形态（流程型而非检查型） |

## 从历史得出的判断

1. **「文章→skill」是本仓库的原始驱动力**（INFERRED，来自 initial commit 同时包含 notes 与 skills 的结构）：先有内部 Engineering Notes 文章，发布时把文章做成可运行件，配对关系从第一天就存在。
2. **notes 编号有过的反复**（VERIFIED）：initial commit 里是 `notes/06-context-tax.md`，49a3ff4 重命名为 05（「renumber Engineering Notes companion 06 → 05」）——编号是人为维护的文章↔skill 配对锚点，会漂移。
3. **每次内容变更都触碰多套 manifest**（VERIFIED，5fb1427 的 diff：一个 skill 新增改动 8 个非内容文件）：这解释了为什么 check.mjs 要把 manifest 一致性和版本 bump 做成 CI 强制——先有人工痛苦，后有机械约束。
4. 版本策略是逐 stack 独立版本号（ronny 0.3.1，jiachen/req-tpm 各自独立），不是仓库统一版本（VERIFIED，各 plugin.json）。

## 未验证

- 各 PR 的 review 讨论（issues/PR 页面未拉取，无法确认设计争论），以上判断仅基于 commit 与 diff。
