import { useSyncExternalStore } from 'react'
import { api, type AuthUser } from '../lib/api'

type AuthState = { status: 'loading'; user: null } | { status: 'ready'; user: AuthUser | null }

let state: AuthState = { status: 'loading', user: null }
const listeners = new Set<() => void>()

function emit(next: AuthState) {
  state = next
  listeners.forEach((listener) => listener())
}

export function setAuthUser(user: AuthUser | null) {
  emit({ status: 'ready', user })
}

export async function refreshAuth() {
  try {
    const data = await api<{ user: AuthUser | null }>('/api/me')
    emit({ status: 'ready', user: data.user })
  } catch {
    emit({ status: 'ready', user: null })
  }
}

export async function logout() {
  await api('/api/logout', { method: 'POST' })
  setAuthUser(null)
}

void refreshAuth()

export function useAuth() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    () => state,
  )
}
