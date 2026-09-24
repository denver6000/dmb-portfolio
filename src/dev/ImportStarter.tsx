import { useState } from 'react'
import { collection, doc, getDoc, getDocs, limit, query } from 'firebase/firestore'
import { Download } from 'lucide-react'
import { db } from '../lib/firebase'
import { SECTION_ORDER } from '../lib/sections'
import { createEntry, saveProfile } from '../login/admin-data'
import { starterContent, starterProfile } from './starterContent'

// DEV ONLY: fills empty sections with the laravel-portfolio content. Sections
// (and the profile) that already have data are left untouched.
export default function ImportStarter() {
  const [status, setStatus] = useState('')

  async function run() {
    if (!confirm('Import starter content into every empty section?')) return
    setStatus('Importing…')
    try {
      const done: string[] = []
      if (!(await getDoc(doc(db, 'profile', 'main'))).exists()) {
        await saveProfile({ ...starterProfile })
        done.push('profile')
      }
      for (const id of SECTION_ORDER) {
        const items = starterContent[id]
        if (!items.length) continue
        const existing = await getDocs(query(collection(db, id), limit(1)))
        if (!existing.empty) continue
        for (const item of items) await createEntry(id, { ...item })
        done.push(`${items.length} ${id}`)
      }
      setStatus(done.length ? `Imported ${done.join(', ')}. Reload to see them.` : 'Nothing to import: sections already have content.')
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`)
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
      <span className="font-medium text-primary">Dev only</span>
      <button onClick={run} className="btn-secondary px-4 py-2 text-sm">
        <Download className="h-4 w-4" /> Import starter content
      </button>
      <span className={status.startsWith('Error') ? 'text-destructive' : 'text-muted-foreground'}>{status}</span>
    </div>
  )
}
