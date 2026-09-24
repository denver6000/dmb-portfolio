import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Award, Briefcase, CodeXml, FolderGit2, GraduationCap, Trophy } from 'lucide-react'
import PeekerStage from '../components/peeker/Peeker'
import { clawd } from '../components/peeker/sprites/clawd'
import { codex } from '../components/peeker/sprites/codex'
import { getDemoContent, getProfile, getPublished } from '../lib/content'
import { formatMonth, formatMonthRange, formatYearRange } from '../lib/format'
import type { Profile, Project, SectionEntries, SectionId, SkillGroup } from '../lib/types'
import { contactLinks } from './contacts'
import Header, { type NavLink } from './Header'
import Hero from './Hero'
import { Timeline, type TimelineEntry } from './TimelineItem'
import { Section, SectionHeading } from './ui'

type Content = { profile: Profile | null } & { [K in SectionId]: SectionEntries[K][] }

export default function Portfolio() {
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) {
      getDemoContent().then(setContent)
      return
    }
    Promise.all([
      getProfile(),
      getPublished('skills'),
      getPublished('projects'),
      getPublished('experience'),
      getPublished('education'),
      getPublished('competitions'),
      getPublished('certifications'),
    ])
      .then(([profile, skills, projects, experience, education, competitions, certifications]) => {
        setContent({ profile, skills, projects, experience, education, competitions, certifications })
        if (profile?.name) document.title = `${profile.name} - Developer Portfolio`
      })
      .catch((e) => setError(String(e.message ?? e)))
  }, [])

  // Sections render after the data loads, so the browser's own jump to a
  // #section link on page load has already missed. Redo it once rendered.
  useEffect(() => {
    if (!content || !location.hash) return
    requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' }))
  }, [content])

  if (error)
    return <FullScreenMessage>Couldn't load the portfolio. Please try again later.</FullScreenMessage>
  if (!content)
    return (
      <FullScreenMessage>
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </FullScreenMessage>
    )
  if (!content.profile)
    return <FullScreenMessage>Portfolio coming soon.</FullScreenMessage>

  const { profile, skills, projects, experience, education, competitions, certifications } = content
  const featured = projects.filter((p) => p.category === 'featured')
  const personal = projects.filter((p) => p.category === 'personal')
  const projectsHref = featured.length ? '#projects' : personal.length ? '#personal-projects' : undefined

  // Same order as the sections below; empty sections are hidden.
  const nav: NavLink[] = [
    skills.length && { label: 'Skills', href: '#skills' },
    projectsHref && { label: 'Projects', href: projectsHref },
    experience.length && { label: 'Experience', href: '#experience' },
    education.length && { label: 'Education', href: '#education' },
    competitions.length && { label: 'Competitions', href: '#competitions' },
    certifications.length && { label: 'Certifications', href: '#certifications' },
  ].filter(Boolean) as NavLink[]

  // Alternate section backgrounds in render order, like the concept.
  let sectionIndex = 0
  const muted = () => sectionIndex++ % 2 === 1

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header name={profile.name} links={nav} contacts={contactLinks(profile)} />
      <main>
        <Hero profile={profile} projectsHref={projectsHref} />

        {skills.length > 0 && (
          <Section id="skills" muted={muted()}>
            <SectionHeading eyebrow="Technical Skills" icon={CodeXml} title="Skills" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {skills.map((group, index) => (
                <SkillCard key={group.id} group={group} index={index} />
              ))}
            </div>
          </Section>
        )}

        {featured.length > 0 && (
          <Section id="projects" muted={muted()}>
            <SectionHeading eyebrow="Portfolio" icon={FolderGit2} title="Featured projects" />
            <Timeline items={featured.map(projectEntry)} />
          </Section>
        )}

        {personal.length > 0 && (
          <Section id="personal-projects" muted={muted()}>
            <SectionHeading title="Personal projects" />
            <Timeline items={personal.map(projectEntry)} />
          </Section>
        )}

        {experience.length > 0 && (
          <Section id="experience" muted={muted()}>
            <SectionHeading eyebrow="Career" icon={Briefcase} title="Work experience" />
            <Timeline
              items={experience.map((x) => ({
                key: x.id,
                date: formatMonthRange(x.startDate, x.endDate),
                title: x.role,
                subtitle: join(x.company, capitalize(x.employmentType.replace('-', ' ')), x.location),
                description: x.description,
                bullets: x.highlights,
                tags: x.tags,
              }))}
            />
          </Section>
        )}

        {education.length > 0 && (
          <Section id="education" muted={muted()}>
            <SectionHeading eyebrow="Academic Background" icon={GraduationCap} title="Education" />
            <Timeline
              items={education.map((e) => ({
                key: e.id,
                date: formatYearRange(e.startYear, e.endYear),
                title: e.fieldOfStudy ? `${e.degree}, ${e.fieldOfStudy}` : e.degree,
                subtitle: join(e.school, e.location),
                description: e.description,
                bullets: e.highlights,
              }))}
            />
          </Section>
        )}

        {competitions.length > 0 && (
          <Section id="competitions" muted={muted()}>
            <SectionHeading eyebrow="Awards" icon={Trophy} title="Competitions" />
            <Timeline
              items={competitions.map((c) => ({
                key: c.id,
                date: c.endYear && c.endYear !== c.startYear ? `${c.startYear}–${c.endYear}` : String(c.startYear),
                title: c.title,
                subtitle: c.event,
                description: c.description,
                links: c.linkUrl ? [{ label: 'View', url: c.linkUrl }] : [],
              }))}
            />
          </Section>
        )}

        {certifications.length > 0 && (
          <Section id="certifications" muted={muted()}>
            <SectionHeading eyebrow="Credentials" icon={Award} title="Certifications" />
            <Timeline
              items={certifications.map((c) => ({
                key: c.id,
                date: formatMonth(c.issueDate),
                title: c.name,
                subtitle: c.issuer,
                description: [
                  c.expiryDate && `Expires ${formatMonth(c.expiryDate)}`,
                  c.credentialId && `Credential ID: ${c.credentialId}`,
                ]
                  .filter(Boolean)
                  .join('\n'),
                links: c.credentialUrl ? [{ label: 'View credential', url: c.credentialUrl }] : [],
              }))}
            />
          </Section>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {profile.name}
      </footer>

      {/* Shy critters: peek from [data-peeker-hideout] cards in view, slap clicked links/buttons.
          See src/components/peeker/HANDOFF.md. */}
      <PeekerStage critters={[clawd, codex]} viewportTop={64} />
    </div>
  )
}

function projectEntry(p: Project): TimelineEntry {
  const links = [
    p.liveUrl && { label: 'Live Site', url: p.liveUrl },
    p.docsUrl && { label: 'Docs', url: p.docsUrl },
    p.repoUrl && { label: 'GitHub', url: p.repoUrl },
  ].filter(Boolean) as TimelineEntry['links']
  return {
    key: p.id,
    date: p.period,
    title: p.title,
    description: p.description ? `${p.summary}\n\n${p.description}` : p.summary,
    tags: p.tags,
    links,
    isPrivate: p.private,
  }
}

function SkillCard({ group, index }: { group: SkillGroup; index: number }) {
  return (
    <motion.div
      data-peeker-hideout
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.1 }}
      className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      <h3 className="heading-font mb-4 text-xl font-semibold text-card-foreground">{group.category}</h3>
      <div className="space-y-2">
        {group.items.map((skill) => (
          <div
            key={skill}
            className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground"
          >
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{skill}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-muted-foreground">
      {children}
    </div>
  )
}

function join(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(' · ')
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
