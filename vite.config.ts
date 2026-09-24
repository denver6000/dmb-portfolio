import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Two pages: the public portfolio (/) and the hidden admin (/login/).
// Building /login as its own index.html means static hosts serve it
// without any rewrite rules.

// Apache/LiteSpeed redirect /login -> /login/ automatically; do the same in dev.
const loginSlashRedirect: Plugin = {
  name: 'login-slash-redirect',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/login' || req.url?.startsWith('/login?')) {
        res.statusCode = 301
        res.setHeader('Location', req.url.replace('/login', '/login/'))
        return res.end()
      }
      next()
    })
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), loginSlashRedirect],
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'login/index.html'),
      },
    },
  },
})
