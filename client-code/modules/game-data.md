# 模块学习：GameData 数据层

> 源路径：E:\WorkProjects\PrdGameSkill\source-code\client\Code | 提交：db544fd | 分析日期：2026-11-10
> 范围：data/GameData.ts（2033 行）+ data/PlayerCardsData.ts（516 行）

## 1 问题：这个模块解决什么问题

为整个玩法模块持有权威的局内状态：手牌、牌墙、听牌、askid 序号、牌堆计数——命令类更新它，视图层读它，重连恢复靠它，避免任何一方自己猜牌桌状态。

## 2 职责：它负责什么，不负责什么

- 负责：局内数据（手牌/牌墙/听牌/胡牌/托管/桌状态）、操作序号（askid）、牌堆计数（记牌器）、数据恢复（recoverCardCounter）
- 不负责：房间级数据（BoxRoomData/TableData 属平台）、规则计算（calcCanTingInfo 等算法在本类但来源数据是服务端的）、持久化

## 3 位置：整体架构中的角色

命令类的写入目标、视图层的读取源、controller 重连兜底的缓存（gameSceneBack 保存/恢复听牌箭头）。三方都经过它，是事实上的单例状态容器。

## 4 接口：对外公开的 API

getter/setter 风格的静态方法族（setEndWaitAskid/getEndWaitAskid、setCanTingVaule/addCanTingValue/clearCanTingValue、recoverCardCounter、calcCanTingInfo...约百个方法）。

## 5 数据：核心数据结构

| 字段 | 类型 | 语义 | 证据 |
| --- | --- | --- | --- |
| _handCards | PlayerCardsData[] | 各座位手牌 | L15 |
| _canTingVaule | Record<牌值, TingMahInfos> | 「打哪张听什么」箭头数据（重连兜底的主角） | L19 |
| _cardCounter | Record<牌值, number> | 牌堆计数（记牌器数据源） | L153 |
| walls | number[] | 整面牌墙；**注释警告"0 号是自家方向左边第一张，协议解析注意座位号转换"** | L33-34 |
| _curWallASc/_curWallDesc | number | 正向/反向待抓索引——客户端维护的抓牌游标 | L36-37 |
| maxWallNum | 144 | 麻将总张数（牌墙形状初始化） | L35 |
| _endWaitAskid/_powerAskid | number | 两类操作的服务端序号 | L54-56 |

## 6 执行：内部执行流程

无自主流程，纯被动容器。三个关键交互：
1. 命令类收到协议 → 写 GameData（setCanTingVaule / walls 更新 / setEndWaitAskid）
2. 视图/controller 读 → calcCanTingInfo 之类的派生计算按需触发
3. 重连 → gameSceneBack 先存 canTingVaule → onResetUI 清空 → 服务端未补发则恢复（与 gameController 笔记第 6 节呼应）

## 7 源码：关键文件与函数

| 段落 | 位置 | 内容 |
| --- | --- | --- |
| 状态字段块 | L14-56 | 手牌/听牌/胡牌/托管/牌墙/游标/askid |
| 听牌三件套 | L301-321 | set/add/clearCanTingValue（add 用展开合并） |
| 牌堆恢复 | recoverCardCounter | 从 CommonGameData 恢复计数（gameSceneBack 调用） |

PlayerCardsData（516 行）：单座位手牌的明细（牌列表/组合/状态），GameData._handCards 的元素类型。

## 8 设计：作者为什么这样设计

- **静态单例容器**：CocosCreator 老式项目常态——模块生命周期由平台管理，静态类随场景走；clear() 全量重置（L182/_cardCounter=[] 等）保证换桌不串数据
- **牌墙游标客户端自维护**：服务端只发事件，客户端按 144 张的确定性结构自己推牌墙形状与抓取位置——省带宽，代价是必须绝对不错位（所以注释强调座位转换）
- **听牌数据带重连语义**：canTingVaule 被设计成可保存/恢复/增量合并（add 展开合并），是为断线重连专门留的口子

## 9 替代方案：其他可能的设计与取舍

- **不可变快照 + 事件流**：命令类产出快照，视图订阅快照流——可回放可时间旅行，但重构成本覆盖全部 30 个命令类；现设计是渐进可用性优先
- **牌墙全量服务端下发**：简单不错位，带宽换正确性；现设计的选择符合棋牌客户端惯例
- 代价：2033 行的 God Class 已现端倪（手牌/牌墙/听牌/askid/计数/托管/推荐玩法混在一类），再加功能建议按域拆（WallData/TingData/AskidBox）

## 10 练习：建议你实现什么

实现牌墙游标微缩版：`WallCursor` 类（maxWallNum/正向索引/反向索引/draw()），vitest 验证：正反向交替抓取不重叠、抓完抛 finished、144 张全抓遍历恰好一次。
