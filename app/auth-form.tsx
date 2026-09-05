"use client";

import { useState } from "react";
import { neon } from "@/lib/neon";

const GENERIC_ERROR = "Something went wrong. Try again.";

// neon.auth.signIn.email / signUp.email are documented as returning
// { data, error }, but the installed beta SDK's fetch wrapper actually
// throws on non-OK responses instead (verified against the live auth
// endpoint). Handle both shapes the same way, and only ever surface the
// server's plain-language `message` field, never the raw error object.
function errorMessage(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return GENERIC_ERROR;
}

export function AuthForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const { error } =
        mode === "sign-up"
          ? await neon.auth.signUp.email({ email, password, name })
          : await neon.auth.signIn.email({ email, password });
      if (error) setError(errorMessage(error));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
      <h1 className="text-lg font-semibold">
        {mode === "sign-up" ? "Create an account" : "Sign in"}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "sign-up" && (
          <input
            className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-800"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-800"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-zinc-800"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Please wait…" : mode === "sign-up" ? "Sign up" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
        onClick={() => {
          setError(null);
          setMode(mode === "sign-up" ? "sign-in" : "sign-up");
        }}
      >
        {mode === "sign-up"
          ? "Already have an account? Sign in"
          : "Need an account? Sign up"}
      </button>
    </div>
  );
}
