// stage-03 状态与事件桩文件
// 源参考：data/GameData.ts（状态容器）+ config/FguiViewDefine.ts（GameEventBoxHzmj 事件字典）
//         + layer/BoxHzmjMainView.ts（@gf.listen 事件响应）
// 依赖 stage-02：命令经 CommandMgr 分发后更新状态并派发事件。
// 任务：实现全部 throw 桩，使 tests/state-events.test.ts 全绿。

import type { CommandMgr, Notification } from '../../stage-02-command/src/command.js'
import { CmdNames } from '../../stage-02-command/src/command.js'

// ---------- 事件总线（源：gf.dispatch / @gf.listen 的对称契约） ----------

export type Handler = (...args: unknown[]) => void

export class EventBus {
  private handlers = new Map<string, Handler[]>()

  /** 订阅（源：@gf.listen 事件名的等价物） */
  on(event: string, handler: Handler): void {
    throw new Error('not implemented: EventBus.on')
  }

  /** 退订（源：视图销毁时的清理） */
  off(event: string, handler: Handler): void {
    throw new Error('not implemented: EventBus.off')
  }

  /**
   * 派发（源：controller 里的 this.dispatch(GameEventBoxHzmj.xxx, ...)）。
   * 容错规则：某个 handler 抛异常不得阻断其余 handler（源码靠框架保证，练习里你来保证）。
   */
  dispatch(event: string, ...args: unknown[]): void {
    throw new Error('not implemented: EventBus.dispatch')
  }
}

// ---------- 事件字典（源：GameEventBoxHzmj，controller 与 view 的全部契约面） ----------

export const GameEvents = {
  onMsgStartGame: 'BOX_onMsgStartGame',
  onPlayerDataEx: 'BOX_onPlayerDataEx',
  onUpdateHandCards: 'BOX_onUpdateHandCards',
} as const

// ---------- 状态容器（源：data/GameData.ts 的微缩版） ----------

export class GameState {
  /** 自己的手牌 */
  handCards: number[] = []
  /** 当前操作序号（源：askid，服务端权威的操作凭据） */
  askid = 0

  clear(): void {
    this.handCards = []
    this.askid = 0
  }
}

// ---------- 命令（源：cmd/gameCmd/GameStartGameCmd / GamePlayCmd 更新状态 + 派发事件） ----------

/**
 * 注册游戏命令：把协议命令接到「更新状态 + 派发事件」上。
 * - CMD_START_GAME：body 为 { handCards: number[]; askid: number } ->
 *   写入 state（handCards 整组替换、askid 直接赋值），并 dispatch(GameEvents.onMsgStartGame, handCards)
 * - CMD_PLAY_S：body 为 { seat: number; mah: number } -> 从 state.handCards 移除该 mah 一张，
 *   并 dispatch(GameEvents.onUpdateHandCards, 新手牌)
 */
export function registerGameCommands(mgr: CommandMgr, state: GameState, bus: EventBus): void {
  mgr.register(CmdNames.CMD_START_GAME, (n: Notification) => {
    throw new Error('not implemented: CMD_START_GAME')
  })
  mgr.register(CmdNames.CMD_PLAY_S, (n: Notification) => {
    throw new Error('not implemented: CMD_PLAY_S')
  })
}
