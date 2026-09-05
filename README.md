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

When someone clicks **Sign in**, the browser sends their email and password
directly to the Neon Auth service at `NEXT_PUBLIC_NEON_AUTH_URL` — there is no
server of ours in between. Neon Auth checks the password, creates a session,
and the browser ends up holding that session as a cookie. The app watches that
session reactively, which is why the screen switches from the sign-in form to
the contacts page on its own, with no manual refresh.

That session cookie is not what talks to the database, though. Every time the
app needs to read or write a contact, the Neon client asks Neon Auth for a
short-lived, signed **JWT** built from the current session, and attaches it to
the request to the Data API as `Authorization: Bearer <token>`. The JWT is
never written to localStorage or to disk — it lives only in memory for the
length of one request, and a fresh one is fetched next time. The browser
cannot alter or forge this token: it is signed with Neon Auth's private key,
and the Data API verifies that signature before trusting anything inside it.

Every JWT carries a `sub` ("subject") claim, which is just the signed-in
user's id. When the Data API forwards a request to Postgres, the JWT goes with
it. A SQL function, `auth.user_id()`, reads the `sub` claim out of the current
request's JWT and returns it as plain text — that function is the single place
in the whole system where "the person making this request" becomes "a value
Postgres can compare against." Everything below only ever compares things to
what that function returns.

Two parts of the schema lean on it:

- `contacts.user_id` is declared `text NOT NULL DEFAULT (auth.user_id())`. It's
  `text`, not `uuid`, because that's exactly the type `auth.user_id()` returns
  — matching types means every policy comparison below is a plain equality
  check, with no implicit cast that could silently behave oddly. The default
  means Postgres fills in the owner itself, from the JWT, at the moment a row
  is inserted. The app's code never sends `user_id` on an insert.
- Four separate Row Level Security policies each compare `auth.user_id()` to a
  row's `user_id`:
  - **SELECT** — a row is only returned if `auth.user_id() = user_id`. This is
    why one user's contacts are invisible to another: Postgres filters rows
    out before they ever reach the Data API response, no matter what the query
    asked for.
  - **INSERT** — the new row is only allowed to be written if
    `auth.user_id() = user_id` once the default has filled `user_id` in. This
    is what stops a client from claiming a contact under someone else's id,
    even if it tried to send one explicitly.
  - **DELETE** — a row can only be deleted if `auth.user_id() = user_id`,
    checked against the row that already exists.
  - **UPDATE** — this is the one that needs both `USING` and `WITH CHECK`,
    because they check two different moments. `USING` is checked against the
    row *as it exists before the update* — it decides which existing rows
    you're even allowed to touch. `WITH CHECK` is checked against the row *as
    it would exist after the update* — it decides whether the values you're
    about to write are still allowed. Without `WITH CHECK`, someone could pass
    the `USING` check on a row they own and then use the update itself to
    rewrite `user_id` and hand the row to someone else. With both, you can
    only update rows you already own, and you can never use an update to
    reassign ownership.

None of this depends on the React code behaving itself. If a bug in the UI
ever sent a malformed request, or someone bypassed the browser and called the
Data API directly, the result would be identical: these four policies and the
`user_id` default are the only reason any of this holds, and they hold at the
database, not in JavaScript.

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
