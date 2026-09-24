import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { app, db } from '../lib/firebase'

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const ownerRef = doc(db, 'admin', 'owner')

export type OwnerStatus = 'owner' | 'unregistered' | 'denied'

// The rules let a signed-in user read admin/owner only if it doesn't exist
// yet or it's theirs, so permission-denied means "someone else owns this site".
export async function checkOwner(user: User): Promise<OwnerStatus> {
  try {
    const snap = await getDoc(ownerRef)
    if (!snap.exists()) return 'unregistered'
    return snap.data().uid === user.uid ? 'owner' : 'denied'
  } catch (e) {
    if ((e as { code?: string }).code === 'permission-denied') return 'denied'
    throw e
  }
}
