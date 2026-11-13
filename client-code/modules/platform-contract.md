# 平台契约补全：BaseGameController 回调的触发链（宿主侧实锤）

> 宿主源路径：E:\WorkProjects\Lobby\xuanwulobby（commonlobbyframe/client/cocoscreatorlobby，提交 d5a2b7da） | 分析日期：2026-11-13
> 本笔记把 learning-report.md 遗留盲点「宿主何时回调 playerReadyBack」从 UNKNOWN 升级为 VERIFIED。
> 之前判断正确：**不是反射**，是「协议监听 → 事件总线 → 平台消化 → 可选回调转发」的普通函数调用链。

## 完整触发链（playerReadyBack，六跳全部 VERIFIED）

```text
Socket 收包
  -> JoinBoxRoomComp._connect.on(Processid.boxLogicProcess,
       ReadyResponse.MSGID.ID, this, this._respPlayerReady)     [assets/node_modules/roomModule/src/component/JoinBoxRoomComp.ts:106]
  -> 房间事件总线派发
  -> RoomManager.onNew(事件名, handler) 注册的回调被调用          [roomModule/src/RoomManager.ts]
     注册点：tableController.ts:124/187
       RoomManager.getInstance().onNew(
         this._className + RoomEventName.EVENT_PLAYER_READY,
         this.respPlayerReady.bind(this))                        [common_game/controller/tableController.ts:124]
  -> tableController.respPlayerReady(data)                       [tableController.ts:916]
     平台先自己消化：更新本地玩家状态 / 失败提示（洗牌失败等）/ 派发 UI 事件
  -> 最后一行转发（tableController.ts:959）：
     GameInstController?.inst?.GameController?.playerReadyBack?.(data)
  -> 玩法模块 GameController.playerReadyBack                     [client-code gameController.ts:163]
```

同一模式覆盖全部平台回调：`EVENT_GAME_SCENE -> respSceneData -> gameSceneBack`、
`EVENT_PUSH_TO_CLIENT -> respPushToClient -> svrPushToClient`、
`EVENT_GAME_RESULT -> respGameResult -> gameResult`（tableController.ts:124-131 注册区）。

## 三个关键机制实锤

1. **BaseGameController 是「全可选接口」**（assets/biz_modules/gameBaseModule/src/config/CommonGameTypeDefine.ts:133）：
   `playerReadyBack?(data): void` ——每个方法都带 `?`。所以调用侧是四重可选链
   `GameInstController?.inst?.GameController?.playerReadyBack?.(data)`：
   玩法模块没挂、没实现某回调，宿主都静默跳过。**契约是「实现你关心的部分」**，
   与 kiwi 装饰器三件套的声明式哲学一致。
2. **两级分发**：平台 tableController 先消化协议（更新自己的数据/发 UI 事件），
   再把**原始协议对象**转发给玩法模块——玩法模块拿到的 data 与平台看到的一致，
   平台不裁剪不加工（playerReadyBack 参数就是 PlayerReadyResponse 原对象）。
3. **RoomManager 是字符串事件名的回调注册表**：`onNew(类名+事件名, handler.bind(this))`
   ——与玩法模块的 gf.listen、与 mcode-stack 的命令分发，三者是同一设计哲学
   （字符串事件 + 注册表 + bind），只是分了三层。

## 宿主工程结构确认（回答「大厅逻辑在不在本仓库」）

- import-map.json（VERIFIED）：`"gamePlatformModule": "./assets/biz_modules/gamePlatformModule/index.ts"`、
  `gameBaseModule`、`lobbyModule`、`mahModule` 等别名全部指向宿主工程内目录。
- assets/ 按游戏 ID 分目录（42038/42055/.../42309...），**每个 ID 一个玩法模块目录**——
  Code 那样的子仓库在宿主工程里就是 assets/<gameid>/ 的集成形态。
- client-code 断链的 `../../common_game/` 在宿主工程 = `assets/common_game/`
  （tableController/tableController 等，找到了实体）。

## 对 client-code 学习的修正

- learning-report.md 盲点 1（平台契约在外部仓库）→ 已部分闭环：调用时机与契约形态已 VERIFIED。
- `_isXsmjDiceKeepAlone` 类跨游戏复用现象在宿主侧同样存在（assets 下十余个游戏目录共用
  common_game），进一步佐证「平台消化 + 玩法可选回调」是整个 commonlobbyframe 的统一架构。
```
