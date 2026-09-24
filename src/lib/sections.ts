import { EMPLOYMENT_TYPES, PROJECT_CATEGORIES, type SectionId } from './types'

// Single source of truth for the profile and each content section: the
// Firestore collection (same as the id), public sort order, and the admin
// form fields. Field limits mirror the validators in firestore.rules — keep
// them in sync.

export type FieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'email'
  | 'year'
  | 'month'
  | 'int'
  | 'list'
  | 'select'
  | 'bool'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  max?: number // max string length (per item for lists)
  options?: readonly string[]
  hint?: string
}

export interface SectionDef {
  id: SectionId
  title: string
  orderBy: readonly [field: string, direction: 'asc' | 'desc']
  // Fields shown as the entry's title/subtitle in the admin list.
  labelFields: readonly [string, string]
  fields: FieldDef[]
}

export const PROFILE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, max: 100 },
  { key: 'headline', label: 'Headline', type: 'text', max: 200, hint: 'Shown under your name' },
  { key: 'location', label: 'Location', type: 'text', max: 100 },
  { key: 'focus', label: 'Focus', type: 'text', max: 200, hint: 'e.g. Android, Web, IoT' },
  { key: 'email', label: 'Gmail / email', type: 'email', hint: 'Shown as a contact button' },
  { key: 'githubUrl', label: 'GitHub URL', type: 'url' },
  { key: 'linkedinUrl', label: 'LinkedIn URL', type: 'url' },
  { key: 'facebookUrl', label: 'Facebook URL', type: 'url' },
  { key: 'resumeUrl', label: 'Résumé URL', type: 'url', hint: 'Optional, adds a Résumé button' },
]

// Order of the sections on the public page and in the admin sidebar.
export const SECTION_ORDER: SectionId[] = ['skills', 'projects', 'experience', 'education', 'competitions', 'certifications']

export const SECTIONS: Record<SectionId, SectionDef> = {
  skills: {
    id: 'skills',
    title: 'Skills',
    orderBy: ['order', 'asc'],
    labelFields: ['category', 'order'],
    fields: [
      { key: 'category', label: 'Category', type: 'text', required: true, max: 60 },
      { key: 'order', label: 'Display order', type: 'int', required: true, hint: 'Lower shows first' },
      { key: 'items', label: 'Skills', type: 'list', max: 80, hint: 'One per line, max 20' },
    ],
  },
  projects: {
    id: 'projects',
    title: 'Projects',
    orderBy: ['order', 'asc'],
    labelFields: ['title', 'category'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, max: 120 },
      { key: 'category', label: 'Category', type: 'select', required: true, options: PROJECT_CATEGORIES },
      { key: 'period', label: 'Period', type: 'text', max: 30, hint: 'e.g. 2026, 2023-2025, Recent' },
      { key: 'order', label: 'Display order', type: 'int', required: true, hint: 'Lower shows first' },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true, max: 500 },
      { key: 'description', label: 'More details', type: 'textarea', max: 5000 },
      { key: 'tags', label: 'Tech / tags', type: 'list', max: 40, hint: 'One per line, max 20' },
      { key: 'liveUrl', label: 'Live site URL', type: 'url' },
      { key: 'repoUrl', label: 'Repository URL', type: 'url' },
      { key: 'docsUrl', label: 'Docs URL', type: 'url' },
      { key: 'private', label: 'Private / client-restricted', type: 'bool' },
    ],
  },
  education: {
    id: 'education',
    title: 'Education',
    orderBy: ['startYear', 'desc'],
    labelFields: ['degree', 'school'],
    fields: [
      { key: 'degree', label: 'Degree / program', type: 'text', required: true, max: 150 },
      { key: 'school', label: 'School', type: 'text', required: true, max: 150 },
      { key: 'fieldOfStudy', label: 'Field of study', type: 'text', max: 150 },
      { key: 'location', label: 'Location', type: 'text', max: 100 },
      { key: 'startYear', label: 'Start year', type: 'year', required: true },
      { key: 'endYear', label: 'End year', type: 'year', hint: 'Blank = present' },
      { key: 'description', label: 'Description', type: 'textarea', max: 2000 },
      { key: 'highlights', label: 'Highlights', type: 'list', max: 300, hint: 'One per line, max 20' },
    ],
  },
  experience: {
    id: 'experience',
    title: 'Work Experience',
    orderBy: ['startDate', 'desc'],
    labelFields: ['role', 'company'],
    fields: [
      { key: 'role', label: 'Role', type: 'text', required: true, max: 150 },
      { key: 'company', label: 'Company / organization', type: 'text', required: true, max: 150 },
      { key: 'employmentType', label: 'Employment type', type: 'select', required: true, options: EMPLOYMENT_TYPES },
      { key: 'location', label: 'Location', type: 'text', max: 100 },
      { key: 'startDate', label: 'Start', type: 'month', required: true },
      { key: 'endDate', label: 'End', type: 'month', hint: 'Blank = present' },
      { key: 'description', label: 'Description', type: 'textarea', max: 2000 },
      { key: 'highlights', label: 'Highlights', type: 'list', max: 300, hint: 'One per line, max 20' },
      { key: 'tags', label: 'Tech / skills', type: 'list', max: 40, hint: 'One per line, max 20' },
    ],
  },
  competitions: {
    id: 'competitions',
    title: 'Competitions',
    orderBy: ['startYear', 'desc'],
    labelFields: ['title', 'event'],
    fields: [
      { key: 'title', label: 'Title / placement', type: 'text', required: true, max: 150, hint: 'e.g. Codefest 1st Runner Up' },
      { key: 'event', label: 'Event / organizer', type: 'text', required: true, max: 200 },
      { key: 'startYear', label: 'Year', type: 'year', required: true },
      { key: 'endYear', label: 'Until year', type: 'year', hint: 'Only for multi-year titles, e.g. 2023-2026' },
      { key: 'description', label: 'Description', type: 'textarea', max: 2000 },
      { key: 'linkUrl', label: 'Link', type: 'url', hint: 'Photo, post or certificate' },
    ],
  },
  certifications: {
    id: 'certifications',
    title: 'Certifications',
    orderBy: ['issueDate', 'desc'],
    labelFields: ['name', 'issuer'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, max: 150 },
      { key: 'issuer', label: 'Issuer', type: 'text', required: true, max: 150 },
      { key: 'issueDate', label: 'Issued', type: 'month', required: true },
      { key: 'expiryDate', label: 'Expires', type: 'month', hint: 'Blank = no expiry' },
      { key: 'credentialId', label: 'Credential ID', type: 'text', max: 100 },
      { key: 'credentialUrl', label: 'Credential URL', type: 'url' },
    ],
  },
}
