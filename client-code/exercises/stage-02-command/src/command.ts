// stage-02 命令路由桩文件
// 源参考：controller/gameController.ts（Hzmj_SVR_PUSH_CMD_BY_XYID / svrPushToClient）
//         + common_game/command/commandMgr（RegisterCmd / SimpleCommand / execute）
// 依赖 stage-01：import 自 ../stage-01-protocol/src/protocol.js
// 任务：实现全部 throw 桩，使 tests/command.test.ts 全绿。

import { parseGameMsg, XYID } from '../../stage-01-protocol/src/protocol.js'

export interface Notification {
  name: string
  body: unknown
  /** 源码中的 "justUpdateData" 标记：复盘/批量模式下只更新数据不出动画 */
  flag?: string
}

export type Command = (n: Notification) => void

/** 迷你命令管理器（源：common_game/command/commandMgr 的 PureMVC 风格核心） */
export class CommandMgr {
  private commands = new Map<string, Command>()

  /** 注册命令（源：@RegisterCmd 装饰器的等价物） */
  register(name: string, cmd: Command): void {
    throw new Error('not implemented: CommandMgr.register')
  }

  /**
   * 分发命令。未注册的命令名 -> 抛错（源码走 console.error，练习收紧为抛错以便测试）。
   * 注意：body/flag 必须原样透传给命令。
   */
  execute(name: string, body: unknown, flag?: string): void {
    throw new Error('not implemented: CommandMgr.execute')
  }

  has(name: string): boolean {
    return this.commands.has(name)
  }
}

/**
 * 下行路由表（源：Hzmj_SVR_PUSH_CMD_BY_XYID）。
 * 用 Map 而非 switch——源注释："以 Map 代替大 switch，便于与协议定义同步维护"。
 * 命令名约定：GP_START_GAME -> CMD_START_GAME，GP_TAKE -> CMD_TAKE，
 * GP_PLAY_S -> CMD_PLAY_S，GP_POWER -> CMD_POWER（CS_PLAY_C 是上行，不在表内）。
 */
export const SVR_PUSH_CMD_BY_XYID: ReadonlyMap<number, string> = new Map([])

/**
 * 下行主路由（源：svrPushToClient）。
 * 流程：parseGameMsg -> 未知 xyid 则安全返回（不抛错不执行）-> 查表 -> mgr.execute。
 * justUpdateData=true 时 flag 传 "justUpdateData"，否则不传 flag。
 * 返回是否实际执行了命令（用于断言）。
 */
export function svrPushToClient(
  xyid: number,
  bytes: Uint8Array,
  mgr: CommandMgr,
  justUpdateData = false,
): boolean {
  throw new Error('not implemented: svrPushToClient')
}

// 供测试与 stage-05 复用：路由表里的命令名
export const CmdNames = {
  CMD_START_GAME: 'CMD_START_GAME',
  CMD_TAKE: 'CMD_TAKE',
  CMD_PLAY_S: 'CMD_PLAY_S',
  CMD_POWER: 'CMD_POWER',
} as const

// 保证 XYID 引用不被 tree-shake 掉（练习里路由表按它建）
void XYID
