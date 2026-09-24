import type { ComponentType, SVGProps } from 'react'
import { Mail } from 'lucide-react'
import type { Profile } from '../lib/types'
import { FacebookIcon, GithubIcon, LinkedinIcon } from './icons'

export interface ContactLink {
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  external: boolean
}

// The contact channels set in the profile, in display order.
export function contactLinks(profile: Profile): ContactLink[] {
  const links: (ContactLink | null)[] = [
    profile.githubUrl ? { label: 'GitHub', href: profile.githubUrl, icon: GithubIcon, external: true } : null,
    profile.linkedinUrl ? { label: 'LinkedIn', href: profile.linkedinUrl, icon: LinkedinIcon, external: true } : null,
    profile.email ? { label: 'Gmail', href: `mailto:${profile.email}`, icon: Mail, external: false } : null,
    profile.facebookUrl ? { label: 'Facebook', href: profile.facebookUrl, icon: FacebookIcon, external: true } : null,
  ]
  return links.filter((l): l is ContactLink => l !== null)
}

export function externalProps(link: ContactLink) {
  return link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}
