import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, GitFork, Globe2, ImageOff, LockKeyhole } from 'lucide-react'
import { PROJECT_TYPES, PROJECT_TYPE_LABELS, type Project, type ProjectType } from '../lib/types'

type Filter = 'all' | ProjectType
const cardTypeLabels: Record<ProjectType, string> = {
  websites: 'Website',
  'android-app': 'Android App',
  games: 'Game',
  'ai-integrations': 'AI Integration',
  misc: 'Misc',
}

export default function ProjectGallery({
  projects,
  selectedId,
}: {
  projects: Project[]
  selectedId?: string
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const selected = projects.find((project) => project.id === selectedId)

  if (selected) return <ProjectDetail key={selected.id} project={selected} />

  const ordered = [...projects].sort((a, b) =>
    PROJECT_TYPES.indexOf(a.projectType ?? 'misc') - PROJECT_TYPES.indexOf(b.projectType ?? 'misc') ||
    Number(Boolean(b.screenshots?.length)) - Number(Boolean(a.screenshots?.length)) ||
    a.order - b.order,
  )
  const visible = filter === 'all' ? ordered : ordered.filter((project) => (project.projectType ?? 'misc') === filter)
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: projects.length },
    ...PROJECT_TYPES.map((type) => ({
      value: type,
      label: PROJECT_TYPE_LABELS[type],
      count: projects.filter((project) => (project.projectType ?? 'misc') === type).length,
    })),
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className="mb-10 flex items-end justify-between gap-4 border-b border-border pb-8">
        <div>
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-primary uppercase">Selected work</p>
          <h1 className="heading-font text-5xl font-semibold tracking-tight sm:text-7xl">Projects<span className="ml-3 align-top text-base font-medium text-muted-foreground">{projects.length.toString().padStart(2, '0')}</span></h1>
        </div>
      </div>

      <div className="hide-scrollbar mb-10 flex gap-6 overflow-x-auto border-b border-border pb-0 sm:flex-wrap sm:overflow-visible" role="group" aria-label="Filter projects by type">
          {filters.map(({ value, label, count }) => (
            <button
              key={value}
              type="button"
              data-page-link
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                filter === value
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              <span className="text-xs text-muted-foreground">{count}</span>
            </button>
          ))}
      </div>

      {visible.length === 0 ? (
        <div className="border-b border-border px-6 py-16 text-center">
          <p className="heading-font text-xl font-semibold">No projects in {filter === 'all' ? 'the gallery' : PROJECT_TYPE_LABELS[filter]} yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Choose another category to keep browsing.</p>
        </div>
      ) : <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
        {visible.map((project) => (
          <article key={project.id} data-peeker-hideout className="group flex min-w-0 flex-col">
            <a href={`#projects/${encodeURIComponent(project.id)}`} data-page-link aria-label={`View ${project.title}`} className="block overflow-hidden border border-border focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary">
              <PreviewImage project={project} />
            </a>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <span className="text-primary">{cardTypeLabels[project.projectType ?? 'misc']}</span>
              {project.period && <><span aria-hidden="true">/</span><span>{project.period}</span></>}
            </div>
            <h2 className="heading-font mt-2 text-2xl font-semibold leading-snug sm:text-3xl">
              <a href={`#projects/${encodeURIComponent(project.id)}`} data-page-link className="inline-flex items-start gap-2 text-foreground hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                {project.title}<ArrowRight aria-hidden="true" className="mt-2 h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
              </a>
            </h2>
            {project.collaboratorName && (
              <p className="mt-2 text-sm text-muted-foreground">
                Development partner:{' '}
                {project.collaboratorUrl ? (
                  <a href={project.collaboratorUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4 hover:text-foreground">{project.collaboratorName}</a>
                ) : <span className="font-medium text-foreground">{project.collaboratorName}</span>}
              </p>
            )}
            {(project.repoUrl || project.liveUrl || project.promoUrl || project.docsUrl) && <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-4 text-sm" aria-label={`${project.title} links`}>
              {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary"><GitFork aria-hidden="true" className="h-4 w-4" />GitHub</a>}
              {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary"><Globe2 aria-hidden="true" className="h-4 w-4" />Live Site</a>}
              {project.promoUrl && <a href={project.promoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary"><Globe2 aria-hidden="true" className="h-4 w-4" />Promotional Site</a>}
              {project.docsUrl && <a href={project.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary"><BookOpen aria-hidden="true" className="h-4 w-4" />Documentation</a>}
            </div>}
          </article>
        ))}
      </div>}
    </div>
  )
}

function PreviewImage({ project }: { project: Project }) {
  const [failed, setFailed] = useState(false)
  const src = project.screenshots?.[0]

  return (
    <div className="relative flex aspect-[16/10] items-center justify-center bg-muted/60">
      {src && !failed ? (
        <img src={src} alt={`Preview of ${project.title}`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]" />
      ) : (
        <span className="text-sm font-medium tracking-wide text-muted-foreground">Preview not available</span>
      )}
    </div>
  )
}

function ProjectDetail({ project }: { project: Project }) {
  const [imageIndex, setImageIndex] = useState(0)
  const screenshots = project.screenshots ?? []
  const links = [
    project.liveUrl && { label: 'Open app', url: project.liveUrl },
    project.promoUrl && { label: 'Promotional site', url: project.promoUrl },
    project.docsUrl && { label: 'Documentation', url: project.docsUrl },
    project.repoUrl && { label: 'Source code', url: project.repoUrl },
  ].filter((link): link is { label: string; url: string } => Boolean(link))

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <a href="#projects" data-page-link className="mb-8 inline-flex items-center gap-2 rounded-lg py-2 text-sm font-medium text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
        <ArrowLeft className="h-4 w-4" /> Back to gallery
      </a>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="min-w-0">
          <ProjectImage key={screenshots[imageIndex] ?? 'preview'} project={project} src={screenshots[imageIndex]} hideout className="aspect-[4/3] w-full rounded-2xl border border-border sm:aspect-[16/10]" />
          {screenshots.length > 1 && (
            <>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Screenshot {imageIndex + 1} of {screenshots.length}</span>
                <div className="flex gap-2">
                  <button type="button" data-page-link onClick={() => setImageIndex((index) => (index - 1 + screenshots.length) % screenshots.length)} aria-label="Previous screenshot" className="gallery-arrow"><ArrowLeft className="h-4 w-4" /></button>
                  <button type="button" data-page-link onClick={() => setImageIndex((index) => (index + 1) % screenshots.length)} aria-label="Next screenshot" className="gallery-arrow"><ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2" aria-label="Project screenshots">
                {screenshots.map((src, index) => (
                  <button key={`${src}-${index}`} type="button" data-page-link onClick={() => setImageIndex(index)} aria-label={`Show screenshot ${index + 1}`} aria-pressed={imageIndex === index} className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 bg-muted focus-visible:outline-2 focus-visible:outline-primary ${imageIndex === index ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border border-border bg-card px-3 py-1">{PROJECT_TYPE_LABELS[project.projectType ?? 'misc']}</span>
            {project.period && <span>{project.period}</span>}
          </div>
          <h1 className="heading-font text-3xl leading-tight font-bold sm:text-4xl">{project.title}</h1>
          <p className="mt-5 text-base leading-relaxed text-foreground/90">{project.summary}</p>
          {project.collaboratorName && (
            <p className="mt-4 text-sm text-muted-foreground">
              Developed in partnership with{' '}
              {project.collaboratorUrl ? (
                <a href={project.collaboratorUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4 hover:text-foreground">{project.collaboratorName}</a>
              ) : <span className="font-medium text-foreground">{project.collaboratorName}</span>}
            </p>
          )}
          {project.description && <div className="mt-6 border-t border-border pt-6 text-sm leading-7 whitespace-pre-line text-muted-foreground">{project.description}</div>}
          {project.private && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4" /> Private or client-restricted work</p>
          )}
          {!!project.tags?.length && (
            <div className="mt-6 flex flex-wrap gap-2">
              {project.tags.map((tag) => <span key={tag} className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">{tag}</span>)}
            </div>
          )}
          {links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
              {links.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="pill-link">{link.label}<ExternalLink className="h-3.5 w-3.5" /></a>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectImage({ project, src, hideout, className }: { project: Project; src?: string; hideout?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false)
  const image = src ?? project.screenshots?.[0]
  return (
    <div data-peeker-hideout={hideout ? '' : undefined} className={`relative flex items-center justify-center overflow-hidden ${className ?? ''}`}>
      {image && !failed ? (
        <img src={image} alt={`Screenshot of ${project.title}`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
          <ImageOff aria-hidden="true" className="h-7 w-7" />
          <p className="text-sm">Preview not available</p>
        </div>
      )}
    </div>
  )
}
