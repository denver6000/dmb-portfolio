import { lazy, Suspense, useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import {
  ArrowLeft,
  Award,
  Briefcase,
  CodeXml,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  LogOut,
  Pencil,
  Plus,
  Trash,
  Trophy,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { getProfile } from '../lib/content'
import { PROFILE_FIELDS, SECTION_ORDER, SECTIONS, type FieldDef, type SectionDef } from '../lib/sections'
import type { EntryMeta, SectionId } from '../lib/types'
import { createEntry, deleteEntry, listAll, saveProfile, updateEntry } from './admin-data'
import { fromForm, toForm, type FormValues } from './form'

type Tab = 'profile' | SectionId

const TAB_ICONS: Record<Tab, LucideIcon> = {
  profile: UserRound,
  skills: CodeXml,
  projects: FolderGit2,
  education: GraduationCap,
  experience: Briefcase,
  competitions: Trophy,
  certifications: Award,
}

// Dev-only helper; null (and not bundled) in production builds.
const ImportStarter = import.meta.env.DEV ? lazy(() => import('../dev/ImportStarter')) : null

const TABS: Tab[] = ['profile', ...SECTION_ORDER]
const tabLabel = (t: Tab) => (t === 'profile' ? 'Profile' : SECTIONS[t].title)

export default function Dashboard({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="heading-font text-xl font-bold">Admin</span>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              View site <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <span className="hidden text-sm text-muted-foreground md:inline">{user.email}</span>
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:gap-8 md:py-10">
        <nav className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 md:mx-0 md:w-52 md:flex-col md:px-0">
          {TABS.map((t) => {
            const Icon = TAB_ICONS[t]
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  active
                    ? 'border border-primary/20 bg-primary/10 text-primary'
                    : 'border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tabLabel(t)}
              </button>
            )
          })}
        </nav>

        <main className="min-w-0 flex-1">
          {ImportStarter && (
            <Suspense fallback={null}>
              <ImportStarter />
            </Suspense>
          )}
          {tab === 'profile' ? <ProfileEditor /> : <SectionEditor key={tab} section={SECTIONS[tab]} />}
        </main>
      </div>
    </div>
  )
}

// ---------- Shared bits ----------

function PageTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="heading-font text-3xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function Status({ text }: { text: string }) {
  if (!text) return null
  const isError = text.startsWith('Error')
  return <span className={`text-sm ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>{text}</span>
}

// Renders a form from field definitions. `children` go below the fields
// (e.g. the Published toggle).
function FieldsForm({
  fields,
  values,
  onChange,
  onSubmit,
  submitLabel,
  status,
  onCancel,
  children,
}: {
  fields: FieldDef[]
  values: FormValues
  onChange: (key: string, value: string) => void
  onSubmit: () => void
  submitLabel: string
  status: string
  onCancel?: () => void
  children?: ReactNode
}) {
  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit()
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.key} field={f} value={values[f.key] ?? ''} onChange={(v) => onChange(f.key, v)} />
        ))}
      </div>
      {children}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <button className="btn-primary px-5 py-2.5 text-sm">{submitLabel}</button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary px-5 py-2.5 text-sm">
            Cancel
          </button>
        )}
        <Status text={status} />
      </div>
    </form>
  )
}

function Field({ field: f, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  if (f.type === 'bool') {
    return (
      <div className="sm:col-span-2">
        <Toggle label={f.label} checked={value === 'true'} onChange={(on) => onChange(on ? 'true' : 'false')} />
      </div>
    )
  }

  const wide = f.type === 'textarea' || f.type === 'list'
  const common = {
    id: `field-${f.key}`,
    value,
    required: f.required,
    className: 'input',
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  }
  let input
  switch (f.type) {
    case 'textarea':
      input = <textarea {...common} maxLength={f.max} rows={4} />
      break
    case 'list':
      input = <textarea {...common} rows={5} />
      break
    case 'select':
      input = (
        <select {...common} className="input capitalize">
          {f.options?.map((o) => (
            <option key={o} value={o}>
              {o.replace('-', ' ')}
            </option>
          ))}
        </select>
      )
      break
    case 'year':
      input = <input {...common} type="number" min={1950} max={2100} step={1} placeholder="YYYY" />
      break
    case 'int':
      input = <input {...common} type="number" min={0} max={10000} step={1} />
      break
    case 'month':
      input = <input {...common} type="month" />
      break
    case 'url':
      input = <input {...common} type="url" maxLength={500} placeholder="https://" />
      break
    case 'email':
      input = <input {...common} type="email" maxLength={200} />
      break
    default:
      input = <input {...common} maxLength={f.max} />
  }
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={common.id} className="text-sm font-medium text-foreground">
        {f.label}
        {f.required && <span className="text-primary"> *</span>}
      </label>
      {input}
      {f.hint && <span className="text-xs text-muted-foreground">{f.hint}</span>}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 select-none">
      <span className="relative inline-flex">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-foreground transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </label>
  )
}

// ---------- Profile ----------

function ProfileEditor() {
  const [values, setValues] = useState<FormValues | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    getProfile()
      .then((p) => setValues(toForm(PROFILE_FIELDS, p as Record<string, unknown> | null)))
      .catch((e) => setStatus(`Error: ${e.message}`))
  }, [])

  async function save() {
    if (!values) return
    setStatus('Saving…')
    try {
      await saveProfile(fromForm(PROFILE_FIELDS, values))
      setStatus('Saved.')
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`)
    }
  }

  return (
    <>
      <PageTitle title="Profile" description="Your name, contact links and the details shown at the top of the site." />
      {values ? (
        <FieldsForm
          fields={PROFILE_FIELDS}
          values={values}
          onChange={(k, v) => setValues({ ...values, [k]: v })}
          onSubmit={save}
          submitLabel="Save profile"
          status={status}
        />
      ) : (
        <Status text={status || 'Loading…'} />
      )}
    </>
  )
}

