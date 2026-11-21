import { iso, isoOrNull, sql } from './db.ts'
import { hashPassword, verifyPassword } from './password.ts'
import { parseKifuInput } from './kifuInput.ts'
import { clearSessionCookie, createSession, readSession, sessionCookie } from './session.ts'

const perPage = 20
const maxPasswordLength = 128
const maxAttemptsPerEmail = 8
const maxAttemptsPerIp = 30
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const unknownUserHash = hashPassword('kifu-manager-unknown-user')

export interface Result {
  status: number
  body: unknown
  setCookie?: string
}

interface KifuRow {
  id: string
  title: string
  sente: string
  gote: string
  event: string
  played_at: unknown
  move_count: number
  kif?: string
  owner: string
  created: unknown
  updated: unknown
}

export async function login(method: string, body: unknown, ip: string): Promise<Result> {
  if (method !== 'POST') return methodNotAllowed()
  const email = emailOf(body)
  const password = typeof (body as { password?: unknown } | null)?.password === 'string' ? (body as { password: string }).password : ''
  if (!email || !password) return { status: 400, body: { message: 'メールアドレスとパスワードを入力してください。' } }
  if (password.length > maxPasswordLength) return { status: 400, body: { message: 'パスワードは128文字以内にしてください。' } }

  const address = ip.trim().slice(0, 64) || 'unknown'
  const db = sql()
  const counts = await db`
    SELECT
      (SELECT count(*) FROM login_attempts WHERE email = ${email} AND created > now() - interval '15 minutes') AS by_email,
      (SELECT count(*) FROM login_attempts WHERE ip = ${address} AND created > now() - interval '15 minutes') AS by_ip
  `
  const byEmail = Number((counts[0] as { by_email: number }).by_email)
  const byIp = Number((counts[0] as { by_ip: number }).by_ip)
  if (byEmail >= maxAttemptsPerEmail || byIp >= maxAttemptsPerIp) {
    return { status: 429, body: { message: '試行回数が多すぎます。しばらくしてからもう一度お試しください。' } }
  }

  const rows = await db`SELECT id, password_hash FROM users WHERE email = ${email} LIMIT 1`
  const user = rows[0] as { id: string; password_hash: string } | undefined
  const hash = user?.password_hash ?? (await unknownUserHash)
  const matched = await verifyPassword(password, hash)
  if (!user || !matched) {
    await db`INSERT INTO login_attempts (email, ip) VALUES (${email}, ${address})`
    return { status: 401, body: { message: 'メールアドレスまたはパスワードが正しくありません。' } }
  }
  await db`DELETE FROM login_attempts WHERE email = ${email}`
  const created = await db`
    INSERT INTO sessions (user_id, expires)
    VALUES (${user.id}, now() + interval '14 days')
    RETURNING id
  `
  const sid = (created[0] as { id: string }).id
  return { status: 200, body: { id: user.id, email }, setCookie: sessionCookie(createSession(user.id, sid)) }
}

export async function logout(method: string, cookie: string | undefined): Promise<Result> {
  if (method !== 'POST') return methodNotAllowed()
  const session = readSession(cookie)
  if (session && uuidPattern.test(session.sid)) await sql()`DELETE FROM sessions WHERE id = ${session.sid}`
  return { status: 200, body: {}, setCookie: clearSessionCookie() }
}

export async function me(method: string, cookie: string | undefined): Promise<Result> {
  if (method !== 'GET') return methodNotAllowed()
  const userId = await userIdOf(cookie)
  if (!userId) return { status: 200, body: { user: null } }
  const db = sql()
  const rows = await db`SELECT id, email FROM users WHERE id = ${userId} LIMIT 1`
  const user = rows[0] as { id: string; email: string } | undefined
  return { status: 200, body: { user: user ?? null } }
}

export async function listKifus(method: string, searchParams: URLSearchParams): Promise<Result> {
  if (method !== 'GET') return methodNotAllowed()
  const q = (searchParams.get('q') ?? '').trim()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const db = sql()
  const countRows = q
    ? await db`SELECT count(*) AS count FROM kifus WHERE strpos(lower(title), lower(${q})) > 0 OR strpos(lower(sente), lower(${q})) > 0 OR strpos(lower(gote), lower(${q})) > 0`
    : await db`SELECT count(*) AS count FROM kifus`
  const totalItems = Number((countRows[0] as { count: number }).count)
  const offset = (page - 1) * perPage
  const rows = q
    ? await db`SELECT id, title, sente, gote, event, played_at, move_count, owner, created, updated FROM kifus WHERE strpos(lower(title), lower(${q})) > 0 OR strpos(lower(sente), lower(${q})) > 0 OR strpos(lower(gote), lower(${q})) > 0 ORDER BY updated DESC LIMIT ${perPage} OFFSET ${offset}`
    : await db`SELECT id, title, sente, gote, event, played_at, move_count, owner, created, updated FROM kifus ORDER BY updated DESC LIMIT ${perPage} OFFSET ${offset}`
  return {
    status: 200,
    body: {
      page,
      perPage,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / perPage),
      items: (rows as KifuRow[]).map((row) => kifuJson(row)),
    },
  }
}

