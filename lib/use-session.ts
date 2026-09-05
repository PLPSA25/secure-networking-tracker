"use client";

import { useSyncExternalStore } from "react";
import { neon } from "./neon";

const sessionAtom = neon.auth.useSession;

// Mirrors the atom's own pre-fetch value (see session-atom.mjs) so the
// server-rendered markup matches the client's first paint.
const serverSnapshot: ReturnType<typeof sessionAtom.get> = {
  data: null,
  error: null,
  isPending: true,
  isRefetching: false,
  refetch: async () => {},
};

export function useSession() {
  return useSyncExternalStore(
    (onChange) => sessionAtom.subscribe(onChange),
    () => sessionAtom.get(),
    () => serverSnapshot,
  );
}
