import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import { Lexer, Marked, type Tokens, type TokenizerAndRendererExtension } from 'marked'

// Markdown -> HTML for blog posts, with a few extras on top of GitHub-flavoured Markdown.
//
// Code fences take options after the language:
//
//   ```ts title="src/registry.ts" start=23 {2,5-7}
//   const contexts = new Map()  // [!1]
//   ```
//
//   title=   file name shown in the header
//   start=   first line number (match the real file)
//   {..}     lines to highlight, using the displayed numbers
//   // [!n]  (or # [!n]) at the end of a line: numbered marker, explained by a
//            `::: notes` list right after the block
//
// Special fence languages: `terminal` (lines starting with "$ " are commands,
// the rest output) and `tree` (indented file tree; trailing "/" = folder,
// "*" prefix = emphasised, "# text" = comment).
//
// Blocks fenced with ::: (no nesting):
//
//   ::: note Optional title      also: tip, warning, verified
//   ::: notes                    ordered list explaining the [!n] markers above it
//   ::: diagram <name>           inlines src/blog/diagrams/<name>.svg; the body is the caption

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)

const LANG_LABELS: Record<string, string> = {
  ts: 'TypeScript', typescript: 'TypeScript', tsx: 'TSX', js: 'JavaScript', javascript: 'JavaScript',
  bash: 'Bash', sh: 'Shell', shell: 'Shell', json: 'JSON', terminal: 'Terminal', tree: 'Files', text: 'Text',
}

const diagrams = import.meta.glob('./diagrams/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export interface TocEntry {
  id: string
  text: string
  depth: 2 | 3
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function slugify(text: string): string {
  return text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&\w+;/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'section'
}

interface FenceMeta {
  lang: string
  title?: string
  start: number
  highlight: Set<number>
}

function parseFenceMeta(info = ''): FenceMeta {
  const lang = (/^\S*/.exec(info)?.[0] ?? '').toLowerCase()
  const title = /title="([^"]*)"/.exec(info)?.[1]
  const start = Number(/start=(\d+)/.exec(info)?.[1] ?? 1)
  const highlight = new Set<number>()
  for (const part of /\{([\d,\s-]+)\}/.exec(info)?.[1].split(',') ?? []) {
    const [a, b = a] = part.trim().split('-').map(Number)
    for (let n = a; n <= b; n++) highlight.add(n)
  }
  return { lang, title, start, highlight }
}

// highlight.js output can open a span on one line and close it on another
// (block comments, template strings). Close and reopen spans at each line break
// so every line is self-contained.
function splitHighlightedLines(html: string): string[] {
  const lines: string[] = []
  const open: string[] = []
  let current = ''
  for (const [, openTag, closeTag, newline, text] of html.matchAll(/(<span[^>]*>)|(<\/span>)|(\n)|([^<\n]+)/g)) {
    if (openTag) { current += openTag; open.push(openTag) }
    else if (closeTag) { current += closeTag; open.pop() }
    else if (newline) { lines.push(current + '</span>'.repeat(open.length)); current = open.join('') }
    else current += text
  }
  lines.push(current)
  return lines
}

function codeShell(meta: FenceMeta, kind: string, body: string): string {
  const label = LANG_LABELS[meta.lang] ?? meta.lang
  const title = meta.title ?? (kind === 'terminal' ? 'Terminal' : '')
  return `<figure class="code-block code-${kind}">
<figcaption class="code-head"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="code-title">${escapeHtml(title)}</span>${label ? `<span class="code-lang">${escapeHtml(label)}</span>` : ''}<button type="button" class="code-copy" data-copy data-page-link aria-label="Copy code">Copy</button></figcaption>
<pre><code>${body}</code></pre>
</figure>\n`
}

