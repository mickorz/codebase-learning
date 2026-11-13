# 实现练习：重走杭麻玩法模块的完整行为链

五个 stage 对应五个已学模块，**按真实执行顺序串成闭环**：前一个 stage 的产物是后一个的依赖，做完五步，你就能把「一段服务器字节流」走完「解析 → 路由 → 状态 → 事件 → 上行 → 复盘」的全链路。

```text
stage-01 协议层    字节流 -> 类型化消息（对应 modules/game-glc-protocol.md）
stage-02 命令路由  消息 -> 命令分发（对应 modules/game-controller.md）
stage-03 状态事件  命令 -> 状态更新 -> 事件派发 -> 视图响应（对应 game-data.md + layer-views.md）
stage-04 上行操作  玩家操作 -> askid -> 字节流（对应 game-data.md + game-controller.md）
stage-05 复盘重放  批量流水 justUpdate 重放 + 锚点折叠（对应 modules/fupan-replay.md）
```

## 完成标准

- 按顺序做：stage-02 的测试依赖 stage-01 的实现，以此类推（跳序会红）
- `npx vitest run` 从根目录跑全部——**每完成一个 stage，多绿一组**，测试数就是你的进度条
- 全绿 36 个用例 = 全链路闭环

## 运行

```bash
cd E:\WorkProjects\codebase-learning\client-code\exercises
npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
npx vitest run
```

只跑某个 stage：`npx vitest run stage-03`。
