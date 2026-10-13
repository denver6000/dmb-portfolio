import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, GitFork } from 'lucide-react'
import { SERIES, findPost, formatPostDate, postHref, postsInSeries, type Post, type Series } from '../blog/posts'
import { renderPost, type TocEntry } from '../blog/render'

export default function BlogPage({ seriesId, slug }: { seriesId?: string; slug?: string }) {
  const series = SERIES.find((s) => s.id === seriesId)
  const post = series && findPost(series.id, slug)
  if (series && post) return <DocsLayout key={postHref(post)} series={series} post={post} />
  return <BlogIndex />
}

function BlogIndex() {
  const series = SERIES.filter((s) => postsInSeries(s.id).length > 0)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className="mb-10 border-b border-border pb-8">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-primary uppercase">Writing</p>
        <h1 className="heading-font text-5xl font-semibold tracking-tight sm:text-7xl">Blog</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">Build notes and documentation for the projects, written as series you can read start to finish.</p>
      </div>

      {series.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="grid gap-12">
          {series.map((s) => {
            const posts = postsInSeries(s.id)
            return (
              <section key={s.id} aria-labelledby={`series-${s.id}`} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Series · {posts.length} {posts.length === 1 ? 'part' : 'parts'}</p>
                  <h2 id={`series-${s.id}`} className="heading-font mt-2 text-3xl font-semibold">
                    <a href={postHref(posts[0])} data-page-link className="hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{s.title}</a>
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{s.summary}</p>
                  <a href={postHref(posts[0])} data-page-link className="pill-link mt-6">Start reading<ArrowRight className="h-3.5 w-3.5" /></a>
                </div>
                <ol className="divide-y divide-border border-y border-border">
                  {posts.map((post, i) => (
                    <li key={post.slug}>
                      <a href={postHref(post)} data-page-link className="group flex gap-4 py-4 focus-visible:outline-2 focus-visible:outline-primary">
                        <span className="heading-font w-6 shrink-0 pt-0.5 text-sm text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold group-hover:text-primary">
                            {post.title}
                            {post.draft && <DraftBadge />}
                          </span>
                          {post.summary && <span className="mt-1 block text-sm text-muted-foreground">{post.summary}</span>}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DocsLayout({ series, post }: { series: Series; post: Post }) {
  const posts = postsInSeries(series.id)
  const index = posts.indexOf(post)
  const prev = posts[index - 1]
  const next = posts[index + 1]
  const { html, toc } = useMemo(() => renderPost(post.body), [post.body])
  const single = posts.length === 1

  return (
    <>
    <ReadingProgress />
    <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[220px_minmax(0,1fr)_200px]">
      <aside className="hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        <SeriesNav series={series} posts={posts} current={post} />
      </aside>

      <article className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <a href="#blog" data-page-link className="hover:text-primary">Blog</a>
          <span aria-hidden="true">/</span>
          <span className="truncate">{series.title}</span>
        </nav>

        {!single && <details className="group mb-8 rounded-xl border border-border bg-card lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
            <span>Part {index + 1} of {posts.length}</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-border px-4 py-4">
            <SeriesNav series={series} posts={posts} current={post} />
          </div>
        </details>}

        <header className="mb-10 border-b border-border pb-8">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">{series.title}{!single && ` · Part ${index + 1}`}</p>
          <h1 className="heading-font mt-3 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            {post.title}
            {post.draft && <DraftBadge />}
          </h1>
          {post.summary && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.summary}</p>}
          <p className="mt-5 text-sm text-muted-foreground">
            {post.date && <><time dateTime={post.date}>{formatPostDate(post.date)}</time><span aria-hidden="true"> · </span></>}
            {post.minutes} min read
          </p>
          {post.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
              {post.tags.map((tag) => <li key={tag} className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">{tag}</li>)}
            </ul>
          )}
        </header>

        <div className="doc-prose" onClick={onProseClick} onMouseOver={onProseHover} onMouseOut={onProseHover} dangerouslySetInnerHTML={{ __html: html }} />

        {(prev || next) && <nav aria-label="Series navigation" className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
          {prev ? <PagerLink post={prev} direction="prev" /> : <span className="hidden sm:block" />}
          {next && <PagerLink post={next} direction="next" />}
        </nav>}
      </article>

      {toc.length > 0 && (
        <aside className="hidden xl:block xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:self-start xl:overflow-y-auto">
          <OnThisPage toc={toc} />
        </aside>
      )}
    </div>
    </>
  )
}

function SeriesNav({ series, posts, current }: { series: Series; posts: Post[]; current: Post }) {
  return (
    <nav aria-label={`${series.title} series`}>
      <p className="heading-font mb-3 text-sm font-semibold">{series.title}</p>
      <ol className="space-y-0.5 border-l border-border">
        {posts.map((post, i) => {
          const active = post === current
          return (
            <li key={post.slug}>
              <a
                href={postHref(post)}
                data-page-link
                aria-current={active ? 'page' : undefined}
                className={`-ml-px flex gap-2 border-l-2 py-1.5 pl-3 pr-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${active ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}
              >
                <span className="w-5 shrink-0 text-xs leading-5 text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                <span>{post.title}</span>
              </a>
            </li>
          )
        })}
      </ol>
      {(series.repoUrl || series.docsUrl) && (
        <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          {series.repoUrl && <a href={series.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><GitFork className="h-4 w-4" />Source code</a>}
          {series.docsUrl && <a href={series.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary"><BookOpen className="h-4 w-4" />Reference docs</a>}
        </div>
      )}
    </nav>
  )
}

// Buttons rather than #anchors: the hash is the page route.
function OnThisPage({ toc }: { toc: TocEntry[] }) {
  const [activeId, setActiveId] = useState(toc[0]?.id)

  useEffect(() => {
    const headings = toc.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => !!el)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-120px 0px -65% 0px' },
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [toc])

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-xs font-bold tracking-[0.15em] text-muted-foreground uppercase">On this page</p>
      <ul className="space-y-1 text-sm">
        {toc.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              data-page-link
              onClick={() => {
                document.getElementById(entry.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setActiveId(entry.id)
              }}
              className={`block w-full py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary ${entry.depth === 3 ? 'pl-3' : ''} ${activeId === entry.id ? 'font-medium text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {entry.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function PagerLink({ post, direction }: { post: Post; direction: 'prev' | 'next' }) {
  const next = direction === 'next'
  return (
    <a href={postHref(post)} data-page-link className={`group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary ${next ? 'text-right sm:col-start-2' : ''}`}>
      <span className={`flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase ${next ? 'justify-end' : ''}`}>
        {!next && <ArrowLeft className="h-3.5 w-3.5" />}
        {next ? 'Next' : 'Previous'}
        {next && <ArrowRight className="h-3.5 w-3.5" />}
      </span>
      <span className="mt-1 block font-semibold group-hover:text-primary">{post.title}</span>
    </a>
  )
}

// Copy buttons in code blocks (rendered as HTML by src/blog/render.ts).
function onProseClick(event: MouseEvent<HTMLDivElement>) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]')
  const block = button?.closest('.code-block')
  if (!button || !block) return
  const lines = [...block.querySelectorAll('.lc, .tree-name')].map((el) => el.textContent ?? '')
  navigator.clipboard?.writeText(lines.join('\n')).then(() => {
    button.textContent = 'Copied'
    setTimeout(() => { button.textContent = 'Copy' }, 1500)
  }).catch(() => {})
}

// Hovering an item in a `::: notes` list lights up its marker in the code block above.
function onProseHover(event: MouseEvent<HTMLDivElement>) {
  const item = (event.target as HTMLElement).closest('.code-notes li')
  if (!item) return
  const notes = item.closest('.code-notes')!
  const n = String([...item.parentElement!.children].indexOf(item) + 1)
  let block = notes.previousElementSibling
  while (block && !block.classList.contains('code-block')) block = block.previousElementSibling
  block?.querySelectorAll<HTMLElement>(`.code-marker[data-note="${n}"]`).forEach((m) => m.classList.toggle('is-active', event.type === 'mouseover'))
}

function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return <div ref={bar} aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 bg-primary" />
}

function DraftBadge() {
  return <span className="ml-2 inline-block rounded-full border border-dashed border-primary/50 px-2 py-0.5 align-middle font-sans text-xs font-medium tracking-normal text-primary">Draft</span>
}
