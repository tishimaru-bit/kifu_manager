import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { exportKIF, type ImmutableRecord } from 'tsshogi'
import { api, type KifuList, type KifuRecord } from '../lib/api'
import { headerOf, kifDateToIso, moveCountOf } from '../lib/kifu'
import { refreshIntervalMs, type RefreshInterval } from './useRefreshInterval'

export const kifuListPerPage = 20

export function useKifuList(search: string, page: number) {
  return useQuery({
    queryKey: ['kifus', search, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (page > 1) params.set('page', String(page))
      const query = params.toString() ? `?${params}` : ''
      return api<KifuList>(`/api/kifus${query}`)
    },
    placeholderData: keepPreviousData,
  })
}

export function useKifu(id: string, interval: RefreshInterval) {
  return useQuery({
    queryKey: ['kifu', id],
    queryFn: () => fetchKifu(id),
    refetchInterval: refreshIntervalMs(interval),
  })
}

export async function fetchKifu(id: string) {
  const record = await api<KifuRecord>(`/api/kifus/${id}`)
  return { record, kifText: record.kif ?? '' }
}

export function deleteKifu(id: string) {
  return api(`/api/kifus/${id}`, { method: 'DELETE' })
}

/** 棋譜を KIF にして保存する。id が無ければ新規作成。title が空なら「先手 対 後手」にする */
export function saveKifu(id: string | undefined, record: ImmutableRecord, title: string) {
  const { sente, gote, event, startedAt } = headerOf(record)
  const data = {
    title: title.trim() || `${sente || '先手'} 対 ${gote || '後手'}`,
    sente,
    gote,
    event,
    played_at: kifDateToIso(startedAt),
    move_count: moveCountOf(record),
    kif: exportKIF(record),
  }
  return id
    ? api<KifuRecord>(`/api/kifus/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    : api<KifuRecord>('/api/kifus', { method: 'POST', body: JSON.stringify(data) })
}
