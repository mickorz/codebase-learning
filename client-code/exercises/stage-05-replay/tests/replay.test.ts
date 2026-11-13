// stage-05 验收测试。学习者不要修改。
import { describe, expect, it, vi } from 'vitest'
import { pack } from '../../stage-01-protocol/src/protocol.js'
import { CommandMgr, CmdNames } from '../../stage-02-command/src/command.js'
import { dealBatch, mergeIntoAnchor, type RawStep } from '../src/replay.js'

// ---------- dealBatch：复用对局下行链（源：dealBatchFupanData） ----------

describe('dealBatch', () => {
  it('逐条以 justUpdateData 重放，返回条数', () => {
    const mgr = new CommandMgr()
    const spy = vi.fn()
    mgr.register(CmdNames.CMD_PLAY_S, spy)
    mgr.register(CmdNames.CMD_POWER, spy)
    const n = dealBatch(
      [
        { xyid: 103, bytes: pack({ seat: 1, mah: 5 }) }, // GP_PLAY_S
        { xyid: 104, bytes: pack({ seat: 1 }) }, // GP_POWER
      ],
      mgr,
    )
    expect(n).toBe(2)
    expect(spy).toHaveBeenCalledTimes(2)
    expect((spy.mock.calls[0]![0] as { flag?: string }).flag).toBe('justUpdateData')
  })

  it('空列表 -> 返回 0，不执行任何命令', () => {
    const mgr = new CommandMgr()
    expect(dealBatch([], mgr)).toBe(0)
  })

  it('未知 xyid 不计入条数（安全跳过）', () => {
    const mgr = new CommandMgr()
    const n = dealBatch([{ xyid: 999, bytes: pack({}) }], mgr)
    expect(n).toBe(0)
  })
})

// ---------- mergeIntoAnchor：锚点折叠（源：_mergeFupanStartData） ----------

const raw = (...xyids: number[]): RawStep[] => xyids.map((xyid) => ({ xyid }))

const ANCHOR = 100
const CONFIG = 201
const PLAYER_INFO = 202
const TAKE = 300

describe('mergeIntoAnchor', () => {
  it('正常吸收：瞬时协议并入锚点 adds，sign 改写，结果不含被吸收项', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG, PLAYER_INFO), ANCHOR, [CONFIG, PLAYER_INFO])
    expect(result).toHaveLength(1)
    expect(result[0]!.xyid).toBe(ANCHOR)
    expect(result[0]!.sign).toBe(ANCHOR)
    expect(result[0]!.adds.map((s) => s.xyid)).toEqual([CONFIG, PLAYER_INFO])
    expect(result[0]!.adds.every((s) => s.sign === ANCHOR)).toBe(true)
  })

  it('吸收顺序保持原序列顺序', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, PLAYER_INFO, CONFIG), ANCHOR, [CONFIG, PLAYER_INFO])
    expect(result[0]!.adds.map((s) => s.xyid)).toEqual([PLAYER_INFO, CONFIG])
  })

  it('锚点缺失 -> 原样返回', () => {
    const result = mergeIntoAnchor(raw(CONFIG, PLAYER_INFO), ANCHOR, [CONFIG, PLAYER_INFO])
    expect(result.map((s) => s.xyid)).toEqual([CONFIG, PLAYER_INFO])
    expect(result.every((s) => s.sign === s.xyid)).toBe(true)
    expect(result.every((s) => s.adds.length === 0)).toBe(true)
  })

  it('stopAt 截断：截断协议保留，其后的瞬时协议不被吸收', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG, TAKE, PLAYER_INFO), ANCHOR, [CONFIG, PLAYER_INFO], TAKE)
    expect(result.map((s) => s.xyid)).toEqual([ANCHOR, TAKE, PLAYER_INFO])
    expect(result[0]!.adds.map((s) => s.xyid)).toEqual([CONFIG])
  })

  it('锚点之前的瞬时协议不被吸收', () => {
    const result = mergeIntoAnchor(raw(CONFIG, ANCHOR), ANCHOR, [CONFIG])
    expect(result.map((s) => s.xyid)).toEqual([CONFIG, ANCHOR])
    expect(result[0]!.adds).toHaveLength(0)
  })

  it('空 absorbs -> 不动数据', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG), ANCHOR, [])
    expect(result.map((s) => s.xyid)).toEqual([ANCHOR, CONFIG])
  })

  it('锚点自身 sign 不变、仍保留在序列中', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG), ANCHOR, [CONFIG])
    const anchor = result.find((s) => s.xyid === ANCHOR)!
    expect(anchor.sign).toBe(ANCHOR)
  })

  it('多次吸收不产生重复：adds 数量正确', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG, CONFIG, PLAYER_INFO, CONFIG), ANCHOR, [CONFIG, PLAYER_INFO])
    expect(result).toHaveLength(1)
    expect(result[0]!.adds).toHaveLength(4)
    expect(result[0]!.adds.filter((s) => s.xyid === CONFIG)).toHaveLength(3)
  })
})
