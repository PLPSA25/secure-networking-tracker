"use client";

import { neon } from "@/lib/neon";
import { useSession } from "@/lib/use-session";
import { AuthForm } from "./auth-form";

export default function Home() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 p-8 dark:bg-black">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 bg-zinc-50 p-8 dark:bg-black">
      <p>
        Signed in as <span className="font-medium">{session.user.email}</span>
      </p>
      <button
        className="rounded bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-50 dark:text-zinc-900"
        onClick={() => neon.auth.signOut()}
      >
        Sign out
      </button>
      <p className="text-zinc-500 dark:text-zinc-400">
        Contacts go here (Stage 4).
      </p>
    </div>
  );
}
