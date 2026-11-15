import { createServer } from 'node:http'
import { loadEnv } from './env.ts'
import { createKifu, deleteKifu, getKifu, listKifus, login, logout, me, updateKifu, type Result } from './routes.ts'

loadEnv()

const port = 3001

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
    const body = await readBody(req)
    const result = await dispatch(req.method ?? 'GET', url, body, req.headers.cookie, req.socket.remoteAddress ?? 'unknown')
    if (result.setCookie) res.setHeader('Set-Cookie', result.setCookie)
    res.statusCode = result.status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(result.body))
  } catch (err) {
    console.error(err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ message: 'サーバでエラーが発生しました。' }))
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`API http://127.0.0.1:${port}`)
})

async function dispatch(method: string, url: URL, body: unknown, cookie: string | undefined, ip: string): Promise<Result> {
  if (url.pathname === '/api/login') return login(method, body, ip)
  if (url.pathname === '/api/logout') return logout(method, cookie)
  if (url.pathname === '/api/me') return me(method, cookie)
  if (url.pathname === '/api/kifus') {
    return method === 'GET' ? listKifus(method, url.searchParams) : createKifu(method, body, cookie)
  }
  const match = /^\/api\/kifus\/([^/]+)$/.exec(url.pathname)
  if (match) {
    const id = decodeURIComponent(match[1])
    if (method === 'GET') return getKifu(method, id)
    if (method === 'DELETE') return deleteKifu(method, id, cookie)
    return updateKifu(method, id, body, cookie)
  }
  return { status: 404, body: { message: '見つかりません。' } }
}

function readBody(req: import('node:http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (!text) {
        resolve(undefined)
        return
      }
      try {
        resolve(JSON.parse(text))
      } catch {
        reject(new Error('JSON を読めません。'))
      }
    })
    req.on('error', reject)
  })
}
