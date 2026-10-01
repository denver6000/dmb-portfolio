import { Award, Briefcase, CodeXml, GraduationCap, Trophy } from 'lucide-react'
import { formatMonthRange, formatYearRange } from '../lib/format'
import type { Competition, Education, Experience, SkillGroup } from '../lib/types'

export type AchievementView = 'recognition' | 'experience' | 'education' | 'skills'

const viewLabels: Record<AchievementView, string> = {
  recognition: 'Recognition',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
}

export default function AchievementsPage({
  view,
  competitions,
  experience,
  education,
  skills,
}: {
  view?: AchievementView
  competitions: Competition[]
  experience: Experience[]
  education: Education[]
  skills: SkillGroup[]
}) {
  const available: AchievementView[] = [
    ...(competitions.length ? ['recognition' as const] : []),
    ...(experience.length ? ['experience' as const] : []),
    ...(education.length ? ['education' as const] : []),
    ...(skills.length ? ['skills' as const] : []),
  ]
  const active = view && available.includes(view) ? view : available[0]
  const specialAwards = competitions.filter((item) => item.event.toLowerCase().includes('special award'))
  const otherAwards = competitions.filter((item) => !item.event.toLowerCase().includes('special award'))

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className="mb-10 border-b border-border pb-8">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-primary uppercase">The person behind the work</p>
        <h1 className="heading-font text-5xl font-semibold tracking-tight sm:text-7xl">Achievements</h1>
      </div>

      {available.length > 1 && (
        <nav aria-label="Achievement sections" className="hide-scrollbar mb-12 flex gap-6 overflow-x-auto border-b border-border sm:flex-wrap sm:overflow-visible">
          {available.map((item) => (
            <a
              key={item}
              href={`#achievements/${item}`}
              data-page-link
              aria-current={active === item ? 'page' : undefined}
              className={`shrink-0 border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active === item ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {viewLabels[item]}
            </a>
          ))}
        </nav>
      )}

      {!active && <p className="border-t border-border py-8 text-muted-foreground">Achievements will appear here when they are published.</p>}

      {active === 'recognition' && (
        <div className="space-y-14">
          {specialAwards.length > 0 && <RecognitionList title="Special awards" items={specialAwards} />}
          {otherAwards.length > 0 && <RecognitionList title="Awards & competitions" items={otherAwards} />}
        </div>
      )}

      {active === 'experience' && (
        <section>
          <SectionLabel icon={Briefcase} title="Work experience" count={experience.length} />
          <div className="border-t border-border">
            {experience.map((item) => (
              <article key={item.id} data-peeker-hideout className="grid gap-3 border-b border-border py-7 sm:grid-cols-[180px_1fr] sm:gap-8">
                <p className="text-sm font-medium text-primary">{formatMonthRange(item.startDate, item.endDate)}</p>
                <div>
                  <h3 className="heading-font text-2xl font-semibold">{item.role}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{[item.company, item.location].filter(Boolean).join(' · ')}</p>
                  {item.description && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
                  {!!item.highlights?.length && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">{item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>}
                  {!!item.tags?.length && <TagList items={item.tags} />}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {active === 'education' && (
        <section>
          <SectionLabel icon={GraduationCap} title="Education" count={education.length} />
          <div className="border-t border-border">
            {education.map((item) => (
              <article key={item.id} data-peeker-hideout className="grid gap-3 border-b border-border py-7 sm:grid-cols-[180px_1fr] sm:gap-8">
                <p className="text-sm font-medium text-primary">{formatYearRange(item.startYear, item.endYear)}</p>
                <div>
                  <h3 className="heading-font text-2xl font-semibold">{item.degree}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{[item.school, item.location].filter(Boolean).join(' · ')}</p>
                  {item.fieldOfStudy && <p className="mt-4 text-sm text-foreground/80">{item.fieldOfStudy}</p>}
                  {item.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
                  {!!item.highlights?.length && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">{item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {active === 'skills' && (
        <section>
          <SectionLabel icon={CodeXml} title="Skills & tools" count={skills.length} />
          <div className="border-t border-border">
            {skills.map((group) => (
              <article key={group.id} data-peeker-hideout className="grid gap-3 border-b border-border py-7 sm:grid-cols-[180px_1fr] sm:gap-8">
                <h3 className="heading-font text-xl font-semibold">{group.category}</h3>
                <TagList items={group.items} />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function RecognitionList({ title, items }: { title: string; items: Competition[] }) {
  return (
    <section>
      <SectionLabel icon={Trophy} title={title} count={items.length} />
      <div className="border-t border-border">
        {items.map((item) => (
          <article key={item.id} data-peeker-hideout className="grid gap-3 border-b border-border py-7 sm:grid-cols-[180px_1fr] sm:gap-8">
            <p className="text-sm font-medium text-primary">{item.endYear && item.endYear !== item.startYear ? `${item.startYear}–${item.endYear}` : item.startYear}</p>
            <div>
              <h3 className="heading-font text-2xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.event.replace(/ · Special Award$/, '')}</p>
              {item.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
              {item.linkUrl && <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">View achievement ↗</a>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function SectionLabel({ icon: Icon, title, count }: { icon: typeof Award; title: string; count: number }) {
  return <div className="mb-6 flex items-baseline gap-3"><Icon className="h-5 w-5 self-center text-primary" /><h2 className="heading-font text-2xl font-semibold">{title}</h2><span className="text-sm text-muted-foreground">{count}</span></div>
}

function TagList({ items }: { items: string[] }) {
  return <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">{items.map((item) => <span key={item}>{item}</span>)}</div>
}
