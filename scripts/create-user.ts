import { sql } from '../server/db.ts'
import { loadEnv } from '../server/env.ts'
import { hashPassword } from '../server/password.ts'

loadEnv()

const [emailArg, password] = process.argv.slice(2)
const email = emailArg?.trim().toLowerCase() ?? ''

if (!email.includes('@') || !password || password.length < 8) {
  console.error('使い方: npm run create-user -- <email> <password>')
  console.error('パスワードは8文字以上にしてください。')
  process.exit(1)
}

const passwordHash = await hashPassword(password)
const db = sql()
const rows = await db`
  INSERT INTO users (email, password_hash)
  VALUES (${email}, ${passwordHash})
  RETURNING id, email
`
const user = rows[0] as { id: string; email: string }
console.log(`作成しました: ${user.email} (${user.id})`)
