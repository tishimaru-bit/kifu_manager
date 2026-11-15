import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import license from 'rollup-plugin-license'
import { defineConfig } from 'vite'

const webRoot = fileURLToPath(new URL('.', import.meta.url))
// 開発サーバは Vite がインラインの更新スクリプトを出す。公開時の script-src は vercel.json で 'self' のまま。
const contentSecurityPolicy =
  "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'"

// https://vite.dev/config/
export default defineConfig({
  root: webRoot,
  plugins: [
    react(),
    license({
      thirdParty: {
        includePrivate: false,
        output: {
          file: fileURLToPath(new URL('./dist/third-party-licenses.txt', import.meta.url)),
          template: (deps) =>
            deps
              .map((d) => `${d.name}@${d.version}\nLicense: ${d.license}\n\n${d.licenseText ?? ''}`.trim())
              .join(`\n\n${'-'.repeat(72)}\n\n`),
        },
      },
    }),
  ],
  server: {
    host: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': contentSecurityPolicy,
    },
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
