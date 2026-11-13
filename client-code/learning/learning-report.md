# 学习报告：client-code（杭州麻将客户端玩法模块）

> 日期：2026-11-10 | 完成阶段：Overview / Architecture(并入 Overview) / Module ×5
> 源路径：E:\WorkProjects\PrdGameSkill\source-code\client\Code | 提交：db544fd

## 已完成的精读

| 模块 | 笔记 | 核心收获 |
| --- | --- | --- |
| gameController + cmd | modules/game-controller.md | 表驱动协议路由、命令模式（@RegisterCmd）、askid 序号、重连场景恢复 + 听牌缓存兜底 |
| layer 视图层 | modules/layer-views.md | kiwi 装饰器三件套（@gf.module/@FguiView/@gf.listen）、FGUI Declare 强类型、FairyGUI controller 组件做按钮组 |
| GameGlcProtocol | modules/game-glc-protocol.md | 双段状态枚举（本地扩展段 26-32 / 服务端段 500+）、XYID 单一事实来源（引 proto 生成物）、decoder 表 |
| GameData | modules/game-data.md | 牌墙游标客户端自维护（144 张确定性结构）、canTingVaule 的重连语义、God Class 端倪 |
| 复盘链 | modules/fupan-replay.md | 锚点折叠算法（adds/xy_sign/dels 软删除）、justUpdateData 复用下行链、跨游戏复用的注释守则 |

## 全仓架构一句话

**宿主-插件的游戏版**：大厅框架（kiwi + gamePlatformModule，外部仓库）经装饰器注册发现玩法模块，模块用「controller（命令路由）+ GameData（状态容器）+ layer（事件响应视图）+ protocol（翻译层）」四件套实现玩法，复盘是对同一命令系统的离线重放。

## 迁移检查自评（未做正式 Quiz，按证据自评）

- [x] 能解释整体架构（四件套 + 平台契约，有源码定位）
- [x] 能指出入口点（@gf.module 注册 + HzmjView.start）
- [x] 能描述关键数据结构（协议表/路由表/牌墙游标/IFupanStep）
- [x] 能走通一条核心执行流（下行协议链逐跳 VERIFIED）
- [ ] **未验证**：独立重实现（Implement 练习未布置——每份笔记第 10 节已备好练习方案）
- [ ] **未验证**：正式 Assessment 测验

## 遗留盲点

1. 平台契约的实现细节（BaseGameController 接口定义、CommandMgr 的注册/调度、GameInstController 的生命周期）都在外部仓库 commonlobbyframe——本仓库学习的已知边界
2. `_isXsmjDiceKeepAlone` 等跨游戏复用代码的原始出处（萧山/贵州麻将仓库）未考证
3. 复盘数据的服务端格式（IFupanStep 从哪下发）未见，只覆盖了客户端消费侧

## 可立即执行的后续（按需启动，无需确认顺序）

1. Implement 练习：五份笔记第 10 节各有现成方案，推荐复盘锚点折叠（mergeIntoAnchor）——最可迁移
2. Assessment：按 quiz-flow 出 6-8 题正式测验
3. 上层仓库 commonlobbyframe 学习（补平台契约）
