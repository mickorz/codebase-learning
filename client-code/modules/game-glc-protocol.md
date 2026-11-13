# 模块学习：GameGlcProtocol 协议层

> 源路径：E:\WorkProjects\PrdGameSkill\source-code\client\Code | 提交：db544fd | 分析日期：2026-11-10
> 范围：protocol/GameGlcProtocol.ts（998 行）+ lib/proto_game_hzmj.js/.d.ts（protobuf 生成物）

## 1 问题：这个模块解决什么问题

把服务器的 protobuf 二进制流变成客户端可操作的类型化对象，并维护「协议 ID ↔ 消息类 ↔ 解码器」的三方映射——它是客户端与服务端（C++，注释指明 `game_hzmj/common_game_define.h`）之间的翻译官。

## 2 职责：它负责什么，不负责什么

- 负责：GAME_STATUS/GameStateEx 状态枚举、XYID 常量表、40+ 个 Msg 包装类、GAME_MSG_DECODERS 解码器表、HzmjDataParser 静态入口
- 不负责：路由到命令（gameController 的表）、业务语义（命令层）、编解码底层（BaseProtocol 在外部 protocolLogicModel 包）

## 3 位置：整体架构中的角色

被 gameController 的下行链第一步调用（parseGameMsg），上行链最后一步调用（Msg 构造 + pack）。lib/ 下的 proto_game_hzmj 是 protobuf 生成物，本文件是它的唯一 TS 门面。

## 4 接口：对外公开的 API

- `HzmjDataParser.parseGameMsg(xyid, data: Uint8Array): unknown | null`——唯一解析入口，未知 xyid 返回 null（controller 侧报错不静默，VERIFIED L96-99）
- `GLCProtocol.XYID` / `GLCProtocol.MsgXxx` / `GAME_STATUS` / `GameStateEx`

## 5 数据：核心数据结构

- **状态枚举两段式**（VERIFIED L11-87）：`GAME_STATUS` 基础段（1-25：开始/定庄/骰子/做手牌/财神/发牌/补花/操作/三种摸牌/听吃碰杠胡出牌/结算/结束，注释警告"不能使用 0，0 已被服务占用"）；`GameStateEx` 扩展段又分两截——客户端本地段（26-32，**字段名是 kGzmj 开头**：从其他麻将游戏复制而来但被杭麻使用）与服务端扩展段（500-506，kHzmjStateBegin=500 段哨兵，与 C++ 头文件对齐：定财神 501/飘 502/首摸等待 503/加倍 504/跟庄 505/洗牌 506）
- **Msg 类样板模式**（VERIFIED L168-179）：每个协议一个类，`static xyid` 从 `game_hzmj.MsgXxx.MSGID.ID` 取（protobuf 生成物的单一事实来源，**手写数字为零**）、`static processid = Processid.game140`、构造函数 `super(data, MsgXxx, SelfClass)` 三件套
- **GAME_MSG_DECODERS**（L935+）：`Record<xyid, (data) => MsgXxx>` 解码器表，每协议一行 `[XYID.X]: d => new MsgX(game_hzmj.MsgX.decode(d))`

## 6 执行：内部执行流程

下行：`parseGameMsg` → 查解码器表 → `MsgXxx.decode(data)`（protobuf）→ 包装成带 xyid/processid 的 BaseProtocol 实例 → 返回 unknown。
上行：`new MsgPlayC(obj).pack()` → Uint8Array → send。
两头的编解码重活都在外部 BaseProtocol，本层只做"每协议一行"的注册样板。

## 7 源码：关键文件与函数

| 段落 | 位置 | 内容 |
| --- | --- | --- |
| 状态枚举双段 | L11-87 | 基础段/本地扩展段/服务端扩展段 |
| HzmjDataParser | L88-100 | 5 行静态入口，查表失败返回 null |
| XYID 常量 | L103-167 | 全部引用 proto 生成物常量 |
| Msg 类族 | L168-934 | 约 45 个类，纯样板 |
| GAME_MSG_DECODERS | L935-998 | 解码器表 |

## 8 设计：作者为什么这样设计

- **单一事实来源**：XYID 不手写，直接引 protobuf 生成物的 MSGID.ID——服务端改协议号客户端零改动
- **decoder 表与 controller 路由表分离**：协议层管「字节→对象」，controller 管「对象→命令」。两级表让「新增协议」的改动点固定为三处：proto 生成物重生成 → 加 Msg 类+decoder 行 → 加 controller 路由行
- **null 而非 throw**：未知 xyid 返回 null，把处理策略交给调用方（controller 选择报错日志）——协议层保持纯函数

## 9 替代方案：其他可能的设计与取舍

- **装饰器自动注册**（@protocol(XYID.GP_X) 扫描注册）替代手写 decoder 表：新协议只写一个类，但初始化顺序与 tree-shaking 风险增加；现设计的显式表虽样板但一目了然
- **状态枚举统一管理**：kGzmj 命名残留（本地扩展段）与 kHzmj 段并存，另一游戏复制来的代码没改名——历史上省事，长期是误读源
- 代价：45 个样板类是代码生成的理想场景，手维护每加一个协议要写 8 行一模一样的东西

## 10 练习：建议你实现什么

实现一个泛型 `BaseProtocol<T>` 微缩版 + decoder 表自动构建（类注册时自登记），vitest 验证：decode-encode 往返一致、未知 xyid 返回 null、xyid 从类静态字段读取。
