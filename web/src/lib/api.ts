export interface KifuRecord {
  id: string
  title: string
  sente: string
  gote: string
  event: string
  played_at: string | null
  move_count: number
  kif?: string
  owner: string
  created: string
  updated: string
}

export interface KifuList {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  items: KifuRecord[]
}

export interface AuthUser {
  id: string
  email: string
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const body = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) throw new Error(body.message || `リクエストに失敗しました (${res.status})`)
  return body as T
}
