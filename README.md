# DMB Portfolio

Vite + React + TypeScript portfolio backed by Firebase (project `dmb-portfolio`).

- **`/`**: public, read-only portfolio (design copied from `../laravel-portfolio`). Contact links
  (GitHub, LinkedIn, Gmail, Facebook) sit at the top and stay in the header, followed by Skills,
  Projects, Work Experience, Education, Competitions and Certifications. It never loads Firebase Auth.
- **`/login`**: hidden admin page (`noindex`). You sign in with Google and edit everything there.
  Only the registered owner gets in; anyone else is signed straight back out.

## One-time owner registration (local only)

1. `npm run dev`, then open http://localhost:5173/login
2. Sign in with Google and click **Register as owner**.

This creates `admin/owner` with your uid. The registration UI exists only in the dev server
(`import.meta.env.DEV`) and is removed from production builds. The Firestore rules also allow
`admin/owner` to be created exactly once and never updated or deleted, so registration is closed
for good after that. To transfer ownership later, delete `admin/owner` in the Firebase Console
and register again locally.

## Content model

The profile and each section's fields and sort order are defined once in
`src/lib/sections.ts`. The admin forms are generated from that file, and `firestore.rules`
validates the same limits.

| Collection | Public order | Key fields |
| --- | --- | --- |
| `profile/main` | n/a | name, headline, location, focus, email (Gmail), GitHub/LinkedIn/Facebook/résumé URLs, hero image |
| `skills` | display order | category, items (one per line) |
| `projects` | display order | title, category (featured/personal), period label, summary, details, tags, live/repo/docs URLs, private flag |
| `education` | start year, newest first | degree, school, field of study, startYear, endYear (blank = present), highlights |
| `experience` | start date, newest first | role, company, employment type, start/end month (blank end = present), highlights, tags |
| `competitions` | year, newest first | title/placement, event, year, until-year (multi-year titles), description, link |
| `certifications` | issue date, newest first | name, issuer, issue/expiry month, credential ID and URL |

Every entry has a `published` flag. Drafts are only visible to the owner.

## Dev-only helpers

These exist only under `npm run dev` and are stripped from production builds:

- `http://localhost:5173/?demo` previews the public page with the starter content
  (`src/dev/starterContent.ts`, taken from the laravel-portfolio concept) without touching Firestore.
- In `/login`, **Import starter content** writes that content into every empty section. Work
  experience is imported as drafts with January placeholder months, so check the dates before
  publishing.

Deploy rule or index changes with:

```bash
npx -y firebase-tools@latest deploy --only firestore,auth
```

## Deploy on Hostinger (GitHub integration)

Build command `npm run build`, output directory `dist` (it contains `index.html` and
`login/index.html`). `public/.htaccess` redirects `/login` to `/login/`.

## Authorized domains (Google sign-in)

Google sign-in only works on domains in the project's authorized list. Otherwise the popup
shows "The requested action is invalid." The list currently contains `localhost`,
`dmb-portfolio.firebaseapp.com`, `dmb-portfolio.web.app`, `dmballesteros.com` and
`www.dmballesteros.com`.

**Note:** `firebase deploy --only auth` does *not* apply `auth.authorizedDomains` from
`firebase.json`. It only configures the providers. The list there is kept as a record. To add
a domain (no protocol or port), use Firebase Console → Authentication → Settings →
Authorized domains.
