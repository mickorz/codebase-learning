// stage-03 验收测试。学习者不要修改。
import { describe, expect, it, vi } from 'vitest'
import { CommandMgr, CmdNames } from '../../stage-02-command/src/command.js'
import { EventBus, GameEvents, GameState, registerGameCommands } from '../src/state-events.js'

describe('EventBus', () => {
  it('dispatch -> on 收到参数', () => {
    const bus = new EventBus()
    const spy = vi.fn()
    bus.on(GameEvents.onMsgStartGame, spy)
    bus.dispatch(GameEvents.onMsgStartGame, [1, 2, 3])
    expect(spy).toHaveBeenCalledWith([1, 2, 3])
  })

  it('多订阅者都收到', () => {
    const bus = new EventBus()
    const a = vi.fn()
    const b = vi.fn()
    bus.on(GameEvents.onPlayerDataEx, a)
    bus.on(GameEvents.onPlayerDataEx, b)
    bus.dispatch(GameEvents.onPlayerDataEx, 1)
    expect(a).toHaveBeenCalled()
    expect(b).toHaveBeenCalled()
  })

  it('一个 handler 抛异常不阻断其余 handler', () => {
    const bus = new EventBus()
    const bad = vi.fn(() => {
      throw new Error('boom')
    })
    const good = vi.fn()
    bus.on(GameEvents.onUpdateHandCards, bad)
    bus.on(GameEvents.onUpdateHandCards, good)
    expect(() => bus.dispatch(GameEvents.onUpdateHandCards, [9])).not.toThrow()
    expect(good).toHaveBeenCalledWith([9])
  })

  it('off 退订后不再收到', () => {
    const bus = new EventBus()
    const spy = vi.fn()
    const h = (...args: unknown[]) => spy(...args)
    bus.on(GameEvents.onMsgStartGame, h)
    bus.off(GameEvents.onMsgStartGame, h)
    bus.dispatch(GameEvents.onMsgStartGame, [])
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('游戏命令：状态更新 + 事件派发', () => {
  function setup() {
    const mgr = new CommandMgr()
    const state = new GameState()
    const bus = new EventBus()
    registerGameCommands(mgr, state, bus)
    return { mgr, state, bus }
  }

  it('CMD_START_GAME：写入手牌与 askid，并派发 onMsgStartGame', () => {
    const { mgr, state, bus } = setup()
    const spy = vi.fn()
    bus.on(GameEvents.onMsgStartGame, spy)
    mgr.execute(CmdNames.CMD_START_GAME, { handCards: [11, 22, 33], askid: 7 })
    expect(state.handCards).toEqual([11, 22, 33])
    expect(state.askid).toBe(7)
    expect(spy).toHaveBeenCalledWith([11, 22, 33])
  })

  it('CMD_PLAY_S：从手牌移除该牌一张，并派发 onUpdateHandCards', () => {
    const { mgr, state, bus } = setup()
    state.handCards = [11, 22, 22, 33]
    const spy = vi.fn()
    bus.on(GameEvents.onUpdateHandCards, spy)
    mgr.execute(CmdNames.CMD_PLAY_S, { seat: 1, mah: 22 })
    expect(state.handCards).toEqual([11, 22, 33])
    expect(spy).toHaveBeenCalledWith([11, 22, 33])
  })

  it('CMD_PLAY_S 出不存在的牌：手牌不变', () => {
    const { mgr, state } = setup()
    state.handCards = [11, 22]
    mgr.execute(CmdNames.CMD_PLAY_S, { seat: 1, mah: 99 })
    expect(state.handCards).toEqual([11, 22])
  })
})
