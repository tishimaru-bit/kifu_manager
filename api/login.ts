import { login } from '../server/routes.ts'
import { clientIp, send, type VercelRequest, type VercelResponse } from '../server/vercel.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    send(res, await login(req.method ?? 'GET', req.body, clientIp(req)))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'サーバでエラーが発生しました。' })
  }
}
