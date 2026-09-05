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

There are two kinds of test, and they run together under one `npm test`:

- **Unit tests** (`tests/contact-errors.test.mjs`) for `translateContactError` —
  no network, no auth, always run.
- **An integration test** (`tests/contacts.integration.test.mjs`) that signs in
  as a real (test-only) account and attempts two inserts directly against the
  Data API: a whitespace-only name, and an invalid `priority` value. It asserts
  the database itself rejects both — a non-null error identifying
  `contacts_name_check` or `contacts_priority_check` — and cleans up if a row
  is ever returned unexpectedly, so a regression can't leave data behind.

**What the integration test proves, and what it doesn't.** It proves the two
CHECK constraints reject bad input at the database, which is the point of
Stage 6: the enforcement is real, not just client-side string matching. It
does **not** test Row Level Security isolation between users — that's verified
manually with two accounts (see Security evidence below), because it requires
two separate signed-in identities and is easier to demonstrate directly than
to script safely against real accounts.

**Credentials, and what happens without them.** The integration test needs a
signed-in session — every RLS policy on `contacts` is scoped `TO authenticated`,
so an unauthenticated request can't reach the CHECK constraints at all, only a
row-level-security rejection. Its credentials go in `.env.test.local`
(gitignored, not `.env.local`) as `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` —
see `.env.example` for the names. That account is a dedicated, throwaway
test-only user, never used for the demo data captured as grading evidence. If
those variables aren't set, the two integration tests are reported as
**skipped**, with the reason printed, and `npm test` still exits successfully —
it only ever fails if credentials are present but wrong, or a constraint stops
enforcing what it should.

**Why the test needs its own Origin header and cookie handling.** Neon Auth
enforces origin checking, and a browser sends an `Origin` header (and carries
session cookies between requests) automatically; Node's `fetch` does neither.
`tests/contacts.integration.test.mjs` patches `globalThis.fetch`, scoped to
that one test file only, to add `Origin: http://localhost:3000` and replay the
session cookie from sign-in on later requests — `lib/neon.ts` is untouched,
since the real app runs in a browser and needs none of this. For the
integration test to sign in at all, `http://localhost:3000` must be listed
among the trusted origins in the Neon Auth project settings.

**Node version.** The app itself runs on Node 20.9+ (Next.js 16's own
requirement). The test suite needs Node 22.6+, because it runs `.ts` source
files directly and relies on Node's native TypeScript stripping, which doesn't
exist before 22.6. That's a real, narrower floor than the app's — stated here
rather than left to overstate or understate what running `npm test` requires.

## Security evidence

- **Two-account privacy test:** TODO
- **Invalid input failing safely:** TODO
- **No secrets in git:** TODO

## Deployment

TODO: push to GitHub, import into Vercel, set production environment variables,
add the Vercel domain to Neon Auth trusted origins.

## Known limitations and what I would improve next

- **Auth errors are shown verbatim, which allows account enumeration.**
  Sign-up/sign-in show Neon Auth's own error text as-is (e.g. "Email address
  already registered" vs. "Invalid email or password"), so an attacker can
  learn whether an email has an account by attempting to sign up with it. The
  standard mitigation is a neutral response ("If that email isn't already
  registered, check your inbox") paired with mandatory email verification —
  but email verification is currently disabled on this Neon Auth project, so
  a neutral message today would just leave a legitimate user with a wrong
  password stuck with no explanation. I'm treating this as a considered
  trade-off for now, not an oversight: fix it together with verification, not
  separately.
- **A Data API error's `.details` field can carry Postgres detail or a raw
  stack trace.** Nothing in this app reads that field today — every error
  path goes through `translateContactError`'s allowlist, which only ever
  looks at `.message` — but a future debug `console.error(error)` would leak
  it straight to the browser console. Worth a lint rule or a wrapper that
  strips `.details` before an error object is ever allowed to reach a
  `console.*` call.
- **`user_id` is kept out of insert/update payloads by TypeScript types, not
  by a runtime check.** `ContactInput`/`ContactUpdate` simply have no
  `user_id` field, so nothing today can send one — but that's a type-checker
  guarantee, not a runtime one. The real protection is the database's own
  `WITH CHECK (auth.user_id() = user_id)` on both the insert and update
  policies, which would reject a spoofed value regardless of what the client
  sends. A future refactor could still introduce a code path that spreads
  unvalidated data into an insert without the type checker catching it; a
  runtime strip (e.g. `delete payload.user_id` before every call) would close
  that gap independent of the type layer.
- **Switching which contact is being edited discards another contact's
  unsaved edit with no warning.** Only one contact can be in edit mode at a
  time; opening a second one silently unmounts the first form, reverting to
  its saved values. A confirmation prompt (or just disabling other rows' Edit
  buttons while one is open) would fix this; skipped for now since it's a
  narrow, low-consequence case.
- **Client-side sorting and filtering don't scale.** `app/contacts.tsx` fetches
  the full contact list and sorts/filters it in the browser. Fine for a
  personal contact list of a few hundred rows; would need to move to
  `.order()`/`.eq()` on the Data API query itself (and a priority-ranking
  approach that doesn't rely on alphabetical order) if this were ever meant to
  hold thousands of contacts.
- **Every Data API call costs an extra `/get-session` round trip.** The SDK
  resolves a fresh JWT on every single request rather than caching one for
  its lifetime (verified directly in `@neondatabase/auth`'s source — see
  "Authentication and row ownership" above). Fine at this app's scale; would
  be worth caching the token client-side until it's near expiry if request
  volume ever became a concern.
- Neon's auth packages are beta releases (@neondatabase/auth 0.5.0-beta,
  @neondatabase/neon-js 0.7.0-beta). Several behaviors in this project were
  found to diverge from the SDK's own documented examples — most notably,
  `signIn.email`/`signUp.email` throw on failure instead of returning
  `{ data, error }` as documented — and were only caught by testing directly
  against the live endpoints rather than trusting the docs.
