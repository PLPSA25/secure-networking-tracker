const GENERIC_ERROR = "Something went wrong. Try again.";

// Postgres CHECK-violation messages embed the literal constraint name (see
// db/schema.sql). Matching on that name, not the SQLSTATE code, because both
// constraints share the same code (23514, check_violation).
const CONSTRAINT_MESSAGES: Record<string, string> = {
  contacts_name_check: "Name cannot be empty.",
  contacts_priority_check: "Priority must be high, medium, or low.",
};

export function translateContactError(
  error: { message: string } | null | undefined,
): string {
  if (!error) return "";
  for (const [constraint, message] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (error.message.includes(constraint)) return message;
  }
  return GENERIC_ERROR;
}
