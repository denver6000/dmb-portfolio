import type { Timestamp } from 'firebase/firestore'

export interface Profile {
  name: string
  headline?: string
  location?: string
  focus?: string
  email?: string
  githubUrl?: string
  linkedinUrl?: string
  facebookUrl?: string
  resumeUrl?: string
  updatedAt?: Timestamp
}

export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'freelance',
  'internship',
  'volunteer',
] as const
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export const PROJECT_CATEGORIES = ['featured', 'personal'] as const
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

// Fields every content entry has.
export interface EntryMeta {
  id: string
  published: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface SkillGroup extends EntryMeta {
  category: string
  items: string[]
  order: number
}

export interface Education extends EntryMeta {
  school: string
  degree: string
  fieldOfStudy?: string
  location?: string
  startYear: number
  endYear?: number // absent = present
  description?: string
  highlights: string[]
}

export interface Experience extends EntryMeta {
  role: string
  company: string
  employmentType: EmploymentType
  location?: string
  startDate: Timestamp
  endDate?: Timestamp // absent = present
  description?: string
  highlights: string[]
  tags: string[]
}

export interface Project extends EntryMeta {
  title: string
  category: ProjectCategory
  period?: string // free-form label, e.g. "2023-2025" or "Recent"
  summary: string
  description?: string
  tags: string[]
  private: boolean // shows "Private/Client-Restricted"
  liveUrl?: string
  repoUrl?: string
  docsUrl?: string
  order: number
}

export interface Competition extends EntryMeta {
  title: string // e.g. "Codefest Cluster 6 1st Runner Up"
  event: string // e.g. "STI College Malolos Bulacan Tagisan Ng Talino 2026"
  startYear: number
  endYear?: number // for recurring titles, e.g. local champion 2023-2026
  description?: string
  linkUrl?: string
}

export interface Certification extends EntryMeta {
  name: string
  issuer: string
  issueDate: Timestamp
  expiryDate?: Timestamp
  credentialId?: string
  credentialUrl?: string
}

export interface SectionEntries {
  skills: SkillGroup
  education: Education
  experience: Experience
  projects: Project
  competitions: Competition
  certifications: Certification
}

export type SectionId = keyof SectionEntries