// ---------- Content sections ----------

type Entry = EntryMeta & Record<string, unknown>

function SectionEditor({ section }: { section: SectionDef }) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [editing, setEditing] = useState<Entry | 'new' | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    listAll(section.id)
      .then((list) => setEntries(list as unknown as Entry[]))
      .catch((e) => setError(`Error: ${e.message}`))
  }, [section.id])
  useEffect(reload, [reload])

  async function onDelete(entry: Entry) {
    if (!confirm(`Delete "${String(entry[section.labelFields[0]])}"? This can't be undone.`)) return
    try {
      await deleteEntry(section.id, entry.id)
      reload()
    } catch (e) {
      setError(`Error: ${(e as Error).message}`)
    }
  }

  if (editing) {
    return (
      <EntryForm
        section={section}
        entry={editing === 'new' ? undefined : editing}
        defaultOrder={entries?.length ?? 0}
        onDone={() => {
          setEditing(null)
          reload()
        }}
      />
    )
  }

  const [titleKey, subKey] = section.labelFields
  return (
    <>
      <PageTitle
        title={section.title}
        description="Drafts are only visible to you."
        action={
          <button onClick={() => setEditing('new')} className="btn-primary px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" /> Add entry
          </button>
        }
      />
      {error && <p className="mb-4"><Status text={error} /></p>}
      {!entries && !error && <Status text="Loading…" />}
      {entries?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No {section.title.toLowerCase()} yet.
        </div>
      )}
      <ul className="space-y-3">
        {entries?.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold">{String(e[titleKey])}</span>
                {!e.published && (
                  <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Draft
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground capitalize">
                {subKey === 'order' ? `Order ${String(e[subKey])}` : String(e[subKey] ?? '')}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <IconButton label="Edit" onClick={() => setEditing(e)} icon={Pencil} />
              <IconButton label="Delete" onClick={() => onDelete(e)} icon={Trash} danger />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  danger,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted ${
        danger ? 'hover:text-destructive' : 'hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function EntryForm({
  section,
  entry,
  defaultOrder,
  onDone,
}: {
  section: SectionDef
  entry?: Entry
  defaultOrder: number
  onDone: () => void
}) {
  const [values, setValues] = useState<FormValues>(() => {
    const v = toForm(section.fields, entry)
    if (!entry && 'order' in v) v.order = String(defaultOrder)
    return v
  })
  const [published, setPublished] = useState(entry?.published ?? true)
  const [status, setStatus] = useState('')

  async function save() {
    setStatus('Saving…')
    try {
      const data = { ...fromForm(section.fields, values), published }
      if (entry) await updateEntry(section.id, entry.id, entry.createdAt, data)
      else await createEntry(section.id, data)
      onDone()
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`)
    }
  }

  return (
    <>
      <button
        onClick={onDone}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {section.title.toLowerCase()}
      </button>
      <PageTitle title={`${entry ? 'Edit' : 'New'} ${section.title.toLowerCase()} entry`} />
      <FieldsForm
        fields={section.fields}
        values={values}
        onChange={(k, v) => setValues((x) => ({ ...x, [k]: v }))}
        onSubmit={save}
        submitLabel={entry ? 'Save changes' : 'Create entry'}
        status={status}
        onCancel={onDone}
      >
        <div className="mt-6 border-t border-border pt-5">
          <Toggle label="Published (visible on the public site)" checked={published} onChange={setPublished} />
        </div>
      </FieldsForm>
    </>
  )
}
