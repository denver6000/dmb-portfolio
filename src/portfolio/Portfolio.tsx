import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import PeekerStage from '../components/peeker/Peeker'
import { clawd } from '../components/peeker/sprites/clawd'
import { codex } from '../components/peeker/sprites/codex'
import { getDemoContent, getProfile, getPublished } from '../lib/content'
import type { Profile, SectionEntries, SectionId } from '../lib/types'
import AchievementsPage, { type AchievementView } from './AchievementsPage'
import CertificationsPage from './CertificationsPage'
import ContactPage from './ContactPage'
import Header, { type MainPage } from './Header'
import ProjectGallery from './ProjectGallery'

type Content = { profile: Profile | null } & { [K in SectionId]: SectionEntries[K][] }
type Route = { page: MainPage; projectId?: string; achievementView?: AchievementView }
const pageTitles: Record<MainPage, string> = {
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Achievements',
  contact: 'Contact',
}

function routeFromHash(): Route {
  const hash = window.location.hash.slice(1)
  if (hash.startsWith('projects/')) {
    try {
      return { page: 'projects', projectId: decodeURIComponent(hash.slice('projects/'.length)) }
    } catch {
      return { page: 'projects' }
    }
  }
  if (hash.startsWith('achievements/')) {
    const view = hash.slice('achievements/'.length)
    if (['recognition', 'experience', 'education', 'skills'].includes(view)) {
      return { page: 'achievements', achievementView: view as AchievementView }
    }
  }
  if (hash === 'achievements') return { page: 'achievements' }
  if (hash === 'certifications') return { page: 'certifications' }
  // Keep links from the previous portfolio layout useful.
  if (['experience', 'education', 'skills'].includes(hash)) {
    return { page: 'achievements', achievementView: hash as AchievementView }
  }
  if (hash === 'competitions') {
    return { page: 'achievements', achievementView: 'recognition' }
  }
  if (hash === 'contact' || hash === 'hero') return { page: 'contact' }
  return { page: 'projects' }
}

export default function Portfolio() {
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [route, setRoute] = useState<Route>(routeFromHash)
  const reduceMotion = !!useReducedMotion()

  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) {
      getDemoContent().then(setContent).catch((e) => setError(String(e.message ?? e)))
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
      })
      .catch((e) => setError(String(e.message ?? e)))
  }, [])

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route])

  useEffect(() => {
    if (content?.profile) document.title = pageTitles[route.page] + ' — ' + content.profile.name
  }, [content, route.page])

  if (error) return <FullScreenMessage>Couldn't load the portfolio. Please try again later.</FullScreenMessage>
  if (!content) return <FullScreenMessage><span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></FullScreenMessage>
  if (!content.profile) return <FullScreenMessage>Portfolio coming soon.</FullScreenMessage>

  const { profile, projects, competitions, certifications, experience, education, skills } = content
  const viewKey = route.page === 'projects'
    ? 'projects/' + (route.projectId ?? '')
    : route.page === 'achievements'
      ? 'achievements/' + (route.achievementView ?? '')
      : route.page

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header name={profile.name} activePage={route.page} />
      <main className="min-h-[calc(100vh-140px)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewKey}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          >
            {route.page === 'projects' && <ProjectGallery projects={projects} selectedId={route.projectId} />}
            {route.page === 'achievements' && (
              <AchievementsPage
                view={route.achievementView}
                competitions={competitions}
                experience={experience}
                education={education}
                skills={skills}
              />
            )}
            {route.page === 'certifications' && <CertificationsPage certifications={certifications} />}
            {route.page === 'contact' && <ContactPage profile={profile} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {profile.name}
      </footer>
      <PeekerStage
        key={viewKey}
        critters={[clawd, codex]}
        viewportTop={112}
        zIndex={40}
        slapSelector="a:not([data-page-link]), button:not([data-page-link]), [data-peeker-slap]"
      />
    </div>
  )
}

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-muted-foreground">
      {children}
    </div>
  )
}
