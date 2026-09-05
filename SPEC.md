# SPEC.md — Build plan

Each stage has an acceptance test. Do not start a stage until the previous one
passes and is committed.

## Stage 1 — Project skeleton — DONE

Next.js 16, App Router, TypeScript, Tailwind, ESLint, no src/.
.env.local holds the two NEXT_PUBLIC_ URLs. .env.example is committed.
.gitignore carries a !.env.example exception.

## Stage 2 — Database schema and RLS — DONE

contacts table with text user_id DEFAULT (auth.user_id()), CHECK constraints on
name and priority, RLS enabled, four separate policies. Applied live in Neon on
the production branch. Verified: pg_policies returns 4 rows. Mirrored in
db/schema.sql.

## Stage 3 — Neon client and auth

Build:
- lib/neon.ts — one createClient call in the two-URL object form, exported once
  and reused. Never instantiate the client twice.
- Sign-up, sign-in, sign-out UI
- Session-aware routing: signed-out users see auth, signed-in users see contacts

Acceptance: create an account, sign out, sign back in. Refresh keeps you signed in.
Commit: feat: neon auth sign-up, sign-in, sign-out

## Stage 4 — Contacts CRUD

Build: create, list, edit, delete. Never send user_id — the column default fills
it from the JWT. Fields: name, company, role, where met, notes, priority.

Acceptance: add a contact, edit it, delete it, refresh — data persists.
Commit: feat: contact create, read, update, delete

## Stage 5 — Sort, filter, and UI states

Build:
- Sort by at least name, priority, and date added
- Filter by priority
- Four visible states: loading, empty, success, error
- Responsive layout for phone and laptop

Acceptance: each state is reachable and readable. At phone width nothing overflows.
Commit: feat: sorting, filtering, and UI states

## Stage 6 — Validation and the automated test

Build:
- Clear error messages for a blank name and an invalid priority
- At least one automated test proving validation rejects bad input

Design note: the database CHECK constraints are the real enforcement. The test must
demonstrate bad input is rejected — either by asserting the Data API returns an
error, or by unit-testing a shared validation module mirroring the constraints. Do
not add DATABASE_URL back to the project just to make a test easier.

Acceptance: npm test passes and prints output worth screenshotting.
Commit: test: validation rejects blank name and invalid priority

## Stage 7 — Deploy

Push to a public GitHub repo, import into Vercel, set the two NEXT_PUBLIC_
variables as production environment variables, and add the Vercel domain to Neon
Auth's trusted origins — sign-in fails on the live URL without this.

Acceptance: sign-in works on the public URL in a private browser window.

## Stage 8 — Evidence and README

- Run /ultrareview over the whole repo before the final push. This project is
  graded primarily on security, so the review should focus on auth handling,
  RLS assumptions in client code, error handling, and any place a secret could
  leak. Fix what it finds, then capture evidence.

Capture on the deployed app, not localhost:
1. Automated test output, at least one passing validation test
2. Sign-in and sign-out
3. Creating, editing, deleting, and refreshing a contact
4. Two accounts, proving User A cannot access User B's contacts
5. One invalid input failing safely
6. A written explanation of the schema and the RLS ownership rule

Then complete every README section, including the argument that Postgres is the
backend tier.

Acceptance: every Definition of Done box in CLAUDE.md checked against the live URL.
