import { createKifu, listKifus } from '../../server/routes.ts'
import { cookieOf, send, type VercelRequest, type VercelResponse } from '../../server/vercel.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const method = req.method ?? 'GET'
    if (method === 'GET') {
      const url = new URL(req.url ?? '/api/kifus', 'http://localhost')
      send(res, await listKifus(method, url.searchParams))
      return
    }
    send(res, await createKifu(method, req.body, cookieOf(req)))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'サーバでエラーが発生しました。' })
  }
}
