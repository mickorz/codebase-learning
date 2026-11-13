# 模块学习：gameController 与 cmd 命令系

> 源路径：E:\WorkProjects\PrdGameSkill\source-code\client\Code | 提交：db544fd | 分析日期：2026-11-10
> 范围：controller/gameController.ts（1190 行）+ controller/cmd/（CmdDefine + 30 个 gameCmd + 6 个 helperCmd + sceneCmd）

## 1 问题：这个模块解决什么问题

把「服务器的二进制协议流」翻译成「客户端可执行的命令与事件」，把「玩家的操作」翻译成「协议上行包」——它是玩法模块的中枢神经系统：下行路由、上行封装、重连恢复、复盘回放全在这一层收口。

## 2 职责：它负责什么，不负责什么

- 负责：下行协议解析与命令分发（svrPushToClient）、断线重连场景恢复（gameSceneBack）、上行操作封装（sendHu/sendPlay/sendKong...）、复盘数据合并（dealBatchFupanData 系列）、平台生命周期回调（ready/enter/leave/结算）
- 不负责：UI 渲染（dispatch 事件给 layer/ 视图层）、协议编解码本体（HzmjDataParser/lib/proto）、房间管理（roomModule/tableController 属平台）、音效细节（gameSoundController 另立）

## 3 位置：整体架构中的角色

Game42319.ts 在 start() 里把 `GameController.instance` 挂到 `GameInstController.inst.GameController`——平台宿主持有它作为 `BaseGameController` 接口的实现，房间事件由此进入玩法模块。它是**平台宿主与玩法实现之间的唯一接缝**。

## 4 接口：对外公开的 API

- **宿主回调面**（implements BaseGameController）：`playerReadyBack / updatePlayerEnter / updatePlayerLeave / updatePlayerChangeSeat / updatePlayerVote / gameResult / gameTotalResult / gameSceneBack / svrPushToClient`——由 gamePlatformModule 在对应时机回调
- **View 调用面**：`sendPlay / sendHu / sendChow / sendPung / sendKong / sendCancel / sendEndWait / sendDouble / sendSpecfHand` 等上行方法
- 模块注册：`@gf.module({ name: "HzmjGameController" })`（kiwi 运行时发现）

## 5 数据：核心数据结构

三张声明在文件头的**表驱动路由表**（VERIFIED，L18-73）：

1. `Hzmj_SCENE_HANDLER_BY_STATE: Map<state, CmdName>`——断线重连时按游戏状态路由到对应场景恢复命令。注释逐条标注哪些状态服务端复用 `MsgRelinkOnAction` 下发
2. `Hzmj_SVR_PUSH_CMD_BY_XYID: Map<xyid, CmdName>`——下行协议主路由，21 个通用协议 + 12 个杭麻专属（GP_HZMJ_*）。注释明说动机：**"以 Map 代替大 switch，便于与协议定义同步维护"**

另有 `askid` 机制：每次操作上行都携带 `GameData.getPowerAskid()` / `getEndWaitAskid()` 取出的操作序号（sendPlay/sendHu/sendCancel 等 8 处 VERIFIED）——服务端权威的操作时序凭据，防过期/重复操作。

## 6 执行：内部执行流程

**下行链**（每跳 VERIFIED）：

```text
服务器推送 -> tableController（平台） -> GameController.svrPushToClient(xyid, playData)
  -> HzmjDataParser.parseGameMsg(xyid, playData)   [protocol/GameGlcProtocol]
  -> Hzmj_SVR_PUSH_CMD_BY_XYID.get(xyid) -> cmdName
  -> CommandMgr.inst.execute(cmdName, data [, "justUpdateData"])
  -> @RegisterCmd 注册的具体命令类 execute() -> 更新 GameData + dispatch 事件 -> layer/ 视图响应
```

**上行链**（以 sendKong 为例，L530-546）：

```text
View 调用 sendKong(comb) -> GameData.getPowerAskid() -> new GLCProtocol.MsgKongC(obj).pack()
  -> this.send(xyid, req) [L596-599] -> tableController.sendMsgToServer(boxid, xyid, req)
```

**重连链**：`gameSceneBack(state, sceneData)` → parse → 按 state 查场景表 → `onResetUI(false)` 重置 → 执行场景命令；特有兜底：断线前缓存"打哪张听"箭头数据，若服务端 WaitInfos 未补发则先恢复缓存、后到覆盖（L374-380 注释详述）。

**复盘链**：`dealBatchFupanData` 把回放步骤预合并（_mergeFupanPowerData/_mergeFupanEndData 等约 10 个私有方法，L640-850）——把连续的操作步骤折叠成可直接执行的命令序列。

## 7 源码：关键文件与形态

**命令类形态**（SceneStartCmd.ts 全文 31 行，VERIFIED）：

```typescript
@RegisterCmd(CmdNames.CMD_SCENE_START)
export class SceneStartCmd extends SimpleCommand {
    execute(notification: INotification): void {
        // 组合命令：把场景快照拆给四个子命令，标记 justUpdateData 只更新数据不出动画
        CommandMgr.inst.execute(CmdNames.CMD_START_GAME, data.start_game);
        CommandMgr.inst.execute(CmdNames.CMD_VS_PLAYER_INFO, data.vs_player_info, "justUpdateData");
        ...
    }
}
```

- `CommandMgr / RegisterCmd / SimpleCommand / INotification` 来自 `common_game/command/commandMgr`（**外部依赖**，PureMVC 风格宏命令模式）
- cmd/ 三个子目录：gameCmd/（30 个，按协议一一对应）/ helperCmd/（6 个 Recover*/Result 系）/ sceneCmd/（重连场景）
- 兼容痕迹：SceneStartCmd 注释"废弃场景（新协议不发送），保留处理以兼容旧快照"——协议演进靠保留旧命令兼容存档

## 8 设计：作者为什么这样设计

- **Map 表驱动 + 注释逐条标注**：麻将协议 XYID 数量大且杭麻专属多，switch 会膨胀难同步；Map 集中一处与协议定义对照维护
- **controller 不碰 UI**：一律 dispatch 事件（GameEventBoxHzmj.*），View 层自行响应——除了少数 pfbm.uiFgui 直调（超时提示/大结算弹窗），说明纪律并不绝对
- **复盘与对局共用命令**：复用同一命令集，复盘只是"justUpdateData"化 + 预合并步骤，避免维护两套流程（gameResult 注释 L262-265 明确说明两种模式的展示时机差异）

## 9 替代方案：其他可能的设计与取舍

- **状态机驱动**（xstate 式显式状态迁移）替代"命令即状态推进"：麻将流程状态多（碰/杠/胡的等待窗口），现设计把状态隐含在 askid + GAME_STATUS 里，加新玩法状态要同时改协议表+命令+视图事件三处
- **运营逻辑外置**：Mystic 好运来曝光、道具引导约 330 行（L855-1180，占 28%）写死在 gameController，且 `_isXsmjDiceKeepAlone`（L713）出现**另一款游戏（Xsmj）的名字**——跨游戏复制粘贴的痕迹，这部分最该抽成独立 controller
- 代价：现设计直观、上手快；代价是 gameController 已达 1190 行且随运营活动持续膨胀

## 10 练习：建议你实现什么

见 exercises/stage-01.md（下一步生成）：实现 `svrPushToClient` 的最小等价物——表驱动路由 + 假 parse + 命令注册器，用 vitest 验证"未知 xyid 必须报错不静默""重连场景按 state 路由""askid 过期操作被拒"。
