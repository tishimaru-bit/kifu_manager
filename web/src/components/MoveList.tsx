import { ScrollArea, UnstyledButton } from '@mantine/core'
import { useEffect, useRef } from 'react'
import type { ImmutableNode } from 'tsshogi'

interface Props {
  moves: ImmutableNode[]
  ply: number
  onSelect: (ply: number) => void
  height?: number
}

export function MoveList({ moves, ply, onSelect, height = 360 }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLButtonElement>(null)

  // scrollIntoView はページ全体までスクロールさせるため、リストの枠内だけを動かす
  useEffect(() => {
    const viewport = viewportRef.current
    const current = currentRef.current
    if (!viewport || !current) return
    const top = current.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop
    const bottom = top + current.offsetHeight
    if (top < viewport.scrollTop) viewport.scrollTop = top
    else if (bottom > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = bottom - viewport.clientHeight
  }, [ply, moves.length])

  return (
    <ScrollArea h={height} type="auto" offsetScrollbars viewportRef={viewportRef}>
      {moves.map((node, i) => (
        <UnstyledButton
          key={i}
          ref={i === ply ? currentRef : undefined}
          onClick={() => onSelect(i)}
          display="block"
          w="100%"
          px="xs"
          py={4}
          bg={i === ply ? 'blue.1' : undefined}
          fz="sm"
        >
          {i > 0 && <span style={{ display: 'inline-block', width: '3em' }}>{i}</span>}
          {node.displayText}
        </UnstyledButton>
      ))}
    </ScrollArea>
  )
}
