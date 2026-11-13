// stage-01 协议层桩文件
// 源参考：protocol/GameGlcProtocol.ts（XYID 表 / Msg 样板 / GAME_MSG_DECODERS / HzmjDataParser）
// 用 JSON over TextEncoder 模拟 protobuf 字节流，行为等价：bytes -> 类型化消息。
// 任务：实现全部 throw 桩，使 tests/protocol.test.ts 全绿。

/** 简化版状态枚举（源：GAME_STATUS 基础段） */
export const GAME_STATUS = {
  NONE: 1,
  START: 2,
  ACTION: 10,
  RESULT: 23,
  END: 24,
} as const;

/** 协议 ID 常量表（源：GLCProtocol.XYID；真实仓库从 proto 生成物取值，这里是手写常量） */
export const XYID = {
  GP_START_GAME: 101,
  GP_TAKE: 102,
  GP_PLAY_S: 103,
  GP_POWER: 104,
  CS_PLAY_C: 201,
} as const;

export interface Msg<T = unknown> {
  xyid: number;
  body: T;
}

/** 编码：对象 -> 字节流（JSON over TextEncoder，模拟 protobuf encode） */
export function pack(obj: object): Uint8Array {
  throw new Error('not implemented: pack')
}

/** 解码：字节流 -> 对象。非法字节（JSON 解析失败）直接抛错。 */
export function decode<T>(bytes: Uint8Array): T {
  throw new Error('not implemented: decode')
}

/**
 * 解码器工厂（源：每个 Msg 类"static xyid + decode 包装"的样板，这里收敛成一个工厂）。
 * 返回的解码器：bytes -> { xyid, body }（xyid 必须等于注册时的 xyid）。
 */
export function makeDecoder<T>(xyid: number): (bytes: Uint8Array) => Msg<T> {
  throw new Error('not implemented: makeDecoder')
}

/**
 * 解码器表（源：GAME_MSG_DECODERS）。
 * 用 XYID 全部五个 ID 建表——提示：遍历 Object.values(XYID) 配 makeDecoder，不要手写五行。
 */
export const GAME_MSG_DECODERS: Record<number, (bytes: Uint8Array) => Msg<never>> = {} as never

/**
 * 解析入口（源：HzmjDataParser.parseGameMsg）。
 * 表里有该 xyid -> 返回解码结果；没有 -> 返回 null（不抛错，路由层决定怎么处理）。
 */
export function parseGameMsg(xyid: number, bytes: Uint8Array): Msg<never> | null {
  throw new Error('not implemented: parseGameMsg')
}
