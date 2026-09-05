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

test("falls back to a generic message when message isn't a string", () => {
  assert.equal(
    translateContactError({ message: undefined }),
    "Something went wrong. Try again.",
  );
  assert.equal(
    translateContactError({ code: "23514" }),
    "Something went wrong. Try again.",
  );
});

test("handles whatever a .catch() can hand back, not just Data API errors", () => {
  // Not every throw is an Error, or even an object.
  assert.equal(
    translateContactError("plain string throw"),
    "Something went wrong. Try again.",
  );
  // An Error has a string .message, so it reaches the constraint check and
  // falls through to generic there — different path, same safe result.
  assert.equal(
    translateContactError(new Error("network down")),
    "Something went wrong. Try again.",
  );
});
