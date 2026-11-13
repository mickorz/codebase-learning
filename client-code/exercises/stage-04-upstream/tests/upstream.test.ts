// stage-04 验收测试。学习者不要修改。
import { describe, expect, it } from 'vitest'
import { decode } from '../../stage-01-protocol/src/protocol.js'
import { GameState } from '../../stage-03-state-events/src/state-events.js'
import { Upstream } from '../src/upstream.js'

function setup(askid = 0) {
  const state = new GameState()
  state.askid = askid
  return new Upstream(state)
}

describe('sendPlay', () => {
  it('askid 为 0（无 Power 凭据）-> 拒绝发送', () => {
    const up = setup(0)
    expect(up.sendPlay(37)).toBe(false)
    expect(up.sent).toHaveLength(0)
  })

  it('有 askid -> 发送，xyid 为 CS_PLAY_C(201)', () => {
    const up = setup(7)
    expect(up.sendPlay(37)).toBe(true)
    expect(up.sent).toHaveLength(1)
    expect(up.sent[0]!.xyid).toBe(201)
  })

  it('字节可逆：decode 后还原 seat/mah/askid/flag', () => {
    const up = setup(7)
    up.sendPlay(37)
    const body = decode<{ seat: number; mah: number; askid: number; flag: number }>(up.sent[0]!.bytes)
    expect(body).toEqual({ seat: 1, mah: 37, askid: 7, flag: 0 })
  })

  it('baoTing=true 时 flag 为 1', () => {
    const up = setup(7)
    up.sendPlay(37, true)
    const body = decode<{ flag: number }>(up.sent[0]!.bytes)
    expect(body.flag).toBe(1)
  })
})

describe('sendHu', () => {
  it('askid 为 0 -> 拒绝', () => {
    const up = setup(0)
    expect(up.sendHu()).toBe(false)
    expect(up.sent).toHaveLength(0)
  })

  it('有 askid -> 发送，xyid 为 202，body 含 askid', () => {
    const up = setup(9)
    expect(up.sendHu()).toBe(true)
    expect(up.sent[0]!.xyid).toBe(202)
    const body = decode<{ seat: number; askid: number; flag: number }>(up.sent[0]!.bytes)
    expect(body).toEqual({ seat: 1, askid: 9, flag: 0 })
  })
})
