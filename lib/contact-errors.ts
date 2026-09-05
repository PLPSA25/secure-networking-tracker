export const GENERIC_ERROR = "Something went wrong. Try again.";

// Postgres CHECK-violation messages embed the literal constraint name (see
// db/schema.sql). Matching on that name, not the SQLSTATE code, because both
// constraints share the same code (23514, check_violation).
const CONSTRAINT_MESSAGES: Record<string, string> = {
  contacts_name_check: "Name cannot be empty.",
  contacts_priority_check: "Priority must be high, medium, or low.",
};

// Accepts unknown on purpose: called both with a Data API error object and
// with whatever a .catch() hands back, which can be any thrown value.
export function translateContactError(error: unknown): string {
  if (!error) return "";
  const message =
    typeof error === "object" && "message" in error
      ? (error as { message: unknown }).message
      : undefined;
  if (typeof message !== "string") return GENERIC_ERROR;
  for (const [constraint, translated] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (message.includes(constraint)) return translated;
  }
  return GENERIC_ERROR;
}