function renderCode(text: string, info?: string): string {
  const meta = parseFenceMeta(info)
  if (meta.lang === 'tree') return renderTree(text, meta)

  const raw = text.replace(/\n$/, '').split('\n')
  const markers = new Map<number, string>()
  const stripped = raw.map((line, i) => {
    const m = /\s*(?:\/\/|#)\s*\[!(\d+)\]\s*$/.exec(line)
    if (!m) return line
    markers.set(i, m[1])
    return line.slice(0, m.index)
  })

  let lines: string[]
  if (meta.lang === 'terminal') {
    lines = stripped.map((line) => line.startsWith('$ ')
      ? `<span class="term-prompt">$</span> <span class="term-cmd">${escapeHtml(line.slice(2))}</span>`
      : `<span class="term-out">${escapeHtml(line)}</span>`)
  } else {
    const lang = hljs.getLanguage(meta.lang) ? meta.lang : undefined
    const highlighted = lang ? hljs.highlight(stripped.join('\n'), { language: lang }).value : escapeHtml(stripped.join('\n'))
    lines = splitHighlightedLines(highlighted)
  }

  const numbered = meta.lang !== 'terminal' && meta.lang !== 'text'
  const body = lines.map((html, i) => {
    const n = meta.start + i
    const marker = markers.get(i)
    return `<span class="code-line${meta.highlight.has(n) ? ' is-hl' : ''}">` +
      (numbered ? `<span class="ln" aria-hidden="true">${n}</span>` : '') +
      `<span class="lc">${html || ' '}</span>` +
      (marker ? `<span class="code-marker" data-note="${marker}" aria-label="Note ${marker}">${marker}</span>` : '') +
      '</span>'
  }).join('')
  return codeShell(meta, meta.lang === 'terminal' ? 'terminal' : 'source', body)
}

const FOLDER_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 3.5h4l1.5 1.5h7.5v8h-13z"/></svg>'
const FILE_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.5h6l3 3v10h-9z M9.5 1.5v3h3"/></svg>'

function renderTree(text: string, meta: FenceMeta): string {
  const rows = text.replace(/\n$/, '').split('\n').filter((l) => l.trim()).map((line) => {
    const depth = Math.floor((/^ */.exec(line)?.[0].length ?? 0) / 2)
    let [name, ...comment] = line.trim().split(/\s+#\s*/)
    const emphasised = name.startsWith('*')
    if (emphasised) name = name.slice(1)
    const folder = name.endsWith('/')
    return `<li class="tree-row${emphasised ? ' is-hl' : ''}" style="--depth:${depth}">` +
      `<span class="tree-icon ${folder ? 'is-folder' : ''}">${folder ? FOLDER_ICON : FILE_ICON}</span>` +
      `<span class="tree-name">${escapeHtml(name)}</span>` +
      (comment.length ? `<span class="tree-comment">${escapeHtml(comment.join(' # '))}</span>` : '') +
      '</li>'
  }).join('')
  return `<figure class="code-block code-tree"><figcaption class="code-head"><span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="code-title">${escapeHtml(meta.title ?? 'Project layout')}</span></figcaption><ul class="tree">${rows}</ul></figure>\n`
}

interface DirectiveToken extends Tokens.Generic {
  kind: string
  arg: string
  body: string
  tokens: Tokens.Generic[]
}

const CALLOUT_TITLES: Record<string, string> = { note: 'Note', tip: 'Tip', warning: 'Heads up', verified: 'Verified' }

const directive: TokenizerAndRendererExtension = {
  name: 'directive',
  level: 'block',
  start: (src) => /^:::/m.exec(src)?.index,
  tokenizer(src) {
    const m = /^:::[ \t]*(\w+)[ \t]*([^\n]*)\n([\s\S]*?)\n:::[ \t]*(?:\n+|$)/.exec(src)
    if (!m) return undefined
    const token: DirectiveToken = { type: 'directive', raw: m[0], kind: m[1], arg: m[2].trim(), body: m[3], tokens: [] }
    if (token.kind !== 'diagram') this.lexer.blockTokens(token.body, token.tokens)
    return token
  },
  renderer(generic) {
    const token = generic as DirectiveToken
    if (token.kind === 'diagram') {
      const svg = diagrams[`./diagrams/${token.arg}.svg`]
      if (!svg) return `<p class="doc-error">Missing diagram: ${escapeHtml(token.arg)}</p>`
      const caption = token.body.trim()
      return `<figure class="doc-diagram"><div class="diagram-scroll">${svg}</div>${caption ? `<figcaption>${this.parser.parseInline(Lexer.lexInline(caption))}</figcaption>` : ''}</figure>\n`
    }
    const inner = this.parser.parse(token.tokens)
    if (token.kind === 'notes') return `<div class="code-notes">${inner}</div>\n`
    const title = token.arg || CALLOUT_TITLES[token.kind] || token.kind
    return `<aside class="callout callout-${escapeHtml(token.kind)}"><p class="callout-title">${escapeHtml(title)}</p>${inner}</aside>\n`
  },
}

// Renders a post body and collects its h2/h3 headings for "On this page".
// Heading ids are prefixed so they can't collide with the hash router.
export function renderPost(body: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = []
  const used = new Map<string, number>()
  const marked = new Marked({
    gfm: true,
    extensions: [directive],
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const base = 'h-' + slugify(text)
        const n = used.get(base) ?? 0
        used.set(base, n + 1)
        const id = n ? `${base}-${n}` : base
        const inner = this.parser.parseInline(tokens)
        if (depth === 2 || depth === 3) toc.push({ id, text: inner.replace(/<[^>]+>/g, ''), depth })
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`
      },
      link({ href, title, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens)
        const external = /^https?:\/\//.test(href)
        const attrs = [
          `href="${href}"`,
          title ? `title="${title}"` : '',
          external ? 'target="_blank" rel="noopener noreferrer"' : 'data-page-link',
        ].filter(Boolean).join(' ')
        return `<a ${attrs}>${inner}</a>`
      },
      code({ text, lang }: Tokens.Code) {
        return renderCode(text, lang)
      },
    },
  })
  return { html: marked.parse(body, { async: false }), toc }
}
