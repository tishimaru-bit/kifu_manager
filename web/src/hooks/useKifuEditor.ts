import { useState } from 'react'
import { type ImmutableNode, importKIF, Record, SpecialMoveType } from 'tsshogi'
import {
  type BoardState,
  boardStateOf,
  type HeaderField,
  headerKeys,
  headerOf,
  type KifuHeader,
} from '../lib/kifu'

interface Snapshot {
  record: Record
  /** 保存が必要な変更のたびに増える。局面の移動だけでは増えない */
  revision: number
  board: BoardState
  ply: number
  length: number
  moves: ImmutableNode[]
  currentNode: ImmutableNode
  branches: ImmutableNode[]
  header: KifuHeader
}

function snapshot(record: Record, revision: number): Snapshot {
  const branches: ImmutableNode[] = []
  for (let n: ImmutableNode | null = record.branchBegin; n; n = n.branch) branches.push(n)

  return {
    record,
    revision,
    board: boardStateOf(record),
    ply: record.current.ply,
    length: record.length,
    moves: [...record.moves],
    currentNode: record.current,
    branches,
    header: headerOf(record),
  }
}

function loadRecord(kifText?: string): Record {
  if (!kifText) return new Record()
  const record = importKIF(kifText)
  if (record instanceof Error) throw record
  record.goto(record.length)
  return record
}

export function useKifuEditor(initialKif?: string) {
  const [snap, setSnap] = useState(() => snapshot(loadRecord(initialKif), 0))
  const record = snap.record

  const commit = (changed: boolean) =>
    setSnap((prev) => snapshot(prev.record, prev.revision + (changed ? 1 : 0)))

  return {
    ...snap,

    play(usi: string) {
      const move = record.position.createMoveByUSI(usi)
      if (!move || !record.append(move)) {
        // 盤面側で動いてしまった駒を元の局面に戻す
        setSnap((prev) => ({ ...prev, board: { ...prev.board } }))
        return
      }
      commit(true)
    },
    goto(ply: number) {
      record.goto(Math.max(0, Math.min(ply, record.length)))
      commit(false)
    },
    switchBranch(index: number) {
      if (record.switchBranchByIndex(index)) commit(false)
    },
    removeCurrentMove() {
      if (record.removeCurrentMove()) commit(true)
    },
    resign() {
      if (record.append(SpecialMoveType.RESIGN)) commit(true)
    },
    setHeader(field: HeaderField, value: string) {
      record.metadata.setStandardMetadata(headerKeys[field], value)
      commit(true)
    },
  }
}
