import { motion } from 'framer-motion'
import { ExternalLink, Lock } from 'lucide-react'

export interface TimelineLink {
  label: string
  url: string
}

export interface TimelineEntry {
  key: string
  date?: string
  title: string
  subtitle?: string
  description?: string
  bullets?: string[]
  tags?: string[]
  links?: TimelineLink[]
  isPrivate?: boolean
}

export function Timeline({ items }: { items: TimelineEntry[] }) {
  return (
    <div className="relative">
      <div className="timeline-line hidden md:block" />
      <div className="space-y-12">
        {items.map(({ key, ...item }, index) => (
          <TimelineItem key={key} {...item} index={index} align={index % 2 === 0 ? 'left' : 'right'} />
        ))}
      </div>
    </div>
  )
}

function TimelineItem({
  date,
  title,
  subtitle,
  description,
  bullets,
  tags,
  links,
  isPrivate,
  index,
  align,
}: Omit<TimelineEntry, 'key'> & { index: number; align: 'left' | 'right' }) {
  const right = align === 'right'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.1 }}
      className={`relative flex gap-8 md:gap-12 ${right ? 'md:flex-row-reverse' : ''}`}
    >
      <div className="timeline-dot hidden md:block" />

      <div className={`min-w-0 flex-1 ${right ? 'md:text-right' : ''}`}>
        {date && (
          <div className="mb-2 inline-block rounded-lg border border-primary/20 bg-primary/10 px-3 py-1">
            <span className="text-sm font-medium text-primary">{date}</span>
          </div>
        )}

        <div
          data-peeker-hideout
          className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md"
        >
          <h3 className="heading-font mb-1 text-xl font-semibold text-card-foreground">{title}</h3>
          {subtitle && <p className="mb-3 text-sm font-medium text-muted-foreground/90">{subtitle}</p>}
          {description && <p className="mb-4 leading-relaxed whitespace-pre-line text-muted-foreground">{description}</p>}

          {!!bullets?.length && (
            <ul className={`mb-4 space-y-1.5 text-sm text-muted-foreground ${right ? 'md:ml-auto' : ''}`}>
              {bullets.map((b) => (
                <li key={b} className={`flex gap-2 ${right ? 'md:flex-row-reverse' : ''}`}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {!!tags?.length && (
            <div className={`mb-4 flex flex-wrap gap-2 ${right ? 'md:justify-end' : ''}`}>
              {tags.map((t) => (
                <span key={t} className="rounded-md border border-border/60 bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}

          {isPrivate && (
            <div className={`mb-4 flex items-center gap-2 text-sm text-muted-foreground/80 ${right ? 'md:justify-end' : ''}`}>
              <Lock className="h-4 w-4" />
              <span>Private/Client-Restricted</span>
            </div>
          )}

          {!!links?.length && (
            <div className={`flex flex-wrap gap-3 ${right ? 'md:justify-end' : ''}`}>
              {links.map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="pill-link">
                  <span>{link.label}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden flex-1 md:block" />
    </motion.div>
  )
}
