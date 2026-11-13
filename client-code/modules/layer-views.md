# 模块学习：layer 视图层（BoxHzmjMainView 为核心）

> 源路径：E:\WorkProjects\PrdGameSkill\source-code\client\Code | 提交：db544fd | 分析日期：2026-11-10
> 范围：layer/（12 个 View，9235 行；主视图 BoxHzmjMainView.ts 1898 行）+ config/FguiViewDefine.ts 事件定义

## 1 问题：这个模块解决什么问题

把 FairyGUI 工程（fgui/）的界面资源实例化成可控视图，响应 gameController 派发的事件更新牌桌，把玩家的操作（吃碰杠胡过）转交给 controller 上行——它是牌桌的一切可见之物。

## 2 职责：它负责什么，不负责什么

- 负责：界面装配与节点操作、操作按钮组的状态切换与动画、事件响应（53 个监听）、玩家操作入口（直调 GameController.sendXxx）、动画时序编排
- 不负责：玩法规则判定（controller/协议层）、数据持有（GameData）、协议收发

## 3 位置：整体架构中的角色

事件总线的消费端。链路：CommandMgr 命令 → 更新 GameData → dispatch 事件 → **本层 @gf.listen 响应** → 操作时直调 GameController → 上行。

## 4 接口：对外公开的 API

- 视图注册：`@FguiView({ layer, bundle, packages, sortingOrder, safeArea })` 装饰器（L120-130）——kiwi 框架按元数据加载 FairyGUI 包并挂层
- 类声明：`extends gf.mvc.UIController<FGUI_box_hzmj_main_BoxHzmjMainView_Declare>`——FairyGUI 工程导出的 Declare 类型让 `this.view.KW_Main.KW_Handler.C_BtnState` 全程类型安全（VERIFIED L131, 194, 229）
- 事件订阅：`@gf.listen(事件名)` 方法装饰器，MainView 内 53 处（VERIFIED）

## 5 数据：核心数据结构

事件字典 `GameEventBoxHzmj`（config/FguiViewDefine.ts L91 起，VERIFIED）：约 40 个字符串常量事件（onShowActionSign / onResetUI / onPlayerEnter / onStartGame / showBoxResultView ...），是 controller 与 view 的全部契约面。

视图内状态（MainView L137-184）：

- `IPowerShowState`：吃/碰/杠/胡/出牌/过/过2 七个布尔——当前玩家操作权限的按钮组投影
- `HzmjMoreCombLayout` + `hzmjMoreComb`：多吃选项池的**纯数据布局配置**（间距/基准坐标/牌缩放/槽数），为 KW_GangGrps 节点做手工坐标计算
- 杠/吃的多选状态（_chooseGang/_chooseChi/_chooseComb + 回调引用）
- 玩法渗漏的状态：`_isGangOffMoCard`（本次杠是否与刚摸的牌无关，L143-145——影响出牌要不要先点"过"，**这是规则判定不是 UI 状态**）、`_lastPlayIsDanFang`（本次出牌是否单放）

## 6 执行：内部执行流程

**操作链**（VERIFIED，L1102-1213）：

```text
玩家点按钮 -> onBtnStateChanged / 按钮 handler
  -> GameController.instance.sendChow(comb) / sendHu() / sendCancel() ...
  -> 上行（controller 负责）
```

**响应链**：

```text
命令类 dispatch 事件 -> @gf.listen 方法（如 resetUI/onShowActionSign/onUpdateJoker）
  -> 操作 this.view.KW_xxx 节点（FGUI API + Declare 类型）
  -> 动画时序：DelayCall / PlaySpineAniLoop（Spine 骨骼按钮动画）/ scheduleOnce 延时编排
```

**按钮组切换**：`C_BtnState`（FairyGUI controller 组件）selectedIndex 驱动按钮组显隐（L194 置 EMPTY，L229 onChanged 监听）——FairyGUI 的控制器机制，非代码状态机。

## 7 源码：关键文件与形态

| 文件 | 行数 | 形态 |
| --- | --- | --- |
| BoxHzmjMainView.ts | 1898 | 主牌桌：操作按钮组/多吃选项池/大牌出牌/财神变色/记牌器长按 |
| BoxHzmjTipAniView.ts | 1816 | 提示动画层 |
| BoxHzmjTestView.ts | 1579 | 测试视图（发布物里带了测试界面） |
| BoxHzmjMah2DView.ts | 1301 | 2D 牌桌渲染，暴露 selfHand 供 MainView 跨视图取用 |
| BoxHzmjPlayerView.ts | 926 | 单玩家座位视图 |
| 其余 7 个 | 105-512 | 手牌/出牌区/结算/听牌/特殊牌/回看背景 |

跨视图协作点（L195-206，VERIFIED）：initUI 里 `getBean(gf.IViewPlugin)?.getViewController(BoxHzmjMah2DView)` 直接取兄弟视图实例拿 `selfHand`、调 `bindMahSideComps()`——视图间强引用。

## 8 设计：作者为什么这样设计

- **装饰器三件套**（@gf.module / @FguiView / @gf.listen）是 kiwi 框架的统一风格：注册类、注册视图、订阅事件全部声明式，框架运行时反射装配——与 commandMgr 的 @RegisterCmd 同一哲学
- **事件字典集中一个文件**：controller 与 view 的契约只在 FguiViewDefine.ts 一处可查，改名有单一入口
- **Declare 强类型**：FairyGUI 工程导出节点树类型，UI 代码获得编译期检查——这是 Cocos+FGUI 项目少见的纪律

## 9 替代方案：其他可能的设计与取舍

- **拆分主视图**：1898 行/50 方法的 MainView 可按区域拆（操作按钮组/牌池/结算入口），现设计找具体逻辑靠搜索；代价是跨子视图通信成本
- **操作状态外移**：_isGangOffMoCard / _lastPlayIsDanFang 这类规则性状态应属 controller 或 GameData，视图只投影——现渗漏导致规则改动要动两处
- **动画时序声明化**：scheduleOnce/DelayCall 散布（L1652/1669/1753），时序冲突（连点/重连打断）靠手工防护；序列化动画库可消掉这类 bug，但引入学习成本
- 代价：现设计直白、与框架亲和；代价是主视图持续膨胀、视图间耦合（Mah2DView 直接引用）

## 10 练习：建议你实现什么

见 exercises/stage-02.md（下一步生成）：实现一个微型事件总线 + @listen 装饰器（TypeScript 装饰器元数据版），复刻 controller.dispatch ↔ view @gf.listen 的对称契约；vitest 验证：多参数透传、同事件多订阅、订阅者异常不阻断其他订阅者、视图销毁后自动退订。
