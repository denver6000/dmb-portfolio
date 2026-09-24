import type { Timestamp } from 'firebase/firestore'

const monthFmt = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })

export function formatMonth(ts: Timestamp): string {
  return monthFmt.format(ts.toDate())
}

export function formatMonthRange(start: Timestamp, end?: Timestamp): string {
  return `${formatMonth(start)} – ${end ? formatMonth(end) : 'Present'}`
}

export function formatYearRange(start: number, end?: number): string {
  return end === start ? String(start) : `${start}–${end ?? 'Present'}`
}
