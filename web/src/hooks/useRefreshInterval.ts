import { useState } from 'react'

export type RefreshInterval = '10s' | '30s' | 'off'

const storageKey = 'kifu-refresh'

export function refreshIntervalMs(interval: RefreshInterval): number | false {
  if (interval === '10s') return 10_000
  if (interval === '30s') return 30_000
  return false
}

export function useRefreshInterval() {
  const [interval, setInterval] = useState<RefreshInterval>(() => {
    const saved = localStorage.getItem(storageKey)
    return saved === '10s' || saved === '30s' || saved === 'off' ? saved : '10s'
  })

  const update = (next: RefreshInterval) => {
    localStorage.setItem(storageKey, next)
    setInterval(next)
  }

  return [interval, update] as const
}
