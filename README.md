# Secure Networking Tracker

> **DRAFT — every TODO must be filled before submission.**
> The README is the grading surface: a grader should need only this repo URL to
> understand, run, test, and evaluate the project.

TODO: one-paragraph overview — what the app does and who it is for.

## Live application

**URL:** TODO

## Screenshots and walkthrough

TODO: screenshots or a short recording of the product in use.

## Features

- TODO: sign up, sign in, sign out
- TODO: add a contact with name, company, role, where met, notes, priority
- TODO: view contacts in a sortable list
- TODO: edit and delete your own contacts
- TODO: sort and filter
- TODO: responsive on mobile and desktop

## Technology stack and why

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | TODO |
| Database | Neon Postgres | TODO |
| Authentication | Neon Managed Better Auth | TODO |
| Data access | Neon Data API via @neondatabase/neon-js | TODO |
| Styling | Tailwind CSS | TODO |
| Hosting | Vercel | TODO |
| Source control | Git + GitHub | TODO |

## Architecture

TODO: explain frontend, backend, database, authentication, and hosting, and trace
a request from a click to a row in Postgres and back.

**On frontend/backend separation.** The browser calls the Neon Data API directly.
The backend tier is Postgres itself: Row Level Security policies and CHECK
constraints are the trust boundary, and no client-side code can bypass them.
TODO: expand this — it is the answer to "frontend and backend separated."

## Local setup

```bash
git clone TODO
cd webapp
npm install
cp .env.example .env.local   # then fill in your own values
npm run dev
```

## Environment variables

Names only. Never commit real values.

| Variable | Scope | Purpose |
|---|---|---|
| NEXT_PUBLIC_NEON_AUTH_URL | public | Neon Auth endpoint used by the browser client |
| NEXT_PUBLIC_NEON_DATA_API_URL | public | Neon Data API endpoint used by the browser client |
| DATABASE_URL | server only | Direct Postgres connection, for schema work only |

This implementation does not use DATABASE_URL, NEON_AUTH_BASE_URL, or
NEON_AUTH_COOKIE_SECRET. TODO: state why — the app opens no direct Postgres
connection, and schema changes are applied in the Neon console SQL Editor.

## Database schema

See `db/schema.sql`. TODO: describe every column, type, and constraint.

## Authentication and row ownership

TODO: explain how auth.user_id() reads the JWT sub claim, why user_id is text and
defaults to it, and how the four RLS policies enforce ownership. Explain
specifically why the UPDATE policy needs both USING and WITH CHECK.

## Tests

```bash
npm test
```

TODO: what the automated test verifies, plus the passing output.

## Security evidence

- **Two-account privacy test:** TODO
- **Invalid input failing safely:** TODO
- **No secrets in git:** TODO

## Deployment

TODO: push to GitHub, import into Vercel, set production environment variables,
add the Vercel domain to Neon Auth trusted origins.

## Known limitations and what I would improve next

- Neon's auth packages are beta releases (@neondatabase/auth 0.5.0-beta).
- TODO: add more, honestly and specifically.
