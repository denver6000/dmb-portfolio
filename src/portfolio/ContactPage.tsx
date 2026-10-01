import { ArrowUpRight, FileText, Mail, MapPin, Sparkles } from 'lucide-react'
import type { Profile } from '../lib/types'
import { contactLinks, externalProps } from './contacts'

export default function ContactPage({ profile }: { profile: Profile }) {
  const links = contactLinks(profile).filter((link) => link.label !== 'Gmail')

  return (
    <div className="mx-auto grid min-h-[calc(100vh-180px)] max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-20 lg:px-8">
      <div>
        <img src="/profile.jpg" alt={`Portrait of ${profile.name}`} width="104" height="104" className="mb-8 h-26 w-26 rounded-full border-2 border-primary/40 object-cover shadow-lg shadow-primary/10" />
        <p className="mb-4 text-xs font-bold tracking-[0.2em] text-primary uppercase">Contact</p>
        <h1 className="heading-font max-w-2xl text-5xl leading-[1.05] font-bold tracking-tight sm:text-7xl">
          Let’s build something useful.
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Get in touch about an app, a game, a web project, or a collaboration.
        </p>
        <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          {profile.location && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{profile.location}</span>}
          {profile.focus && <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />{profile.focus}</span>}
        </div>
      </div>

      <div className="space-y-4">
        {profile.email && (
          <a href={`mailto:${profile.email}`} data-peeker-hideout="home" className="group block rounded-3xl border border-primary/35 bg-card p-7 shadow-xl shadow-primary/5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Mail className="h-6 w-6" /></div>
              <ArrowUpRight className="h-5 w-5 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-9 text-sm font-medium text-muted-foreground">Email me</p>
            <p className="heading-font mt-2 break-all text-xl font-semibold text-foreground sm:text-2xl">{profile.email}</p>
          </a>
        )}

        {links.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <a key={link.label} href={link.href} {...externalProps(link)} data-peeker-hideout={!profile.email && link === links[0] ? 'home' : ''} className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <span className="flex items-center gap-3 font-semibold"><link.icon className="h-5 w-5 text-primary" />{link.label}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </a>
            ))}
          </div>
        )}

        {profile.resumeUrl && (
          <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <span className="flex items-center gap-3 font-semibold"><FileText className="h-5 w-5 text-primary" />Résumé</span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </a>
        )}
      </div>
    </div>
  )
}