export async function createKifu(method: string, body: unknown, cookie: string | undefined): Promise<Result> {
  if (method !== 'POST') return methodNotAllowed()
  const userId = await userIdOf(cookie)
  if (!userId) return unauthorized()
  const parsed = parseKifuInput(body)
  if (!parsed.ok) return { status: 400, body: { message: parsed.message } }
  const input = parsed.value
  const db = sql()
  const rows = await db`
    INSERT INTO kifus (title, sente, gote, event, played_at, move_count, kif, owner)
    VALUES (${input.title}, ${input.sente}, ${input.gote}, ${input.event}, ${input.playedAt}, ${input.moveCount}, ${input.kif}, ${userId})
    RETURNING id, title, sente, gote, event, played_at, move_count, kif, owner, created, updated
  `
  return { status: 201, body: kifuJson(rows[0] as KifuRow, true) }
}

export async function getKifu(method: string, id: string): Promise<Result> {
  if (method !== 'GET') return methodNotAllowed()
  if (!uuidPattern.test(id)) return notFound()
  const db = sql()
  const rows = await db`
    SELECT id, title, sente, gote, event, played_at, move_count, kif, owner, created, updated
    FROM kifus WHERE id = ${id} LIMIT 1
  `
  const row = rows[0] as KifuRow | undefined
  if (!row) return notFound()
  return { status: 200, body: kifuJson(row, true) }
}

export async function updateKifu(method: string, id: string, body: unknown, cookie: string | undefined): Promise<Result> {
  if (method !== 'PATCH') return methodNotAllowed()
  if (!uuidPattern.test(id)) return notFound()
  const userId = await userIdOf(cookie)
  if (!userId) return unauthorized()
  const parsed = parseKifuInput(body)
  if (!parsed.ok) return { status: 400, body: { message: parsed.message } }
  const db = sql()
  const current = await db`SELECT owner FROM kifus WHERE id = ${id} LIMIT 1`
  const row = current[0] as { owner: string } | undefined
  if (!row) return notFound()
  if (row.owner !== userId) return { status: 403, body: { message: '作成者だけが編集できます。' } }
  const input = parsed.value
  const rows = await db`
    UPDATE kifus
    SET title = ${input.title}, sente = ${input.sente}, gote = ${input.gote}, event = ${input.event},
        played_at = ${input.playedAt}, move_count = ${input.moveCount}, kif = ${input.kif}, updated = now()
    WHERE id = ${id} AND owner = ${userId}
    RETURNING id, title, sente, gote, event, played_at, move_count, kif, owner, created, updated
  `
  return { status: 200, body: kifuJson(rows[0] as KifuRow, true) }
}

export async function deleteKifu(method: string, id: string, cookie: string | undefined): Promise<Result> {
  if (method !== 'DELETE') return methodNotAllowed()
  if (!uuidPattern.test(id)) return notFound()
  const userId = await userIdOf(cookie)
  if (!userId) return unauthorized()
  const db = sql()
  const current = await db`SELECT owner FROM kifus WHERE id = ${id} LIMIT 1`
  const row = current[0] as { owner: string } | undefined
  if (!row) return notFound()
  if (row.owner !== userId) return { status: 403, body: { message: '作成者だけが削除できます。' } }
  await db`DELETE FROM kifus WHERE id = ${id} AND owner = ${userId}`
  return { status: 200, body: {} }
}

function kifuJson(row: KifuRow, withKif = false) {
  return {
    id: row.id,
    title: row.title,
    sente: row.sente,
    gote: row.gote,
    event: row.event,
    played_at: isoOrNull(row.played_at),
    move_count: row.move_count,
    ...(withKif ? { kif: row.kif ?? '' } : {}),
    owner: row.owner,
    created: iso(row.created),
    updated: iso(row.updated),
  }
}

async function userIdOf(cookie: string | undefined): Promise<string | null> {
  const session = readSession(cookie)
  if (!session || !uuidPattern.test(session.sid) || !uuidPattern.test(session.sub)) return null
  const db = sql()
  const rows = await db`
    SELECT user_id FROM sessions
    WHERE id = ${session.sid} AND user_id = ${session.sub} AND expires > now()
    LIMIT 1
  `
  return rows[0] ? session.sub : null
}

function emailOf(body: unknown): string {
  if (!body || typeof body !== 'object' || typeof (body as { email?: unknown }).email !== 'string') return ''
  return (body as { email: string }).email.trim().toLowerCase()
}

function unauthorized(): Result {
  return { status: 401, body: { message: 'ログインが必要です。' } }
}

function notFound(): Result {
  return { status: 404, body: { message: '棋譜が見つかりません。' } }
}

function methodNotAllowed(): Result {
  return { status: 405, body: { message: 'この操作はできません。' } }
}
