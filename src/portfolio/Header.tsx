import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { externalProps, type ContactLink } from './contacts'

export interface NavLink {
  label: string
  href: string
}

export default function Header({ name, links, contacts }: { name: string; links: NavLink[]; contacts: ContactLink[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || isOpen ? 'border-b border-border bg-background/95 shadow-sm backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <a href="#hero" className="heading-font truncate text-xl font-bold text-foreground">
            {name}
          </a>

          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 xl:flex">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Contact icons stay in the header so they're always one click away. */}
            {contacts.length > 0 && (
              <div className="hidden items-center gap-0.5 sm:flex xl:ml-2 xl:border-l xl:border-border xl:pl-3">
                {contacts.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    {...externalProps(c)}
                    aria-label={c.label}
                    title={c.label}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    <c.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground xl:hidden"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 overflow-hidden px-4 pb-4 xl:hidden"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            {contacts.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border px-2 pt-3 sm:hidden">
                {contacts.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    {...externalProps(c)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <c.icon className="h-4 w-4" />
                    {c.label}
                  </a>
                ))}
              </div>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
