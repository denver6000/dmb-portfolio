import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export function FadeIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeading({ title, eyebrow, icon: Icon }: { title: string; eyebrow?: string; icon?: LucideIcon }) {
  return (
    <FadeIn className="mb-16 text-center">
      {eyebrow && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <span className="text-sm font-semibold tracking-wider text-primary uppercase">{eyebrow}</span>
        </div>
      )}
      <h2 className="heading-font mb-4 text-4xl leading-tight font-bold text-foreground md:text-5xl">{title}</h2>
    </FadeIn>
  )
}

// Alternating section backgrounds, as in the concept.
export function Section({ id, muted, children }: { id: string; muted?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={`py-20 ${muted ? 'bg-muted/30' : 'bg-background'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}
