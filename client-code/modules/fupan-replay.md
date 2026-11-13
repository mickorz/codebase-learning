# 模块学习：复盘链（Fupan Replay）

> 源路径：E:\WorkProjects\PrdGameSkill\source-code\client\Code | 提交：db544fd | 分析日期：2026-11-10
> 范围：gameController.ts 复盘区（dealBatchFupanData / prepareFupanData / _merge* 系列，L612-850）+ RecoverGameSceneCmd + helperCmd/Recover*Cmd

## 1 问题：这个模块解决什么问题

把服务端下发的复盘流水（一局牌的完整协议序列）变成可拖进度条逐步回放的对局：瞬时协议要折叠、关键操作要成步、动画要按节奏播——**用同一套命令系统重演一局已经结束的牌**。

## 2 职责：它负责什么，不负责什么

- 负责：批量复盘数据执行（dealBatchFupanData）、步骤预处理与合并（prepareFupanData + _merge*）、场景恢复命令（RecoverGameSceneCmd/CMD_FUPAN_RECOVER_GAME_SCENE）、复盘模式下的上行隔离（isFupanMode 拦截）
- 不负责：复盘进度条 UI（common_game 的 FupanNewController）、流水数据获取

## 3 位置：整体架构中的角色

复盘是下行链的「离线重放」形态：同样的 svrPushToClient 命令路由，只是 `justUpdateData=true`（更新数据不出动画），播放节奏由进度条驱动。

## 4 接口：对外公开的 API

- `dealBatchFupanData(msgs: {xyid, data}[], headSign)`——批量执行：resetUI → 逐条 justUpdateData 路由 → 场景恢复命令
- `dealMultipleFupanData(step: IFupanStep)`——单步执行（进度条拖动时）
- `prepareFupanData(data: IFupanStep[]): IFupanStep[]`——预处理合并，返回过滤后的步骤序列

## 5 数据：核心数据结构

- `IFupanStep`：复盘步骤 = 一条主协议 + `adds?: 附加协议[]` + `xy_sign`（归属标记）+ `del`（软删除标记，由平行 dels: boolean[] 数组承载）
- **合并算法的本质**：把「瞬时协议」（开局配置/玩家信息/结束数据）折叠进「锚点步骤」（GP_START_GAME 开局 / GP_POWER 权限 / 结算），改写 xy_sign 标记归属，dels[index]=true 软删除，最后 `filter((item, i) => !dels[i])` 一次性收掉

## 6 执行：内部执行流程

三段合并（VERIFIED，prepareFupanData L673-690）：

```text
_mergeFupanStartData  开局后的初始化协议并入开局步（遇到 GP_TAKE 即止）
_mergeFupanPowerData  权限相关协议并入对应权限步（含 _mergeOneFupanPower 单步归并）
_mergeFupanEndData    结束数据并入结算步
-> data.filter(!dels) 软删除生效
```

两个保护性细节（VERIFIED）：

1. **跨游戏复用的坑有注释守着**（L690）："Hzmj 无冲责/鸡信息，勿调用已掏空条件的 merge：否则每条协议都会并到前一条 PLAY/PUNG/KONG，抓打会糊成一步"——从其他麻将（冲责/鸡是地方玩法术语）复制合并逻辑时留下的警告
2. **萧山麻将加庄特判**（L703-709）：GP_HZMJ_BANKER_LEVEL_UP 协议存在时，掷骰子阶段保持独立成步逐条播放（_isXsmjDiceKeepAlone 白名单），不并入开局静态步——协议 ID 与函数名都保留了来源游戏（Xsmj）的命名

## 7 源码：关键文件与函数

| 段落 | 位置 | 内容 |
| --- | --- | --- |
| dealBatchFupanData | L640-659 | 批量执行 + 场景恢复收尾 |
| prepareFupanData | L664-690 | 三段合并入口 + 跨游戏警告注释 |
| _mergeFupanStartData | L696-711 | 开局折叠：findIndex 锚点 + 顺序并入 + GP_TAKE 截断 |
| _isXsmjDiceKeepAlone | L713 | 萧山加庄白名单 |
| RecoverGameSceneCmd | cmd/RecoverGameSceneCmd.ts（154 行） | 按快照恢复场景 |

## 8 设计：作者为什么这样设计

- **复用下行链而非另建回放解释器**：dealBatchFupanData 直接调 svrPushToClient(0, xyid, data, true)——同一解析/路由/命令路径，回放天然与对局行为一致（所见即所演），justUpdateData 一个参数区分"只更新数据不出动画"
- **合并而非重编码**：折叠瞬时协议让进度条步数对齐玩家感知（开局是一"步"，不是 8 条协议），动画节奏才能对齐真人打牌的记忆
- **注释密度显著高于其他区**：合并规则全部带"为什么"（跨游戏坑、协议归属、动画顺序）——这块逻辑的复杂度作者自己知道

## 9 替代方案：其他可能的设计与取舍

- **服务端出回放专用流**（预合并好的步骤）：客户端简单，但服务端要多一套导出逻辑且两端格式耦合；现设计让客户端自治
- **直接顺序播放不合并**：实现最简，但进度条 200+ 步没法用，开局 8 条协议播 8 次动画
- 代价：合并规则与玩法强耦合，每加一个杭麻专属协议都要判断"该并入哪一步还是独立成步"——_isXsmjDiceKeepAlone 这类白名单就是这条税的收据

## 10 练习：建议你实现什么

实现 `prepareFupanData` 微缩版：`mergeIntoAnchor(steps: Step[], anchorXyid: number, absorbXyids: number[]): Step[]`——锚点吸收瞬时协议（改写 sign + 软删除），vitest 验证：吸收后顺序保持、锚点缺失时原样返回、空 absorbs 不动数据。这是复盘链最核心的可迁移思想。
