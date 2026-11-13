// stage-01 验收测试。学习者不要修改。
import { describe, expect, it } from 'vitest'
import { GAME_MSG_DECODERS, XYID, decode, makeDecoder, pack, parseGameMsg } from '../src/protocol.js'

describe('pack / decode 往返', () => {
  it('pack 输出 Uint8Array，decode 还原对象', () => {
    const bytes = pack({ seat: 1, mah: 37 })
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(decode<{ seat: number; mah: number }>(bytes)).toEqual({ seat: 1, mah: 37 })
  })

  it('decode 非法字节抛错', () => {
    expect(() => decode(new Uint8Array([1, 2, 3]))).toThrow()
  })
})

describe('makeDecoder', () => {
  it('解码结果带 xyid 且 body 为还原对象', () => {
    const dec = makeDecoder<{ mah: number }>(XYID.GP_PLAY_S)
    const msg = dec(pack({ mah: 5 }))
    expect(msg.xyid).toBe(XYID.GP_PLAY_S)
    expect(msg.body).toEqual({ mah: 5 })
  })
})

describe('GAME_MSG_DECODERS / parseGameMsg', () => {
  it('表覆盖 XYID 全部五个 ID', () => {
    for (const id of Object.values(XYID)) {
      expect(GAME_MSG_DECODERS[id], `missing decoder for ${id}`).toBeDefined()
    }
  })

  it('parseGameMsg 已知 xyid 返回 {xyid, body}', () => {
    const msg = parseGameMsg(XYID.GP_TAKE, pack({ seat: 2 }))
    expect(msg).not.toBeNull()
    expect(msg!.xyid).toBe(XYID.GP_TAKE)
    expect(msg!.body).toEqual({ seat: 2 })
  })

  it('未知 xyid 返回 null（不抛错）', () => {
    expect(parseGameMsg(999, pack({}))).toBeNull()
  })
})
