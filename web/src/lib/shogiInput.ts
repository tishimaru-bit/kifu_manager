import type { Config } from 'shogiground/config'
import type { Key, Piece as SgPiece } from 'shogiground/types'
import { shogigroundDropDests, shogigroundMoveDests } from 'shogiops/compat'
import {
  pieceCanPromote,
  pieceForcePromote,
  promote,
  unpromote,
} from 'shogiops/position/util'
import { parseSfen } from 'shogiops/sfen'
import type { Role } from 'shogiops/types'
import { makeUsi, parseSquareName } from 'shogiops/util'
import type { BoardState } from './kifu'

const rules = 'standard'
const canPromote = pieceCanPromote(rules)
const forcePromote = pieceForcePromote(rules)

/** 現在の局面で指せる手・打てる手と成りの判定を、shogiground の設定にする */
export function inputConfigOf(state: BoardState): Config {
  const sfen = `${state.board} ${state.turn === 'sente' ? 'b' : 'w'} ${state.hands} 1`
  const pos = parseSfen(rules, sfen, false).unwrap()

  const promotion = (orig: Key, dest: Key) => {
    const from = parseSquareName(orig)
    const to = parseSquareName(dest)
    const piece = pos.board.pieceAt(from)
    if (!piece) return { can: false, force: false }
    return {
      can: canPromote(piece, from, to, pos.board.pieceAt(to)),
      force: forcePromote(piece, to),
    }
  }

  return {
    turnColor: state.turn,
    activeColor: state.turn,
    movable: { dests: shogigroundMoveDests(pos) as NonNullable<Config['movable']>['dests'] },
    droppable: { dests: shogigroundDropDests(pos) as NonNullable<Config['droppable']>['dests'] },
    promotion: {
      promotesTo: (role) => promote(rules)(role as Role),
      unpromotesTo: (role) => unpromote(rules)(role as Role),
      movePromotionDialog: (orig, dest) => {
        const p = promotion(orig, dest)
        return p.can && !p.force
      },
      forceMovePromotion: (orig, dest) => promotion(orig, dest).force,
    },
  }
}

export function moveUsi(orig: Key, dest: Key, prom: boolean): string {
  return makeUsi({ from: parseSquareName(orig), to: parseSquareName(dest), promotion: prom })
}

export function dropUsi(piece: SgPiece, key: Key): string {
  return makeUsi({ role: piece.role as Role, to: parseSquareName(key) })
}
