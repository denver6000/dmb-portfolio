import { formatMonth } from '../lib/format'
import type { Certification } from '../lib/types'

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
              <div>
                <h2 className="heading-font text-2xl font-semibold">{item.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.issuer}</p>
                {item.credentialId && <p className="mt-4 text-xs text-muted-foreground">Credential ID: {item.credentialId}</p>}
                {item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline">View credential ↗</a>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
