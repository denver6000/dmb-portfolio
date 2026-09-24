import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { LockKeyhole } from 'lucide-react'
import { auth, checkOwner, googleProvider, type OwnerStatus } from './auth'
import Dashboard from './Dashboard'

// Registration UI exists only in the local dev server; in production builds
// this is null and the module is not bundled.
const RegisterOwner = import.meta.env.DEV ? lazy(() => import('./RegisterOwner')) : null

type State =
  | { kind: 'loading' }
  | { kind: 'signedOut'; notice?: string }
  | { kind: 'checking'; user: User }
  | { kind: 'owner'; user: User }
  | { kind: 'unregistered'; user: User }
  | { kind: 'error'; message: string }

export default function LoginApp() {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [recheck, setRecheck] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setState((prev) =>
          user
            ? { kind: 'checking', user }
            : { kind: 'signedOut', notice: prev.kind === 'signedOut' ? prev.notice : undefined },
        )
      }),
    [],
  )

  const checkingUser = state.kind === 'checking' ? state.user : null
  useEffect(() => {
    if (!checkingUser) return
    checkOwner(checkingUser)
      .then((status: OwnerStatus) => {
        if (status === 'owner') return setState({ kind: 'owner', user: checkingUser })
        if (status === 'unregistered' && import.meta.env.DEV)
          return setState({ kind: 'unregistered', user: checkingUser })
        // Not the owner (or registration closed in production): sign straight back out.
        const notice = status === 'denied' ? "This account isn't authorized." : 'Registration is closed.'
        return signOut(auth).then(() => setState({ kind: 'signedOut', notice }))
      })
      .catch((e) => setState({ kind: 'error', message: String(e.message ?? e) }))
  }, [checkingUser, recheck])

  async function signIn() {
    setBusy(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request')
        setState({ kind: 'signedOut', notice: `Sign-in failed: ${(e as Error).message}` })
    } finally {
      setBusy(false)
    }
  }

  switch (state.kind) {
    case 'loading':
    case 'checking':
      return (
        <Centered>
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </Centered>
      )
    case 'error':
      return (
        <Centered>
          <Card>
            <p className="text-destructive">{state.message}</p>
          </Card>
        </Centered>
      )
    case 'signedOut':
      return (
        <Centered>
          <Card>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <LockKeyhole className="h-6 w-6 text-primary" />
            </div>
            <h1 className="heading-font mb-2 text-2xl font-bold">Sign in</h1>
            <p className="mb-6 text-sm text-muted-foreground">Owner access only.</p>
            <button onClick={signIn} disabled={busy} className="btn-primary w-full justify-center">
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
            {state.notice && <p className="mt-4 text-sm text-destructive">{state.notice}</p>}
          </Card>
        </Centered>
      )
    case 'unregistered':
      return RegisterOwner ? (
        <Centered>
          <Suspense fallback={null}>
            <RegisterOwner
              user={state.user}
              onRegistered={() => {
                setState({ kind: 'checking', user: state.user })
                setRecheck((n) => n + 1)
              }}
            />
          </Suspense>
        </Centered>
      ) : null
    case 'owner':
      return <Dashboard user={state.user} onSignOut={() => signOut(auth)} />
  }
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4">{children}</div>
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">{children}</div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 rounded-full bg-white p-0.5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}
