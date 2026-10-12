import { useState } from 'react'
import { formatMonth } from '../lib/format'
import type { Certification } from '../lib/types'

// Preview images live at public/certs/<credentialId>.png; entries without one just skip it.
function CertificateImage({ item }: { item: Certification }) {
  const [failed, setFailed] = useState(false)
  if (!item.credentialId || failed) return null
  const src = `/certs/${encodeURIComponent(item.credentialId)}.png`

  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden border border-border bg-muted/40 lg:w-80">
      <img src={src} alt={`Certificate: ${item.name}`} loading="lazy" onError={() => setFailed(true)} className="h-auto w-full transition-transform duration-300 hover:scale-[1.02]" />
    </a>
  )
}

export default function CertificationsPage({ certifications }: { certifications: Certification[] }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className="mb-10 border-b border-border pb-8">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-primary uppercase">Credentials / {certifications.length}</p>
        <h1 className="heading-font text-5xl font-semibold tracking-tight sm:text-7xl">Certifications</h1>
      </div>

      {certifications.length === 0 ? (
        <p className="border-b border-border py-8 text-muted-foreground">Certifications will appear here when they are published.</p>
      ) : (
        <div className="border-t border-border">
          {certifications.map((item) => (
            <article key={item.id} data-peeker-hideout className="grid gap-3 border-b border-border py-7 sm:grid-cols-[180px_1fr] sm:gap-8">
              <p className="text-sm font-medium text-primary">{formatMonth(item.issueDate)}</p>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="heading-font text-2xl font-semibold">{item.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{item.issuer}</p>
                  {item.credentialId && <p className="mt-4 text-xs text-muted-foreground">Credential ID: {item.credentialId}</p>}
                  {item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">View credential ↗</a>}
                </div>
                <CertificateImage item={item} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
