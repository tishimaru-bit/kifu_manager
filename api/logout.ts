import { logout } from '../server/routes.ts'
import { cookieOf, send, type VercelRequest, type VercelResponse } from '../server/vercel.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    send(res, await logout(req.method ?? 'GET', cookieOf(req)))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'サーバでエラーが発生しました。' })
  }
}
