import { Timestamp } from 'firebase/firestore'
import type { FieldDef } from '../lib/sections'

// Converts between Firestore documents and the flat string values the admin
// form edits, driven by field definitions.

export type FormValues = Record<string, string>

const MAX_LIST_ITEMS = 20

// Months are stored as the 1st of the month, 00:00 UTC.
function monthToTimestamp(value: string): Timestamp {
  const [y, m] = value.split('-').map(Number)
  return Timestamp.fromDate(new Date(Date.UTC(y, m - 1, 1)))
}

function timestampToMonth(ts: Timestamp): string {
  const d = ts.toDate()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function toForm(fields: FieldDef[], doc?: Record<string, unknown> | null): FormValues {
  const values: FormValues = {}
  for (const f of fields) {
    const raw = doc?.[f.key]
    if (f.type === 'month') values[f.key] = raw instanceof Timestamp ? timestampToMonth(raw) : ''
    else if (f.type === 'list') values[f.key] = Array.isArray(raw) ? raw.join('\n') : ''
    else if (f.type === 'bool') values[f.key] = raw === true ? 'true' : 'false'
    else if (f.type === 'select') values[f.key] = typeof raw === 'string' ? raw : (f.options?.[0] ?? '')
    else values[f.key] = raw == null ? '' : String(raw)
  }
  return values
}

// Returns Firestore data (without published/timestamps) or throws a
// user-facing message for problems the browser's own validation can't catch.
export function fromForm(fields: FieldDef[], values: FormValues): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const f of fields) {
    const s = (values[f.key] ?? '').trim()
    if (f.type === 'bool') {
      data[f.key] = s === 'true'
      continue
    }
    if (f.type === 'list') {
      const items = s.split('\n').map((x) => x.trim()).filter(Boolean)
      if (items.length > MAX_LIST_ITEMS) throw new Error(`${f.label}: at most ${MAX_LIST_ITEMS} items.`)
      const tooLong = items.find((x) => f.max && x.length > f.max)
      if (tooLong) throw new Error(`${f.label}: "${tooLong.slice(0, 30)}…" is over ${f.max} characters.`)
      data[f.key] = items
      continue
    }
    if (s === '') continue // optional and empty: omit the field
    if (f.type === 'year' || f.type === 'int') data[f.key] = parseInt(s, 10)
    else if (f.type === 'month') data[f.key] = monthToTimestamp(s)
    else data[f.key] = s
  }

  // Keep end dates after start dates (the rules enforce this too).
  const pairs: [string, string][] = [['startYear', 'endYear'], ['startDate', 'endDate'], ['issueDate', 'expiryDate']]
  for (const [a, b] of pairs) {
    const start = data[a], end = data[b]
    if (start == null || end == null) continue
    const later =
      start instanceof Timestamp
        ? (end as Timestamp).toMillis() >= start.toMillis()
        : (end as number) >= (start as number)
    if (!later) throw new Error(`${labelOf(fields, b)} can't be before ${labelOf(fields, a)}.`)
  }
  return data
}

function labelOf(fields: FieldDef[], key: string) {
  return fields.find((f) => f.key === key)?.label ?? key
}
