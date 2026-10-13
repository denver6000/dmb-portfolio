// Blog posts are Markdown files bundled at build time, one folder per series:
//
//   src/blog/posts/<series-id>/<NN>-<slug>.md
//
// The NN- prefix sets the reading order within the series and is dropped from
// the URL (#blog/<series-id>/<slug>). Each file starts with frontmatter:
//
//   ---
//   title: Post title
//   summary: One or two sentences shown on the index and under the title.
//   date: 2026-10-13
//   tags: MCP, Playwright   # optional, comma-separated
//   draft: true            # optional; drafts only appear under `npm run dev`
//   ---
//
// Series titles, summaries and links live in SERIES below. A folder without
// a SERIES entry is ignored. Markdown extensions (code blocks, callouts,
// diagrams) are documented in render.ts.

export interface Series {
  id: string
  title: string
  summary: string
  repoUrl?: string
  docsUrl?: string
}

export interface Post {
  series: string
  slug: string
  order: number
  title: string
  summary?: string
  date?: string // YYYY-MM-DD
  tags: string[]
  draft: boolean
  body: string
  minutes: number
}

export const SERIES: Series[] = [
  {
    id: 'multi-role-browser',
    title: 'Multi-Role Browser',
    summary: 'Orchestrating several logged-in browser identities from one AI agent: isolated contexts, a shared Chromium, and checking what each role can and cannot do.',
    repoUrl: 'https://github.com/denver6000/denver6000-multi-role-browser',
    docsUrl: 'https://github.com/denver6000/denver6000-multi-role-browser#readme',
  },
]

const files = import.meta.glob('./posts/*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { data: {}, body: raw }
  const data: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).replace(/\s+#.*$/, '').trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return { data, body: raw.slice(match[0].length) }
}

const allPosts: Post[] = Object.entries(files)
  .map(([path, raw]) => {
    const [, series, file] = /\.\/posts\/([^/]+)\/(.+)\.md$/.exec(path)!
    const [, prefix, slug] = /^(?:(\d+)-)?(.+)$/.exec(file)!
    const { data, body } = parseFrontmatter(raw.replace(/\r\n/g, '\n'))
    return {
      series,
      slug,
      order: prefix ? Number(prefix) : Number.MAX_SAFE_INTEGER,
      title: data.title || slug,
      summary: data.summary || undefined,
      date: data.date || undefined,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      draft: data.draft === 'true',
      body,
      minutes: Math.max(1, Math.round(body.split(/\s+/).length / 200)),
    }
  })
  .filter((post) => SERIES.some((s) => s.id === post.series) && (import.meta.env.DEV || !post.draft))
  .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))

export function postsInSeries(seriesId: string): Post[] {
  return allPosts.filter((post) => post.series === seriesId)
}

export function findPost(seriesId: string, slug?: string): Post | undefined {
  const posts = postsInSeries(seriesId)
  return slug ? posts.find((post) => post.slug === slug) : posts[0]
}

export function postHref(post: Pick<Post, 'series' | 'slug'>): string {
  return `#blog/${post.series}/${post.slug}`
}

const dateFmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function formatPostDate(date: string): string {
  const parsed = new Date(date + 'T00:00:00Z')
  return Number.isNaN(parsed.getTime()) ? date : dateFmt.format(parsed)
}
