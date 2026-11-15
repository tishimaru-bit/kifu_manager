import { Text } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { Shogiground } from 'shogiground'
import type { Api } from 'shogiground/api'
import type { BoardState, Side } from '../lib/kifu'
import { dropUsi, inputConfigOf, moveUsi } from '../lib/shogiInput'
import '../shogiground/board.css'
import classes from './ShogiBoard.module.css'

interface Props {
  state: BoardState
  orientation: Side
  senteName: string
  goteName: string
  /** 指定すると駒を動かせるようになり、指された手を USI 形式で受け取る */
  onMove?: (usi: string) => void
}

export function ShogiBoard({ state, orientation, senteName, goteName, onMove }: Props) {
  const boardRef = useRef<HTMLDivElement>(null)
  const topHandRef = useRef<HTMLDivElement>(null)
  const bottomHandRef = useRef<HTMLDivElement>(null)
  const groundRef = useRef<Api | null>(null)
  const onMoveRef = useRef(onMove)
  const interactive = onMove !== undefined

  useEffect(() => {
    onMoveRef.current = onMove
  })

  useEffect(() => {
    const ground = Shogiground(
      {
        viewOnly: !interactive,
        coordinates: { enabled: true, files: 'numeric', ranks: 'japanese' },
        animation: { enabled: true, hands: true, duration: 150 },
        movable: {
          showDests: true,
          events: { after: (orig, dest, prom) => onMoveRef.current?.(moveUsi(orig, dest, prom)) },
        },
        droppable: {
          showDests: true,
          events: { after: (piece, key) => onMoveRef.current?.(dropUsi(piece, key)) },
        },
      },
      {
        board: boardRef.current!,
        hands: { top: topHandRef.current!, bottom: bottomHandRef.current! },
      },
    )
    groundRef.current = ground
    return () => {
      ground.destroy()
      groundRef.current = null
    }
  }, [interactive])

  useEffect(() => {
    groundRef.current?.set({
      sfen: { board: state.board, hands: state.hands },
      orientation,
      turnColor: state.turn,
      lastDests: state.lastDests,
      checks: state.check,
      ...(interactive ? inputConfigOf(state) : {}),
    })
  }, [state, orientation, interactive])

  const [topName, bottomName] =
    orientation === 'sente' ? [`☖ ${goteName}`, `☗ ${senteName}`] : [`☗ ${senteName}`, `☖ ${goteName}`]

  return (
    <div className={interactive ? `${classes.root} ${classes.interactive}` : classes.root}>
      <Text className={classes.label} size="sm">
        {topName}
      </Text>
      <div ref={topHandRef} className={classes.hand} />
      <div className={classes.boardFrame}>
        <div ref={boardRef} />
      </div>
      <div ref={bottomHandRef} className={classes.hand} />
      <Text className={classes.label} size="sm">
        {bottomName}
      </Text>
    </div>
  )
}
