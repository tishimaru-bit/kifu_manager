import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Result } from './routes.ts'

export type VercelRequest = IncomingMessage & {
  query: Record<string, string | string[]>
  cookies: Record<string, string>
  body: unknown
}

export type VercelResponse = ServerResponse & {
  send: (body: unknown) => VercelResponse
  json: (jsonBody: unknown) => VercelResponse
  status: (statusCode: number) => VercelResponse
  redirect: (statusOrUrl: string | number, url?: string) => VercelResponse
}

export function send(res: VercelResponse, result: Result) {
  if (result.setCookie) res.setHeader('Set-Cookie', result.setCookie)
  res.status(result.status).json(result.body)
}

export function cookieOf(req: VercelRequest): string | undefined {
  const cookie = req.headers.cookie
  return Array.isArray(cookie) ? cookie.join('; ') : cookie
}

/** Vercel が付ける接続元。x-forwarded-for の先頭はクライアントが付けられるので使わない。 */
export function clientIp(req: VercelRequest): string {
  const raw = req.headers['x-real-ip']
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value?.trim()) return value.trim().slice(0, 64)
  return req.socket.remoteAddress ?? 'unknown'
}
