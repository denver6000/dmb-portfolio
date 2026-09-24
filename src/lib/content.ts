import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from './firebase'
import { SECTIONS } from './sections'
import type { Profile, SectionEntries, SectionId } from './types'

// Public, read-only queries used by the portfolio page.

export async function getProfile(): Promise<Profile | null> {
  const snap = await getDoc(doc(db, 'profile', 'main'))
  return snap.exists() ? (snap.data() as Profile) : null
}

// The published == true filter is required: the rules reject public
// queries that could return drafts.
export async function getPublished<K extends SectionId>(id: K): Promise<SectionEntries[K][]> {
  const [field, direction] = SECTIONS[id].orderBy
  const q = query(collection(db, id), where('published', '==', true), orderBy(field, direction))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SectionEntries[K])
}

// DEV ONLY: /?demo previews the page with the starter content instead of
// Firestore. Stripped from production builds.
export async function getDemoContent() {
  if (!import.meta.env.DEV) return null
  const { starterContent, starterProfile } = await import('../dev/starterContent')
  const withIds = <T,>(items: T[], prefix: string) => items.map((x, i) => ({ ...x, id: `${prefix}-${i}` }))
  return {
    profile: starterProfile,
    skills: withIds(starterContent.skills, 's'),
    projects: withIds(starterContent.projects, 'p'),
    education: withIds(starterContent.education, 'ed'),
    // Show drafts in the demo so every section can be previewed.
    experience: withIds(starterContent.experience, 'ex'),
    competitions: withIds(starterContent.competitions, 'co'),
    certifications: withIds(starterContent.certifications, 'c'),
  } as unknown as {
    profile: Profile
  } & { [K in SectionId]: SectionEntries[K][] }
}
