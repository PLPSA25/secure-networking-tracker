# CLAUDE.md — Standing context for this project

Read this before every task. These rules come from a graded assignment rubric.
Where this file and vendor documentation disagree, THIS FILE WINS.

## What this project is

A secure networking tracker: a private contact list where each signed-in user can
create, view, edit, delete, sort, and filter their own contacts, and cannot see or
modify anyone else's. Deployed publicly on Vercel.

The deliverable is a public GitHub repo whose README lets a grader open the live
app, understand the system, and verify every rubric line.

## Required stack — not negotiable

- Next.js 16, App Router, TypeScript
- Tailwind CSS
- Neon Postgres
- Neon Managed Better Auth
- Neon Data API via @neondatabase/neon-js
- Vercel hosting, Git + GitHub

DO NOT propose or install Supabase, Prisma, Drizzle, NextAuth, Clerk, or any other
database/ORM/auth library. The rubric names these technologies specifically.
Substitutions fail the assignment regardless of code quality.

@neondatabase/auth and @neondatabase/auth-ui are BETA. Expect gaps between docs and
behavior. Check installed source before assuming your code is wrong.

## Architecture decision — already made, do not relitigate

The browser talks DIRECTLY to the Neon Data API using @neondatabase/neon-js with
the two-URL object form:

    createClient({
      auth:    { url: process.env.NEXT_PUBLIC_NEON_AUTH_URL },
      dataApi: { url: process.env.NEXT_PUBLIC_NEON_DATA_API_URL },
    })

There is NO server tier and NO direct Postgres connection. Therefore:

- The @neondatabase/auth server SDK, NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET
  are NOT used.
- DATABASE_URL is NOT used and must never appear in .env.local. It is listed in
  .env.example as a documented name only. Schema changes are applied by hand in the
  Neon console SQL Editor.
- The trust boundary is THE DATABASE. RLS policies and CHECK constraints are the
  enforcement layer, not client-side JavaScript. Never rely on the UI to prevent
  bad or unauthorized data.

The README must argue that Postgres IS the backend tier. That is the answer to the
rubric's "frontend and backend separated" requirement.

## CRITICAL — where Neon's docs are wrong for this rubric

Neon's documentation demonstrates RLS with a single FOR ALL policy. THAT FAILS THIS
ASSIGNMENT. The rubric requires separate select, insert, update and delete policies.
Four distinct policies. Never FOR ALL.

## Database — ALREADY APPLIED, do not recreate

The contacts table, constraints and four RLS policies are already live in Neon on
the production branch. See db/schema.sql. Do not generate migrations or recreate
them. If a schema change is needed, propose the SQL and STOP — it gets run by hand
in the Neon SQL Editor, then mirrored into db/schema.sql.

NEVER send user_id from client code. The column default fills it from the caller's
JWT and the INSERT policy verifies it. Sending it explicitly is a bug.

## Security rules

- .env.local is gitignored and contains only the two NEXT_PUBLIC_ URLs.
- .gitignore has a !.env.example exception so the example file IS tracked. Do not
  remove it.
- Never print, echo or write a real secret into any file, commit or console output.
- "Grant public schema access" is enabled on this Neon project: every authenticated
  user has table-level rights on the public schema. ANY new table in public without
  RLS is readable by every signed-in user. Do not create tables casually.

## Environment variables

The only two the app reads:
- NEXT_PUBLIC_NEON_AUTH_URL
- NEXT_PUBLIC_NEON_DATA_API_URL

## Scope boundaries — do not build these

No AI features. No admin dashboard. No contact sharing or team workspaces. No extra
pages or "nice to have" features. The rubric states: "A small secure application is
better than a large unfinished one."

## How to work on this project

1. Show the plan before changing files. List what you will create or edit and why.
   Wait for approval.
2. Work in small increments. One coherent change at a time.
3. Stop after each increment so I can run it and commit.
4. Explain, don't just produce. The rubric requires that I can explain the schema,
   the RLS rule and the request flow WITHOUT AI help. After any non-obvious change,
   say in plain language what it does and why.
5. Flag uncertainty. If unsure whether a Neon API behaves as assumed, say so and
   check — the SDK is beta.
6. Before any git add, confirm .env.local is not staged.

## Definition of Done

- [ ] Live at a public URL
- [ ] Sign in and sign out work
- [ ] Add, view, edit, delete, sort and filter contacts
- [ ] Data survives a browser refresh
- [ ] User A cannot see or change User B's contacts
- [ ] Invalid data fails safely with a clear message
- [ ] At least one automated test passes
- [ ] No secret in frontend code or git history
- [ ] README contains every required section and all grading evidence
- [ ] I can explain the schema, RLS rule and request flow unaided
