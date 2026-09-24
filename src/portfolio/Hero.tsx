import { motion } from 'framer-motion'
import { ArrowRight, CodeXml, FileText, Mail, MapPin } from 'lucide-react'
import type { Profile } from '../lib/types'
import { contactLinks, externalProps } from './contacts'

export default function Hero({ profile, projectsHref }: { profile: Profile; projectsHref?: string }) {
  const contacts = contactLinks(profile)
  const panel = [
    { icon: MapPin, label: 'Location', value: profile.location },
    { icon: CodeXml, label: 'Focus', value: profile.focus },
    { icon: Mail, label: 'Email', value: profile.email, href: profile.email && `mailto:${profile.email}` },
  ].filter((item) => item.value)

  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="relative z-10 mx-auto mt-16 w-full max-w-7xl px-4 py-20 sm:px-6 md:mt-0 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <h1 className="heading-font mb-6 text-5xl leading-tight font-bold text-foreground md:text-6xl lg:text-7xl">
              {profile.name}
            </h1>
            {profile.headline && (
              <p className="mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                {profile.headline}
              </p>
            )}

            {/* Contacts first, so they're visible without scrolling. */}
            {contacts.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-3">
                {contacts.map((c) => (
                  <a key={c.label} href={c.href} {...externalProps(c)} className="btn-secondary">
                    <c.icon className="h-5 w-5" />
                    <span>{c.label}</span>
                  </a>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {projectsHref && (
                <a href={projectsHref} className="btn-primary">
                  <span>View Projects</span>
                  <ArrowRight className="h-5 w-5" />
                </a>
              )}
              {profile.resumeUrl && (
                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  <FileText className="h-5 w-5" />
                  <span>Résumé</span>
                </a>
              )}
            </div>
          </motion.div>

          {panel.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-1"
            >
              {/* Home base for the peeking critters (see PeekerStage in Portfolio). */}
              <div data-peeker-hideout="home" className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                {panel.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{label}</p>
                      {href ? (
                        <a href={href} className="text-sm break-all text-card-foreground hover:text-primary">
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm leading-relaxed text-card-foreground">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
