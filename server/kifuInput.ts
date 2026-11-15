const maxKifBytes = 1_048_576

export interface KifuInput {
  title: string
  sente: string
  gote: string
  event: string
  playedAt: string | null
  moveCount: number
  kif: string
}

export function parseKifuInput(body: unknown): { ok: true; value: KifuInput } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') return { ok: false, message: '入力が正しくありません。' }
  const raw = body as Record<string, unknown>
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title || title.length > 200) return { ok: false, message: 'タイトルは1〜200文字にしてください。' }
  const sente = textField(raw.sente, 100, '先手')
  if (typeof sente !== 'string') return sente
  const gote = textField(raw.gote, 100, '後手')
  if (typeof gote !== 'string') return gote
  const event = textField(raw.event, 200, '棋戦')
  if (typeof event !== 'string') return event
  const playedAt = playedAtOf(raw.played_at)
  if (typeof playedAt !== 'string' && playedAt !== null) return playedAt
  if (typeof raw.move_count !== 'number' || !Number.isInteger(raw.move_count) || raw.move_count < 0) {
    return { ok: false, message: '手数が正しくありません。' }
  }
  if (typeof raw.kif !== 'string' || Buffer.byteLength(raw.kif, 'utf8') > maxKifBytes) {
    return { ok: false, message: 'KIF は1MB以下のテキストにしてください。' }
  }
  return { ok: true, value: { title, sente, gote, event, playedAt, moveCount: raw.move_count, kif: raw.kif } }
}

function textField(value: unknown, max: number, label: string): string | { ok: false; message: string } {
  if (typeof value !== 'string' || value.length > max) return { ok: false, message: `${label}は${max}文字以内にしてください。` }
  return value
}

function playedAtOf(value: unknown): string | null | { ok: false; message: string } {
  if (value == null || value === '') return null
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return { ok: false, message: '開始日時が正しくありません。' }
  }
  return new Date(value).toISOString()
}
