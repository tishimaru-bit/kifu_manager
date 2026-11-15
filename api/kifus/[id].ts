import { deleteKifu, getKifu, updateKifu } from '../../server/routes.ts'
import { cookieOf, send, type VercelRequest, type VercelResponse } from '../../server/vercel.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = String(req.query.id ?? '')
    const method = req.method ?? 'GET'
    if (method === 'GET') {
      send(res, await getKifu(method, id))
      return
    }
    if (method === 'DELETE') {
      send(res, await deleteKifu(method, id, cookieOf(req)))
      return
    }
    send(res, await updateKifu(method, id, req.body, cookieOf(req)))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'サーバでエラーが発生しました。' })
  }
}
