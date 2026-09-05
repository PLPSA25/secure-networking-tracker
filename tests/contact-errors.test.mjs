import { test } from "node:test";
import assert from "node:assert/strict";
import { translateContactError } from "../lib/contact-errors.ts";

test("translates a name-check violation", () => {
  const message = translateContactError({
    message:
      'new row for relation "contacts" violates check constraint "contacts_name_check"',
  });
  assert.equal(message, "Name cannot be empty.");
});

test("translates a priority-check violation", () => {
  const message = translateContactError({
    message:
      'new row for relation "contacts" violates check constraint "contacts_priority_check"',
  });
  assert.equal(message, "Priority must be high, medium, or low.");
});

test("falls back to a generic message for an unrecognized error", () => {
  const message = translateContactError({ message: "connection reset" });
  assert.equal(message, "Something went wrong. Try again.");
});

test("returns an empty string for no error", () => {
  assert.equal(translateContactError(null), "");
  assert.equal(translateContactError(undefined), "");
});
