import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { SECTIONS } from '../lib/sections'
import type { SectionEntries, SectionId } from '../lib/types'

// Owner-only reads/writes. The rules enforce this; these helpers just keep
// the document shape consistent (timestamps, no empty optional fields).

type DocData = Record<string, unknown>

// All entries including drafts, in the same order the public page uses.
export async function listAll<K extends SectionId>(id: K): Promise<SectionEntries[K][]> {
  const [field, direction] = SECTIONS[id].orderBy
  const snap = await getDocs(query(collection(db, id), orderBy(field, direction)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SectionEntries[K])
}

export async function createEntry(id: SectionId, data: DocData) {
  await addDoc(collection(db, id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// Full overwrite so cleared optional fields are removed; createdAt is carried over.
export async function updateEntry(id: SectionId, docId: string, createdAt: Timestamp | undefined, data: DocData) {
  await setDoc(doc(db, id, docId), { ...data, createdAt, updatedAt: serverTimestamp() })
}

export async function deleteEntry(id: SectionId, docId: string) {
  await deleteDoc(doc(db, id, docId))
}

export async function saveProfile(data: DocData) {
  await setDoc(doc(db, 'profile', 'main'), { ...data, updatedAt: serverTimestamp() })
}
