import { createClient } from "@neondatabase/neon-js";

type ContactRow = {
  id: number;
  user_id: string;
  name: string;
  company: string | null;
  role: string | null;
  where_met: string | null;
  notes: string | null;
  priority: "high" | "medium" | "low";
  created_at: string;
  updated_at: string;
};

// Mirrors db/schema.sql. There is no migration tool generating this from the
// live schema, so keep it in sync by hand.
export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: ContactRow;
        Insert: Omit<ContactRow, "id" | "user_id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ContactRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
};

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;
const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;

if (!authUrl || !dataApiUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_NEON_AUTH_URL or NEXT_PUBLIC_NEON_DATA_API_URL. Check .env.local.",
  );
}

export const neon = createClient<Database>({
  auth: { url: authUrl },
  dataApi: { url: dataApiUrl },
});
