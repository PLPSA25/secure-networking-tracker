// Proves the database's own CHECK constraints reject bad input — not just
// that translateContactError maps strings correctly. Needs a real signed-in
// session because every RLS policy on contacts is scoped `TO authenticated`;
// there is no policy at all for an unauthenticated request, so it can't even
// reach the CHECK constraints to demonstrate them.
//
// Requires TEST_USER_EMAIL and TEST_USER_PASSWORD (see .env.example) for a
// dedicated test-only account. Skips, rather than fails, when they're absent.

import { test, before } from "node:test";
import assert from "node:assert/strict";

// A browser gives Neon Auth two things automatically that Node's fetch does
// not: an Origin header on every request, and a cookie jar that carries the
// session cookie from sign-in into later requests. Without both, sign-in
// succeeds but the very next call (getSession, which the Data API needs to
// mint a JWT) looks unauthenticated. Patching the global here, before
// lib/neon.ts is imported (so the SDK's internal fetch wrapper captures this
// version), is scoped to this test process only — lib/neon.ts itself stays
// untouched, since the app runs in a real browser and never needs either of
// these. localhost:3000 must also be a trusted origin in the Neon Auth
// project for this to succeed.
const nodeFetch = globalThis.fetch;
let cookieJar = "";

globalThis.fetch = async (input, init = {}) => {
  const headers = new Headers(init.headers);
  if (!headers.has("Origin")) headers.set("Origin", "http://localhost:3000");
  if (cookieJar) headers.set("Cookie", cookieJar);

  const response = await nodeFetch(input, { ...init, headers });

  const setCookies = response.headers.getSetCookie();
  if (setCookies.length > 0) {
    cookieJar = setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  return response;
};

const { neon } = await import("../lib/neon.ts");

const hasCredentials = Boolean(
  process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD,
);

const skipReason = hasCredentials
  ? false
  : "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test.local to run this test — see .env.example for the variable names.";

before(async () => {
  if (!hasCredentials) return;

  let result;
  try {
    result = await neon.auth.signIn.email({
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD,
    });
  } catch (err) {
    result = { error: err };
  }

  if (result.error) {
    throw new Error(
      `Could not sign in as TEST_USER_EMAIL (${process.env.TEST_USER_EMAIL}). ` +
        `Check the credentials in .env.test.local. Underlying error: ${result.error.message}`,
    );
  }
});

test("insert rejects a whitespace-only name", { skip: skipReason }, async () => {
  const { data, error } = await neon
    .from("contacts")
    .insert({ name: "   ", priority: "medium" })
    .select()
    .single();

  if (data) {
    // Regression: the constraint didn't fire. Clean up before failing loudly.
    await neon.from("contacts").delete().eq("id", data.id);
  }

  assert.notEqual(error, null, "expected an error for a whitespace-only name");
  assert.match(
    error.message,
    /contacts_name_check/,
    `expected a contacts_name_check violation, got: ${error?.message}`,
  );
});

test("insert rejects an invalid priority value", { skip: skipReason }, async () => {
  const { data, error } = await neon
    .from("contacts")
    .insert({ name: "Test Contact", priority: "urgent" })
    .select()
    .single();

  if (data) {
    // Regression: the constraint didn't fire. Clean up before failing loudly.
    await neon.from("contacts").delete().eq("id", data.id);
  }

  assert.notEqual(error, null, "expected an error for an invalid priority");
  assert.match(
    error.message,
    /contacts_priority_check/,
    `expected a contacts_priority_check violation, got: ${error?.message}`,
  );
});
