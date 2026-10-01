import { Award, BadgeCheck, FolderKanban, Mail } from 'lucide-react'

export type MainPage = 'projects' | 'certifications' | 'achievements' | 'contact'

const links = [
  { id: 'projects', label: 'Projects', href: '#projects', icon: FolderKanban },
  { id: 'certifications', label: 'Certifications', href: '#certifications', icon: BadgeCheck },
  { id: 'achievements', label: 'Achievements', href: '#achievements', icon: Award },
  { id: 'contact', label: 'Contact', href: '#contact', icon: Mail },
] as const

export default function Header({ name, activePage }: { name: string; activePage: MainPage }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <a href="#projects" data-page-link aria-label={name + ' — Projects'} className="group inline-flex min-w-0 items-center gap-3 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <img src="/profile.jpg" alt="" width="36" height="36" className="h-9 w-9 shrink-0 rounded-full border border-border object-cover" />
          <span className="heading-font hidden truncate text-base font-semibold text-foreground group-hover:text-primary lg:block">{name}</span>
          <span className="heading-font truncate text-base font-semibold text-foreground lg:hidden">DMB</span>
        </a>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 sm:flex">
          {links.map(({ id, label, href, icon: Icon }) => (
            <a
              key={id}
              href={href}
              data-page-link
              aria-current={activePage === id ? 'page' : undefined}
              className={`inline-flex h-16 items-center gap-2 border-b-2 px-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:px-4 ${activePage === id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="hidden h-4 w-4 md:block" />
              {label}
            </a>
          ))}
        </nav>
      </div>
      <nav aria-label="Main navigation" className="grid grid-cols-4 border-t border-border px-1 sm:hidden">
        {links.map(({ id, label, href }) => (
          <a
            key={id}
            href={href}
            data-page-link
            aria-current={activePage === id ? 'page' : undefined}
            className={`relative flex min-h-12 items-center justify-center px-0.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${activePage === id ? 'text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  )
}
