// stage-04 上行操作桩文件
// 源参考：controller/gameController.ts cs 发送区（sendPlay/sendHu，L401-560）
//         + data/GameData.ts（askid 字段）
// 依赖 stage-03：GameState 提供 askid。
// 任务：实现全部 throw 桩，使 tests/upstream.test.ts 全绿。

import { pack } from '../../stage-01-protocol/src/protocol.js'
import { XYID } from '../../stage-01-protocol/src/protocol.js'
import type { GameState } from '../../stage-03-state-events/src/state-events.js'

export interface SentMsg {
  xyid: number
  bytes: Uint8Array
}

/** 记录发送的上行通道（源：this.send -> tableController.sendMsgToServer 的测试替身） */
export class Upstream {
  sent: SentMsg[] = []

  constructor(private state: GameState) {}

  /**
   * 出牌（源：sendPlay(mah, baoting)）。
   * 行为：askid 为 0（未收到 Power 凭据）时拒绝发送（不进 sent）；否则组装
   * { seat: 1, mah, askid, flag: baoting ? 1 : 0 } -> pack -> 记录 xyid=XYID.CS_PLAY_C。
   * 返回是否实际发送。
   */
  sendPlay(mah: number, baoTing = false): boolean {
    throw new Error('not implemented: sendPlay')
  }

  /**
   * 胡（源：sendHu）。
   * 行为：askid 为 0 拒绝；否则组装 { seat: 1, askid, flag: 0 } -> pack -> xyid=XYID.CS_PLAY_C 换成专用 202。
   * 为简化练习，胡协议 xyid 固定用 202（新增常量 XYID_HU = 202）。
   */
  sendHu(): boolean {
    throw new Error('not implemented: sendHu')
  }

  /** 胡协议专用 xyid（练习内常量；真实仓库是 GLCProtocol.XYID.CS_HU_C） */
  static readonly XYID_HU = 202
}

// pack/XYID 仅为类型提示，实际使用见各方法
void pack
void XYID
