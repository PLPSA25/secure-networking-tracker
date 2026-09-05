import { neon, type Database } from "./neon";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactInput = Database["public"]["Tables"]["contacts"]["Insert"];

export function listContacts() {
  return neon.from("contacts").select("*");
}

// user_id is never part of ContactInput — the column default fills it from
// the caller's JWT, and the INSERT policy verifies it.
export function createContact(input: ContactInput) {
  return neon.from("contacts").insert(input).select().single();
}

export function updateContact(id: number, input: ContactInput) {
  return neon
    .from("contacts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
}

export function deleteContact(id: number) {
  return neon.from("contacts").delete().eq("id", id);
}
