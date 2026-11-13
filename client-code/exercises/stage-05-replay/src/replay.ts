// stage-05 复盘重放桩文件
// 源参考：controller/gameController.ts（dealBatchFupanData / prepareFupanData / _mergeFupanStartData）
// 依赖 stage-02：复盘复用对局下行链（svrPushToClient + justUpdateData）——这是本仓库的核心设计。
// 任务：实现全部 throw 桩，使 tests/replay.test.ts 全绿。

import { svrPushToClient, type CommandMgr } from '../../stage-02-command/src/command.js'

/** 原始复盘步骤（服务端流水的一条协议） */
export interface RawStep {
  /** 协议 ID */
  xyid: number
}

/** 折叠后的复盘步骤（可携带被吸收的附加协议） */
export interface Step {
  /** 协议 ID */
  xyid: number
  /** 归属标记：被吸收后改为锚点 xyid，未被动过保持原值 */
  sign: number
  /** 被本步吸收的附加协议 */
  adds: Step[]
}

export interface ReplayMsg {
  xyid: number
  bytes: Uint8Array
}

/**
 * 批量重放（源：dealBatchFupanData）。
 * 行为：逐条调 svrPushToClient(xyid, bytes, mgr, true)——复盘复用对局链，只更新数据不出动画。
 * msgs 为空 -> 直接返回 0。
 * 返回实际重放的条数。
 */
export function dealBatch(msgs: ReplayMsg[], mgr: CommandMgr): number {
  throw new Error('not implemented: dealBatch')
}

/**
 * 把 absorbXyids 中的瞬时协议折叠进锚点步骤（源：_mergeFupanStartData）。
 *
 * 规则：
 * - 锚点不存在 -> 原样返回（全部转 Step，sign=自身 xyid，adds 空）
 * - 只吸收锚点之后的瞬时协议（锚点之前的不动）
 * - 遇到 stopAtXyid 停止吸收（该协议本身保留）
 * - 被吸收项 sign 改写为锚点 xyid，并按原序列顺序进入锚点 adds
 * - 返回软删除后的新数组；锚点自身保留
 */
export function mergeIntoAnchor(
  steps: RawStep[],
  anchorXyid: number,
  absorbXyids: number[],
  stopAtXyid?: number,
): Step[] {
  throw new Error('not implemented: mergeIntoAnchor')
}
