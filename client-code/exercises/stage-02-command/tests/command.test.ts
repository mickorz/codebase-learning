// stage-02 验收测试。学习者不要修改。
import { describe, expect, it, vi } from 'vitest'
import { XYID, pack } from '../../stage-01-protocol/src/protocol.js'
import { CommandMgr, CmdNames, SVR_PUSH_CMD_BY_XYID, svrPushToClient, type Notification } from '../src/command.js'

type NotificationLike = Notification

describe('CommandMgr', () => {
  it('register + execute 命中，body/flag 原样透传', () => {
    const mgr = new CommandMgr()
    const received: NotificationLike[] = []
    type NotificationLike = { name: string; body: unknown; flag?: string }
    mgr.register(CmdNames.CMD_PLAY_S, (n) => received.push({ name: n.name, body: n.body, flag: n.flag }))
    mgr.execute(CmdNames.CMD_PLAY_S, { seat: 1 }, 'justUpdateData')
    expect(received).toEqual([{ name: CmdNames.CMD_PLAY_S, body: { seat: 1 }, flag: 'justUpdateData' }])
  })

  it('未注册命令 execute 抛错', () => {
    const mgr = new CommandMgr()
    expect(() => mgr.execute('CMD_NOT_EXIST', {})).toThrow()
  })
})

describe('SVR_PUSH_CMD_BY_XYID', () => {
  it('四个下行协议都在表内，上行 CS_PLAY_C 不在', () => {
    expect(SVR_PUSH_CMD_BY_XYID.get(XYID.GP_START_GAME)).toBe(CmdNames.CMD_START_GAME)
    expect(SVR_PUSH_CMD_BY_XYID.get(XYID.GP_TAKE)).toBe(CmdNames.CMD_TAKE)
    expect(SVR_PUSH_CMD_BY_XYID.get(XYID.GP_PLAY_S)).toBe(CmdNames.CMD_PLAY_S)
    expect(SVR_PUSH_CMD_BY_XYID.get(XYID.GP_POWER)).toBe(CmdNames.CMD_POWER)
    expect(SVR_PUSH_CMD_BY_XYID.has(XYID.CS_PLAY_C)).toBe(false)
  })
})

describe('svrPushToClient', () => {
  it('正确路由到命令并透传 body', () => {
    const mgr = new CommandMgr()
    const spy = vi.fn()
    mgr.register(CmdNames.CMD_PLAY_S, spy)
    const executed = svrPushToClient(XYID.GP_PLAY_S, pack({ seat: 3, mah: 11 }), mgr)
    expect(executed).toBe(true)
    expect(spy).toHaveBeenCalledOnce()
    expect((spy.mock.calls[0]![0] as { body: unknown }).body).toEqual({ seat: 3, mah: 11 })
  })

  it('justUpdateData=true 时 flag 为 justUpdateData', () => {
    const mgr = new CommandMgr()
    const spy = vi.fn()
    mgr.register(CmdNames.CMD_TAKE, spy)
    svrPushToClient(XYID.GP_TAKE, pack({ seat: 1 }), mgr, true)
    expect((spy.mock.calls[0]![0] as { flag?: string }).flag).toBe('justUpdateData')
  })

  it('未知 xyid 安全返回 false，不抛错不执行命令', () => {
    const mgr = new CommandMgr()
    const spy = vi.fn()
    mgr.register(CmdNames.CMD_PLAY_S, spy)
    expect(svrPushToClient(999, pack({}), mgr)).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })
})
