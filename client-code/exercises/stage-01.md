# 实现练习：复盘锚点折叠算法 Stage 01

> 源参考：controller/gameController.ts `prepareFupanData` / `_mergeFupanStartData`（提交 db544fd）
> 代码位置：exercises/stage-01/（骨架与验收测试就绪，src/fupan.ts 待你实现）

## 学习目标

把 fupan-replay 笔记第 5 节的折叠算法（锚点吸收瞬时协议 + 软删除）写成可测试的纯函数——这是本仓库最可迁移的思想：任何「事件流压缩成用户可感知步骤」的场景都适用（回放、操作日志、审计流水）。

## 需要先理解的概念

- 锚点步骤（anchor）：一串协议里代表"用户感知的一步"的主协议（如开局 GP_START_GAME）
- 瞬时协议（absorbable）：附着在锚点上的配置/信息协议（进桌/玩家信息），不构成独立步骤
- 软删除：源码用平行 dels: boolean[] 标记再 filter 收掉——本练习改为返回新数组，语义等价
- 截断协议（stopAt）：吸收过程的边界（源码遇到 GP_TAKE 即止——之后是流程开始，不再是开局静态信息）

## 要创建的文件

只实现 `src/fupan.ts`（类型与桩已给出）。tests/ 不许改。

## 预计规模与难度

约 40-60 行，难度：低。难点在边界：锚点缺失、锚点前的瞬时协议不动、截断后不再吸收。

## 关键函数（签名已定，见 src/fupan.ts）

```typescript
mergeIntoAnchor(
  steps: RawStep[],        // 原始序列（允许原地修改 sign/adds，返回值才是权威结果）
  anchorXyid: number,      // 锚点协议 ID
  absorbXyids: number[],   // 要吸收的瞬时协议 ID 集合
  stopAtXyid?: number,     // 截断协议：吸收遇到它即停止（它本身保留，不被吸收）
): Step[]
```

## 实现任务（伪代码，分支细节自己填）

```text
1. findIndex 找锚点；找不到 -> 原样返回（浅拷贝即可，不加不减）
2. 从锚点下一个开始扫描：
   - 遇到 stopAtXyid -> 停止吸收（跳出扫描，后续步骤原样保留）
   - 遇到 absorbXyids 中的 -> 并入锚点 adds（保持原序列顺序）、sign 改写为锚点 xyid、软删除
   - 其余 -> 原样保留
3. 锚点自身保留在序列中，sign 不变
4. 返回过滤掉软删除后的新数组
```

## 测试用例

tests/fupan.test.ts 已写好 8 个用例：

1. 正常吸收：锚点后的瞬时协议并入 adds、sign 改写、结果不含被吸收项
2. 吸收顺序保持（两个瞬时协议按原序列顺序进 adds）
3. 锚点缺失 -> 原样返回
4. stopAt 截断：截断协议之后的瞬时协议保留不吸收；截断协议本身保留
5. 锚点之前的瞬时协议不被吸收（源码从锚点下一个开始扫描）
6. 空 absorbs -> 不动数据
7. 锚点自身 sign 不变、仍保留
8. 被吸收项不产生重复（adds 数量正确）

## 验收标准

- [ ] `npm install && npx vitest run` 全绿（8/8）；若 npm 拉包超时，加镜像：`npm install --registry=https://registry.npmmirror.com --no-audit --no-fund`（勿用 pnpm：vitest 2.x 在 pnpm 下会缺 rolldown native binding）
- [ ] 不修改 tests/ 与 src/fupan.ts 以外文件
- [ ] mergeIntoAnchor 无副作用泄漏：返回值权威，输入数组被修改也不影响判定（测试只看返回值）
