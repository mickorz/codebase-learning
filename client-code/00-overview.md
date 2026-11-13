# 项目概览：client-code（杭州麻将客户端玩法模块）

> 源路径：E:\WorkProjects\PrdGameSkill\source-code\client\Code | 分支：main | 提交：db544fd68a3b8ac686a6a0d683ae65b49226e10f | 分析日期：2026-11-10
> 首个按 codebase-learning v0.2.0 本地路径流程学习的项目（原地分析，源码未复制）。

## 项目定位

杭州麻将（Game_HZMahJong，游戏 ID 42319）的 **CocosCreator 客户端玩法模块**：从 remote URL 可见它属于 `commonlobbyframe`（公共棋牌大厅框架）下的一个游戏子仓库。它不是独立应用，而是**按游戏 ID 注册进平台大厅的玩法包**——大厅框架（`gamePlatformModule`/`kiwi`）负责大厅、房间、支付等公共能力，本仓库只实现杭麻自己的规则、界面与音效。

## 主要功能

- 杭麻牌桌完整玩法：组牌/出牌/胡牌/动画（提交记录可见"胡牌动画""豪飘杠""十风牌"等业务迭代）
- 界面层：BoxHzmj 系列 View（主界面/2D 牌桌/手牌/结算/回看等，layer/ 下 10+ 个）
- 网络协议对接：protocol/GameGlcProtocol + lib/proto_game_hzmj（协议定义）
- 复盘与动态（复用 `../common_game/` 的 FupanNewController / DynamicController）

## 技术栈

- CocosCreator + TypeScript（183 个 .ts，约 3.0 万行；无 package.json——脚本目录形态，依赖由宿主工程提供）
- **kiwi 框架**：`@gf.module({ name: "Game42319" })` 装饰器注册模块、`gf.ModuleBase` 基类、assetManager/pfbm/FguiEmit（证据：Game42319.ts L1-8）
- **FairyGUI**：fgui/ + fgui_uideclare/ 界面工程与视图定义
- 外部依赖（不在本仓库，分析边界受限）：`kiwi`、`gamePlatformModule`（平台大厅模块）、`../common_game/`（游戏公共代码）

## 目录结构

```text
Game42319.ts           模块入口：HzmjView，@gf.module 注册，start() 装配控制器与界面
config/                配置：FguiViewDefine 界面定义等
controller/            逻辑控制：gameController / gameSoundController / cmd/
data/                  游戏数据：GameData
layer/                 视图层：BoxHzmj*View 系列（FairyGUI 绑定）
interface/             接口定义
protocol/              网络协议：GameGlcProtocol
lib/                   协议生成物：proto_game_hzmj.d.ts / .js
util/ res/             工具与资源
fgui/ fgui_uideclare/  FairyGUI 工程与声明
graphify-out/          Graphify 生成物
```

## 入口点

| 入口 | 位置 | 证据 |
| --- | --- | --- |
| 模块启动 | Game42319.ts `HzmjView.start()`：init 控制器 → 注册进 `GameInstController.inst.GameController` → GameData.init → initUI 加载视图列表 | VERIFIED（L10-30） |
| 平台注册 | `@gf.module({ name: "Game42319" })` 装饰器，由 kiwi 运行时发现 | VERIFIED（L8-9） |

## 核心模块（初判）

| 模块 | 初步职责 | 证据等级 |
| --- | --- | --- |
| Game42319.ts + controller | 模块装配与游戏流程控制 | VERIFIED |
| layer/ 视图系 | FairyGUI 界面绑定与牌桌渲染 | VERIFIED（文件名与 View Define 对应） |
| protocol/ + lib/ | 与服务器的杭麻协议（GLC 格式） | VERIFIED（存在） |
| data/GameData | 玩法数据持有 | VERIFIED（存在） |
| 平台契约（GameInstController 注册） | 模块↔大厅框架的接缝 | INFERRED（用法可见，定义在外部仓库） |

## 本仓库分析边界（重要）

`kiwi`、`gamePlatformModule`、`../common_game/` 三个关键依赖**不在本仓库**：模块基类、大厅控制器、公共牌桌代码都看不到源码。学习本仓库能掌握「一个玩法模块如何组织与接入」，但「平台框架如何调度模块」需要上层仓库（commonlobbyframe）——若需要，可作为后续学习对象。

## 学习建议

1. Module 精读顺序：`Game42319.ts 装配流程` → `controller/gameController`（玩法主控）→ `layer/BoxHzmjMainView`（牌桌视图）→ `protocol/GameGlcProtocol`（协议收发）
2. 主线问题：「胡牌/杠这类规则逻辑写在 controller 还是 cmd？」——cmd/ 目录值得优先看
3. 与 mcode-stack 学习的对照价值：这是一个「宿主-插件」架构的游戏版（大厅框架=宿主，玩法模块=插件），可对比 agent 的 skills 宿主模式
