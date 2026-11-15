import type { Key } from 'shogiground/types'
import { type ImmutableRecord, Move, RecordMetadataKey, Square } from 'tsshogi'

export type Side = 'sente' | 'gote'

export const headerKeys = {
  sente: RecordMetadataKey.BLACK_NAME,
  gote: RecordMetadataKey.WHITE_NAME,
  event: RecordMetadataKey.TOURNAMENT,
  startedAt: RecordMetadataKey.START_DATETIME,
} as const

export type HeaderField = keyof typeof headerKeys
export type KifuHeader = { [K in HeaderField]: string }

export function headerOf(record: ImmutableRecord): KifuHeader {
  const header = {} as KifuHeader
  for (const [field, key] of Object.entries(headerKeys) as [HeaderField, RecordMetadataKey][]) {
    header[field] = record.metadata.getStandardMetadata(key) ?? ''
  }
  return header
}

/** 投了などの特殊な手を除いた手数 */
export function moveCountOf(record: ImmutableRecord): number {
  return record.moves.filter((n) => n.move instanceof Move).length
}

export interface BoardState {
  board: string
  hands: string
  turn: Side
  lastDests: Key[] | undefined
  check: boolean
}

export function boardStateOf(record: ImmutableRecord): BoardState {
  const [board, turn, hands] = record.position.sfen.split(' ')
  const move = record.current.move
  return {
    board,
    hands,
    turn: turn === 'b' ? 'sente' : 'gote',
    lastDests: move instanceof Move ? lastDestsOf(move) : undefined,
    check: record.position.checked,
  }
}

const kifDatePattern = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/

/** KIF の日時を ISO 形式にする。読めなければ空文字 */
export function kifDateToIso(kifDate: string): string {
  const m = kifDatePattern.exec(kifDate)
  if (!m) return ''
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m
  const date = new Date(+y, +mo - 1, +d, +h, +mi, +s)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function lastDestsOf(move: Move): Key[] {
  const to = move.to.usi as Key
  return move.from instanceof Square ? [move.from.usi as Key, to] : [to]
}
