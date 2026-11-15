import { existsSync, readFileSync } from 'node:fs'

/** 手元の .env を読む。既に環境変数がある値は上書きしない。Vercel 上では何もしない。 */
export function loadEnv(path = '.env') {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL が設定されていません。')
  return url
}

const exampleSessionSecret = 'change-me-to-a-long-random-string'

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32 || secret === exampleSessionSecret) {
    throw new Error('SESSION_SECRET は32文字以上のランダムな文字列にしてください。例の値は使えません。')
  }
  return secret
}
