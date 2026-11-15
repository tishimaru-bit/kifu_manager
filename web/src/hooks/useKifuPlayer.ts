import { useCallback, useState } from 'react'
import { type ImmutableNode, importKIF, type Record } from 'tsshogi'
import { type BoardState, boardStateOf } from '../lib/kifu'

interface PlayerState {
  kifText: string
  record: Record | null
  error: Error | null
  ply: number
  board: BoardState | null
  currentNode: ImmutableNode | null
}

function seek(s: PlayerState, record: Record, ply: number): PlayerState {
  const clamped = Math.max(0, Math.min(ply, record.length))
  record.goto(clamped)
  return { ...s, record, ply: clamped, board: boardStateOf(record), currentNode: record.current }
}

function load(kifText: string, prev?: PlayerState): PlayerState {
  const empty = { kifText, record: null, error: null, ply: 0, board: null, currentNode: null }
  const result = importKIF(kifText)
  if (result instanceof Error) return { ...empty, error: result }

  // 最終手を見ていた場合だけ新しい最終手に追従し、途中の局面を見ている人の画面は動かさない
  const wasAtEnd = !prev?.record || prev.ply >= prev.record.length
  return seek(empty, result, wasAtEnd ? result.length : prev.ply)
}

export function useKifuPlayer(kifText: string) {
  const [state, setState] = useState(() => load(kifText))

  let current = state
  if (state.kifText !== kifText) {
    current = load(kifText, state)
    setState(current)
  }

  const goto = useCallback((ply: number) => {
    setState((s) => (s.record ? seek(s, s.record, ply) : s))
  }, [])

  return {
    error: current.error,
    ply: current.ply,
    length: current.record?.length ?? 0,
    moves: current.record?.moves ?? [],
    board: current.board,
    currentNode: current.currentNode,
    goto,
  }
}
