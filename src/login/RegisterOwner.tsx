import { useState } from 'react'
import { serverTimestamp, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { ShieldCheck } from 'lucide-react'
import { ownerRef } from './auth'
import { Card } from './LoginApp'

// DEV ONLY. LoginApp imports this behind import.meta.env.DEV, so it is not
// included in production builds. Firestore rules also allow this write only
// once: after admin/owner exists, registration is closed for good.
export default function RegisterOwner({ user, onRegistered }: { user: User; onRegistered: () => void }) {
  const [status, setStatus] = useState('')

  async function register() {
    setStatus('Registering…')
    try {
      await setDoc(ownerRef, { uid: user.uid, email: user.email, createdAt: serverTimestamp() })
      onRegistered()
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`)
    }
  }

  return (
    <Card>
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
        <ShieldCheck className="h-6 w-6 text-primary" />
      </div>
      <h1 className="heading-font mb-2 text-2xl font-bold">One-time registration</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Register <strong className="text-foreground">{user.email}</strong> as the site owner. This can only be done
        once and can't be changed from the app afterwards.
      </p>
      <button onClick={register} className="btn-primary w-full justify-center">
        Register as owner
      </button>
      {status && (
        <p className={`mt-4 text-sm ${status.startsWith('Error') ? 'text-destructive' : 'text-muted-foreground'}`}>
          {status}
        </p>
      )}
    </Card>
  )
}
