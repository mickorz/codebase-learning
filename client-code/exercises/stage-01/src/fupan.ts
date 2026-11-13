// 复盘锚点折叠练习桩文件
// 源参考：controller/gameController.ts prepareFupanData / _mergeFupanStartData
// 任务：实现 mergeIntoAnchor，使 tests/fupan.test.ts 全绿。

/** 原始复盘步骤（服务端流水的一条协议） */
export interface RawStep {
  /** 协议 ID */
  xyid: number;
}

/** 折叠后的复盘步骤（可携带被吸收的附加协议） */
export interface Step {
  /** 协议 ID */
  xyid: number;
  /** 归属标记：被吸收后改为锚点 xyid，未被动过保持原值 */
  sign: number;
  /** 被本步吸收的附加协议 */
  adds: Step[];
}

/**
 * 把 absorbXyids 中的瞬时协议折叠进锚点步骤。
 *
 * 规则（对应源码 _mergeFupanStartData）：
 * - 锚点不存在 -> 原样返回
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
