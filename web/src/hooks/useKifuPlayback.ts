import { useCallback, useEffect, useState } from 'react'

const playIntervalMs = 1000

/**
 * 表示画面の連続再生。1手につき1秒で進み、最終手で止まる。
 * スライダーや棋譜リストなど、手を自分で動かすときは seek を使う。
 */
export function useKifuPlayback(ply: number, length: number, goto: (ply: number) => void) {
  const [requested, setRequested] = useState(false)
  const playing = requested && ply < length

  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => {
      const next = ply + 1
      if (next >= length) setRequested(false)
      goto(next)
    }, playIntervalMs)
    return () => window.clearTimeout(id)
  }, [playing, ply, length, goto])

  const seek = useCallback(
    (next: number) => {
      setRequested(false)
      goto(next)
    },
    [goto],
  )

  const toggle = useCallback(() => {
    if (playing) {
      setRequested(false)
      return
    }
    if (length === 0) return
    // 最終手では初期局面に戻してから、同じ間隔で再生する
    if (ply >= length) goto(0)
    setRequested(true)
  }, [playing, ply, length, goto])

  return { playing, toggle, seek }
}
