import { readFileSync } from 'node:fs'
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

// Blog posts marked `draft: true` are hidden in production (src/blog/posts.ts);
// blank them here too so their text never ships in the bundle.
const stripBlogDrafts: Plugin = {
  name: 'strip-blog-drafts',
  apply: 'build',
  enforce: 'pre',
  load(id) {
    const [file, query] = id.split('?')
    if (!file.includes('/src/blog/posts/') || !file.endsWith('.md') || query !== 'raw') return
    const raw = readFileSync(file, 'utf-8')
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)?.[1] ?? ''
    if (/^draft:\s*true\b/m.test(frontmatter)) return 'export default ' + JSON.stringify('---\ndraft: true\n---\n')
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), loginSlashRedirect, stripBlogDrafts],
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'login/index.html'),
      },
    },
  },
})
