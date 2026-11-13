// 验收测试：对应 controller/gameController.ts _mergeFupanStartData 的行为约定。
// 本文件是验收标准，学习者不要修改。
import { describe, expect, it } from 'vitest'
import { mergeIntoAnchor, type RawStep } from '../src/fupan.js'

const raw = (...xyids: number[]): RawStep[] => xyids.map((xyid) => ({ xyid }))

// 协议常量（模拟 GP_START_GAME=100, 配置=201, 玩家信息=202, GP_TAKE=300）
const ANCHOR = 100
const CONFIG = 201
const PLAYER_INFO = 202
const TAKE = 300

describe('mergeIntoAnchor', () => {
  it('正常吸收：瞬时协议并入锚点 adds，sign 改写，结果不含被吸收项', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG, PLAYER_INFO), ANCHOR, [CONFIG, PLAYER_INFO])
    expect(result).toHaveLength(1)
    expect(result[0].xyid).toBe(ANCHOR)
    expect(result[0].sign).toBe(ANCHOR)
    expect(result[0].adds.map((s) => s.xyid)).toEqual([CONFIG, PLAYER_INFO])
    expect(result[0].adds.every((s) => s.sign === ANCHOR)).toBe(true)
  })

  it('吸收顺序保持原序列顺序', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, PLAYER_INFO, CONFIG), ANCHOR, [CONFIG, PLAYER_INFO])
    expect(result[0].adds.map((s) => s.xyid)).toEqual([PLAYER_INFO, CONFIG])
  })

  it('锚点缺失 -> 原样返回', () => {
    const steps = raw(CONFIG, PLAYER_INFO)
    const result = mergeIntoAnchor(steps, ANCHOR, [CONFIG, PLAYER_INFO])
    expect(result.map((s) => s.xyid)).toEqual([CONFIG, PLAYER_INFO])
    expect(result.every((s) => s.sign === s.xyid)).toBe(true)
    expect(result.every((s) => s.adds.length === 0)).toBe(true)
  })

  it('stopAt 截断：截断协议保留，其后的瞬时协议不被吸收', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG, TAKE, PLAYER_INFO), ANCHOR, [CONFIG, PLAYER_INFO], TAKE)
    expect(result.map((s) => s.xyid)).toEqual([ANCHOR, TAKE, PLAYER_INFO])
    expect(result[0].adds.map((s) => s.xyid)).toEqual([CONFIG])
  })

  it('锚点之前的瞬时协议不被吸收', () => {
    const result = mergeIntoAnchor(raw(CONFIG, ANCHOR), ANCHOR, [CONFIG])
    expect(result.map((s) => s.xyid)).toEqual([CONFIG, ANCHOR])
    expect(result[0].adds).toHaveLength(0)
  })

  it('空 absorbs -> 不动数据', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG), ANCHOR, [])
    expect(result.map((s) => s.xyid)).toEqual([ANCHOR, CONFIG])
  })

  it('锚点自身 sign 不变、仍保留在序列中', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG), ANCHOR, [CONFIG])
    const anchor = result.find((s) => s.xyid === ANCHOR)
    expect(anchor).toBeDefined()
    expect(anchor!.sign).toBe(ANCHOR)
  })

  it('多次吸收不产生重复：adds 数量正确', () => {
    const result = mergeIntoAnchor(raw(ANCHOR, CONFIG, CONFIG, PLAYER_INFO, CONFIG), ANCHOR, [CONFIG, PLAYER_INFO])
    expect(result).toHaveLength(1)
    expect(result[0].adds).toHaveLength(4)
    expect(result[0].adds.filter((s) => s.xyid === CONFIG)).toHaveLength(3)
  })
})
