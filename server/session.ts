import { createHmac, timingSafeEqual } from 'node:crypto'
import { sessionSecret } from './env.ts'

const cookieName = 'session'
const maxAgeSec = 14 * 24 * 60 * 60

export interface SessionClaims {
  sub: string
  sid: string
}

export function createSession(userId: string, sessionId: string): string {
  const body = Buffer.from(JSON.stringify({ sub: userId, sid: sessionId, exp: Date.now() + maxAgeSec * 1000 })).toString('base64url')
  return `${body}.${sign(body)}`
}

/** 署名と期限が有効ならユーザーIDとセッションIDを返す。行の有無は見ない。 */
export function readSession(cookieHeader: string | undefined): SessionClaims | null {
  const token = cookieValue(cookieHeader, cookieName)
  if (!token) return null
  const dot = token.indexOf('.')
  if (dot < 0) return null
  const body = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  const expected = sign(body)
  const actualBuf = Buffer.from(mac)
  const expectedBuf = Buffer.from(expected)
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString()) as { sub?: unknown; sid?: unknown; exp?: unknown }
    if (typeof data.sub !== 'string' || typeof data.sid !== 'string' || typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return { sub: data.sub, sid: data.sid }
  } catch {
    return null
  }
}

export function sessionCookie(token: string): string {
  return `${cookieName}=${token}; HttpOnly; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secureFlag()}`
}

export function clearSessionCookie(): string {
  return `${cookieName}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secureFlag()}`
}

function sign(body: string): string {
  return createHmac('sha256', sessionSecret()).update(body).digest('base64url')
}

function secureFlag(): string {
  return process.env.VERCEL === '1' ? '; Secure' : ''
}

function cookieValue(header: string | undefined, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim()
  }
  return null
}
